import { DashboardLayout } from "@/components/dashboard-layout"
import { getMerchantOrders } from "@/lib/actions/order.actions"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { OrdersTable } from "@/components/orders-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const revalidate = 10

export default async function OrdersPage() {
  const user = await getCurrentUser()
  const orders = await getMerchantOrders()

  return (
    <DashboardLayout userRole={user?.role || "MERCHANT"}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">إنشاء وتتبع طلبات العملاء</p>
          </div>
          <Link href="/merchant/orders/create">
            <Button className="bg-[#048dba] hover:bg-[#037ba0] text-white min-h-[44px] w-full sm:w-auto">
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إنشاء طلب جديد
            </Button>
          </Link>
        </div>

        <OrdersTable orders={orders} />
      </div>
    </DashboardLayout>
  )
}
