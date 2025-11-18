import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { MerchantsContent } from "@/components/admin/merchant/merchants-content"
import { Suspense } from "react"
import MerchantsLoading from "./loading"

export const revalidate = 30

export default async function MerchantsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN">
      <Suspense fallback={<MerchantsLoading />}>
        <MerchantsContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
