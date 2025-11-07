"use server"

import { prisma } from "@/lib/db"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"

export type ProductTransferItem = {
  productId: number
  quantity: number
  name: string
  price: number
  image?: string
}

export type CreateProductTransferInput = {
  deliveryCompany: string
  trackingNumber?: string
  note?: string
  items: ProductTransferItem[]
}

async function generateTransferCode(): Promise<string> {
  const latestTransfer = await prisma.productTransfer.findFirst({
    orderBy: { id: "desc" },
    select: { transferCode: true },
  })

  let nextNumber = 1

  if (latestTransfer?.transferCode) {
    const match = latestTransfer.transferCode.match(/PT(\d+)/)
    if (match) {
      nextNumber = Number.parseInt(match[1]) + 1
    }
  }

  return `PT${nextNumber.toString().padStart(5, "0")}`
}

export async function createProductTransfer(input: CreateProductTransferInput) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "يجب إضافة منتج واحد على الأقل" }
    }

    const transferCode = await generateTransferCode()

    const transfer = await prisma.productTransfer.create({
      data: {
        transferCode,
        merchantId: merchant.id,
        deliveryCompany: input.deliveryCompany,
        trackingNumber: input.trackingNumber || null,
        note: input.note || null,
        status: "PENDING",
        transferItems: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        transferItems: {
          include: {
            product: true,
          },
        },
      },
    })

    revalidateTag(`merchant-transfers-${merchant.id}`)
    revalidateTag(`merchant-products-${merchant.id}`)

    return {
      success: true,
      data: transfer,
      message: `تم إنشاء الشحنة بنجاح - رقم التتبع: ${transferCode}`,
    }
  } catch (error) {
    console.error("Error creating product transfer:", error)
    return { success: false, error: "فشل في إنشاء الشحنة" }
  }
}

export async function createProduct(data: {
  name: string
  description?: string
  image?: string
  sku?: string
  price: number
  stockQuantity: number
}) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const product = await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        description: data.description || null,
        image: data.image || null,
        sku: data.sku || null,
        price: data.price,
        stockQuantity: 0,
        isActive: true,
      },
    })

    revalidateTag(`merchant-products-${merchant.id}`)

    return { success: true, data: product }
  } catch (error) {
    console.error("Error creating product:", error)
    return { success: false, error: "فشل في إنشاء المنتج" }
  }
}

export async function getMerchantProducts() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const products = await prisma.product.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: products }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { success: false, error: "فشل في جلب المنتجات" }
  }
}

export async function getMerchantTransfers() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const transfers = await prisma.productTransfer.findMany({
      where: { merchantId: merchant.id },
      include: {
        transferItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: transfers }
  } catch (error) {
    console.error("Error fetching transfers:", error)
    return { success: false, error: "فشل في جلب الشحنات" }
  }
}


export async function getProductDetails(productId: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        merchantId: merchant.id,
      },
      include: {
        TransferItem: {
          include: {
            transfer: true,
          },
          orderBy: {
            transfer: {
              createdAt: "desc",
            },
          },
        },
        orderItems: {
          include: {
            order: true,
          },
          orderBy: {
            order: {
              createdAt: "desc",
            },
          },
        },
      },
    })

    if (!product) {
      return { success: false, error: "المنتج غير موجود" }
    }

    return { success: true, data: product }
  } catch (error) {
    console.error("Error fetching product details:", error)
    return { success: false, error: "فشل في جلب تفاصيل المنتج" }
  }
}

export async function getInventoryStats() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const products = await prisma.product.findMany({
      where: { merchantId: merchant.id },
    })

    const stats = {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.isActive).length,
      totalStockQuantity: products.reduce((sum, p) => sum + p.stockQuantity, 0),
      totalInventoryValue: products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0),
      lowStockProducts: products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert).length,
      outOfStockProducts: products.filter((p) => p.stockQuantity === 0).length,
      totalDeliveredItems: products.reduce((sum, p) => sum + p.deliveredCount, 0),
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error("Error fetching inventory stats:", error)
    return { success: false, error: "فشل في جلب إحصائيات المخزون" }
  }
}
