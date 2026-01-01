"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateAdminProfile, updateUserProfile } from "@/lib/actions/admin/settings"
import { useRouter } from 'next/navigation'
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X } from 'lucide-react'

interface AdminSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  admin: {
    id: number
  }
}

interface AdminSettingsClientProps {
  initialData: AdminSettingsData
}

export function SettingsClient({ initialData }: AdminSettingsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // User profile state
  const [userName, setUserName] = useState(initialData.user.name)
  const [userPhone, setUserPhone] = useState(initialData.user.phone || "")
  const [profileImage, setProfileImage] = useState<string | null>(initialData.user.image)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.user.image)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      // Compress the image to 200KB
      const compressedFile = await compressImage(file, 200)

      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('upload_preset', 'sonic_delivery_profile')

      const response = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setProfileImage(data.secure_url)
      setImagePreview(data.secure_url)
    } catch (error) {
      console.error('Error uploading image:', error)
      setMessage({ type: 'error', text: 'فشل رفع الصورة' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Update user profile
      await updateUserProfile({
        name: userName,
        phone: userPhone || null,
        profileImage: profileImage,
      })

      // Update admin profile (no specific fields to update yet)
      await updateAdminProfile()

      setMessage({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' })
      router.refresh()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء تحديث الملف الشخصي' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">الملف الشخصي</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="space-y-2">
            <Label htmlFor="profileImage">الصورة الشخصية</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt={userName} />
                  ) : (
                    <AvatarFallback className="text-xl">
                      {userName ? userName.charAt(0).toUpperCase() : 'A'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={initialData.user.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-sm text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="أدخل رقم هاتفك"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}
