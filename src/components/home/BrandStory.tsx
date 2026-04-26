import Link from 'next/link';
import Image from 'next/image';

interface BrandStoryData {
  pill_tag?: string;
  headline: string;
  body: string;
  image_url?: string;
}

interface BrandStoryProps {
  data: BrandStoryData;
}

export function BrandStory({ data }: BrandStoryProps) {
  if (!data) return null;

  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Image */}
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-md bg-[#1a3a34]/10">
          {data.image_url ? (
            <Image
              src={data.image_url}
              fill
              className="object-cover"
              quality={90}
              alt="Label Wink Brand Story"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full bg-[#1a3a34] flex items-center justify-center">
              <span className="text-[#c9a84c] font-serif text-6xl">LW</span>
            </div>
          )}
        </div>

        {/* Copy */}
        <div>
          <p className="text-[10px] md:text-xs tracking-[0.3em] text-[#c9a84c] mb-4 font-medium">
            {data.pill_tag || 'Our Story'}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a3a34] mb-5 leading-snug">
            {data.headline}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6 text-sm md:text-base">
            {data.body}
          </p>
          <Link
            href="/about"
            className="inline-block border-b border-[#1a3a34] text-[#1a3a34] text-sm tracking-wide pb-0.5 hover:text-[#c9a84c] hover:border-[#c9a84c] transition-colors"
          >
            Read More About Us →
          </Link>
        </div>
      </div>
    </section>
  );
}
