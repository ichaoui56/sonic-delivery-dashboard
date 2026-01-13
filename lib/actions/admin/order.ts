"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"


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


export async function getAllOrders(filters?: {
  // Delivery date filters
  deliveryDateSpecific?: string;
  deliveryStartDate?: string;
  deliveryEndDate?: string;
  
  // Creation date filters
  creationDateSpecific?: string;
  creationStartDate?: string;
  creationEndDate?: string;
  
  // Other filters
  city?: string;
  status?: string;
  paymentMethod?: string;
  searchTerm?: string;
}) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Build where clause for filtering
    const whereClause: any = {}
    
    // Search term filtering (search in multiple fields)
    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      whereClause.OR = [
        { orderCode: { contains: searchTerm, mode: 'insensitive' } },
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { customerPhone: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        {
          merchant: {
            user: {
              name: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        },
        {
          deliveryMan: {
            user: {
              name: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        }
      ]
    }
    
    // Delivery date filtering
    if (filters?.deliveryDateSpecific) {
      const specificDate = new Date(filters.deliveryDateSpecific)
      const nextDay = new Date(specificDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      if (whereClause.AND) {
        whereClause.AND.push({ delivery_date: {
          gte: specificDate,
          lt: nextDay
        }})
      } else {
        whereClause.delivery_date = {
          gte: specificDate,
          lt: nextDay
        }
      }
    } else if (filters?.deliveryStartDate || filters?.deliveryEndDate) {
      const deliveryDateFilter: any = {}
      
      if (filters.deliveryStartDate) {
        deliveryDateFilter.gte = new Date(filters.deliveryStartDate)
      }
      
      if (filters.deliveryEndDate) {
        const endDate = new Date(filters.deliveryEndDate)
        endDate.setDate(endDate.getDate() + 1)
        deliveryDateFilter.lt = endDate
      }
      
      if (whereClause.AND) {
        whereClause.AND.push({ delivery_date: deliveryDateFilter })
      } else {
        whereClause.delivery_date = deliveryDateFilter
      }
    }

    // Creation date filtering
    if (filters?.creationDateSpecific) {
      const specificDate = new Date(filters.creationDateSpecific)
      const nextDay = new Date(specificDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      if (whereClause.AND) {
        whereClause.AND.push({ createdAt: {
          gte: specificDate,
          lt: nextDay
        }})
      } else {
        whereClause.createdAt = {
          gte: specificDate,
          lt: nextDay
        }
      }
    } else if (filters?.creationStartDate || filters?.creationEndDate) {
      const createdAtFilter: any = {}
      
      if (filters.creationStartDate) {
        createdAtFilter.gte = new Date(filters.creationStartDate)
      }
      
      if (filters.creationEndDate) {
        const endDate = new Date(filters.creationEndDate)
        endDate.setDate(endDate.getDate() + 1)
        createdAtFilter.lt = endDate
      }
      
      if (whereClause.AND) {
        whereClause.AND.push({ createdAt: createdAtFilter })
      } else {
        whereClause.createdAt = createdAtFilter
      }
    }

    // City filtering
    if (filters?.city && filters.city !== "all") {
      if (whereClause.AND) {
        whereClause.AND.push({ city: { name: filters.city } })
      } else {
        whereClause.city = { name: filters.city }
      }
    }

    // Status filtering
    if (filters?.status && filters.status !== "all") {
      if (whereClause.AND) {
        whereClause.AND.push({ status: filters.status })
      } else {
        whereClause.status = filters.status
      }
    }

    // Payment method filtering
    if (filters?.paymentMethod && filters.paymentMethod !== "all") {
      if (whereClause.AND) {
        whereClause.AND.push({ paymentMethod: filters.paymentMethod })
      } else {
        whereClause.paymentMethod = filters.paymentMethod
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
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
        city: {
          select: {
            name: true,
            code: true
          }
        }
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

// Add this new function for updating delivery date
export async function updateOrderDeliveryDate(orderId: number, deliveryDate: Date, reason?: string) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Get current order to save previous date
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!currentOrder) {
      return { success: false, error: "الطلب غير موجود" }
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        previous_delivery_date: currentOrder.delivery_date,
        delivery_date: deliveryDate,
        delay_reason: reason || null,
        updatedAt: new Date(),
      },
    })

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error updating delivery date:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث تاريخ التوصيل" }
  }
}

// Update assignDeliveryMan to set delivery_date
export async function assignDeliveryMan(orderId: number, deliveryManId: number, deliveryDate?: Date) {
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

    // Use provided date or default to tomorrow
    const defaultDeliveryDate = new Date()
    defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 1)
    const finalDeliveryDate = deliveryDate || defaultDeliveryDate

    // Update order with delivery man, date, and change status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryManId: deliveryManId,
        delivery_date: finalDeliveryDate,
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
        message: `تم تعيين الطلب #${order.orderCode} لك. تاريخ التوصيل: ${finalDeliveryDate.toLocaleDateString()}`,
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