import { cache } from 'react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from './auth-actions';

export const getMerchantPaymentData = cache(async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const [merchant, paymentData, deliveredOrders] = await Promise.all([
      prisma.merchant.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          companyName: true,
          balance: true,
          totalEarned: true,
          baseFee: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.$queryRaw<Array<{
        totalRevenue: number;
        totalAmountOwedByAdmin: number;
        totalAmountOwedToCompany: number;
        totalPaidByAdmin: number;
      }>>`
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN o.status = 'DELIVERED' THEN o."totalPrice"
              ELSE 0
            END
          ), 0) as "totalRevenue",
          COALESCE(SUM(
            CASE 
              WHEN o.status = 'DELIVERED' AND o."paymentMethod" = 'COD' THEN o."merchantEarning"
              ELSE 0
            END
          ), 0) as "totalAmountOwedByAdmin",
          COALESCE(SUM(
            CASE 
              WHEN o.status = 'DELIVERED' AND o."paymentMethod" = 'PREPAID' THEN ABS(o."merchantEarning")
              ELSE 0
            END
          ), 0) as "totalAmountOwedToCompany",
          COALESCE(SUM(mt.amount), 0) as "totalPaidByAdmin"
        FROM "Merchant" m
        LEFT JOIN "Order" o ON o."merchantId" = m.id
        LEFT JOIN "MoneyTransfer" mt ON mt."merchantId" = m.id
        WHERE m."userId" = ${user.id}
        GROUP BY m.id
      `,

      prisma.order.findMany({
        where: {
          merchant: { userId: user.id },
          status: 'DELIVERED',
        },
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          customerPhone: true,
          totalPrice: true,
          merchantEarning: true,
          paymentMethod: true,
          deliveredAt: true,
          orderItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            take: 5,
          },
        },
        orderBy: { deliveredAt: 'desc' },
        take: 20,
      }),
    ]);

    if (!merchant) return null;

    const paymentHistory = await prisma.moneyTransfer.findMany({
      where: { merchantId: merchant.id },
      orderBy: { transferDate: 'desc' },
      take: 20,
    });

    const data = paymentData[0] || {
      totalRevenue: 0,
      totalAmountOwedByAdmin: 0,
      totalAmountOwedToCompany: 0,
      totalPaidByAdmin: 0,
    };

    return {
      totalRevenue: Number(data.totalRevenue),
      currentBalance: merchant.balance,
      totalPaidByAdmin: Number(data.totalPaidByAdmin),
      merchantBaseFee: merchant.baseFee,
      totalAmountOwedByAdmin: Number(data.totalAmountOwedByAdmin),
      totalAmountOwedToCompany: Number(data.totalAmountOwedToCompany),
      paymentHistory,
      deliveredOrders,
    };
  } catch (error) {
    console.error('[v0] Error fetching payment data:', error);
    return null;
  }
});