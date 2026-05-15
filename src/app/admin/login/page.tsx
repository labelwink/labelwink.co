'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { LeafPattern } from '@/components/ui/LeafPattern'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const profileRes = await fetch('/api/admin/profile')
        const profileData = await profileRes.json()
        
        const redirectMap: Record<string, string> = {
          super_admin: '/superadmin',
          admin: '/admin',
          employee: '/admin/orders',
          customer: '/',
        }
        
        const redirectTo = redirectMap[profileData.role || 'customer'] || '/admin'
        router.push(redirectTo)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Incorrect password. Try again.')
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#1C3829] flex items-center justify-center p-4">
      <LeafPattern opacity={0.08} id="login" />
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .card-shake { animation: shake 0.6s ease-in-out; }
      `}</style>

      <div className={`relative z-10 bg-[#FAF9F6] rounded-2xl shadow-2xl max-w-[400px] w-full p-10 border border-white/10 ${shake ? 'card-shake' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-10">
          <p
            className="font-bold text-3xl bg-gradient-to-r from-[#e8c97a] to-[#b8862a] bg-clip-text text-transparent tracking-[0.2em]"
            style={{ fontFamily: 'var(--font-cinzel, Georgia, serif)' }}
          >
            LABEL WINK
          </p>
          <p className="italic text-xs text-[#5a7060] mt-2 uppercase tracking-[0.3em]">Wear Wink</p>
        </div>

        <h1 className="text-sm font-bold text-[#1C3829] text-center uppercase tracking-[0.2em] mb-8 border-b border-[#1C3829]/10 pb-4">
          Administrative Portal
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-4 rounded-lg mb-6 text-center font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="admin-email" className="block text-[10px] font-bold text-[#1C3829]/60 uppercase tracking-widest mb-2">
              Credential ID
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@labelwink.co"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-0 focus:border-[#1C3829] transition-colors placeholder:text-gray-300 bg-white"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-[10px] font-bold text-[#1C3829]/60 uppercase tracking-widest mb-2">
              Access Token
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-0 focus:border-[#1C3829] transition-colors placeholder:text-gray-300 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7060] hover:text-[#1C3829] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1C3829] hover:bg-[#234d44] text-[#E8C97A] rounded-xl py-4 font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Authenticating...' : 'Establish Session'}
          </button>
        </form>

        <p className="text-center text-[9px] text-[#6B6B5A] mt-10 uppercase tracking-widest leading-loose opacity-60">
          Secured by LabelWink Cloud · Authorized Personnel Only<br/>
          Unauthorized access attempts are logged
        </p>
      </div>
    </div>
  )
}
