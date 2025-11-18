import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { AdminDashboardContent } from "@/components/admin/dashboard/admin-dashboard-content"
import { Suspense } from "react"
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"

export const revalidate = 30

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN">
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <AdminDashboardContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
