"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, DollarSign, Package, ShoppingCart, TrendingUp, Phone, Mail, Building, CreditCard, Calendar, Truck, MapPin, Eye, FileText } from 'lucide-react'
import { EditDeliveryManDialog } from "./edit-deliveryman-dialog"
import { AddPaymentDialog } from "./add-payment-dialog"

type DeliveryManDetail = {
  id: number
  vehicleType: string | null
  active: boolean
  city: string
  totalDeliveries: number
  successfulDeliveries: number
  totalEarned: number
  baseFee: number
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
    createdAt: string
  }
  assignedOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    status: string
    city: string
    createdAt: string
    merchant: {
      user: {
        name: string
      }
    }
  }>
  deliveryAttempts: Array<{
    id: number
    attemptedAt: string
    wasSuccessful: boolean
    notes: string | null
    order: {
      orderCode: string
      customerName: string
    }
  }>
  moneyTransfers: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    invoiceImage: string | null
    createdAt: string
  }>
}

export function DeliveryManDetailClient({ initialDeliveryMan }: { initialDeliveryMan: DeliveryManDetail }) {
  const [deliveryMan, setDeliveryMan] = useState(initialDeliveryMan)
  const router = useRouter()

  const successRate = deliveryMan.totalDeliveries > 0 
    ? ((deliveryMan.successfulDeliveries / deliveryMan.totalDeliveries) * 100).toFixed(1)
    : "0"

  const stats = {
    totalOrders: deliveryMan.assignedOrders.length,
    deliveredOrders: deliveryMan.assignedOrders.filter(o => o.status === "DELIVERED").length,
    totalAttempts: deliveryMan.deliveryAttempts.length,
    successfulAttempts: deliveryMan.deliveryAttempts.filter(a => a.wasSuccessful).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fully responsive */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-[#048dba]/10"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">تفاصيل موظف التوصيل</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">معلومات كاملة عن موظف التوصيل ونشاطه</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <EditDeliveryManDialog 
                deliveryMan={deliveryMan} 
                onSuccess={(updated) => setDeliveryMan({ ...deliveryMan, ...updated })}
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  <span className="hidden xs:inline">تعديل البيانات</span>
                  <span className="xs:hidden">تعديل</span>
                </Button>
              </EditDeliveryManDialog>
              <AddPaymentDialog deliveryManId={deliveryMan.id} deliveryManName={deliveryMan.user.name}>
                <Button 
                  size="sm"
                  className="bg-[#048dba] hover:bg-[#037a9e] text-white flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  <span className="hidden xs:inline">إضافة دفعة</span>
                  <span className="xs:hidden">دفعة</span>
                </Button>
              </AddPaymentDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Profile Card - Fully responsive */}
        <Card className="border-t-4 border-t-[#048dba] shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex justify-center sm:justify-start">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-[#048dba]/20">
                  <AvatarImage src={deliveryMan.user.image || undefined} />
                  <AvatarFallback className="bg-[#048dba] text-white text-xl sm:text-2xl">
                    {deliveryMan.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Building className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    الاسم الكامل
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm sm:text-base lg:text-lg truncate">{deliveryMan.user.name}</p>
                    <Badge 
                      variant={deliveryMan.active ? "default" : "secondary"}
                      className={`${deliveryMan.active ? 'bg-[#048dba]' : ''} text-xs shrink-0`}
                    >
                      {deliveryMan.active ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    المدينة
                  </p>
                  <Badge variant="outline" className="border-[#048dba] text-[#048dba] text-sm">
                    {deliveryMan.city}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    البريد الإلكتروني
                  </p>
                  <p className="font-semibold text-xs sm:text-sm truncate">{deliveryMan.user.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    رقم الهاتف
                  </p>
                  <p className="font-semibold text-sm sm:text-base">{deliveryMan.user.phone || "غير محدد"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    نوع المركبة
                  </p>
                  <p className="font-semibold text-sm sm:text-base truncate">{deliveryMan.vehicleType || "غير محدد"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    الأجرة الأساسية
                  </p>
                  <p className="font-semibold text-sm sm:text-base">{deliveryMan.baseFee.toFixed(2)} د.م</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Fully responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-r-4 border-r-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">إجمالي الأرباح</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">{deliveryMan.totalEarned.toFixed(2)} د.م</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-[#048dba] hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">معدل النجاح</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#048dba]">{successRate}%</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-[#048dba]/10 rounded-full flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#048dba]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">إجمالي التوصيلات</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{deliveryMan.totalDeliveries}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">التوصيلات الناجحة</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{deliveryMan.successfulDeliveries}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Responsive with added payments tab */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 h-auto gap-1">
            <TabsTrigger 
              value="orders" 
              className="text-xs sm:text-sm data-[state=active]:bg-[#048dba] data-[state=active]:text-white py-2"
            >
              <span className="hidden sm:inline">الطلبات المسندة</span>
              <span className="sm:hidden">طلبات</span>
              <span className="mr-1">({deliveryMan.assignedOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attempts"
              className="text-xs sm:text-sm data-[state=active]:bg-[#048dba] data-[state=active]:text-white py-2"
            >
              <span className="hidden sm:inline">محاولات التوصيل</span>
              <span className="sm:hidden">محاولات</span>
              <span className="mr-1">({deliveryMan.deliveryAttempts.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="text-xs sm:text-sm data-[state=active]:bg-[#048dba] data-[state=active]:text-white py-2"
            >
              <span className="hidden sm:inline">المدفوعات</span>
              <span className="sm:hidden">دفع</span>
              <span className="mr-1">({deliveryMan.moneyTransfers?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                  الطلبات المسندة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {deliveryMan.assignedOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد طلبات مسندة حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveryMan.assignedOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-[#048dba]/50 cursor-pointer transition-all"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <p className="font-semibold text-[#048dba] text-sm sm:text-base">{order.orderCode}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{order.customerName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">التاجر</p>
                            <p className="font-semibold text-sm truncate">{order.merchant.user.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">المدينة</p>
                            <p className="font-semibold text-sm">{order.city}</p>
                          </div>
                          <div>
                            <Badge className="bg-[#048dba] text-xs">{order.status}</Badge>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(order.createdAt).toLocaleDateString("ar-MA")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Attempts Tab */}
          <TabsContent value="attempts">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                  سجل محاولات التوصيل
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {deliveryMan.deliveryAttempts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد محاولات توصيل حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveryMan.deliveryAttempts.map((attempt) => (
                      <div key={attempt.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <p className="font-semibold text-sm sm:text-base">{attempt.order.orderCode}</p>
                            <p className="text-xs text-gray-600 truncate">{attempt.order.customerName}</p>
                          </div>
                          <div>
                            <Badge 
                              variant={attempt.wasSuccessful ? "default" : "secondary"}
                              className={`${attempt.wasSuccessful ? 'bg-green-600' : 'bg-red-600'} text-xs`}
                            >
                              {attempt.wasSuccessful ? "ناجحة" : "فاشلة"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              {new Date(attempt.attemptedAt).toLocaleDateString("ar-MA")}
                            </p>
                          </div>
                          <div>
                            {attempt.notes && (
                              <p className="text-xs text-gray-600 line-clamp-1">{attempt.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                  سجل المدفوعات والتحويلات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {(!deliveryMan.moneyTransfers || deliveryMan.moneyTransfers.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد مدفوعات حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveryMan.moneyTransfers.map((transfer) => (
                      <div key={transfer.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">
                                {new Date(transfer.createdAt).toLocaleDateString("ar-MA")}
                              </p>
                              <p className="font-semibold text-base sm:text-lg text-red-600">
                                -{Math.abs(transfer.amount).toFixed(2)} د.م
                              </p>
                            </div>
                            {transfer.reference && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">المرجع</p>
                                <p className="text-xs sm:text-sm font-mono">{transfer.reference}</p>
                              </div>
                            )}
                            {transfer.note && (
                              <div className="col-span-1 xs:col-span-2 sm:col-span-1">
                                <p className="text-xs text-gray-500 mb-1">ملاحظات</p>
                                <p className="text-xs sm:text-sm line-clamp-2">{transfer.note}</p>
                              </div>
                            )}
                          </div>
                          
                          {transfer.invoiceImage && (
                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                صورة الفاتورة:
                              </p>
                              <a
                                href={transfer.invoiceImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                              >
                                <img
                                  src={transfer.invoiceImage || "/placeholder.svg"}
                                  alt="فاتورة الدفع"
                                  className="w-full max-w-xs rounded-lg border-2 border-gray-200 hover:border-[#048dba] transition-colors cursor-pointer group-hover:shadow-lg"
                                />
                                <p className="text-xs text-[#048dba] mt-1 flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  اضغط للعرض بالحجم الكامل
                                </p>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
