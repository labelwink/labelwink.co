'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        { 
          redirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/account/reset-password`
            : `${process.env.NEXT_PUBLIC_SITE_URL}/account/reset-password`
        }
      )
      
      if (error) throw error
      setSent(true)
      toast.success('Reset email sent!')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8DFC8] p-8 shadow-sm">
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm mb-6">
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-gray-500 text-xs mb-6">
              The link will expire in 24 hours. If you don't see the email, check your spam folder.
            </p>
            <Link href="/account/login"
              className="text-[#1C3829] text-sm font-medium hover:text-[#C9A84C] transition-colors inline-block">
              ← Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
              <p className="text-gray-500 text-sm">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>
            <div>
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] focus:border-transparent outline-none"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#1C3829] text-white rounded-xl font-medium hover:bg-[#24472F] transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <Link href="/account/login"
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
