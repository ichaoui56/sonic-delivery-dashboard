import { DashboardLayout } from "@/components/dashboard-layout"
import { TrackShipmentsTable } from "@/components/track-shipments-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMerchantTransfers } from "@/lib/actions/product-transfer-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"

export const revalidate = 60 // Revalidate every 60 seconds

export default async function TrackShipmentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "MERCHANT") {
    redirect("/dashboard")
  }

  const result = await getMerchantTransfers()
  const transfers = result.success ? result.data : []

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تتبع الشحنات</h1>
          <p className="text-gray-500 mt-1">راقب حالة شحناتك المرسلة إلى الشركة</p>
        </div>

        {transfers && transfers.length > 0 ? (
          <TrackShipmentsTable transfers={transfers} />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">لا توجد شحنات</p>
                <p className="text-sm">لم تقم بإنشاء أي شحنات بعد</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
