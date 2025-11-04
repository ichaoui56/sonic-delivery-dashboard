// app/attendance/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function AttendanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    return redirect("/login")
  }

  return <DashboardLayout>{children}</DashboardLayout>
}