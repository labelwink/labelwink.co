import { createClient } from '@/lib/supabase/server'
import { FAQAccordion } from '@/components/storefront/FAQAccordion'

export const metadata = {
  title: 'FAQ | Label Wink',
  description: 'Frequently asked questions about Label Wink — shipping, returns, sizing and more.',
}

export default async function FAQPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cms_content')
    .select('content')
    .eq('page', 'faq')
    .single()
  const cms = (data?.content as any) || {}

  const title = cms.title || 'Frequently Asked Questions'
  const subtitle = cms.subtitle || ''
  const items: { question: string; answer: string }[] = Array.isArray(cms.faqs)
    ? cms.faqs
    : [
        { question: 'What is your return policy?', answer: 'We accept returns within 7 days of delivery for unused, unwashed items with tags intact.' },
        { question: 'How long does shipping take?', answer: 'Standard delivery takes 3–7 business days. Express options are available at checkout.' },
        { question: 'Do you ship internationally?', answer: 'Currently we ship within India only. International shipping coming soon!' },
        { question: 'How do I track my order?', answer: 'You will receive a tracking link via SMS and email once your order is dispatched.' },
      ]

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-[#1b3a34] mb-2">{title}</h1>
      {subtitle && <p className="text-[#9aab9e] mb-8">{subtitle}</p>}
      <div className="mt-6">
        <FAQAccordion items={items} />
      </div>
    </div>
  )
}
