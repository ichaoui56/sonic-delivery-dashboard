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

export async function updateTransferStatus(
  transferId: number,
  newStatus: "PENDING" | "IN_TRANSIT" | "DELIVERED_TO_WAREHOUSE" | "CANCELLED",
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "غير مصرح" }
    }

    // Get transfer with items
    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        transferItems: {
          include: {
            product: true,
          },
        },
        merchant: true,
      },
    })

    if (!transfer) {
      return { success: false, error: "الشحنة غير موجودة" }
    }

    // Only admin can update status (or merchant for their own transfers if you want)
    const isAdmin = session.user.role === "ADMIN"
    const isMerchantOwner =
      session.user.role === "MERCHANT" && transfer.merchant.userId === Number.parseInt(session.user.id)

    if (!isAdmin && !isMerchantOwner) {
      return { success: false, error: "غير مصرح بتحديث هذه الشحنة" }
    }

    // Prevent updating from DELIVERED_TO_WAREHOUSE or CANCELLED
    if (transfer.status === "DELIVERED_TO_WAREHOUSE" || transfer.status === "CANCELLED") {
      return { success: false, error: "لا يمكن تحديث شحنة تم تسليمها أو إلغاؤها" }
    }

    // Start transaction to update status and stock
    const result = await prisma.$transaction(async (tx) => {
      // Update transfer status
      const updatedTransfer = await tx.productTransfer.update({
        where: { id: transferId },
        data: {
          status: newStatus,
          shippedAt: newStatus === "IN_TRANSIT" ? new Date() : transfer.shippedAt,
          deliveredToWarehouseAt: newStatus === "DELIVERED_TO_WAREHOUSE" ? new Date() : transfer.deliveredToWarehouseAt,
          updatedAt: new Date(),
        },
        include: {
          transferItems: {
            include: {
              product: true,
            },
          },
        },
      })

      // If delivered to warehouse, update product stock quantities
      if (newStatus === "DELIVERED_TO_WAREHOUSE") {
        for (const item of transfer.transferItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
              deliveredCount: {
                increment: item.quantity,
              },
            },
          })
        }
      }

      return updatedTransfer
    })

    // Revalidate caches
    revalidateTag(`merchant-transfers-${transfer.merchantId}`)
    revalidateTag(`merchant-products-${transfer.merchantId}`)

    const statusMessages = {
      PENDING: "معلق",
      IN_TRANSIT: "قيد الشحن",
      DELIVERED_TO_WAREHOUSE: "تم التسليم للمستودع",
      CANCELLED: "ملغي",
    }

    return {
      success: true,
      data: result,
      message: `تم تحديث حالة الشحنة إلى: ${statusMessages[newStatus]}${newStatus === "DELIVERED_TO_WAREHOUSE" ? " وتم تحديث المخزون تلقائياً" : ""}`,
    }
  } catch (error) {
    console.error("Error updating transfer status:", error)
    return { success: false, error: "فشل في تحديث حالة الشحنة" }
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
