"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { OrdersTable } from "@/components/orders-table"

type Order = any // Use the proper type from your codebase

export function OrdersClient({ initialOrders, hasProducts }: { initialOrders: Order[]; hasProducts: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">إنشاء وتتبع طلبات العملاء</p>
        </div>
        <Link href="/merchant/orders/add">
          <Button className="bg-[#048dba] hover:bg-[#037ba0] text-white min-h-[44px] w-full sm:w-auto">
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إنشاء طلب جديد
          </Button>
        </Link>
      </div>

      {!hasProducts && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">لا توجد منتجات في المخزون</p>
              <p className="text-sm text-yellow-700 mt-1">
                يجب إضافة منتجات إلى المخزون قبل إنشاء طلبات جديدة.{" "}
                <Link href="/merchant/transfer-products" className="underline font-medium">
                  إضافة منتجات الآن
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <OrdersTable orders={initialOrders} />
    </div>
  )
}
