import Link from 'next/link'
import { FileText, HelpCircle, Phone, Home } from 'lucide-react'

const PAGES = [
  { slug: 'home', label: 'Homepage', icon: Home, desc: 'Hero banner, announcement bar, brand story, trust badges' },
  { slug: 'about', label: 'About Us', icon: FileText, desc: 'Company story, founder info, mission statement' },
  { slug: 'faq', label: 'FAQ', icon: HelpCircle, desc: 'Frequently asked questions and answers' },
  { slug: 'contact', label: 'Contact', icon: Phone, desc: 'Email, WhatsApp, phone, address, contact form settings' },
]

export const metadata = { title: 'Pages' }

export default function PagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Pages</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Edit content for storefront pages</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PAGES.map(p => (
          <Link key={p.slug} href={`/admin/pages/${p.slug}`}
            className="bg-white border border-[#e5e7eb] rounded-xl p-6 hover:border-[#1b3a34] hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#1b3a34]/10 rounded-full flex items-center justify-center text-[#1b3a34] group-hover:bg-[#1b3a34] group-hover:text-white transition-colors">
                <p.icon size={18} />
              </div>
              <h2 className="font-semibold text-[#1a1a1a]">{p.label}</h2>
            </div>
            <p className="text-sm text-[#6b7280]">{p.desc}</p>
            <span className="inline-block mt-3 text-sm text-[#1b3a34] font-medium group-hover:underline">Edit Page →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
