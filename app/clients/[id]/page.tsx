// app/clients/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionDialog } from "@/components/new-transaction-dialog"
import { PaymentDialog } from "@/components/add-payment-dialog"
import { EditClientDialog } from "@/components/edit-client-dialog"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getClientById } from "@/lib/actions/client.actions"
import { toast } from "sonner"

// Define the proper types that match the server response
interface Transaction {
  id: string
  productName: string
  unitPrice: number
  quantity: number
  totalAmount: number
  note: string | null
  date: Date
  createdAt: Date
  clientId: string
}

interface ClientPayment {
  id: string
  amount: number
  note: string | null
  date: Date
  createdAt: Date
  clientId: string
}

interface ClientData {
  id: string
  name: string
  city: string
  phoneNumber: string
  balance: number
  totalSales: number
  totalPayments: number
  transactions: Transaction[]
  clientPayments: ClientPayment[]
  createdAt: Date
  updatedAt: Date
}

// Type guard to validate the server response
function isValidClientData(data: any): data is ClientData {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.city === 'string' &&
    typeof data.phoneNumber === 'string' &&
    typeof data.balance === 'number' &&
    typeof data.totalSales === 'number' &&
    typeof data.totalPayments === 'number' &&
    Array.isArray(data.transactions) &&
    Array.isArray(data.clientPayments) &&
    data.transactions.every((t: any) => 
      t && typeof t.totalAmount === 'number'
    )
  )
}

const formatDate = (dateInput: Date | string) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    calendar: "gregory",
  })
}

