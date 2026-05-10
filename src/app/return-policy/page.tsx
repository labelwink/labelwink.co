import { redirect } from 'next/navigation'

export default function ReturnPolicy() {
  redirect('/policies?tab=returns')
}
