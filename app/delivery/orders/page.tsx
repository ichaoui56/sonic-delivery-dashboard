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
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">طلبات التوصيل</h1>
              <p className="text-gray-600">إدارة ومتابعة طلبات التوصيل المخصصة لك</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>طلبات مدينتك فقط</span>
            </div>
          </div>
        </div>

        <DeliveryOrdersTable orders={orders} />
      </div>
    </div>
  )
}