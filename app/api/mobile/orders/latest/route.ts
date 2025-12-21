import { prisma } from "@/lib/db"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"
import { jsonError, jsonOk } from "@/lib/mobile/http"

export async function GET(request: Request) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)

    const orders = await prisma.order.findMany({
      where: {
        city: deliveryMan.city || undefined,
        // Only show orders that have been ACCEPTED by admin (exclude PENDING)
        // Explicitly list all statuses except PENDING
        status: {
          in: ["ACCEPTED", "ASSIGNED_TO_DELIVERY", "DELIVERED", "REPORTED", "REJECTED", "CANCELLED"],
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                sku: true,
              },
            },
          },
        },
        merchant: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        deliveryMan: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    return jsonOk({ orders })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
