// components/payment-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientPayment, updateClientPayment, deleteClientPayment } from "@/lib/actions/client.actions"
import { toast } from "sonner"

interface ClientPayment {
  id: string
  amount: number
  note: string | null
  date: Date
  createdAt: Date
  clientId: string
}

interface PaymentDialogProps {
  clientId: string
  clientName: string
  currentBalance: number
  onPaymentAdded: () => void
  payment?: ClientPayment | null // For edit mode
  mode?: "create" | "edit"
  children?: React.ReactNode
}

export function PaymentDialog({ 
  clientId, 
  clientName, 
  currentBalance, 
  onPaymentAdded, 
  payment,
  mode = "create",
  children 
}: PaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    note: "",
    date: ""
  })

  // Initialize form with payment data when in edit mode
  useEffect(() => {
    if (mode === "edit" && payment) {
      setFormData({
        amount: payment.amount.toString(),
        note: payment.note || "",
        date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })
    } else {
      // Reset form for create mode
      setFormData({
        amount: "",
        note: "",
        date: new Date().toISOString().split('T')[0]
      })
    }
  }, [payment, mode, open])

  const paymentAmount = parseFloat(formData.amount) || 0
  const newBalance = currentBalance - paymentAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentAmount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح")
      return
    }

    setLoading(true)
    try {
      let result
      
      if (mode === "edit" && payment) {
        result = await updateClientPayment(payment.id, {
          amount: paymentAmount,
          note: formData.note.trim() || undefined,
          date: formData.date ? new Date(formData.date) : undefined
        })
      } else {
        result = await createClientPayment({
          clientId,
          amount: paymentAmount,
          note: formData.note.trim() || undefined,
          date: formData.date ? new Date(formData.date) : undefined
        })
      }

      if (result.success) {
        toast.success(mode === "edit" ? "تم تحديث الدفعة بنجاح" : "تم تسجيل الدفعة بنجاح")
        setOpen(false)
        setFormData({ amount: "", note: "", date: "" })
        onPaymentAdded()
      } else {
        toast.error(result.error || `فشل في ${mode === "edit" ? "تحديث" : "تسجيل"} الدفعة`)
      }
    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} payment:`, error)
      toast.error(`حدث خطأ أثناء ${mode === "edit" ? "تحديث" : "تسجيل"} الدفعة`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!payment || mode !== "edit") return
    
    if (!confirm("هل أنت متأكد من حذف هذه الدفعة؟")) {
      return
    }

    setDeleteLoading(true)
    try {
      const result = await deleteClientPayment(payment.id)
      if (result.success) {
        toast.success("تم حذف الدفعة بنجاح")
        setOpen(false)
        onPaymentAdded()
      } else {
        toast.error(result.error || "فشل في حذف الدفعة")
      }
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast.error("حدث خطأ أثناء حذف الدفعة")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '')
    const parts = numericValue.split('.')
    if (parts.length > 2) return
    setFormData(prev => ({ ...prev, amount: numericValue }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-green-600 hover:bg-green-700">
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            تسجيل دفعة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "تعديل الدفعة" : "تسجيل دفعة مالية"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">{clientName}</p>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">الرصيد الحالي:</span>
              <span
                className={`font-bold ${currentBalance > 0 ? "text-orange-600" : currentBalance < 0 ? "text-green-600" : "text-gray-600"}`}
              >
                {currentBalance.toFixed(2)} د.م.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ المدفوع (د.م) <span className="text-destructive">*</span></Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">تاريخ الدفعة</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                disabled={loading}
              />
            </div>

            {/* Balance Preview */}
            {paymentAmount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">الرصيد بعد الدفع:</span>
                  <span
                    className={`text-lg font-bold ${newBalance > 0 ? "text-orange-600" : newBalance < 0 ? "text-green-600" : "text-green-600"}`}
                  >
                    {newBalance.toFixed(2)} د.م.
                  </span>
                </div>
                {newBalance === 0 && (
                  <p className="text-xs text-green-600 mt-1">سيتم تسوية الحساب بالكامل</p>
                )}
                {newBalance < 0 && (
                  <p className="text-xs text-green-600 mt-1">سيصبح لدى العميل رصيد مقدم</p>
                )}
                {newBalance > 0 && (
                  <p className="text-xs text-orange-600 mt-1">سيتبقى على العميل دفع هذا المبلغ</p>
                )}
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">ملاحظات (اختياري)</Label>
              <Textarea
                id="note"
                placeholder="أي ملاحظات إضافية حول الدفعة..."
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                  disabled={loading || deleteLoading}
                >
                  {deleteLoading ? "جاري الحذف..." : "حذف"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={loading || deleteLoading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading || deleteLoading}
              >
                {loading 
                  ? (mode === "edit" ? "جاري التحديث..." : "جاري التسجيل...") 
                  : (mode === "edit" ? "تحديث" : "تسجيل")
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}