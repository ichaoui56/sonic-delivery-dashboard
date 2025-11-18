import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { AdminOrdersContent } from "@/components/admin/orders/admin-orders-content"
import { Suspense } from "react"
import AdminOrdersLoading from "./loading"

export const revalidate = 30

export default async function AdminOrdersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN">
      <Suspense fallback={<AdminOrdersLoading />}>
        <AdminOrdersContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
