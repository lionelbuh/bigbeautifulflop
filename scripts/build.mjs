/**
 * Static build: content/*.json → dist/ (plain HTML, one CSS file, one small script, the fonts).
 * No framework and no bundler: every page is prerendered, so it loads fast, works without
 * JavaScript and is fully readable by search engines.
 *
 *   node scripts/build.mjs                  build for today
 *   BUILD_DATE=2026-11-06 node scripts/build.mjs   build as of a given day (tests, previews)
 */
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStatements } from '../src/site/content.js';
import { buildPages } from '../src/site/pages.js';
import { SITE_URL, SITE_NAME, MOTTO, DISCLAIMER } from '../src/site/layout.js';
import { articlePath } from '../src/site/components.js';
import { dayNumber } from '../src/site/rotation.js';
import { e } from '../src/site/html.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, process.env.OUT_DIR || 'dist');

export function build({ date = process.env.BUILD_DATE } = {}) {
  const now = date ? new Date(`${date}T12:00:00Z`) : new Date();
  const today = now.toISOString().slice(0, 10);
  const day = dayNumber(now, { utc: true });
  const statements = loadStatements(path.join(root, 'content/statements'));

  rmSync(out, { recursive: true, force: true });
  mkdirSync(path.join(out, 'assets/fonts'), { recursive: true });

  // fonts (self-hosted Fraunces, SIL Open Font License)
  const fontDir = path.join(root, 'node_modules/@fontsource-variable/fraunces/files');
  for (const f of ['fraunces-latin-opsz-normal.woff2', 'fraunces-latin-opsz-italic.woff2', 'fraunces-latin-ext-opsz-normal.woff2']) {
    cpSync(path.join(fontDir, f), path.join(out, 'assets/fonts', f));
  }
  cpSync(path.join(root, 'node_modules/@fontsource-variable/fraunces/LICENSE'), path.join(out, 'assets/fonts/LICENSE.txt'));

  // CSS and JS, named after their content so they can be cached forever
  const hashed = (name, ext, content) => {
    const file = `/assets/${name}.${createHash('sha256').update(content).digest('hex').slice(0, 10)}.${ext}`;
    writeFileSync(path.join(out, file), content);
    return file;
  };
  const css = readFileSync(path.join(root, 'src/styles/main.css'), 'utf8');
  const js = readFileSync(path.join(root, 'src/client/main.js'), 'utf8');
  const assets = {
    css: hashed('main', 'css', css),
    js: hashed('main', 'js', `{\n${js}\n}\n`),
    font: '/assets/fonts/fraunces-latin-opsz-normal.woff2',
  };

  const ogDir = path.join(root, 'public/og');
  const ogImages = new Set(existsSync(ogDir) ? readdirSync(ogDir) : []);
  const pages = buildPages({ statements, day, today, assets, ogImages });
  for (const p of pages) {
    const file = p.path.endsWith('/') ? path.join(out, p.path, 'index.html') : path.join(out, p.path);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, p.html);
  }

  if (existsSync(path.join(root, 'public'))) cpSync(path.join(root, 'public'), out, { recursive: true });
  writeFileSync(path.join(out, 'sitemap.xml'), sitemap(pages));
  writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  writeFileSync(path.join(out, 'feed.xml'), feed(statements));
  writeFileSync(path.join(out, 'llms.txt'), llms(statements));
  writeFileSync(path.join(out, '.nojekyll'), '');
  return { pages, statements, out };
}

function sitemap(pages) {
  const urls = pages
    .filter((p) => p.listed)
    .map((p) => {
      const lastmod = p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : '';
      const image = p.image && p.image.path !== '/og/default.png' ? `<image:image><image:loc>${SITE_URL}${p.image.path}</image:loc></image:image>` : '';
      return `  <url><loc>${SITE_URL}${p.path}</loc>${lastmod}${image}</url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;
}

function feed(statements) {
  const items = statements
    .map((s) => `    <item>
      <title>${e(s.headline)}</title>
      <link>${SITE_URL}${articlePath(s)}</link>
      <guid>${SITE_URL}${articlePath(s)}</guid>
      <pubDate>${new Date(`${s.published}T08:00:00Z`).toUTCString()}</pubDate>
      <description>${e(s.dek)}</description>
    </item>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}/</link>
    <description>${e(MOTTO)}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
}

function llms(statements) {
  return `# ${SITE_NAME}

> ${MOTTO}

${DISCLAIMER}

Each article quotes one public statement by Donald Trump verbatim, with its date and source, then offers satirical adaptations: a "presidential" version and regional versions (French-speaking Switzerland, France), each with an English adaptation. Only the original statement is a quotation; every adaptation is fictional and must never be attributed to Donald Trump.

## Articles

${statements.map((s) => `- [${s.headline}](${SITE_URL}${articlePath(s)}): ${s.dek}`).join('\n')}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pages, statements } = build();
  console.log(`Built ${pages.length} pages from ${statements.length} statements into ${path.relative(root, out)}/`);
}
