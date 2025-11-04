import DashboardLayoutWrapper from "@/components/dashboard-layout-wrapper"
import { ClientsTable } from "@/components/clients-table"

export default function ClientsPage() {
  return (
    <DashboardLayoutWrapper>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">إدارة العملاء</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              عرض وإدارة بيانات العملاء والمبيعات
            </p>
          </div>
   
        </div>

        <ClientsTable />
      </div>
    </DashboardLayoutWrapper>
  )
}
