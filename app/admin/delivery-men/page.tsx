import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { DeliveryMenContent } from "@/components/admin/delivery-man/delivery-men-content"
import { Suspense } from "react"
import DeliveryMenLoading from "./loading"

export const revalidate = 30

export default async function DeliveryMenPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN">
      <Suspense fallback={<DeliveryMenLoading />}>
        <DeliveryMenContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
