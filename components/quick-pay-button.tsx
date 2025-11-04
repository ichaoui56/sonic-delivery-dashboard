"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { recordPayment } from "@/lib/actions/worker.actions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface QuickPayButtonProps {
  workerId: string
  workerName: string
  currentBalance: number
  onPaymentRecorded: () => void
}

function toLatinNumbers(str: string | number): string {
  const arabicToLatin: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  }
  return String(str).replace(/[٠-٩]/g, (d) => arabicToLatin[d] || d)
}

export function QuickPayButton({ 
  workerId, 
  workerName, 
  currentBalance, 
  onPaymentRecorded 
}: QuickPayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Only show button if there's a positive balance (worker is owed money)
  if (currentBalance <= 0.01) {
    return null
  }

  const handleQuickPay = async () => {
    setLoading(true)
    try {
      const result = await recordPayment({
        workerId,
        amount: currentBalance,
        paymentType: "WEEKLY",
        note: "دفعة سريعة - تسوية كاملة"
      })

      if (result.success) {
        toast.success(`تم دفع ${toLatinNumbers(currentBalance.toFixed(2))} د.م بنجاح لـ ${workerName}`)
        setOpen(false)
        onPaymentRecorded()
      } else {
        toast.error(result.error || "فشل في تسجيل الدفعة")
      }
    } catch (error) {
      console.error("Error recording quick payment:", error)
      toast.error("حدث خطأ أثناء تسجيل الدفعة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={loading}
        >
          <CheckCircle className="h-4 w-4 ml-2" />
          دفع المستحقات
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">تأكيد الدفع</AlertDialogTitle>
          <AlertDialogDescription className="text-right space-y-3">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-medium text-foreground">
                هل تريد تسجيل دفعة لـ <span className="font-bold">{workerName}</span>؟
              </p>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm">المبلغ المستحق:</span>
                <span className="text-2xl font-bold text-green-600">
                  {toLatinNumbers(currentBalance.toFixed(2))} د.م
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              سيتم تسجيل هذا المبلغ كدفعة أسبوعية وتسوية الرصيد بالكامل.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:space-x-2">
          <AlertDialogAction
            onClick={handleQuickPay}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التسجيل...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 ml-2" />
                تأكيد الدفع
              </>
            )}
          </AlertDialogAction>
          <AlertDialogCancel disabled={loading} className="flex-1 sm:flex-none mt-0">
            إلغاء
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}