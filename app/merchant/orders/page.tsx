import { DashboardLayout } from "@/components/dashboard-layout"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { OrdersContent } from "@/components/merchant/orders/orders-content"

export const revalidate = 10

export default async function OrdersPage() {
  const user = await getCurrentUser()

  return (
    <DashboardLayout userRole={user?.role || "MERCHANT"}>
      <OrdersContent />
    </DashboardLayout>
  )
}
