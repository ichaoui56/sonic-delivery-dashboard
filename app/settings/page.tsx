// app/settings/page.tsx
"use client"

import DashboardLayoutWrapper from "@/components/dashboard-layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    language: "ar",
    currency: "MAD",
    notifications: true,
    emailReports: false,
    autoBackup: true,
    companyName: "نظام المصنع",
    address: "الدار البيضاء، المغرب",
    phone: "+212 600-000000",
    email: "info@factory-system.com"
  })

  const handleSaveSettings = () => {
    toast.success("تم حفظ الإعدادات بنجاح")
  }

  const handleResetSettings = () => {
    setSettings({
      language: "ar",
      currency: "MAD",
      notifications: true,
      emailReports: false,
      autoBackup: true,
      companyName: "نظام المصنع",
      address: "الدار البيضاء، المغرب",
      phone: "+212 600-000000",
      email: "info@factory-system.com"
    })
    toast.info("تم إعادة تعيين الإعدادات")
  }

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">الإعدادات</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              إدارة إعدادات النظام والتفضيلات الشخصية
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetSettings} className="text-sm">
              إعادة تعيين
            </Button>
            <Button onClick={handleSaveSettings} className="text-sm">
              حفظ التغييرات
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="general" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              عام
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="company" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              معلومات الشركة
            </TabsTrigger>
            <TabsTrigger value="about" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              حول النظام
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">الإعدادات العامة</CardTitle>
                <CardDescription>إعدادات اللغة والعملة والمظهر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium">
                      اللغة
                    </Label>
                    <Select value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
                      <SelectTrigger id="language" className="h-10 text-sm">
                        <SelectValue placeholder="اختر اللغة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium">
                      العملة
                    </Label>
                    <Select value={settings.currency} onValueChange={(value) => setSettings({...settings, currency: value})}>
                      <SelectTrigger id="currency" className="h-10 text-sm">
                        <SelectValue placeholder="اختر العملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAD">درهم مغربي (د.م.)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي ($)</SelectItem>
                        <SelectItem value="EUR">يورو (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-backup" className="text-sm font-medium">
                        النسخ الاحتياطي التلقائي
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        حفظ البيانات تلقائياً كل 24 ساعة
                      </p>
                    </div>
                    <Switch
                      id="auto-backup"
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">إعدادات الأمان</CardTitle>
                <CardDescription>إدارة أمان الحساب والبيانات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">جلسة آمنة</Label>
                    <p className="text-sm text-muted-foreground">جميع الاتصالات مشفرة</p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                    نشط
                  </Badge>
                </div>

                <Button variant="outline" className="w-full justify-center text-sm">
                  تغيير كلمة المرور
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">إعدادات الإشعارات</CardTitle>
                <CardDescription>التحكم في الإشعارات والتنبيهات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications" className="text-sm font-medium">
                      الإشعارات العامة
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      تلقي إشعارات حول الأنشطة المهمة
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-reports" className="text-sm font-medium">
                      التقارير البريدية
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال تقارير أسبوعية بالبريد الإلكتروني
                    </p>
                  </div>
                  <Switch
                    id="email-reports"
                    checked={settings.emailReports}
                    onCheckedChange={(checked) => setSettings({...settings, emailReports: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">تنبيهات المبيعات</CardTitle>
                <CardDescription>إشعارات متعلقة بالمبيعات والعملاء</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch id="new-clients" defaultChecked />
                  <Label htmlFor="new-clients" className="text-sm">
                    إشعارات العملاء الجدد
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch id="payment-reminders" defaultChecked />
                  <Label htmlFor="payment-reminders" className="text-sm">
                    تذكير بالمدفوعات المستحقة
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch id="low-balance" defaultChecked />
                  <Label htmlFor="low-balance" className="text-sm">
                    تنبيهات الرصيد المنخفض
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Information */}
          <TabsContent value="company" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">معلومات الشركة</CardTitle>
                <CardDescription>تفاصيل الشركة الأساسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="text-sm font-medium">
                      اسم الشركة
                    </Label>
                    <Input
                      id="company-name"
                      value={settings.companyName}
                      onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      رقم الهاتف
                    </Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => setSettings({...settings, phone: e.target.value})}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    العنوان
                  </Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="h-10 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About System */}
          <TabsContent value="about" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">حول النظام</CardTitle>
                <CardDescription>معلومات حول نظام إدارة المصنع</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">نظام المصنع</h3>
                    <p className="text-sm text-muted-foreground">الإصدار 2.1.0</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ البناء:</span>
                      <span>ديسمبر 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الترخيص:</span>
                      <span>تجاري</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المطور:</span>
                      <span>فريق التطوير</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الدعم:</span>
                      <span>support@factory-system.com</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">ميزات النظام</h4>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      إدارة العمال والحضور
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      إدارة العملاء والمعاملات
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      تقارير وأحصائيات متقدمة
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      واجهة مستخدم عربية متكاملة
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayoutWrapper>
  )
}