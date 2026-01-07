"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateAdminSettings } from "@/lib/actions/admin/settings"
import { useRouter } from 'next/navigation'
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X, AlertCircle, Mail } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    address: string | null
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
  const [showPasswordField, setShowPasswordField] = useState(false)

  // User profile state
  const [userName, setUserName] = useState(initialData.user.name)
  const [userEmail, setUserEmail] = useState(initialData.user.email) // Added email state
  const [userPhone, setUserPhone] = useState(initialData.user.phone || "")
  const [address, setAddress] = useState(initialData.admin.address || "")
  const [profileImage, setProfileImage] = useState<string | null>(initialData.user.image)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.user.image)
  const [currentPassword, setCurrentPassword] = useState("") // For email verification

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

  const handleEmailChange = (value: string) => {
    setUserEmail(value)
    // Show password field when email is being changed
    if (value !== initialData.user.email) {
      setShowPasswordField(true)
    } else {
      setShowPasswordField(false)
      setCurrentPassword("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await updateAdminSettings({
        name: userName,
        email: userEmail, // Include email
        phone: userPhone || null,
        profileImage: profileImage,
        address: address || null,
        currentPassword: showPasswordField ? currentPassword : undefined,
      })

      setMessage({ 
        type: 'success', 
        text: result.message || 'تم تحديث الملف الشخصي بنجاح' 
      })
      
      // If email was changed, suggest re-login
      if (userEmail !== initialData.user.email) {
        setTimeout(() => {
          router.push('/admin/settings')
        }, 3000)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'حدث خطأ أثناء تحديث الملف الشخصي' 
      })
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
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="أدخل بريدك الإلكتروني"
              required
            />
            {showPasswordField && (
              <Alert className="mt-2 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  لتغيير البريد الإلكتروني، الرجاء إدخال كلمة المرور الحالية للتأكيد.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Current Password (only shown when email is being changed) */}
          {showPasswordField && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">كلمة المرور الحالية *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                required={showPasswordField}
              />
              <p className="text-sm text-muted-foreground">
                مطلوب لتغيير البريد الإلكتروني
              </p>
            </div>
          )}

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

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="أدخل العنوان الكامل"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">عنوان مكتب المشرف الرئيسي</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || (showPasswordField && !currentPassword)}>
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
            <Alert className={
              message.type === 'success' 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }>
              <AlertCircle className={
                message.type === 'success' 
                  ? "h-4 w-4 text-green-600" 
                  : "h-4 w-4 text-red-600"
              } />
              <AlertDescription className={
                message.type === 'success' 
                  ? "text-green-700" 
                  : "text-red-700"
              }>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Change Warning */}
          {showPasswordField && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-sm">
                عند تغيير البريد الإلكتروني، سيتم تسجيل خروجك من النظام ويجب عليك تسجيل الدخول مرة أخرى باستخدام البريد الإلكتروني الجديد.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Card>
    </div>
  )
}