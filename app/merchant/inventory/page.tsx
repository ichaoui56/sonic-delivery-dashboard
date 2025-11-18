import { DashboardLayout } from "@/components/dashboard-layout"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { InventoryContent } from "@/components/merchant/inventory/inventory-content"
import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"

export const revalidate = 10

export default async function InventoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "MERCHANT" ) {
    redirect("/dashboard")
  }

  return (
    <DashboardLayoutWrapper userRole={session.user.role}>
      <InventoryContent />
    </DashboardLayoutWrapper>
  )
}
