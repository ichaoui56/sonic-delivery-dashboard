"use server"

import { prisma } from "@/lib/db"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { cache } from "react"


export type ProductTransferItem = {
  productId: number
  quantity: number
  name: string
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

export const getMerchantProducts = cache(async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'غير مصرح' };

    const userId = parseInt(session.user.id);
    
    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!merchant) return { success: false, error: 'التاجر غير موجود' };

    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        deliveredCount: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        image: true,
        sku: true,
        stockQuantity: true,
      },
      orderBy: { name: 'asc' },
      take: 100,
    });

    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'فشل في جلب المنتجات' };
  }
});

export const getMerchantTransfers = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
      select: { id: true },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const transfers = await prisma.productTransfer.findMany({
      where: { merchantId: merchant.id },
      select: {
        id: true,
        transferCode: true,
        deliveryCompany: true,
        trackingNumber: true,
        note: true,
        status: true,
        shippedAt: true,
        deliveredToWarehouseAt: true,
        createdAt: true,
        updatedAt: true,
        transferItems: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return { success: true, data: transfers }
  } catch (error) {
    console.error("Error fetching transfers:", error)
    return { success: false, error: "فشل في جلب الشحنات" }
  }
})

export async function updateTransferStatus(
  transferId: number,
  newStatus: "PENDING" | "IN_TRANSIT" | "DELIVERED_TO_WAREHOUSE" | "CANCELLED",
) {
  try {
    console.log("[v0] Starting updateTransferStatus:", { transferId, newStatus })

    const session = await auth()

    if (!session?.user) {
      console.log("[v0] No session found")
      return { success: false, error: "غير مصرح" }
    }

    console.log("[v0] User session:", { userId: session.user.id, role: session.user.role })

    // Get transfer with items and merchant
    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        transferItems: {
          include: {
            product: true,
          },
        },
        merchant: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!transfer) {
      console.log("[v0] Transfer not found")
      return { success: false, error: "الشحنة غير موجودة" }
    }

    console.log("[v0] Transfer found:", {
      transferCode: transfer.transferCode,
      currentStatus: transfer.status,
      merchantId: transfer.merchantId,
      merchantUserId: transfer.merchant.userId,
      itemsCount: transfer.transferItems.length,
    })

    // Check authorization
    const isAdmin = session.user.role === "ADMIN"
    const isMerchantOwner =
      session.user.role === "MERCHANT" && transfer.merchant.userId === Number.parseInt(session.user.id)

    console.log("[v0] Authorization check:", { isAdmin, isMerchantOwner })

    if (!isAdmin && !isMerchantOwner) {
      console.log("[v0] User not authorized")
      return { success: false, error: "غير مصرح بتحديث هذه الشحنة" }
    }

    // Prevent updating from final states
    if (transfer.status === "DELIVERED_TO_WAREHOUSE" || transfer.status === "CANCELLED") {
      console.log("[v0] Transfer already in final state")
      return { success: false, error: "لا يمكن تحديث شحنة تم تسليمها أو إلغاؤه" }
    }

    // Start transaction
    console.log("[v0] Starting transaction...")
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

      console.log("[v0] Transfer status updated successfully to:", newStatus)

      // Update stock if delivered
      if (newStatus === "DELIVERED_TO_WAREHOUSE") {
        console.log("[v0] Updating stock for", transfer.transferItems.length, "items...")

        for (const item of transfer.transferItems) {
          console.log("[v0] Processing item:", {
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            currentStock: item.product.stockQuantity,
            currentDelivered: item.product.deliveredCount,
          })

          const updatedProduct = await tx.product.update({
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

          console.log("[v0] Product updated successfully:", {
            productId: item.productId,
            productName: item.product.name,
            addedQuantity: item.quantity,
            newStockQuantity: updatedProduct.stockQuantity,
            newDeliveredCount: updatedProduct.deliveredCount,
          })
        }

        console.log("[v0] All products updated successfully")
      }

      return updatedTransfer
    })

    console.log("[v0] Transaction completed successfully")

    // Revalidate caches
    revalidateTag(`merchant-transfers-${transfer.merchantId}`)
    revalidateTag(`merchant-products-${transfer.merchantId}`)
    console.log("[v0] Cache revalidated")

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
    console.error("[v0] Error in updateTransferStatus:", error)
    console.error("[v0] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
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

export const getInventoryStats = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "غير مصرح" }

    const userId = Number.parseInt(session.user.id)

    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    const [stats] = await prisma.$queryRaw<
      Array<{
        totalProducts: number
        activeProducts: number
        totalStockQuantity: number
        totalDeliveredItems: number
        lowStockProducts: number
        outOfStockProducts: number
      }>
    >`
      SELECT 
        COUNT(*) as "totalProducts",
        COUNT(CASE WHEN "isActive" = true THEN 1 END) as "activeProducts",
        COALESCE(SUM("stockQuantity"), 0) as "totalStockQuantity",
        COALESCE(SUM("deliveredCount"), 0) as "totalDeliveredItems",
        COUNT(CASE WHEN "stockQuantity" > 0 AND "stockQuantity" <= "lowStockAlert" THEN 1 END) as "lowStockProducts",
        COUNT(CASE WHEN "stockQuantity" = 0 THEN 1 END) as "outOfStockProducts"
      FROM "Product"
      WHERE "merchantId" = ${merchant.id} AND "deliveredCount" > 0
    `

    return {
      success: true,
      data: {
        totalProducts: Number(stats.totalProducts),
        activeProducts: Number(stats.activeProducts),
        totalStockQuantity: Number(stats.totalStockQuantity),
        totalDeliveredItems: Number(stats.totalDeliveredItems),
        lowStockProducts: Number(stats.lowStockProducts),
        outOfStockProducts: Number(stats.outOfStockProducts),
        totalInventoryValue: 0,
      },
    }
  } catch (error) {
    console.error("Error fetching inventory stats:", error)
    return { success: false, error: "فشل في جلب إحصائيات المخزون" }
  }
})

