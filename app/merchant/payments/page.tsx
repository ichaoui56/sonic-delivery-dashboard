import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { PaymentsContent } from "@/components/merchant/payment/payments-content"

export const revalidate = 10

export default async function MerchantPaymentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardLayoutWrapper userRole={session.user.role || "MERCHANT"}>
      <PaymentsContent />
    </DashboardLayoutWrapper>
  )
}
