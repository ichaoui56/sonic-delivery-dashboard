"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const clients = [
  { id: "C001", name: "شركة النور للملابس" },
  { id: "C002", name: "متجر الأمل" },
  { id: "C003", name: "شركة الفجر التجارية" },
  { id: "C004", name: "محلات السلام" },
  { id: "C005", name: "مؤسسة النجاح" },
]

const pyjamaTypes = [
  { id: "1", name: "بيجامة قطن - رجالي" },
  { id: "2", name: "بيجامة قطن - نسائي" },
  { id: "3", name: "بيجامة حرير - رجالي" },
  { id: "4", name: "بيجامة حرير - نسائي" },
  { id: "5", name: "بيجامة أطفال" },
]

export function NewSaleForm() {
  const [clientId, setClientId] = useState("")
  const [pyjamaType, setPyjamaType] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [paymentReceived, setPaymentReceived] = useState("")
  const [notes, setNotes] = useState("")

  const totalPrice = Number(quantity) * Number(unitPrice) || 0
  const remainingBalance = totalPrice - Number(paymentReceived) || 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({
      clientId,
      pyjamaType,
      quantity,
      unitPrice,
      totalPrice,
      paymentReceived,
      remainingBalance,
      notes,
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>تفاصيل عملية البيع</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">العميل</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pyjamaType">نوع البيجامة</Label>
                <Select value={pyjamaType} onValueChange={setPyjamaType}>
                  <SelectTrigger id="pyjamaType">
                    <SelectValue placeholder="اختر نوع البيجامة" />
                  </SelectTrigger>
                  <SelectContent>
                    {pyjamaTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">سعر الوحدة (ج.م)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReceived">المبلغ المدفوع (ج.م)</Label>
                <Input
                  id="paymentReceived"
                  type="number"
                  placeholder="0.00"
                  value={paymentReceived}
                  onChange={(e) => setPaymentReceived(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">تاريخ العملية</Label>
                <Input id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                placeholder="أضف أي ملاحظات إضافية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                حفظ عملية البيع
              </Button>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>ملخص العملية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">الكمية</span>
              <span className="font-medium">{quantity || "0"} قطعة</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">سعر الوحدة</span>
              <span className="font-medium">{Number(unitPrice).toLocaleString("ar-EG") || "0"} ج.م</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-medium">الإجمالي</span>
              <span className="text-xl font-bold">{totalPrice.toLocaleString("ar-EG")} ج.م</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">المبلغ المدفوع</span>
              <span className="font-medium text-primary">
                {Number(paymentReceived).toLocaleString("ar-EG") || "0"} ج.م
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-medium">الرصيد المتبقي</span>
              <span className={`text-xl font-bold ${remainingBalance > 0 ? "text-destructive" : "text-primary"}`}>
                {remainingBalance.toLocaleString("ar-EG")} ج.م
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <p className="font-medium mb-1">ملاحظة</p>
                <p className="text-primary-foreground/90">
                  سيتم تسجيل هذه العملية في سجل المبيعات وسيتم تحديث رصيد العميل تلقائياً
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
