import Image from 'next/image';
import Link from 'next/link';

async function getAboutData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  try {
    const res = await fetch(`${baseUrl}/api/storefront/about`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch about page');
    return await res.json();
  } catch (err) {
    console.error('About fetch error:', err);
    return null;
  }
}

export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  let settings = null;
  try {
    const res = await fetch(`${baseUrl}/api/storefront/settings`, { next: { revalidate: 300 } });
    if (res.ok) settings = await res.json();
  } catch (err) {}

  const storeName = settings?.store_name || 'Store';
  
  return {
    title: `About Us | ${storeName}`,
    description: `Learn about ${storeName} — our story, values, and craftsmanship.`,
  };
}

export default async function AboutPage() {
  const data = await getAboutData();
  
  if (!data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#faf7f2] text-[#1a1a1a]">
        <h1 className="text-3xl font-bold mb-4">About Us</h1>
        <p>Content is currently being updated.</p>
      </div>
    );
  }

  const {
    hero_title,
    hero_subtitle,
    hero_image_url,
    story_heading,
    story_body,
    mission_heading,
    mission_body,
    values,
  } = data;

  let parsedValues = [];
  if (values) {
    try {
      parsedValues = typeof values === 'string' ? JSON.parse(values) : values;
    } catch {
      parsedValues = [];
    }
  }

  return (
    <main className="bg-[#faf7f2] text-[#1a1a1a] min-h-screen">
      {/* 1. HERO */}
      <section className={`relative w-full h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden ${!hero_image_url ? 'bg-[#1a1a1a]' : ''}`}>
        {hero_image_url && (
          <>
            <Image
              src={hero_image_url}
              alt={hero_title || 'About Us'}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${hero_image_url ? 'text-[#faf7f2]' : 'text-[#c9a84c]'}`}>
            {hero_title}
          </h1>
          {hero_subtitle && (
            <p className="text-lg md:text-2xl text-[#faf7f2]/90 italic font-light">
              {hero_subtitle}
            </p>
          )}
        </div>
      </section>

      {/* 2. STORY SECTION */}
      {story_heading && story_body && (
        <section className="py-20 md:py-32 px-4 container mx-auto">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-[#1a1a1a]">
                {story_heading}
              </h2>
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                {story_body.split('\n').map((paragraph: string, idx: number) => {
                  const p = paragraph.trim();
                  if (!p) return null;
                  return <p key={idx}>{p}</p>;
                })}
              </div>
            </div>
            <div className="hidden md:flex relative aspect-[4/5] bg-[#c9a84c]/10 rounded-2xl border-4 border-[#c9a84c]/20 items-center justify-center p-12">
               <div className="text-9xl opacity-20">✨</div>
               <div className="absolute inset-0 border-2 border-[#c9a84c]/30 transform rotate-3 rounded-2xl"></div>
            </div>
          </div>
        </section>
      )}

      {/* 3. MISSION SECTION */}
      {mission_heading && mission_body && (
        <section className="py-20 bg-white px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-1 bg-[#c9a84c] mx-auto mb-8"></div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-6">
              {mission_heading}
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed font-light">
              "{mission_body}"
            </p>
          </div>
        </section>
      )}

      {/* 4. VALUES GRID */}
      {parsedValues && parsedValues.length > 0 && (
        <section className="py-20 px-4 container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {parsedValues.map((val: any, idx: number) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4 inline-block bg-[#faf7f2] p-4 rounded-full">
                  {val.icon || '✦'}
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">{val.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. CTA SECTION */}
      <section className="py-24 px-4 bg-[#1a1a1a] text-center text-[#faf7f2]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#c9a84c]">Discover Your Next Favorite Piece</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/products" 
              className="bg-[#c9a84c] text-[#1a1a1a] font-bold px-8 py-4 rounded-lg hover:bg-[#b8973d] transition-colors"
            >
              Start Shopping
            </Link>
            <Link 
              href="/products" 
              className="border-2 border-[#c9a84c] text-[#c9a84c] font-bold px-8 py-4 rounded-lg hover:bg-[#c9a84c]/10 transition-colors"
            >
              View Collections
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
