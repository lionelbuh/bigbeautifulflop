// Prototype v3: Swiss vintage editorial × American political satire. No photographs: CSS, SVG, typography.
// Run: node scripts/social/episode-prototype.mjs <out>/video.mp4
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const { render, styles } = await import(`${root}/scripts/social/videos.mjs`);
const { logoFlop } = await import(`${root}/src/site/logo.js`);
const { chromium } = createRequire(`${root}/package.json`)('playwright');
const STAMP = readFileSync(`${root}/scripts/social/assets/neutral-swiss-stamp.svg`, 'utf8').replace(/<!--[\s\S]*?-->/, '');
const RED = '#D71920';
const GRAIN = `<svg class="grain" viewBox="0 0 1080 1920"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .5 0"/></filter><rect width="1080" height="1920" filter="url(#g)"/></svg>`;
const CROSS = (s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32"><rect width="32" height="32" fill="${RED}"/><path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#F4F0E6"/></svg>`;
/* Canton of Vaud: the flag (white over green, LIBERTÉ ET PATRIE) and the crescent of Lake Geneva */
const VAUD_FLAG = `<svg viewBox="0 0 300 300"><rect width="300" height="150" fill="#fff"/><rect y="150" width="300" height="150" fill="#007A3D"/><text x="150" y="70" text-anchor="middle" font-family="F" font-weight="700" font-size="34" fill="#B8962E">LIBERTÉ</text><text x="150" y="118" text-anchor="middle" font-family="F" font-weight="700" font-size="34" fill="#B8962E">ET PATRIE</text><rect width="300" height="300" fill="none" stroke="#171614" stroke-width="4"/></svg>`;
const LEMAN = `<svg viewBox="0 0 700 240"><path d="M40 150 C120 70 300 40 470 52 C560 58 640 90 670 120 C610 100 520 92 430 104 C320 120 220 170 120 192 C80 200 50 185 40 150 Z" fill="none" stroke="#1f3a5f" stroke-width="4"/><circle cx="330" cy="66" r="9" fill="${RED}"/><text x="330" y="40" text-anchor="middle" font-family="I" font-weight="700" font-size="22" letter-spacing="3" fill="#171614">LAUSANNE</text><text x="360" y="160" text-anchor="middle" font-family="F" font-style="italic" font-size="28" fill="#1f3a5f">Lac Léman</text></svg>`;

// the post in full, word for word (never shortened): only the highlight is ours
const S = JSON.parse(readFileSync(`${root}/content/statements/decisive-advantage.json`, 'utf8'));
const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FULL = S.original.text.map((x) => `<p class="t">${esc(x).replace('350 Billion Dollar Reconciliation Bill', '<mark>350 Billion Dollar Reconciliation Bill</mark>')}</p>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 330, boxSize: 38, hookSize: 92, titleAnim: false })}
#title{display:none}
body{background:#F4F0E6}
.grain{position:absolute;inset:0;width:1080px;height:1920px;opacity:.22;pointer-events:none;z-index:9}
.mast{position:absolute;left:70px;right:70px;top:80px;text-align:center}
.mast .row{display:flex;justify-content:space-between;font-size:20px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#57524a;padding-bottom:12px;border-bottom:1px solid #171614}
.mast .nm{font-family:F;font-weight:600;font-size:66px;letter-spacing:-.03em;text-transform:uppercase;margin:14px 0 10px}
.mast .nm i{color:${RED};text-transform:none;font-weight:500}
.mast .rule{border-bottom:5px double #171614}
.sec{position:absolute;left:70px;right:70px;display:flex;align-items:center;gap:16px;font-size:24px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:${RED};padding-bottom:14px;border-bottom:2px solid #171614}
.sec small{margin-left:auto;color:#57524a;letter-spacing:.16em}
.big{position:absolute;left:70px;right:70px;font-family:F;font-weight:500;font-size:66px;line-height:1.12;letter-spacing:-.01em;color:#171614}
.big p{margin-top:26px}
.big em{font-style:italic;color:${RED}}
/* 1. the original post, as published */
.post{position:absolute;left:70px;right:70px;top:420px;background:#fffdf8;border:1px solid #171614;padding:34px 40px 30px;box-shadow:8px 8px 0 rgba(23,22,20,.08);transform-origin:50% 75%;animation:zoom 1.6s cubic-bezier(.3,0,.2,1) 1.2s forwards,shrink .7s ease-in-out 4.2s forwards,hide .4s ease-in 11.8s forwards}
.post .who{display:flex;align-items:center;gap:16px;margin-bottom:8px;padding-bottom:16px;border-bottom:1px solid #d9d1c3}
.post .av{width:62px;height:62px;border-radius:50%;background:#6b665e;color:#fff;display:grid;place-items:center;font-weight:700;font-size:24px}
.post .nm{font-weight:800;font-size:30px}.post .hd{font-size:22px;color:#7a7368}
.post .tg{margin-left:auto;font-size:18px;font-weight:800;letter-spacing:.16em;color:${RED}}
.post p.t{font-size:30px;line-height:1.4;margin-top:14px;color:#171614}
.post mark{background:linear-gradient(transparent 60%,#efd27e 60%);font-weight:800}
@keyframes zoom{to{transform:scale(1.07)}}
@keyframes shrink{from{transform:scale(1.07)}to{transform:translateY(-260px) scale(.46)}}
.rev{position:absolute;left:70px;right:70px;top:300px;text-align:center;font-family:F;font-style:italic;font-size:40px;color:#1f3a5f;animation:hide .3s ease-in 4.3s forwards}
.rev::after{content:'';display:block;width:120px;margin:16px auto 0;border-top:2px solid #171614}
/* 2. Swiss neutrality */
#n .sec{top:960px}
#n .big{top:1020px}
#n{animation:fadein .6s ease-out 4.7s both,hide .4s ease-in 12s forwards}
#n .p2{animation:fadein .5s ease-out 7.2s both}#n .p3{animation:fadein .5s ease-out 9.4s both}
.stamp{position:absolute;right:56px;top:1620px;width:560px;transform:rotate(-8deg);animation:stampin .24s cubic-bezier(.5,0,.8,.4) 5.2s both,hide .4s ease-in 12s forwards}
.stamp svg{width:100%;height:auto;display:block}
@keyframes stampin{from{opacity:0;transform:rotate(-13deg) scale(2.6)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
/* 3. Canton of Vaud */
#v{animation:fadein .6s ease-out 12.3s both,hide .4s ease-in 21s forwards}
#v .sec{top:420px}
.crest{position:absolute;left:70px;top:500px;width:250px}
.crest svg{width:100%;height:auto;display:block}
.geo{position:absolute;left:350px;right:60px;top:530px}
.geo svg{width:100%;height:auto}
.geo p{font-size:22px;letter-spacing:.18em;text-transform:uppercase;color:#57524a;margin-top:6px}
#v .big{top:820px}
#v .p2{animation:fadein .5s ease-out 14.8s both}#v .p3{animation:fadein .5s ease-out 17s both}
/* the end */
#end{background:#F4F0E6;animation:fadein .5s ease-out 21.2s both}
#end .tl{font-family:F;font-size:84px;line-height:1.08;max-width:900px}
#end .tl2{font-family:F;font-style:italic;font-size:54px;color:${RED};max-width:880px;line-height:1.2}
#end .rl{width:160px;border-top:2px solid #171614}
</style>
<div class="mast"><div class="row"><span>Independent satire</span><span>Episode</span><span>Nov 12, 2026</span></div><p class="nm">Big Beautiful <i>Flop</i></p><div class="rule"></div></div>
<div class="post"><div class="who"><span class="av">DT</span><div><p class="nm" style="margin:0">Donald J. Trump</p><p class="hd" style="margin:0">@realDonaldTrump · Truth Social · Nov 12, 2026</p></div><span class="tg">THE ORIGINAL</span></div>
${FULL}</div>
<p class="rev">Switzerland has reviewed the request.</p>
<div id="n"><p class="sec">${CROSS(34)} Swiss Neutrality <small>Satire</small></p><div class="big"><p>We appreciate the desire for a strong military.</p><p class="p2">But spending $350 billion to prove you’re strong seems… a little aggressive.</p><p class="p3"><em>We prefer to remain neutral. And reasonably well insured.</em></p></div></div>
<div class="stamp">${STAMP}</div>
<div id="v"><p class="sec">Canton of Vaud <small>Satire</small></p><div class="crest">${VAUD_FLAG}</div><div class="geo">${LEMAN}<p>Lausanne · Lavaux · Lake Geneva</p></div><div class="big"><p>350 billion?</p><p class="p2">Have we tried putting this to a referendum first?</p><p class="p3"><em>And perhaps getting three competing quotes?</em></p></div></div>
<div id="end">${CROSS(70)}<p class="tl">Switzerland: Neutral since 1815.</p><p class="tl2">Careful with the budget since forever.</p><div class="rl"></div><p class="url">bigbeautifulflop.com</p></div>
${GRAIN}`;
const work = mkdtempSync(path.join(tmpdir(), 'bbf-ep3-'));
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await render(page, work, html, process.argv[2], { duration: 25, end: 21.4, bed: true, fx: [{ file: 'bbf-stamp.wav', at: 5.46, volume: 1 }], coverAt: 6.2 });
await b.close();
rmSync(work, { recursive: true, force: true });
console.log('ok');
