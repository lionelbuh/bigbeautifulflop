// The banners of the social accounts, with Monsieur Neutre: YouTube (2048x1152, everything that matters in
// the central 1235x338 band), Facebook cover (1640x624), Bluesky (3000x1000).
//   node scripts/social/banners.mjs   -> brand/banner-youtube.png, banner-facebook.png, banner-bluesky.png
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { styles, STAMP_ASSET, RED, CROSS } from './videos.mjs';
import { monsieurNeutre } from './assets/monsieur-neutre.mjs';
import { logoFlop } from '../../src/site/logo.js';
import { MOTTO } from '../../src/site/layout.js';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// the composition, in a box of the given size (the visible band on YouTube), centred in the full image
function html(W, H, box) {
  const [bw, bh] = box;
  const u = bh / 338; // scale: designed for YouTube's 338 px band
  return `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 0, boxSize: 38, hookSize: 92, titleAnim: false })}
#title,#end{display:none}
html,body{width:${W}px;height:${H}px;margin:0;background:#F4F0E6;overflow:hidden}
.grain{position:absolute;inset:0;width:${W}px;height:${H}px;opacity:.2}
.bn-rule{position:absolute;left:0;right:0;border-top:${3 * u}px solid #171614}
.bn-box{position:absolute;background:none;padding:0;border:0;left:${(W - bw) / 2}px;top:${(H - bh) / 2}px;width:${bw}px;height:${bh}px;display:flex;align-items:center;gap:${30 * u}px}
.bn-logo{width:${130 * u}px;flex:none}.bn-logo svg{width:100%;height:auto;display:block}
.bn-txt{flex:1;min-width:0}
.bn-nm{font-family:F;font-weight:600;font-size:${72 * u}px;line-height:1;letter-spacing:-.03em;text-transform:uppercase;white-space:nowrap}
.bn-nm i{color:${RED};text-transform:none;font-weight:500}
.bn-mt{font-family:F;font-style:italic;font-size:${33 * u}px;color:#1f3a5f;margin-top:${12 * u}px;white-space:nowrap}
.bn-tg{display:flex;align-items:center;gap:${10 * u}px;font-size:${15 * u}px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#57524a;margin-top:${14 * u}px;white-space:nowrap}
.bn-mn{position:absolute;right:${150 * u}px;top:${30 * u}px;width:${150 * u}px}px;margin-top:${30 * u}px;margin-right:${170 * u}px}.bn-mn svg{width:100%;height:auto;display:block}
.bn-st{position:absolute;right:${-10 * u}px;bottom:${40 * u}px;width:${200 * u}px;transform:rotate(-9deg)}.bn-st svg{width:100%;height:auto;display:block}
</style>
<div class="bn-rule" style="top:${(H - bh) / 2 - 22 * u}px"></div><div class="bn-rule" style="top:${(H + bh) / 2 + 18 * u}px;border-top-width:${6 * u}px;border-top-style:double"></div>
<div class="bn-box">
  <div class="bn-logo">${logoFlop({ font: 'F' })}</div>
  <div class="bn-txt"><p class="bn-nm">Big Beautiful <i>Flop</i></p><p class="bn-mt">${MOTTO}</p><p class="bn-tg">${CROSS(22 * u)} Switzerland has reviewed the request · Independent satire</p></div>
  <div class="bn-mn">${monsieurNeutre('stamp')}</div>
  <div class="bn-st">${STAMP_ASSET}</div>
</div>
<svg class="grain" viewBox="0 0 ${W} ${H}"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .5 0"/></filter><rect width="${W}" height="${H}" filter="url(#g)"/></svg>`;
}

const SIZES = {
  youtube: [2048, 1152, [1235, 338]],
  facebook: [1640, 624, [1300, 356]],
  bluesky: [3000, 1000, [2300, 630]],
};
mkdirSync(path.join(root, 'brand'), { recursive: true });
const browser = await chromium.launch();
for (const [name, [W, H, box]] of Object.entries(SIZES)) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent(html(W, H, box));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, 'brand', `banner-${name}.png`) });
  await page.close();
  console.log(`brand/banner-${name}.png ${W}x${H}`);
}
await browser.close();
