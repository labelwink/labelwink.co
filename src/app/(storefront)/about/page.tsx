import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

export default async function AboutPage() {
  const supabase = createClient()
  const { data: page } = await supabase
    .from('pages_content')
    .select('*')
    .eq('slug', 'about')
    .single()

  const sections = page?.sections || []
  const hero = sections.find((s: any) => s.type === 'hero')
  const textBlocks = sections.filter((s: any) => s.type === 'text_block')

  return (
    <div className="bg-cream">
      {/* Hero Section */}
      {hero && (
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={hero.image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"} 
              alt={hero.title} 
              fill 
              className="object-cover brightness-75"
              priority
            />
          </div>
          <div className="relative z-10 text-center text-cream px-4 max-w-3xl">
            <h1 className="font-heading text-5xl md:text-7xl font-semibold mb-6 tracking-tight">{hero.title}</h1>
            <p className="text-lg md:text-xl font-light leading-relaxed italic opacity-90">
              {hero.content}
            </p>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="space-y-12">
            {textBlocks.map((block: any, idx: number) => (
              <div key={idx} className="space-y-8">
                <div className="space-y-4">
                  <span className="text-teal font-semibold tracking-widest uppercase text-xs">Label Wink</span>
                  <h2 className="font-heading text-4xl md:text-5xl font-semibold text-charcoal">{block.title}</h2>
                </div>
                
                <div 
                  className="prose prose-sage text-charcoal/80 text-lg leading-relaxed font-light"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              </div>
            ))}

            <div className="pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-heading text-2xl mb-2">Natural</h3>
                  <p className="text-sm text-muted-foreground">Handpicked breathable fabrics like organic cotton and chanderi.</p>
                </div>
                <div>
                  <h3 className="font-heading text-2xl mb-2">Conscious</h3>
                  <p className="text-sm text-muted-foreground">Sustainable production that respects both people and the planet.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/5] rounded-sm overflow-hidden shadow-2xl shadow-sage/20">
             <Image 
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop" 
                alt="Our craftsmanship" 
                fill 
                className="object-cover"
              />
          </div>
        </div>
      </section>
    </div>
  )
}
