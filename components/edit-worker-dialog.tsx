"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { updateWorker, deleteWorker } from "@/lib/actions/worker.actions"
import { mapWorkTypeToFrontend, mapWorkTypeToDatabase } from "@/lib/utils/worker-utils"
import type { Worker } from "@prisma/client"

interface EditWorkerDialogProps {
  worker: Worker
  onWorkerUpdated?: () => void
}

export function EditWorkerDialog({ worker, onWorkerUpdated }: EditWorkerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: worker.fullName,
    phoneNumber: worker.phoneNumber,
    weeklyPayment: worker.weeklyPayment.toString(),
    workType: mapWorkTypeToFrontend(worker.workType),
    isActive: worker.isActive,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        fullName: worker.fullName,
        phoneNumber: worker.phoneNumber,
        weeklyPayment: worker.weeklyPayment.toString(),
        workType: mapWorkTypeToFrontend(worker.workType),
        isActive: worker.isActive,
      })
    }
  }, [worker, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateWorker(worker.id, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        weeklyPayment: parseFloat(formData.weeklyPayment),
        workType: mapWorkTypeToDatabase(formData.workType) as "LAFSOW_MAHDI" | "ALFASALA",
        isActive: formData.isActive,
      })

      if (result.success) {
        toast.success("تم تحديث بيانات العامل بنجاح")
        setOpen(false)
        onWorkerUpdated?.()
      } else {
        toast.error(result.error || "فشل في تحديث بيانات العامل")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث البيانات")
      console.error("Error updating worker:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا العامل؟ سيتم حذف جميع سجلات الحضور والمدفوعات المرتبطة به.")) {
      return
    }

    setDeleteLoading(true)
    try {
      const result = await deleteWorker(worker.id)
      if (result.success) {
        toast.success("تم حذف العامل بنجاح")
        setOpen(false)
        onWorkerUpdated?.()
      } else {
        toast.error(result.error || "فشل في حذف العامل")
      }
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast.error("حدث خطأ أثناء حذف العامل")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>تعديل بيانات العامل</DialogTitle>
          <DialogDescription>قم بتحديث معلومات العامل وحالته</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <form onSubmit={handleSubmit} className="h-full">
            <div className="grid gap-4 h-full">
              <div className="grid gap-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                  required
                  disabled={loading || deleteLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="أدخل رقم الهاتف"
                  required
                  disabled={loading || deleteLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="weeklyPayment">الراتب الأسبوعي (.د.م)</Label>
                <Input
                  id="weeklyPayment"
                  type="number"
                  step="0.01"
                  value={formData.weeklyPayment}
                  onChange={(e) => setFormData({ ...formData, weeklyPayment: e.target.value })}
                  placeholder="1200"
                  required
                  disabled={loading || deleteLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label>نوع العمل</Label>
                <Select
                  value={formData.workType}
                  onValueChange={(value) => setFormData({ ...formData, workType: value })}
                  required
                  disabled={loading || deleteLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع العمل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lafso-mahdi">لافصو مهدي</SelectItem>
                    <SelectItem value="al-fasala">الفصالة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="active-toggle" className="text-base">
                    حالة العامل
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isActive
                      ? "العامل نشط ويظهر في الحضور اليومي"
                      : "العامل غير نشط ولن يظهر في الحضور اليومي"}
                  </p>
                </div>
                <Switch
                  id="active-toggle"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={loading || deleteLoading}
                />
              </div>
            </div>
            
            <DialogFooter className="flex flex-col gap-3 mt-6 flex-shrink-0">
              <div className="flex gap-3 w-full">
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
                  {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || deleteLoading}
                className="w-full"
              >
                {deleteLoading ? "جاري الحذف..." : "حذف العامل"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}