import { DashboardLayout } from "@/components/dashboard-layout"
import { getCurrentUserData } from "@/lib/actions/user.actions"

export async function DashboardLayoutWrapper({
  children,
  userRole,
}: {
  children: React.ReactNode
  userRole: string
}) {
  const result = await getCurrentUserData()
  const userData = result.success ? result.data : null

  return (
    <DashboardLayout 
      userRole={userRole}
      userData={userData ? {
        name: userData.name,
        email: userData.email,
        image: userData.image,
      } : undefined}
    >
      {children}
    </DashboardLayout>
  )
}
