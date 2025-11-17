import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { PaymentsContent } from "@/components/merchant/payment/payments-content"

export const revalidate = 10

export default async function MerchantPaymentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardLayout userRole={session.user.role || "MERCHANT"}>
      <PaymentsContent />
    </DashboardLayout>
  )
}
