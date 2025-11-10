"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "./optimized-image"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { updateOrderStatus, acceptOrder, rejectOrder } from "@/lib/actions/order.actions"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Order = {
  id: number
  orderCode: string
  customerName: string
  customerPhone: string
  address: string
  city: string
  note: string | null
  totalPrice: number
  paymentMethod: "COD" | "PREPAID"
  status: string
  createdAt: Date
  deliveryManId: number | null
  orderItems: {
    id: number
    quantity: number
    price: number
    product: {
      id: number
      name: string
      image: string | null
    }
  }[]
  merchant: {
    user: {
      name: string
    }
  }
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  READY_FOR_DELIVERY: { label: "جاهز للتوصيل", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  ASSIGNED_TO_DELIVERY: { label: "معين لك", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  IN_TRANSIT: { label: "في الطريق", color: "bg-orange-100 text-orange-800 border-orange-200" },
  OUT_FOR_DELIVERY: { label: "في التوصيل", color: "bg-teal-100 text-teal-800 border-teal-200" },
  DELIVERED: { label: "تم التسليم", color: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "مرفوض", color: "bg-red-100 text-red-800 border-red-200" },
  REPORTED: { label: "รายงาน مشكلة", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  CANCELLED: { label: "ملغي", color: "bg-gray-100 text-gray-800 border-gray-200" },
}

export function DeliveryOrdersTable({ orders }: { orders: Order[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null)

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const stats = useMemo(() => {
    return {
      available: orders.filter((o) => o.status === "READY_FOR_DELIVERY" || o.status === "PENDING").length,
      assigned: orders.filter((o) => o.status === "ASSIGNED_TO_DELIVERY").length,
      inProgress: orders.filter((o) => ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "DELIVERED").length,
    }
  }, [orders])

  const handleAcceptOrder = async (orderId: number) => {
    setUpdatingOrderId(orderId)
    const result = await acceptOrder(orderId)

    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setUpdatingOrderId(null)
  }

  const handleRejectOrder = async () => {
    if (!selectedOrderId || !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض")
      return
    }

    setUpdatingOrderId(selectedOrderId)
    const result = await rejectOrder(selectedOrderId, rejectionReason)

    if (result.success) {
      toast.success(result.message)
      setRejectDialogOpen(false)
      setRejectionReason("")
      setSelectedOrderId(null)
    } else {
      toast.error(result.message)
    }

    setUpdatingOrderId(null)
  }

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    console.log("[v0] Updating order status:", { orderId, newStatus })
    setUpdatingOrderId(orderId)
    const result = await updateOrderStatus(orderId, newStatus as any)

    if (result.success) {
      toast.success(result.message)
      console.log("[v0] Status updated successfully, reloading page...")
      window.location.reload()
    } else {
      toast.error(result.message)
      console.error("[v0] Status update failed:", result.message)
    }

    setUpdatingOrderId(null)
  }

  const getAvailableStatuses = (currentStatus: string, deliveryManId: number | null) => {
    console.log("[v0] Getting available statuses for:", { currentStatus, deliveryManId })
    const statuses: { value: string; label: string }[] = []

    // If order is assigned to delivery man
    if (deliveryManId) {
      if (currentStatus === "ASSIGNED_TO_DELIVERY" || currentStatus === "ACCEPTED") {
        statuses.push({ value: "DELIVERED", label: "✅ تم التسليم بنجاح" })
        statuses.push({ value: "REJECTED", label: "❌ رفض العميل" })
        statuses.push({ value: "REPORTED", label: "⚠️ الإبلاغ عن مشكلة" })
        statuses.push({ value: "CANCELLED", label: "🚫 إلغاء الطلب" })
      }
    }

    console.log("[v0] Available statuses:", statuses)
    return statuses
  }

  const handleStatusClick = (orderId: number, status: string) => {
    console.log("[v0] ========== STATUS CLICK HANDLER ==========")
    console.log("[v0] Status clicked:", { orderId, status })
    console.log("[v0] ==========================================")

    if (status === "REPORTED") {
      setSelectedOrderId(orderId)
      setReportDialogOpen(true)
      setDropdownOpen(null)
    } else if (status === "REJECTED" || status === "CANCELLED") {
      // For reject/cancel, we can use existing reject dialog
      setSelectedOrderId(orderId)
      setRejectDialogOpen(true)
      setDropdownOpen(null)
    } else {
      // For direct status updates like DELIVERED
      handleStatusUpdate(orderId, status)
      setDropdownOpen(null)
    }
  }

  const handleReportOrder = async () => {
    if (!selectedOrderId || !reportReason.trim()) {
      toast.error("يرجى إدخال سبب الإبلاغ")
      return
    }

    setUpdatingOrderId(selectedOrderId)
    const result = await updateOrderStatus(selectedOrderId, "REPORTED")

    if (result.success) {
      toast.success(result.message)
      setReportDialogOpen(false)
      setReportReason("")
      setSelectedOrderId(null)
      window.location.reload()
    } else {
      toast.error(result.message)
    }

    setUpdatingOrderId(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === "READY_FOR_DELIVERY" ? "ring-2 ring-cyan-500" : ""
          }`}
          onClick={() => setStatusFilter(statusFilter === "READY_FOR_DELIVERY" ? "ALL" : "READY_FOR_DELIVERY")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">متاحة للتوصيل</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-600">{stats.available}</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === "ASSIGNED_TO_DELIVERY" ? "ring-2 ring-indigo-500" : ""
          }`}
          onClick={() => setStatusFilter(statusFilter === "ASSIGNED_TO_DELIVERY" ? "ALL" : "ASSIGNED_TO_DELIVERY")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">معينة لي</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">{stats.assigned}</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === "IN_TRANSIT" || statusFilter === "OUT_FOR_DELIVERY" ? "ring-2 ring-orange-500" : ""
          }`}
          onClick={() => setStatusFilter(statusFilter === "IN_TRANSIT" ? "ALL" : "IN_TRANSIT")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">قيد التوصيل</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.inProgress}</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === "DELIVERED" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "DELIVERED" ? "ALL" : "DELIVERED")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">مكتملة</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            placeholder="ابحث عن طلب... (رقم الطلب، اسم العميل)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 min-h-[44px]"
          />
        </div>

        {statusFilter !== "ALL" && (
          <Button variant="outline" onClick={() => setStatusFilter("ALL")} className="min-h-[44px]">
            مسح الفلتر
          </Button>
        )}
      </div>

      <div className="text-sm text-gray-600">
        عرض {filteredOrders.length} من {orders.length} طلب
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#048dba]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{order.orderCode}</h3>
                      <Badge className={statusMap[order.status]?.color || "bg-gray-100"}>
                        {statusMap[order.status]?.label || order.status}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: ar })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">التاجر: {order.merchant.user.name}</p>
                  </div>
                </div>

                <div className="text-left">
                  <p className="text-2xl font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</p>
                  <p className="text-sm text-gray-500">ربحك: 15.00 د.م</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">اسم العميل</p>
                  <p className="font-medium text-sm">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="font-medium text-sm direction-ltr text-right">{order.customerPhone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">العنوان</p>
                  <p className="font-medium text-sm">
                    {order.address} - {order.city}
                  </p>
                </div>
                {order.note && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">ملاحظات</p>
                    <p className="font-medium text-sm">{order.note}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">المنتجات ({order.orderItems.length})</p>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.product.image ? (
                          <OptimizedImage
                            src={item.product.image}
                            alt={item.product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {(order.status === "READY_FOR_DELIVERY" || order.status === "PENDING") && !order.deliveryManId && (
                  <>
                    <Button
                      onClick={() => {
                        console.log("[v0] Accept button clicked for order:", order.id)
                        handleAcceptOrder(order.id)
                      }}
                      disabled={updatingOrderId === order.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 min-h-[44px]"
                    >
                      {updatingOrderId === order.id ? "جاري القبول..." : "قبول الطلب"}
                    </Button>
                    <Button
                      onClick={() => {
                        console.log("[v0] Reject button clicked for order:", order.id)
                        setSelectedOrderId(order.id)
                        setRejectDialogOpen(true)
                      }}
                      disabled={updatingOrderId === order.id}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 min-h-[44px]"
                    >
                      رفض الطلب
                    </Button>
                  </>
                )}

                {order.deliveryManId && order.status !== "DELIVERED" && order.status !== "REJECTED" && (
  <div className="flex-1">
    <select
      value=""
      onChange={(e) => {
        if (e.target.value) {
          handleStatusClick(order.id, e.target.value)
        }
      }}
      disabled={updatingOrderId === order.id}
      className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#048dba]"
    >
      <option value="">تحديث الحالة...</option>
      {getAvailableStatuses(order.status, order.deliveryManId).map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  </div>
)}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 00-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-gray-500">لا توجد طلبات</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض/إلغاء الطلب</DialogTitle>
            <DialogDescription>يرجى تحديد سبب رفض أو إلغاء هذا الطلب</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="اكتب السبب..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleRejectOrder}
              disabled={!rejectionReason.trim() || updatingOrderId === selectedOrderId}
              className="bg-red-600 hover:bg-red-700"
            >
              {updatingOrderId === selectedOrderId ? "جاري الرفض..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الإبلاغ عن مشكلة في التوصيل</DialogTitle>
            <DialogDescription>يرجى وصف المشكلة التي واجهتها أثناء محاولة التوصيل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason">سبب المشكلة</Label>
              <Textarea
                id="report-reason"
                placeholder="مثال: العميل غير متوفر، عنوان خاطئ، رفض استلام الطلب..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="resize-none mt-2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleReportOrder}
              disabled={!reportReason.trim() || updatingOrderId === selectedOrderId}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {updatingOrderId === selectedOrderId ? "جاري الإبلاغ..." : "إرسال البلاغ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
