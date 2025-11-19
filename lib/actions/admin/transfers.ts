"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getAllProductTransfers() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const transfers = await prisma.productTransfer.findMany({
      include: {
        merchant: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        transferItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: transfers }
  } catch (error) {
    console.error("[v0] Error fetching transfers:", error)
    return { success: false, error: "حدث خطأ أثناء جلب الشحنات" }
  }
}

export async function updateTransferStatus(
  transferId: number,
  newStatus: "PENDING" | "IN_TRANSIT" | "DELIVERED_TO_WAREHOUSE" | "CANCELLED"
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
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

    const result = await prisma.$transaction(async (tx) => {
      const updatedTransfer = await tx.productTransfer.update({
        where: { id: transferId },
        data: {
          status: newStatus,
          shippedAt: newStatus === "IN_TRANSIT" ? new Date() : transfer.shippedAt,
          deliveredToWarehouseAt:
            newStatus === "DELIVERED_TO_WAREHOUSE" ? new Date() : transfer.deliveredToWarehouseAt,
        },
        include: {
          merchant: {
            include: {
              user: true,
            },
          },
          transferItems: {
            include: {
              product: true,
            },
          },
        },
      })

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

    revalidatePath("/admin/transfers")
    revalidatePath("/admin/garage")

    return {
      success: true,
      data: result,
      message: `تم تحديث حالة الشحنة بنجاح${newStatus === "DELIVERED_TO_WAREHOUSE" ? " وتم تحديث المخزون" : ""}`,
    }
  } catch (error) {
    console.error("[v0] Error updating transfer status:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث الشحنة" }
  }
}

export async function getGarageInventory() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const products = await prisma.product.findMany({
      where: {
        stockQuantity: {
          gt: 0,
        },
      },
      include: {
        merchant: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        TransferItem: {
          where: {
            transfer: {
              status: "DELIVERED_TO_WAREHOUSE",
            },
          },
          orderBy: {
            transfer: {
              deliveredToWarehouseAt: "desc",
            },
          },
          take: 1,
          include: {
            transfer: true,
          },
        },
      },
      orderBy: [
        { merchant: { companyName: "asc" } },
        { name: "asc" },
      ],
    })

    return { success: true, data: products }
  } catch (error) {
    console.error("[v0] Error fetching garage inventory:", error)
    return { success: false, error: "حدث خطأ أثناء جلب مخزون المستودع" }
  }
}
