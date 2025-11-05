import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const roleMap: Record<string, string> = {
    ADMIN: "مدير",
    MERCHANT: "تاجر",
    DELIVERYMAN: "عامل توصيل",
  }

  const userRole = roleMap[session.user.role] || session.user.role

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#A4D65E] text-gray-900">
                {userRole}
              </span>
            </div>
            <p className="text-gray-500 mt-1">مرحباً {session.user.name} - نظرة عامة على شحناتك</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>1 أكتوبر 2025 - 31 أكتوبر 2025</span>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-[#A4D65E] to-[#8BC34A]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-gray-900">نظرة عامة على الطرود</CardTitle>
                <CardDescription className="text-gray-800">تحليل شامل لشحناتك</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-white mb-2">0</div>
                <div className="text-sm text-gray-300 mb-1">إجمالي الطرود</div>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <span>0% مقارنة بالفترة السابقة</span>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-white mb-2">0</div>
                <div className="text-sm text-gray-300 mb-1">تم التسليم</div>
                <div className="text-xs text-gray-400">nan% من الإجمالي</div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-white mb-2">0</div>
                <div className="text-sm text-gray-300 mb-1">الإيرادات (درهم)</div>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  <span>صافي الربح</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اتجاه الشحنات</CardTitle>
            <CardDescription>الفترة: 01/10 - 01/11</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-sm">لا توجد بيانات متاحة لهذه الفترة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>حالة التسليم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#A4D65E]"></div>
                    <span className="text-sm text-gray-600">تم التسليم</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-500">nan%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-600">قيد التنفيذ</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-500">nan%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">تم الإرجاع</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-500">nan%</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="text-5xl font-bold text-[#A4D65E] mb-2">0%</div>
                <div className="text-sm text-gray-600">معدل التسليم</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-sm">لا يوجد نشاط حديث</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
