import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryTable } from "@/components/inventory-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMerchantProducts, getInventoryStats } from "@/lib/actions/product-transfer-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Archive } from "lucide-react"

export const revalidate = 10

export default async function InventoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "MERCHANT") {
    redirect("/dashboard")
  }

  const [productsResult, statsResult] = await Promise.all([getMerchantProducts(), getInventoryStats()])

  const products = productsResult.success ? productsResult.data : []
  const stats = statsResult.success ? statsResult.data : null

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">إدارة المخزون</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1">
            عرض شامل للمخزون المتوفر في مستودع الشركة
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 leading-tight">إجمالي المنتجات</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-none">
                      {stats.totalProducts}
                    </p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 leading-tight">
                      {stats.activeProducts} نشط
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 leading-tight">إجمالي الكميات</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#048dba] leading-none">
                      {stats.totalStockQuantity}
                    </p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 leading-tight">قطعة</p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 leading-tight">قيمة المخزون</p>
                    <p className="text-sm sm:text-lg md:text-xl font-bold text-purple-600 leading-none break-all">
                      {stats.totalInventoryValue.toFixed(0)}
                    </p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 leading-tight">درهم</p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 leading-tight">تم التوصيل</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 leading-none">
                      {stats.totalDeliveredItems}
                    </p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 leading-tight">قطعة</p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 leading-tight">مخزون منخفض</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 leading-none">
                      {stats.lowStockProducts}
                    </p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 leading-tight">منتج</p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 leading-tight">نفذ من المخزون</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 leading-none">
                      {stats.outOfStockProducts}
                    </p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 leading-tight">منتج</p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && (stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-3 md:p-4 flex items-start gap-2 md:gap-3">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-yellow-900 mb-1 text-sm md:text-base">تنبيه المخزون</p>
                <p className="text-xs md:text-sm text-yellow-800 leading-relaxed">
                  {stats.lowStockProducts > 0 && (
                    <span>
                      <span className="font-bold">{stats.lowStockProducts}</span> منتج يحتاج إلى إعادة تعبئة
                      {stats.outOfStockProducts > 0 && " و "}
                    </span>
                  )}
                  {stats.outOfStockProducts > 0 && (
                    <span>
                      <span className="font-bold">{stats.outOfStockProducts}</span> منتج نفذ من المخزون
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {products && products.length > 0 ? (
          <InventoryTable products={products} />
        ) : (
          <Card>
            <CardContent className="py-12 md:py-16">
              <div className="text-center text-gray-500">
                <Package className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-lg md:text-xl font-medium mb-2">لا توجد منتجات</p>
                <p className="text-xs md:text-sm">ابدأ بإنشاء شحنة منتجات جديدة لإضافة منتجات إلى المخزون</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
