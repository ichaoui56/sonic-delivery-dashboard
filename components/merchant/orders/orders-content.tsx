import { getMerchantOrders, getMerchantProducts } from "@/lib/actions/order.actions"
import { OrdersClient } from "./orders-client"

export async function OrdersContent() {
  const orders = await getMerchantOrders()
  const products = await getMerchantProducts()
  const hasProducts = products.length > 0

  return <OrdersClient initialOrders={orders} hasProducts={hasProducts} />
}
