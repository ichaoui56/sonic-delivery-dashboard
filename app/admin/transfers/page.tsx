import { AdminTransfersTable } from "@/components/admin-transfers-table"
import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"

export const revalidate = 10

export default function AdminTransfersPage() {

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة شحنات التجار</h1>
          <p className="text-gray-500 mt-1">إدارة وتحديث حالة شحنات جميع التجار</p>
        </div>

        <AdminTransfersTable />
      </div>
    </DashboardLayoutWrapper>
  )
}