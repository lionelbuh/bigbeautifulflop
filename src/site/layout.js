/** Page shell: <head>, masthead, footer. */
import { e } from './html.js';
import { logoFlop } from './logo.js';

export const SITE_NAME = 'Big Beautiful Flop';
export const SITE_URL = 'https://bigbeautifulflop.com';
/** Our YouTube channel (Shorts). */
export const YOUTUBE_URL = 'https://www.youtube.com/channel/UCvLa86RwzhHk8dKXHLtOraQ';
export const MOTTO = 'Making presidential statements neutral again.';
export const TAGLINE = 'Lost in translation. Found in reality.';
export const DISCLAIMER =
  'An independent satirical project. Original statements are sourced and attributed. All neutral, presidential and regional adaptations are fictional, AI-assisted editorial interpretations.';

export const CONTACT_EMAIL = 'hello@bigbeautifulflop.com';

/**
 * Search engine ownership checks (see docs/SEO.md): paste the code Google Search Console or Bing
 * Webmaster Tools gives for the "HTML tag" method. Empty: no tag.
 */
export const GOOGLE_SITE_VERIFICATION = '';
export const BING_SITE_VERIFICATION = '';

export const DEFAULT_IMAGE = { path: '/og/default.png', alt: 'Big Beautiful Flop: making presidential statements neutral again.' };

/** The address as HTML entities, so simple address-harvesting robots do not pick it up (as on Morges.info). */
export function emailLink(address = CONTACT_EMAIL) {
  const enc = [...address].map((c) => `&#${c.charCodeAt(0)};`).join('');
  return `<a href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;${enc}">${enc}</a>`;
}

export const NAV = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'originals', label: 'The Originals', path: '/originals/' },
  { id: 'switzerland', label: 'The Cantons', path: '/switzerland/' },
  { id: 'archives', label: 'Archives', path: '/archives/' },
  { id: 'about', label: 'About', path: '/about/' },
];

/** The masthead logo: the F of Flop, tipping over (see logo.js). */
export const BRAND_MARK = logoFlop({ attrs: ' class="brand-mark" aria-hidden="true" focusable="false"' });

const FLAGS = {
  ch: '<svg class="flag" viewBox="0 0 32 32" aria-hidden="true"><path fill="#d52b1e" d="M0 0h32v32H0z"/><path fill="#fff" d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z"/></svg>',
  fr: '<svg class="flag" viewBox="0 0 48 32" aria-hidden="true"><path fill="#002654" d="M0 0h16v32H0z"/><path fill="#fff" d="M16 0h16v32H16z"/><path fill="#ce1126" d="M32 0h16v32H32z"/></svg>',
  us: '<svg class="flag" viewBox="0 0 48 32" aria-hidden="true"><path fill="#fff" d="M0 0h48v32H0z"/><path stroke="#b22234" stroke-width="2.46" d="M0 1.23h48M0 6.15h48M0 11.08h48M0 16h48M0 20.92h48M0 25.85h48M0 30.77h48"/><path fill="#3c3b6e" d="M0 0h20v17.2H0z"/></svg>',
  gb: '<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><clipPath id="gb-c"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="gb-t"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#gb-c)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#gb-t)" stroke="#c8102e" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6"/></g></svg>',
  lectern: '<svg class="flag" viewBox="0 0 48 32" aria-hidden="true"><rect width="48" height="32" rx="2" fill="#1f3a5f"/><path d="M15 9h18l-2.6 7H17.6z" fill="#f6f2ea"/><path d="M22.5 16h3v9h-3z" fill="#f6f2ea"/><path d="M17 25h14v2.6H17z" fill="#f6f2ea"/><path d="M24 4.2v4.4" stroke="#e05a5f" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="4" r="1.9" fill="#e05a5f"/></svg>',
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
    <link rel="icon" href="/favicon-48.png" sizes="48x48" type="image/png" />
    <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
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
      <p class="footer-follow"><a href="${YOUTUBE_URL}" rel="noopener"><svg class="yt-icon" viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 5.5v9l8-4.5z" fill="#fff"/></svg>Watch our videos on YouTube</a></p>
    </div>
    <nav aria-label="Sections"><ul class="footer-links">${links}<li><a href="/english/">English Edition</a></li><li><a href="/press/">Press</a></li><li><a href="/privacy/">Privacy</a></li><li><a href="/feed.xml">RSS feed</a></li></ul></nav>
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
