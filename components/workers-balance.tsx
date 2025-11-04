"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getRecentWorkersWithBalance } from "@/lib/actions/dashboard.actions"
import { toLatinNumbers } from "@/lib/utils"
import Link from "next/link"
import { Users, ArrowLeft } from "lucide-react"

interface WorkerBalance {
  id: string
  name: string
  workType: string
  balance: number
  totalEarned: number
  totalPaid: number
}

export function WorkersBalance() {
  const [workers, setWorkers] = useState<WorkerBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkers()
  }, [])

  const loadWorkers = async () => {
    try {
      const result = await getRecentWorkersWithBalance()
      if (result.success && result.data) {
        setWorkers(result.data)
      }
    } catch (error) {
      console.error("Error loading workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const getWorkTypeLabel = (workType: string) => {
    switch (workType) {
      case "LAFSOW_MAHDI":
        return "لافصو مهدي"
      case "ALFASALA":
        return "الفصالة"
      default:
        return workType
    }
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-red-600"
    if (balance < 0) return "text-green-600"
    return "text-gray-600"
  }

  const getBalanceText = (balance: number) => {
    if (balance > 0) return "كيتسال"
    if (balance < 0) return "زايدو في لخلاص"
    return "متوازن"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            أرصدة العمال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          أرصدة العمال
        </CardTitle>
        <Link href="/workers">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <span>عرض الكل</span>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {workers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-4">لا توجد بيانات للعرض</p>
            <Link href="/workers">
              <Button variant="outline" size="sm">
                إدارة العمال
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {workers.map((worker) => (
              <Link key={worker.id} href={`/workers/${worker.id}`}>
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {worker.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getWorkTypeLabel(worker.workType)}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>كسب: {toLatinNumbers(worker.totalEarned.toFixed(3))} د.م</span>
                      <span>دفع: {toLatinNumbers(worker.totalPaid.toFixed(3))} د.م</span>
                    </div>
                  </div>
                  <div className={`text-right ${getBalanceColor(worker.balance)}`}>
                    <div className="font-bold">{toLatinNumbers(Math.abs(worker.balance).toFixed(3))} د.م</div>
                    <div className="text-xs capitalize">{getBalanceText(worker.balance)}</div>
                  </div>
                </div>
              </Link>
            ))}

          </div>
        )}
      </CardContent>
    </Card>
  )
}