import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'About Us | Label Wink',
  description: 'Learn about Label Wink — our story, values, and craftsmanship.',
}

export default async function AboutPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('cms_content')
    .select('content')
    .eq('page', 'about')
    .single()
  const cms = (data?.content as any) || {}

  const title = cms.title || 'About Us'
  const heroImage = cms.hero_image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop'
  const heroSubtitle = cms.hero_subtitle || 'Every stitch tells a story'
  const body = cms.body || 'At Label Wink, we believe that every woman deserves to feel confident, comfortable, and completely herself.'
  const sideImage = cms.side_image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop'

  return (
    <div className="bg-cream">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover brightness-75"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-cream px-4 max-w-3xl">
          <h1 className="font-heading text-5xl md:text-7xl font-semibold mb-6 tracking-tight">{title}</h1>
          <p className="text-lg md:text-xl font-light leading-relaxed italic opacity-90">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-teal font-semibold tracking-widest uppercase text-xs">Label Wink</span>
              <h2 className="font-heading text-4xl md:text-5xl font-semibold text-charcoal">{cms.section_title || 'Crafted for the modern Indian woman'}</h2>
            </div>

            <div
              className="prose prose-sage text-charcoal/80 text-lg leading-relaxed font-light"
              dangerouslySetInnerHTML={{ __html: body }}
            />

            <div className="pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-heading text-2xl mb-2">{cms.value1_title || 'Natural'}</h3>
                  <p className="text-sm text-muted-foreground">{cms.value1_body || 'Handpicked breathable fabrics like organic cotton and chanderi.'}</p>
                </div>
                <div>
                  <h3 className="font-heading text-2xl mb-2">{cms.value2_title || 'Conscious'}</h3>
                  <p className="text-sm text-muted-foreground">{cms.value2_body || 'Sustainable production that respects both people and the planet.'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/5] rounded-sm overflow-hidden shadow-2xl shadow-sage/20">
            <Image
              src={sideImage}
              alt="Our craftsmanship"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
