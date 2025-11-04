"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { WorkType, AttendanceType, PaymentType } from "@prisma/client"

// Helper function to get week number
function getWeekNumber(date: Date): { weekNumber: string; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return {
    weekNumber: `W${weekNo.toString().padStart(2, "0")}`,
    year: d.getUTCFullYear(),
  }
}

// Helper function to calculate balance for a single worker
// In your server actions, update the calculateWorkerBalance function:

// Helper function to calculate balance for a single worker
// Helper function to calculate balance for a single worker
function calculateWorkerBalance(worker: any) {
  const dailyRate = worker.weeklyPayment / 6

  let totalEarned = 0
  if (worker.attendances) {
    worker.attendances.forEach((attendance: any) => {
      const days = [
        attendance.monday,
        attendance.tuesday,
        attendance.wednesday,
        attendance.thursday,
        attendance.friday,
        attendance.saturday,
      ]
      days.forEach((dayType) => {
        // Skip unrecorded days (null or undefined)
        if (dayType === null || dayType === undefined) {
          return
        }

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
          case "ABSENCE":
            totalEarned += 0
            break
        }
      })
    })
  }

  const totalPaid = worker.payments
    ? worker.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
    : 0

  // Fix: Use proper rounding to avoid floating-point precision issues
  totalEarned = Math.round(totalEarned * 100) / 100
  const balance = Math.round((totalEarned - totalPaid) * 100) / 100

  return {
    totalEarned,
    totalPaid,
    balance,
  }
}

// ==================== Worker CRUD ====================

export async function getAllWorkers() {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        attendances: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })
    return { success: true, data: workers }
  } catch (error) {
    console.error("Error fetching workers:", error)
    return { success: false, error: "فشل في جلب بيانات العمال" }
  }
}

// ✨ NEW: Get all workers with balances calculated in a single query
export async function getAllWorkersWithBalances() {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        attendances: true,
        payments: true,
      },
    })

    const workersWithBalances = workers.map((worker) => {
      const balanceData = calculateWorkerBalance(worker)
      return {
        ...worker,
        balance: balanceData.balance,
        totalEarned: balanceData.totalEarned,
        totalPaid: balanceData.totalPaid,
      }
    })

    return { success: true, data: workersWithBalances }
  } catch (error) {
    console.error("Error fetching workers with balances:", error)
    return { success: false, error: "فشل في جلب بيانات العمال" }
  }
}

export async function getWorkerById(id: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        attendances: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!worker) {
      return { success: false, error: "العامل غير موجود" }
    }

    return { success: true, data: worker }
  } catch (error) {
    console.error("Error fetching worker:", error)
    return { success: false, error: "فشل في جلب بيانات العامل" }
  }
}

export async function createWorker(data: {
  fullName: string
  phoneNumber: string
  weeklyPayment: number
  workType: "LAFSOW_MAHDI" | "ALFASALA"
}) {
  try {
    const worker = await prisma.worker.create({
      data: {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        weeklyPayment: data.weeklyPayment,
        workType: data.workType as WorkType,
        isActive: true,
      },
    })

    revalidatePath("/workers")
    return { success: true, data: worker }
  } catch (error) {
    console.error("Error creating worker:", error)
    return { success: false, error: "فشل في إضافة العامل" }
  }
}

