/**
 * Share images (Open Graph, 1200 × 630) and app icons, rendered with Playwright from small HTML
 * templates in the site's style, then committed in public/ (the deploy does not need a browser).
 *
 *   npm run images     after adding or changing a statement
 *
 * Writes public/og/default.png, public/og/<slug>.png (one per published statement), and
 * public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png and the tab icons
 * public/favicon-32.png and public/favicon-48.png; and the Instagram carousels (1080 × 1350 JPEG)
 * of the statements on the front page, in public/social/<slug>/01.jpg … (scripts/social/). Images of
 * statements that no longer exist (or have left the front page) are removed.
 */
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadStatements } from '../src/site/content.js';
import { escapeHtml as e, truncate } from '../src/site/html.js';
import { logoFlop, logoTile } from '../src/site/logo.js';
import { splitLatest } from '../src/site/content.js';
import { carouselCards } from './social/compose.mjs';

// Playwright is a development tool, installed on the editor's machine (not needed by the deploy).
const { chromium } = createRequire(import.meta.url)('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ogDir = path.join(root, 'public/og');
const font = (f) => pathToFileURL(path.join(root, 'node_modules/@fontsource-variable/fraunces/files', f)).href;
const MARK = logoFlop({ font: 'F' });

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
  </div>`.replace('6 regional versions', `${Object.keys(s.editions || {}).length} versions`);
}

const defaultCard = `${BASE}<div class="frame">${brand}
  <p class="motto">Making presidential statements presidential again.</p>
  <p class="quote" style="margin-top:34px"><b>What Trump says · What a real president would say · How the world would say it</b>Vaudois, Valaisan, Genevois, Parisien, Marseillais… with English adaptations.</p>
  <p class="foot"><span>Lost in translation. Found in reality.</span><span>bigbeautifulflop.com</span></p>
</div>`;

// app icons fill the square (phones round the corners); tab icons are a rounded tile on a transparent background
const icon = (size, { square = true } = {}) => `<style>*{margin:0}html,body{width:${size}px;height:${size}px;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${logoTile({ font: 'F', square })}`;

/* ---------- Instagram carousel (1080 × 1350) ---------- */
const SLIDE_CSS = `<style>
@font-face { font-family: F; src: url('${font('fraunces-latin-opsz-normal.woff2')}'); font-weight: 100 900; }
@font-face { font-family: F; font-style: italic; src: url('${font('fraunces-latin-opsz-italic.woff2')}'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1080px; height: 1350px; background: #f6f2ea; color: #171614; font-family: system-ui, 'Segoe UI', Roboto, Arial, sans-serif; }
.frame { position: absolute; inset: 36px; border: 2px solid #171614; padding: 40px 44px; display: flex; flex-direction: column; gap: 26px; }
.top { display: flex; align-items: center; gap: 14px; padding-bottom: 16px; border-bottom: 4px double #171614; }
.top svg { width: 48px; height: 48px; }
.brand { font-family: F; font-weight: 600; font-size: 36px; letter-spacing: -0.03em; text-transform: uppercase; font-variation-settings: 'opsz' 144; }
.brand i { color: #b3121a; font-weight: 500; text-transform: none; }
.count { margin-left: auto; font-size: 22px; font-weight: 700; color: #7a7368; }
h1 { font-family: F; font-weight: 500; font-size: 58px; line-height: 1.05; letter-spacing: -0.02em; font-variation-settings: 'opsz' 110; }
.card { background: #fff; border: 1px solid #d9d1c3; border-radius: 26px; padding: 26px 30px; }
.head { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
.av { width: 54px; height: 54px; border-radius: 50%; flex: none; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 22px; }
.name { font-weight: 700; font-size: 27px; }
.badge { margin-left: auto; padding: 4px 14px; border: 2px solid currentColor; border-radius: 999px; font-size: 17px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #7a7368; }
.card--original { border-left: 8px solid #b3121a; }
.card--original .badge { color: #b3121a; }
.card--presidential { background: #e6ebf1; border-color: #c4cfdc; }
.card--presidential .badge { color: #1f3a5f; }
.text { font-size: 30px; line-height: 1.38; }
.note { margin: -6px 0 12px; font-size: 21px; font-style: italic; color: #1f3a5f; }
.local { font-family: F; font-size: 29px; line-height: 1.36; color: #171614; margin-bottom: 14px; }
.local + .en + .text { font-size: 23px; line-height: 1.35; color: #57524a; }
.en { font-size: 15px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #1f3a5f; margin-bottom: 4px; }
.foot { margin-top: auto; display: flex; justify-content: space-between; font-size: 21px; color: #57524a; }
.n3 { gap: 20px; }
.n3 .card { padding: 20px 26px; }
.n3 .text { font-size: 28px; line-height: 1.36; }
.n3 .local { font-size: 23px; }
.n3 .head { margin-bottom: 10px; }
.end { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 30px; }
.end svg { width: 150px; height: 150px; }
.end .big { font-family: F; font-size: 60px; line-height: 1.1; }
.end .url { font-size: 38px; font-weight: 700; color: #1f3a5f; }
.end .small { font-size: 26px; color: #57524a; max-width: 760px; line-height: 1.4; }
</style>`;

function cardHtml(c) {
  const avatar = c.kind === 'original'
    ? '<span class="av" style="background:#6b665e">DT</span>'
    : c.kind === 'presidential'
      ? '<span class="av" style="background:#1f3a5f">★</span>'
      : `<span class="av" style="background:linear-gradient(135deg,${c.chip[0]} 50%,${c.chip[1]} 50%);box-shadow:inset 0 0 0 2px rgba(0,0,0,.15)"></span>`;
  const badge = c.kind === 'original' ? 'Original' : 'Satire';
  const note = c.note ? `<p class="note">${e(c.note)}</p>` : '';
  const body = c.local
    ? `<p class="local">“${e(c.local)}”</p><p class="en">In English</p><p class="text">${e(c.text)}</p>`
    : `<p class="text">${c.kind === 'original' ? `“${e(c.text)}”` : e(c.text)}</p>`;
  return `<div class="card card--${c.kind}"><div class="head">${avatar}<span class="name">${e(c.label)}</span><span class="badge">${badge}</span></div>${note}${body}</div>`;
}

function slideHtml(s, cards, i, total) {
  const head = `<div class="top">${MARK}<span class="brand">Big Beautiful <i>Flop</i></span><span class="count">${i + 1} / ${total}</span></div>`;
  return `${SLIDE_CSS}<div class="frame${cards.length > 2 ? ' n3' : ''}">${head}${i === 0 ? `<h1>${e(s.headline)}</h1>` : ''}${cards.map(cardHtml).join('')}
    <p class="foot"><span>Independent satire · only the original is a quotation</span><span>bigbeautifulflop.com</span></p></div>`;
}

function endSlideHtml(s, total) {
  const n = Object.keys(s.editions || {}).length + 1;
  return `${SLIDE_CSS}<div class="frame"><div class="top">${MARK}<span class="brand">Big Beautiful <i>Flop</i></span><span class="count">${total} / ${total}</span></div>
    <div class="end">${logoFlop({ font: 'F' })}<p class="big">All ${n} versions,<br>from Morges to Texas</p><p class="url">bigbeautifulflop.com</p>
    <p class="small">Link in bio. Original statements are quoted verbatim; every other version is fictional satire.</p></div></div>`;
}

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
  await page.screenshot({ path: file, type: 'png', omitBackground: true });
}
await shot(defaultCard, path.join(ogDir, 'default.png'));
for (const s of statements) await shot(statementCard(s), path.join(ogDir, `${s.slug}.png`));
await shot(icon(180), path.join(root, 'public/apple-touch-icon.png'), 180);
await shot(icon(192), path.join(root, 'public/icon-192.png'), 192);
await shot(icon(512), path.join(root, 'public/icon-512.png'), 512);
await shot(icon(48, { square: false }), path.join(root, 'public/favicon-48.png'), 48);
await shot(icon(32, { square: false }), path.join(root, 'public/favicon-32.png'), 32);

// Instagram carousels of the front-page statements (JPEG, as Instagram requires)
const socialDir = path.join(root, 'public/social');
const clearImages = (dir) => { for (const f of readdirSync(dir)) if (f.endsWith('.jpg')) rmSync(path.join(dir, f)); };
// the front-page statements, plus older ones listed in content/social/config.json ("extraCarousels")
const extra = JSON.parse(readFileSync(path.join(root, 'content/social/config.json'), 'utf8')).extraCarousels || [];
const recent = [...splitLatest(statements).recent, ...statements.filter((s) => extra.includes(s.slug))]
  .filter((s, i, all) => all.indexOf(s) === i);
await page.setViewportSize({ width: 1080, height: 1350 });
for (const s of recent) {
  const dir = path.join(socialDir, s.slug);
  mkdirSync(dir, { recursive: true });
  clearImages(dir);
  const slides = carouselCards(s);
  const total = slides.length + 1;
  const pages = [...slides.map((cards, i) => slideHtml(s, cards, i, total)), endSlideHtml(s, total)];
  for (const [i, html] of pages.entries()) {
    const tmp = path.join(work, 'slide.html');
    writeFileSync(tmp, `<!doctype html><meta charset="utf-8">${html}`);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  }
}
mkdirSync(socialDir, { recursive: true });
// other statements lose their carousel images, never their videos (scripts/social/videos.mjs)
for (const d of readdirSync(socialDir)) {
  if (recent.some((s) => s.slug === d)) continue;
  clearImages(path.join(socialDir, d));
  if (!readdirSync(path.join(socialDir, d)).length) rmSync(path.join(socialDir, d), { recursive: true, force: true });
}
await browser.close();
rmSync(work, { recursive: true, force: true });

const keep = new Set(['default.png', ...statements.map((s) => `${s.slug}.png`)]);
for (const f of readdirSync(ogDir)) if (!keep.has(f)) rmSync(path.join(ogDir, f));
console.log(`Share images: ${keep.size} in public/og/, plus app icons.`);
