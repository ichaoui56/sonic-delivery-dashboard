"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NewClientForm() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("New client:", formData)
    // Here you would typically send the data to your backend
    setFormData({ name: "", location: "", phone: "" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إضافة عميل جديد</CardTitle>
        <CardDescription>أدخل معلومات العميل الجديد</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم العميل</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم العميل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">الموقع / المكان</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="أدخل موقع العميل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01012345678"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            إضافة العميل
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
