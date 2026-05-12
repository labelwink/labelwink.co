// src/components/ui/LeafPattern.tsx
export function LeafPattern({
  opacity = 0.05,
  className = '',
  id = 'default',
}: {
  opacity?: number
  className?: string
  id?: string
}) {
  const pid = `lp-${id}`
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <pattern
            id={pid}
            x="0" y="0"
            width="400" height="400"
            patternUnits="userSpaceOnUse"
          >
            {/* ELEGANT LINE-ART LOTUS (Inspired by the image) */}
            <g transform="translate(50 50) scale(1.5)" stroke="#C9A84C" strokeWidth="0.8" fill="none">
              {/* Central Petal */}
              <path d="M0 0 Q10 -20 0 -40 Q-10 -20 0 0Z" />
              {/* Side Petals Left */}
              <path d="M-2 -5 Q-25 -15 -15 -35 Q-5 -25 -2 -5Z" />
              <path d="M-4 -10 Q-35 -5 -25 -25 Q-15 -15 -4 -10Z" />
              {/* Side Petals Right */}
              <path d="M2 -5 Q25 -15 15 -35 Q5 -25 2 -5Z" />
              <path d="M4 -10 Q35 -5 25 -25 Q15 -15 4 -10Z" />
              {/* Bottom Petals */}
              <path d="M0 0 Q15 15 30 5" />
              <path d="M0 0 Q-15 15 -30 5" />
            </g>

            {/* FLOATING LEAVES / VINES */}
            <g stroke="#C9A84C" strokeWidth="0.6" fill="none">
              <path d="M250 100 Q280 150 250 200" />
              <path d="M265 150 Q290 140 300 120" />
              <path d="M260 170 Q230 180 210 160" />
              
              {/* Small Leaf Outline */}
              <path d="M300 120 Q315 110 310 95 Q295 105 300 120Z" />
              <path d="M210 160 Q195 170 185 155 Q200 145 210 160Z" />
            </g>

            {/* ANOTHER LOTUS VARIATION */}
            <g transform="translate(300 300) scale(1.2) rotate(45)" stroke="#C9A84C" strokeWidth="0.8" fill="none">
              <path d="M0 0 Q15 -30 0 -50 Q-15 -30 0 0Z" />
              <path d="M-3 -8 Q-30 -20 -20 -40 Q-8 -28 -3 -8Z" />
              <path d="M3 -8 Q30 -20 20 -40 Q8 -28 3 -8Z" />
            </g>

            {/* DELICATE DOTS / SEEDS */}
            <g fill="#C9A84C">
              <circle cx="150" cy="250" r="1" opacity="0.6" />
              <circle cx="160" cy="260" r="1.5" opacity="0.4" />
              <circle cx="140" cy="270" r="1" opacity="0.6" />
              
              <circle cx="350" cy="50" r="1" opacity="0.6" />
              <circle cx="365" cy="65" r="1.5" opacity="0.4" />
            </g>

            {/* LONG SWEEPING VINE */}
            <path 
              d="M0 400 Q100 350 200 380 T400 350" 
              stroke="#C9A84C" 
              strokeWidth="0.5" 
              fill="none" 
              strokeDasharray="4 4"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
      </svg>
    </div>
  )
}
