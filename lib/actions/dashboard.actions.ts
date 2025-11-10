"use server"

import db from "@/lib/db"
import { getCurrentUser } from "./auth-actions"

export async function getMerchantDashboardData() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        orders: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        products: {
          where: { isActive: true },
        },
        productTransfers: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        moneyTransfers: {
          orderBy: { transferDate: "desc" },
          take: 5,
        },
      },
    })

    if (!merchant) return null

    // Orders statistics
    const totalOrders = merchant.orders.length
    const pendingOrders = merchant.orders.filter((o) => o.status === "PENDING").length
    const deliveredOrders = merchant.orders.filter((o) => o.status === "DELIVERED").length
    const cancelledOrders = merchant.orders.filter((o) => o.status === "CANCELLED" || o.status === "REJECTED").length

    // Revenue statistics
    const totalRevenue = merchant.orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, order) => sum + order.totalPrice, 0)

    const pendingRevenue = merchant.orders
      .filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED" && o.status !== "REJECTED")
      .reduce((sum, order) => sum + order.totalPrice, 0)

    // Product statistics
    const totalProducts = merchant.products.length
    const totalStock = merchant.products.reduce((sum, p) => sum + p.stockQuantity, 0)
    const lowStockProducts = merchant.products.filter((p) => p.stockQuantity <= p.lowStockAlert).length
    const outOfStockProducts = merchant.products.filter((p) => p.stockQuantity === 0).length

    const inventoryValue = merchant.products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0)

    // Transfer statistics
    const totalTransfers = merchant.productTransfers.length
    const pendingTransfers = merchant.productTransfers.filter((t) => t.status === "PENDING").length
    const deliveredTransfers = merchant.productTransfers.filter((t) => t.status === "DELIVERED_TO_WAREHOUSE").length

    // Payment statistics
    const currentBalance = merchant.balance
    const totalPaid = merchant.moneyTransfers.reduce((sum, t) => sum + t.amount, 0)

    // Recent activity
    const recentOrders = merchant.orders.slice(0, 5)

    // Sales trend (last 7 days)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayOrders = merchant.orders.filter(
        (o) => o.createdAt >= date && o.createdAt < nextDate && o.status === "DELIVERED",
      )

      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0)

      last7Days.push({
        date: date.toLocaleDateString("ar-EG", { weekday: "short" }),
        revenue: dayRevenue,
        orders: dayOrders.length,
      })
    }

    // Best selling products
    const productSales = new Map<number, { product: any; quantity: number; revenue: number }>()

    merchant.orders
      .filter((o) => o.status === "DELIVERED")
      .forEach((order) => {
        order.orderItems.forEach((item) => {
          const current = productSales.get(item.productId) || {
            product: item.product,
            quantity: 0,
            revenue: 0,
          }
          current.quantity += item.quantity
          current.revenue += item.price * item.quantity
          productSales.set(item.productId, current)
        })
      })

    const bestSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    return {
      merchant,
      stats: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: totalRevenue,
          pending: pendingRevenue,
        },
        products: {
          total: totalProducts,
          totalStock,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          inventoryValue,
        },
        transfers: {
          total: totalTransfers,
          pending: pendingTransfers,
          delivered: deliveredTransfers,
        },
        payments: {
          currentBalance,
          totalPaid,
        },
      },
      recentOrders,
      last7Days,
      bestSellingProducts,
      recentTransfers: merchant.productTransfers,
      recentPayments: merchant.moneyTransfers,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard data:", error)
    return null
  }
}
