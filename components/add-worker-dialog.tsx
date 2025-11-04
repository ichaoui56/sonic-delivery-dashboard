"use client"

import type React from "react"
import { useState } from "react"
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
import { createWorker } from "@/lib/actions/worker.actions"
import { toast } from "sonner"

interface AddWorkerDialogProps {
  onWorkerAdded?: () => void
}

export function AddWorkerDialog({ onWorkerAdded }: AddWorkerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    weeklyPayment: "",
    workType: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createWorker({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        weeklyPayment: parseFloat(formData.weeklyPayment),
        workType: formData.workType as "LAFSOW_MAHDI" | "ALFASALA",
      })

      if (result.success) {
        toast.success("تم إضافة العامل بنجاح")
        setFormData({ fullName: "", phoneNumber: "", weeklyPayment: "", workType: "" })
        setOpen(false)
        if (onWorkerAdded) {
          onWorkerAdded()
        }
      } else {
        toast.error(result.error || "فشل في إضافة العامل")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة العامل")
      console.error("Error adding worker:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto min-h-[44px] bg-transparent" variant="outline">
          <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة عامل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl">إضافة عامل جديد</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            أدخل بيانات العامل الجديد. اضغط حفظ عند الانتهاء.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <form onSubmit={handleSubmit} className="h-full">
            <div className="grid gap-4 h-full">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm md:text-base">
                  الاسم الكامل <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="أدخل اسم العامل"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={loading}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workType" className="text-sm md:text-base">
                  نوع العمل <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.workType}
                  onValueChange={(value) => setFormData({ ...formData, workType: value })}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="text-sm md:text-base">
                    <SelectValue placeholder="اختر نوع العمل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAFSOW_MAHDI">لافصو مهدي</SelectItem>
                    <SelectItem value="ALFASALA">الفصالة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyPayment" className="text-sm md:text-base">
                  الراتب الأسبوعي (د.م.) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="weeklyPayment"
                  type="number"
                  step="0.01"
                  placeholder="1200"
                  value={formData.weeklyPayment}
                  onChange={(e) => setFormData({ ...formData, weeklyPayment: e.target.value })}
                  required
                  disabled={loading}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm md:text-base">
                  رقم الهاتف <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0612345678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  disabled={loading}
                  className="text-sm md:text-base"
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2 mt-6 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="min-h-[44px]">
                إلغاء
              </Button>
              <Button type="submit" disabled={loading} className="min-h-[44px]">
                {loading ? "جاري الحفظ..." : "حفظ العامل"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}