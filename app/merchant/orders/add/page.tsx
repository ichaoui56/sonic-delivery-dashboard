import { DashboardLayout } from "@/components/dashboard-layout"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { CreateOrderContent } from "@/components/merchant/orders/add/create-order-content"

export default async function CreateOrderPage() {
  const user = await getCurrentUser()

  return (
    <DashboardLayout userRole={user?.role || "MERCHANT"}>
      <CreateOrderContent />
    </DashboardLayout>
  )
}
