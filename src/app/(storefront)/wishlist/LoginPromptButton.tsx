'use client'

import { useAuthModal } from '@/components/auth/OTPLoginModal'

export function LoginPromptButton() {
  const { openModal } = useAuthModal()

  return (
    <button 
      onClick={() => openModal()}
      className="bg-[#c9a84c] text-[#ffffff] px-8 py-3 rounded-md font-medium hover:bg-[#b8973d] transition"
    >
      Sign in with OTP
    </button>
  )
}
