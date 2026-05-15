import { Suspense } from 'react'
import OrderConfirmationContent from './OrderConfirmationContent'

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
