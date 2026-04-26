import { createClient } from '@/lib/supabase/server'

export default async function PoliciesPage() {
  const supabase = await createClient()
  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .order('type', { ascending: true })

  return (
    <div className="bg-cream min-h-screen pb-20">
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <div className="text-center mb-20">
          <h1 className="font-heading text-5xl md:text-6xl font-semibold mb-6">Store Policies</h1>
          <p className="text-muted-foreground tracking-widest uppercase text-sm">Transparency & Trust at Label Wink</p>
          <div className="w-24 h-1 bg-teal mx-auto mt-8"></div>
        </div>

        <div className="space-y-20">
          {policies?.map((policy, index) => (
            <section key={policy.id} className="space-y-6">
              <h2 className="font-heading text-3xl text-charcoal border-b border-sage/20 pb-4">
                {index + 1}. {policy.title}
              </h2>
              <div 
                className="prose prose-sage max-w-none text-charcoal/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: policy.content }}
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic pt-4">
                Last updated: {new Date(policy.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </section>
          ))}
          
          {!policies?.length && (
            <div className="text-center py-20 text-muted-foreground italic">
              Policies are being updated. Please check back later.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

