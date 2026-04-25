'use client'

import { useState } from 'react'
import { useToast } from '@/components/admin/Toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return showToast('All fields are required', 'error')
    if (newPw !== confirmPw) return showToast('New passwords do not match', 'error')
    if (newPw.length < 8) return showToast('Password must be at least 8 characters', 'error')

    setSaving(true)
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Password change validated. Update ADMIN_PASSWORD in .env.local', 'success')
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } else {
        showToast(data.error || 'Failed', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {ToastComponent}
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Settings</h1>

      {/* Change Password */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-[#1a1a1a]">Change Admin Password</h2>
        <p className="text-sm text-[#6b7280]">
          Passwords are stored in your environment variable <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">ADMIN_PASSWORD</code>.
          After validating here, update the value in your <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">.env.local</code> file and redeploy.
        </p>
        <div className="space-y-4">
          {[
            { id: 'current-pw', label: 'Current Password', val: currentPw, setVal: setCurrentPw, show: showCurrent, setShow: setShowCurrent },
            { id: 'new-pw', label: 'New Password', val: newPw, setVal: setNewPw, show: showNew, setShow: setShowNew },
            { id: 'confirm-pw', label: 'Confirm New Password', val: confirmPw, setVal: setConfirmPw, show: showNew, setShow: setShowNew },
          ].map(({ id, label, val, setVal, show, setShow }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
              <div className="relative">
                <input id={id} type={show ? 'text' : 'password'} value={val} onChange={e => setVal(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={changePassword} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44] disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Validate & Change Password
        </button>
      </div>

      {/* Account Info */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-[#1a1a1a]">Account Info</h2>
        <div className="text-sm space-y-2">
          <div className="flex justify-between py-2 border-b border-[#e5e7eb]">
            <span className="text-[#6b7280]">Role</span><span className="font-medium">Admin</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#e5e7eb]">
            <span className="text-[#6b7280]">Auth Type</span><span className="font-medium">Password (JWT)</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#6b7280]">Session Duration</span><span className="font-medium">24 hours</span>
          </div>
        </div>
      </div>
    </div>
  )
}
