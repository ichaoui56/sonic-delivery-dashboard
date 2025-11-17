import { DashboardLayout } from "@/components/dashboard-layout"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { TrackShipmentsContent } from "@/components/merchant/track-shipments/track-shipments-content"

export const revalidate = 60

export default async function TrackShipmentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "MERCHANT") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <TrackShipmentsContent />
    </DashboardLayout>
  )
}
