import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)

    const url = new URL(request.url)
    const takeParam = url.searchParams.get("take")
    const take = takeParam ? Number.parseInt(takeParam, 10) : 100
    const limitedTake = Number.isFinite(take) ? Math.min(Math.max(take, 1), 100) : 100

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
      take: limitedTake,
    })

    return jsonOk({ orders })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
