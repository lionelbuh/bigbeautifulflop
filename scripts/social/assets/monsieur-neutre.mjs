// Monsieur Neutre: the little Swiss civil servant of Big Beautiful Flop (ink drawing, SVG).
// He reads the file, nods, stamps NEUTRAL SWISS and tips his hat. Never a caricature of a real person.
// item: 'loupe' (reading), 'stamp' (holding the stamp), or '' (hands free)
export function monsieurNeutre(item = '') {
  const INK = '#171614', RED = '#D71920', PAPER = '#fffdf8', SUIT = '#3a3732';
  const tool = item === 'loupe'
    ? `<circle cx="172" cy="150" r="20" fill="#e8eef3" fill-opacity=".6" stroke="${INK}" stroke-width="5"/><path d="M158 164 L146 178" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`
    : item === 'stamp'
    ? `<rect x="150" y="140" width="16" height="30" rx="6" fill="#7a5a3a" stroke="${INK}" stroke-width="3"/><rect x="136" y="168" width="44" height="14" rx="3" fill="${RED}" stroke="${INK}" stroke-width="3"/>`
    : '';
  return `<svg class="mn" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="104" cy="310" rx="62" ry="7" fill="${INK}" opacity=".12"/>
  <!-- legs and shoes -->
  <path d="M88 236 L86 296 M118 236 L120 296" stroke="${SUIT}" stroke-width="18" stroke-linecap="round"/>
  <path d="M72 300 h26 M112 300 h26" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
  <!-- body: suit, shirt, red bow tie -->
  <path d="M60 136 Q104 116 148 136 L144 244 Q104 252 64 244 Z" fill="${SUIT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M90 126 L104 176 L118 126 Z" fill="${PAPER}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M104 132 l-14 -8 v16 z M104 132 l14 -8 v16 z" fill="${RED}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- left arm, with a briefcase -->
  <path d="M64 146 Q48 186 56 214" stroke="${SUIT}" stroke-width="16" stroke-linecap="round" fill="none"/>
  <rect x="34" y="210" width="44" height="32" rx="4" fill="#5b3f2a" stroke="${INK}" stroke-width="3.5"/><path d="M48 210 v-6 h16 v6" fill="none" stroke="${INK}" stroke-width="3"/>
  <!-- right arm (moves): the tool in hand -->
  <g class="arm" style="transform-origin:144px 142px"><path d="M144 142 Q166 150 168 170" stroke="${SUIT}" stroke-width="16" stroke-linecap="round" fill="none"/><circle cx="168" cy="172" r="8" fill="#f1d7bf" stroke="${INK}" stroke-width="3"/>${tool}</g>
  <!-- head (moves) -->
  <g class="head" style="transform-origin:104px 118px">
    <circle cx="104" cy="78" r="40" fill="#f1d7bf" stroke="${INK}" stroke-width="4"/>
    <path d="M70 66 Q74 40 104 38 Q134 40 138 66" fill="none" stroke="${INK}" stroke-width="3"/>
    <g class="brows"><path d="M80 62 q8 -6 16 0 M112 62 q8 -6 16 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/></g>
    <circle cx="88" cy="76" r="12" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/><circle cx="120" cy="76" r="12" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/><path d="M100 76 h8" stroke="${INK}" stroke-width="3"/>
    <g class="eyes" style="transform-origin:104px 77px"><circle cx="89" cy="77" r="4" fill="${INK}"/><circle cx="121" cy="77" r="4" fill="${INK}"/></g>
    <path d="M90 100 q14 -6 28 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M96 108 q8 4 16 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <!-- hat (lifts) -->
    <g class="hat" style="transform-origin:104px 46px"><path d="M58 50 Q104 38 150 50 L146 56 Q104 46 62 56 Z" fill="${SUIT}" stroke="${INK}" stroke-width="3.5"/><path d="M74 50 Q76 18 104 16 Q132 18 134 50 Z" fill="${SUIT}" stroke="${INK}" stroke-width="3.5"/><path d="M75 42 Q104 36 133 42" stroke="${RED}" stroke-width="5" fill="none"/></g>
  </g>
</svg>`;
}
