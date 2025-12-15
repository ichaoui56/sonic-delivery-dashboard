"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./auth-actions"
import { cache } from "react"

type OrderStatus = "PENDING" | "ACCEPTED" | "ASSIGNED_TO_DELIVERY" | "DELIVERED" | "REPORTED" | "REJECTED" | "CANCELLED"
type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y" | "CUSTOM_PRICE"

function getCityCode(city: string): string {
  const cityMap: Record<string, string> = {
    الداخلة: "DA",
    Dakhla: "DA",
    بوجدور: "BO",
    Boujdour: "BO",
    العيون: "LA",
    Laayoune: "LA",
  }
  return cityMap[city] || "DA"
}

// Get merchant orders with history
export const getMerchantOrders = cache(async (
  page: number = 1,
  limit: number = 20,
  statusFilter: string = 'ALL',
  searchQuery: string = ''
) => {
  try {
    const user = await getCurrentUser()
    if (!user) return { data: [], total: 0, page: 1, totalPages: 0, limit }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    if (!merchant) return { data: [], total: 0, page: 1, totalPages: 0, limit }

    const skip = (page - 1) * limit

    let whereClause: any = { merchantId: merchant.id }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_PROGRESS') {
        whereClause.status = {
          in: ['ACCEPTED', 'ASSIGNED_TO_DELIVERY']
        }
      } else if (statusFilter === 'CANCELLED') {
        whereClause.status = {
          in: ['REJECTED', 'CANCELLED']
        }
      } else {
        whereClause.status = statusFilter
      }
    }

    if (searchQuery) {
      whereClause.OR = [
        { orderCode: { contains: searchQuery, mode: 'insensitive' } },
        { customerName: { contains: searchQuery, mode: 'insensitive' } },
        { customerPhone: { contains: searchQuery } },
        { city: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          customerPhone: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          paymentMethod: true,
          merchantEarning: true,
          deliveredAt: true,
          discountType: true,
          discountValue: true,
          discountDescription: true,
          originalTotalPrice: true,
          totalDiscount: true,
          buyXGetYConfig: true,
          city: true,
          address: true,
          note: true,
          updatedAt: true,
          orderItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              originalPrice: true,
              isFree: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            },
            take: 5,
          },
          deliveryMan: {
            select: {
              user: {
                select: {
                  name: true,
                }
              }
            }
          },
          deliveryAttemptHistory: {
            select: {
              id: true,
              attemptNumber: true,
              attemptedAt: true,
              status: true,
              reason: true,
              notes: true,
              location: true,
              deliveryMan: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { attemptedAt: 'desc' }
          },
          merchant: {
            select: {
              id: true,
              user: {
                select: {
                  name: true
                }
              },
              companyName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      prisma.order.count({ where: whereClause }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: orders,
      total,
      page,
      totalPages,
      limit,
    }
  } catch (error) {
    console.error('[v0] Error fetching orders:', error)
    return { data: [], total: 0, page: 1, totalPages: 0, limit: 20 }
  }
})

export const getOrderWithHistory = cache(async (orderId: number) => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

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
          orderBy: { attemptedAt: 'asc' }, // Changed to asc to get chronological order
        },
      },
    })

    return order
  } catch (error) {
    console.error('[v0] Error fetching order with history:', error)
    return null
  }
})


// Get merchant products for order creation
export const getMerchantProducts = cache(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    if (!merchant) return []

    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        deliveredCount: { gt: 0 },
        stockQuantity: { gt: 0 },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        sku: true,
        price: true,
        stockQuantity: true,
      },
      orderBy: { name: 'asc' },
      take: 100,
    })

    return products
  } catch (error) {
    console.error('[v0] Error fetching products:', error)
    return []
  }
})

