"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { AttendanceType, WorkType } from "@prisma/client"
import { calculateDailyRate, calculatePayment } from "@/lib/utils/attendance"
import { getWeekNumber, getWeekDates } from "@/lib/utils"

// Re-export utility functions for convenience
export { calculateDailyRate, calculatePayment }

// Get workers by work type
export async function getWorkersByWorkType(workType: WorkType) {
  try {
    const workers = await prisma.worker.findMany({
      where: {
        workType,
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        weeklyPayment: true,
        workType: true
      },
      orderBy: {
        fullName: 'asc'
      }
    })

    return { success: true, workers }
  } catch (error) {
    console.error("Error fetching workers:", error)
    return { success: false, error: "Failed to fetch workers" }
  }
}

export async function markAttendance(
  workerId: string,
  date: Date,
  type: AttendanceType
) {
  try {
    const weekNumber = getWeekNumber(date)
    const year = date.getFullYear()

    // Determine which day of the week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay()

    // Map day of week to field name (Monday = 1, Saturday = 6, skip Sunday = 0)
    const dayFieldMap: { [key: number]: keyof Omit<typeof updateData, 'updatedAt'> } = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    }

    const dayField = dayFieldMap[dayOfWeek]

    if (!dayField) {
      return { success: false, error: "Invalid day (Sundays are not working days)" }
    }

    // Create update data object - ONLY update the specific day
    const updateData: any = {
      [dayField]: type,
      updatedAt: new Date()
    }

    // Check if a record already exists for this week
    const existingRecord = await prisma.weeklyAttendance.findUnique({
      where: {
        workerId_weekNumber_year: {
          workerId,
          weekNumber,
          year
        }
      }
    })

    // If record exists, update only the specific day
    if (existingRecord) {
      await prisma.weeklyAttendance.update({
        where: {
          workerId_weekNumber_year: {
            workerId,
            weekNumber,
            year
          }
        },
        data: updateData
      })
    } else {
      // If no record exists, create new one with only the marked day set
      const createData: any = {
        workerId,
        weekNumber,
        year,
        // Set only the specific day, leave others as null/undefined (will be treated as not recorded)
        [dayField]: type
      }

      await prisma.weeklyAttendance.create({
        data: createData
      })
    }

    revalidatePath("/attendance")
    return { success: true }
  } catch (error) {
    console.error("Error marking attendance:", error)
    return { success: false, error: "Failed to mark attendance" }
  }
}

// Get weekly attendance with payment calculations
export async function getWeeklyAttendance(
  weekNumber: string,
  year: number,
  workType?: WorkType
) {
  try {
    const where: any = {
      weekNumber,
      year
    }

    if (workType) {
      where.worker = { workType }
    }

    const attendance = await prisma.weeklyAttendance.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            weeklyPayment: true,
            workType: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        worker: {
          fullName: 'asc'
        }
      }
    })

    // Calculate payments for each record
    const attendanceWithPayments = attendance.map(record => {
      const dailyRate = calculateDailyRate(record.worker.weeklyPayment)

      const mondayPay = calculatePayment(dailyRate, record.monday)
      const tuesdayPay = calculatePayment(dailyRate, record.tuesday)
      const wednesdayPay = calculatePayment(dailyRate, record.wednesday)
      const thursdayPay = calculatePayment(dailyRate, record.thursday)
      const fridayPay = calculatePayment(dailyRate, record.friday)
      const saturdayPay = calculatePayment(dailyRate, record.saturday)

      const weeklyTotal = mondayPay + tuesdayPay + wednesdayPay + thursdayPay + fridayPay + saturdayPay

      return {
        ...record,
        payments: {
          monday: mondayPay,
          tuesday: tuesdayPay,
          wednesday: wednesdayPay,
          thursday: thursdayPay,
          friday: fridayPay,
          saturday: saturdayPay,
          weeklyTotal
        }
      }
    })

    return { success: true, attendance: attendanceWithPayments }
  } catch (error) {
    console.error("Error fetching weekly attendance:", error)
    return { success: false, error: "Failed to fetch weekly attendance" }
  }
}

// Get attendance for a specific date (maps to weekly record)
export async function getAttendanceByDate(date: Date, workType?: WorkType) {
  try {
    const weekNumber = getWeekNumber(date)
    const year = date.getFullYear()
    const dayOfWeek = date.getDay()

    const dayFieldMap: { [key: number]: string } = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    }

    const dayField = dayFieldMap[dayOfWeek]

    if (!dayField) {
      return { success: false, error: "Invalid day (Sundays are not working days)" }
    }

    const where: any = {
      weekNumber,
      year
    }

    if (workType) {
      where.worker = { workType }
    }

    const weeklyRecords = await prisma.weeklyAttendance.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            weeklyPayment: true,
            workType: true,
            phoneNumber: true
          }
        }
      }
    })

    // Transform weekly records to daily attendance format
    const dailyAttendance = weeklyRecords.map(record => {
      const attendanceType = record[dayField as keyof typeof record] as AttendanceType | null
      const dailyRate = calculateDailyRate(record.worker.weeklyPayment)
      const payment = calculatePayment(dailyRate, attendanceType)

      return {
        id: record.id,
        workerId: record.workerId,
        date,
        type: attendanceType, // This can now be null
        weekNumber: record.weekNumber,
        year: record.year,
        worker: record.worker,
        payment
      }
    })

    return { success: true, attendance: dailyAttendance }
  } catch (error) {
    console.error("Error fetching attendance by date:", error)
    return { success: false, error: "Failed to fetch attendance" }
  }
}

