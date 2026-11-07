/** Page shell: <head>, masthead, footer. */
import { e } from './html.js';

export const SITE_NAME = 'Big Beautiful Flop';
export const SITE_URL = 'https://bigbeautifulflop.com';
export const MOTTO = 'Making presidential statements presidential again.';
export const TAGLINE = 'Lost in translation. Found in reality.';
export const DISCLAIMER =
  'An independent satirical project. Original statements are sourced and attributed. All presidential and regional adaptations are fictional, AI-assisted editorial interpretations.';

export const CONTACT_EMAIL = 'hello@bigbeautifulflop.com';

/**
 * Search engine ownership checks (see docs/SEO.md): paste the code Google Search Console or Bing
 * Webmaster Tools gives for the "HTML tag" method. Empty: no tag.
 */
export const GOOGLE_SITE_VERIFICATION = '';
export const BING_SITE_VERIFICATION = '';

export const DEFAULT_IMAGE = { path: '/og/default.png', alt: 'Big Beautiful Flop: making presidential statements presidential again.' };

/** The address as HTML entities, so simple address-harvesting robots do not pick it up (as on Morges.info). */
export function emailLink(address = CONTACT_EMAIL) {
  const enc = [...address].map((c) => `&#${c.charCodeAt(0)};`).join('');
  return `<a href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;${enc}">${enc}</a>`;
}

export const NAV = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'originals', label: 'The Originals', path: '/originals/' },
  { id: 'presidential', label: 'The Presidential Edition', path: '/presidential/' },
  { id: 'switzerland', label: 'Switzerland', path: '/switzerland/' },
  { id: 'france', label: 'France', path: '/france/' },
  { id: 'english', label: 'English Edition', path: '/english/' },
  { id: 'archives', label: 'Archives', path: '/archives/' },
  { id: 'about', label: 'About', path: '/about/' },
];

/** A speech bubble with a red squiggle: something said, then translated. */
export const BRAND_MARK = `<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
  <path d="M6 6h28a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H17l-8 7v-7H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M10 18.5c2.5-4 5-4 7.5 0s5 4 7.5 0 4.2-3.4 5.5-1" fill="none" stroke="#b3121a" stroke-width="2.6" stroke-linecap="round"/>
</svg>`;

const FLAGS = {
  ch: '<svg class="flag" viewBox="0 0 32 32" aria-hidden="true"><path fill="#d52b1e" d="M0 0h32v32H0z"/><path fill="#fff" d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z"/></svg>',
  fr: '<svg class="flag" viewBox="0 0 48 32" aria-hidden="true"><path fill="#002654" d="M0 0h16v32H0z"/><path fill="#fff" d="M16 0h16v32H16z"/><path fill="#ce1126" d="M32 0h16v32H32z"/></svg>',
  us: '<svg class="flag" viewBox="0 0 48 32" aria-hidden="true"><path fill="#fff" d="M0 0h48v32H0z"/><path stroke="#b22234" stroke-width="2.46" d="M0 1.23h48M0 6.15h48M0 11.08h48M0 16h48M0 20.92h48M0 25.85h48M0 30.77h48"/><path fill="#3c3b6e" d="M0 0h20v17.2H0z"/></svg>',
  world: '<svg class="flag flag--round" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 16h28M16 2c-5 4-5 24 0 28M16 2c5 4 5 24 0 28M5 8.5h22M5 23.5h22" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
};

export function flag(code) {
  return FLAGS[code] || '';
}

/** Two-colour swatch for a region (its colours, not its flag). */
export function chip(region) {
  const [a, b] = region.chip;
  return `<span class="chip" aria-hidden="true" style="--chip-a:${a};--chip-b:${b}"></span>`;
}

export function renderHead({
  title, docTitle, description, path, lang = 'en', type = 'website', alternates = [], jsonLd = null, assets,
  image = DEFAULT_IMAGE, published = null, noindex = false,
}) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === '/' ? `${SITE_NAME}: ${MOTTO}` : `${docTitle || title} · ${SITE_NAME}`;
  const ogLocale = { en: 'en_US', 'fr-CH': 'fr_CH', 'fr-FR': 'fr_FR' }[lang] || 'en_US';
  const alt = alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${SITE_URL}${a.path}" />`).join('\n    ');
  const img = `${SITE_URL}${image.path}`;
  const verify = [
    GOOGLE_SITE_VERIFICATION && `<meta name="google-site-verification" content="${e(GOOGLE_SITE_VERIFICATION)}" />`,
    BING_SITE_VERIFICATION && `<meta name="msvalidate.01" content="${e(BING_SITE_VERIFICATION)}" />`,
  ].filter(Boolean).join('\n    ');
  return `<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${e(fullTitle)}</title>
    <meta name="description" content="${e(description)}" />
    ${noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`}
    ${alt}${verify ? `\n    ${verify}` : ''}
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${e(title)}" />
    <meta property="og:description" content="${e(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${e(image.alt)}" />${published ? `\n    <meta property="article:published_time" content="${published}" />\n    <meta property="article:section" content="Satire" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(title)}" />
    <meta name="twitter:description" content="${e(description)}" />
    <meta name="twitter:image" content="${img}" />
    <meta name="theme-color" content="#f6f2ea" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="/feed.xml" />
    <link rel="preload" href="${assets.font}" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="${assets.css}" />
    <script type="module" src="${assets.js}"></script>${jsonLd ? `\n    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}`;
}

export function renderHeader(pageId, { dateLabel, editionsLabel }) {
  const nav = NAV.map((n) => `<li><a href="${n.path}"${n.id === pageId ? ' aria-current="page"' : ''}>${e(n.label)}</a></li>`).join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="masthead">
  <p class="masthead-dateline">
    <span>Independent satire</span>
    <span class="masthead-date" data-today>${e(dateLabel)}</span>
    <span class="masthead-editions">${e(editionsLabel)}</span>
  </p>
  <a class="brand" href="/" aria-label="${SITE_NAME}, home">
    ${BRAND_MARK}
    <span class="brand-name">Big Beautiful <span class="brand-accent">Flop</span></span>
    <span class="brand-motto">${e(MOTTO)}</span>
  </a>
  <nav class="site-nav" aria-label="Main">
    <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav-list"><span class="nav-toggle-bars" aria-hidden="true"></span>Sections</button>
    <ul class="site-nav-list" id="site-nav-list">${nav}</ul>
  </nav>
</header>`;
}

export function renderFooter() {
  const links = NAV.filter((n) => n.id !== 'home')
    .map((n) => `<li><a href="${n.path}">${e(n.label)}</a></li>`)
    .join('');
  return `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <p class="footer-name">Big Beautiful <span class="brand-accent">Flop</span></p>
      <p class="footer-tagline">${e(TAGLINE)}</p>
      <p class="footer-disclaimer">${e(DISCLAIMER)}</p>
      <p class="footer-contact">Contact: ${emailLink()}</p>
    </div>
    <nav aria-label="Sections"><ul class="footer-links">${links}<li><a href="/feed.xml">RSS feed</a></li></ul></nav>
  </div>
</footer>`;
}

export function renderPage({ pageId, head, header, main, lang = 'en', bodyClass = '' }) {
  return `<!doctype html>
<html lang="${lang}">
  <head>
    ${renderHead({ ...head, lang })}
  </head>
  <body class="${bodyClass}">
    ${renderHeader(pageId, header)}
    <main id="main" class="page-main" tabindex="-1">
${main}
    </main>
    ${renderFooter()}
  </body>
</html>
`;
}
