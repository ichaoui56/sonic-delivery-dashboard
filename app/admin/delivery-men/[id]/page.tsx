import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { DeliveryManDetailContent } from "@/components/admin/delivery-man/deliveryman-detail-content"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"

export const revalidate = 0

export default function DeliveryManDetailPage({ params }: { params: { id: string } }) {

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <Suspense fallback={<DeliveryManDetailSkeleton />}>
        <DeliveryManDetailContent deliveryManId={parseInt(params.id)} />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}

function DeliveryManDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-white border-b p-6">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
      </div>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
