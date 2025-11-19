import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { getOrderDetails } from "@/lib/actions/admin/order"
import { OrderDetailClient } from "@/components/admin/orders/order-detail-client"
import { notFound } from 'next/navigation'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const orderId = parseInt(params.id)
  if (isNaN(orderId)) {
    notFound()
  }

  const result = await getOrderDetails(orderId)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <OrderDetailClient order={result.data} />
    </DashboardLayoutWrapper>
  )
}
