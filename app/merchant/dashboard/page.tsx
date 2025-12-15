import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { MerchantDashboardContent } from "@/components/merchant/dashboard/merchant-dashboard-content"
import { Suspense } from "react"
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"

// Increase revalidation time
export const revalidate = 60 // Cache for 60 seconds instead of 30

export default function DashboardPage() {
  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <MerchantDashboardContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}