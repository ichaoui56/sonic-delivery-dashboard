"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "./optimized-image"
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  X,
  ChevronDown,
  Eye,
  TrendingUp,
  DollarSign,
  Layers,
} from "lucide-react"

type Product = {
  id: number
  name: string
  description: string | null
  image: string | null
  sku: string | null
  price: number
  stockQuantity: number
  deliveredCount: number
  lowStockAlert: number
  isActive: boolean
  createdAt: Date
}

export function InventoryTable({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<string>("name")
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())

      let matchesStock = true
      switch (stockFilter) {
        case "IN_STOCK":
          matchesStock = product.stockQuantity > product.lowStockAlert
          break
        case "LOW_STOCK":
          matchesStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockAlert
          break
        case "OUT_OF_STOCK":
          matchesStock = product.stockQuantity === 0
          break
        case "ACTIVE":
          matchesStock = product.isActive
          break
        case "INACTIVE":
          matchesStock = !product.isActive
          break
      }

      return matchesSearch && matchesStock
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "ar")
        case "stock_high":
          return b.stockQuantity - a.stockQuantity
        case "stock_low":
          return a.stockQuantity - b.stockQuantity
        case "price_high":
          return b.price - a.price
        case "price_low":
          return a.price - b.price
        case "value_high":
          return b.price * b.stockQuantity - a.price * a.stockQuantity
        case "delivered_high":
          return b.deliveredCount - a.deliveredCount
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [products, searchTerm, stockFilter, sortBy])

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, product) => sum + product.price * product.stockQuantity, 0)
    const totalStock = products.reduce((sum, product) => sum + product.stockQuantity, 0)
    const lowStockItems = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert).length
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length

    return {
      total: products.length,
      totalStock,
      totalValue,
      lowStockItems,
      outOfStock,
    }
  }, [products])

  const clearFilters = () => {
    setSearchTerm("")
    setStockFilter("ALL")
    setSortBy("name")
  }

  const hasActiveFilters = searchTerm !== "" || stockFilter !== "ALL" || sortBy !== "name"

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="ابحث عن منتج باسم، SKU أو وصف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none bg-transparent"
                >
                  <Filter className="w-4 h-4 ml-2" />
                  فلترة وترتيب
                  <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">حالة المخزون</label>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="ALL">جميع المنتجات</option>
                    <option value="IN_STOCK">متوفر في المخزون</option>
                    <option value="LOW_STOCK">مخزون منخفض</option>
                    <option value="OUT_OF_STOCK">نفذ من المخزون</option>
                    <option value="ACTIVE">نشط</option>
                    <option value="INACTIVE">غير نشط</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">ترتيب حسب</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="name">الاسم (أ-ي)</option>
                    <option value="stock_high">الكمية (الأعلى أولاً)</option>
                    <option value="stock_low">الكمية (الأقل أولاً)</option>
                    <option value="price_high">السعر (الأعلى أولاً)</option>
                    <option value="price_low">السعر (الأقل أولاً)</option>
                    <option value="value_high">القيمة (الأعلى أولاً)</option>
                    <option value="delivered_high">الأكثر توصيلاً</option>
                    <option value="newest">الأحدث</option>
                  </select>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    بحث: {searchTerm}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {stockFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    المخزون: {stockFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setStockFilter("ALL")} />
                  </Badge>
                )}
                {sortBy !== "name" && (
                  <Badge variant="secondary" className="gap-1">
                    الترتيب: {sortBy}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSortBy("name")} />
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
          عرض <span className="font-semibold">{filteredAndSortedProducts.length}</span> من{" "}
          <span className="font-semibold">{products.length}</span> منتج
        </p>
      </div>

      {filteredAndSortedProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500 mb-2">لا توجد منتجات</p>
            <p className="text-sm text-gray-400">جرب تغيير معايير البحث أو الفلترة</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent" size="sm">
                مسح الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">قائمة المنتجات الشاملة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAndSortedProducts.map((product) => {
                const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockAlert
                const isOutOfStock = product.stockQuantity === 0
                const totalValue = product.price * product.stockQuantity

                return (
                  <div
                    key={product.id}
                    className="flex flex-col lg:flex-row items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-all hover:border-[#048dba]"
                  >
                    <div className="w-full lg:w-24 h-48 lg:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {product.image ? (
                        <OptimizedImage
                          src={product.image}
                          alt={product.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("[v0] Image failed to load:", product.image)
                            const target = e.currentTarget
                            target.style.display = "none"
                            const parent = target.parentElement
                            if (parent) {
                              const placeholder = document.createElement("div")
                              placeholder.className = "w-full h-full flex items-center justify-center"
                              placeholder.innerHTML =
                                '<svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>'
                              parent.appendChild(placeholder)
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 w-full space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                          {!product.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              غير نشط
                            </Badge>
                          )}
                          {isOutOfStock && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <X className="w-3 h-3 mr-1" />
                              نفذ من المخزون
                            </Badge>
                          )}
                          {isLowStock && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              مخزون منخفض
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {product.sku && (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Eye className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">SKU</p>
                              <p className="text-sm font-semibold truncate">{product.sku}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <DollarSign className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">السعر</p>
                            <p className="text-sm font-semibold text-blue-600">{product.price} د.م</p>
                          </div>
                        </div>

                        <div
                          className={`flex items-center gap-2 p-2 rounded ${isOutOfStock ? "bg-red-50" : isLowStock ? "bg-yellow-50" : "bg-teal-50"}`}
                        >
                          <Layers
                            className={`w-4 h-4 flex-shrink-0 ${isOutOfStock ? "text-red-600" : isLowStock ? "text-yellow-600" : "text-teal-600"}`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">المخزون</p>
                            <p
                              className={`text-sm font-bold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-yellow-600" : "text-teal-600"}`}
                            >
                              {product.stockQuantity} قطعة
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">تم التوصيل</p>
                            <p className="text-sm font-semibold text-green-600">{product.deliveredCount}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                          <DollarSign className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">قيمة المخزون</p>
                            <p className="text-sm font-semibold text-purple-600">{totalValue.toFixed(0)} د.م</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>تنبيه المخزون المنخفض: {product.lowStockAlert} قطعة</span>
                        <span>•</span>
                        <span>تم الإنشاء: {new Date(product.createdAt).toLocaleDateString("ar-MA")}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-bold mb-2">💡 معلومة مهمة</p>
            <ul className="space-y-1 mr-4">
              <li>
                • يتم تحديث كميات المخزون <span className="font-bold">تلقائياً</span> عند وصول شحناتك إلى مستودع الشركة
              </li>
              <li>• عندما تتغير حالة الشحنة إلى "تم التسليم للمستودع"، يتم إضافة الكميات فوراً</li>
              <li>• لا يمكن تعديل الكميات يدوياً لضمان دقة البيانات ومنع الأخطاء</li>
              <li>• يمكنك تتبع جميع شحناتك من صفحة "تتبع الشحنات"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
