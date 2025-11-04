import { StatsCards } from "@/components/stats-cards"
import { QuickActions } from "@/components/quick-actions"
import { WorkersBalance } from "@/components/workers-balance"
import DashboardLayoutWrapper from "@/components/dashboard-layout-wrapper"

export default function DashboardPage() {
  return (
    <DashboardLayoutWrapper>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-balance">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">خطط، رتب، وأنجز مهامك بسهولة</p>
        </div>

        <StatsCards />

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <QuickActions />
          <WorkersBalance />
        </div>
      </div>
    </DashboardLayoutWrapper>
  )
}