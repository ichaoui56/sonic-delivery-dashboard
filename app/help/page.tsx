// app/help/page.tsx
"use client"

import  DashboardLayoutWrapper  from "@/components/dashboard-layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const faqItems = [
    {
      question: "كيف يمكنني إضافة عامل جديد؟",
      answer: "يمكنك إضافة عامل جديد من خلال الذهاب إلى صفحة 'العمال' ثم النقر على زر 'إضافة عامل'. قم بملء المعلومات الأساسية مثل الاسم، رقم الهاتف، الراتب الأسبوعي، ونوع العمل."
    },
    {
      question: "كيف يعمل نظام الحضور؟",
      answer: "يتيح نظام الحضور تسجيل حضور العمال يومياً مع تحديد نوع الحضور (يوم كامل، نصف يوم، إلخ). يتم حساب الأجور تلقائياً بناءً على نوع الحضور والراتب الأسبوعي."
    },
    {
      question: "كيف أضيف معاملة بيع جديدة؟",
      answer: "من صفحة تفاصيل العميل، انقر على زر 'إضافة معاملة' واملأ بيانات المنتج والسعر والكمية. سيتم تحديث رصيد العميل تلقائياً."
    },
    {
      question: "كيف يمكنني تصدير التقارير؟",
      answer: "يتوفر نظام التصدير في صفحات التقارير المختلفة. يمكنك تصدير البيانات بصيغة Excel أو PDF من خلال الأزرار المتاحة في أعلى كل تقرير."
    },
    {
      question: "ما هو نظام الأجور الأسبوعي؟",
      answer: "يعتمد النظام على أسبوع عمل من السبت إلى الخميس (6 أيام). يتم حساب الأجر اليومي بقسمة الراتب الأسبوعي على 6، ويتم تعديله حسب نوع الحضور المسجل."
    }
  ]

  const contactMethods = [
    {
      title: "البريد الإلكتروني",
      description: "للاستفسارات الفنية والدعم",
      contact: "support@factory-system.com",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )
    },
    {
      title: "الهاتف",
      description: "للاستفسارات العاجلة",
      contact: "+212 600-000000",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      )
    },
    {
      title: "ساعات العمل",
      description: "أوقات الدعم الفني",
      contact: "السبت - الخميس: 8:00 - 18:00",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    }
  ]

  const quickGuides = [
    {
      title: "بدء الاستخدام",
      description: "دليل سريع لبدء استخدام النظام",
      steps: [
        "إضافة العمال الأساسيين",
        "تسجيل العملاء",
        "بدء تسجيل الحضور اليومي",
        "مراقبة التقارير والإحصائيات"
      ]
    },
    {
      title: "إدارة الحضور",
      description: "كيفية استخدام نظام الحضور",
      steps: [
        "الذهاب إلى صفحة تسجيل الحضور",
        "اختيار اليوم والأسبوع المناسب",
        "تسجيل حالة كل عامل",
        "مراجعة السجل الأسبوعي"
      ]
    },
    {
      title: "المعاملات المالية",
      description: "إدارة المبيعات والمدفوعات",
      steps: [
        "إضافة معاملات البيع للعملاء",
        "تسجيل مدفوعات العملاء",
        "مراقبة الأرصدة",
        "مراجعة التقارير المالية"
      ]
    }
  ]

  const filteredFaqItems = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">مركز المساعدة</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              دليل الاستخدام والدعم الفني
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">كيف يمكننا مساعدتك؟</h2>
              <div className="relative max-w-2xl mx-auto">
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
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
                  placeholder="ابحث في الأسئلة الشائعة..."
                  className="pr-10 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="faq" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              الأسئلة الشائعة
            </TabsTrigger>
            <TabsTrigger value="guides" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              أدلة سريعة
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs md:text-sm py-2 md:py-3 h-auto min-h-[44px]">
              اتصل بنا
            </TabsTrigger>
          </TabsList>

          {/* FAQ Section */}
          <TabsContent value="faq" className="mt-4 md:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">الأسئلة الشائعة</CardTitle>
                <CardDescription>إجابات على الأسئلة الأكثر تكراراً</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "لا توجد نتائج تطابق البحث" : "لا توجد أسئلة متاحة"}
                    </div>
                  ) : (
                    filteredFaqItems.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-right text-sm md:text-base hover:no-underline">
                          <span className="flex-1 text-right">{item.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-right text-muted-foreground text-sm md:text-base">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Guides */}
          <TabsContent value="guides" className="mt-4 md:mt-6">
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quickGuides.map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">{guide.title}</CardTitle>
                    <CardDescription className="text-sm">{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside text-right" dir="rtl">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="pr-2">{step}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Video Tutorials */}
            <Card className="mt-4 md:mt-6">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">فيديوهات تعليمية</CardTitle>
                <CardDescription>شروحات مرئية لاستخدام النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { title: "إدارة العمال", duration: "5:30", upcoming: true },
                    { title: "نظام الحضور", duration: "7:15", upcoming: true },
                    { title: "التقارير المالية", duration: "6:45", upcoming: true }
                  ].map((video, index) => (
                    <div key={index} className="border rounded-lg p-4 text-center">
                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="font-medium text-sm mb-1">{video.title}</h3>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>{video.duration}</span>
                        {video.upcoming && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            قريباً
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Section */}
          <TabsContent value="contact" className="mt-4 md:mt-6">
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              {/* Contact Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">طرق الاتصال</CardTitle>
                  <CardDescription>تواصل مع فريق الدعم</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        {method.icon}
                      </div>
                      <div className="flex-1 text-right">
                        <h3 className="font-medium text-sm">{method.title}</h3>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                        <p className="font-medium text-sm mt-1">{method.contact}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Support Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">إرسال استفسار</CardTitle>
                  <CardDescription>سنرد عليك في أقرب وقت</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        الاسم الكامل
                      </label>
                      <Input id="name" placeholder="أدخل اسمك" className="h-10 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        البريد الإلكتروني
                      </label>
                      <Input id="email" type="email" placeholder="example@email.com" className="h-10 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        الموضوع
                      </label>
                      <Input id="subject" placeholder="موضوع الاستفسار" className="h-10 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        الرسالة
                      </label>
                      <textarea
                        id="message"
                        placeholder="صف مشكلتك أو استفسارك بالتفصيل..."
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      إرسال الاستفسار
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card className="mt-4 md:mt-6">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">حالة النظام</CardTitle>
                <CardDescription>الحالة الحالية لخدمات النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">الخدمة الرئيسية</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      تعمل بشكل طبيعي
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">قاعدة البيانات</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      تعمل بشكل طبيعي
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">خدمة النسخ الاحتياطي</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      تعمل بشكل طبيعي
                    </Badge>
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