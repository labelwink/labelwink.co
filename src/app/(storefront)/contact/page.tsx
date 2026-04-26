import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/storefront/ContactForm'
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react'

export const metadata = {
  title: 'Contact Us | Label Wink',
  description: "Get in touch with Label Wink. We're here to help with your queries.",
}

export default async function ContactPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('cms_content')
    .select('content')
    .eq('page', 'contact')
    .single()
  const cms = (data?.content as any) || {}

  const pageTitle = cms.title || 'Contact Us'
  const subtitle = cms.subtitle || "We'd love to hear from you. Reach out and we'll get back to you shortly."
  const email = cms.email || 'support@labelwink.co'
  const whatsapp = cms.whatsapp || ''
  const phone = cms.phone || ''
  const address_line1 = cms.address_line1 || ''
  const address_line2 = cms.address_line2 || ''
  const hours = cms.hours || ''
  const showForm = cms.show_form !== false && cms.form_enabled !== false

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold text-[#1b3a34] mb-2">{pageTitle}</h1>
      <p className="text-gray-500 mb-10">{subtitle}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Contact details */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Get In Touch</h2>

          {email && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-[#1b3a34]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <a href={`mailto:${email}`} className="text-[#1b3a34] hover:underline text-sm">
                  {email}
                </a>
              </div>
            </div>
          )}

          {whatsapp && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">WhatsApp</p>
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="text-green-600 hover:underline text-sm">
                  {whatsapp}
                </a>
              </div>
            </div>
          )}

          {phone && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-[#1b3a34]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-sm text-gray-700">{phone}</p>
              </div>
            </div>
          )}

          {address_line1 && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-[#1b3a34]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                <p className="text-sm text-gray-700">{address_line1}</p>
                {address_line2 && <p className="text-sm text-gray-700">{address_line2}</p>}
              </div>
            </div>
          )}

          {hours && (
            <div className="mt-4 p-4 bg-[#f9f9f9] rounded-xl border border-[#e5e7eb]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Business Hours</p>
              <p className="text-sm text-gray-700">{hours}</p>
            </div>
          )}
        </div>

        {/* Right: Contact form */}
        {showForm && <ContactForm />}
      </div>
    </div>
  )
}
