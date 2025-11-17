import { getMerchantDashboardData } from "@/lib/actions/dashboard.actions"
import { MerchantDashboardClient } from "./merchant-dashboard-client"
import { DashboardData } from "@/types/types"

export async function MerchantDashboardContent() {
  const data = await getMerchantDashboardData()

  return <MerchantDashboardClient initialData={data as DashboardData} />
}
