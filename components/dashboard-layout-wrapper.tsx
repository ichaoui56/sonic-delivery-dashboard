import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardLayout } from "@/components/dashboard-layout" // Your client component
import type React from "react"

interface DashboardLayoutWrapperProps {
    children: React.ReactNode
}

export default async function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
    // Check authentication on the server
    const session = await auth()

    if (!session) {
        return redirect("/login")
    }

    // If authenticated, render the client component
    return <DashboardLayout>{children}</DashboardLayout>
}