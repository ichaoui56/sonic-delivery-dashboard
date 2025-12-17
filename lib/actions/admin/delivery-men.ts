"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getDeliveryMen() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const deliveryMen = await prisma.deliveryMan.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        _count: {
          select: {
            assignedOrders: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: deliveryMen }
  } catch (error) {
    console.error("[v0] Error fetching delivery men:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getDeliveryManById(id: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id },
      include: {
        user: true,
        assignedOrders: {
          include: {
            merchant: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!deliveryMan) {
      return { success: false, error: "موظف التوصيل غير موجود" }
    }

    return { success: true, data: deliveryMan }
  } catch (error) {
    console.error("[v0] Error fetching delivery man:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function createDeliveryMan(data: {
  name: string
  email: string
  phone: string | null
  password: string
  image: string | null
  vehicleType: string | null
  city: string | null
  baseFee: number
  active: boolean
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const deliveryMan = await prisma.deliveryMan.create({
      data: {
        vehicleType: data.vehicleType,
        city: data.city,
        baseFee: data.baseFee,
        active: data.active,
        user: {
          create: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            role: "DELIVERYMAN",
            image: data.image,
          },
        },
      },
      include: {
        user: true,
        _count: {
          select: {
            assignedOrders: true,
          },
        },
      },
    })

    return { success: true, data: deliveryMan }
  } catch (error) {
    console.error("[v0] Error creating delivery man:", error)
    return { success: false, error: "حدث خطأ أثناء إنشاء موظف التوصيل" }
  }
}

export async function updateDeliveryMan(deliveryManId: number, data: {
  name: string
  email: string
  phone: string | null
  image: string | null
  vehicleType: string | null
  city: string | null
  active: boolean
  baseFee: number
  newPassword?: string | null
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const passwordUpdate = data.newPassword ? await bcrypt.hash(data.newPassword, 10) : null

    const deliveryMan = await prisma.deliveryMan.update({
      where: { id: deliveryManId },
      data: {
        vehicleType: data.vehicleType,
        city: data.city,
        active: data.active,
        baseFee: data.baseFee,
        user: {
          update: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            image: data.image,
            ...(passwordUpdate ? { password: passwordUpdate } : {}),
          },
        },
      },
      include: {
        user: true,
        _count: {
          select: {
            assignedOrders: true,
          },
        },
      },
    })

    return { success: true, data: deliveryMan }
  } catch (error) {
    console.error("[v0] Error updating delivery man:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث البيانات" }
  }
}

export async function getDeliveryManDetails(deliveryManId: number) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id: deliveryManId },
      include: {
        user: true,
        assignedOrders: {
          include: {
            merchant: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        deliveryAttempts: {
          include: {
            order: true,
          },
          orderBy: { attemptedAt: "desc" },
        },
        _count: {
          select: {
            assignedOrders: true,
          },
        },
      },
    })

    if (!deliveryMan) {
      return { success: false, error: "موظف التوصيل غير موجود" }
    }

    return { success: true, data: deliveryMan }
  } catch (error) {
    console.error("[v0] Error fetching delivery man details:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function addDeliveryManPayment(deliveryManId: number, data: {
  amount: number
  reference: string | null
  note: string | null
  invoiceImage: string | null
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    console.log("[v0] Adding delivery man payment:", { deliveryManId, data })

    const transfer = await prisma.$transaction(async (tx) => {
      console.log("[v0] Creating money transfer in database...")
      const moneyTransfer = await tx.moneyTransfer.create({
        data: {
          deliveryManId: deliveryManId,
          amount: data.amount,
          reference: data.reference,
          note: data.note,
          invoiceImage: data.invoiceImage,
        },
      })
      console.log("[v0] Money transfer created:", moneyTransfer)

      console.log("[v0] Updating delivery man totalEarned...")
      await tx.deliveryMan.update({
        where: { id: deliveryManId },
        data: {
          totalEarned: {
            decrement: data.amount,
          },
        },
      })
      console.log("[v0] Delivery man totalEarned updated")

      return moneyTransfer
    })

    console.log("[v0] Delivery man payment added successfully")
    return { success: true, data: transfer }
  } catch (error) {
    console.error("[v0] Error adding delivery man payment:", error)
    return { success: false, error: "حدث خطأ أثناء إضافة الدفعة" }
  }
}

export async function getDeliveryManDetail(id: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            createdAt: true,
          },
        },
        assignedOrders: {
          include: {
            merchant: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        deliveryAttempts: {
          include: {
            order: {
              select: {
                orderCode: true,
                customerName: true,
              },
            },
          },
          orderBy: { attemptedAt: "desc" },
          take: 20,
        },
      },
    })

    if (!deliveryMan) {
      return { success: false, error: "موظف التوصيل غير موجود" }
    }

    const deliveryAttemptsWithFlag = deliveryMan.deliveryAttempts.map((attempt: any) => ({
      ...attempt,
      wasSuccessful: attempt.status === "SUCCESSFUL",
    }))

    const moneyTransfers = await prisma.moneyTransfer.findMany({
      where: { deliveryManId: id },
      select: {
        id: true,
        amount: true,
        reference: true,
        note: true,
        invoiceImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: { ...deliveryMan, deliveryAttempts: deliveryAttemptsWithFlag, moneyTransfers } }
  } catch (error) {
    console.error("[v0] Error fetching delivery man detail:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}
