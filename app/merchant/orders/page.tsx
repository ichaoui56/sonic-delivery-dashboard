import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { OrdersContent } from "@/components/merchant/orders/orders-content"

export const revalidate = 10

export default function OrdersPage() {

  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <OrdersContent />
    </DashboardLayoutWrapper>
  )
}
