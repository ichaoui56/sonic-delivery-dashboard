"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDashboardStats, getTodayProfitBreakdown } from "@/lib/actions/dashboard.actions"
import { toLatinNumbers } from "@/lib/utils"

interface DashboardStats {
  totalWorkers: number
  todayProfit: number
  totalClients: number
  pendingSales: number
  weeklyTrend: Array<{ week: string; profit: number }>
}

interface ProfitBreakdown {
  totalClientPayments: number
  totalWorkerPayments: number
  netProfit: number
  clientPayments: any[]
  workerPayments: any[]
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profitBreakdown, setProfitBreakdown] = useState<ProfitBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfitDetails, setShowProfitDetails] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [statsResult, breakdownResult] = await Promise.all([
        getDashboardStats(),
        getTodayProfitBreakdown()
      ])
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
      if (breakdownResult.success && breakdownResult.data) {
        setProfitBreakdown(breakdownResult.data)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getProfitChangeText = (trends: Array<{ week: string; profit: number }>): string => {
    if (trends.length < 2) return "لا توجد بيانات سابقة"
    
    const current = trends[trends.length - 1].profit
    const previous = trends[trends.length - 2].profit
    
    if (current > previous) {
      const diff = current - previous
      return `+${toLatinNumbers(diff.toFixed(3))} من الأسبوع الماضي`
    } else if (current < previous) {
      const diff = previous - current
      return `-${toLatinNumbers(diff.toFixed(3))} من الأسبوع الماضي`
    } else {
      return "لا تغيير من الأسبوع الماضي"
    }
  }

  const getProfitChangeType = (trends: Array<{ week: string; profit: number }>): "increase" | "decrease" | "neutral" => {
    if (trends.length < 2) return "neutral"
    
    const current = trends[trends.length - 1].profit
    const previous = trends[trends.length - 2].profit
    
    if (current > previous) return "increase"
    if (current < previous) return "decrease"
    return "neutral"
  }

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-emerald-100"
    if (profit < 0) return "text-rose-100"
    return "text-slate-100"
  }

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return "📈"
    if (profit < 0) return "📉"
    return "➡️"
  }

  const getProfitCardStyle = (profit: number) => {
    if (profit > 0) {
      return {
        bg: "bg-emerald-600",
        border: "border-emerald-700",
        shadow: "shadow-lg shadow-emerald-500/20"
      }
    } else if (profit < 0) {
      return {
        bg: "bg-rose-600",
        border: "border-rose-700",
        shadow: "shadow-lg shadow-rose-500/20"
      }
    } else {
      return {
        bg: "bg-sky-600",
        border: "border-sky-700",
        shadow: "shadow-lg shadow-sky-500/20"
      }
    }
  }

  const statsData = [
    {
      title: "إجمالي العمال",
      value: stats ? toLatinNumbers(stats.totalWorkers) : "0",
      change: "+12 من الشهر الماضي",
      changeType: "increase" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      bgColor: "bg-primary",
    },
    {
      title: "صافي الربح اليوم",
      value: stats ? `${getProfitIcon(stats.todayProfit)} ${toLatinNumbers(Math.abs(stats.todayProfit).toFixed(3))} د.م` : "0 د.م",
      change: stats ? getProfitChangeText(stats.weeklyTrend) : "جاري التحميل...",
      changeType: stats ? getProfitChangeType(stats.weeklyTrend) : "neutral",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      profit: stats?.todayProfit || 0,
    },
    {
      title: "إجمالي العملاء",
      value: stats ? toLatinNumbers(stats.totalClients) : "0",
      change: "+3 من الشهر الماضي",
      changeType: "increase" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      bgColor: "bg-card",
    },
    {
      title: "المبيعات المعلقة",
      value: stats ? toLatinNumbers(stats.pendingSales) : "0",
      change: "قيد المناقشة",
      changeType: "neutral" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-card",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
                <div className="w-6 h-6 bg-muted rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat: any, index: number) => {
          const isProfitCard = index === 1
          const profitStyle = isProfitCard ? getProfitCardStyle(stat.profit) : null
          
          return (
            <Card 
              key={stat.title} 
              className={`
                ${isProfitCard ? 
                  `${profitStyle?.bg} ${profitStyle?.border} ${profitStyle?.shadow} text-white border` : 
                  stat.bgColor === "bg-primary" ? "bg-primary text-primary-foreground border-primary" : 
                  "bg-card"
                } 
                ${isProfitCard ? 'cursor-pointer hover:scale-[1.02] transition-all duration-200' : ''}
                relative overflow-hidden
              `}
              onClick={isProfitCard ? () => setShowProfitDetails(!showProfitDetails) : undefined}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className={`
                        text-xs md:text-sm font-medium 
                        ${isProfitCard ? "text-white/90" : 
                          index === 0 ? "text-primary-foreground/80" : 
                          "text-muted-foreground"}
                      `}
                    >
                      {stat.title}
                    </p>
                    <h3 className={`
                      text-2xl md:text-3xl font-bold mt-1 md:mt-2 
                      ${isProfitCard ? getProfitColor(stat.profit) : ''}
                    `}>
                      {stat.value}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 md:mt-3">
                      <span
                        className={`
                          inline-flex items-center gap-1 text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium
                          ${isProfitCard ? "bg-white/20 text-white" : 
                            index === 0 ? "bg-primary-foreground/20 text-primary-foreground" :
                            stat.changeType === "increase" ? "bg-green-100 text-green-700" :
                            stat.changeType === "decrease" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"}
                        `}
                      >
                        {stat.changeType === "increase" && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        )}
                        {stat.changeType === "decrease" && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`
                      rounded-full flex-shrink-0
                      ${isProfitCard ? "text-white hover:bg-white/20" :
                        index === 0 ? "text-primary-foreground hover:bg-primary-foreground/20" :
                        "hover:bg-muted"}
                    `}
                  >
                    {stat.icon}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Profit Breakdown Details */}
      {showProfitDetails && profitBreakdown && (
        <Card className="mt-4 animate-in fade-in duration-300">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-lg font-bold mb-4">تفاصيل الربح اليوم</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-emerald-600 text-white rounded-lg shadow-lg">
                <div className="text-2xl font-bold">
                  +{toLatinNumbers(profitBreakdown.totalClientPayments.toFixed(3))} د.م
                </div>
                <div className="text-sm opacity-90 mt-1">إجمالي مدفوعات العملاء</div>
                <div className="text-xs opacity-80 mt-2">
                  {profitBreakdown.clientPayments.length} دفعة
                </div>
              </div>
              
              <div className="text-center p-4 bg-rose-600 text-white rounded-lg shadow-lg">
                <div className="text-2xl font-bold">
                  -{toLatinNumbers(profitBreakdown.totalWorkerPayments.toFixed(3))} د.م
                </div>
                <div className="text-sm opacity-90 mt-1">إجمالي مدفوعات العمال</div>
                <div className="text-xs opacity-80 mt-2">
                  {profitBreakdown.workerPayments.length} دفعة
                </div>
              </div>
              
              <div className={`text-center p-4 rounded-lg shadow-lg ${
                profitBreakdown.netProfit >= 0 ? 
                'bg-sky-600 text-white' : 
                'bg-amber-600 text-white'
              }`}>
                <div className="text-2xl font-bold">
                  {profitBreakdown.netProfit >= 0 ? '+' : ''}{toLatinNumbers(profitBreakdown.netProfit.toFixed(3))} د.م
                </div>
                <div className="text-sm opacity-90 mt-1">
                  صافي الربح
                </div>
                <div className="text-xs opacity-80 mt-2">
                  {profitBreakdown.netProfit >= 0 ? 'ربح' : 'خسارة'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}