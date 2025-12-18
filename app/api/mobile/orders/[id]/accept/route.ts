import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    if (!Number.isFinite(orderId)) return jsonError("Invalid id", 400)

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return jsonError("Not found", 404)

    if (deliveryMan.city && order.city !== deliveryMan.city) {
      return jsonError("Forbidden", 403)
    }

    if (!["PENDING", "ACCEPTED"].includes(order.status)) {
      return jsonError("Invalid order status", 409)
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryManId: deliveryMan.id,
        status: "ASSIGNED_TO_DELIVERY",
      },
    })

    return jsonOk({ order: updated })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
