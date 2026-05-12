'use client'
import Link from 'next/link'

const CMS_SECTIONS = [
  {
    title: 'Policy Pages',
    description: 'Edit privacy, return, shipping and terms policies',
    href: '/admin/cms/pages',
    icon: '📄',
  },
  {
    title: 'FAQ',
    description: 'Manage frequently asked questions',
    href: '/admin/cms/faq',
    icon: '💬',
  },
  {
    title: 'Banners',
    description: 'Homepage hero banners and promotional images',
    href: '/admin/cms/banners',
    icon: '🖼️',
  },
  {
    title: 'Sections',
    description: 'Homepage sections and featured content',
    href: '/admin/cms/sections',
    icon: '📐',
  },
  {
    title: 'About Page',
    description: 'Edit the about us page content',
    href: '/admin/cms/about',
    icon: '🏢',
  },
  {
    title: 'Occasions',
    description: 'Manage occasion categories and content',
    href: '/admin/cms/occasions',
    icon: '🎉',
  },
  {
    title: 'Collections',
    description: 'Manage product collections and banners',
    href: '/admin/cms/collections',
    icon: '🗂️',
  },
  {
    title: 'Email Templates',
    description: 'Order confirmation and notification templates',
    href: '/superadmin/email-templates',
    icon: '✉️',
  },
]

export default function SuperAdminCMSPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#1C3829' }}>
          CMS Overview
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          All content management tools for LabelWink storefront
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {CMS_SECTIONS.map(section => (
          <Link
            key={section.href}
            href={section.href}
            style={{
              display: 'block',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#1C3829'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(28,56,41,0.08)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>{section.icon}</div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>
              {section.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
