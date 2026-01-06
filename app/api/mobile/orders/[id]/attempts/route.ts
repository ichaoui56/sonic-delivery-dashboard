import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return jsonError("Invalid order ID", 400)
    }
    
    // Verify the order belongs to this delivery man
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        deliveryManId: deliveryMan.id,
      }
    })
    
    if (!order) {
      return jsonError("Order not found or not authorized", 404)
    }
    
    // Fetch all delivery attempts for this order
    const deliveryAttempts = await prisma.deliveryAttempt.findMany({
      where: {
        orderId: orderId,
      },
      orderBy: {
        attemptNumber: 'desc'
      },
      include: {
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    })
    
    // Format the response
    const formattedAttempts = deliveryAttempts.map(attempt => ({
      id: attempt.id,
      orderId: attempt.orderId,
      attemptNumber: attempt.attemptNumber,
      deliveryManId: attempt.deliveryManId,
      attemptedAt: attempt.attemptedAt.toISOString(),
      status: attempt.status,
      reason: attempt.reason,
      notes: attempt.notes,
      location: attempt.location,
      deliveryMan: attempt.deliveryMan ? {
        id: attempt.deliveryMan.id,
        name: attempt.deliveryMan.user.name,
        phone: attempt.deliveryMan.user.phone,
      } : null
    }))
    
    return jsonOk({ 
      attempts: formattedAttempts,
      count: formattedAttempts.length 
    })
  } catch (error) {
    console.error("Error fetching delivery attempts:", error)
    return jsonError("Failed to fetch delivery attempts", 500)
  }
}

// In your existing order status update endpoint
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return jsonError("Invalid order ID", 400)
    }
    
    const body = await request.json()
    const { status, reason, notes, location } = body
    
    // Validate status
    const validStatuses = ["DELAYED", "REJECTED", "CANCELLED", "DELIVERED"]
    if (!validStatuses.includes(status)) {
      return jsonError("Invalid status", 400)
    }
    
    // Check if order exists and belongs to delivery man
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        deliveryManId: deliveryMan.id,
      },
      include: {
        deliveryAttemptHistory: {
          orderBy: { attemptNumber: "desc" },
          take: 1,
        }
      }
    })
    
    if (!order) {
      return jsonError("Order not found or not authorized", 404)
    }
    
    // Calculate next attempt number
    const lastAttempt = order.deliveryAttemptHistory[0]
    const nextAttemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1
    
    // Map the frontend status to attempt status
    let attemptStatus: "ATTEMPTED" | "FAILED" | "SUCCESSFUL" | "CUSTOMER_NOT_AVAILABLE" | "WRONG_ADDRESS" | "REFUSED" | "OTHER"
    
    switch (status) {
      case "DELIVERED":
        attemptStatus = "SUCCESSFUL"
        break
      case "DELAYED":
        // Map common reasons to specific attempt statuses
        if (reason?.includes("not available") || reason?.includes("not answering")) {
          attemptStatus = "CUSTOMER_NOT_AVAILABLE"
        } else if (reason?.includes("address") || reason?.includes("Address")) {
          attemptStatus = "WRONG_ADDRESS"
        } else if (reason?.includes("Refused") || reason?.includes("refused")) {
          attemptStatus = "REFUSED"
        } else {
          attemptStatus = "OTHER"
        }
        break
      case "REJECTED":
      case "CANCELLED":
        attemptStatus = "FAILED"
        break
      default:
        attemptStatus = "OTHER"
    }
    
    // Start a transaction to update order and create attempt
    const result = await prisma.$transaction(async (tx) => {
      // Update the order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: status,
          deliveredAt: status === "DELIVERED" ? new Date() : null,
          updatedAt: new Date(),
        }
      })
      
      // Create delivery attempt record
      const deliveryAttempt = await tx.deliveryAttempt.create({
        data: {
          orderId: orderId,
          attemptNumber: nextAttemptNumber,
          deliveryManId: deliveryMan.id,
          status: attemptStatus,
          reason: reason || null,
          notes: notes || null,
          location: location || null,
          attemptedAt: new Date(),
        }
      })
      
      return { updatedOrder, deliveryAttempt }
    })
    
    return jsonOk({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: result.updatedOrder.id,
        orderCode: result.updatedOrder.orderCode,
        status: result.updatedOrder.status,
        attemptNumber: result.deliveryAttempt.attemptNumber,
      }
    })
    
  } catch (error) {
    console.error("Error updating order status:", error)
    return jsonError("Failed to update order status", 500)
  }
}
