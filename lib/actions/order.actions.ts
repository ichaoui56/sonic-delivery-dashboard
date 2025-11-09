"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./auth-actions"

export async function createOrder(data: {
  customerName: string
  customerPhone: string
  address: string
  city: string
  note?: string
  paymentMethod: "COD" | "PREPAID"
  items: { productId: number; quantity: number; price: number }[]
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    // Calculate total price
    const totalPrice = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Get the latest order to generate next order code
    const latestOrder = await db.order.findFirst({
      orderBy: { id: "desc" },
      select: { orderCode: true },
    })

    let nextOrderNumber = 1
    if (latestOrder?.orderCode) {
      const match = latestOrder.orderCode.match(/OR(\d+)/)
      if (match) {
        nextOrderNumber = Number.parseInt(match[1]) + 1
      }
    }
    const orderCode = `OR${nextOrderNumber.toString().padStart(6, "0")}`

    // Calculate merchant earning (assuming 80% goes to merchant for COD, 100% for PREPAID)
    const merchantEarning = data.paymentMethod === "PREPAID" ? totalPrice : totalPrice * 0.8

    // Validate stock availability
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return { success: false, message: `المنتج غير موجود` }
      }

      if (product.stockQuantity < item.quantity) {
        return { success: false, message: `المخزون غير كافٍ للمنتج: ${product.name}` }
      }
    }

    // Create order with items
    const order = await db.order.create({
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
        orderItems: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
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

    // Update stock quantities
    for (const item of data.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      })
    }

    console.log("[v0] Order created successfully:", orderCode)
    revalidatePath("/merchant/orders")
    revalidatePath("/merchant/inventory")

    return { success: true, message: "تم إنشاء الطلب بنجاح", orderCode }
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    return { success: false, message: "فشل في إنشاء الطلب" }
  }
}

export async function getMerchantOrders() {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
    })

    if (!merchant) return []

    const orders = await db.order.findMany({
      where: { merchantId: merchant.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return orders
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return []
  }
}

export async function getMerchantProducts() {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
    })

    if (!merchant) return []

    const products = await db.product.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
        stockQuantity: {
          gt: 0,
        },
      },
      orderBy: { name: "asc" },
    })

    return products
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return []
  }
}
