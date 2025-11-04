// app/workers/page.tsx
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WorkersTable } from "@/components/workers-table"
import { AddWorkerDialog } from "@/components/add-worker-dialog"
import { PayAllWorkersDialog } from "@/components/pay-all-workers-dialog" // Add this import
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function WorkersPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleWorkerChange = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handlePaymentCompleted = () => {
    // Refresh the table when payments are completed
    setRefreshKey(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">إدارة العمال</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">عرض وإدارة بيانات العمال والحضور</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Link href="/attendance" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto min-h-[44px]">
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                تسجيل الحضور
              </Button>
            </Link>
            
            {/* Add the Pay All Workers button */}
            <PayAllWorkersDialog onPaymentCompleted={handlePaymentCompleted} />
            
            <AddWorkerDialog onWorkerAdded={handleWorkerChange} />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              جميع العمال
            </TabsTrigger>
            <TabsTrigger value="lafso-mahdi" className="text-xs md:text-sm">
              لافصو مهدي
            </TabsTrigger>
            <TabsTrigger value="al-fasala" className="text-xs md:text-sm">
              الفصالة
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <WorkersTable key={`all-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="lafso-mahdi">
            <WorkersTable key={`lafso-${refreshKey}`} workTypeFilter="lafso-mahdi" />
          </TabsContent>
          <TabsContent value="al-fasala">
            <WorkersTable key={`fasala-${refreshKey}`} workTypeFilter="al-fasala" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}