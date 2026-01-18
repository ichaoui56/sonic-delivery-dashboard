"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export async function getDeliveryMen() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.ADMIN) {
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
        city: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true
          }
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

    // Transform data to include city name for backward compatibility
    const transformedDeliveryMen = deliveryMen.map(dm => ({
      ...dm,
      city: (dm as any).city?.name || null, // Add city name for compatibility
      cityId: dm.cityId || (dm as any).city?.id || null
    }))

    return { success: true, data: transformedDeliveryMen }
  } catch (error) {
    console.error("[v0] Error fetching delivery men:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getDeliveryManById(id: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id },
      include: {
        user: true,
        city: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        assignedOrders: {
          include: {
            merchant: {
              include: {
                user: true,
              },
            },
            city: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!deliveryMan) {
      return { success: false, error: "موظف التوصيل غير موجود" }
    }

    // Transform data to include city name for backward compatibility
    const transformedDeliveryMan = {
      ...deliveryMan,
      city: deliveryMan.city?.name || null, // Add city name for compatibility
      cityId: deliveryMan.city?.id || null
    }

    return { success: true, data: transformedDeliveryMan }
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
  cityId: number | null // Changed from city string to cityId
  baseFee: number
  active: boolean
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return { success: false, error: "غير مصرح" }
    }

    // Validate email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" }
    }

    // Validate city exists if provided
    if (data.cityId) {
      const cityExists = await prisma.city.findUnique({
        where: { id: data.cityId, isActive: true }
      })

      if (!cityExists) {
        return { success: false, error: "المدينة غير موجودة أو غير نشطة" }
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user first, then delivery man in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          role: Role.DELIVERYMAN,
          image: data.image,
        },
      })

      // Create the delivery man with the user ID
      const deliveryMan = await tx.deliveryMan.create({
        data: {
          userId: user.id,
          vehicleType: data.vehicleType,
          cityId: data.cityId, // Use cityId instead of city string
          baseFee: data.baseFee,
          active: data.active,
        },
        include: {
          user: true,
          city: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          _count: {
            select: {
              assignedOrders: true,
            },
          },
        },
      })

      return deliveryMan
    })

    // Transform data to include city name for backward compatibility
    const transformedDeliveryMan = {
      ...result,
      city: (result as any).city?.name || null, // Add city name for compatibility
      cityId: result.cityId || (result as any).city?.id || null
    }

    return { success: true, data: transformedDeliveryMan }
  } catch (error) {
    console.error("[v0] Error creating delivery man:", error)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" }
    }
    return { success: false, error: "حدث خطأ أثناء إنشاء موظف التوصيل" }
  }
}

export async function updateDeliveryMan(deliveryManId: number, data: {
  name: string
  email: string
  phone: string | null
  image: string | null
  vehicleType: string | null
  cityId: number | null // Changed from city string to cityId
  active: boolean
  baseFee: number
  newPassword?: string | null
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return { success: false, error: "غير مصرح" }
    }

    // Check if email already exists (excluding current delivery man)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        deliveryMan: {
          id: { not: deliveryManId }
        }
      }
    })

    if (existingUser) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" }
    }

    // Validate city exists if provided
    if (data.cityId) {
      const cityExists = await prisma.city.findUnique({
        where: { id: data.cityId, isActive: true }
      })

      if (!cityExists) {
        return { success: false, error: "المدينة غير موجودة أو غير نشطة" }
      }
    }

    const passwordUpdate = data.newPassword ? await bcrypt.hash(data.newPassword, 10) : null

    // First, get the user ID for this delivery man
    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id: deliveryManId },
      select: { userId: true }
    })

    if (!deliveryMan) {
      return { success: false, error: "موظف التوصيل غير موجود" }
    }

    // Update user and delivery man in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: deliveryMan.userId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          image: data.image,
          ...(passwordUpdate ? { password: passwordUpdate } : {}),
        },
      })

      // Update delivery man
      const updatedDeliveryMan = await tx.deliveryMan.update({
        where: { id: deliveryManId },
        data: {
          vehicleType: data.vehicleType,
          cityId: data.cityId,
          active: data.active,
          baseFee: data.baseFee,
        },
        include: {
          user: true,
          city: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          _count: {
            select: {
              assignedOrders: true,
            },
          },
        },
      })

      return updatedDeliveryMan
    })

    // Transform data to include city name for backward compatibility
    const transformedDeliveryMan = {
      ...result,
      city: result.city?.name || null, // Add city name for compatibility
      cityId: result.city?.id || null
    }

    return { success: true, data: transformedDeliveryMan }
  } catch (error) {
    console.error("[v0] Error updating delivery man:", error)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" }
    }
    return { success: false, error: "حدث خطأ أثناء تحديث البيانات" }
  }
}

export async function getDeliveryManDetails(deliveryManId: number) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return { success: false, error: "غير مصرح" }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id: deliveryManId },
      include: {
        user: true,
        city: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        assignedOrders: {
          include: {
            merchant: {
              include: {
                user: true,
              },
            },
            city: {
              select: {
                name: true,
                code: true
              }
            }
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

    // Transform data to include city name for backward compatibility
    const transformedDeliveryMan = {
      ...deliveryMan,
      city: (deliveryMan as any).city?.name || null, // Add city name for compatibility
      cityId: deliveryMan.cityId || (deliveryMan as any).city?.id || null
    }

    return { success: true, data: transformedDeliveryMan }
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
    if (!session?.user || session.user.role !== Role.ADMIN) {
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

    if (!session?.user || session.user.role !== Role.ADMIN) {
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
        city: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true
          }
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
            city: {
              select: {
                name: true,
                code: true
              }
            }
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

    // Transform city in assigned orders from object to string
    const transformedAssignedOrders = deliveryMan.assignedOrders.map(order => ({
      ...order,
      city: order.city?.name || null  // Convert city object to string
    }))

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

    // Transform data
    const transformedDeliveryMan = {
      ...deliveryMan,
      city: deliveryMan.city?.name || null, // Now just the city name string
      cityId: deliveryMan.city?.id || null,
      assignedOrders: transformedAssignedOrders, // Use transformed orders
      deliveryAttempts: deliveryAttemptsWithFlag,
      moneyTransfers
    }

    return { success: true, data: transformedDeliveryMan }
  } catch (error) {
    console.error("[v0] Error fetching delivery man detail:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

// Helper function to get delivery men statistics by city
export async function getDeliveryMenStats() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const stats = await prisma.city.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            deliveryMen: {
              where: { active: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return { success: true, data: stats }
  } catch (error) {
    console.error("[v0] Error fetching delivery men stats:", error)
    return { success: false, error: "حدث خطأ أثناء جلب الإحصائيات" }
  }
}