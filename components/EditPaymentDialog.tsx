// components/edit-payment-dialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, Edit, Calendar } from "lucide-react"
import { updatePayment, deletePayment } from "@/lib/actions/worker.actions"
import { toast } from "sonner"
import type { Payment, PaymentType } from "@prisma/client"

interface EditPaymentDialogProps {
  payment: Payment
  workerName: string
  onPaymentUpdated: () => void
}

export function EditPaymentDialog({ payment, workerName, onPaymentUpdated }: EditPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: payment.amount.toString(),
    paymentType: payment.paymentType as "DAILY" | "WEEKLY" | "PARTIAL",
    note: payment.note || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح")
      return
    }

    setLoading(true)
    try {
      const result = await updatePayment(payment.id, {
        amount: parseFloat(formData.amount),
        paymentType: formData.paymentType,
        note: formData.note
      })

      if (result.success) {
        toast.success("تم تحديث الدفعة بنجاح")
        setOpen(false)
        onPaymentUpdated()
      } else {
        toast.error(result.error || "فشل في تحديث الدفعة")
      }
    } catch (error) {
      console.error("Error updating payment:", error)
      toast.error("حدث خطأ أثناء تحديث الدفعة")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return
    }

    setDeleteLoading(true)
    try {
      const result = await deletePayment(payment.id)
      if (result.success) {
        toast.success("تم حذف الدفعة بنجاح")
        setOpen(false)
        onPaymentUpdated()
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
    if (parts.length > 2) {
      return
    }
    setFormData(prev => ({ ...prev, amount: numericValue }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-3 w-3" />
          <span className="sr-only">تعديل الدفعة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            تعديل الدفعة
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Worker Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">{workerName}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              الأسبوع {payment.weekNumber} - {payment.year}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (د.م)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
              />
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label htmlFor="paymentType">نوع الدفعة</Label>
              <Select 
                value={formData.paymentType} 
                onValueChange={(value: "DAILY" | "WEEKLY" | "PARTIAL") => 
                  setFormData(prev => ({ ...prev, paymentType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">راتب أسبوعي</SelectItem>
                  <SelectItem value="DAILY">دفعة يومية</SelectItem>
                  <SelectItem value="PARTIAL">دفعة جزئية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">ملاحظات (اختياري)</Label>
              <Textarea
                id="note"
                placeholder="أي ملاحظات إضافية حول الدفعة..."
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading || deleteLoading}
                >
                  {loading ? "جاري التحديث..." : "تحديث الدفعة"}
                </Button>
              </div>
              
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || deleteLoading}
                className="w-full"
              >
                {deleteLoading ? "جاري الحذف..." : "حذف الدفعة"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}