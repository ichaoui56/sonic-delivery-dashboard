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

export async function getActiveDeliveryMen() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const deliveryMen = await prisma.deliveryMan.findMany({
      where: {
        active: true,
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { city: { name: "asc" } },
        { rating: "desc" },
        { successfulDeliveries: "desc" },
      ],
    })

    return { success: true, data: deliveryMen }
  } catch (error) {
    console.error("[v0] Error fetching delivery men:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function assignDeliveryMan(orderId: number, deliveryManId: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Check if delivery man exists and is active
    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id: deliveryManId },
      include: {
        user: true,
      },
    })

    if (!deliveryMan) {
      return { success: false, error: "الموصل غير موجود" }
    }

    if (!deliveryMan.active) {
      return { success: false, error: "الموصل غير نشط" }
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return { success: false, error: "الطلب غير موجود" }
    }

    // Update order with delivery man and change status to ASSIGNED_TO_DELIVERY
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryManId: deliveryManId,
        status: "ASSIGNED_TO_DELIVERY",
      },
      include: {
        deliveryMan: {
          include: {
            user: true,
          },
        },
      },
    })

    // Create notification for the delivery man
    await prisma.notification.create({
      data: {
        userId: deliveryMan.userId,
        title: "طلب جديد مسند إليك",
        message: `تم تعيين الطلب #${order.orderCode} لك. يرجى مراجعة التفاصيل.`,
        type: "ORDER_ASSIGNED",
        orderId: orderId,
      },
    })

    return { success: true, data: updatedOrder }
  } catch (error) {
    console.error("[v0] Error assigning delivery man:", error)
    return { success: false, error: "حدث خطأ أثناء تعيين الموصل" }
  }
}
