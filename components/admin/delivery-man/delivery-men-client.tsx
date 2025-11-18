"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye, X, MapPin } from 'lucide-react'
import { CreateDeliveryManDialog } from "./create-deliveryman-dialog"

type DeliveryMan = {
  id: number
  vehicleType: string | null
  active: boolean
  city: string
  totalDeliveries: number
  successfulDeliveries: number
  totalEarned: number
  baseFee: number
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  _count: {
    assignedOrders: number
  }
}

export function DeliveryMenClient({ initialDeliveryMen }: { initialDeliveryMen: DeliveryMan[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deliveryMen, setDeliveryMen] = useState(initialDeliveryMen)
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [filterCity, setFilterCity] = useState<"all" | "الداخلة" | "العيون" | "بوجدور">("all")
  const router = useRouter()

  const filteredDeliveryMen = deliveryMen.filter((dm) => {
    const matchesSearch = 
      dm.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dm.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dm.vehicleType && dm.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && dm.active) ||
      (filterStatus === "inactive" && !dm.active)
    
    const matchesCity = 
      filterCity === "all" ||
      dm.city === filterCity
    
    return matchesSearch && matchesStatus && matchesCity
  })

  const stats = {
    total: deliveryMen.length,
    active: deliveryMen.filter(dm => dm.active).length,
    inactive: deliveryMen.filter(dm => !dm.active).length,
    dakhla: deliveryMen.filter(dm => dm.city === "الداخلة").length,
    laayoune: deliveryMen.filter(dm => dm.city === "العيون").length,
    boujdour: deliveryMen.filter(dm => dm.city === "بوجدور").length,
  }

  const activeFilters = []
  if (filterStatus !== "all") activeFilters.push(filterStatus === "active" ? "نشط" : "غير نشط")
  if (filterCity !== "all") activeFilters.push(filterCity)

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">إدارة موظفي التوصيل</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">عرض وإدارة جميع موظفي التوصيل</p>
        </div>
        <CreateDeliveryManDialog onSuccess={(newDM) => setDeliveryMen([newDM, ...deliveryMen])}>
          <Button className="bg-[#048dba] hover:bg-[#037a9e] text-xs sm:text-sm w-full sm:w-auto">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            إضافة موظف توصيل
          </Button>
        </CreateDeliveryManDialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        <Card className="border-t-4 border-t-[#048dba] hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">إجمالي الموظفين</p>
              <div className="w-8 h-8 rounded-full bg-[#048dba]/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#048dba]" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#048dba]">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">النشطون</p>
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-red-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">غير النشطين</p>
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.inactive}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">الداخلة</p>
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.dakhla}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">العيون</p>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.laayoune}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">بوجدور</p>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.boujdour}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#048dba]/20">
        <CardContent className="pt-4 sm:pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="ابحث بالاسم، البريد الإلكتروني، أو نوع المركبة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-sm border-gray-300 focus:border-[#048dba] focus:ring-[#048dba]"
            />
          </div>

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">الفلاتر النشطة:</span>
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="bg-[#048dba]/10 text-[#048dba] border-[#048dba]/20">
                  {filter}
                </Badge>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterStatus("all")
                  setFilterCity("all")
                }}
                className="h-6 text-xs text-gray-500 hover:text-[#048dba]"
              >
                <X className="w-3 h-3 ml-1" />
                مسح الكل
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">الحالة</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className={`flex-1 text-xs sm:text-sm transition-all ${
                    filterStatus === "all" 
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm' 
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                  }`}
                >
                  الكل ({stats.total})
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "active" ? "default" : "outline"}
                  onClick={() => setFilterStatus("active")}
                  className={`flex-1 text-xs sm:text-sm transition-all ${
                    filterStatus === "active" 
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm' 
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                  }`}
                >
                  نشط ({stats.active})
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "inactive" ? "default" : "outline"}
                  onClick={() => setFilterStatus("inactive")}
                  className={`flex-1 text-xs sm:text-sm transition-all ${
                    filterStatus === "inactive" 
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm' 
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                  }`}
                >
                  غير نشط ({stats.inactive})
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">المدينة</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant={filterCity === "all" ? "default" : "outline"}
                  onClick={() => setFilterCity("all")}
                  className={`text-xs sm:text-sm transition-all ${
                    filterCity === "all" 
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm' 
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                  }`}
                >
                  <MapPin className="w-3 h-3 ml-1" />
                  كل المدن
                </Button>
                <Button
                  size="sm"
                  variant={filterCity === "الداخلة" ? "default" : "outline"}
                  onClick={() => setFilterCity("الداخلة")}
                  className={`text-xs sm:text-sm transition-all ${
                    filterCity === "الداخلة" 
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm' 
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                  }`}
                >
                  الداخلة ({stats.dakhla})
                </Button>
                <Button
                  size="sm"
                  variant={filterCity === "العيون" ? "default" : "outline"}
                  onClick={() => setFilterCity("العيون")}
                  className={`text-xs sm:text-sm transition-all ${
                    filterCity === "العيون" 
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm' 
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                  }`}
                >
                  العيون ({stats.laayoune})
                </Button>
                <Button
                  size="sm"
                  variant={filterCity === "بوجدور" ? "default" : "outline"}
                  onClick={() => setFilterCity("بوجدور")}
                  className={`text-xs sm:text-sm transition-all ${
                    filterCity === "بوجدور" 
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm' 
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                  }`}
                >
                  بوجدور ({stats.boujdour})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-base sm:text-lg">قائمة موظفي التوصيل ({filteredDeliveryMen.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredDeliveryMen.map((deliveryMan) => {
              const successRate = deliveryMan.totalDeliveries > 0 
                ? ((deliveryMan.successfulDeliveries / deliveryMan.totalDeliveries) * 100).toFixed(1)
                : "0"

              return (
                <div
                  key={deliveryMan.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 hover:border-[#048dba]/50 cursor-pointer transition-all"
                  onClick={() => router.push(`/admin/delivery-men/${deliveryMan.id}`)}
                >
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-[#048dba]/20">
                    <AvatarImage src={deliveryMan.user.image || undefined} />
                    <AvatarFallback className="bg-[#048dba] text-white text-base sm:text-lg">
                      {deliveryMan.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm sm:text-base">{deliveryMan.user.name}</p>
                        <Badge 
                          variant={deliveryMan.active ? "default" : "secondary"}
                          className={`text-xs ${deliveryMan.active ? 'bg-[#048dba]' : ''}`}
                        >
                          {deliveryMan.active ? "نشط" : "غير نشط"}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-[#048dba] text-[#048dba]">
                          {deliveryMan.city}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">{deliveryMan.vehicleType || "لا توجد مركبة"}</p>
                    <p className="text-xs text-gray-400 truncate">{deliveryMan.user.email}</p>
                    
                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-4 mt-3">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">الطلبات المسندة</p>
                        <p className="font-semibold text-sm">{deliveryMan._count.assignedOrders}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">معدل النجاح</p>
                        <p className="font-semibold text-sm text-green-600">{successRate}%</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">الأرباح</p>
                        <p className="font-semibold text-sm text-[#048dba]">{deliveryMan.totalEarned.toFixed(2)} د.م</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">الأجرة الأساسية</p>
                        <p className="font-semibold text-sm">{deliveryMan.baseFee.toFixed(2)} د.م</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 sm:flex-none border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/delivery-men/${deliveryMan.id}`)
                      }}
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      <span className="hidden xs:inline">عرض التفاصيل</span>
                      <span className="xs:hidden">تفاصيل</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
