// src/components/ui/LeafPattern.tsx
export function LeafPattern({
  opacity = 0.07,
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
            width="300" height="300"
            patternUnits="userSpaceOnUse"
          >
            {/* OLIVE BRANCH */}
            <path d="M52 115 Q57 85 62 55" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <ellipse cx="44" cy="105" rx="7" ry="13" transform="rotate(-30 44 105)" fill="#D4A830"/>
            <ellipse cx="60" cy="93"  rx="7" ry="13" transform="rotate(20 60 93)"   fill="#E8B84B"/>
            <ellipse cx="47" cy="81"  rx="6" ry="11" transform="rotate(-25 47 81)"  fill="#D4A830"/>
            <ellipse cx="61" cy="71"  rx="6" ry="11" transform="rotate(15 61 71)"   fill="#E8B84B"/>
            <ellipse cx="49" cy="61"  rx="5" ry="9"  transform="rotate(-20 49 61)"  fill="#D4A830"/>

            {/* BERRY BRANCH */}
            <path d="M110 110 Q115 80 125 50 Q135 30 130 25" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M125 50 Q140 45 148 35" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M120 75 Q135 70 143 60" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M115 90 Q128 88 134 80" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="148" cy="34" r="4" fill="#C9A84C"/>
            <circle cx="143" cy="59" r="4" fill="#E8B84B"/>
            <circle cx="134" cy="79" r="4" fill="#C9A84C"/>
            <circle cx="130" cy="24" r="3" fill="#E8B84B"/>
            <circle cx="140" cy="42" r="3" fill="#C9A84C"/>

            {/* LARGE PALM FROND */}
            <path d="M190 170 Q188 110 200 50" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M188 150 Q160 130 140 105 Q155 110 170 120 Q180 135 188 150Z" fill="#D4A830"/>
            <path d="M192 130 Q165 105 150 75  Q165 88 178 100 Q186 115 192 130Z"  fill="#E8B84B"/>
            <path d="M194 110 Q172 80 168 48   Q180 65 188 85  Q192 98 194 110Z"   fill="#D4A830"/>
            <path d="M196 90  Q182 58 184 30   Q190 48 194 68  Q195 80 196 90Z"    fill="#E8B84B"/>
            <path d="M192 150 Q218 128 232 102 Q218 108 206 118 Q198 133 192 150Z" fill="#D4A830"/>
            <path d="M194 130 Q224 104 235 72  Q222 86 210 98  Q201 114 194 130Z"  fill="#E8B84B"/>
            <path d="M196 110 Q222 80 222 48   Q212 66 204 86  Q199 98 196 110Z"   fill="#D4A830"/>
            <path d="M198 90  Q216 58 212 28   Q206 46 200 66  Q198 80 198 90Z"    fill="#E8B84B"/>

            {/* BIG SOLID OVAL LEAF */}
            <path d="M250 70 Q285 85 295 120 Q290 150 270 160 Q250 165 235 150 Q220 130 230 100 Q238 78 250 70Z" fill="#C9A84C"/>
            <path d="M250 70 Q258 118 270 160" fill="none" stroke="#1C3829" strokeWidth="0.8" strokeLinecap="round"/>

            {/* DAISY FLOWER */}
            <g transform="translate(260 20)">
              <ellipse cx="12" cy="4"  rx="4" ry="8" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
              <ellipse cx="20" cy="12" rx="8" ry="4" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
              <ellipse cx="12" cy="20" rx="4" ry="8" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
              <ellipse cx="4"  cy="12" rx="8" ry="4" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
              <ellipse cx="19" cy="5"  rx="3" ry="7" transform="rotate(45 12 12)"  fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
              <ellipse cx="19" cy="19" rx="3" ry="7" transform="rotate(-45 12 12)" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
              <circle cx="12" cy="12" r="5" fill="#D4A830"/>
            </g>

            {/* TRAILING VINE right edge */}
            <path d="M285 40 Q283 90 275 140 Q270 170 268 200" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <ellipse cx="295" cy="55"  rx="9" ry="15" transform="rotate(30 295 55)"   fill="#C9A84C"/>
            <ellipse cx="265" cy="85"  rx="8" ry="14" transform="rotate(-20 265 85)"  fill="#E8B84B"/>
            <ellipse cx="288" cy="115" rx="9" ry="15" transform="rotate(25 288 115)"  fill="#C9A84C"/>
            <ellipse cx="262" cy="148" rx="8" ry="14" transform="rotate(-18 262 148)" fill="#E8B84B"/>
            <ellipse cx="282" cy="178" rx="8" ry="13" transform="rotate(22 282 178)"  fill="#D4A830"/>

            {/* WILDFLOWER lower-left */}
            <path d="M40 260 Q38 220 35 180 Q32 150 30 130" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M30 130 Q23 122 18 118" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M30 130 Q38 122 42 118" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <ellipse cx="17" cy="117" rx="5" ry="8" transform="rotate(-25 17 117)" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
            <ellipse cx="42" cy="117" rx="5" ry="8" transform="rotate(25 42 117)"  fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
            <circle cx="30" cy="122" r="5" fill="#D4A830"/>
            <ellipse cx="23" cy="185" rx="9" ry="15" transform="rotate(-28 23 185)" fill="#D4A830"/>
            <ellipse cx="48" cy="205" rx="8" ry="14" transform="rotate(22 48 205)"  fill="#E8B84B"/>
            <ellipse cx="18" cy="225" rx="7" ry="12" transform="rotate(-20 18 225)" fill="#D4A830"/>

            {/* FERN COMPOUND BRANCH */}
            <path d="M100 290 Q105 250 115 210 Q122 180 125 170" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <ellipse cx="98"  cy="270" rx="6" ry="11" transform="rotate(-35 98  270)" fill="#D4A830"/>
            <ellipse cx="102" cy="255" rx="5" ry="10" transform="rotate(-30 102 255)" fill="#E8B84B"/>
            <ellipse cx="105" cy="240" rx="5" ry="10" transform="rotate(-28 105 240)" fill="#D4A830"/>
            <ellipse cx="108" cy="226" rx="5" ry="9"  transform="rotate(-25 108 226)" fill="#E8B84B"/>
            <ellipse cx="112" cy="213" rx="4" ry="8"  transform="rotate(-22 112 213)" fill="#D4A830"/>
            <ellipse cx="122" cy="265" rx="6" ry="11" transform="rotate(35 122 265)"  fill="#E8B84B"/>
            <ellipse cx="126" cy="250" rx="5" ry="10" transform="rotate(30 126 250)"  fill="#D4A830"/>
            <ellipse cx="129" cy="236" rx="5" ry="10" transform="rotate(28 129 236)"  fill="#E8B84B"/>
            <ellipse cx="131" cy="222" rx="5" ry="9"  transform="rotate(25 131 222)"  fill="#D4A830"/>

            {/* FAN PALM lower-center */}
            <path d="M200 290 Q198 260 195 230" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M195 230 Q150 215 130 185 Q155 205 180 218 Q188 224 195 230Z" fill="#C9A84C"/>
            <path d="M195 230 Q160 195 152 158 Q172 178 188 202 Q192 216 195 230Z" fill="#D4A830"/>
            <path d="M195 230 Q180 185 185 148 Q188 178 192 206 Q194 219 195 230Z" fill="#C9A84C"/>
            <path d="M195 230 Q202 182 215 150 Q205 180 200 206 Q197 219 195 230Z" fill="#D4A830"/>
            <path d="M195 230 Q240 210 260 182 Q238 202 216 218 Q205 224 195 230Z" fill="#C9A84C"/>
            <path d="M195 230 Q258 205 278 178 Q250 202 222 218 Q208 225 195 230Z" fill="#D4A830"/>

            {/* SECOND LARGE SOLID LEAF lower-right */}
            <path d="M255 255 Q290 270 303 305 Q300 335 280 350 Q260 360 240 347 Q220 330 227 300 Q235 273 255 255Z" fill="#D4A830"/>
            <path d="M255 255 Q263 303 280 350" fill="none" stroke="#1C3829" strokeWidth="0.8" strokeLinecap="round"/>

            {/* SCATTERED SMALL ACCENT LEAVES */}
            <ellipse cx="160" cy="155" rx="12" ry="20" transform="rotate(-15 160 155)" fill="#C9A84C"/>
            <ellipse cx="230" cy="260" rx="10" ry="17" transform="rotate(25 230 260)"  fill="#E8B84B"/>
            <ellipse cx="170" cy="280" rx="11" ry="18" transform="rotate(-10 170 280)" fill="#D4A830"/>

            {/* BERRY ACCENT DOTS */}
            <circle cx="80" cy="155" r="4" fill="#E8B84B"/>
            <circle cx="92" cy="148" r="3" fill="#C9A84C"/>
            <circle cx="74" cy="147" r="3" fill="#D4A830"/>
            <path d="M80 170 Q82 158 83 148" fill="none" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round"/>

            {/* CURVED FROND OUTLINE accent */}
            <path d="M150 220 Q160 190 165 160 Q160 150 155 145 Q155 155 158 165 Q152 158 145 155 Q150 162 156 168 Q148 175 145 190 Q148 205 150 220Z" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>

            {/* TINY FLOWER ACCENT */}
            <g transform="translate(220 175)">
              <path d="M8 0  Q10 8 8 16"  fill="none" stroke="#C9A84C" strokeWidth="1"/>
              <path d="M0 8  Q8 10 16 8"  fill="none" stroke="#C9A84C" strokeWidth="1"/>
              <path d="M2 2  Q8 8 14 14"  fill="none" stroke="#C9A84C" strokeWidth="1"/>
              <path d="M14 2 Q8 8 2 14"   fill="none" stroke="#C9A84C" strokeWidth="1"/>
              <circle cx="8" cy="8" r="4" fill="#D4A830"/>
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
      </svg>
    </div>
  )
}
