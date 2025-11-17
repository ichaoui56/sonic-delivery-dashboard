import { DashboardLayout } from "@/components/dashboard-layout"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { InventoryContent } from "@/components/merchant/inventory/inventory-content"

export const revalidate = 10

export default async function InventoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "MERCHANT") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <InventoryContent />
    </DashboardLayout>
  )
}
