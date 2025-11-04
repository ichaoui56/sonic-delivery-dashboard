"use server"

import { prisma } from "@/lib/prisma"
import { getWeekNumber } from "@/lib/utils"
import { getWorkersCount } from "./worker.actions"
import { getClientsCount } from "./attendence.actions"

export async function getDashboardStats() {
  try {
    const today = new Date()
    const currentWeek = getWeekNumber(today)
    const currentYear = today.getFullYear()

    // Get total workers count
    const totalWorkers = await prisma.worker.count({
      where: { isActive: true }
    })

    // Calculate today's profit (Client payments - Worker payments)
    const todayProfit = await calculateTodayProfit()

    // Get total clients count
    const totalClients = await prisma.client.count()

    // Get pending sales (transactions without full payment)
    const clients = await prisma.client.findMany({
      include: {
        transactions: true,
        clientPayments: true,
      }
    })

    const pendingSales = clients.filter(client => {
      const totalSales = client.transactions.reduce((sum, t) => sum + t.totalAmount, 0)
      const totalPayments = client.clientPayments.reduce((sum, p) => sum + p.amount, 0)
      return totalSales > totalPayments
    }).length

    // Get weekly profit trend (last 4 weeks)
    const weeklyTrend = await getWeeklyProfitTrend()

    return {
      success: true,
      data: {
        totalWorkers,
        todayProfit,
        totalClients,
        pendingSales,
        weeklyTrend
      }
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return { success: false, error: "فشل في جلب إحصائيات لوحة التحكم" }
  }
}

async function calculateTodayProfit(): Promise<number> {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get today's client payments
    const todayClientPayments = await prisma.clientPayment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    const totalClientPayments = todayClientPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Get today's worker payments
    const todayWorkerPayments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    const totalWorkerPayments = todayWorkerPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Calculate profit (Client payments - Worker payments)
    const profit = totalClientPayments - totalWorkerPayments

    return profit
  } catch (error) {
    console.error("Error calculating today's profit:", error)
    return 0
  }
}

async function getWeeklyProfitTrend() {
  try {
    const today = new Date()
    const trends = []
    
    for (let i = 0; i < 4; i++) {
      const weekDate = new Date(today)
      weekDate.setDate(today.getDate() - (i * 7))
      
      const startOfWeek = new Date(weekDate)
      startOfWeek.setDate(weekDate.getDate() - weekDate.getDay() + 1) // Monday
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
      endOfWeek.setHours(23, 59, 59, 999)

      // Get client payments for the week
      const weekClientPayments = await prisma.clientPayment.findMany({
        where: {
          date: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        }
      })

      const totalClientPayments = weekClientPayments.reduce((sum, payment) => sum + payment.amount, 0)

      // Get worker payments for the week
      const weekWorkerPayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        }
      })

      const totalWorkerPayments = weekWorkerPayments.reduce((sum, payment) => sum + payment.amount, 0)

      // Calculate weekly profit
      const weeklyProfit = totalClientPayments - totalWorkerPayments
      
      trends.push({
        week: `W${getWeekNumber(weekDate)}`,
        profit: weeklyProfit
      })
    }
    
    return trends.reverse()
  } catch (error) {
    console.error("Error fetching weekly profit trend:", error)
    return []
  }
}

export async function getRecentWorkersWithBalance() {
  try {
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      include: {
        attendances: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 4
    })

    const workersWithBalance = workers.map(worker => {
      const dailyRate = worker.weeklyPayment / 6
      let totalEarned = 0
      
      worker.attendances.forEach(attendance => {
        const days = [
          attendance.monday,
          attendance.tuesday,
          attendance.wednesday,
          attendance.thursday,
          attendance.friday,
          attendance.saturday,
        ]
        
        days.forEach(dayType => {
          if (dayType === null || dayType === undefined) return
          
          switch (dayType) {
            case "FULL_DAY":
              totalEarned += dailyRate
              break
            case "DAY_AND_NIGHT":
              totalEarned += dailyRate * 1.5
              break
            case "HALF_DAY":
              totalEarned += dailyRate * 0.5
              break
          }
        })
      })

      const totalPaid = worker.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const balance = totalEarned - totalPaid

      return {
        id: worker.id,
        name: worker.fullName,
        workType: worker.workType,
        balance,
        totalEarned,
        totalPaid
      }
    })

    return { success: true, data: workersWithBalance }
  } catch (error) {
    console.error("Error fetching recent workers:", error)
    return { success: false, error: "فشل في جلب بيانات العمال" }
  }
}

// New function to get profit breakdown for today
export async function getTodayProfitBreakdown() {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get today's client payments
    const todayClientPayments = await prisma.clientPayment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        client: true
      }
    })

    // Get today's worker payments
    const todayWorkerPayments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        worker: true
      }
    })

    const totalClientPayments = todayClientPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalWorkerPayments = todayWorkerPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const netProfit = totalClientPayments - totalWorkerPayments

    return {
      success: true,
      data: {
        totalClientPayments,
        totalWorkerPayments,
        netProfit,
        clientPayments: todayClientPayments,
        workerPayments: todayWorkerPayments
      }
    }
  } catch (error) {
    console.error("Error getting today's profit breakdown:", error)
    return { success: false, error: "فشل في جلب تفاصيل الأرباح" }
  }
}

export async function getDashboardCounts() {
  try {
    const [workersResult, clientsResult] = await Promise.all([
      getWorkersCount(),
      getClientsCount()
    ])

    // Ensure we always return numbers, defaulting to 0 if undefined
    const counts = {
      workers: workersResult.success ? (workersResult.data || 0) : 0,
      clients: clientsResult.success ? (clientsResult.data || 0) : 0,
    }

    return { success: true, data: counts }
  } catch (error) {
    console.error("Error fetching dashboard counts:", error)
    return { 
      success: false, 
      error: "فشل في جلب إحصائيات لوحة التحكم",
      data: { workers: 0, clients: 0 }
    }
  }
}