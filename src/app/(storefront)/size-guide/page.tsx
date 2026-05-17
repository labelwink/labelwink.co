import { LeafPattern } from '@/components/ui/LeafPattern'

export const metadata = {
  title: 'Size Guide',
  description: "Find your perfect fit with the Label Wink size guide. Standard Indian women's ethnic wear measurements.",
}

const sizes = [
  { size: 'XXS', chest: '30"', waist: '23"', hip: '32"', length: '50"' },
  { size: 'XS',  chest: '32"', waist: '25"', hip: '34"', length: '52"' },
  { size: 'S',   chest: '34"', waist: '27"', hip: '36"', length: '53"' },
  { size: 'M',   chest: '36"', waist: '29"', hip: '38"', length: '54"' },
  { size: 'L',   chest: '38"', waist: '31"', hip: '40"', length: '55"' },
  { size: 'XL',  chest: '40"', waist: '33"', hip: '42"', length: '56"' },
  { size: 'XXL', chest: '42"', waist: '35"', hip: '44"', length: '57"' },
  { size: '3XL', chest: '44"', waist: '37"', hip: '46"', length: '58"' },
  { size: '4XL', chest: '46"', waist: '39"', hip: '48"', length: '59"' },
  { size: '5XL', chest: '48"', waist: '41"', hip: '50"', length: '60"' },
]

const howToMeasure = [
  {
    label: 'Chest',
    icon: '📏',
    desc: 'Measure around the fullest part of your chest, keeping tape horizontal.',
  },
  {
    label: 'Waist',
    icon: '🎀',
    desc: 'Measure around your natural waistline, the narrowest part of your torso.',
  },
  {
    label: 'Hips',
    icon: '📐',
    desc: 'Stand with feet together. Measure around the fullest part of your hips.',
  },
]

export default function SizeGuidePage() {
  return (
    <div className="relative min-h-screen bg-[#FDF8F0] pt-8 md:pt-16">
      <LeafPattern opacity={0.06} id="size-guide-page" />
      
      {/* Content Area */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-24 relative z-10">
        <div className="relative bg-white shadow-2xl border border-labelwink-cream-border overflow-hidden">
          <LeafPattern opacity={0.04} id="size-guide-card" />
          
          <div className="relative z-10 p-6 md:p-16">
            {/* Header Banner */}
            <div className="bg-[#1C3829] text-white p-8 md:p-12 rounded-none mb-12 text-center relative overflow-hidden">
              <p className="text-[#c9a84c] font-semibold text-xs tracking-widest uppercase mb-2">
                LABELWINK
              </p>
              <h1 className="font-serif text-3xl md:text-4xl mb-4 tracking-wide">
                Size Guide
              </h1>
              <p className="text-white/80 max-w-xl mx-auto text-sm md:text-base">
                Find your perfect fit with standard Indian women&apos;s ethnic wear measurements.
              </p>
            </div>

            {/* Intro Description */}
            <p className="text-sm md:text-base text-[#1C3829]/80 text-center max-w-xl mx-auto mb-12 leading-relaxed">
              We recommend measuring over your innerwear for the most accurate fit.
              When in doubt, size up for a relaxed fit.
            </p>

            {/* Table section */}
            <h2 className="font-serif text-xl md:text-2xl text-[#1C3829] mb-6">
              Women&apos;s Ethnic Wear
            </h2>

            {/* Size table */}
            <div className="bg-white border border-[#e8e2d6] rounded-none overflow-hidden mb-12 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1C3829]">
                      {['Size', 'Chest', 'Waist', 'Hip', 'Length'].map(h => (
                        <th 
                          key={h} 
                          className="text-white text-xs font-semibold uppercase tracking-wider px-6 py-4 text-left whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f2ec]">
                    {sizes.map((row, i) => (
                      <tr 
                        key={row.size} 
                        className={i % 2 === 1 ? 'bg-[#faf8f4]' : 'bg-white'}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-[#2d5a3d]">
                          {row.size}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1C3829]">{row.chest}</td>
                        <td className="px-6 py-4 text-sm text-[#1C3829]">{row.waist}</td>
                        <td className="px-6 py-4 text-sm text-[#1C3829]">{row.hip}</td>
                        <td className="px-6 py-4 text-sm text-[#1C3829]">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to Measure */}
            <h2 className="font-serif text-xl md:text-2xl text-[#1C3829] mb-6">
              How to Measure
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {howToMeasure.map(({ label, icon, desc }) => (
                <div 
                  key={label} 
                  className="bg-white border border-[#e8e2d6] rounded-none p-6 text-center shadow-sm hover:border-[#1C3829]/30 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{icon}</div>
                  <h3 className="text-sm md:text-base font-semibold text-[#1C3829] mb-2">
                    {label}
                  </h3>
                  <p className="text-xs md:text-sm text-[#1C3829]/70 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Tip box */}
            <div className="bg-[#fdf6e3] border border-[#f0e4b8] rounded-none p-6 text-sm text-[#a0842e] leading-relaxed flex items-start gap-3">
              <span className="text-lg leading-none">💡</span>
              <div>
                <strong>Tip:</strong> All our garments have 1–2 inch ease built in for comfortable wear.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
