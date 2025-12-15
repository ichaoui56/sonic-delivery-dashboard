"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "./optimized-image"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { updateOrderStatus } from "@/lib/actions/order.actions"
import { useToast } from "@/hooks/use-toast"
import type { OrderStatus } from "@prisma/client"
import { Tag, TrendingDown, Printer, ChevronRight, ChevronLeft } from "lucide-react"
import { generateAndDownloadInvoice } from "@/lib/utils/pdf-client"

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
  merchantEarning: number
  status: string
  createdAt: Date
  deliveredAt: Date | null
  discountType: string | null
  discountValue: number | null
  discountDescription: string | null
  originalTotalPrice: number | null
  totalDiscount: number | null
  buyXGetYConfig: string | null
  orderItems: {
    id: number
    quantity: number
    price: number
    originalPrice: number | null
    isFree: boolean
    product: {
      id: number
      name: string
      image: string | null
    }
  }[]
  deliveryMan: {
    user: {
      name: string
    }
  } | null
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  ACCEPTED: { label: "مقبول", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ASSIGNED_TO_DELIVERY: { label: "معين لعامل توصيل", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  IN_TRANSIT: { label: "في الطريق", color: "bg-orange-100 text-orange-800 border-orange-200" },
  OUT_FOR_DELIVERY: { label: "في التوصيل", color: "bg-teal-100 text-teal-800 border-teal-200" },
  DELIVERED: { label: "تم التسليم", color: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "مرفوض", color: "bg-red-100 text-red-800 border-red-200" },
  CANCELLED: { label: "ملغي", color: "bg-gray-100 text-gray-800 border-gray-200" },
}

const discountTypeLabels: Record<string, string> = {
  PERCENTAGE: "خصم نسبة مئوية",
  FIXED_AMOUNT: "خصم مبلغ ثابت",
  BUY_X_GET_Y: "اشتر X واحصل على Y",
  CUSTOM_PRICE: "سعر مخصص",
}

export function OrdersTable({ 
  orders, 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusChange, 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  orders: Order[]
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [generatingPdfOrderId, setGeneratingPdfOrderId] = useState<number | null>(null)
  const { toast } = useToast()

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    inProgress: orders.filter((o) =>
      ["ACCEPTED", "ASSIGNED_TO_DELIVERY", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status),
    ).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => ["REJECTED", "CANCELLED"].includes(o.status)).length,
  }

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    const result = await updateOrderStatus(orderId, newStatus)
    if (result.success) {
      toast({
        title: "✓ تم التحديث",
        description: result.message,
      })
      onPageChange(1) // Reload first page after status change
    } else {
      toast({
        title: "✗ خطأ",
        description: result.message,
        variant: "destructive",
      })
    }
    setUpdatingOrderId(null)
  }

  const handleGeneratePDF = async (order: Order) => {
    setGeneratingPdfOrderId(order.id)
    try {
      const orderForPDF = {
        orderCode: order.orderCode,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        city: order.city,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            name: item.product.name
          }
        }))
      }

      const logoUrl = '/images/logo/logo.png'
      const result = await generateAndDownloadInvoice(orderForPDF, "Your Store Name", logoUrl)

      if (result.success) {
        toast({
          title: "✓ تم إنشاء الفاتورة",
          description: "تم إنشاء الفاتورة بنجاح وتنزيلها",
        })
      } else {
        throw new Error(result.error || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      toast({
        title: "✗ خطأ",
        description: "فشل في إنشاء الفاتورة",
        variant: "destructive",
      })
    } finally {
      setGeneratingPdfOrderId(null)
    }
  }

  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = [
      { value: "PENDING", label: "قيد الانتظار" },
      { value: "ACCEPTED", label: "مقبول" },
      { value: "ASSIGNED_TO_DELIVERY", label: "معين لعامل توصيل" },
      { value: "IN_TRANSIT", label: "في الطريق" },
      { value: "OUT_FOR_DELIVERY", label: "في التوصيل" },
      { value: "DELIVERED", label: "تم التسليم" },
      { value: "REJECTED", label: "مرفوض" },
      { value: "CANCELLED", label: "ملغي" },
    ]
    return allStatuses.filter((status) => status.value !== currentStatus)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          التالي
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          className={`cursor-pointer transition-all ${statusFilter === "ALL" ? "ring-2 ring-[#048dba]" : ""}`}
          onClick={() => onStatusChange("ALL")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${statusFilter === "PENDING" ? "ring-2 ring-yellow-500" : ""}`}
          onClick={() => onStatusChange(statusFilter === "PENDING" ? "ALL" : "PENDING")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">قيد الانتظار</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${statusFilter === "DELIVERED" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => onStatusChange(statusFilter === "DELIVERED" ? "ALL" : "DELIVERED")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">مكتملة</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.delivered}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${statusFilter === "CANCELLED" ? "ring-2 ring-red-500" : ""}`}
          onClick={() => onStatusChange(statusFilter === "CANCELLED" ? "ALL" : "CANCELLED")}
        >
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">ملغية</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.cancelled}</p>
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
            placeholder="ابحث عن طلب... (رقم الطلب، اسم العميل، المدينة)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 min-h-[44px]"
          />
        </div>
        {statusFilter !== "ALL" && (
          <Button variant="outline" onClick={() => onStatusChange("ALL")} className="min-h-[44px]">
            مسح الفلتر
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#048dba]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
                      {order.discountType && order.totalDiscount && order.totalDiscount > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <Tag className="w-3 h-3 ml-1" />
                          خصم {order.totalDiscount.toFixed(0)} د.م
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  {order.originalTotalPrice && order.originalTotalPrice !== order.totalPrice ? (
                    <div>
                      <p className="text-sm text-gray-500 line-through">{order.originalTotalPrice.toFixed(2)} د.م</p>
                      <p className="text-2xl font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</p>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingDown className="w-3 h-3" />
                        <span>وفر {order.totalDiscount?.toFixed(0)} د.م</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</p>
                  )}
                  <p className="text-sm text-gray-500">ربحك: {order.merchantEarning.toFixed(2)} د.م</p>
                </div>
              </div>

              {order.discountType && order.totalDiscount && order.totalDiscount > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      {discountTypeLabels[order.discountType] || order.discountType}
                    </span>
                    {order.discountValue && (
                      <span className="text-green-600">
                        ({order.discountType === "PERCENTAGE" ? `${order.discountValue}%` : `${order.discountValue} د.م`})
                      </span>
                    )}
                  </div>
                  {order.discountDescription && (
                    <p className="text-xs text-gray-600 mt-1">{order.discountDescription}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">اسم العميل</p>
                  <p className="font-medium text-sm">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="font-medium text-sm direction-ltr text-right">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">المدينة</p>
                  <p className="font-medium text-sm">{order.city}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">عامل التوصيل</p>
                  <p className="font-medium text-sm">{order.deliveryMan?.user.name || "غير معين بعد"}</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <p className="text-xs text-gray-500 mb-1">العنوان</p>
                  <p className="font-medium text-sm">{order.address}</p>
                </div>
                {order.note && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <p className="text-xs text-gray-500 mb-1">ملاحظات</p>
                    <p className="font-medium text-sm">{order.note}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  المنتجات ({order.orderItems.length} {order.orderItems.length === 1 ? "منتج" : "منتجات"})
                </p>
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.isFree ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              مجاني
                            </Badge>
                          ) : (
                            <>
                              {item.originalPrice && item.originalPrice !== item.price && (
                                <span className="line-through text-gray-400 ml-1">{item.originalPrice.toFixed(2)} د.م</span>
                              )}
                              {item.price.toFixed(2)} د.م × {item.quantity}
                            </>
                          )}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-[#048dba]">
                        {item.isFree ? "0.00" : (item.price * item.quantity).toFixed(2)} د.م
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">لا توجد طلبات</p>
            </CardContent>
          </Card>
        )}
      </div>

      {renderPagination()}
    </div>
  )
}