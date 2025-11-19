import Link from "next/link"
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="relative">
          <div className="text-[180px] sm:text-[240px] font-bold text-slate-200 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-16 h-16 sm:w-24 sm:h-24 text-[#048dba] animate-pulse" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            الصفحة غير موجودة
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-md mx-auto">
            عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
          <Button
            asChild
            size="lg"
            className="bg-[#048dba] hover:bg-[#037399] text-white w-full sm:w-auto"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white w-full sm:w-auto"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              الرجوع للخلف
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="border-t border-slate-200 pt-8 mt-12">
          <p className="text-sm text-slate-500 mb-4">روابط قد تهمك:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link 
              href="/merchant/inventory" 
              className="text-[#048dba] hover:underline hover:text-[#037399] transition-colors"
            >
              المخزون
            </Link>
            <Link 
              href="/merchant/orders" 
              className="text-[#048dba] hover:underline hover:text-[#037399] transition-colors"
            >
              الطلبات
            </Link>
            <Link 
              href="/merchant/settings" 
              className="text-[#048dba] hover:underline hover:text-[#037399] transition-colors"
            >
              الإعدادات
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
