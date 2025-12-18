import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)

    const orders = await prisma.order.findMany({
      where: {
        city: deliveryMan.city || undefined,
        status: { in: ["PENDING", "ACCEPTED", "ASSIGNED_TO_DELIVERY"] },
      },
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        customerPhone: true,
        address: true,
        city: true,
        note: true,
        totalPrice: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        deliveryManId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return jsonOk({ orders })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
