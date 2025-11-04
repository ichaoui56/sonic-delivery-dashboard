// components/record-payment-dialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, Calendar } from "lucide-react"
import { recordPayment } from "@/lib/actions/worker.actions"
import { toast } from "sonner"

interface RecordPaymentDialogProps {
  workerId: string
  workerName: string
  currentBalance: number
  onPaymentRecorded: () => void
}

export function RecordPaymentDialog({ workerId, workerName, currentBalance, onPaymentRecorded }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    paymentType: "WEEKLY" as "DAILY" | "WEEKLY" | "PARTIAL",
    note: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح")
      return
    }

    setLoading(true)
    try {
      const result = await recordPayment({
        workerId,
        amount: parseFloat(formData.amount),
        paymentType: formData.paymentType,
        note: formData.note
      })

      if (result.success) {
        toast.success("تم تسجيل الدفعة بنجاح")
        setOpen(false)
        setFormData({ amount: "", paymentType: "WEEKLY", note: "" })
        onPaymentRecorded()
      } else {
        toast.error(result.error || "فشل في تسجيل الدفعة")
      }
    } catch (error) {
      console.error("Error recording payment:", error)
      toast.error("حدث خطأ أثناء تسجيل الدفعة")
    } finally {
      setLoading(false)
    }
  }

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    // Ensure only one decimal point
    const parts = numericValue.split('.')
    if (parts.length > 2) {
      return
    }
    setFormData(prev => ({ ...prev, amount: numericValue }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <DollarSign className="h-4 w-4 ml-2" />
          تسجيل دفعة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            تسجيل دفعة جديدة
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Worker Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">{workerName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              الرصيد الحالي: {currentBalance.toFixed(2)} د.م
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
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "جاري التسجيل..." : "تسجيل الدفعة"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}