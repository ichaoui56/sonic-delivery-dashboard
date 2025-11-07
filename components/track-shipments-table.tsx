"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "./optimized-image"
import { Package, Truck, CheckCircle, XCircle, Clock, Search, Filter, X, ChevronDown } from "lucide-react"

type Transfer = {
  id: number
  transferCode: string
  deliveryCompany: string | null
  trackingNumber: string | null
  status: string
  note: string | null
  createdAt: Date
  shippedAt: Date | null
  deliveredToWarehouseAt: Date | null
  transferItems: Array<{
    id: number
    quantity: number
    product: {
      id: number
      name: string
      price: number
      image: string | null
    }
  }>
}

const statusConfig = {
  PENDING: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  IN_TRANSIT: { label: "في الطريق", color: "bg-blue-100 text-blue-800", icon: Truck },
  DELIVERED_TO_WAREHOUSE: { label: "تم التسليم", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "تم الإلغاء", color: "bg-red-100 text-red-800", icon: XCircle },
}

export function TrackShipmentsTable({ transfers }: { transfers: Transfer[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [dateFilter, setDateFilter] = useState<string>("ALL")
  const [showFilters, setShowFilters] = useState(false)

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        transfer.transferCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.deliveryCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.transferItems.some((item) => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter
      const matchesStatus = statusFilter === "ALL" || transfer.status === statusFilter

      // Date filter
      let matchesDate = true
      if (dateFilter !== "ALL") {
        const transferDate = new Date(transfer.createdAt)
        const today = new Date()
        const daysDiff = Math.floor((today.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (dateFilter) {
          case "TODAY":
            matchesDate = daysDiff === 0
            break
          case "WEEK":
            matchesDate = daysDiff <= 7
            break
          case "MONTH":
            matchesDate = daysDiff <= 30
            break
          case "OLDER":
            matchesDate = daysDiff > 30
            break
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [transfers, searchTerm, statusFilter, dateFilter])

  const stats = useMemo(() => {
    return {
      total: transfers.length,
      pending: transfers.filter((t) => t.status === "PENDING").length,
      inTransit: transfers.filter((t) => t.status === "IN_TRANSIT").length,
      delivered: transfers.filter((t) => t.status === "DELIVERED_TO_WAREHOUSE").length,
      cancelled: transfers.filter((t) => t.status === "CANCELLED").length,
    }
  }, [transfers])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("ALL")
    setDateFilter("ALL")
  }

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "ALL" || dateFilter !== "ALL"

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("ALL")}>
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <Package className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs md:text-sm text-gray-600">الكل</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("PENDING")}>
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <Clock className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-xl md:text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs md:text-sm text-gray-600">قيد الانتظار</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter("IN_TRANSIT")}
        >
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <Truck className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-xl md:text-2xl font-bold">{stats.inTransit}</p>
              <p className="text-xs md:text-sm text-gray-600">في الطريق</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter("DELIVERED_TO_WAREHOUSE")}
        >
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-green-600" />
              <p className="text-xl md:text-2xl font-bold">{stats.delivered}</p>
              <p className="text-xs md:text-sm text-gray-600">تم التسليم</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("CANCELLED")}>
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <XCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-red-600" />
              <p className="text-xl md:text-2xl font-bold">{stats.cancelled}</p>
              <p className="text-xs md:text-sm text-gray-600">ملغي</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="ابحث برقم الشحنة، اسم المنتج، رقم التتبع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto bg-transparent"
              >
                <Filter className="w-4 h-4 ml-2" />
                فلترة
                <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">حالة الشحنة</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="PENDING">قيد الانتظار</option>
                    <option value="IN_TRANSIT">في الطريق</option>
                    <option value="DELIVERED_TO_WAREHOUSE">تم التسليم</option>
                    <option value="CANCELLED">ملغي</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">الفترة الزمنية</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="ALL">كل الأوقات</option>
                    <option value="TODAY">اليوم</option>
                    <option value="WEEK">آخر 7 أيام</option>
                    <option value="MONTH">آخر 30 يوم</option>
                    <option value="OLDER">أكثر من 30 يوم</option>
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    بحث: {searchTerm}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {statusFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    الحالة: {statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setStatusFilter("ALL")} />
                  </Badge>
                )}
                {dateFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    الفترة: {dateFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setDateFilter("ALL")} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                  مسح الكل
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-gray-600">
          عرض <span className="font-semibold">{filteredTransfers.length}</span> من{" "}
          <span className="font-semibold">{transfers.length}</span> شحنة
        </p>
      </div>

      {/* Transfers List */}
      {filteredTransfers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500 mb-2">لا توجد نتائج</p>
            <p className="text-sm text-gray-400">جرب تغيير معايير البحث أو الفلترة</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent" size="sm">
                مسح الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransfers.map((transfer) => {
            const status = statusConfig[transfer.status as keyof typeof statusConfig] || statusConfig.PENDING
            const StatusIcon = status.icon
            const totalItems = transfer.transferItems.reduce((sum, item) => sum + item.quantity, 0)
            const totalValue = transfer.transferItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

            return (
              <Card key={transfer.id} className="py-0 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-[#048dba] to-[#037a9f] text-white p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 md:w-6 md:h-6" />
                      <div>
                        <CardTitle className="text-white text-base md:text-lg">{transfer.transferCode}</CardTitle>
                        <p className="text-xs md:text-sm text-white/80 mt-1">
                          {new Date(transfer.createdAt).toLocaleDateString("ar-MA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${status.color} flex items-center gap-1.5 px-3 py-1 whitespace-nowrap`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Transfer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-gray-500 mb-1">شركة النقل</p>
                      <p className="font-semibold text-sm md:text-base">{transfer.deliveryCompany || "غير محدد"}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-500 mb-1">رقم التتبع</p>
                      <p className="font-semibold text-sm md:text-base break-all">
                        {transfer.trackingNumber || "غير متوفر"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-500 mb-1">القيمة الإجمالية</p>
                      <p className="font-semibold text-[#048dba] text-sm md:text-base">{totalValue.toFixed(2)} درهم</p>
                    </div>
                  </div>

                  {/* Timeline - Fixed and Dynamic */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 md:p-4 bg-gray-50 rounded-lg overflow-x-auto">
                    {transfer.status === "CANCELLED" ? (
                      /* Show Cancelled State */
                      <>
                        <div className="flex items-center gap-2 flex-1 min-w-[80px]">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold whitespace-nowrap">تم الإنشاء</p>
                            {transfer.createdAt && (
                              <p className="text-gray-500 hidden sm:block">
                                {new Date(transfer.createdAt).toLocaleDateString("ar-MA")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="hidden sm:block h-px sm:flex-1 bg-red-300 min-w-[20px]" />
                        <div className="flex items-center gap-2 flex-1 min-w-[80px]">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500">
                            <XCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold whitespace-nowrap text-red-600">تم الإلغاء</p>
                            <p className="text-gray-500 text-xs">الشحنة ملغاة</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Show Normal Progress */
                      <>
                        <div className="flex items-center gap-2 flex-1 min-w-[80px]">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold whitespace-nowrap">تم الإنشاء</p>
                            {transfer.createdAt && (
                              <p className="text-gray-500 hidden sm:block">
                                {new Date(transfer.createdAt).toLocaleDateString("ar-MA")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          className={`hidden sm:block h-px sm:flex-1 min-w-[20px] ${transfer.status === "IN_TRANSIT" || transfer.status === "DELIVERED_TO_WAREHOUSE" ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-[80px]">
                          <div
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${transfer.status === "IN_TRANSIT" || transfer.status === "DELIVERED_TO_WAREHOUSE" ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            <Truck className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <div className="text-xs">
                            <p
                              className={`font-semibold whitespace-nowrap ${transfer.status === "IN_TRANSIT" || transfer.status === "DELIVERED_TO_WAREHOUSE" ? "text-green-600" : ""}`}
                            >
                              تم الشحن
                            </p>
                            {transfer.shippedAt && (
                              <p className="text-gray-500 hidden sm:block">
                                {new Date(transfer.shippedAt).toLocaleDateString("ar-MA")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          className={`hidden sm:block h-px sm:flex-1 min-w-[20px] ${transfer.status === "DELIVERED_TO_WAREHOUSE" ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-[80px]">
                          <div
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${transfer.status === "DELIVERED_TO_WAREHOUSE" ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            <Package className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <div className="text-xs">
                            <p
                              className={`font-semibold whitespace-nowrap ${transfer.status === "DELIVERED_TO_WAREHOUSE" ? "text-green-600" : ""}`}
                            >
                              تم التسليم
                            </p>
                            {transfer.deliveredToWarehouseAt && (
                              <p className="text-gray-500 hidden sm:block">
                                {new Date(transfer.deliveredToWarehouseAt).toLocaleDateString("ar-MA")}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Products */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm md:text-base">المنتجات ({totalItems} قطعة)</h3>
                    <div className="space-y-2">
                      {transfer.transferItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          {item.product.image && (
                            <div className="relative w-full sm:w-12 md:w-16 h-32 sm:h-12 md:h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <OptimizedImage
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm md:text-base truncate">{item.product.name}</p>
                            <p className="text-xs md:text-sm text-gray-500">
                              {item.product.price} درهم × {item.quantity}
                            </p>
                          </div>
                          <div className="text-left w-full sm:w-auto">
                            <p className="font-semibold text-[#048dba] text-sm md:text-base">
                              {(item.product.price * item.quantity).toFixed(2)} درهم
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  {transfer.note && (
                    <div className="p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs md:text-sm font-semibold text-yellow-800 mb-1">ملاحظات:</p>
                      <p className="text-xs md:text-sm text-yellow-700">{transfer.note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