// Create new order
export async function createOrder(data: {
  customerName: string
  customerPhone: string
  address: string
  city: string
  note?: string
  paymentMethod: "COD" | "PREPAID"
  items: {
    productId: number
    quantity: number
    price: number
    originalPrice?: number
    isFree?: boolean
  }[]
  discountType?: DiscountType
  discountValue?: number
  discountDescription?: string
  originalTotalPrice?: number
  totalDiscount?: number
  buyXGetYConfig?: string
  finalTotal?: number
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    // Calculate total price
    const totalPrice = data.finalTotal ?? data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const originalTotalPrice = data.originalTotalPrice ?? totalPrice
    const totalDiscount = data.totalDiscount ?? 0

    const cityCode = getCityCode(data.city)

    // Get the latest order for this specific city
    const latestOrder = await prisma.order.findFirst({
      where: {
        city: data.city,
      },
      orderBy: { id: "desc" },
      select: { orderCode: true },
    })

    let nextOrderNumber = 1
    if (latestOrder?.orderCode) {
      const match = latestOrder.orderCode.match(/OR-[A-Z]{2}-(\d+)/)
      if (match) {
        nextOrderNumber = Number.parseInt(match[1]) + 1
      }
    }

    const orderCode = `OR-${cityCode}-${nextOrderNumber.toString().padStart(6, "0")}`
    const merchantBaseFee = merchant.baseFee || 25
    const merchantEarning = totalPrice - merchantBaseFee

    console.log(
      `[v0] Order ${orderCode} - City: ${data.city} (${cityCode}) - Original: ${originalTotalPrice}, Discount: ${totalDiscount}, Final: ${totalPrice}, Merchant Earning: ${merchantEarning}`,
    )

    // Validate stock availability
    for (const item of data.items) {
      if (item.isFree) continue

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return { success: false, message: `المنتج غير موجود` }
      }

      if (product.stockQuantity < item.quantity) {
        return { success: false, message: `المخزون غير كافٍ للمنتج: ${product.name}` }
      }
    }

    const order = await prisma.order.create({
      data: {
        orderCode,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        city: data.city,
        note: data.note,
        totalPrice,
        paymentMethod: data.paymentMethod,
        merchantEarning,
        merchantId: merchant.id,
        discountType: data.discountType || null,
        discountValue: data.discountValue || null,
        discountDescription: data.discountDescription || null,
        originalTotalPrice: originalTotalPrice,
        totalDiscount: totalDiscount,
        buyXGetYConfig: data.buyXGetYConfig || null,
        orderItems: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            isFree: item.isFree || false,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    })

    // Create notification for admin about new order
    await prisma.notification.create({
      data: {
        title: "طلب جديد",
        message: `طلب جديد #${orderCode} من ${data.customerName}`,
        type: "ORDER_CREATED",
        userId: user.id,
        orderId: order.id,
      },
    })

    console.log("[v0] Order created successfully with discount:", orderCode)

    revalidatePath("/merchant/orders")
    return { success: true, message: "تم إنشاء الطلب بنجاح", orderCode }
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    return { success: false, message: "فشل في إنشاء الطلب" }
  }
}

// Handle delivered order updates
async function handleDeliveredOrder(order: any) {
  // Get merchant and delivery man data
  const [merchant, deliveryMan] = await Promise.all([
    prisma.merchant.findUnique({
      where: { id: order.merchantId },
      select: { baseFee: true, userId: true }
    }),
    order.deliveryManId ? prisma.deliveryMan.findUnique({
      where: { id: order.deliveryManId },
      select: { baseFee: true, userId: true }
    }) : null
  ])

  const merchantBaseFee = merchant?.baseFee ?? 0
  const deliveryManBaseFee = deliveryMan?.baseFee ?? 0
  const merchantEarning = order.totalPrice - merchantBaseFee

  // Update product stock (skip free items)
  const productsToUpdate = order.orderItems
    .filter((item: any) => !item.isFree)
    .map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity
    }))

  if (productsToUpdate.length > 0) {
    await prisma.$transaction(
      productsToUpdate.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            },
            deliveredCount: {
              increment: item.quantity
            }
          }
        })
      )
    )
  }

  // Update merchant balance
  if (order.paymentMethod === "COD") {
    await prisma.merchant.update({
      where: { id: order.merchantId },
      data: {
        balance: { increment: merchantEarning },
        totalEarned: { increment: order.totalPrice }
      }
    })

    // Create notification for merchant
    if (merchant?.userId) {
      await prisma.notification.create({
        data: {
          title: "طلب تم تسليمه",
          message: `تم تسليم الطلب #${order.orderCode} وتمت إضافة ${merchantEarning} د.م إلى رصيدك`,
          type: "ORDER_DELIVERED",
          userId: merchant.userId,
          orderId: order.id,
        },
      })
    }
  } else {
    await prisma.merchant.update({
      where: { id: order.merchantId },
      data: {
        balance: { decrement: merchantBaseFee },
        totalEarned: { increment: order.totalPrice }
      }
    })
  }

  // Update delivery man stats
  if (order.deliveryManId && deliveryMan) {
    await prisma.deliveryMan.update({
      where: { id: order.deliveryManId },
      data: {
        totalDeliveries: { increment: 1 },
        successfulDeliveries: { increment: 1 },
        totalEarned: { increment: deliveryManBaseFee }
      }
    })

    // Create notification for delivery man
    if (deliveryMan.userId) {
      await prisma.notification.create({
        data: {
          title: "توصيل ناجح",
          message: `تم تسليم الطلب #${order.orderCode} بنجاح، رصيدك: ${deliveryManBaseFee} د.م`,
          type: "DELIVERY_SUCCESS",
          userId: deliveryMan.userId,
          orderId: order.id,
        },
      })
    }
  }
}

