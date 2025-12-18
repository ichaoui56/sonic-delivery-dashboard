import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    if (!Number.isFinite(orderId)) return jsonError("Invalid id", 400)

    const body = (await request.json().catch(() => null)) as { reason?: string; notes?: string } | null
    const reason = body?.reason || body?.notes || ""

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return jsonError("Not found", 404)

    if (deliveryMan.city && order.city !== deliveryMan.city) {
      return jsonError("Forbidden", 403)
    }

    const lastAttempt = await prisma.deliveryAttempt.findFirst({
      where: { orderId },
      orderBy: { attemptNumber: "desc" },
      select: { attemptNumber: true },
    })

    const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1

    await prisma.$transaction([
      prisma.deliveryAttempt.create({
        data: {
          orderId,
          attemptNumber,
          deliveryManId: deliveryMan.id,
          status: "REFUSED",
          reason: reason || null,
          notes: reason || null,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "REJECTED",
          deliveryManId: null,
        },
      }),
    ])

    return jsonOk({ success: true })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
