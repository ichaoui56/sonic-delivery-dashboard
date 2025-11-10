"use server"

import db from "@/lib/db"
import { getCurrentUser } from "./auth-actions"

export async function getMerchantPaymentData() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const merchant = await db.merchant.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        moneyTransfers: {
          orderBy: { transferDate: "desc" },
        },
        orders: {
          where: {
            status: "DELIVERED",
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { deliveredAt: "desc" },
        },
      },
    })

    if (!merchant) return null

    let totalRevenue = 0 // Total from all orders
    let totalAmountOwedByAdmin = 0 // What admin needs to pay merchant (from COD orders)
    let totalAmountOwedToCompany = 0 // What merchant owes company (from PREPAID orders)

    merchant.orders.forEach((order) => {
      totalRevenue += order.totalPrice

      if (order.paymentMethod === "COD") {
        // Positive earnings = admin owes merchant
        totalAmountOwedByAdmin += order.merchantEarning
      } else {
        // Negative earnings = merchant owes company
        totalAmountOwedToCompany += Math.abs(order.merchantEarning)
      }
    })

    // Total already paid to merchant by admin
    const totalPaidByAdmin = merchant.moneyTransfers.reduce((sum, transfer) => sum + transfer.amount, 0)

    // Current balance calculation:
    // Positive = admin owes merchant
    // Negative = merchant owes company
    const currentBalance = merchant.balance

    return {
      merchant,
      merchantBaseFee: merchant.baseFee,

      // Summary stats
      totalRevenue, // Total sales from all delivered orders
      totalAmountOwedByAdmin, // From COD orders (what admin needs to pay)
      totalAmountOwedToCompany, // From PREPAID orders (what merchant owes)
      totalPaidByAdmin, // Already transferred to merchant
      currentBalance, // Current balance (can be positive or negative)

      // Calculated values
      netPendingPayment: currentBalance - totalPaidByAdmin, // What admin still needs to pay

      // History
      paymentHistory: merchant.moneyTransfers,
      deliveredOrders: merchant.orders,
    }
  } catch (error) {
    console.error("[v0] Error fetching payment data:", error)
    return null
  }
}
