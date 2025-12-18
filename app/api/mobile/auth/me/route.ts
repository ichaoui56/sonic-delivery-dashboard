import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request) {
  try {
    const ctx = await requireDeliveryManAuth(request)
    return jsonOk({ user: { ...ctx.user, deliveryMan: ctx.deliveryMan } })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}
