import { AttendanceMarking } from "@/components/attendance-marking"
import { Button } from "@/components/ui/button"
import DashboardLayoutWrapper from "@/components/dashboard-layout-wrapper"

export default function AttendancePage() {
  return (
    <DashboardLayoutWrapper>
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-balance">الحضور والغياب</h1>
            <p className="text-muted-foreground mt-0.5 md:mt-1 text-sm md:text-base">تسجيل ومتابعة حضور العمال</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-sm md:text-base px-3 md:px-4 py-4 md:py-5 w-full sm:w-auto">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            تصدير التقرير
          </Button>
        </div>

        <AttendanceMarking />
      </div>
    </DashboardLayoutWrapper>
  )
}
