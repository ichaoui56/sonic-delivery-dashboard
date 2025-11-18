"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDeliveryMan } from "@/lib/actions/admin/delivery-men"
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload } from 'lucide-react'

export function CreateDeliveryManDialog({ 
  children,
  onSuccess 
}: { 
  children: React.ReactNode
  onSuccess?: (deliveryMan: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [city, setCity] = useState("")
  const [baseFee, setBaseFee] = useState("0")
  const [active, setActive] = useState("true")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const result = await createDeliveryMan({
      name,
      email,
      phone: phone || null,
      password,
      image: profileImage,
      vehicleType: vehicleType || null,
      city: city || null,
      baseFee: parseFloat(baseFee) || 0,
      active: active === "true",
    })

    if (result.success) {
      setMessage({ type: "success", text: "تم إنشاء موظف التوصيل بنجاح" })
      if (onSuccess && result.data) {
        onSuccess(result.data)
      }
      setTimeout(() => {
        setOpen(false)
        setName("")
        setEmail("")
        setPhone("")
        setPassword("")
        setVehicleType("")
        setCity("")
        setBaseFee("0")
        setActive("true")
        setProfileImage(null)
        setImagePreview(null)
        setMessage(null)
        window.location.reload()
      }, 1000)
    } else {
      setMessage({ type: "error", text: result.error || "حدث خطأ" })
    }

    setIsLoading(false)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "الملف المختار ليس صورة" })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)

    try {
      const compressedFile = await compressImage(file, 200)
      const formData = new FormData()
      formData.set("file", compressedFile)

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("فشل رفع الصورة")
      }

      const url = await response.json()
      setProfileImage(url)
    } catch (error) {
      setMessage({ type: "error", text: "فشل في رفع الصورة" })
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة موظف توصيل جديد</DialogTitle>
        </DialogHeader>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={imagePreview || undefined} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">
                {name.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="createDMImage" className="cursor-pointer">
                <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>رفع صورة</span>
                    </>
                  )}
                </div>
              </Label>
              <Input
                id="createDMImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploadingImage || isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <Label htmlFor="dmName">الاسم الكامل *</Label>
              <Input
                id="dmName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="dmEmail">البريد الإلكتروني *</Label>
              <Input
                id="dmEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="dmPhone">رقم الهاتف</Label>
              <Input
                id="dmPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="dmPassword">كلمة المرور *</Label>
              <Input
                id="dmPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <Label htmlFor="dmVehicle">نوع المركبة</Label>
              <Input
                id="dmVehicle"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                disabled={isLoading}
                placeholder="دراجة نارية، سيارة، إلخ"
              />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="dmCity">المدينة *</Label>
              <Select value={city} onValueChange={setCity} disabled={isLoading} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الداخلة">الداخلة</SelectItem>
                  <SelectItem value="بوجدور">بوجدور</SelectItem>
                  <SelectItem value="العيون">العيون</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Base Fee */}
            <div>
              <Label htmlFor="dmBaseFee">الرسوم الأساسية (د.م)</Label>
              <Input
                id="dmBaseFee"
                type="number"
                step="0.01"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Active Status */}
            <div>
              <Label htmlFor="dmActive">الحالة</Label>
              <Select value={active} onValueChange={setActive} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">نشط</SelectItem>
                  <SelectItem value="false">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || uploadingImage}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "جاري الحفظ..." : "إنشاء موظف التوصيل"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
