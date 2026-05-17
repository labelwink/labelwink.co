'use client'

import { useAuthModal } from '@/components/auth/OTPLoginModal'

export function LoginPromptButton() {
  const { openModal } = useAuthModal()

  return (
    <button 
      onClick={() => openModal()}
      className="min-h-11 h-11 px-8 bg-labelwink-gold text-white rounded-md text-base font-medium hover:bg-labelwink-gold-hover transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-labelwink-green focus-visible:ring-offset-2"
    >
      Sign in with OTP
    </button>
  )
}
