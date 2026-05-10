'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface IntegrationConfig {
  razorpay_key?: string
  razorpay_mode?: string
  shiprocket_email?: string
  shiprocket_location?: string
  shiprocket_dimensions?: Record<string, number>
  telegram_token?: string
  telegram_chat_id?: string
  telegram_alerts?: Record<string, boolean>
  brevo_api_key?: string
  brevo_from_email?: string
  brevo_from_name?: string
}

const TABS = [
  { key: 'razorpay', label: 'Razorpay' },
  { key: 'shiprocket', label: 'Shiprocket' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'brevo', label: 'Brevo / Email' },
]

const TELEGRAM_ALERTS = [
  { key: 'new_order', label: 'New order placed' },
  { key: 'payment_failed', label: 'Payment failed' },
  { key: 'low_stock', label: 'Low stock warning' },
  { key: 'new_return', label: 'New return request' },
]

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('razorpay')
  const [config, setConfig] = useState<IntegrationConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/superadmin/integrations')
      const data = await res.json()
      setConfig(data.config || {})
    } catch (error) {
      toast.error('Failed to fetch integrations config')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      if (res.ok) {
        toast.success('Configuration saved')
      } else {
        toast.error('Failed to save configuration')
      }
    } catch (error) {
      toast.error('Error saving configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleTestRazorpay = async () => {
    try {
      const res = await fetch('/api/admin/settings/test-razorpay', {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Razorpay connection OK')
      } else {
        toast.error('Razorpay connection failed')
      }
    } catch (error) {
      toast.error('Error testing Razorpay')
    }
  }

  const handleTestTelegram = async () => {
    try {
      const res = await fetch('/api/superadmin/integrations/test-telegram', {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Test message sent')
      } else {
        toast.error('Failed to send test message')
      }
    } catch (error) {
      toast.error('Error testing Telegram')
    }
  }

  const handleTestBrevo = async () => {
    try {
      const res = await fetch('/api/superadmin/integrations/test-brevo', {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Test email sent')
      } else {
        toast.error('Failed to send test email')
      }
    } catch (error) {
      toast.error('Error testing Brevo')
    }
  }

  const maskSecret = (secret: string) => {
    if (!secret || secret.length < 8) return '••••••••'
    return secret.slice(0, 4) + '••••' + secret.slice(-4)
  }

  if (loading) {
    return <div className="text-[#5a7060]">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Integrations</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#f5f2ec] mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 border-b-2 transition-colors text-sm font-medium ${
              activeTab === tab.key
                ? 'border-[#c9a84c] text-[#c9a84c]'
                : 'border-transparent text-[#5a7060] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#faf8f4] rounded-lg p-6 max-w-2xl">
        {/* Razorpay */}
        {activeTab === 'razorpay' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Razorpay Payment Gateway</h2>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">Key ID</label>
              <input
                type="text"
                readOnly
                value={maskSecret(config.razorpay_key || '')}
                className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-[#5a7060]"
              />
              {config.razorpay_mode && (
                <p className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    config.razorpay_mode === 'TEST'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {config.razorpay_mode}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={handleTestRazorpay}
              className="bg-[#c9a84c] text-black font-bold px-4 py-2 rounded hover:bg-[#d4b66a]"
            >
              Test Connection
            </button>
            <p className="text-[#9aab9e] text-sm mt-4">
              <a href="https://dashboard.razorpay.com" target="_blank" className="text-[#c9a84c] hover:underline">
                → Open Razorpay Dashboard
              </a>
            </p>
          </div>
        )}

        {/* Shiprocket */}
        {activeTab === 'shiprocket' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shiprocket Logistics</h2>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">Email</label>
              <input
                type="text"
                readOnly
                value={maskSecret(config.shiprocket_email || '')}
                className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-[#5a7060]"
              />
            </div>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">Pickup Location Name</label>
              <input
                type="text"
                value={config.shiprocket_location || 'Primary'}
                onChange={(e) => setConfig({ ...config, shiprocket_location: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#5a7060] text-sm mb-2">Length (cm)</label>
                <input
                  type="number"
                  value={config.shiprocket_dimensions?.length || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    shiprocket_dimensions: {
                      ...config.shiprocket_dimensions,
                      length: parseInt(e.target.value) || 0,
                    },
                  })}
                  className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                />
              </div>
              <div>
                <label className="block text-[#5a7060] text-sm mb-2">Width (cm)</label>
                <input
                  type="number"
                  value={config.shiprocket_dimensions?.width || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    shiprocket_dimensions: {
                      ...config.shiprocket_dimensions,
                      width: parseInt(e.target.value) || 0,
                    },
                  })}
                  className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                />
              </div>
              <div>
                <label className="block text-[#5a7060] text-sm mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={config.shiprocket_dimensions?.height || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    shiprocket_dimensions: {
                      ...config.shiprocket_dimensions,
                      height: parseInt(e.target.value) || 0,
                    },
                  })}
                  className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                />
              </div>
              <div>
                <label className="block text-[#5a7060] text-sm mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.shiprocket_dimensions?.weight || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    shiprocket_dimensions: {
                      ...config.shiprocket_dimensions,
                      weight: parseFloat(e.target.value) || 0,
                    },
                  })}
                  className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#c9a84c] text-black font-bold px-4 py-2 rounded hover:bg-[#d4b66a] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}

        {/* Telegram */}
        {activeTab === 'telegram' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Telegram Alerts</h2>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">Bot Token</label>
              <input
                type="password"
                value={config.telegram_token || ''}
                onChange={(e) => setConfig({ ...config, telegram_token: e.target.value })}
                placeholder="123456:ABC-DEF..."
                className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              />
            </div>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">Chat ID</label>
              <input
                type="text"
                value={config.telegram_chat_id || ''}
                onChange={(e) => setConfig({ ...config, telegram_chat_id: e.target.value })}
                placeholder="-100123456789"
                className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[#5a7060] text-sm font-semibold">Alert Toggles</p>
              {TELEGRAM_ALERTS.map(alert => (
                <label key={alert.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.telegram_alerts?.[alert.key] ?? false}
                    onChange={(e) => setConfig({
                      ...config,
                      telegram_alerts: {
                        ...config.telegram_alerts,
                        [alert.key]: e.target.checked,
                      },
                    })}
                    className="rounded"
                  />
                  <span className="text-[#5a7060] text-sm">{alert.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleTestTelegram}
                className="bg-white text-white px-4 py-2 rounded hover:bg-[#f5f2ec]"
              >
                Send Test Message
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#c9a84c] text-black font-bold px-4 py-2 rounded hover:bg-[#d4b66a] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Brevo */}
        {activeTab === 'brevo' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Brevo Email Service</h2>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">API Key</label>
              <input
                type="password"
                value={config.brevo_api_key || ''}
                onChange={(e) => setConfig({ ...config, brevo_api_key: e.target.value })}
                placeholder="xkeysib-..."
                className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              />
            </div>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">From Email</label>
              <input
                type="email"
                value={config.brevo_from_email || ''}
                onChange={(e) => setConfig({ ...config, brevo_from_email: e.target.value })}
                placeholder="noreply@labelwink.co"
                className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              />
            </div>
            <div>
              <label className="block text-[#5a7060] text-sm mb-2">From Name</label>
              <input
                type="text"
                value={config.brevo_from_name || ''}
                onChange={(e) => setConfig({ ...config, brevo_from_name: e.target.value })}
                placeholder="LabelWink"
                className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleTestBrevo}
                className="bg-white text-white px-4 py-2 rounded hover:bg-[#f5f2ec]"
              >
                Send Test Email
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#c9a84c] text-black font-bold px-4 py-2 rounded hover:bg-[#d4b66a] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
