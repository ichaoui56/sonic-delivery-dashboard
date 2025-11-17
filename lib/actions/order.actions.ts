"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./auth-actions"

type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ASSIGNED_TO_DELIVERY"
  | "DELIVERED"
  | "REPORTED"
  | "REJECTED"
  | "CANCELLED"

function getCityCode(city: string): string {
  const cityMap: Record<string, string> = {
    "الداخلة": "DA",
    "Dakhla": "DA",
    "بوجدور": "BO",
    "Boujdour": "BO",
    "العيون": "LA",
    "Laayoune": "LA",
  }
  return cityMap[city] || "DA" // Default to DA if city not found
}

export async function createOrder(data: {
  customerName: string
  customerPhone: string
  address: string
  city: string
  note?: string
  paymentMethod: "COD" | "PREPAID"
  items: { productId: number; quantity: number; price: number }[]
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    // Calculate total price
    const totalPrice = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const cityCode = getCityCode(data.city)
    
    // Get the latest order for this specific city
    const latestOrder = await db.order.findFirst({
      where: {
        city: data.city,
      },
      orderBy: { id: "desc" },
      select: { orderCode: true },
    })

    let nextOrderNumber = 1
    if (latestOrder?.orderCode) {
      // Match pattern: OR-XX-NNNNNN where XX is city code
      const match = latestOrder.orderCode.match(/OR-[A-Z]{2}-(\d+)/)
      if (match) {
        nextOrderNumber = Number.parseInt(match[1]) + 1
      }
    }
    
    // Generate city-specific order code: OR-DA-000001, OR-BO-000001, OR-LA-000001
    const orderCode = `OR-${cityCode}-${nextOrderNumber.toString().padStart(6, "0")}`

    const merchantBaseFee = merchant.baseFee || 25
    const merchantEarning = totalPrice - merchantBaseFee

    console.log(
      `[v0] Order ${orderCode} - City: ${data.city} (${cityCode}) - Total: ${totalPrice}, Merchant Base Fee: ${merchantBaseFee}, Merchant Earning: ${merchantEarning}`,
    )

    // Validate stock availability
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return { success: false, message: `المنتج غير موجود` }
      }

      if (product.stockQuantity < item.quantity) {
        return { success: false, message: `المخزون غير كافٍ للمنتج: ${product.name}` }
      }
    }

    const order = await db.order.create({
      data: {
        orderCode,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        city: data.city,
        note: data.note,
        totalPrice,
        paymentMethod: data.paymentMethod,
        merchantEarning,
        merchantId: merchant.id,
        orderItems: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log("[v0] Order created successfully:", orderCode)
    revalidatePath("/merchant/orders")

    return { success: true, message: "تم إنشاء الطلب بنجاح", orderCode }
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    return { success: false, message: "فشل في إنشاء الطلب" }
  }
}

export async function updateOrderStatus(orderId: number, newStatus: OrderStatus) {
  try {
    console.log("[v0] ===== STARTING ORDER STATUS UPDATE =====")
    console.log("[v0] Order ID:", orderId)
    console.log("[v0] New Status:", newStatus)

    const user = await getCurrentUser()
    if (!user) {
      console.log("[v0] User not authenticated")
      return { success: false, message: "غير مصرح" }
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        merchant: {
          include: {
            user: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!order) {
      console.log("[v0] Order not found")
      return { success: false, message: "الطلب غير موجود" }
    }

    console.log("[v0] Current order status:", order.status)
    const previousStatus = order.status

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        deliveredAt: newStatus === "DELIVERED" ? new Date() : undefined,
      },
    })

    console.log(`[v0] Order ${order.orderCode} status updated from ${previousStatus} to ${newStatus}`)

    if (newStatus === "REPORTED") {
      console.log("[v0] ===== PROCESSING REPORTED ORDER =====")

      // Get the delivery man
      if (order.deliveryManId) {
        // Count existing attempts
        const existingAttempts = await db.deliveryAttempt.count({
          where: { orderId },
        })

        await db.deliveryAttempt.create({
          data: {
            orderId,
            attemptNumber: existingAttempts + 1,
            deliveryManId: order.deliveryManId,
            status: "FAILED",
            reason: "تم الإبلاغ عن مشكلة في التوصيل",
            notes: `محاولة توصيل فاشلة - ${new Date().toLocaleString("ar-EG")}`,
          },
        })

        console.log("[v0] Delivery attempt logged for reported order")
      }
    }

    if ((newStatus === "REJECTED" || newStatus === "CANCELLED") && order.deliveryManId) {
      const existingAttempts = await db.deliveryAttempt.count({
        where: { orderId },
      })

      await db.deliveryAttempt.create({
        data: {
          orderId,
          attemptNumber: existingAttempts + 1,
          deliveryManId: order.deliveryManId,
          status: newStatus === "REJECTED" ? "REFUSED" : "OTHER",
          reason: newStatus === "REJECTED" ? "رفض العميل استلام الطلب" : "تم إلغاء الطلب",
        },
      })
    }

    if (newStatus === "DELIVERED" && previousStatus !== "DELIVERED") {
      console.log("[v0] ===== PROCESSING DELIVERED ORDER =====")

      // Deduct stock
      for (const item of order.orderItems) {
        const currentProduct = await db.product.findUnique({
          where: { id: item.productId },
        })

        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stockQuantity - item.quantity)

          await db.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: newStock,
            },
          })

          console.log(
            `[v0] Product ${currentProduct.name}: Stock reduced from ${currentProduct.stockQuantity} to ${newStock}`,
          )
        }
      }

      const merchantBaseFee = order.merchant.baseFee || 25
      const deliveryManBaseFee = order.deliveryMan?.baseFee || 15

      const merchantEarning = order.totalPrice - merchantBaseFee

      console.log(`[v0] Payment Breakdown:`)
      console.log(`[v0] - Order Total: ${order.totalPrice} MAD`)
      console.log(`[v0] - Merchant Base Fee: ${merchantBaseFee} MAD`)
      console.log(`[v0] - Merchant Earning: ${merchantEarning} MAD`)
      console.log(`[v0] - Delivery Man Fee (paid by company): ${deliveryManBaseFee} MAD`)
      console.log(`[v0] - Company Net: ${merchantBaseFee - deliveryManBaseFee} MAD`)

      if (order.paymentMethod === "COD") {
        await db.merchant.update({
          where: { id: order.merchant.id },
          data: {
            balance: {
              increment: merchantEarning,
            },
            totalEarned: {
              increment: order.totalPrice,
            },
          },
        })

        console.log(`[v0] COD Order: Merchant balance increased by ${merchantEarning} MAD`)
        console.log(`[v0] Company receives ${merchantBaseFee} MAD and pays ${deliveryManBaseFee} MAD to delivery`)
      } else {
        await db.merchant.update({
          where: { id: order.merchant.id },
          data: {
            balance: {
              decrement: merchantBaseFee,
            },
            totalEarned: {
              increment: order.totalPrice,
            },
          },
        })

        console.log(`[v0] PREPAID Order: Merchant balance decreased by ${merchantBaseFee} MAD`)
        console.log(`[v0] Company receives ${merchantBaseFee} MAD and pays ${deliveryManBaseFee} MAD to delivery`)
      }

      if (order.deliveryManId && order.deliveryMan) {
        await db.deliveryMan.update({
          where: { id: order.deliveryManId },
          data: {
            totalDeliveries: {
              increment: 1,
            },
            successfulDeliveries: {
              increment: 1,
            },
            totalEarned: {
              increment: deliveryManBaseFee,
            },
          },
        })
        console.log(`[v0] Delivery man earned: ${deliveryManBaseFee} MAD`)
      }

      console.log("[v0] ===== PROCESSING COMPLETED =====")
    }

    revalidatePath("/merchant/orders")
    revalidatePath("/delivery/orders")
    revalidatePath("/merchant/inventory")

    return {
      success: true,
      message:
        newStatus === "DELIVERED"
          ? "تم تسليم الطلب وتحديث المخزون والأرباح"
          : newStatus === "REPORTED"
            ? "تم الإبلاغ عن المشكلة بنجاح"
            : "تم تحديث حالة الطلب",
    }
  } catch (error) {
    console.error("[v0] Error updating order status:", error)
    return { success: false, message: "فشل في تحديث حالة الطلب" }
  }
}

