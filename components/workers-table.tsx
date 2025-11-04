"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditWorkerDialog } from "@/components/edit-worker-dialog"
import Link from "next/link"
import { getAllWorkersWithBalances } from "@/lib/actions/worker.actions"
import { Worker, WorkType } from "@prisma/client"
import { mapWorkTypeToDatabase } from "@/lib/utils/worker-utils"
import { toast } from "sonner"

function toLatinNumbers(str: string | number): string {
  const arabicToLatin: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  }
  return String(str).replace(/[٠-٩]/g, (d) => arabicToLatin[d] || d)
}

interface WorkerWithBalance extends Worker {
  balance: number
}

export function WorkersTable({ workTypeFilter }: { workTypeFilter?: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [workers, setWorkers] = useState<WorkerWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkers()
  }, [])

  // In WorkersTable component, change this:
  const loadWorkers = async () => {
    setLoading(true)
    try {
      // ✅ Use the new optimized function
      const result = await getAllWorkersWithBalances()
      if (result.success && result.data) {
        setWorkers(result.data)
      } else {
        toast.error(result.error || "فشل في تحميل بيانات العمال")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل البيانات")
      console.error("Error loading workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.phoneNumber.includes(searchQuery) ||
      worker.id.includes(searchQuery)

    let matchesWorkType = true
    if (workTypeFilter) {
      const dbWorkType = mapWorkTypeToDatabase(workTypeFilter)

      if (dbWorkType === "LAFSOW_MAHDI") {
        matchesWorkType = worker.workType === "LAFSOW_MAHDI"
      } else if (dbWorkType === "ALFASALA") {
        matchesWorkType = worker.workType === "ALFASALA"
      } else {
        matchesWorkType = worker.workType === dbWorkType
      }
    }

    return matchesSearch && matchesWorkType
  })

  const getWorkTypeLabel = (workType: WorkType) => {
    switch (workType) {
      case "LAFSOW_MAHDI":
        return "لافصو مهدي"
      case "ALFASALA":
        return "الفصالة"
      default:
        return "لافصو مهدي"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="flex justify-center items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>جاري تحميل البيانات...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg md:text-xl">قائمة العمال</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="search"
                placeholder="بحث عن عامل..."
                className="pr-10 w-full sm:w-64 text-sm md:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {searchQuery ? "لم يتم العثور على نتائج" : "لا يوجد عمال مسجلين"}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left whitespace-nowrap text-xs md:text-sm">الإجراءات</TableHead>
                  <TableHead className="text-left whitespace-nowrap text-xs md:text-sm">الحالة</TableHead>
                  <TableHead className="text-left whitespace-nowrap text-xs md:text-sm">الرصيد</TableHead>
                  <TableHead className="text-left whitespace-nowrap text-xs md:text-sm">الراتب الأسبوعي</TableHead>
                  <TableHead className="text-left whitespace-nowrap text-xs md:text-sm">نوع العمل</TableHead>
                  <TableHead className="text-left whitespace-nowrap text-xs md:text-sm">الاسم</TableHead>
                  <TableHead className="text-left whitespace-nowrap text-xs md:text-sm">رقم الهاتف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => {
                  const balance = worker.balance
                  return (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div className="flex gap-1 md:gap-2">
                          <Link href={`/workers/${worker.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Button>
                          </Link>
                          <EditWorkerDialog worker={worker} onWorkerUpdated={loadWorkers} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            worker.isActive
                              ? "bg-primary/10 text-primary border-primary/20 text-xs whitespace-nowrap"
                              : "bg-gray-100 text-gray-600 border-gray-200 text-xs whitespace-nowrap"
                          }
                        >
                          {worker.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm whitespace-nowrap">
                        <span
                          className={`font-bold ${balance > 0 ? "text-orange-600" : balance < 0 ? "text-red-600" : "text-gray-600"}`}
                        >
                          {toLatinNumbers(Math.abs(balance).toFixed(2))} د.م.
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {balance > 0 ? "كيتسال " : balance < 0 ? "زيادة" : "ما كيتسال والو "}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm whitespace-nowrap">
                        {toLatinNumbers(worker.weeklyPayment)} د.م.
                      </TableCell>
                      <TableCell className="text-xs md:text-sm whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            worker.workType === "LAFSOW_MAHDI"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : worker.workType === "ALFASALA"
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                          }
                        >
                          {getWorkTypeLabel(worker.workType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm whitespace-nowrap">{worker.fullName}</TableCell>
                      <TableCell className="font-medium text-xs md:text-sm whitespace-nowrap">
                        {toLatinNumbers(worker.phoneNumber)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}