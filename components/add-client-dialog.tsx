// components/add-client-dialog.tsx
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
import { createClient } from "@/lib/actions/client.actions"
import { toast } from "sonner"

interface AddClientDialogProps {
  onClientAdded?: () => void
}

export function AddClientDialog({ onClientAdded }: AddClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    phoneNumber: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createClient(formData)
      
      if (result.success) {
        toast.success("تم إضافة العميل بنجاح")
        setFormData({ name: "", city: "", phoneNumber: "" })
        setOpen(false)
        // Call the refresh callback
        onClientAdded?.()
      } else {
        toast.error(result.error || "فشل في إضافة العميل")
      }
    } catch (error) {
      console.error("Error creating client:", error)
      toast.error("حدث خطأ أثناء إضافة العميل")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto min-h-[44px] bg-transparent">
          <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          إضافة عميل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl">إضافة عميل جديد</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            أدخل بيانات العميل الجديد. اضغط حفظ عند الانتهاء.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <form onSubmit={handleSubmit} className="h-full">
            <div className="grid gap-4 h-full">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm md:text-base">
                  اسم العميل <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="أدخل اسم العميل"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="text-sm md:text-base"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm md:text-base">
                  المدينة <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="أدخل مدينة العميل"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="text-sm md:text-base"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm md:text-base">
                  رقم الهاتف <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  dir="ltr"
                  placeholder="01012345678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  className="text-sm md:text-base"
                  disabled={loading}
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2 mt-6 flex-shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                className="min-h-[44px]"
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button type="submit" className="min-h-[44px]" disabled={loading}>
                {loading ? "جاري الإضافة..." : "حفظ العميل"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}