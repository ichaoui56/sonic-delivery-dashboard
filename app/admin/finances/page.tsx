import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { FinancesContent } from "@/components/admin/finances/finances-content"
import { Suspense } from "react"
import FinancesLoading from "./loading"

export const revalidate = 30

export default async function FinancesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN">
      <Suspense fallback={<FinancesLoading />}>
        <FinancesContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
