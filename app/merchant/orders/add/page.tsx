import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { CreateOrderContent } from "@/components/merchant/orders/add/create-order-content"

export default async function CreateOrderPage() {
  const user = await getCurrentUser()

  return (
    <DashboardLayoutWrapper userRole={user?.role || "MERCHANT"}>
      <CreateOrderContent />
    </DashboardLayoutWrapper>
  )
}
