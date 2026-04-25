export const metadata = {
  title: 'Size Guide | Label Wink',
  description: 'Find your perfect fit with the Label Wink size guide. Standard Indian women\'s measurements in inches and centimetres.',
}

const sizes = [
  { size: 'XS', chestIn: 32, waistIn: 26, hipIn: 35, chestCm: 81, waistCm: 66, hipCm: 89 },
  { size: 'S',  chestIn: 34, waistIn: 28, hipIn: 37, chestCm: 86, waistCm: 71, hipCm: 94 },
  { size: 'M',  chestIn: 36, waistIn: 30, hipIn: 39, chestCm: 91, waistCm: 76, hipCm: 99 },
  { size: 'L',  chestIn: 38, waistIn: 32, hipIn: 41, chestCm: 97, waistCm: 81, hipCm: 104 },
  { size: 'XL', chestIn: 40, waistIn: 34, hipIn: 43, chestCm: 102, waistCm: 86, hipCm: 109 },
  { size: 'XXL',chestIn: 42, waistIn: 36, hipIn: 45, chestCm: 107, waistCm: 91, hipCm: 114 },
]

const howToMeasure = [
  {
    label: 'Chest',
    desc: 'Measure around the fullest part of your chest, keeping the tape parallel to the ground and relaxed — not too tight.',
  },
  {
    label: 'Waist',
    desc: 'Measure around your natural waistline, which is the narrowest part of your torso, usually above your belly button.',
  },
  {
    label: 'Hip',
    desc: 'Stand with your feet together and measure around the fullest part of your hips and seat, keeping the tape level.',
  },
]

export default function SizeGuidePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-[#1b3a34] mb-8">Size Guide</h1>

      <div className="overflow-x-auto rounded-xl border border-gray-200 mb-12">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#1b3a34] text-white">
              <th className="px-5 py-3 font-semibold">Size</th>
              <th className="px-5 py-3 font-semibold">Chest (in)</th>
              <th className="px-5 py-3 font-semibold">Waist (in)</th>
              <th className="px-5 py-3 font-semibold">Hip (in)</th>
              <th className="px-5 py-3 font-semibold">Chest (cm)</th>
              <th className="px-5 py-3 font-semibold">Waist (cm)</th>
              <th className="px-5 py-3 font-semibold">Hip (cm)</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((row, i) => (
              <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-5 py-3 font-semibold text-[#1b3a34]">{row.size}</td>
                <td className="px-5 py-3">{row.chestIn}</td>
                <td className="px-5 py-3">{row.waistIn}</td>
                <td className="px-5 py-3">{row.hipIn}</td>
                <td className="px-5 py-3">{row.chestCm}</td>
                <td className="px-5 py-3">{row.waistCm}</td>
                <td className="px-5 py-3">{row.hipCm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#1b3a34] mb-6">How to Measure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howToMeasure.map(({ label, desc }) => (
            <div key={label} className="bg-[#f9f9f9] border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-[#1b3a34] mb-2">{label}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-6 italic">
          💡 Tip: If you fall between two sizes, we recommend sizing up for a comfortable fit.
        </p>
      </div>
    </div>
  )
}