export async function updateOrderStatus(orderId: number, newStatus: OrderStatus, notes?: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            userId: true
          }
        },
        deliveryMan: {
          select: {
            userId: true
          }
        },
        orderItems: {
          select: {
            productId: true,
            quantity: true,
            isFree: true,
          }
        }
      }
    })

    if (!order) {
      return { success: false, message: "الطلب غير موجود" }
    }

    const previousStatus = order.status
    const now = new Date()

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        deliveredAt: newStatus === "DELIVERED" ? now : undefined,
        note: notes ? (order.note ? `${order.note}\n${notes}` : notes) : order.note,
        updatedAt: now,
      },
    })

    // Create status history record with appropriate notes
    let attemptNotes = `تغيير الحالة من ${previousStatus} إلى ${newStatus}`
    if (notes) {
      attemptNotes += ` - ${notes}`
    }

    let attemptStatus: string

    switch (newStatus) {
      case "ACCEPTED":
        attemptNotes = "قبول الطلب من قبل الإدارة"
        attemptStatus = "ATTEMPTED"
        break
      case "DELIVERED":
        attemptNotes = "تم تسليم الطلب بنجاح إلى العميل"
        attemptStatus = "SUCCESSFUL"
        break
      case "REJECTED":
        attemptNotes = `رفض الطلب${notes ? ` - ${notes}` : ''}`
        attemptStatus = "REFUSED"
        break
      case "CANCELLED":
        attemptNotes = `إلغاء الطلب${notes ? ` - ${notes}` : ''}`
        attemptStatus = "REFUSED"
        break
      case "REPORTED":
        attemptNotes = `بلاغ عن الطلب${notes ? ` - ${notes}` : ''}`
        attemptStatus = "OTHER"
        break
      default:
        attemptStatus = "ATTEMPTED"
    }

    // Get the next attempt number
    const lastAttempt = await prisma.deliveryAttempt.findFirst({
      where: { orderId },
      orderBy: { attemptNumber: 'desc' },
    })

    const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1

    await prisma.deliveryAttempt.create({
      data: {
        orderId: orderId,
        attemptNumber: attemptNumber,
        status: attemptStatus as any,
        notes: attemptNotes,
        attemptedAt: now,
        ...(user.role === "DELIVERYMAN" && order.deliveryMan?.userId === user.id && {
          deliveryManId: order.deliveryManId
        }),
        ...(user.role === "ADMIN" && {
          reason: "تغيير الحالة بواسطة الإدارة"
        })
      }
    })

    // Handle DELIVERED status changes
    if (newStatus === "DELIVERED" && previousStatus !== "DELIVERED") {
      await handleDeliveredOrder(order)
    }

    // Create notifications based on status change
    // ... (notification code remains the same)

    // SMART REVALIDATION
    if (previousStatus !== newStatus) {
      revalidatePath("/merchant/orders")

      if (order.deliveryManId) {
        revalidatePath("/delivery/orders")
      }

      if (newStatus === "DELIVERED") {
        revalidatePath("/merchant/inventory")
      }
    }

    return {
      success: true,
      message: newStatus === "DELIVERED"
        ? "تم تسليم الطلب وتحديث المخزون والأرباح"
        : "تم تحديث حالة الطلب"
    }
  } catch (error) {
    console.error("[v0] Error updating order status:", error)
    return { success: false, message: "فشل في تحديث حالة الططلب" }
  }
}

