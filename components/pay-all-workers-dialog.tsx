"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { payAllWorkers } from "@/lib/actions/worker.actions"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, Users, DollarSign } from "lucide-react"

interface PayAllWorkersDialogProps {
  onPaymentCompleted: () => void
}

export function PayAllWorkersDialog({ onPaymentCompleted }: PayAllWorkersDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  const handlePayAll = async () => {
    setLoading(true)
    try {
      const result = await payAllWorkers("WEEKLY", "دفعة جماعية لجميع العمال")
      
      if (result.success && result.data) {
        setPaymentDetails(result.data)
        toast.success(`تم دفع رواتب ${result.data.successfulPayments} عامل بنجاح`)
        
        // Refresh the parent component
        onPaymentCompleted()
        
        // Close dialog after 3 seconds to show results
        setTimeout(() => {
          setOpen(false)
          setPaymentDetails(null)
        }, 3000)
      } else {
        toast.error(result.error || "فشل في عملية الدفع الجماعي")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء عملية الدفع")
      console.error("Error paying all workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const toLatinNumbers = (str: string | number): string => {
    const arabicToLatin: Record<string, string> = {
      "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
      "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    }
    return String(str).replace(/[٠-٩]/g, (d) => arabicToLatin[d] || d)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-[44px] bg-green-600 hover:bg-green-700 text-white">
          <Users className="w-5 h-5 ml-2" />
          دفع جميع العمال
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            دفع رواتب جميع العمال
          </DialogTitle>
          <DialogDescription>
            {!paymentDetails 
              ? "سيتم دفع المستحقات لجميع العمال النشطين الذين لديهم رصيد مستحق. هل تريد المتابعة؟"
              : "تمت عملية الدفع بنجاح"
            }
          </DialogDescription>
        </DialogHeader>

        {!paymentDetails ? (
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Users className="h-5 w-5 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">تنبيه</p>
                <p>هذه العملية لا يمكن التراجع عنها</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>المدفوعات الناجحة:</span>
                <span className="font-bold">{toLatinNumbers(paymentDetails.successfulPayments)}</span>
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>المدفوعات الفاشلة:</span>
                <span className="font-bold">{toLatinNumbers(paymentDetails.failedPayments)}</span>
              </div>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-green-800">المبلغ الإجمالي المدفوع</p>
                <p className="text-xl font-bold text-green-900">
                  {toLatinNumbers(paymentDetails.totalAmount.toFixed(2))} د.م.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          {!paymentDetails && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button
                onClick={handlePayAll}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                تأكيد الدفع للجميع
              </Button>
            </>
          )}
          {paymentDetails && (
            <Button onClick={() => setOpen(false)} className="w-full">
              تم بنجاح
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}