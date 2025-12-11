"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createOrder } from "@/lib/actions/order.actions"
import { toast } from "sonner"
import { OptimizedImage } from "./optimized-image"
import {
  ShoppingCart,
  User,
  CreditCard,
  Tag,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Percent,
  DollarSign,
  Gift,
} from "lucide-react"

type Product = {
  id: number
  name: string
  description: string | null
  image: string | null
  sku: string | null
  price: number
  stockQuantity: number
}

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y" | "CUSTOM_PRICE" | null

type SelectedProduct = {
  productId: number
  quantity: number
  price: number
  originalPrice: number
  name: string
  image: string | null
  isFree?: boolean
}

const CITIES = [
  { value: "الداخلة", label: "الداخلة", code: "DA" },
  { value: "بوجدور", label: "بوجدور", code: "BO" },
  { value: "العيون", label: "العيون", code: "LA" },
]

export function CreateOrderForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Product selection state
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Customer info state
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    city: "",
    note: "",
    paymentMethod: "COD" as "COD" | "PREPAID",
  })

  const [discountType, setDiscountType] = useState<DiscountType>(null)
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [discountDescription, setDiscountDescription] = useState("")
  const [buyXGetYConfig, setBuyXGetYConfig] = useState({
    buyQuantity: 2,
    getQuantity: 1,
    applicableProductId: null as number | null,
  })
  // </CHANGE>

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const pricingCalculations = useMemo(() => {
    const originalTotal = selectedProducts.reduce((sum, item) => {
      if (item.isFree) return sum
      return sum + item.originalPrice * item.quantity
    }, 0)

    let discountAmount = 0
    const finalItems = [...selectedProducts]

    if (discountType === "PERCENTAGE" && discountValue > 0) {
      discountAmount = (originalTotal * discountValue) / 100
    } else if (discountType === "FIXED_AMOUNT" && discountValue > 0) {
      discountAmount = Math.min(discountValue, originalTotal)
    } else if (discountType === "BUY_X_GET_Y" && buyXGetYConfig.applicableProductId) {
      // Apply buy X get Y logic
      const targetProduct = selectedProducts.find((p) => p.productId === buyXGetYConfig.applicableProductId)

      if (targetProduct && targetProduct.quantity >= buyXGetYConfig.buyQuantity) {
        const freeItemsCount =
          Math.floor(targetProduct.quantity / (buyXGetYConfig.buyQuantity + buyXGetYConfig.getQuantity)) *
          buyXGetYConfig.getQuantity

        discountAmount = targetProduct.originalPrice * freeItemsCount
      }
    } else if (discountType === "CUSTOM_PRICE" && discountValue >= 0) {
      const customTotal = discountValue
      discountAmount = originalTotal - customTotal
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount)

    return {
      originalTotal,
      discountAmount,
      finalTotal,
      finalItems,
    }
  }, [selectedProducts, discountType, discountValue, buyXGetYConfig])
  // </CHANGE>

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
          originalPrice: product.price,
          name: product.name,
          image: product.image,
          isFree: false,
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
          originalPrice: p.originalPrice,
          isFree: p.isFree || false,
        })),
        discountType: discountType || undefined,
        discountValue: discountValue || undefined,
        discountDescription: discountDescription || undefined,
        originalTotalPrice: pricingCalculations.originalTotal,
        totalDiscount: pricingCalculations.discountAmount,
        buyXGetYConfig: discountType === "BUY_X_GET_Y" ? JSON.stringify(buyXGetYConfig) : undefined,
        finalTotal: pricingCalculations.finalTotal,
        // </CHANGE>
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

  const canProceedToStep2 = selectedProducts.length > 0
  const canProceedToStep3 = formData.customerName && formData.customerPhone && formData.address && formData.city

  const steps = [
    { number: 1, title: "اختيار المنتجات", icon: ShoppingCart },
    { number: 2, title: "معلومات العميل", icon: User },
    { number: 3, title: "تعديل الأسعار", icon: Tag },
    { number: 4, title: "المراجعة والتأكيد", icon: CheckCircle2 },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === step.number
                    ? "bg-[#048dba] text-white scale-110"
                    : currentStep > step.number
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p
                className={`text-xs sm:text-sm mt-2 font-medium ${
                  currentStep === step.number ? "text-[#048dba]" : "text-gray-500"
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Product Selection */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                اختيار المنتجات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
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
                            <ShoppingCart className="w-12 h-12" />
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
            </CardContent>
          </Card>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>المنتجات المختارة ({selectedProducts.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedProducts.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 border rounded-lg">
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
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.price} د.م × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-8 w-8"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-8 w-8"
                      >
                        +
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct(item.productId)}
                        className="text-red-500 hover:text-red-700 h-8 w-8"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="text-right font-bold text-[#048dba] min-w-[80px]">
                      {(item.price * item.quantity).toFixed(2)} د.م
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="bg-[#048dba] hover:bg-[#037ba0]"
            >
              التالي
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Customer Information */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                طريقة الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              السابق
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3}
              className="bg-[#048dba] hover:bg-[#037ba0]"
            >
              التالي
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Pricing Adjustment */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                تعديل الأسعار والعروض الترويجية
              </CardTitle>
              <p className="text-sm text-gray-500">اختياري - يمكنك تطبيق خصم أو عرض ترويجي على هذا الطلب</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Type Selection */}
              <div className="space-y-2">
                <Label>نوع الخصم</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={discountType === null ? "default" : "outline"}
                    onClick={() => {
                      setDiscountType(null)
                      setDiscountValue(0)
                    }}
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>بدون خصم</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={discountType === "PERCENTAGE" ? "default" : "outline"}
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Percent className="w-5 h-5" />
                      <span>خصم بالنسبة المئوية</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={discountType === "FIXED_AMOUNT" ? "default" : "outline"}
                    onClick={() => setDiscountType("FIXED_AMOUNT")}
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <DollarSign className="w-5 h-5" />
                      <span>خصم مبلغ ثابت</span>
                    </div>
                  </Button>
                 
                </div>
              </div>

              {/* Percentage Discount */}
              {discountType === "PERCENTAGE" && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Percent className="w-5 h-5" />
                    <span className="font-medium">خصم بالنسبة المئوية</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentageDiscount">نسبة الخصم (%)</Label>
                    <Input
                      id="percentageDiscount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Number.parseFloat(e.target.value) || 0)}
                      placeholder="مثال: 10"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountDesc">وصف العرض (اختياري)</Label>
                    <Input
                      id="discountDesc"
                      value={discountDescription}
                      onChange={(e) => setDiscountDescription(e.target.value)}
                      placeholder="مثال: خصم خاص للعملاء المميزين"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {/* Fixed Amount Discount */}
              {discountType === "FIXED_AMOUNT" && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">خصم مبلغ ثابت</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fixedDiscount">مبلغ الخصم (د.م)</Label>
                    <Input
                      id="fixedDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Number.parseFloat(e.target.value) || 0)}
                      placeholder="مثال: 50"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountDesc">وصف العرض (اختياري)</Label>
                    <Input
                      id="discountDesc"
                      value={discountDescription}
                      onChange={(e) => setDiscountDescription(e.target.value)}
                      placeholder="مثال: كوبون خصم 50 درهم"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {/* Buy X Get Y */}
              {discountType === "BUY_X_GET_Y" && (
                <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Gift className="w-5 h-5" />
                    <span className="font-medium">اشتر X واحصل على Y مجاناً</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="buyQuantity">اشتر (عدد)</Label>
                      <Input
                        id="buyQuantity"
                        type="number"
                        min="1"
                        value={buyXGetYConfig.buyQuantity}
                        onChange={(e) =>
                          setBuyXGetYConfig({
                            ...buyXGetYConfig,
                            buyQuantity: Number.parseInt(e.target.value) || 1,
                          })
                        }
                        className="min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="getQuantity">احصل على (عدد)</Label>
                      <Input
                        id="getQuantity"
                        type="number"
                        min="1"
                        value={buyXGetYConfig.getQuantity}
                        onChange={(e) =>
                          setBuyXGetYConfig({
                            ...buyXGetYConfig,
                            getQuantity: Number.parseInt(e.target.value) || 1,
                          })
                        }
                        className="min-h-[44px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicableProduct">المنتج المطبق عليه العرض</Label>
                    <Select
                      value={buyXGetYConfig.applicableProductId?.toString() || ""}
                      onValueChange={(value) =>
                        setBuyXGetYConfig({
                          ...buyXGetYConfig,
                          applicableProductId: Number.parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="اختر المنتج" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProducts.map((product) => (
                          <SelectItem key={product.productId} value={product.productId.toString()}>
                            {product.name} (الكمية: {product.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountDesc">وصف العرض (اختياري)</Label>
                    <Input
                      id="discountDesc"
                      value={discountDescription}
                      onChange={(e) => setDiscountDescription(e.target.value)}
                      placeholder="مثال: اشتر 2 واحصل على 1 مجاناً"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {/* Custom Price Override */}
              <Button
                type="button"
                variant={discountType === "CUSTOM_PRICE" ? "default" : "outline"}
                onClick={() => setDiscountType("CUSTOM_PRICE")}
                className="w-full"
              >
                تعديل السعر الإجمالي يدوياً
              </Button>

              {discountType === "CUSTOM_PRICE" && (
                <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-700">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">تعديل السعر الإجمالي</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customPrice">السعر النهائي (د.م)</Label>
                    <Input
                      id="customPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Number.parseFloat(e.target.value) || 0)}
                      placeholder={`السعر الأصلي: ${pricingCalculations.originalTotal.toFixed(2)} د.م`}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountDesc">سبب التعديل (اختياري)</Label>
                    <Input
                      id="discountDesc"
                      value={discountDescription}
                      onChange={(e) => setDiscountDescription(e.target.value)}
                      placeholder="مثال: عميل مميز - سعر خاص"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {/* Price Preview */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-[#048dba]">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">السعر الأصلي:</span>
                    <span className="font-bold text-gray-900">{pricingCalculations.originalTotal.toFixed(2)} د.م</span>
                  </div>
                  {pricingCalculations.discountAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-green-600">
                        <span>الخصم:</span>
                        <span className="font-bold">- {pricingCalculations.discountAmount.toFixed(2)} د.م</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2"></div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">السعر النهائي:</span>
                    <span className="text-2xl font-bold text-[#048dba]">
                      {pricingCalculations.finalTotal.toFixed(2)} د.م
                    </span>
                  </div>
                  {discountDescription && (
                    <div className="pt-2 border-t border-gray-300">
                      <Badge variant="secondary" className="text-xs">
                        {discountDescription}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              السابق
            </Button>
            <Button type="button" onClick={() => setCurrentStep(4)} className="bg-[#048dba] hover:bg-[#037ba0]">
              التالي
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      )}
      {/* </CHANGE> */}

      {/* Step 4: Review and Confirm */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                مراجعة الطلب والتأكيد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  معلومات العميل
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">الاسم:</span>
                    <span className="font-medium mr-2">{formData.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">الهاتف:</span>
                    <span className="font-medium mr-2">{formData.customerPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">العنوان:</span>
                    <span className="font-medium mr-2">
                      {formData.address}, {formData.city}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">طريقة الدفع:</span>
                    <Badge variant="outline" className="mr-2">
                      {formData.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  المنتجات ({selectedProducts.length})
                </h3>
                <div className="space-y-2">
                  {selectedProducts.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                        {item.image ? (
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.price} د.م × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#048dba]">{(item.price * item.quantity).toFixed(2)} د.م</p>
                        {item.isFree && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            مجاني
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  ملخص الأسعار
                </h3>
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">المجموع الأصلي:</span>
                      <span className="font-semibold">{pricingCalculations.originalTotal.toFixed(2)} د.م</span>
                    </div>

                    {pricingCalculations.discountAmount > 0 && (
                      <>
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span>الخصم المطبق:</span>
                          <span className="font-semibold">- {pricingCalculations.discountAmount.toFixed(2)} د.م</span>
                        </div>
                        {discountDescription && (
                          <div className="text-xs text-gray-500 italic">{discountDescription}</div>
                        )}
                        <div className="border-t border-gray-300"></div>
                      </>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold">المجموع النهائي:</span>
                      <span className="text-2xl font-bold text-[#048dba]">
                        {pricingCalculations.finalTotal.toFixed(2)} د.م
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              السابق
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "جاري الإنشاء..." : "تأكيد الطلب"}
              <CheckCircle2 className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
// </CHANGE>
