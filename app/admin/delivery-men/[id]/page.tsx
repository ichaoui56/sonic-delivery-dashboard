import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { DeliveryManDetailContent } from "@/components/admin/delivery-man/deliveryman-detail-content"

export const revalidate = 0

export default function DeliveryManDetailPage({ params }: { params: { id: string } }) {

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <DeliveryManDetailContent deliveryManId={parseInt(params.id)} />
    </DashboardLayoutWrapper>
  )
}
