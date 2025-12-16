"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { OptimizedImage } from "./optimized-image"
import { useToast } from "@/hooks/use-toast"
import { updateProductInfo } from "@/lib/actions/product-transfer-actions"
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X } from 'lucide-react'

type Product = {
  id: number
  name: string
  description: string | null
  image: string | null
  sku: string | null
  stockQuantity: number
  lowStockAlert: number
}

type EditProductModalProps = {
  product: Product | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditProductModal({ product, open, onClose, onSuccess }: EditProductModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    lowStockAlert: 3,
  })

  useEffect(() => {
    if (product && open) {
      console.log("[v0] Product data received:", product)
      console.log("[v0] lowStockAlert from product:", product.lowStockAlert)
      const lowStockValue = product.lowStockAlert ?? 3
      console.log("[v0] Setting lowStockAlert to:", lowStockValue)
      setFormData({
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        lowStockAlert: lowStockValue,
      })
      setImagePreview(product.image)
      setImageFile(null)
    }
  }, [product, open])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const compressed = await compressImage(file)
      setImageFile(compressed)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في معالجة الصورة",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    try {
      setLoading(true)

      let imageUrl = product.image

      if (imageFile) {
        const formDataUpload = new FormData()
        formDataUpload.append("file", imageFile)

        const response = await fetch("/api/files", {
          method: "POST",
          body: formDataUpload,
        })

        if (response.ok) {
          imageUrl = await response.json()
        }
      }

      console.log("[v0] Submitting lowStockAlert:", formData.lowStockAlert)

      const result = await updateProductInfo(product.id, {
        name: formData.name,
        description: formData.description || undefined,
        sku: formData.sku || undefined,
        lowStockAlert: Number(formData.lowStockAlert),
        image: imageUrl || undefined,
      })

      if (result.success) {
        toast({
          title: "نجح",
          description: result.message || "تم تحديث المنتج بنجاح",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "خطأ",
          description: result.error || "فشل في تحديث المنتج",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">تحديث معلومات المنتج</DialogTitle>
          <p className="text-sm text-gray-500">تعديل البيانات الأساسية للمنتج (لا يمكن تعديل الكمية)</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>صورة المنتج</Label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {imagePreview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  <OptimizedImage
                    src={imagePreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#048dba] transition-colors">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">انقر لتحميل صورة جديدة</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG أو WEBP</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">اسم المنتج *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: قميص رياضي"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف المنتج..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">رمز المنتج (SKU)</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="ABC123"
            />
          </div>


          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">معلومات المخزون (للقراءة فقط)</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">الكمية الحالية:</span>
                <span className="font-bold text-blue-600 mr-2">{product.stockQuantity}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#048dba] hover:bg-[#037099]">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
