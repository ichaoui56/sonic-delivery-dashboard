"use client"

import { useState, useEffect } from "react"
// Remove DashboardLayoutWrapper import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ChevronLeft, ChevronRight, Search, Users } from "lucide-react"
import { getWeeklySummary, getAttendanceHistory } from "@/lib/actions/attendence.actions"
import { calculateDailyRate, calculatePayment } from "@/lib/utils/attendance"
import {
  getWeekDates,
  getWeekNumber,
  formatDateForDisplay,
  formatGregorianDate,
  getArabicMonth,
  toLatinNumbers,
  dayNames
} from "@/lib/utils"
import { WorkType, AttendanceType } from "@prisma/client"

interface WeeklyAttendanceData {
  weekNumber: string
  year: number
  workType?: WorkType
  workers: {
    workerId: string
    workerName: string
    weeklyPayment: number
    workType: WorkType
    attendance: {
      monday: AttendanceType | null
      tuesday: AttendanceType | null
      wednesday: AttendanceType | null
      thursday: AttendanceType | null
      friday: AttendanceType | null
      saturday: AttendanceType | null
    }
    payments: {
      monday: number
      tuesday: number
      wednesday: number
      thursday: number
      friday: number
      saturday: number
      weeklyTotal: number
    }
    amountToPay: number
  }[]
  totalAmount: number
}

