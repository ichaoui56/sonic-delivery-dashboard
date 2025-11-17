import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { MerchantDashboardContent } from "@/components/merchant/dashboard/merchant-dashboard-content"
import { Suspense } from "react"
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"

export const revalidate = 30

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Role-based dashboard rendering
  const userRole = session.user.role || "MERCHANT"

  return (
    <DashboardLayout userRole={userRole}>
      <Suspense fallback={<DashboardStatsSkeleton />}>
        {userRole === "MERCHANT" && <MerchantDashboardContent />}
        {userRole === "ADMIN" && <div>Admin Dashboard Coming Soon</div>}
        {userRole === "DELIVERYMAN" && <div>Delivery Dashboard Coming Soon</div>}
      </Suspense>
    </DashboardLayout>
  )
}
