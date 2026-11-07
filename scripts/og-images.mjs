/**
 * Share images (Open Graph, 1200 × 630) and app icons, rendered with Playwright from small HTML
 * templates in the site's style, then committed in public/ (the deploy does not need a browser).
 *
 *   npm run images     after adding or changing a statement
 *
 * Writes public/og/default.png, public/og/<slug>.png (one per published statement), and
 * public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png. Images of statements that no
 * longer exist are removed.
 */
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadStatements } from '../src/site/content.js';
import { escapeHtml as e, truncate } from '../src/site/html.js';

// Playwright is a development tool, installed on the editor's machine (not needed by the deploy).
const { chromium } = createRequire(import.meta.url)('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ogDir = path.join(root, 'public/og');
const font = (f) => pathToFileURL(path.join(root, 'node_modules/@fontsource-variable/fraunces/files', f)).href;
const MARK = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');

const BASE = `<style>
@font-face { font-family: F; src: url('${font('fraunces-latin-opsz-normal.woff2')}'); font-weight: 100 900; }
@font-face { font-family: F; font-style: italic; src: url('${font('fraunces-latin-opsz-italic.woff2')}'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #f6f2ea; color: #171614; font-family: system-ui, 'Segoe UI', Roboto, Arial, sans-serif; }
.frame { position: absolute; inset: 28px; border: 2px solid #171614; padding: 40px 52px; display: flex; flex-direction: column; }
.top { display: flex; align-items: center; gap: 16px; padding-bottom: 18px; border-bottom: 4px double #171614; }
.top svg { width: 52px; height: 52px; }
.brand { font-family: F; font-weight: 600; font-size: 40px; letter-spacing: -0.03em; text-transform: uppercase; font-variation-settings: 'opsz' 144; }
.brand i { color: #b3121a; font-weight: 500; text-transform: none; }
.tag { margin-left: auto; font-size: 17px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #b3121a; }
h1 { font-family: F; font-weight: 500; font-size: 72px; line-height: 1.04; letter-spacing: -0.02em; margin-top: 30px; font-variation-settings: 'opsz' 120; }
.quote { margin-top: 26px; padding: 18px 22px; background: #fff; border: 1px solid #d9d1c3; border-left: 6px solid #b3121a; border-radius: 12px; font-size: 28px; line-height: 1.38; }
.quote b { display: block; font-size: 15px; letter-spacing: .14em; text-transform: uppercase; color: #b3121a; margin-bottom: 6px; }
.foot { margin-top: auto; display: flex; justify-content: space-between; font-size: 20px; color: #57524a; }
.foot b { color: #1f3a5f; }
.motto { font-family: F; font-style: italic; font-size: 54px; line-height: 1.15; margin-top: 46px; color: #34312c; }
</style>`;

const brand = `<div class="top">${MARK}<span class="brand">Big Beautiful <i>Flop</i></span><span class="tag">Independent satire</span></div>`;

function statementCard(s) {
  return `${BASE}<div class="frame">${brand}
    <h1>${e(s.headline)}</h1>
    <p class="quote"><b>The original · ${e(s.original.channel || '')}</b>“${e(truncate(s.original.text.join(' '), 175))}”</p>
    <p class="foot"><span>The presidential version · <b>6 regional versions</b> · English adaptations</span><span>bigbeautifulflop.com</span></p>
  </div>`.replace('6 regional versions', `${Object.keys(s.editions || {}).length} regional versions`);
}

const defaultCard = `${BASE}<div class="frame">${brand}
  <p class="motto">Making presidential statements presidential again.</p>
  <p class="quote" style="margin-top:34px"><b>What Trump says · What a real president would say · How the world would say it</b>Vaudois, Valaisan, Genevois, Parisien, Marseillais… with English adaptations.</p>
  <p class="foot"><span>Lost in translation. Found in reality.</span><span>bigbeautifulflop.com</span></p>
</div>`;

const icon = (size) => `<style>*{margin:0}body{width:${size}px;height:${size}px;background:#f6f2ea;display:grid;place-items:center}svg{width:${Math.round(size * 0.78)}px;height:${Math.round(size * 0.78)}px}</style>${MARK.replace('<rect width="40" height="40" rx="6" fill="#f6f2ea"/>', '')}`;

const statements = loadStatements(path.join(root, 'content/statements'));
mkdirSync(ogDir, { recursive: true });
const work = mkdtempSync(path.join(tmpdir(), 'bbf-og-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
async function shot(html, file, size) {
  if (size) await page.setViewportSize({ width: size, height: size });
  else await page.setViewportSize({ width: 1200, height: 630 });
  // loaded from a file, so the page may use the self-hosted font files (file:// URLs)
  const tmp = path.join(work, 'card.html');
  writeFileSync(tmp, `<!doctype html><meta charset="utf-8">${html}`);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, type: 'png' });
}
await shot(defaultCard, path.join(ogDir, 'default.png'));
for (const s of statements) await shot(statementCard(s), path.join(ogDir, `${s.slug}.png`));
await shot(icon(180), path.join(root, 'public/apple-touch-icon.png'), 180);
await shot(icon(192), path.join(root, 'public/icon-192.png'), 192);
await shot(icon(512), path.join(root, 'public/icon-512.png'), 512);
await browser.close();
rmSync(work, { recursive: true, force: true });

const keep = new Set(['default.png', ...statements.map((s) => `${s.slug}.png`)]);
for (const f of readdirSync(ogDir)) if (!keep.has(f)) rmSync(path.join(ogDir, f));
console.log(`Share images: ${keep.size} in public/og/, plus app icons.`);