export async function updateWorker(
  id: string,
  data: {
    fullName?: string
    phoneNumber?: string
    weeklyPayment?: number
    workType?: "LAFSOW_MAHDI" | "ALFASALA"
    isActive?: boolean
  }
) {
  try {
    const worker = await prisma.worker.update({
      where: { id },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
        ...(data.weeklyPayment !== undefined && { weeklyPayment: data.weeklyPayment }),
        ...(data.workType && { workType: data.workType as WorkType }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    revalidatePath("/workers")
    revalidatePath(`/workers/${id}`)
    return { success: true, data: worker }
  } catch (error) {
    console.error("Error updating worker:", error)
    return { success: false, error: "فشل في تحديث بيانات العامل" }
  }
}

// In your worker.actions.ts - make sure this function is properly exported
export async function deleteWorker(id: string) {
  try {
    // Check if worker has any related records before deleting
    const workerWithRelations = await prisma.worker.findUnique({
      where: { id },
      include: {
        attendances: true,
        payments: true,
      },
    })

    if (!workerWithRelations) {
      return { success: false, error: "العامل غير موجود" }
    }

    // Optional: Add confirmation logic here if needed
    // For example, prevent deletion if there are payments or attendance records

    await prisma.worker.delete({
      where: { id },
    })

    revalidatePath("/workers")
    revalidatePath(`/workers/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting worker:", error)
    return { success: false, error: "فشل في حذف العامل" }
  }
}

// ==================== Worker Statistics ====================

export async function getWorkerBalance(workerId: string) {
  try {
    // Get worker with all attendances and payments
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        attendances: true,
        payments: true,
      },
    })

    if (!worker) {
      return { success: false, error: "العامل غير موجود" }
    }

    const balanceData = calculateWorkerBalance(worker)

    return {
      success: true,
      data: balanceData,
    }
  } catch (error) {
    console.error("Error calculating worker balance:", error)
    return { success: false, error: "فشل في حساب رصيد العامل" }
  }
}

// ==================== Attendance ====================

// This function is deprecated - use markAttendance from attendence.actions.ts instead
// Kept for backward compatibility
export async function recordAttendance(data: {
  workerId: string
  date: Date
  type: "FULL_DAY" | "DAY_AND_NIGHT" | "HALF_DAY" | "ABSENCE"
}) {
  return { success: false, error: "Use markAttendance from attendence.actions.ts" }
}

export async function getWorkerAttendance(workerId: string, startDate?: Date, endDate?: Date) {
  try {
    const where: any = { workerId }

    const attendances = await prisma.weeklyAttendance.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        worker: true,
      },
    })

    return { success: true, data: attendances }
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return { success: false, error: "فشل في جلب سجل الحضور" }
  }
}

// ==================== Payments ====================

export async function recordPayment(data: {
  workerId: string
  amount: number
  paymentType: "DAILY" | "WEEKLY" | "PARTIAL"
  note?: string
}) {
  try {
    const now = new Date()
    const { weekNumber, year } = getWeekNumber(now)

    // Validate worker exists
    const worker = await prisma.worker.findUnique({
      where: { id: data.workerId }
    })

    if (!worker) {
      return { success: false, error: "العامل غير موجود" }
    }

    // Fix: Round the amount to 2 decimal places to avoid floating-point issues
    const roundedAmount = Math.round(data.amount * 100) / 100

    const payment = await prisma.payment.create({
      data: {
        workerId: data.workerId,
        amount: roundedAmount,
        paymentType: data.paymentType as PaymentType,
        weekNumber,
        year,
        note: data.note,
      },
    })

    revalidatePath("/workers")
    revalidatePath(`/workers/${data.workerId}`)

    return { success: true, data: payment }
  } catch (error) {
    console.error("Error recording payment:", error)
    return { success: false, error: "فشل في تسجيل الدفعة" }
  }
}

export async function getWorkerPayments(workerId: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: { workerId },
      orderBy: { createdAt: "desc" },
      include: {
        worker: true,
      },
    })

    return { success: true, data: payments }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return { success: false, error: "فشل في جلب سجل المدفوعات" }
  }
}

// In worker.actions.ts - add these functions

export async function updatePayment(
  paymentId: string,
  data: {
    amount?: number
    paymentType?: "DAILY" | "WEEKLY" | "PARTIAL"
    note?: string
  }
) {
  try {
    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!existingPayment) {
      return { success: false, error: "الدفعة غير موجودة" }
    }

    // Fix: Round the amount to 2 decimal places
    const updateData: any = {}
    if (data.amount !== undefined) {
      updateData.amount = Math.round(data.amount * 100) / 100
    }
    if (data.paymentType) {
      updateData.paymentType = data.paymentType as PaymentType
    }
    if (data.note !== undefined) {
      updateData.note = data.note
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    })

    revalidatePath("/workers")
    revalidatePath(`/workers/${existingPayment.workerId}`)
    
    return { success: true, data: payment }
  } catch (error) {
    console.error("Error updating payment:", error)
    return { success: false, error: "فشل في تحديث الدفعة" }
  }
}

export async function deletePayment(paymentId: string) {
  try {
    // Get payment info before deletion for revalidation
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return { success: false, error: "الدفعة غير موجودة" }
    }

    await prisma.payment.delete({
      where: { id: paymentId },
    })

    revalidatePath("/workers")
    revalidatePath(`/workers/${payment.workerId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting payment:", error)
    return { success: false, error: "فشل في حذف الدفعة" }
  }
}

// ==================== Weekly Reports ====================

export async function getWeeklyReport(weekNumber: string, year: number) {
  try {
    const attendances = await prisma.weeklyAttendance.findMany({
      where: { weekNumber, year },
      include: {
        worker: true,
      },
    })

    const payments = await prisma.payment.findMany({
      where: { weekNumber, year },
      include: {
        worker: true,
      },
    })

    return { success: true, data: { attendances, payments } }
  } catch (error) {
    console.error("Error fetching weekly report:", error)
    return { success: false, error: "فشل في جلب التقرير الأسبوعي" }
  }
}

// ==================== Search and Filter ====================

export async function searchWorkers(query: string, workType?: "LAFSOW_MAHDI" | "ALFASALA") {
  try {
    const where: any = {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { phoneNumber: { contains: query } },
      ],
    }

    if (workType) {
      where.workType = workType
    }

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: workers }
  } catch (error) {
    console.error("Error searching workers:", error)
    return { success: false, error: "فشل في البحث عن العمال" }
  }
}

export async function getActiveWorkers(workType?: "LAFSOW_MAHDI" | "ALFASALA") {
  try {
    const where: any = { isActive: true }

    if (workType) {
      where.workType = workType
    }

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { fullName: "asc" },
    })

    return { success: true, data: workers }
  } catch (error) {
    console.error("Error fetching active workers:", error)
    return { success: false, error: "فشل في جلب العمال النشطين" }
  }
}

// Add this function to get workers count
export async function getWorkersCount() {
  try {
    const count = await prisma.worker.count({
      where: { isActive: true }
    })
    return { success: true, data: count }
  } catch (error) {
    console.error("Error fetching workers count:", error)
    return { success: false, error: "فشل في جلب عدد العمال" }
  }
}

// Add this to your existing worker.actions.ts
export async function payAllWorkers(paymentType: "WEEKLY" | "PARTIAL" = "WEEKLY", note?: string) {
  try {
    // Get all active workers with their balances
    const workersResult = await getAllWorkersWithBalances()
    if (!workersResult.success || !workersResult.data) {
      return { success: false, error: workersResult.error || "فشل في جلب بيانات العمال" }
    }

    const workers = workersResult.data
    const activeWorkers = workers.filter(worker => worker.isActive && worker.balance > 0)

    if (activeWorkers.length === 0) {
      return { success: false, error: "لا يوجد عمال نشطين لديهم رصيد مستحق" }
    }

    const now = new Date()
    const { weekNumber, year } = getWeekNumber(now)
    const results = []

    // Process payments for each worker
    for (const worker of activeWorkers) {
      try {
        // Only pay if worker has positive balance (money owed to worker)
        if (worker.balance > 0) {
          const payment = await prisma.payment.create({
            data: {
              workerId: worker.id,
              amount: worker.balance,
              paymentType: paymentType as PaymentType,
              weekNumber,
              year,
              note: note || `دفعة جماعية - ${paymentType === "WEEKLY" ? "أسبوعية" : "جزئية"}`,
            },
          })
          results.push({
            workerId: worker.id,
            workerName: worker.fullName,
            amount: worker.balance,
            success: true,
            paymentId: payment.id
          })
        }
      } catch (error) {
        results.push({
          workerId: worker.id,
          workerName: worker.fullName,
          amount: worker.balance,
          success: false,
          error: error instanceof Error ? error.message : "خطأ غير معروف"
        })
      }
    }

    const successfulPayments = results.filter(r => r.success)
    const failedPayments = results.filter(r => !r.success)

    revalidatePath("/workers")
    
    return {
      success: true,
      data: {
        totalWorkers: activeWorkers.length,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        totalAmount: successfulPayments.reduce((sum, p) => sum + p.amount, 0),
        details: results
      }
    }
  } catch (error) {
    console.error("Error in payAllWorkers:", error)
    return { success: false, error: "فشل في عملية الدفع الجماعي" }
  }
}