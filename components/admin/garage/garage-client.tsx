"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Package, Search, Filter, Warehouse, TrendingUp } from 'lucide-react'

type Product = {
  id: number
  name: string
  price: number
  image: string | null
  sku: string | null
  stockQuantity: number
  deliveredCount: number
  merchant: {
    id: number
    companyName: string | null
    user: {
      name: string
      email: string
      phone: string | null
    }
  }
  TransferItem: Array<{
    transfer: Array<{
      transferCode: string
      deliveredToWarehouseAt: Date | null
    }>
  }>
}

export function GarageClient({ initialProducts }: { initialProducts: Product[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [merchantFilter, setMerchantFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("merchant")

  const uniqueMerchants = useMemo(() => {
    const merchantsMap = new Map()
    initialProducts.forEach((p) => {
      if (!merchantsMap.has(p.merchant.id)) {
        merchantsMap.set(p.merchant.id, p.merchant)
      }
    })
    return Array.from(merchantsMap.values())
  }, [initialProducts])

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = initialProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.merchant.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.merchant.companyName?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMerchant = merchantFilter === "all" || product.merchant.id.toString() === merchantFilter

      return matchesSearch && matchesMerchant
    })

    // Sort products
    filtered.sort((a, b) => {
      if (sortBy === "merchant") {
        const merchantA = a.merchant.companyName || a.merchant.user.name
        const merchantB = b.merchant.companyName || b.merchant.user.name
        return merchantA.localeCompare(merchantB, "ar")
      } else if (sortBy === "stock") {
        return b.stockQuantity - a.stockQuantity
      } else if (sortBy === "value") {
        return b.price * b.stockQuantity - a.price * a.stockQuantity
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name, "ar")
      }
      return 0
    })

    return filtered
  }, [initialProducts, searchQuery, merchantFilter, sortBy])

  const stats = useMemo(() => {
    return {
      totalProducts: initialProducts.length,
      totalStock: initialProducts.reduce((sum, p) => sum + p.stockQuantity, 0),
      totalValue: initialProducts.reduce((sum, p) => sum + p.price * p.stockQuantity, 0),
      uniqueMerchants: uniqueMerchants.length,
    }
  }, [initialProducts, uniqueMerchants])

  const groupedByMerchant = useMemo(() => {
    const groups = new Map<number, Product[]>()
    filteredAndSortedProducts.forEach((product) => {
      if (!groups.has(product.merchant.id)) {
        groups.set(product.merchant.id, [])
      }
      groups.get(product.merchant.id)!.push(product)
    })
    return groups
  }, [filteredAndSortedProducts])

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          مخزون المستودع
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          عرض وإدارة جميع المنتجات المتوفرة في المستودع
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card className="p-3 sm:p-4 border-[#048dba]/20 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-[#048dba]/10 rounded-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-[#048dba]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">إجمالي المنتجات</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.totalProducts.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-green-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <Warehouse className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">المخزون الكلي</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.totalStock.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-purple-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">القيمة الإجمالية</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.totalValue.toLocaleString("en-US")} DH
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">عدد التجار</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.uniqueMerchants.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-700">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-[#048dba]" />
            تصفية وترتيب المنتجات
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث باسم المنتج، SKU، أو التاجر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>

            <Select value={merchantFilter} onValueChange={setMerchantFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="التاجر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التجار</SelectItem>
                {uniqueMerchants.map((merchant) => (
                  <SelectItem key={merchant.id} value={merchant.id.toString()}>
                    {merchant.companyName || merchant.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-sm sm:col-span-2 lg:col-span-1">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merchant">التاجر</SelectItem>
                <SelectItem value="name">اسم المنتج</SelectItem>
                <SelectItem value="stock">الكمية (الأكثر)</SelectItem>
                <SelectItem value="value">القيمة (الأعلى)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || merchantFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-xs sm:text-sm text-gray-600">الفلاتر النشطة:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  بحث: {searchQuery}
                </Badge>
              )}
              {merchantFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  تاجر محدد
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setMerchantFilter("all")
                }}
                className="h-6 text-xs text-[#048dba] hover:text-[#037299]"
              >
                مسح الكل
              </Button>
            </div>
          )}

          <div className="text-xs sm:text-sm text-gray-600">
            عرض {filteredAndSortedProducts.length.toLocaleString("en-US")} من أصل{" "}
            {stats.totalProducts.toLocaleString("en-US")} منتج
          </div>
        </div>
      </Card>

      {/* Products Grouped by Merchant */}
      <div className="space-y-4 sm:space-y-6">
        {Array.from(groupedByMerchant.entries()).map(([merchantId, products]) => {
          const merchant = products[0].merchant
          const merchantTotalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0)
          const merchantTotalValue = products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0)

          return (
            <Card key={merchantId} className="p-3 sm:p-4 border-[#048dba]/20">
              {/* Merchant Header */}
              <div className="mb-4 pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#048dba]">
                    {merchant.companyName || merchant.user.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <Badge variant="secondary">
                      {products.length} منتج
                    </Badge>
                    <Badge variant="secondary">
                      {merchantTotalStock.toLocaleString("en-US")} قطعة
                    </Badge>
                    <Badge className="bg-[#048dba]/10 text-[#048dba] border-[#048dba]/20">
                      {merchantTotalValue.toLocaleString("en-US")} DH
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>البريد: {merchant.user.email}</p>
                  {merchant.user.phone && <p>الهاتف: {merchant.user.phone}</p>}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {products.map((product) => {
                  const lastTransfer = product.TransferItem[0]?.transfer[0]

                  return (
                    <Card key={product.id} className="p-2 sm:p-3 hover:shadow-md transition-shadow">
                      <div className="flex gap-2 sm:gap-3">
                        {product.image ? (
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm truncate mb-1">{product.name}</h4>
                          {product.sku && <p className="text-[10px] sm:text-xs text-gray-600 mb-1">SKU: {product.sku}</p>}
                          <div className="space-y-0.5 text-[10px] sm:text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">المخزون:</span>
                              <span className="font-bold text-[#048dba]">
                                {product.stockQuantity.toLocaleString("en-US")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">السعر:</span>
                              <span className="font-medium">{product.price.toLocaleString("en-US")} DH</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">القيمة:</span>
                              <span className="font-medium">
                                {(product.price * product.stockQuantity).toLocaleString("en-US")} DH
                              </span>
                            </div>
                            {lastTransfer && (
                              <div className="pt-1 border-t mt-1">
                                <span className="text-gray-600">آخر شحنة:</span>
                                <span className="font-medium mr-1">{lastTransfer.transferCode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {filteredAndSortedProducts.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <Warehouse className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
          <p className="text-xs sm:text-sm text-gray-600">لم يتم العثور على أي منتجات مطابقة للفلاتر المحددة</p>
        </Card>
      )}
    </div>
  )
}
