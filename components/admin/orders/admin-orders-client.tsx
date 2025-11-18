"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"

type Order = {
  id: number
  orderCode: string
  customerName: string
  customerPhone: string
  totalPrice: number
  status: string
  paymentMethod: string
  createdAt: Date
  merchant: {
    user: {
      name: string
    }
  }
  deliveryMan: {
    user: {
      name: string
    }
  } | null
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  ASSIGNED_TO_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
}

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  ACCEPTED: "مقبول",
  ASSIGNED_TO_DELIVERY: "تم التعيين للتوصيل",
  DELIVERED: "تم التوصيل",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
}

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOrders = initialOrders.filter(
    (order) =>
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.merchant.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
        <p className="text-gray-500 mt-1">عرض وإدارة جميع الطلبات في النظام</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="بحث برقم الطلب، اسم العميل، أو التاجر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>جميع الطلبات ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[#048dba] text-white">{order.orderCode}</Badge>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                    <Badge variant="outline">{order.paymentMethod === "COD" ? "دفع عند الاستلام" : "مدفوع مسبقاً"}</Badge>
                  </div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-gray-500">التاجر: {order.merchant.user.name}</p>
                  {order.deliveryMan && (
                    <p className="text-sm text-gray-500">موظف التوصيل: {order.deliveryMan.user.name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">السعر الكلي</p>
                    <p className="font-bold text-lg">{order.totalPrice.toFixed(2)} د.م</p>
                  </div>
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button size="sm">عرض التفاصيل</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