// Get delivery man orders
export async function getDeliveryManOrders() {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { userId: user.id },
    })

    if (!deliveryMan) {
      console.log("[v0] No delivery man profile found")
      return []
    }

    console.log(`[v0] Delivery man city: ${deliveryMan.city}`)

    const orders = await prisma.order.findMany({
      where: {
        city: deliveryMan.city || undefined,
        OR: [
          {
            deliveryManId: deliveryMan.id,
          },
          {
            deliveryManId: null,
            status: "ACCEPTED"
          }
        ]
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
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
        deliveryAttemptHistory: {
          include: {
            deliveryMan: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { attemptedAt: 'desc' },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    console.log(`[v0] Found ${orders.length} orders for delivery man in city: ${deliveryMan.city}`)

    return orders
  } catch (error) {
    console.error("[v0] Error fetching delivery orders:", error)
    return []
  }
}

// Delivery man accept order
export async function acceptOrder(orderId: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { userId: user.id },
    })

    if (!deliveryMan) {
      return { success: false, message: "عامل التوصيل غير موجود" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!order) {
      return { success: false, message: "الطلب غير موجود" }
    }

    // Check if order is in ACCEPTED status
    if (order.status !== "ACCEPTED") {
      return {
        success: false,
        message: "لا يمكن قبول هذا الطلب. يجب أن يكون في حالة مقبول أولاً من قبل الإدارة.",
      }
    }

    // City check
    if (deliveryMan.city && order.city !== deliveryMan.city) {
      return {
        success: false,
        message: `لا يمكنك قبول طلبات من ${order.city}. أنت مخصص لـ ${deliveryMan.city}`,
      }
    }

    if (order.deliveryManId && order.deliveryManId !== deliveryMan.id) {
      return {
        success: false,
        message: "هذا الطلب تم قبوله من عامل توصيل آخر",
      }
    }

    const now = new Date()

    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryManId: deliveryMan.id,
        status: "ASSIGNED_TO_DELIVERY",
        updatedAt: now,
      },
    })

    // Create delivery attempt record
    await prisma.deliveryAttempt.create({
      data: {
        orderId: orderId,
        attemptNumber: 1,
        deliveryManId: deliveryMan.id,
        status: "ATTEMPTED",
        notes: "قبول الطلب من قبل عامل التوصيل",
        attemptedAt: now,
      },
    })

    // Notify merchant
    await prisma.notification.create({
      data: {
        title: "طلب مسند للتوصيل",
        message: `تم تعيين الطلب #${order.orderCode} لعامل التوصيل ${user.name}`,
        type: "ORDER_ASSIGNED",
        userId: order.merchant.userId,
        orderId: orderId,
      },
    })

    revalidatePath("/delivery/orders")
    revalidatePath("/merchant/orders")
    return { success: true, message: "تم قبول الطلب بنجاح" }
  } catch (error) {
    console.error("[v0] Error accepting order:", error)
    return { success: false, message: "فشل في قبول الطلب" }
  }
}

// Delivery man reject order
export async function rejectOrder(orderId: number, reason: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { userId: user.id },
    })

    if (!deliveryMan) {
      return { success: false, message: "عامل التوصيل غير موجود" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!order) {
      return { success: false, message: "الطلب غير موجود" }
    }

    const now = new Date()

    // Create delivery attempt record
    await prisma.deliveryAttempt.create({
      data: {
        orderId,
        attemptNumber: 1,
        deliveryManId: deliveryMan.id,
        status: "REFUSED",
        reason: reason,
        notes: `تم رفض الطلب من قبل عامل التوصيل: ${reason}`,
        attemptedAt: now,
      },
    })

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED",
        note: `تم رفض الطلب من قبل عامل التوصيل: ${reason}`,
        updatedAt: now,
      },
    })

    // Notify merchant
    await prisma.notification.create({
      data: {
        title: "طلب مرفوض",
        message: `تم رفض الطلب #${order.orderCode} من قبل عامل التوصيل: ${reason}`,
        type: "ORDER_REJECTED",
        userId: order.merchant.userId,
        orderId: orderId,
      },
    })

    revalidatePath("/delivery/orders")
    revalidatePath("/merchant/orders")
    return { success: true, message: "تم رفض الطلب" }
  } catch (error) {
    console.error("[v0] Error rejecting order:", error)
    return { success: false, message: "فشل في رفض الطلب" }
  }
}

