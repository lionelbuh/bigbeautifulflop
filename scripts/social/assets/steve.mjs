// Steve: a fictional regular American (ink drawing, SVG) for the "Meanwhile" format. Cap, hoodie, a mug.
// Never a real person. Same parts as Monsieur Neutre (head, mouth, brows, eyes, arm) so the same animations work.
export function steve(item = 'mug') {
  const INK = '#171614', CAP = '#1f3a5f', HOOD = '#7a8a94', SKIN = '#f1d7bf';
  const tool = item === 'bill'
    ? `<g transform="rotate(-8 170 150)"><rect x="150" y="118" width="46" height="60" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><path d="M158 132h30M158 142h30M158 152h20" stroke="${INK}" stroke-width="2.5"/><text x="173" y="171" text-anchor="middle" font-family="Inter, Arial" font-weight="900" font-size="13" fill="#D71920">$$$</text></g>`
    : `<path d="M154 150 h28 v30 q0 8 -8 8 h-12 q-8 0 -8 -8 z" fill="#fffdf8" stroke="${INK}" stroke-width="3.5"/><path d="M182 158 q12 0 12 9 q0 9 -12 9" fill="none" stroke="${INK}" stroke-width="3.5"/>`;
  return `<svg class="mn" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="104" cy="310" rx="62" ry="7" fill="${INK}" opacity=".12"/>
  <path d="M88 236 L86 296 M118 236 L120 296" stroke="#3b4a66" stroke-width="20" stroke-linecap="round"/>
  <path d="M70 301 h30 M110 301 h30" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
  <path d="M56 140 Q104 118 152 140 L150 246 Q104 254 58 246 Z" fill="${HOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M84 128 Q104 146 124 128" fill="none" stroke="${INK}" stroke-width="3"/><path d="M96 140 v22 M112 140 v22" stroke="${INK}" stroke-width="2.5"/>
  <rect x="78" y="196" width="52" height="26" rx="6" fill="none" stroke="${INK}" stroke-width="3"/>
  <path d="M60 150 Q44 190 54 220" stroke="${HOOD}" stroke-width="17" stroke-linecap="round" fill="none"/><circle cx="55" cy="224" r="8" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <g class="arm" style="transform-origin:148px 146px"><path d="M148 146 Q168 156 168 176" stroke="${HOOD}" stroke-width="17" stroke-linecap="round" fill="none"/><circle cx="168" cy="178" r="8" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>${tool}</g>
  <g class="head" style="transform-origin:104px 118px">
    <circle cx="104" cy="80" r="40" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
    <path d="M70 92 Q72 116 104 120 Q136 116 138 92" fill="#8a6a50" opacity=".35"/>
    <g class="brows"><path d="M82 66 q8 -4 16 1 M110 67 q8 -5 16 -1" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>
    <g class="eyes" style="transform-origin:104px 78px"><circle cx="90" cy="78" r="4.5" fill="${INK}"/><circle cx="118" cy="78" r="4.5" fill="${INK}"/></g>
    <path d="M86 86 q4 3 8 0 M114 86 q4 3 8 0" fill="none" stroke="${INK}" stroke-width="2" opacity=".6"/>
    <g class="mouth" style="transform-origin:104px 102px"><path d="M94 101 q10 7 20 0 q-10 3 -20 0 z" fill="#7a2a22" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>
    <g class="hat" style="transform-origin:104px 50px"><path d="M64 60 Q66 30 104 28 Q142 30 144 60 Z" fill="${CAP}" stroke="${INK}" stroke-width="3.5"/><path d="M60 58 Q104 50 150 58 Q170 62 176 70 Q140 64 60 64 Z" fill="${CAP}" stroke="${INK}" stroke-width="3.5"/><circle cx="104" cy="30" r="4" fill="${INK}"/></g>
  </g>
</svg>`;
}
