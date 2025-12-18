import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

type StatusBody = {
  status: "ACCEPTED" | "DELIVERED" | "REPORTED"
  notes?: string
  reason?: string
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    if (!Number.isFinite(orderId)) return jsonError("Invalid id", 400)

    const body = (await request.json().catch(() => null)) as StatusBody | null
    if (!body?.status) return jsonError("Missing status", 400)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: { productId: true, quantity: true, isFree: true },
        },
      },
    })

    if (!order) return jsonError("Not found", 404)

    const sameCity = (deliveryMan.city || null) === order.city
    const assignedToMe = order.deliveryManId === deliveryMan.id

    if (!sameCity && !assignedToMe) {
      return jsonError("Forbidden", 403)
    }

    const now = new Date()

    const lastAttempt = await prisma.deliveryAttempt.findFirst({
      where: { orderId },
      orderBy: { attemptNumber: "desc" },
      select: { attemptNumber: true },
    })
    const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1

    if (body.status === "ACCEPTED") {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "ACCEPTED" },
      })
      await prisma.deliveryAttempt.create({
        data: {
          orderId,
          attemptNumber,
          deliveryManId: deliveryMan.id,
          status: "ATTEMPTED",
          notes: body.notes || null,
          reason: body.reason || null,
          attemptedAt: now,
        },
      })
      return jsonOk({ order: updated })
    }

    if (body.status === "REPORTED") {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "REPORTED" },
      })
      await prisma.deliveryAttempt.create({
        data: {
          orderId,
          attemptNumber,
          deliveryManId: deliveryMan.id,
          status: "OTHER",
          notes: body.notes || null,
          reason: body.reason || null,
          attemptedAt: now,
        },
      })
      return jsonOk({ order: updated })
    }

    if (body.status === "DELIVERED") {
      // Ensure this delivery is processed once
      const updated = await prisma.order.updateMany({
        where: { id: orderId, status: { not: "DELIVERED" } },
        data: { status: "DELIVERED", deliveredAt: now },
      })

      if (updated.count === 0) {
        const current = await prisma.order.findUnique({ where: { id: orderId } })
        return jsonOk({ order: current })
      }

      await prisma.deliveryAttempt.create({
        data: {
          orderId,
          attemptNumber,
          deliveryManId: deliveryMan.id,
          status: "SUCCESSFUL",
          notes: body.notes || null,
          reason: body.reason || null,
          attemptedAt: now,
        },
      })

      // Update delivery man stats
      await prisma.deliveryMan.update({
        where: { id: deliveryMan.id },
        data: {
          totalDeliveries: { increment: 1 },
          successfulDeliveries: { increment: 1 },
          totalEarned: { increment: deliveryMan.baseFee || 0 },
        },
      })

      const full = await prisma.order.findUnique({ where: { id: orderId } })
      return jsonOk({ order: full })
    }

    return jsonError("Unsupported status", 400)
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
