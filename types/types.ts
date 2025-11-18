export type PaymentData = {
  totalRevenue: number
  currentBalance: number
  totalPaidByAdmin: number
  merchantBaseFee: number
  totalAmountOwedByAdmin: number
  totalAmountOwedToCompany: number
  paymentHistory: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    transferDate: Date
  }>
  deliveredOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    customerPhone: string
    totalPrice: number
    merchantEarning: number
    paymentMethod: "COD" | "PREPAID"
    deliveredAt: Date | null
    orderItems: Array<{
      id: number
      quantity: number
      price: number
      product: {
        id: number
        name: string
        image: string | null
      }
    }>
  }>
}

export type DashboardData = {
  merchant: {
    user: {
      name: string
      email: string
    }
  }
  stats: {
    orders: {
      total: number
      pending: number
      delivered: number
      cancelled: number
    }
    revenue: {
      total: number
      pending: number
    }
    products: {
      total: number
      totalStock: number
      lowStock: number
    }
    payments: {
      currentBalance: number
      totalPaid: number
    }
  }
  last7Days: Array<{
    date: string
    orders: number
    revenue: number
  }>
  bestSellingProducts: Array<{
    product: {
      id: number
      name: string
      image: string | null
    }
    quantity: number
    revenue: number
  }>
  recentOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    status: string
    createdAt: Date
    orderItems: Array<{
      id: number
      product: {
        id: number
        name: string
        image: string | null
      }
    }>
  }>
}


export interface MerchantSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  merchant: {
    id: number
    companyName: string | null
    rib: string | null
    bankName: string | null
    balance: number
    totalEarned: number
    baseFee: number
  }
}