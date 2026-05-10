import { redirect } from 'next/navigation'

export default function TermsOfService() {
  redirect('/policies?tab=terms')
}
