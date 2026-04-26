import Link from 'next/link';

interface SaleBannerData {
  enabled: boolean;
  headline: string;
  subtext: string;
  cta?: string;
  link?: string;
}

interface SaleBannerProps {
  data: SaleBannerData;
}

export function SaleBanner({ data }: SaleBannerProps) {
  if (!data?.enabled) return null;

  return (
    <section className="bg-[#c2185b] py-14 px-4 text-center text-white">
      <p className="text-[10px] md:text-xs tracking-[0.3em] text-white/60 mb-2 font-medium">
        Limited Time Offer
      </p>
      <h2 className="font-serif text-3xl mb-3">{data.headline}</h2>
      <p className="text-white/80 mb-7 text-sm max-w-md mx-auto">{data.subtext}</p>
      <Link
        href={data.link || '/products'}
        className="inline-block bg-white text-[#c2185b] px-8 py-3 text-sm tracking-widest font-semibold hover:bg-[#f5f0e8] transition-colors rounded-sm"
      >
        {data.cta || 'Shop Now'}
      </Link>
    </section>
  );
}
