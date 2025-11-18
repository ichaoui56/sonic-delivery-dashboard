"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Eye, Filter } from 'lucide-react'
import { ViewOrderDialog } from "@/components/admin/orders/view-order-dialog"
import { UpdateOrderStatusDialog } from "@/components/admin/orders/update-order-status-dialog"

type Order = {
  id: number
  orderCode: string
  customerName: string
  customerPhone: string
  address: string
  city: string
  totalPrice: number
  merchantEarning: number
  status: string
  paymentMethod: string
  createdAt: string
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
  orderItems: any[]
}

export function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCity, setFilterCity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [orders, setOrders] = useState(initialOrders)

  const cities = ["الداخلة", "بوجدور", "العيون"]
  const statuses = ["PENDING", "ACCEPTED", "ASSIGNED_TO_DELIVERY", "DELIVERED", "REPORTED", "REJECTED", "CANCELLED"]
  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACCEPTED: "مقبول",
    ASSIGNED_TO_DELIVERY: "مسند للتوصيل",
    DELIVERED: "تم التوصيل",
    REPORTED: "مبلغ عنه",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى"
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.merchant.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCity = filterCity === "all" || order.city === filterCity
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    const matchesPayment = filterPayment === "all" || order.paymentMethod === filterPayment
    
    return matchesSearch && matchesCity && matchesStatus && matchesPayment
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    assigned: orders.filter(o => o.status === "ASSIGNED_TO_DELIVERY").length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
        <p className="text-gray-500 mt-1">عرض وإدارة جميع الطلبات في النظام</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">إجمالي الطلبات</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">قيد الانتظار</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">مسند للتوصيل</p>
          <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">تم التوصيل</p>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">إجمالي الإيرادات</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalRevenue.toFixed(2)} د.م</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="ابحث برقم الطلب، اسم العميل، رقم الهاتف، أو اسم التاجر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المدن</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger>
                    <SelectValue placeholder="طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع طرق الدفع</SelectItem>
                    <SelectItem value="COD">الدفع عند الاستلام</SelectItem>
                    <SelectItem value="PREPAID">مدفوع مسبقاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterCity("all")
                  setFilterStatus("all")
                  setFilterPayment("all")
                  setSearchTerm("")
                }}
              >
                <Filter className="w-4 h-4 ml-2" />
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1 grid grid-cols-5 gap-4">
                  {/* Order Code & Customer */}
                  <div>
                    <p className="font-semibold text-blue-600">{order.orderCode}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerPhone}</p>
                  </div>

                  {/* Merchant */}
                  <div>
                    <p className="text-sm text-gray-500">التاجر</p>
                    <p className="font-semibold">{order.merchant.user.name}</p>
                  </div>

                  {/* City & Address */}
                  <div>
                    <p className="text-sm text-gray-500">المدينة</p>
                    <p className="font-semibold">{order.city}</p>
                    <p className="text-xs text-gray-400">{order.address.substring(0, 30)}...</p>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-sm text-gray-500">السعر الإجمالي</p>
                    <p className="font-semibold text-green-600">{order.totalPrice.toFixed(2)} د.م</p>
                    <p className="text-xs text-gray-400">
                      {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                    </p>
                  </div>

                  {/* Status & Date */}
                  <div>
                    <Badge className="mb-2">{statusLabels[order.status]}</Badge>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("ar-MA")}
                    </p>
                    {order.deliveryMan && (
                      <p className="text-xs text-gray-500">
                        موصل: {order.deliveryMan.user.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mr-4">
                  <ViewOrderDialog orderId={order.id}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 ml-2" />
                      عرض
                    </Button>
                  </ViewOrderDialog>
                  <UpdateOrderStatusDialog 
                    orderId={order.id}
                    currentStatus={order.status}
                    orderCode={order.orderCode}
                    onSuccess={() => window.location.reload()}
                  >
                    <Button size="sm" variant="outline">
                      تحديث الحالة
                    </Button>
                  </UpdateOrderStatusDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