export default function AttendanceHistoryPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyAttendanceData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWorkType, setSelectedWorkType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [availableWorkTypes, setAvailableWorkTypes] = useState<WorkType[]>([WorkType.LAFSOW_MAHDI, WorkType.ALFASALA])

  useEffect(() => {
    loadAllWeeksData()
  }, [selectedWorkType, selectedYear, selectedMonth])

  const loadAllWeeksData = async () => {
    setLoading(true)
    try {
      const workType = selectedWorkType !== 'all' ? selectedWorkType as WorkType : undefined

      const result = await getAttendanceHistory({
        workType,
        startDate: selectedMonth !== 'all' ? new Date(selectedYear, parseInt(selectedMonth) - 1, 1) : undefined,
        endDate: selectedMonth !== 'all' ? new Date(selectedYear, parseInt(selectedMonth), 0) : undefined,
      })

      if (result.success && result.attendance) {
        const weeklyMap = new Map<string, WeeklyAttendanceData>()

        result.attendance.forEach((record: any) => {
          const weekKey = `${record.weekNumber}-${record.year}`

          if (!weeklyMap.has(weekKey)) {
            weeklyMap.set(weekKey, {
              weekNumber: record.weekNumber,
              year: record.year,
              workType,
              workers: [],
              totalAmount: 0
            })
          }
        })

        const weeksData: WeeklyAttendanceData[] = []
        for (const [_, weekInfo] of weeklyMap) {
          const weeklyResult = await getWeeklySummary(weekInfo.weekNumber, weekInfo.year, workType)
          if (weeklyResult.success && weeklyResult.summary) {
            weeksData.push(weeklyResult.summary)
          }
        }

        weeksData.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          return parseInt(b.weekNumber.replace('W', '')) - parseInt(a.weekNumber.replace('W', ''))
        })

        setWeeklyData(weeksData)

        // Update available work types based on actual data
        const workTypesInData = new Set<WorkType>()
        weeksData.forEach(week => {
          week.workers.forEach(worker => {
            workTypesInData.add(worker.workType)
          })
        })

        const availableTypes = Array.from(workTypesInData)
        setAvailableWorkTypes(availableTypes.length > 0 ? availableTypes : [WorkType.LAFSOW_MAHDI, WorkType.ALFASALA])

      } else {
        setWeeklyData([])
        setAvailableWorkTypes([WorkType.LAFSOW_MAHDI, WorkType.ALFASALA])
      }
    } catch (error) {
      console.error("Error loading weekly data:", error)
      setWeeklyData([])
      setAvailableWorkTypes([WorkType.LAFSOW_MAHDI, WorkType.ALFASALA])
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceBadge = (type: AttendanceType | null) => {
    if (type === null || type === undefined) {
      return (
        <span className="text-muted-foreground text-xs whitespace-nowrap">لم يسجل</span>
      )
    }

    switch (type) {
      case "FULL_DAY":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs whitespace-nowrap">يوم كامل</Badge>
        )
      case "HALF_DAY":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs whitespace-nowrap">نصف يوم</Badge>
        )
      case "DAY_AND_NIGHT":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs whitespace-nowrap">يوم ونصف</Badge>
      case "ABSENCE":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs whitespace-nowrap">غائب</Badge>
      default:
        return (
          <span className="text-muted-foreground text-xs whitespace-nowrap">لم يسجل</span>
        )
    }
  }

  const getWeekRangeText = (weekNumber: string, year: number) => {
    const weekDates = getWeekDates(weekNumber, year)
    // Reverse the week dates for display
    const reversedWeekDates = [...weekDates].reverse()
    const saturday = reversedWeekDates[0]
    const monday = reversedWeekDates[5]
    return `السبت، ${formatDateForDisplay(saturday)} - الاثنين، ${formatDateForDisplay(monday)}`
  }

  const getWorkTypeLabel = (workType: WorkType) => {
    switch (workType) {
      case WorkType.LAFSOW_MAHDI:
        return "لافصو مهدي"
      case WorkType.ALFASALA:
        return "الفصالة"
      default:
        return workType
    }
  }

  // Filter workers based on search query
  const filteredWeeklyData = weeklyData.map(weekData => ({
    ...weekData,
    workers: weekData.workers.filter(worker =>
      worker.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.workerId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(weekData => weekData.workers.length > 0)

  // Generate year options (current year and previous 2 years)
  const yearOptions = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

  // Generate month options
  const monthOptions = [
    { value: "all", label: "جميع الأشهر" },
    { value: "1", label: "يناير" },
    { value: "2", label: "فبراير" },
    { value: "3", label: "مارس" },
    { value: "4", label: "أبريل" },
    { value: "5", label: "مايو" },
    { value: "6", label: "يونيو" },
    { value: "7", label: "يوليو" },
    { value: "8", label: "أغسطس" },
    { value: "9", label: "سبتمبر" },
    { value: "10", label: "أكتوبر" },
    { value: "11", label: "نوفمبر" },
    { value: "12", label: "ديسمبر" },
  ]

  // Get work types that actually have data in the current filtered results
  const workTypesWithData = Array.from(new Set(
    filteredWeeklyData.flatMap(week =>
      week.workers.map(worker => worker.workType)
    )
  ))

  return (
    // Remove DashboardLayoutWrapper - the layout will handle the authentication and layout
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-balance">سجل الحضور الأسبوعي</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">عرض جميع أسابيع الحضور المسجلة</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Search className="h-4 w-4 md:h-5 md:w-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="workType" className="text-xs md:text-sm font-medium">
                نوع العمل
              </Label>
              <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                <SelectTrigger id="workType" className="h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue placeholder="اختر نوع العمل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأعمال</SelectItem>
                  {availableWorkTypes.map(workType => (
                    <SelectItem key={workType} value={workType}>
                      {getWorkTypeLabel(workType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="year" className="text-xs md:text-sm font-medium">
                السنة
              </Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger id="year" className="h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {toLatinNumbers(year)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="month" className="text-xs md:text-sm font-medium">
                الشهر
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month" className="h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue placeholder="اختر الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-xs md:text-sm font-medium">
                بحث عن عامل
              </Label>
              <Input
                id="search"
                placeholder="اسم العامل أو الرقم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 md:h-10 text-xs md:text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Attendance Tables */}
      <div className="space-y-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">جاري تحميل بيانات الحضور...</p>
            </CardContent>
          </Card>
        ) : filteredWeeklyData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery || selectedWorkType !== 'all' || selectedMonth !== 'all'
                  ? "لا توجد نتائج تطابق البحث"
                  : "لا توجد سجلات حضور مسجلة"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWeeklyData.map((weekData) => {
            const weekDates = getWeekDates(weekData.weekNumber, weekData.year)
            // Reverse the week dates for display
            const reversedWeekDates = [...weekDates].reverse()
            // Reverse the day names for display
            const reversedDayNames = [...dayNames].reverse()

            return (
              <div key={`${weekData.weekNumber}-${weekData.year}`} className="space-y-4">
                {/* Week Header */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h2 className="text-lg md:text-xl font-bold">
                          الأسبوع {weekData.weekNumber} - {toLatinNumbers(weekData.year)}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                          {getWeekRangeText(weekData.weekNumber, weekData.year)} ({toLatinNumbers(6)} أيام عمل)
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">عدد العمال:</span>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            {toLatinNumbers(weekData.workers.length)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">الإجمالي:</span>
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            {toLatinNumbers(weekData.totalAmount.toFixed(3))} د.م
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Type Tabs - Only show tabs for work types that have data */}
                <Tabs defaultValue={workTypesWithData[0] || WorkType.LAFSOW_MAHDI} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-9 md:h-10">
                    {workTypesWithData.map((workType) => (
                      <TabsTrigger key={workType} value={workType} className="text-xs md:text-sm">
                        {getWorkTypeLabel(workType)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {[WorkType.LAFSOW_MAHDI, WorkType.ALFASALA].map((workType) => {
                    const workTypeData = weekData.workers.filter(worker =>
                      worker.workType === workType
                    )

                    // If no data for this work type, show message
                    if (workTypeData.length === 0) {
                      // Only show tab content if this work type is in the available work types
                      if (!workTypesWithData.includes(workType)) {
                        return null
                      }

                      return (
                        <TabsContent key={workType} value={workType} className="mt-4">
                          <Card>
                            <CardContent className="p-8 text-center">
                              <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                <Users className="h-12 w-12 opacity-50" />
                                <p className="text-lg">لا توجد سجلات حضور</p>
                                <p className="text-sm">
                                  لا توجد سجلات حضور للعمال في قسم {getWorkTypeLabel(workType)} لهذا الأسبوع
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      )
                    }

                    const workTypeTotal = workTypeData.reduce((sum, worker) => sum + worker.amountToPay, 0)

                    return (
                      <TabsContent key={workType} value={workType} className="mt-4">
                        <Card>
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <CardTitle className="text-lg md:text-xl">
                                {getWorkTypeLabel(workType)}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">عدد العمال:</span>
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                    {toLatinNumbers(workTypeData.length)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">الإجمالي:</span>
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    {toLatinNumbers(workTypeTotal.toFixed(3))} د.م
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto -mx-4 md:mx-0">
                              <div className="inline-block min-w-full align-middle">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="border-b bg-muted/50">
                                      <th className="text-right p-2 md:p-3 font-bold text-xs md:text-sm whitespace-nowrap sticky right-0 bg-card z-10">
                                        إجمالي الأجر
                                      </th>
                                      {reversedDayNames.map((day, index) => (
                                        <th
                                          key={index}
                                          className="text-center p-2 md:p-3 font-bold text-xs md:text-sm whitespace-nowrap"
                                        >
                                          <div>{day}</div>
                                          <div className="text-[10px] md:text-xs text-muted-foreground font-normal mt-0.5">
                                            {toLatinNumbers(reversedWeekDates[index].getDate())} {getArabicMonth(reversedWeekDates[index].getMonth())}
                                          </div>
                                        </th>
                                      ))}
                                      <th className="text-right p-2 md:p-3 font-bold text-xs md:text-sm whitespace-nowrap sticky right-0 bg-card z-10">
                                        العامل
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {workTypeData.map((worker) => (
                                      <tr key={worker.workerId} className="border-b hover:bg-muted/50">
                                        <td className="p-2 md:p-3 text-right sticky right-0 bg-card z-10">
                                          <span className="text-xs md:text-sm font-bold text-green-600 whitespace-nowrap">
                                            {toLatinNumbers(worker.amountToPay.toFixed(3))} د.م.
                                          </span>
                                        </td>
                                        {[
                                          worker.attendance.saturday, // Saturday first (reversed)
                                          worker.attendance.friday,
                                          worker.attendance.thursday,
                                          worker.attendance.wednesday,
                                          worker.attendance.tuesday,
                                          worker.attendance.monday, // Monday last (reversed)
                                        ].map((attendance, dayIndex) => (
                                          <td key={dayIndex} className="text-center p-2 md:p-3">
                                            {getAttendanceBadge(attendance)}
                                          </td>
                                        ))}
                                        <td className="p-2 md:p-3 sticky right-0 bg-card z-10">
                                          <div className="font-bold text-xs md:text-sm break-words max-w-[120px] md:max-w-none text-right">
                                            {worker.workerName}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}