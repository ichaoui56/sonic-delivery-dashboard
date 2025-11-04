// components/clients-summary.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface Client {
  id: string
  name: string
  city: string
  phoneNumber: string
  balance: number
  totalSales: number
  totalPayments: number
  createdAt: Date
}

interface ClientsSummaryProps {
  clients: Client[]
}

export function ClientsSummary({ clients }: ClientsSummaryProps) {
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPayments: 0,
    totalBalance: 0,
    clientsOweYou: 0,
    youOweClients: 0
  })

  useEffect(() => {
    const totals = clients.reduce((acc, client) => {
      acc.totalSales += client.totalSales
      acc.totalPayments += client.totalPayments
      acc.totalBalance += client.balance
      
      if (client.balance > 0) {
        acc.clientsOweYou += client.balance
      } else if (client.balance < 0) {
        acc.youOweClients += Math.abs(client.balance)
      }
      
      return acc
    }, {
      totalSales: 0,
      totalPayments: 0,
      totalBalance: 0,
      clientsOweYou: 0,
      youOweClients: 0
    })

    setSummary(totals)
  }, [clients])

  const toLatinNumbers = (num: number): string => {
    return num.toFixed(2).replace(/\d/g, (d) => d)
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Total Sales */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center justify-between">
            شحال بيع ديال سلعة 
            <svg fill="#1a3dba" width="50px" height="50px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M541.7 768v-45.3c46.3-2.4 81.5-15 108.7-37.8 27.2-22.8 40.8-53.1 40.8-88.2 0-37.8-11-65.7-35.3-83.4-24.6-20.1-59.8-35.4-111.6-45.3h-2.6V351.8c35.3 5.1 65.3 15 95.1 35.4l43.6-55.5c-43.6-27.9-89.9-42.9-138.8-45.3V256h-40.8v30.3c-40.8 2.4-76.3 15-103.5 37.8-27.2 22.8-40.8 53.1-40.8 88.2s11 63 35.3 80.7c21.7 17.7 59.8 32.7 108.7 42.9v118.5c-38.2-5.1-76.3-22.8-114.2-53.1l-48.9 53.1c48.9 40.5 103.5 63 163.3 68.1V768h41zm2.6-219.6c27.2 7.5 43.6 15 54.4 22.8 8.1 10.2 13.6 20.1 13.6 35.4s-5.5 25.2-19.1 35.4c-13.6 10.2-30.1 15-48.9 17.7V548.4zM449.2 440c-8.1-7.5-13.6-20.1-13.6-32.7 0-15 5.5-25.2 16.2-35.4 13.6-10.2 27.2-15 48.9-17.7v108.6c-27.2-7.8-43.4-15.3-51.5-22.8z"></path></g></svg>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {toLatinNumbers(summary.totalSales)} د.م.
          </div>
        </CardContent>
      </Card>

      {/* Total Payments */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center justify-between">
            شحال مخلص 
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            {toLatinNumbers(summary.totalPayments)} د.م.
          </div>
        </CardContent>
      </Card>   
    </div>
  )
}