import { DashboardLayout } from "@/components/dashboard-layout"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { getMerchantProducts } from "@/lib/actions/order.actions"
import { CreateOrderForm } from "@/components/create-order-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function CreateOrderPage() {
  const user = await getCurrentUser()
  const products = await getMerchantProducts()

  return (
    <DashboardLayout userRole={user?.role || "MERCHANT"}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إنشاء طلب جديد</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <CreateOrderForm products={products} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