export async function updateProductInfo(
  productId: number,
  data: {
    name?: string
    description?: string
    image?: string
    sku?: string
    lowStockAlert?: number
  },
) {
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

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { merchantId: true },
    })

    if (!product || product.merchantId !== merchant.id) {
      return { success: false, error: "المنتج غير موجود أو غير مصرح به" }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.image !== undefined) updateData.image = data.image
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.lowStockAlert !== undefined) updateData.lowStockAlert = data.lowStockAlert

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    })

    revalidateTag(`merchant-products-${merchant.id}`)

    return { success: true, data: updatedProduct, message: "تم تحديث المنتج بنجاح" }
  } catch (error) {
    console.error("Error updating product:", error)
    return { success: false, error: "فشل في تحديث المنتج" }
  }
}

export async function deleteProductTransfer(transferId: number) {
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

    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        merchant: true,
        transferItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!transfer) {
      return { success: false, error: "الشحنة غير موجودة" }
    }

    // Check if transfer belongs to merchant
    if (transfer.merchantId !== merchant.id) {
      return { success: false, error: "غير مصرح بحذف هذه الشحنة" }
    }

    // Only allow deletion of PENDING transfers
    if (transfer.status !== "PENDING") {
      return { success: false, error: "لا يمكن حذف شحنة تم شحنها أو تسليمها" }
    }

    await prisma.$transaction(async (tx) => {
      const productsToDelete: number[] = []
      const productsToUpdate: { id: number; quantity: number }[] = []

      // Process each product in the transfer
      for (const item of transfer.transferItems) {
        // Check if this product appears in any other transfers
        const otherTransferItems = await tx.transferItem.count({
          where: {
            productId: item.productId,
            transferId: {
              not: transferId,
            },
          },
        })

        if (otherTransferItems === 0) {
          // Product only exists in this transfer, mark for deletion
          productsToDelete.push(item.productId)
        } else if (transfer.status === "DELIVERED_TO_WAREHOUSE") {
          // Product exists in other transfers and was delivered, mark for stock adjustment
          productsToUpdate.push({ id: item.productId, quantity: item.quantity })
        }
        // If status is PENDING and product exists elsewhere, no stock adjustment needed
      }

      await tx.transferItem.deleteMany({
        where: { transferId },
      })

      for (const productId of productsToDelete) {
        await tx.product.delete({
          where: { id: productId },
        })
      }

      for (const { id, quantity } of productsToUpdate) {
        await tx.product.update({
          where: { id },
          data: {
            stockQuantity: {
              decrement: quantity,
            },
            deliveredCount: {
              decrement: quantity,
            },
          },
        })
      }

      // Delete transfer
      await tx.productTransfer.delete({
        where: { id: transferId },
      })
    })

    revalidateTag(`merchant-transfers-${merchant.id}`)
    revalidateTag(`merchant-products-${merchant.id}`)

    return {
      success: true,
      message: "تم حذف الشحنة بنجاح",
    }
  } catch (error) {
    console.error("Error deleting product transfer:", error)
    return { success: false, error: "فشل في حذف الشحنة" }
  }
}

export async function updateProductTransfer(
  transferId: number,
  data: {
    deliveryCompany?: string
    trackingNumber?: string
    note?: string
    items?: ProductTransferItem[]
  },
) {
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

    // Get transfer to verify ownership and status
    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        merchant: true,
        transferItems: true,
      },
    })

    if (!transfer) {
      return { success: false, error: "الشحنة غير موجودة" }
    }

    // Check if transfer belongs to merchant
    if (transfer.merchantId !== merchant.id) {
      return { success: false, error: "غير مصرح بتحديث هذه الشحنة" }
    }

    // Only allow updating PENDING transfers
    if (transfer.status !== "PENDING") {
      return { success: false, error: "لا يمكن تحديث شحنة تم شحنها أو تسليمها" }
    }

    // Update transfer
    const updatedTransfer = await prisma.$transaction(async (tx) => {
      // Update basic transfer info
      const updated = await tx.productTransfer.update({
        where: { id: transferId },
        data: {
          deliveryCompany: data.deliveryCompany !== undefined ? data.deliveryCompany : transfer.deliveryCompany,
          trackingNumber: data.trackingNumber !== undefined ? data.trackingNumber : transfer.trackingNumber,
          note: data.note !== undefined ? data.note : transfer.note,
          updatedAt: new Date(),
        },
      })

      // If items are provided, update them
      if (data.items && data.items.length > 0) {
        // Delete existing items
        await tx.transferItem.deleteMany({
          where: { transferId },
        })

        // Create new items
        await tx.transferItem.createMany({
          data: data.items.map((item) => ({
            transferId,
            productId: item.productId,
            quantity: item.quantity,
          })),
        })
      }

      return updated
    })

    revalidateTag(`merchant-transfers-${merchant.id}`)

    return {
      success: true,
      data: updatedTransfer,
      message: "تم تحديث الشحنة بنجاح",
    }
  } catch (error) {
    console.error("Error updating product transfer:", error)
    return { success: false, error: "فشل في تحديث الشحنة" }
  }
}

// Add this new function in your server actions
export const getMerchantProductsForTransfer = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "غير مصرح" }

    const userId = Number.parseInt(session.user.id)

    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        deliveredCount: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        image: true,
        sku: true,
        stockQuantity: true,
      },
      orderBy: { name: "asc" },
      take: 100,
    })

    return { success: true, data: products }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { success: false, error: "فشل في جلب المنتجات" }
  }
})