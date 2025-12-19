import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    if (!Number.isFinite(orderId)) return jsonError("Not found", 404)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, sku: true },
            },
          },
        },
      },
    })

    if (!order) return jsonError("Not found", 404)

    const sameCity = (deliveryMan.city || null) === order.city
    const assignedToMe = order.deliveryManId === deliveryMan.id

    if (!sameCity && !assignedToMe) {
      return jsonError("Forbidden", 403)
    }

    return jsonOk({ order })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
