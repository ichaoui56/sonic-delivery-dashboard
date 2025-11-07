import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminTransfersTable } from "@/components/admin-transfers-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const revalidate = 10

export default async function AdminTransfersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة شحنات التجار</h1>
          <p className="text-gray-500 mt-1">إدارة وتحديث حالة شحنات جميع التجار</p>
        </div>

        <AdminTransfersTable />
      </div>
    </DashboardLayout>
  )
}