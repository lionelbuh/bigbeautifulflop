/**
 * The visual identity of each canton, shared by the site and the videos: its flag (heraldry, simplified)
 * and an abstract geographical reference, drawn in SVG. No photographs, no cartoon scenery.
 */
const RED = '#D71920';
const frame = '<rect width="300" height="300" fill="none" stroke="#171614" stroke-width="4"/>';
const star = (x, y, r = 11) => {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${p}"/>`;
};

export const CANTONS = {
  vaudois: {
    name: 'Canton of Vaud',
    places: 'Lausanne · Lavaux · Lake Geneva',
    flag: `<svg viewBox="0 0 300 300"><rect width="300" height="150" fill="#fff"/><rect y="150" width="300" height="150" fill="#007A3D"/><text x="150" y="70" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="34" fill="#B8962E">LIBERTÉ</text><text x="150" y="118" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="34" fill="#B8962E">ET PATRIE</text>${frame}</svg>`,
    geo: `<svg viewBox="0 0 700 240"><path d="M40 150 C120 70 300 40 470 52 C560 58 640 90 670 120 C610 100 520 92 430 104 C320 120 220 170 120 192 C80 200 50 185 40 150 Z" fill="none" stroke="#1f3a5f" stroke-width="4"/><circle cx="330" cy="66" r="9" fill="${RED}"/><text x="330" y="40" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="22" letter-spacing="3" fill="#171614">LAUSANNE</text><text x="360" y="160" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="28" fill="#1f3a5f">Lac Léman</text></svg>`,
  },
  valaisan: {
    name: 'Canton of Valais',
    places: 'Sion · the Matterhorn · the Rhône valley',
    flag: `<svg viewBox="0 0 300 300"><rect width="150" height="300" fill="#fff"/><rect x="150" width="150" height="300" fill="${RED}"/><g fill="${RED}">${[[60,40],[100,40],[60,90],[100,90],[60,140],[100,140],[60,190],[100,190]].map(([x,y]) => star(x, y)).join('')}${star(80, 240)}</g><g fill="#fff">${[[200,40],[240,40],[200,115],[240,115]].map(([x,y]) => star(x, y)).join('')}</g>${frame}</svg>`,
    geo: `<svg viewBox="0 0 700 240"><path d="M20 210 L150 120 L210 160 L330 40 L410 140 L470 100 L560 170 L680 210" fill="none" stroke="#1f3a5f" stroke-width="4" stroke-linejoin="round"/><path d="M300 70 L330 40 L355 72" fill="none" stroke="#1f3a5f" stroke-width="4"/><circle cx="330" cy="40" r="8" fill="${RED}"/><text x="330" y="230" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="28" fill="#1f3a5f">the Alps of Valais</text></svg>`,
  },
  genevois: {
    name: 'Canton of Geneva',
    places: 'Geneva · the lake · the Jet d’eau',
    flag: `<svg viewBox="0 0 300 300"><rect width="150" height="300" fill="#F2C230"/><rect x="150" width="150" height="300" fill="${RED}"/><path d="M150 60 C110 60 90 90 95 120 L60 110 L80 140 L45 150 L85 165 L70 200 L110 180 L120 230 L150 210 Z" fill="#171614"/><g fill="#F2C230"><circle cx="225" cy="95" r="34"/><circle cx="225" cy="95" r="16" fill="${RED}"/><rect x="215" y="125" width="20" height="120"/><rect x="235" y="200" width="30" height="16"/><rect x="235" y="226" width="22" height="14"/></g>${frame}</svg>`,
    geo: `<svg viewBox="0 0 700 240"><path d="M60 200 C200 150 330 120 470 110 C560 104 630 112 680 120" fill="none" stroke="#1f3a5f" stroke-width="4"/><path d="M350 200 L350 40" stroke="#1f3a5f" stroke-width="5" stroke-dasharray="2 6" stroke-linecap="round"/><circle cx="350" cy="36" r="8" fill="${RED}"/><text x="470" y="80" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="28" fill="#1f3a5f">the Jet d’eau</text></svg>`,
  },
  fribourgeois: {
    name: 'Canton of Fribourg',
    places: 'Fribourg · the Sarine · the Gruyère',
    flag: `<svg viewBox="0 0 300 300"><rect width="300" height="150" fill="#171614"/><rect y="150" width="300" height="150" fill="#fff"/>${frame}</svg>`,
    geo: `<svg viewBox="0 0 700 240"><path d="M40 60 C140 60 160 180 260 180 C360 180 360 70 460 70 C560 70 580 170 680 170" fill="none" stroke="#1f3a5f" stroke-width="4"/><text x="350" y="225" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="28" fill="#1f3a5f">the Sarine: bonjour on one side, grüessech on the other</text></svg>`,
  },
  neuchatelois: {
    name: 'Canton of Neuchâtel',
    places: 'Neuchâtel · La Chaux-de-Fonds · the Jura',
    flag: `<svg viewBox="0 0 300 300"><rect width="100" height="300" fill="#007A3D"/><rect x="100" width="100" height="300" fill="#fff"/><rect x="200" width="100" height="300" fill="${RED}"/><path d="M240 30 h20 v22 h22 v20 h-22 v22 h-20 v-22 h-22 v-20 h22 z" fill="#fff"/>${frame}</svg>`,
    geo: `<svg viewBox="0 0 700 240"><circle cx="350" cy="120" r="96" fill="none" stroke="#1f3a5f" stroke-width="4"/><path d="M350 120 L350 50 M350 120 L410 150" stroke="#1f3a5f" stroke-width="5" stroke-linecap="round"/><circle cx="350" cy="120" r="7" fill="${RED}"/><text x="350" y="236" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="26" fill="#1f3a5f">watchmaking, the Jura</text></svg>`,
  },
};
