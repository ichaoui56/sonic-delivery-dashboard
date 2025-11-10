import { getDeliveryManOrders } from "@/lib/actions/order.actions"
import { DeliveryOrdersTable } from "@/components/delivery-orders-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const revalidate = 10

export default async function DeliveryOrdersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  const orders = await getDeliveryManOrders()

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">طلبات التوصيل</h1>
        <p className="text-gray-600">إدارة ومتابعة طلبات التوصيل المخصصة لك</p>
      </div>

      <DeliveryOrdersTable orders={orders} />
    </div>
  )
}
