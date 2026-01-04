"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getAllOrders() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const orders = await prisma.order.findMany({
      include: {
        merchant: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: orders }
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getOrderById(id: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        merchant: {
          include: {
            user: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        deliveryAttemptHistory: {
          include: {
            deliveryMan: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return { success: false, error: "الطلب غير موجود" }
    }

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    })

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error updating order status:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث حالة الطلب" }
  }
}

export async function getOrderDetails(orderId: number) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          include: {
            user: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        deliveryAttemptHistory: {
          include: {
            deliveryMan: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            attemptedAt: "desc",
          },
        },
      },
    })

    if (!order) {
      return { success: false, error: "الطلب غير موجود" }
    }

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error fetching order details:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}
