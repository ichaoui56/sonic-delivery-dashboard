import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { MerchantDashboardContent } from "@/components/merchant/dashboard/merchant-dashboard-content"
import { Suspense } from "react"
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"

export const revalidate = 30

export default function DashboardPage() {
  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <MerchantDashboardContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}