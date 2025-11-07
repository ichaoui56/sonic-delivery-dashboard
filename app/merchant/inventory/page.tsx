import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryTable } from "@/components/inventory-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMerchantProducts, getInventoryStats } from "@/lib/actions/product-transfer-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Archive } from "lucide-react"

export const revalidate = 60

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة المخزون</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">عرض شامل للمخزون المتوفر في مستودع الشركة</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">إجمالي المنتجات</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                    <p className="text-xs text-gray-400">{stats.activeProducts} نشط</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">إجمالي الكميات</p>
                    <p className="text-xl md:text-2xl font-bold text-[#048dba]">{stats.totalStockQuantity}</p>
                    <p className="text-xs text-gray-400">قطعة</p>
                  </div>
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Archive className="w-5 h-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">قيمة المخزون</p>
                    <p className="text-lg md:text-xl font-bold text-purple-600">
                      {stats.totalInventoryValue.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-400">درهم</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">تم التوصيل</p>
                    <p className="text-xl md:text-2xl font-bold text-green-600">{stats.totalDeliveredItems}</p>
                    <p className="text-xs text-gray-400">قطعة</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">مخزون منخفض</p>
                    <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</p>
                    <p className="text-xs text-gray-400">منتج</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">نفذ من المخزون</p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">{stats.outOfStockProducts}</p>
                    <p className="text-xs text-gray-400">منتج</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && (stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900 mb-1">تنبيه المخزون</p>
                <p className="text-sm text-yellow-800">
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
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <Package className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-medium mb-2">لا توجد منتجات</p>
                <p className="text-sm">ابدأ بإنشاء شحنة منتجات جديدة لإضافة منتجات إلى المخزون</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
