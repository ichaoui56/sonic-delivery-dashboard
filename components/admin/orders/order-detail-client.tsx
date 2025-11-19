"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Package, Truck, MapPin, User, Phone, Calendar, CreditCard, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { UpdateOrderStatusDialog } from "./update-order-status-dialog"

type OrderDetailProps = {
  order: any // Using any here for simplicity as the type is complex, but ideally should be typed
}

export function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter()

  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACCEPTED: "مقبول",
    ASSIGNED_TO_DELIVERY: "مسند للتوصيل",
    DELIVERED: "تم التوصيل",
    REPORTED: "مبلغ عنه",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى"
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    ASSIGNED_TO_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    REPORTED: "bg-red-100 text-red-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED": return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "CANCELLED":
      case "REJECTED": return <XCircle className="w-5 h-5 text-red-600" />
      case "REPORTED": return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-[#048dba]" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="hover:bg-[#048dba]/10 text-[#048dba]"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              الطلب #{order.orderCode}
              <Badge className={`${statusColors[order.status]} border-0`}>
                {statusLabels[order.status]}
              </Badge>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              تم الإنشاء في {new Date(order.createdAt).toLocaleDateString("ar-MA", { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <UpdateOrderStatusDialog 
            orderId={order.id}
            currentStatus={order.status}
            orderCode={order.orderCode}
            onSuccess={() => router.refresh()}
          >
            <Button className="bg-[#048dba] hover:bg-[#037296]">
              تحديث الحالة
            </Button>
          </UpdateOrderStatusDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products Card */}
          <Card className="border-t-4 border-t-[#048dba] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-[#048dba]" />
                المنتجات ({order.orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {item.product.image ? (
                      <img 
                        src={item.product.image || "/placeholder.svg"} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#048dba]">{item.price.toFixed(2)} د.م</p>
                      <p className="text-xs text-gray-500">للقطعة</p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-gray-700">المجموع الكلي</span>
                  <span className="text-xl font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline / History */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-[#048dba]" />
                سجل العمليات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-r border-gray-200 mr-3 space-y-8">
                {/* Current Status */}
                <div className="relative flex items-start gap-4 mr-[-9px]">
                  <div className="bg-[#048dba] rounded-full p-1 ring-4 ring-white">
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-gray-900">الحالة الحالية: {statusLabels[order.status]}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.updatedAt).toLocaleDateString("ar-MA", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Delivery Attempts */}
                {order.deliveryAttemptHistory && order.deliveryAttemptHistory.map((attempt: any, index: number) => (
                  <div key={index} className="relative flex items-start gap-4 mr-[-9px]">
                    <div className="bg-gray-100 rounded-full p-1 ring-4 ring-white">
                      <Truck className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900">محاولة توصيل</p>
                      <p className="text-sm text-gray-600">
                        بواسطة: {attempt.deliveryMan.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(attempt.attemptedAt).toLocaleDateString("ar-MA", {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {attempt.notes && (
                        <p className="text-sm bg-gray-50 p-2 rounded mt-1 text-gray-600 border">
                          ملاحظة: {attempt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Creation */}
                <div className="relative flex items-start gap-4 mr-[-9px]">
                  <div className="bg-green-100 rounded-full p-1 ring-4 ring-white">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-gray-900">تم إنشاء الطلب</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("ar-MA", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-[#048dba]" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">الاسم</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">الهاتف</p>
                  <p className="font-medium dir-ltr text-right">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">العنوان</p>
                  <p className="font-medium">{order.address}</p>
                  <Badge variant="outline" className="mt-1">{order.city}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merchant Info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-[#048dba]" />
                التاجر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#048dba] font-bold">
                  {order.merchant.user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{order.merchant.user.name}</p>
                  <p className="text-sm text-gray-500">{order.merchant.companyName || "متجر"}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">أرباح التاجر</span>
                  <span className="font-medium text-green-600">{order.merchantEarning.toFixed(2)} د.م</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="w-5 h-5 text-[#048dba]" />
                التوصيل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.deliveryMan ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                    {order.deliveryMan.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{order.deliveryMan.user.name}</p>
                    <p className="text-sm text-gray-500">{order.deliveryMan.vehicleType || "موصل"}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                  <p className="text-gray-500 text-sm">لم يتم تعيين موصل بعد</p>
                </div>
              )}
              
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">طريقة الدفع</span>
                  <Badge variant="secondary">
                    {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
