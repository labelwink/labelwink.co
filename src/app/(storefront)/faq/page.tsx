import { readFileSync } from 'fs'
import { join } from 'path'
import { FAQAccordion } from '@/components/storefront/FAQAccordion'

export const metadata = {
  title: 'FAQ | Label Wink',
  description: 'Frequently asked questions about Label Wink — shipping, returns, sizing and more.',
}

function getFAQData() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'pages', 'faq.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { items: [] }
  }
}

export default function FAQPage() {
  const { items } = getFAQData()

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-[#1b3a34] mb-8">Frequently Asked Questions</h1>
      <FAQAccordion items={items} />
    </div>
  )
}
