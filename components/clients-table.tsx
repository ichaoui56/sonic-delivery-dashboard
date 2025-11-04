// components/clients-table.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditClientDialog } from "@/components/edit-client-dialog"
import Link from "next/link"
import { getAllClients } from "@/lib/actions/client.actions"
import { toast } from "sonner"
import { AddClientDialog } from "./add-client-dialog"
import { ClientsSummary } from "./clients-summary" // Add this import

// Update the Client interface to match server response
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

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchClients = async () => {
    setLoading(true)
    try {
      const result = await getAllClients()
      if (result.success && result.data) {
        setClients(result.data)
      } else {
        toast.error(result.error || "فشل في تحميل بيانات العملاء")
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("حدث خطأ أثناء تحميل بيانات العملاء")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.includes(searchQuery) ||
      client.city.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toLatinNumbers = (str: string | number): string => {
    const arabicToLatin: Record<string, string> = {
      "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
      "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    }
    return String(str).replace(/[٠-٩]/g, (d) => arabicToLatin[d] || d)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">جاري تحميل بيانات العملاء...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add the summary component here */}
      <ClientsSummary clients={clients} />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg md:text-xl">قائمة العملاء</CardTitle>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
              <AddClientDialog onClientAdded={fetchClients} />
              <div className="relative flex-1">
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  type="search"
                  placeholder="بحث عن عميل..."
                  className="pr-10 w-full text-sm md:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            {/* Mobile View */}
            <div className="md:hidden space-y-3 p-4">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج تطابق البحث" : "لا توجد عملاء مسجلين"}
                </div>
              ) : (
                filteredClients.map((client, index) => (
                  <div key={client.id} className="border rounded-lg p-4 space-y-3 bg-card">
                    {/* Header - Reversed order */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-1">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Button>
                        </Link>
                        <EditClientDialog client={client} onUpdate={fetchClients} />
                      </div>
                      <div className="space-y-1 flex-1 text-left">
                        <h3 className="font-semibold text-base">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">{client.city}</p>
                        <p dir="ltr" className="text-sm font-mono">{client.phoneNumber}</p>
                      </div>
                    </div>

                    {/* Balance */}
                    <div>
                      {client.balance > 0 ? (
                        <Badge variant="destructive" className="text-xs w-full justify-center">
                          خاصو يخلص {toLatinNumbers(client.balance.toFixed(2))} د.م.
                        </Badge>
                      ) : client.balance < 0 ? (
                        <Badge variant="default" className="text-xs w-full justify-center bg-primary">
                          {toLatinNumbers(Math.abs(client.balance).toFixed(2))} د.م.
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs w-full justify-center"
                        >
                          متساوي
                        </Badge>
                      )}
                    </div>

                    {/* Financial Info - Reversed order */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1 text-left">
                        <p className="text-muted-foreground text-xs">الدفعات</p>
                        <p className="font-medium">{toLatinNumbers(client.totalPayments.toFixed(2))} د.م.</p>
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="text-muted-foreground text-xs">المبيعات</p>
                        <p className="font-medium">{toLatinNumbers(client.totalSales.toFixed(2))} د.م.</p>
                      </div>
                    </div>                  
                  </div>
                ))
              )}
            </div>

            {/* Tablet & Desktop View - Reversed columns */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right whitespace-nowrap text-sm">اسم العميل</TableHead>
                    <TableHead className="text-right whitespace-nowrap text-sm">المدينة</TableHead>
                    <TableHead className="text-right whitespace-nowrap text-sm">رقم الاتصال</TableHead>
                    <TableHead className="text-right whitespace-nowrap text-sm">إجمالي المبيعات</TableHead>
                    <TableHead className="text-right whitespace-nowrap text-sm">إجمالي الدفعات</TableHead>
                    <TableHead className="text-right whitespace-nowrap text-sm">الرصيد</TableHead>
                    <TableHead className="text-right whitespace-nowrap text-sm">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "لا توجد نتائج تطابق البحث" : "لا توجد عملاء مسجلين"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client, index) => (
                      <TableRow key={client.id}>
                        <TableCell className="text-sm whitespace-nowrap">{client.name}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{client.city}</TableCell>
                        <TableCell dir="ltr" className="text-right text-sm whitespace-nowrap">
                          {client.phoneNumber}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {toLatinNumbers(client.totalSales.toFixed(2))} د.م.
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {toLatinNumbers(client.totalPayments.toFixed(2))} د.م.
                        </TableCell>
                        <TableCell>
                          {client.balance > 0 ? (
                            <Badge variant="destructive" className="text-xs whitespace-nowrap">
                              خاصو يخلص {toLatinNumbers(client.balance.toFixed(2))} د.م.
                            </Badge>
                          ) : client.balance < 0 ? (
                            <Badge variant="default" className="text-xs whitespace-nowrap bg-primary">
                              زايدو في لخلاص {toLatinNumbers(Math.abs(client.balance).toFixed(2))} د.م.
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-xs whitespace-nowrap"
                            >
                              متساوي
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Link href={`/clients/${client.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </Button>
                            </Link>
                            <EditClientDialog client={client} onUpdate={fetchClients} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}