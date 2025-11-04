// components/transaction-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/actions/client.actions"
import { toast } from "sonner"

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

interface TransactionDialogProps {
  clientId: string
  clientName: string
  onTransactionAdded: () => void
  transaction?: Transaction | null // For edit mode
  mode?: "create" | "edit"
  children?: React.ReactNode
}

export function TransactionDialog({ 
  clientId, 
  clientName, 
  onTransactionAdded, 
  transaction,
  mode = "create",
  children 
}: TransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    productName: "",
    unitPrice: "",
    quantity: "",
    note: "",
    date: ""
  })

  // Initialize form with transaction data when in edit mode
  useEffect(() => {
    if (mode === "edit" && transaction) {
      setFormData({
        productName: transaction.productName,
        unitPrice: transaction.unitPrice.toString(),
        quantity: transaction.quantity.toString(),
        note: transaction.note || "",
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })
    } else {
      // Reset form for create mode
      setFormData({
        productName: "",
        unitPrice: "",
        quantity: "",
        note: "",
        date: new Date().toISOString().split('T')[0]
      })
    }
  }, [transaction, mode, open])

  const unitPrice = parseFloat(formData.unitPrice) || 0
  const quantity = parseInt(formData.quantity) || 0
  const totalAmount = unitPrice * quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productName.trim()) {
      toast.error("يرجى إدخال اسم المنتج")
      return
    }

    if (unitPrice <= 0) {
      toast.error("يرجى إدخال سعر وحدة صحيح")
      return
    }

    if (quantity <= 0) {
      toast.error("يرجى إدخال كمية صحيحة")
      return
    }

    setLoading(true)
    try {
      let result
      
      if (mode === "edit" && transaction) {
        result = await updateTransaction(transaction.id, {
          productName: formData.productName.trim(),
          unitPrice,
          quantity,
          note: formData.note.trim() || undefined,
          date: formData.date ? new Date(formData.date) : undefined
        })
      } else {
        result = await createTransaction({
          clientId,
          productName: formData.productName.trim(),
          unitPrice,
          quantity,
          note: formData.note.trim() || undefined,
          date: formData.date ? new Date(formData.date) : undefined
        })
      }

      if (result.success) {
        toast.success(mode === "edit" ? "تم تحديث المعاملة بنجاح" : "تم إضافة معاملة البيع بنجاح")
        setOpen(false)
        setFormData({ productName: "", unitPrice: "", quantity: "", note: "", date: "" })
        onTransactionAdded()
      } else {
        toast.error(result.error || `فشل في ${mode === "edit" ? "تحديث" : "إضافة"} المعاملة`)
      }
    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} transaction:`, error)
      toast.error(`حدث خطأ أثناء ${mode === "edit" ? "تحديث" : "إضافة"} المعاملة`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction || mode !== "edit") return
    
    if (!confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
      return
    }

    setDeleteLoading(true)
    try {
      const result = await deleteTransaction(transaction.id)
      if (result.success) {
        toast.success("تم حذف المعاملة بنجاح")
        setOpen(false)
        onTransactionAdded()
      } else {
        toast.error(result.error || "فشل في حذف المعاملة")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("حدث خطأ أثناء حذف المعاملة")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleNumberChange = (field: 'unitPrice' | 'quantity', value: string) => {
    if (field === 'unitPrice') {
      const numericValue = value.replace(/[^\d.]/g, '')
      const parts = numericValue.split('.')
      if (parts.length > 2) return
      setFormData(prev => ({ ...prev, [field]: numericValue }))
    } else {
      const numericValue = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [field]: numericValue }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة معاملة بيع
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "تعديل معاملة البيع" : "إضافة معاملة بيع جديدة"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">{clientName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="productName">اسم المنتج <span className="text-destructive">*</span></Label>
              <Input
                id="productName"
                placeholder="أدخل اسم المنتج..."
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                required
                disabled={loading}
              />
            </div>

            {/* Unit Price and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">سعر الوحدة (د.م) <span className="text-destructive">*</span></Label>
                <Input
                  id="unitPrice"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.unitPrice}
                  onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية <span className="text-destructive">*</span></Label>
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => handleNumberChange('quantity', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">تاريخ المعاملة</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                disabled={loading}
              />
            </div>

            {/* Total Amount Display */}
            {totalAmount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">المبلغ الإجمالي:</span>
                  <span className="text-xl font-bold text-blue-700">
                    {totalAmount.toFixed(2)} د.م.
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {quantity} × {unitPrice.toFixed(2)} د.م.
                </p>
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">ملاحظات (اختياري)</Label>
              <Textarea
                id="note"
                placeholder="أي ملاحظات إضافية حول المنتج أو البيع..."
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading || deleteLoading}
              >
                {loading 
                  ? (mode === "edit" ? "جاري التحديث..." : "جاري الإضافة...") 
                  : (mode === "edit" ? "تحديث" : "إضافة")
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}