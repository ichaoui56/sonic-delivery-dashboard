import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { MerchantDetailContent } from "../../../../components/admin/merchant/merchant-detail-content"
import { Suspense } from "react"
import { Card } from "@/components/ui/card"

export const revalidate = 0

export default function MerchantDetailPage({ params }: { params: { id: string } }) {

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <Suspense fallback={<div className="p-8"><Card className="p-8 animate-pulse h-96" /></div>}>
        <MerchantDetailContent merchantId={params.id} />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
