import { Suspense } from 'react'
import OrdersContent from './OrdersContent'

export const metadata = {
  title: 'Orders | Admin Dashboard',
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b3a34]"></div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
