import { redirect } from 'next/navigation'

export default function ShippingAndReturns() {
  redirect('/policies?tab=shipping')
}
