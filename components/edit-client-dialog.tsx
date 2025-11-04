"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateClient, deleteClient } from "@/lib/actions/client.actions"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
  city: string
  phoneNumber: string
  balance?: number
  totalSales?: number
  totalPayments?: number
  createdAt?: Date
  updatedAt?: Date
}
interface EditClientDialogProps {
  client: Client
  onUpdate?: () => void
}

export function EditClientDialog({ client, onUpdate }: EditClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: client.name,
    city: client.city,
    phoneNumber: client.phoneNumber,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateClient(client.id, formData)
      
      if (result.success) {
        toast.success("تم تحديث بيانات العميل بنجاح")
        setOpen(false)
        onUpdate?.()
      } else {
        toast.error(result.error || "فشل في تحديث بيانات العميل")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast.error("حدث خطأ أثناء تحديث بيانات العميل")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع المعاملات والدفعات المرتبطة به.")) {
      return
    }

    setDeleteLoading(true)
    try {
      const result = await deleteClient(client.id)
      if (result.success) {
        toast.success("تم حذف العميل بنجاح")
        setOpen(false)
        onUpdate?.()
      } else {
        toast.error(result.error || "فشل في حذف العميل")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("حدث خطأ أثناء حذف العميل")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>تعديل بيانات العميل</DialogTitle>
          <DialogDescription>قم بتحديث معلومات العميل</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <form onSubmit={handleSubmit} className="h-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم العميل</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading || deleteLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-city">المدينة</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                disabled={loading || deleteLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phoneNumber">رقم الهاتف</Label>
              <Input
                id="edit-phoneNumber"
                type="tel"
                dir="ltr"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
                disabled={loading || deleteLoading}
              />
            </div>

            <div className="flex flex-col gap-3 pt-4 flex-shrink-0">
              <div className="flex gap-3">
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
                  className="flex-1"
                  disabled={loading || deleteLoading}
                >
                  {loading ? "جاري التحديث..." : "حفظ التغييرات"}
                </Button>
              </div>
              
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || deleteLoading}
                className="w-full"
              >
                {deleteLoading ? "جاري الحذف..." : "حذف العميل"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}