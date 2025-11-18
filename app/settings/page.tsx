import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { SettingsContent } from "@/components/settings/settings-content"
import { Suspense } from "react"
import SettingsLoading from "./loading"

export const revalidate = 60

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardLayoutWrapper userRole={session.user.role}>
      <Suspense fallback={<SettingsLoading />}>
        <SettingsContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