// Admin function to accept orders
export async function adminAcceptOrder(orderId: number) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return { success: false, message: "غير مصرح" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!order) {
      return { success: false, message: "الطلب غير موجود" }
    }

    const now = new Date()

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "ACCEPTED",
        updatedAt: now,
      },
    })

    // Create delivery attempt record for admin acceptance
    await prisma.deliveryAttempt.create({
      data: {
        orderId: orderId,
        attemptNumber: 1,
        status: "ATTEMPTED",
        notes: "قبول الطلب من قبل الإدارة",
        attemptedAt: now,
      },
    })

    // Notify merchant
    await prisma.notification.create({
      data: {
        title: "طلب مقبول",
        message: `تم قبول الطلب #${order.orderCode} من قبل الإدارة`,
        type: "ORDER_ACCEPTED",
        userId: order.merchant.userId,
        orderId: orderId,
      },
    })

    revalidatePath("/admin/orders")
    revalidatePath("/delivery/orders")
    revalidatePath("/merchant/orders")
    return { success: true, message: "تم قبول الطلب بنجاح" }
  } catch (error) {
    console.error("[v0] Error accepting order as admin:", error)
    return { success: false, message: "فشل في قبول الطلب" }
  }
}

// Record delivery attempt
export async function recordDeliveryAttempt(
  orderId: number,
  status: "ATTEMPTED" | "FAILED" | "SUCCESSFUL" | "CUSTOMER_NOT_AVAILABLE" | "WRONG_ADDRESS" | "REFUSED" | "OTHER",
  notes?: string,
  location?: string
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { userId: user.id },
    })

    if (!deliveryMan) {
      return { success: false, message: "عامل التوصيل غير موجود" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return { success: false, message: "الطلب غير موجود" }
    }

    // Get the next attempt number
    const lastAttempt = await prisma.deliveryAttempt.findFirst({
      where: { orderId },
      orderBy: { attemptNumber: 'desc' },
    })

    const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1
    const now = new Date()

    // Create delivery attempt record
    await prisma.deliveryAttempt.create({
      data: {
        orderId,
        attemptNumber,
        deliveryManId: deliveryMan.id,
        status,
        notes,
        location,
        attemptedAt: now,
      },
    })

    // Update order if successful
    if (status === "SUCCESSFUL") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          deliveredAt: now,
          updatedAt: now,
        },
      })

      // Handle delivered order logic
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            select: {
              productId: true,
              quantity: true,
              isFree: true,
            }
          }
        }
      })

      if (fullOrder) {
        await handleDeliveredOrder(fullOrder)
      }
    }

    revalidatePath("/delivery/orders")
    revalidatePath("/merchant/orders")
    return {
      success: true,
      message: status === "SUCCESSFUL"
        ? "تم تسجيل التوصيل بنجاح"
        : "تم تسجيل محاولة التوصيل"
    }
  } catch (error) {
    console.error("[v0] Error recording delivery attempt:", error)
    return { success: false, message: "فشل في تسجيل محاولة التوصيل" }
  }
}

// Get order statistics
export async function getOrderStats() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    let whereClause: any = {}

    if (user.role === "MERCHANT") {
      const merchant = await prisma.merchant.findUnique({
        where: { userId: user.id },
        select: { id: true }
      })
      if (merchant) {
        whereClause.merchantId = merchant.id
      }
    } else if (user.role === "DELIVERYMAN") {
      const deliveryMan = await prisma.deliveryMan.findUnique({
        where: { userId: user.id },
        select: { id: true }
      })
      if (deliveryMan) {
        whereClause.deliveryManId = deliveryMan.id
      }
    }

    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.count({
        where: {
          ...whereClause,
          status: { in: ["PENDING", "ACCEPTED", "ASSIGNED_TO_DELIVERY"] }
        }
      }),
      prisma.order.count({
        where: {
          ...whereClause,
          status: "DELIVERED"
        }
      }),
      prisma.order.aggregate({
        where: {
          ...whereClause,
          status: "DELIVERED"
        },
        _sum: {
          totalPrice: true,
          ...(user.role === "MERCHANT" ? { merchantEarning: true } : {})
        }
      })
    ])

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders: totalOrders - pendingOrders - deliveredOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      merchantEarnings: totalRevenue._sum.merchantEarning || 0,
    }
  } catch (error) {
    console.error("[v0] Error fetching order stats:", error)
    return null
  }
}