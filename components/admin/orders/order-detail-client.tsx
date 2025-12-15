"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface TimelineEvent {
  type: string;
  title: string;
  description: string;
  timestamp: any;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  details: any;
  sortOrder: number;
  attemptNumber?: number;
  attemptData?: any;
}
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Package, Truck, MapPin, User, Phone, Calendar, CreditCard, Clock, CheckCircle2, AlertCircle, XCircle, Printer, Shield, ShoppingCart, UserCheck, FileText } from 'lucide-react'
import { UpdateOrderStatusDialog } from "./update-order-status-dialog"
import { generateAndDownloadInvoice, viewInvoice } from "@/lib/utils/pdf-client"
import { useToast } from "@/hooks/use-toast"

type OrderDetailProps = {
  order: any
}

export function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter()
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [viewingPdf, setViewingPdf] = useState(false)
  const { toast } = useToast()

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

  // Function to get timeline events from order history (sorted chronologically)
  const getTimelineEvents = () => {
    const events: TimelineEvent[] = []
    
    // 1. Order Creation (always exists)
    events.push({
      type: 'CREATION',
      title: 'إنشاء الطلب',
      description: `تم إنشاء الطلب من قبل التاجر ${order.merchant?.user?.name || ''}`,
      timestamp: order.createdAt,
      icon: ShoppingCart,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      details: `تم إنشاء الطلب #${order.orderCode} بواسطة التاجر ${order.merchant?.user?.name || ''}`,
      sortOrder: 0
    })

    // 2. Admin Acceptance (if order status is not PENDING)
    if (order.status !== 'PENDING') {
      // Find the first delivery attempt with admin acceptance or look for status change to ACCEPTED
      const adminAcceptance = order.deliveryAttemptHistory?.find((attempt: any) => 
        attempt.notes?.includes('قبول الطلب من قبل الإدارة') || 
        attempt.notes?.includes('موافقة إدارية')
      )
      
      events.push({
        type: 'ADMIN_ACCEPTANCE',
        title: 'قبول الطلب من قبل الإدارة',
        description: 'تمت الموافقة على الطلب من قبل الإدارة',
        timestamp: adminAcceptance?.attemptedAt || order.updatedAt,
        icon: Shield,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        details: 'تمت الموافقة على الطلب وتم نقله إلى مرحلة التوصيل',
        sortOrder: 1
      })
    }

    // 3. Delivery Man Acceptance (if assigned)
    if (order.deliveryMan && order.status === 'ASSIGNED_TO_DELIVERY') {
      const deliveryAcceptance = order.deliveryAttemptHistory?.find((attempt: any) => 
        attempt.notes?.includes('قبول الطلب من قبل عامل التوصيل')
      )
      
      events.push({
        type: 'DELIVERY_ACCEPTANCE',
        title: 'قبول الطلب من قبل عامل التوصيل',
        description: `تم قبول الطلب بواسطة عامل التوصيل ${order.deliveryMan?.user?.name || ''}`,
        timestamp: deliveryAcceptance?.attemptedAt || order.updatedAt,
        icon: UserCheck,
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-100',
        details: `قام ${order.deliveryMan?.user?.name || ''} بقبول طلب التوصيل`,
        sortOrder: 2
      })
    }

    // 4. Delivery Attempts (excluding admin/delivery man acceptance attempts)
    if (order.deliveryAttemptHistory && order.deliveryAttemptHistory.length > 0) {
      const deliveryAttempts = order.deliveryAttemptHistory.filter((attempt: any) => 
        !attempt.notes?.includes('قبول الطلب من قبل الإدارة') &&
        !attempt.notes?.includes('موافقة إدارية') &&
        !attempt.notes?.includes('قبول الطلب من قبل عامل التوصيل')
      )
      
      deliveryAttempts.forEach((attempt: any, index: number) => {
        const attemptStatus = attempt.status
        let title = 'محاولة توصيل'
        let description = `محاولة توصيل ${index + 1}`
        let iconColor = 'text-yellow-600'
        let bgColor = 'bg-yellow-100'
        let details = `بواسطة: ${attempt.deliveryMan?.user?.name || ''}`
        
        if (attemptStatus === 'SUCCESSFUL') {
          title = 'توصيل ناجح'
          description = 'تم تسليم الطلب بنجاح'
          iconColor = 'text-green-600'
          bgColor = 'bg-green-100'
        } else if (attemptStatus === 'FAILED' || attemptStatus === 'REFUSED') {
          title = 'محاولة توصيل فاشلة'
          description = `سبب: ${attempt.reason || 'غير محدد'}`
          iconColor = 'text-red-600'
          bgColor = 'bg-red-100'
          details = `محاولة ${index + 1}: ${attempt.notes || 'لا توجد ملاحظات'}`
        } else if (attemptStatus === 'CUSTOMER_NOT_AVAILABLE') {
          title = 'العميل غير متاح'
          description = 'العميل غير متاح في وقت التسليم'
          iconColor = 'text-orange-600'
          bgColor = 'bg-orange-100'
        } else if (attemptStatus === 'WRONG_ADDRESS') {
          title = 'عنوان خاطئ'
          description = 'العنوان المقدم غير صحيح'
          iconColor = 'text-red-600'
          bgColor = 'bg-red-100'
        } else if (attemptStatus === 'ATTEMPTED') {
          title = 'محاولة توصيل'
          description = 'محاولة تسليم الطلب'
        }
        
        events.push({
          type: 'DELIVERY_ATTEMPT',
          title,
          description,
          timestamp: attempt.attemptedAt,
          icon: Truck,
          iconColor,
          bgColor,
          details,
          attemptNumber: index + 1,
          attemptData: attempt,
          sortOrder: 3 + index
        })
      })
    }

    // 5. Report (if reported)
    if (order.status === 'REPORTED') {
      const reportEvent = order.deliveryAttemptHistory?.find((attempt: any) => 
        attempt.status === 'REPORTED' || attempt.notes?.includes('إبلاغ')
      )
      
      events.push({
        type: 'REPORT',
        title: 'بلاغ عن الطلب',
        description: 'تم إبلاغ عن مشكلة في الطلب',
        timestamp: reportEvent?.attemptedAt || order.updatedAt,
        icon: AlertCircle,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100',
        details: order.note || 'تم الإبلاغ عن مشكلة في الطلب',
        sortOrder: 100
      })
    }

    // 6. Delivery Completed
    if (order.status === 'DELIVERED' && order.deliveredAt) {
      const deliveryCompleted = order.deliveryAttemptHistory?.find((attempt: any) => 
        attempt.status === 'SUCCESSFUL'
      )
      
      events.push({
        type: 'DELIVERY_COMPLETED',
        title: 'اكتمال التوصيل',
        description: 'تم تسليم الطلب إلى العميل بنجاح',
        timestamp: deliveryCompleted?.attemptedAt || order.deliveredAt,
        icon: CheckCircle2,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100',
        details: `تم تسليم الطلب بنجاح`,
        sortOrder: 1000
      })
    }

    // 7. Order Cancelled/Rejected
    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      const cancellationEvent = order.deliveryAttemptHistory?.find((attempt: any) => 
        attempt.status === 'REFUSED' || 
        attempt.status === 'CANCELLED' ||
        attempt.notes?.includes('إلغاء') ||
        attempt.notes?.includes('رفض')
      )
      
      events.push({
        type: 'CANCELLATION',
        title: order.status === 'CANCELLED' ? 'إلغاء الطلب' : 'رفض الطلب',
        description: order.status === 'CANCELLED' ? 'تم إلغاء الطلب' : 'تم رفض الطلب',
        timestamp: cancellationEvent?.attemptedAt || order.updatedAt,
        icon: XCircle,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100',
        details: order.note || 'تم إلغاء/رفض الطلب',
        sortOrder: 1000
      })
    }

    // Sort events by timestamp (oldest first for chronological display)
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const timelineEvents = getTimelineEvents()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED": return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "CANCELLED":
      case "REJECTED": return <XCircle className="w-5 h-5 text-red-600" />
      case "REPORTED": return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-[#048dba]" />
    }
  }

  const getEventIcon = (event: any) => {
    const Icon = event.icon
    return <Icon className={`w-5 h-5 ${event.iconColor}`} />
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ar-MA", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusProgress = () => {
    const statusOrder = ['PENDING', 'ACCEPTED', 'ASSIGNED_TO_DELIVERY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(order.status)
    return {
      currentStep: currentIndex + 1,
      totalSteps: statusOrder.length,
      percentage: ((currentIndex + 1) / statusOrder.length) * 100
    }
  }

  const progress = getStatusProgress()

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 px-2 sm:px-0">
      {/* Header - Fully Responsive */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="hover:bg-[#048dba]/10 text-[#048dba] flex-shrink-0 h-10 w-10"
            aria-label="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                الطلب #{order.orderCode}
              </h1>
              <Badge className={`${statusColors[order.status]} border-0 text-xs sm:text-sm whitespace-nowrap`}>
                {statusLabels[order.status]}
              </Badge>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">
              تم الإنشاء في {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        
        {/* Action Buttons - Stack on mobile */}
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
          <Button 
            variant="outline" 
            size="sm"
            className="border-[#048dba] text-[#048dba] hover:bg-[#048dba]/10 text-xs sm:text-sm h-9 sm:h-10"
            onClick={async () => {
              setGeneratingPdf(true)
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
                  orderItems: order.orderItems.map((item: { id: number; quantity: number; product: { name: string } }) => ({
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
                setGeneratingPdf(false)
              }
            }}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <span className="text-xs">جاري التحميل...</span>
            ) : (
              <span className="flex items-center gap-1 sm:gap-2">
                <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">تحميل الفاتورة</span>
                <span className="sm:hidden">تحميل</span>
              </span>
            )}
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            className="border-green-600 text-green-600 hover:bg-green-600/10 text-xs sm:text-sm h-9 sm:h-10"
            onClick={async () => {
              setViewingPdf(true)
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
                  orderItems: order.orderItems.map((item: { id: number; quantity: number; product: { name: string } }) => ({
                    id: item.id,
                    quantity: item.quantity,
                    product: {
                      name: item.product.name
                    }
                  }))
                }

                const logoUrl = '/images/logo/logo.png'
                const result = await viewInvoice(orderForPDF, "Your Store Name", logoUrl)

                if (!result.success) {
                  throw new Error(result.error || 'Failed to open PDF')
                }
              } catch (error) {
                console.error('Error viewing PDF:', error)
                toast({
                  title: "خطأ",
                  description: "حدث خطأ أثناء فتح الفاتورة",
                  variant: "destructive"
                })
              } finally {
                setViewingPdf(false)
              }
            }}
            disabled={viewingPdf}
          >
            {viewingPdf ? (
              <span className="text-xs">جاري التحميل...</span>
            ) : (
              <span className="flex items-center gap-1 sm:gap-2">
                <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">عرض الفاتورة</span>
                <span className="sm:hidden">عرض</span>
              </span>
            )}
          </Button>

          <UpdateOrderStatusDialog 
            orderId={order.id}
            currentStatus={order.status}
            orderCode={order.orderCode}
            onSuccess={() => router.refresh()}
          >
            <Button size="sm" className="bg-[#048dba] hover:bg-[#037296] text-xs sm:text-sm h-9 sm:h-10">
              تحديث الحالة
            </Button>
          </UpdateOrderStatusDialog>
        </div>
      </div>

      {/* Order Progress - Responsive */}
      <Card className="shadow-sm">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
            تقدم الطلب
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">الخطوة {progress.currentStep} من {progress.totalSteps}</span>
              <span className="text-xs sm:text-sm font-medium text-[#048dba]">{Math.round(progress.percentage)}%</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#048dba] rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 sm:mt-4">
              {['قيد الانتظار', 'مقبول', 'مسند للتوصيل', 'تم التوصيل'].map((step, index) => (
                <div key={index} className="flex flex-col items-center px-1">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1 sm:mb-2 text-xs sm:text-sm ${
                    index + 1 <= progress.currentStep 
                      ? 'bg-[#048dba] text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`text-[10px] xs:text-xs font-medium text-center leading-tight ${
                    index + 1 <= progress.currentStep ? 'text-[#048dba]' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Complete Timeline - Fully Responsive */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                سجل العمليات الكامل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="relative space-y-4 sm:space-y-8">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="relative flex items-start gap-3 sm:gap-4">
                    {/* Timeline line */}
                    {index !== timelineEvents.length - 1 && (
                      <div className="absolute left-[15px] sm:left-[17px] top-8 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    
                    {/* Icon */}
                    <div className={`${event.bgColor} rounded-full p-1.5 sm:p-2 z-10 flex-shrink-0`}>
                      {getEventIcon(event)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{event.title}</p>
                          <p className="text-gray-600 text-xs sm:text-sm mt-0.5 line-clamp-2">{event.description}</p>
                          
                          {/* Additional details for specific events */}
                          {event.type === 'DELIVERY_ATTEMPT' && event.attemptData && (
                            <div className="mt-1.5 sm:mt-2 space-y-1 sm:space-y-2">
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                                <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 truncate">عامل التوصيل: {event.attemptData.deliveryMan?.user?.name || 'غير معروف'}</span>
                              </div>
                              {event.attemptData.notes && (
                                <div className="text-xs sm:text-sm bg-gray-50 p-1.5 sm:p-2 rounded mt-0.5 text-gray-600 border">
                                  <span className="font-medium">ملاحظات: </span>
                                  <span className="line-clamp-2">{event.attemptData.notes}</span>
                                </div>
                              )}
                              {event.attemptData.location && (
                                <div className="text-xs sm:text-sm text-gray-500">
                                  <span className="font-medium">الموقع: </span>
                                  <span className="truncate">{event.attemptData.location}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {event.type === 'REPORT' && (
                            <div className="mt-1.5 sm:mt-2">
                              <p className="text-xs sm:text-sm bg-red-50 p-1.5 sm:p-2 rounded text-red-600 border border-red-100 line-clamp-3">
                                {event.details}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-start sm:items-end gap-1 sm:gap-2 mt-1 sm:mt-0">
                          <p className="text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(event.timestamp)}
                          </p>
                          <Badge 
                            variant="outline" 
                            className="text-[10px] sm:text-xs"
                          >
                            {event.type === 'CREATION' ? 'إنشاء' : 
                             event.type === 'ADMIN_ACCEPTANCE' ? 'موافقة إدارية' :
                             event.type === 'DELIVERY_ACCEPTANCE' ? 'قبول توصيل' :
                             event.type === 'DELIVERY_ATTEMPT' ? `محاولة ${event.attemptNumber}` :
                             event.type === 'DELIVERY_COMPLETED' ? 'اكتمال' :
                             event.type === 'REPORT' ? 'بلاغ' :
                             event.type === 'CANCELLATION' ? 'إلغاء/رفض' : 'حدث'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* No events message */}
                {timelineEvents.length === 0 && (
                  <div className="text-center py-4 sm:py-8 text-gray-500 text-sm sm:text-base">
                    لا توجد أحداث مسجلة لهذا الطلب بعد
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products Card - Responsive */}
          <Card className="border-t-4 border-t-[#048dba] shadow-sm">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                المنتجات ({order.orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {order.orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {item.product.image ? (
                      <img 
                        src={item.product.image || "/placeholder.svg"} 
                        alt={item.product.name} 
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md border flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0">
                        <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.product.name}</h3>
                      <p className="text-gray-500 text-xs sm:text-sm">الكمية: {item.quantity}</p>
                      {item.isFree && (
                        <Badge className="mt-0.5 bg-green-100 text-green-800 border-0 text-[10px] sm:text-xs">
                          مجاني
                        </Badge>
                      )}
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="font-bold text-[#048dba] text-sm sm:text-base">{item.price.toFixed(2)} د.م</p>
                      <p className="text-gray-500 text-[10px] sm:text-xs">للقطعة</p>
                      {item.originalPrice && item.originalPrice !== item.price && (
                        <p className="text-gray-400 text-[10px] sm:text-xs line-through">
                          {item.originalPrice.toFixed(2)} د.م
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Separator className="my-2 sm:my-4" />
                
                {/* Discount Information */}
                {(order.totalDiscount && order.totalDiscount > 0) && (
                  <>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600">المجموع الأصلي</span>
                      <span className="font-medium">{order.originalTotalPrice?.toFixed(2) || order.totalPrice.toFixed(2)} د.م</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600">الخصم</span>
                      <span className="font-medium text-red-600">-{order.totalDiscount.toFixed(2)} د.م</span>
                    </div>
                    <Separator className="my-2 sm:my-4" />
                  </>
                )}
                
                <div className="flex justify-between items-center pt-1 sm:pt-2">
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">المجموع الكلي</span>
                  <span className="text-lg sm:text-xl font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info - Responsive Grid */}
        <div className="space-y-4 sm:space-y-6">
          {/* Customer Info */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">الاسم</p>
                  <p className="font-medium text-sm sm:text-base truncate">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">الهاتف</p>
                  <p className="font-medium text-sm sm:text-base dir-ltr text-right truncate">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">العنوان</p>
                  <p className="font-medium text-sm sm:text-base line-clamp-2">{order.address}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs">{order.city}</Badge>
                </div>
              </div>
              {order.note && (
                <div className="pt-2 border-t">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">ملاحظات إضافية</p>
                  <p className="text-xs sm:text-sm bg-gray-50 p-1.5 sm:p-2 rounded border line-clamp-3">{order.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Merchant Info */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                التاجر
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#048dba] font-bold text-sm sm:text-base flex-shrink-0">
                  {order.merchant.user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{order.merchant.user.name}</p>
                  <p className="text-gray-500 text-xs sm:text-sm truncate">{order.merchant.companyName || "متجر"}</p>
                </div>
              </div>
              <div className="pt-1 sm:pt-2 border-t space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">أرباح التاجر</span>
                  <span className="font-medium text-green-600">{order.merchantEarning.toFixed(2)} د.م</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">رسوم المنصة</span>
                  <span className="font-medium text-gray-600">{(order.totalPrice - order.merchantEarning).toFixed(2)} د.م</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                التوصيل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              {order.deliveryMan ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm sm:text-base flex-shrink-0">
                    {order.deliveryMan.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{order.deliveryMan.user.name}</p>
                    <p className="text-gray-500 text-xs sm:text-sm truncate">{order.deliveryMan.vehicleType || "موصل"}</p>
                    {order.deliveryMan.city && (
                      <Badge variant="outline" className="mt-0.5 text-[10px] sm:text-xs">
                        {order.deliveryMan.city}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 sm:py-4 bg-gray-50 rounded-lg border border-dashed">
                  <p className="text-gray-500 text-xs sm:text-sm">لم يتم تعيين موصل بعد</p>
                </div>
              )}
              
              <div className="pt-1 sm:pt-2 border-t space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">طريقة الدفع</span>
                  <Badge variant="secondary" className={`text-[10px] sm:text-xs ${
                    order.paymentMethod === "COD" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                  }`}>
                    {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                  </Badge>
                </div>
                {order.deliveryAttemptHistory && order.deliveryAttemptHistory.length > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">عدد محاولات التوصيل</span>
                    <span className="font-medium">{order.deliveryAttemptHistory.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}