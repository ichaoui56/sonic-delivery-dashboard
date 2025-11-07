import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateTransferForm } from "@/components/create-transfer-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const revalidate = 60 // Revalidate every 60 seconds

export default async function TransferProductsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "MERCHANT") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">نقل المنتجات</h1>
          <p className="text-gray-500 mt-1">قم بإنشاء طلب نقل منتجات إلى الشركة بالداخلة</p>
        </div>

        <CreateTransferForm />
      </div>
    </DashboardLayout>
  )
}
