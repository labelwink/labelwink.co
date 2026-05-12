export const metadata = {
  title: 'Size Guide | Label Wink',
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
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>

      {/* Hero */}
      <div style={{
        background: '#1e3d29',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '40px',
          fontWeight: 400,
          color: '#ffffff',
          letterSpacing: '0.05em',
          margin: '0 0 12px',
        }}>
          Size Guide
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#9aab9e',
          margin: 0,
        }}>
          Find your perfect fit
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '64px 16px' }}>

        {/* Intro */}
        <p style={{
          fontSize: '15px',
          color: '#5a7060',
          textAlign: 'center',
          maxWidth: '480px',
          margin: '0 auto 48px',
          lineHeight: 1.7,
        }}>
          We recommend measuring over your innerwear for the most accurate fit.
          When in doubt, size up for a relaxed fit.
        </p>

        {/* Table title */}
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '22px',
          fontWeight: 400,
          color: '#1a2e1e',
          marginBottom: '20px',
        }}>
          Women&apos;s Ethnic Wear
        </h2>

        {/* Size table */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e8e2d6',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '48px',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e3d29' }}>
                  {['Size', 'Chest', 'Waist', 'Hip', 'Length'].map(h => (
                    <th key={h} style={{
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '14px 20px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((row, i) => (
                  <tr key={row.size} style={{
                    borderBottom: '1px solid #f5f2ec',
                    background: i % 2 === 1 ? '#faf8f4' : '#ffffff',
                  }}>
                    <td style={{
                      padding: '14px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2d5a3d',
                    }}>
                      {row.size}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1a2e1e' }}>{row.chest}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1a2e1e' }}>{row.waist}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1a2e1e' }}>{row.hip}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1a2e1e' }}>{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to Measure */}
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '22px',
          fontWeight: 400,
          color: '#1a2e1e',
          marginBottom: '24px',
        }}>
          How to Measure
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {howToMeasure.map(({ label, icon, desc }) => (
            <div key={label} style={{
              background: '#ffffff',
              border: '1px solid #e8e2d6',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#1a2e1e',
                margin: '0 0 8px',
              }}>
                {label}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#5a7060',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Tip box */}
        <div style={{
          background: '#fdf6e3',
          border: '1px solid #f0e4b8',
          borderRadius: '10px',
          padding: '16px',
          fontSize: '14px',
          color: '#a0842e',
          lineHeight: 1.6,
        }}>
          💡 <strong>Tip:</strong> All our garments have 1–2 inch ease built in for comfortable wear.
        </div>
      </div>
    </div>
  )
}
