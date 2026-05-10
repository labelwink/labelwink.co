import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

async function getSettings() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('shop_settings').select('*').single();
  return settings;
}

async function getAboutContent() {
  const supabase = await createClient();
  const { data: cms } = await supabase
    .from('cms_content')
    .select('content')
    .eq('page', 'about')
    .single();
  return cms?.content || {};
}

export async function generateMetadata() {
  const settings = await getSettings();
  const storeName = settings?.store_name || 'LabelWink';
  return {
    title: `About Us | ${storeName}`,
    description: `Learn about ${storeName} — our story, values, and craftsmanship.`,
  };
}

export default async function AboutPage() {
  const settings = await getSettings();
  const content = await getAboutContent();

  const values = (() => {
    try {
      if (typeof content.values === 'string') return JSON.parse(content.values);
      return content.values || [
        { title: 'Quality First', description: 'We never compromise on materials or construction.', icon: '✨' },
        { title: 'Ethical Craft', description: 'Fair wages and safe environments for all artisans.', icon: '🤝' },
        { title: 'Customer Focused', description: 'Your satisfaction is at the heart of our design.', icon: '❤️' },
      ];
    } catch {
      return [
        { title: 'Quality First', description: 'We never compromise on materials or construction.', icon: '✨' },
        { title: 'Ethical Craft', description: 'Fair wages and safe environments for all artisans.', icon: '🤝' },
        { title: 'Customer Focused', description: 'Your satisfaction is at the heart of our design.', icon: '❤️' },
      ];
    }
  })();

  const storyText = content.story_body || settings?.about_us_text ||
    'LabelWink was born from a vision to redefine contemporary fashion by blending traditional craftsmanship with modern silhouettes. Every piece in our collection tells a story of meticulous attention to detail.';

  return (
    <main style={{ minHeight: '100vh', background: '#FDF8F0' }}>

      {/* Hero */}
      <section style={{
        position: 'relative', height: '480px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', background: '#FDF8F0',
      }}>
        {(settings?.about_us_image_url) && (
          <Image
            src={settings.about_us_image_url}
            alt="About LabelWink"
            fill priority sizes="100vw"
            style={{ objectFit: 'cover', opacity: 0.4 }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(15,15,15,0.4), rgba(15,15,15,0.8))',
        }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: '700px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c9a84c', marginBottom: '16px' }}>
            Our Story
          </p>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 600, color: '#1C3829', lineHeight: 1.1, marginBottom: '16px' }}>
            {content.hero_title || 'Elegance with Purpose'}
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(240,240,240,0.6)', lineHeight: 1.7 }}>
            {content.hero_subtitle || settings?.store_tagline || 'Crafting modern ethnic wear for the contemporary woman'}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '60px', alignItems: 'center',
        }}>
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '4/5', background: '#FAF5E9' }}>
            {settings?.about_us_image_url ? (
              <Image src={settings.about_us_image_url} alt="Our Story" fill sizes="(max-width: 640px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #FAF5E9 0%, #E8DFC8 100%)' }} />
            )}
          </div>

          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c9a84c', marginBottom: '12px' }}>
              Who We Are
            </p>
            <h2 style={{ fontSize: '36px', fontWeight: 600, color: '#1C3829', lineHeight: 1.2, marginBottom: '24px' }}>
              {content.story_heading || 'Crafted with Purpose & Passion'}
            </h2>
            <div style={{ borderLeft: '3px solid #c9a84c', paddingLeft: '20px', marginBottom: '32px' }}>
              {storyText.split('\n').filter(Boolean).map((p: string, i: number) => (
                <p key={i} style={{ fontSize: '15px', color: '#6B6B5A', lineHeight: 1.8, marginBottom: '12px' }}>{p}</p>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { value: '10k+', label: 'Happy Customers' },
                { value: '50+', label: 'Unique Styles' },
                { value: '3+', label: 'Years of Craft' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#c9a84c', marginBottom: '4px' }}>{stat.value}</p>
                  <p style={{ fontSize: '13px', color: '#9aab9e' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '80px 24px', background: '#FDF8F0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c9a84c', marginBottom: '12px' }}>
              What We Stand For
            </p>
            <h2 style={{ fontSize: '36px', fontWeight: 600, color: '#1C3829' }}>Our Core Philosophy</h2>
            <p style={{ fontSize: '15px', color: '#6B6B5A', marginTop: '12px' }}>Guided by principles that define everything we create.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {values.map((v: any, i: number) => (
              <div key={i} style={{
                background: '#FAF5E9', border: '1px solid #E8DFC8',
                borderRadius: '12px', padding: '28px',
                transition: 'border-color 200ms',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(201,168,76,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', marginBottom: '20px',
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1C3829', marginBottom: '10px' }}>{v.title}</h3>
                <p style={{ fontSize: '14px', color: '#6B6B5A', lineHeight: 1.7 }}>{v.description || v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 600, color: '#1C3829', marginBottom: '16px' }}>
            Ready to Explore?
          </h2>
          <p style={{ fontSize: '16px', color: '#6B6B5A', marginBottom: '32px', lineHeight: 1.7 }}>
            Discover our curated collection of modern ethnic wear crafted for every occasion.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" style={{
              height: '48px', padding: '0 28px', borderRadius: '8px',
              background: '#c9a84c', color: '#FAF5E9',
              fontWeight: 600, fontSize: '15px', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}>
              Shop Now
            </Link>
            <Link href="/contact" style={{
              height: '48px', padding: '0 28px', borderRadius: '8px',
              border: '1px solid #E8DFC8', color: '#1C3829',
              fontWeight: 500, fontSize: '15px', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}>
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info Strip */}
      {settings && (
        <section style={{ borderTop: '1px solid #E8DFC8', padding: '48px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', textAlign: 'center' }}>
            {[
              { label: 'Address', value: settings.store_address ? `${settings.store_address}` : null },
              { label: 'Email', value: settings.store_email },
              { label: 'Phone', value: settings.store_phone },
              { label: 'Hours', value: 'Mon–Sat, 10am–7pm' },
            ].filter(c => c.value).map(c => (
              <div key={c.label}>
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c9a84c', marginBottom: '8px' }}>{c.label}</p>
                <p style={{ fontSize: '14px', color: '#6B6B5A' }}>{c.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
