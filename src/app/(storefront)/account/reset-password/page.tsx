'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('No valid reset session found. Please request a new password reset link.')
        return
      }
      setReady(true)
    }
    
    checkAuthState()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateError) throw updateError
      
      toast.success('Password reset successfully!')
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/account/login')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8DFC8] p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <a href="/account/forgot-password"
            className="inline-block text-[#1C3829] text-sm font-medium hover:text-[#C9A84C] transition-colors">
            Request New Reset Link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8DFC8] p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create New Password</h2>
            <p className="text-gray-500 text-sm">
              Enter a strong password to secure your account.
            </p>
          </div>

          <div>
            <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                required
                disabled={!ready || loading}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] focus:border-transparent outline-none disabled:opacity-50"
              />
              <button type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm" className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={!ready || loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] focus:border-transparent outline-none disabled:opacity-50"
            />
          </div>

          <Button 
            type="submit" 
            disabled={!ready || loading || !newPassword || !confirmPassword}
            className="w-full py-3 bg-[#1C3829] text-white rounded-xl font-medium hover:bg-[#24472F] transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
