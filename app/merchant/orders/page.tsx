import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { OrdersContent } from "@/components/merchant/orders/orders-content"

export const revalidate = 10

export default async function OrdersPage() {
  const user = await getCurrentUser()

  return (
    <DashboardLayoutWrapper userRole={user?.role || "MERCHANT"}>
      <OrdersContent />
    </DashboardLayoutWrapper>
  )
}
