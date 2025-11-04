"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import {
  getWorkersByWorkType,
  markAttendance,
  getAttendanceByDate
} from "@/lib/actions/attendence.actions"
import { calculateDailyRate, calculatePayment } from "@/lib/utils/attendance"
import { 
  getWeekDates, 
  getWeekNumber, 
  formatDateForDisplay, 
  formatGregorianDate, 
  getRelativeDayLabel,
  getArabicMonth,
  toLatinNumbers,
  dayNames 
} from "@/lib/utils"
import { WorkType, AttendanceType } from "@prisma/client"

interface Worker {
  id: string
  fullName: string
  phoneNumber: string
  weeklyPayment: number
  workType: WorkType
}

type AttendanceStatus = "FULL_DAY" | "HALF_DAY" | "DAY_AND_NIGHT" | "ABSENCE" | "notRecorded"

export function AttendanceMarking() {
  // Calculate initial day index based on current day - REVERSED
  const getCurrentDayIndex = () => {
    const today = new Date()
    const currentDay = today.getDay()
    // Convert Sunday (0) to index 0, Monday (1) to index 1, ..., Saturday (6) to index 5
    // But reversed: Saturday becomes index 0, Friday index 1, ..., Monday index 5
    return currentDay === 0 ? 0 : 6 - currentDay
  }

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState(Math.min(getCurrentDayIndex(), 5))
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType>(WorkType.LAFSOW_MAHDI)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [attendance, setAttendance] = useState<Record<string, Record<string, AttendanceType>>>({})
  const [loading, setLoading] = useState(false)

  const weekDates = getWeekDates(weekOffset)
  // Reverse the week dates so Monday is on the right
  const reversedWeekDates = [...weekDates].reverse()
  const selectedDate = reversedWeekDates[selectedDayIndex]

  const isCurrentWeek = weekOffset === 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = selectedDate.getTime() === today.getTime()

  // Load workers and attendance data for the entire week
  useEffect(() => {
    loadWorkersAndAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkType, weekOffset])

  const loadWorkersAndAttendance = async () => {
    setLoading(true)
    try {
      // Load workers
      const workersResult = await getWorkersByWorkType(selectedWorkType)
      if (workersResult.success) {
        setWorkers(workersResult.workers || [])
      }

      // Load attendance for ALL days in the current week
      const attendanceMap: Record<string, Record<string, AttendanceType>> = {}

      // Fetch attendance for each day of the week (using reversed dates)
      const attendancePromises = reversedWeekDates.map(date => getAttendanceByDate(date))
      const attendanceResults = await Promise.all(attendancePromises)

      attendanceResults.forEach((result) => {
        if (result.success && result.attendance) {
          result.attendance.forEach((record: any) => {
            const dateKey = record.date.toISOString().split('T')[0]
            if (!attendanceMap[record.workerId]) {
              attendanceMap[record.workerId] = {}
            }
            attendanceMap[record.workerId][dateKey] = record.type
          })
        }
      })

      setAttendance(attendanceMap)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const navigateDay = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (selectedDayIndex === 0) {
        setWeekOffset(weekOffset - 1)
        setSelectedDayIndex(5)
      } else {
        setSelectedDayIndex(selectedDayIndex - 1)
      }
    } else {
      if (selectedDayIndex === 5) {
        setWeekOffset(weekOffset + 1)
        setSelectedDayIndex(0)
      } else {
        setSelectedDayIndex(selectedDayIndex + 1)
      }
    }
  }

  const goToCurrentWeek = () => {
    setWeekOffset(0)
  }

  const goToToday = () => {
    setWeekOffset(0)
    const today = new Date()
    const currentDay = today.getDay()
    const dayIndex = currentDay === 0 ? 0 : 6 - currentDay
    setSelectedDayIndex(Math.min(dayIndex, 5))
  }

  const handleAttendanceChange = async (workerId: string, type: AttendanceType) => {
    try {
      const result = await markAttendance(workerId, selectedDate, type)
      if (result.success) {
        const dateKey = getDateKey(selectedDate)
        setAttendance((prev) => ({
          ...prev,
          [workerId]: {
            ...prev[workerId],
            [dateKey]: type,
          },
        }))
      }
    } catch (error) {
      console.error("Error updating attendance:", error)
    }
  }

  const getAttendanceStatus = (workerId: string, date: Date): AttendanceStatus => {
    const dateKey = getDateKey(date)
    const status = attendance[workerId]?.[dateKey]
    return status || "notRecorded"
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Week Navigation */}
      <Card>
        <CardContent className="p-2 md:p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="h-7 w-7 md:h-9 md:w-9 flex-shrink-0"
              >
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>

              <div className="text-center flex-1 min-w-0">
                <h2 className="text-sm md:text-lg font-bold mb-0.5">{isCurrentWeek ? "الأسبوع الحالي" : "الأسبوع"}</h2>
                <p className="text-muted-foreground text-[10px] md:text-xs break-words">
                  السبت، {formatDateForDisplay(reversedWeekDates[0])} - الاثنين، {formatDateForDisplay(reversedWeekDates[5])} (6 أيام عمل)
                </p>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="h-7 w-7 md:h-9 md:w-9 flex-shrink-0"
              >
                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>

            {!isCurrentWeek && (
              <div className="flex items-center justify-center">
                <Button variant="secondary" onClick={goToCurrentWeek} className="w-fit text-xs md:text-sm h-7 md:h-8">
                  <Calendar className="ml-1.5 h-3 w-3 md:h-3.5 md:w-3.5" />
                  الذهاب إلى الأسبوع الحالي
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Day Navigation */}
      <Card>
        <CardContent className="p-2 md:p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay("prev")}
                className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0"
              >
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>

              <div className="text-center flex-1 min-w-0">
                <h2 className="text-sm md:text-base font-bold">{getRelativeDayLabel(selectedDate)}</h2>
                <p className="text-muted-foreground text-[10px] md:text-xs">{formatGregorianDate(selectedDate)}</p>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay("next")}
                className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0"
              >
                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>

            {!isToday && (
              <div className="flex items-center justify-center">
                <Button variant="secondary" onClick={goToToday} className="w-fit text-xs md:text-sm h-7 md:h-8">
                  <Calendar className="ml-1.5 h-3 w-3 md:h-3.5 md:w-3.5" />
                  الذهاب إلى اليوم
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs to switch between work types */}
      <Tabs value={selectedWorkType} onValueChange={(value) => setSelectedWorkType(value as WorkType)}>
        <TabsList className="grid w-full grid-cols-2 h-8 md:h-9">
          <TabsTrigger value={WorkType.LAFSOW_MAHDI} className="text-xs md:text-sm py-1 md:py-1.5">
            لافصو مهدي
          </TabsTrigger>
          <TabsTrigger value={WorkType.ALFASALA} className="text-xs md:text-sm py-1 md:py-1.5">
            الفصالة
          </TabsTrigger>
        </TabsList>

        {[WorkType.LAFSOW_MAHDI, WorkType.ALFASALA].map((workType) => (
          <TabsContent key={workType} value={workType} className="mt-3 md:mt-4">
            <AttendanceContent
              workers={workers.filter(worker => worker.workType === workType)}
              selectedDate={selectedDate}
              attendance={attendance}
              onAttendanceChange={handleAttendanceChange}
              getAttendanceStatus={getAttendanceStatus}
              weekDates={reversedWeekDates}
              loading={loading}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function AttendanceContent({
  workers,
  selectedDate,
  attendance,
  onAttendanceChange,
  getAttendanceStatus,
  weekDates,
  loading,
}: {
  workers: Worker[]
  selectedDate: Date
  attendance: Record<string, Record<string, AttendanceType>>
  onAttendanceChange: (workerId: string, status: AttendanceType) => void
  getAttendanceStatus: (workerId: string, date: Date) => AttendanceStatus
  weekDates: Date[]
  loading: boolean
}) {
  // Reverse the day names for display
  const reversedDayNames = [...dayNames].reverse()

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Daily Attendance Marking */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-base md:text-xl font-bold">تسجيل الحضور - اليوم</h3>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm md:text-base">لا يوجد عمال في هذا القسم</p>
            </div>
          ) : (
            <div className="grid gap-2.5 md:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => {
                const status = getAttendanceStatus(worker.id, selectedDate)
                const dailyRate = calculateDailyRate(worker.weeklyPayment)
                const todayPayment = calculatePayment(dailyRate, status)

                return (
                  <Card key={worker.id} className="overflow-hidden">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start justify-between mb-2.5 md:mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm md:text-lg font-bold mb-0.5 break-words">{worker.fullName}</h4>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center text-base md:text-lg font-bold flex-shrink-0">
                          {worker.fullName.charAt(0)}
                        </div>
                      </div>

                      <div className="space-y-1.5 md:space-y-2 mb-2.5 md:mb-3">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs md:text-sm text-primary">الأجر اليومي</span>
                          <span className="text-xs md:text-base font-bold text-primary">
                            {toLatinNumbers(dailyRate.toFixed(3))} د.م.
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs md:text-sm text-muted-foreground">الأجر المحسوب</span>
                          <span className="text-xs md:text-base font-bold text-green-600">
                            {toLatinNumbers(todayPayment.toFixed(3))} د.م.
                          </span>
                        </div>
                      </div>

                      {status !== "notRecorded" && (
                        <div
                          className={`text-center py-1 md:py-1.5 px-2 md:px-3 rounded-lg mb-2.5 md:mb-3 text-xs md:text-sm font-medium ${status === "ABSENCE"
                              ? "bg-red-100 text-red-700"
                              : status === "HALF_DAY"
                                ? "bg-yellow-100 text-yellow-700"
                                : status === "DAY_AND_NIGHT"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                        >
                          {status === "FULL_DAY" && "يوم كامل"}
                          {status === "HALF_DAY" && "نصف يوم"}
                          {status === "DAY_AND_NIGHT" && "يوم ونصف"}
                          {status === "ABSENCE" && "غائب"}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                        <Button
                          variant={status === "FULL_DAY" ? "default" : "outline"}
                          onClick={() => onAttendanceChange(worker.id, "FULL_DAY")}
                          className="text-xs md:text-sm h-8 md:h-9"
                        >
                          يوم كامل
                        </Button>
                        <Button
                          variant={status === "HALF_DAY" ? "default" : "outline"}
                          onClick={() => onAttendanceChange(worker.id, "HALF_DAY")}
                          className="text-xs md:text-sm h-8 md:h-9"
                        >
                          نصف يوم
                        </Button>
                        <Button
                          variant={status === "DAY_AND_NIGHT" ? "default" : "outline"}
                          onClick={() => onAttendanceChange(worker.id, "DAY_AND_NIGHT")}
                          className="text-xs md:text-sm h-8 md:h-9"
                        >
                          يوم ونصف
                        </Button>
                        <Button
                          variant={status === "ABSENCE" ? "destructive" : "outline"}
                          onClick={() => onAttendanceChange(worker.id, "ABSENCE")}
                          className="text-xs md:text-sm h-8 md:h-9"
                        >
                          غائب
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Report Table */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4">
            <h3 className="text-base md:text-xl font-bold">التقرير الأسبوعي</h3>
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <p className="text-muted-foreground mb-3 md:mb-4 text-xs md:text-sm">
            من {formatGregorianDate(weekDates[0])} إلى {formatGregorianDate(weekDates[5])} ({toLatinNumbers(6)} أيام
            عمل)
          </p>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm md:text-base">لا يوجد عمال في هذا القسم</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-1.5 md:p-3 font-bold text-xs md:text-base whitespace-nowrap">
                        إجمالي الأجر
                      </th>
                      {reversedDayNames.map((day, index) => (
                        <th
                          key={index}
                          className="text-center p-1.5 md:p-3 font-bold text-xs md:text-sm whitespace-nowrap"
                        >
                          <div>{day}</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground font-normal mt-0.5">
                            {toLatinNumbers(weekDates[index].getDate())} {getArabicMonth(weekDates[index].getMonth())}
                          </div>
                        </th>
                      ))}
                      <th className="text-right p-1.5 md:p-3 font-bold text-xs md:text-base sticky right-0 bg-card">
                        العامل
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((worker) => {
                      let weeklyTotal = 0
                      const dailyRate = calculateDailyRate(worker.weeklyPayment)

                      weekDates.forEach((date) => {
                        const status = getAttendanceStatus(worker.id, date)
                        weeklyTotal += calculatePayment(dailyRate, status)
                      })

                      return (
                        <tr key={worker.id} className="border-b hover:bg-muted/50">
                          <td className="p-1.5 md:p-3 text-right">
                            <span className="text-xs md:text-base font-bold text-green-600 whitespace-nowrap">
                              {toLatinNumbers(weeklyTotal.toFixed(3))} د.م.
                            </span>
                          </td>
                          {weekDates.map((date, dayIndex) => {
                            const status = getAttendanceStatus(worker.id, date)
                            return (
                              <td key={dayIndex} className="text-center p-1.5 md:p-3">
                                {status === "notRecorded" && (
                                  <span className="text-muted-foreground text-[10px] md:text-xs whitespace-nowrap">
                                    لم يسجل
                                  </span>
                                )}
                                {status === "FULL_DAY" && (
                                  <span className="inline-block px-1.5 md:px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] md:text-xs font-medium whitespace-nowrap">
                                    يوم كامل
                                  </span>
                                )}
                                {status === "HALF_DAY" && (
                                  <span className="inline-block px-1.5 md:px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] md:text-xs font-medium whitespace-nowrap">
                                    نصف يوم
                                  </span>
                                )}
                                {status === "DAY_AND_NIGHT" && (
                                  <span className="inline-block px-1.5 md:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] md:text-xs font-medium whitespace-nowrap">
                                    يوم ونصف
                                  </span>
                                )}
                                {status === "ABSENCE" && (
                                  <span className="inline-block px-1.5 md:px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] md:text-xs font-medium whitespace-nowrap">
                                    غائب
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          <td className="p-1.5 md:p-3 sticky right-0 bg-card">
                            <div className="font-bold text-xs md:text-base break-words max-w-[100px] md:max-w-none">
                              {worker.fullName}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}