const toLatinNumbers = (str: string | number): string => {
  const arabicToLatin: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  }
  return String(str).replace(/[٠-٩]/g, (d) => arabicToLatin[d] || d)
}

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClient = async () => {
    setLoading(true)
    try {
      const result = await getClientById(id)
      if (result.success && result.data) {
        // Validate and sanitize the data
        if (isValidClientData(result.data)) {
          setClient(result.data)
        } else {
          console.error('Invalid client data structure:', result.data)
          toast.error("بيانات العميل غير صالحة")
        }
      } else {
        toast.error(result.error || "فشل في تحميل بيانات العميل")
      }
    } catch (error) {
      console.error("Error fetching client:", error)
      toast.error("حدث خطأ أثناء تحميل بيانات العميل")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchClient()
    }
  }, [id])

  // Safe number formatting to prevent NaN display
  const formatSafeNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return "0.00"
    }
    return toLatinNumbers(num.toFixed(2))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-8 md:py-12">
          <p className="text-muted-foreground text-sm md:text-base">جاري تحميل بيانات العميل...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-8 md:py-12">
          <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">العميل غير موجود</h1>
          <Link href="/clients">
            <Button size="sm" className="text-sm">
              العودة إلى قائمة العملاء
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const allTransactions = [
    ...client.transactions.map(t => ({ ...t, type: 'sale' as const })),
    ...client.clientPayments.map(p => ({ ...p, type: 'payment' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">تفاصيل العميل</h1>
        </div>

        {/* Client Info Card */}
        <Card>
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <CardTitle className="text-lg md:text-xl lg:text-2xl truncate">{client.name}</CardTitle>
                <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {client.city}
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap" dir="ltr">
                    <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {client.phoneNumber}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 self-start md:self-auto">
                <EditClientDialog client={client} onUpdate={fetchClient} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">الرصيد الحالي</p>
                <p
                  className={`text-lg md:text-xl lg:text-2xl font-bold ${client.balance > 0 ? "text-destructive" : client.balance < 0 ? "text-primary" : "text-green-600"}`}
                >
                  {formatSafeNumber(client.balance)} د.م.
                </p>
                {client.balance > 0 && <p className="text-xs text-muted-foreground mt-1">خاصو يخلص </p>}
                {client.balance < 0 && <p className="text-xs text-muted-foreground mt-1">زايدو في لخلاص </p>}
                {client.balance === 0 && <p className="text-xs text-green-600 mt-1">متساوي</p>}
              </div>

              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">إجمالي المبيعات</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{formatSafeNumber(client.totalSales)} د.م.</p>
                <p className="text-xs text-muted-foreground mt-1">{client.transactions.length} معاملة</p>
              </div>

              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">إجمالي الدفعات</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-primary">{formatSafeNumber(client.totalPayments)} د.م.</p>
                <p className="text-xs text-muted-foreground mt-1">{client.clientPayments.length} دفعة</p>
              </div>

              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">نسبة السداد</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">
                  {client.totalSales > 0 ? Math.round((client.totalPayments / client.totalSales) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">من إجمالي المبيعات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          <TransactionDialog 
            clientId={client.id} 
            clientName={client.name} 
            onTransactionAdded={fetchClient} 
          />
          <PaymentDialog 
            clientId={client.id} 
            clientName={client.name} 
            currentBalance={client.balance} 
            onPaymentAdded={fetchClient} 
          />
        </div>

        {/* Transactions Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="all" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              جميع المعاملات
            </TabsTrigger>
            <TabsTrigger value="sales" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              المبيعات
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              الدفعات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-3 md:mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">سجل المعاملات الكامل</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-lg border overflow-x-auto">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3 p-4">
                    {allTransactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        لا توجد معاملات مسجلة
                      </div>
                    ) : (
                      allTransactions.map((transaction, index) => (
                        <div key={transaction.id} className="border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                {transaction.type === "sale" ? (
                                  <Badge variant="destructive" className="text-xs">بيع</Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs bg-primary">دفعة</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(transaction.date)}
                                </span>
                              </div>
                              <p className="text-sm font-medium">
                                {transaction.type === "sale" ? "بيع" : "دفعة مالية"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.type === 'sale' ? transaction.note : (transaction.note || "-")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${transaction.type === "sale" ? "text-destructive" : "text-primary"}`}>
                                {transaction.type === "sale" ? "+" : "-"}
                                {toLatinNumbers(
                                  (transaction.type === "sale" ? transaction.totalAmount : transaction.amount).toFixed(2)
                                )} د.م.
                              </p>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground font-mono truncate">{transaction.id}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left text-xs md:text-sm">#</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">الملاحظات</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">المبلغ</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">التفاصيل</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">النوع</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">التاريخ</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">رقم المعاملة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              لا توجد معاملات مسجلة
                            </TableCell>
                          </TableRow>
                        ) : (
                          allTransactions.map((transaction, index) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-xs md:text-sm font-medium text-muted-foreground" dir="ltr">
                                {(index + 1).toLocaleString("en-US")}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm max-w-[150px] truncate">
                                {transaction.type === 'sale' ? transaction.note : (transaction.note || "-")}
                              </TableCell>
                              <TableCell>
                                {transaction.type === "sale" ? (
                                  <span className="font-bold text-destructive text-xs md:text-sm">
                                    +{toLatinNumbers(transaction.totalAmount.toFixed(2))} د.م.
                                  </span>
                                ) : (
                                  <span className="font-bold text-primary text-xs md:text-sm">
                                    -{toLatinNumbers(transaction.amount.toFixed(2))} د.م.
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {transaction.type === "sale" ? "بيع" : "دفعة مالية"}
                              </TableCell>
                              <TableCell>
                                {transaction.type === "sale" ? (
                                  <Badge variant="destructive" className="text-xs">بيع</Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs bg-primary">دفعة</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm whitespace-nowrap">
                                {toLatinNumbers(formatDate(transaction.date))}
                              </TableCell>
                              <TableCell className="font-medium text-xs md:text-sm">{transaction.id}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="mt-3 md:mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">سجل المبيعات</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-lg border overflow-x-auto">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3 p-4">
                    {client.transactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        لا توجد مبيعات مسجلة
                      </div>
                    ) : (
                      client.transactions.map((transaction, index) => (
                        <div key={transaction.id} className="border rounded-lg p-3 space-y-3 bg-card">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <h3 className="font-semibold text-sm">{transaction.productName}</h3>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.date)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.note || "-"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <TransactionDialog
                                clientId={client.id}
                                clientName={client.name}
                                onTransactionAdded={fetchClient}
                                transaction={transaction}
                                mode="edit"
                              >
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </Button>
                              </TransactionDialog>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">المبلغ الإجمالي</p>
                              <p className="font-bold text-destructive">
                                {toLatinNumbers(transaction.totalAmount.toFixed(2))} د.م.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">سعر الوحدة</p>
                              <p className="font-medium">
                                {toLatinNumbers(transaction.unitPrice.toFixed(2))} د.م.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">الكمية</p>
                              <p className="font-medium">{toLatinNumbers(transaction.quantity)}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground font-mono truncate">{transaction.id}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left text-xs md:text-sm">#</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">الملاحظات</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">المبلغ الإجمالي</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">سعر الوحدة</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">الكمية</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">اسم المنتج</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">التاريخ</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">الإجراءات</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">رقم المعاملة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                              لا توجد مبيعات مسجلة
                            </TableCell>
                          </TableRow>
                        ) : (
                          client.transactions.map((transaction, index) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-xs md:text-sm font-medium text-muted-foreground" dir="ltr">
                                {(index + 1).toLocaleString("en-US")}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm max-w-[120px] truncate">
                                {transaction.note || "-"}
                              </TableCell>
                              <TableCell className="font-bold text-destructive text-xs md:text-sm">
                                {toLatinNumbers(transaction.totalAmount.toFixed(2))} د.م.
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {toLatinNumbers(transaction.unitPrice.toFixed(2))} د.م.
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">{toLatinNumbers(transaction.quantity)}</TableCell>
                              <TableCell className="text-xs md:text-sm max-w-[100px] truncate">
                                {transaction.productName}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm whitespace-nowrap">
                                {toLatinNumbers(formatDate(transaction.date))}
                              </TableCell>
                              <TableCell>
                                <TransactionDialog
                                  clientId={client.id}
                                  clientName={client.name}
                                  onTransactionAdded={fetchClient}
                                  transaction={transaction}
                                  mode="edit"
                                >
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </Button>
                                </TransactionDialog>
                              </TableCell>
                              <TableCell className="font-medium text-xs md:text-sm">{transaction.id}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-3 md:mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">سجل الدفعات</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-lg border overflow-x-auto">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3 p-4">
                    {client.clientPayments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        لا توجد دفعات مسجلة
                      </div>
                    ) : (
                      client.clientPayments.map((payment, index) => (
                        <div key={payment.id} className="border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(payment.date)}
                              </p>
                              <p className="text-sm font-medium">دفعة مالية</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.note || "-"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <PaymentDialog
                                clientId={client.id}
                                clientName={client.name}
                                currentBalance={client.balance}
                                onPaymentAdded={fetchClient}
                                payment={payment}
                                mode="edit"
                              >
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </Button>
                              </PaymentDialog>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">المبلغ</p>
                            <p className="font-bold text-primary text-sm">
                              {toLatinNumbers(payment.amount.toFixed(2))} د.م.
                            </p>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground font-mono truncate">{payment.id}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left text-xs md:text-sm">#</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">الملاحظات</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">المبلغ</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">التاريخ</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">الإجراءات</TableHead>
                          <TableHead className="text-left text-xs md:text-sm">رقم المعاملة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.clientPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              لا توجد دفعات مسجلة
                            </TableCell>
                          </TableRow>
                        ) : (
                          client.clientPayments.map((payment, index) => (
                            <TableRow key={payment.id}>
                              <TableCell className="text-xs md:text-sm font-medium text-muted-foreground" dir="ltr">
                                {(index + 1).toLocaleString("en-US")}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm max-w-[150px] truncate">
                                {payment.note || "-"}
                              </TableCell>
                              <TableCell className="font-bold text-primary text-xs md:text-sm">
                                {toLatinNumbers(payment.amount.toFixed(2))} د.م.
                              </TableCell>
                              <TableCell className="text-xs md:text-sm whitespace-nowrap">
                                {toLatinNumbers(formatDate(payment.date))}
                              </TableCell>
                              <TableCell>
                                <PaymentDialog
                                  clientId={client.id}
                                  clientName={client.name}
                                  currentBalance={client.balance}
                                  onPaymentAdded={fetchClient}
                                  payment={payment}
                                  mode="edit"
                                >
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </Button>
                                </PaymentDialog>
                              </TableCell>
                              <TableCell className="font-medium text-xs md:text-sm">{payment.id}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}