// Get attendance history with filters (transforms weekly to daily records)
export async function getAttendanceHistory(filters: {
  workType?: WorkType
  status?: AttendanceType
  startDate?: Date
  endDate?: Date
  month?: string
}) {
  try {
    const where: any = {}

    if (filters.workType) {
      where.worker = { workType: filters.workType }
    }

    // Determine week range from date filters
    let weekNumbers: string[] = []
    let years: number[] = []

    if (filters.month && filters.month !== 'all') {
      const [year, month] = filters.month.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      // Get all week numbers in the month
      const currentDate = new Date(startDate)
      const weekSet = new Set<string>()
      const yearSet = new Set<number>()

      while (currentDate <= endDate) {
        weekSet.add(getWeekNumber(currentDate))
        yearSet.add(currentDate.getFullYear())
        currentDate.setDate(currentDate.getDate() + 1)
      }

      weekNumbers = Array.from(weekSet)
      years = Array.from(yearSet)

      where.OR = weekNumbers.flatMap(wn =>
        years.map(y => ({ weekNumber: wn, year: y }))
      )
    } else if (filters.startDate || filters.endDate) {
      const start = filters.startDate || new Date(2000, 0, 1)
      const end = filters.endDate || new Date()

      const currentDate = new Date(start)
      const weekSet = new Set<string>()
      const yearSet = new Set<number>()

      while (currentDate <= end) {
        weekSet.add(getWeekNumber(currentDate))
        yearSet.add(currentDate.getFullYear())
        currentDate.setDate(currentDate.getDate() + 7)
      }

      weekNumbers = Array.from(weekSet)
      years = Array.from(yearSet)

      where.OR = weekNumbers.flatMap(wn =>
        years.map(y => ({ weekNumber: wn, year: y }))
      )
    }

    const weeklyRecords = await prisma.weeklyAttendance.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            workType: true,
            weeklyPayment: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' }
      ]
    })

    // Transform weekly records to daily records
    const dailyRecords: any[] = []
    const dayFields = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOffsets = [0, 1, 2, 3, 4, 5] // Days from Monday

    weeklyRecords.forEach(record => {
      dayFields.forEach((dayField, index) => {
        const attendanceType = record[dayField as keyof typeof record] as AttendanceType

        // Skip if filtering by status and doesn't match
        if (filters.status && filters.status !== 'ABSENCE' && attendanceType !== filters.status) {
          return
        }
        if (filters.status === 'ABSENCE' && attendanceType !== 'ABSENCE') {
          return
        }

        // Calculate the actual date for this day using the unified getWeekDates function
        const weekDates = getWeekDates(record.weekNumber, record.year)
        const date = weekDates[index]

        const dailyRate = calculateDailyRate(record.worker.weeklyPayment)
        const payment = calculatePayment(dailyRate, attendanceType)

        dailyRecords.push({
          id: `${record.id}-${dayField}`,
          workerId: record.workerId,
          date,
          type: attendanceType,
          weekNumber: record.weekNumber,
          year: record.year,
          worker: record.worker,
          payment
        })
      })
    })

    // Sort by date descending
    dailyRecords.sort((a, b) => b.date.getTime() - a.date.getTime())

    return { success: true, attendance: dailyRecords }
  } catch (error) {
    console.error("Error fetching attendance history:", error)
    return { success: false, error: "Failed to fetch attendance history" }
  }
}

// Get weekly summary for all workers (useful for payment reports)
export async function getWeeklySummary(weekNumber: string, year: number, workType?: WorkType) {
  try {
    const where: any = {
      weekNumber,
      year
    }

    if (workType) {
      where.worker = { workType }
    }

    const attendance = await prisma.weeklyAttendance.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            weeklyPayment: true,
            workType: true // Make sure this is included
          }
        }
      },
      orderBy: {
        worker: {
          fullName: 'asc'
        }
      }
    })

    // Calculate payments for each record
    const workersWithPayments = attendance.map(record => {
      const dailyRate = calculateDailyRate(record.worker.weeklyPayment)

      const mondayPay = calculatePayment(dailyRate, record.monday)
      const tuesdayPay = calculatePayment(dailyRate, record.tuesday)
      const wednesdayPay = calculatePayment(dailyRate, record.wednesday)
      const thursdayPay = calculatePayment(dailyRate, record.thursday)
      const fridayPay = calculatePayment(dailyRate, record.friday)
      const saturdayPay = calculatePayment(dailyRate, record.saturday)

      const weeklyTotal = mondayPay + tuesdayPay + wednesdayPay + thursdayPay + fridayPay + saturdayPay

      return {
        workerId: record.workerId,
        workerName: record.worker.fullName,
        weeklyPayment: record.worker.weeklyPayment,
        workType: record.worker.workType, // This is crucial
        attendance: {
          monday: record.monday,
          tuesday: record.tuesday,
          wednesday: record.wednesday,
          thursday: record.thursday,
          friday: record.friday,
          saturday: record.saturday
        },
        payments: {
          monday: mondayPay,
          tuesday: tuesdayPay,
          wednesday: wednesdayPay,
          thursday: thursdayPay,
          friday: fridayPay,
          saturday: saturdayPay,
          weeklyTotal
        },
        amountToPay: weeklyTotal
      }
    })

    const totalAmount = workersWithPayments.reduce((sum, worker) => sum + worker.amountToPay, 0)

    const summary = {
      weekNumber,
      year,
      workType,
      workers: workersWithPayments,
      totalAmount
    }

    return { success: true, summary }
  } catch (error) {
    console.error("Error fetching weekly summary:", error)
    return { success: false, error: "Failed to fetch weekly summary" }
  }
}

// Add this function to get clients count
export async function getClientsCount() {
  try {
    const count = await prisma.client.count()
    return { success: true, data: count }
  } catch (error) {
    console.error("Error fetching clients count:", error)
    return { success: false, error: "فشل في جلب عدد العملاء" }
  }
}