export async function getMerchantOrders() {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
    })

    if (!merchant) return []

    const orders = await db.order.findMany({
      where: { merchantId: merchant.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return orders
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return []
  }
}

export async function getMerchantProducts() {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
    })

    if (!merchant) return []

    const products = await db.product.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
        stockQuantity: {
          gt: 0,
        },
      },
      orderBy: { name: "asc" },
    })

    return products
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return []
  }
}

export async function getDeliveryManOrders() {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const deliveryMan = await db.deliveryMan.findUnique({
      where: { userId: user.id },
    })

    // If no delivery man profile exists, show all pending/ready orders for testing
    if (!deliveryMan) {
      console.log("[v0] No delivery man profile found, showing all available orders for testing")
      const orders = await db.order.findMany({
        where: {
          status: {
            in: ["PENDING", "ASSIGNED_TO_DELIVERY"],
          },
          deliveryManId: null,
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          merchant: {
            include: {
              user: true,
            },
          },
          deliveryMan: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return orders
    }

    const orders = await db.order.findMany({
      where: {
        OR: [
          { deliveryManId: deliveryMan.id },
          {
            status: {
              in: ["PENDING", "ASSIGNED_TO_DELIVERY"],
            },
            deliveryManId: null,
          },
        ],
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        merchant: {
          include: {
            user: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    console.log(`[v0] Found ${orders.length} orders for delivery man`)
    return orders
  } catch (error) {
    console.error("[v0] Error fetching delivery orders:", error)
    return []
  }
}

export async function acceptOrder(orderId: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const deliveryMan = await db.deliveryMan.findUnique({
      where: { userId: user.id },
    })

    if (!deliveryMan) {
      return { success: false, message: "عامل التوصيل غير موجود" }
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        deliveryManId: deliveryMan.id,
        status: "ASSIGNED_TO_DELIVERY",
      },
    })

    revalidatePath("/delivery/orders")

    return { success: true, message: "تم قبول الطلب بنجاح" }
  } catch (error) {
    console.error("[v0] Error accepting order:", error)
    return { success: false, message: "فشل في قبول الطلب" }
  }
}

export async function rejectOrder(orderId: number, reason: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const deliveryMan = await db.deliveryMan.findUnique({
      where: { userId: user.id },
    })

    if (!deliveryMan) {
      return { success: false, message: "عامل التوصيل غير موجود" }
    }

    await db.deliveryAttempt.create({
      data: {
        orderId,
        attemptNumber: 1,
        deliveryManId: deliveryMan.id,
        status: "REFUSED",
        reason: reason,
        notes: `تم رفض الطلب من قبل عامل التوصيل: ${reason}`,
      },
    })

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED",
        note: `تم رفض الطلب: ${reason}`,
      },
    })

    revalidatePath("/delivery/orders")

    return { success: true, message: "تم رفض الطلب" }
  } catch (error) {
    console.error("[v0] Error rejecting order:", error)
    return { success: false, message: "فشل في رفض الطلب" }
  }
}
