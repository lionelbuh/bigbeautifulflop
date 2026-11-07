/**
 * The logo: an italic F in a tile (the F of Flop), drawn as SVG with the site's font.
 * - logoFlop: cream tile, ink border, the F that has tipped over, a little red dust (the masthead,
 *   share images);
 * - logoTile: navy tile, cream F, double rule (browser tab, phone and app icons: easy to spot).
 */
const INK = '#171614';
const RED = '#b3121a';
const NAVY = '#1f3a5f';
const PAPER = '#f6f2ea';

export function logoFlop({ font = "'Fraunces Variable', Georgia, serif", attrs = '' } = {}) {
  return `<svg viewBox="0 0 40 40"${attrs}>
  <rect x="2.6" y="2.6" width="34.8" height="34.8" rx="8" fill="${PAPER}" stroke="${INK}" stroke-width="2.2"/>
  <text x="19.5" y="29" text-anchor="middle" font-family="${font}" font-style="italic" font-weight="600" font-size="28" fill="${INK}" transform="rotate(-22 20 22)">F</text>
  <path d="M8.5 33h23" stroke="${INK}" stroke-width="1.3"/>
  <path d="M26.6 30.2l2.6-1.8M29.8 31.2l2.8-.5" stroke="${RED}" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;
}

/** `square`: fill the whole canvas (phone home screens round the corners themselves). */
export function logoTile({ font = "'Fraunces Variable', Georgia, serif", square = false, attrs = '' } = {}) {
  const tile = square ? '<rect width="40" height="40" fill="' + NAVY + '"/>' : `<rect x="2" y="2" width="36" height="36" rx="8" fill="${NAVY}"/>`;
  return `<svg viewBox="0 0 40 40"${attrs}>
  ${tile}
  <text x="20.5" y="28.5" text-anchor="middle" font-family="${font}" font-style="italic" font-weight="600" font-size="27" fill="${PAPER}">F</text>
  <path d="M9 32h22M9 34.6h22" stroke="${PAPER}" stroke-width="1"/>
</svg>`;
}
