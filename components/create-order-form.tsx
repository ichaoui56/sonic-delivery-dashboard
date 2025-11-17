"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createOrder } from "@/lib/actions/order.actions"
import { toast } from "sonner"
import { OptimizedImage } from "./optimized-image"

type Product = {
  id: number
  name: string
  description: string | null
  image: string | null
  sku: string | null
  price: number
  stockQuantity: number
}

const CITIES = [
  { value: "الداخلة", label: "الداخلة", code: "DA" },
  { value: "بوجدور", label: "بوجدور", code: "BO" },
  { value: "العيون", label: "العيون", code: "LA" },
]

export function CreateOrderForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<
    { productId: number; quantity: number; price: number; name: string; image: string | null }[]
  >([])
  const [searchQuery, setSearchQuery] = useState("")

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    city: "",
    note: "",
    paymentMethod: "COD" as "COD" | "PREPAID",
  })

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.productId === product.id)
    if (existing) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === product.id ? { ...p, quantity: Math.min(p.quantity + 1, product.stockQuantity) } : p,
        ),
      )
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          image: product.image,
        },
      ])
    }
    toast.success(`تمت إضافة ${product.name}`)
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQuantity <= 0) {
      removeProduct(productId)
      return
    }

    if (newQuantity > product.stockQuantity) {
      toast.error(`الكمية المتاحة: ${product.stockQuantity}`)
      return
    }

    setSelectedProducts(selectedProducts.map((p) => (p.productId === productId ? { ...p, quantity: newQuantity } : p)))
  }

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId))
  }

  const totalPrice = selectedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProducts.length === 0) {
      toast.error("يرجى اختيار منتج واحد على الأقل")
      return
    }

    if (!formData.customerName || !formData.customerPhone || !formData.address || !formData.city) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setLoading(true)
    try {
      const result = await createOrder({
        ...formData,
        items: selectedProducts.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          price: p.price,
        })),
      })

      if (result.success) {
        toast.success(result.message)
        router.push("/merchant/orders")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("[v0] Error submitting order:", error)
      toast.error("حدث خطأ أثناء إنشاء الطلب")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">معلومات العميل</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">اسم العميل *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="أدخل اسم العميل"
              required
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">رقم الهاتف *</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="مثال: 0612345678"
              required
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">المدينة *</Label>
            <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان الكامل *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="أدخل العنوان الكامل"
              required
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">ملاحظات (اختياري)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="أضف أي ملاحظات خاصة بالطلب"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">طريقة الدفع</h2>
        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "COD" | "PREPAID" })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Label
            htmlFor="cod"
            className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.paymentMethod === "COD" ? "border-[#048dba] bg-[#048dba]/5" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="COD" id="cod" />
              <div>
                <p className="font-medium">الدفع عند الاستلام</p>
                <p className="text-sm text-gray-500">COD - يدفع العميل عند التسليم</p>
              </div>
            </div>
          </Label>

          <Label
            htmlFor="prepaid"
            className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.paymentMethod === "PREPAID" ? "border-[#048dba] bg-[#048dba]/5" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="PREPAID" id="prepaid" />
              <div>
                <p className="font-medium">مدفوع مسبقاً</p>
                <p className="text-sm text-gray-500">تم الدفع من قبل العميل</p>
              </div>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Product Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">اختيار المنتجات</h2>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 min-h-[44px]"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => addProduct(product)}
            >
              <CardContent className="p-3">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {product.image ? (
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="font-medium text-sm mb-1 line-clamp-2">{product.name}</p>
                <p className="text-[#048dba] font-bold text-sm">{product.price} د.م</p>
                <p className="text-xs text-gray-500">متوفر: {product.stockQuantity}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد منتجات متاحة</p>
          </div>
        )}
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">المنتجات المختارة ({selectedProducts.length})</h2>

          <div className="space-y-2">
            {selectedProducts.map((item) => (
              <Card key={item.productId}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col xs:flex-row gap-3">
                    {/* Product Image and Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.price} د.م × {item.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls and Actions - Stack on mobile */}
                    <div className="flex items-center justify-between xs:justify-end gap-3 xs:gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-9 w-9 sm:h-8 sm:w-8"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-9 w-9 sm:h-8 sm:w-8"
                        >
                          +
                        </Button>
                      </div>

                      {/* Delete Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct(item.productId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>

                      {/* Total Price */}
                      <div className="text-right font-bold text-[#048dba] min-w-[80px]">
                        {(item.price * item.quantity).toFixed(2)} د.م
                      </div>
                    </div>
                  </div>
                  {/* </CHANGE> */}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-[#048dba]/5 to-[#037ba0]/5 border-[#048dba]">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">الإجمالي</span>
                <span className="text-2xl font-bold text-[#048dba]">{totalPrice.toFixed(2)} د.م</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1 min-h-[44px]"
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-[#048dba] hover:bg-[#037ba0] min-h-[44px]">
          {loading ? "جاري الإنشاء..." : "إنشاء الطلب"}
        </Button>
      </div>
    </form>
  )
}
