"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateMerchantProfile, updateUserProfile } from "@/lib/actions/settings.actions"
import { useRouter } from 'next/navigation'
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X } from 'lucide-react'

interface MerchantSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  merchant: {
    id: number
    companyName: string | null
    rib: string | null
    bankName: string | null
    balance: number
    totalEarned: number
    baseFee: number
  }
}

interface SettingsClientProps {
  initialData: MerchantSettingsData
}

export function SettingsClient({ initialData }: SettingsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // User profile state
  const [userName, setUserName] = useState(initialData.user.name)
  const [userPhone, setUserPhone] = useState(initialData.user.phone || "")
  const [profileImage, setProfileImage] = useState<string | null>(initialData.user.image)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.user.image)

  // Merchant profile state variables
  const [companyName, setCompanyName] = useState(initialData.merchant.companyName || "")
  const [rib, setRib] = useState(initialData.merchant.rib || "")
  const [bankName, setBankName] = useState(initialData.merchant.bankName || "")

  const handleUserProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    console.log("[v0] Updating user profile with data:", {
      name: userName,
      phone: userPhone || null,
      profileImage: profileImage || null,
    })

    try {
      const result = await updateUserProfile({
        name: userName,
        phone: userPhone || null,
        profileImage: profileImage || null,
      })

      console.log("[v0] Update result:", result)

      if (result.success) {
        setMessage({ type: "success", text: "تم تحديث البيانات الشخصية بنجاح" })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setMessage({ type: "error", text: result.error || "حدث خطأ أثناء تحديث البيانات" })
      }
    } catch (error) {
      console.error("[v0] Unexpected error in handleUserProfileUpdate:", error)
      setMessage({ type: "error", text: "حدث خطأ غير متوقع" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMerchantProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await updateMerchantProfile({
        companyName: companyName || null,
        rib: rib || null,
        bankName: bankName || null,
      })

      if (result.success) {
        setMessage({ type: "success", text: "تم تحديث معلومات الشركة بنجاح" })
        router.refresh()
      } else {
        setMessage({ type: "error", text: result.error || "حدث خطأ أثناء تحديث البيانات" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "حدث خطأ غير متوقع" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("[v0] File selected:", file.name, "Type:", file.type, "Size:", (file.size / 1024).toFixed(2), "KB")

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "الملف المختار ليس صورة" })
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
      console.log("[v0] Preview set successfully")
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)
    setMessage(null)

    try {
      console.log("[v0] Starting compression...")
      console.log("[v0] Original file size:", (file.size / 1024).toFixed(2), "KB")

      // Compress image
      const compressedFile = await compressImage(file, 200)
      console.log("[v0] Compressed file size:", (compressedFile.size / 1024).toFixed(2), "KB")

      const formData = new FormData()
      formData.set("file", compressedFile)
      
      console.log("[v0] Sending request to /api/files...")

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Upload failed. Response:", errorText)
        throw new Error(`فشل رفع الصورة: ${response.status}`)
      }

      const responseData = await response.json()
      console.log("[v0] Response data:", responseData)
      
      // The API returns the URL directly as a JSON string
      const url = typeof responseData === 'string' ? responseData : responseData.url
      console.log("[v0] Upload successful, URL:", url)
      
      setProfileImage(url)
      
      console.log("[v0] Auto-saving profile image to database...")
      const result = await updateUserProfile({
        name: userName,
        phone: userPhone || null,
        profileImage: url,
      })

      console.log("[v0] Auto-save result:", result)

      if (result.success) {
        setMessage({ type: "success", text: "تم رفع الصورة وحفظها بنجاح" })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setMessage({ type: "error", text: result.error || "تم رفع الصورة لكن فشل الحفظ في قاعدة البيانات" })
      }
    } catch (error) {
      console.error("[v0] Image upload error:", error)
      console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
      setMessage({ type: "error", text: "فشل في رفع الصورة. حاول مرة أخرى." })
      setImagePreview(initialData.user.image)
    } finally {
      setUploadingImage(false)
      // Clear file input
      e.target.value = ""
    }
  }

  const clearImage = async () => {
    setUploadingImage(true)
    setMessage(null)

    try {
      console.log("[v0] Removing profile image from database...")
      
      const result = await updateUserProfile({
        name: userName,
        phone: userPhone || null,
        profileImage: null,
      })

      console.log("[v0] Image removal result:", result)

      if (result.success) {
        setProfileImage(null)
        setImagePreview(null)
        setMessage({ type: "success", text: "تم حذف الصورة بنجاح" })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setMessage({ type: "error", text: result.error || "فشل حذف الصورة" })
      }
    } catch (error) {
      console.error("[v0] Image removal error:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء حذف الصورة" })
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة معلوماتك الشخصية ومعلومات الشركة</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            المعلومات الشخصية
          </h2>

          <form onSubmit={handleUserProfileUpdate} className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={imagePreview || undefined} alt={userName} />
                  <AvatarFallback className="bg-[#048dba] text-white text-2xl">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600"
                    disabled={uploadingImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div>
                <Label htmlFor="profileImage" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-black hover:text-[#048dba]">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري الرفع...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>تغيير الصورة</span>
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploadingImage || isLoading}
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  JPG, PNG أو GIF (الحد الأقصى 5MB)
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="userName">الاسم الكامل</Label>
              <Input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <Label htmlFor="userEmail">البريد الإلكتروني</Label>
              <Input
                id="userEmail"
                type="email"
                value={initialData.user.email}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="userPhone">رقم الهاتف</Label>
              <Input
                id="userPhone"
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="أدخل رقم الهاتف"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || uploadingImage} 
              className="w-full bg-[#048dba] hover:bg-[#048dba]/80"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </Card>

        {/* Merchant Profile Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            معلومات الشركة
          </h2>

          <form onSubmit={handleMerchantProfileUpdate} className="space-y-4">
            {/* Company Name */}
            <div>
              <Label htmlFor="companyName">اسم الشركة</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="أدخل اسم الشركة"
              />
            </div>

            {/* RIB */}
            <div>
              <Label htmlFor="rib">رقم الحساب البنكي (RIB)</Label>
              <Input
                id="rib"
                type="text"
                value={rib}
                onChange={(e) => setRib(e.target.value)}
                placeholder="أدخل رقم الحساب البنكي"
              />
            </div>

            {/* Bank Name */}
            <div>
              <Label htmlFor="bankName">اسم البنك</Label>
              <Input
                id="bankName"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="أدخل اسم البنك"
              />
            </div>

            {/* Read-only Stats */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">الرصيد الحالي</span>
                <span className="font-semibold text-green-600">{initialData.merchant.balance.toFixed(2)} د.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">إجمالي الأرباح</span>
                <span className="font-semibold">{initialData.merchant.totalEarned.toFixed(2)} د.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">الرسوم الأساسية</span>
                <span className="font-semibold">{initialData.merchant.baseFee.toFixed(2)} د.م</span>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-[#048dba] hover:bg-[#048dba]/80">
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </Card>
      </div>

      {/* Security Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          الأمان وكلمة المرور
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            لتغيير كلمة المرور أو إعدادات الأمان الخاصة بك، يرجى الاتصال بالدعم الفني.
          </p>
          <Button variant="outline" className="w-full md:w-auto">
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            الاتصال بالدعم
          </Button>
        </div>
      </Card>
    </div>
  )
}
