import { readFileSync } from 'fs'
import { join } from 'path'
import { ContactForm } from '@/components/storefront/ContactForm'
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react'

export const metadata = {
  title: 'Contact Us | Label Wink',
  description: 'Get in touch with Label Wink. We\'re here to help with your queries.',
}

function getContactData() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'pages', 'contact.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { email: 'support@labelwink.co', show_form: true }
  }
}

export default function ContactPage() {
  const data = getContactData()

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold text-[#1b3a34] mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-10">We'd love to hear from you. Reach out and we'll get back to you shortly.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Contact details */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Get In Touch</h2>

          {data.email && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-[#1b3a34]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <a href={`mailto:${data.email}`} className="text-[#1b3a34] hover:underline text-sm">
                  {data.email}
                </a>
              </div>
            </div>
          )}

          {data.whatsapp && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">WhatsApp</p>
                <a href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="text-green-600 hover:underline text-sm">
                  {data.whatsapp}
                </a>
              </div>
            </div>
          )}

          {data.phone && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-[#1b3a34]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-sm text-gray-700">{data.phone}</p>
              </div>
            </div>
          )}

          {data.address_line1 && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-[#1b3a34]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                <p className="text-sm text-gray-700">{data.address_line1}</p>
                {data.address_line2 && <p className="text-sm text-gray-700">{data.address_line2}</p>}
              </div>
            </div>
          )}

          {data.hours && (
            <div className="mt-4 p-4 bg-[#f9f9f9] rounded-xl border border-[#e5e7eb]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Business Hours</p>
              <p className="text-sm text-gray-700">{data.hours}</p>
            </div>
          )}
        </div>

        {/* Right: Contact form */}
        {(data.show_form !== false && data.form_enabled !== false) && (
          <ContactForm />
        )}
      </div>
    </div>
  )
}
