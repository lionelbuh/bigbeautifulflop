// TEST FORMAT "Meanwhile": the politician's post, then Steve, a fictional regular American, at his kitchen table.
//   node scripts/social/meanwhile.mjs <test-slug> <out.mp4>     (content/tests/<slug>.json, voices in content/voices/<slug>/)
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml as e } from '../../src/site/html.js';
import { loadStatements } from '../../src/site/content.js';
import { render, styles, STAMP_ASSET, RED, GRAIN } from './videos.mjs';
import { steve } from './assets/steve.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const r = (x) => Math.round(x * 10) / 10;
const mk = (x) => e(x).replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** The voice of an episode (content/voices/<slug>/: h0 the hook, s0.. Steve's lines), or null if missing or stale. */
export function voiceOfMeanwhile(slug, m) {
  const dir = path.join(root, 'content/voices', slug);
  const meta = path.join(dir, 'lines.json');
  if (!existsSync(meta)) return null;
  const v = JSON.parse(readFileSync(meta, 'utf8'));
  const want = [['h0', m.hook], ...m.steve.map((x, i) => [`s${i}`, x])];
  return want.every(([k, x]) => v.lines[k]?.text === x.replace(/\*/g, '') && existsSync(path.join(dir, `${k}.wav`))) ? { ...v, dir } : null;
}
/** An episode (statement with `meanwhile`): its html and render options. */
export function meanwhileVideo(s) {
  const m = s.meanwhile;
  const t = { episode: { hook: m.hook, steve: m.steve }, fact: m.fact, stamp: m.stamp || ['REALITY', 'CHECK'], tagline: m.tagline || ['Politicians say it.', 'Real people pay for it.'] };
  const voice = voiceOfMeanwhile(s.slug, m);
  const { html, T } = meanwhileHtml(t, { ...s, episode: { highlight: m.highlight } }, voice);
  const cues = voice ? [['h0', 0.3], ...m.steve.map((_, i) => [`s${i}`, T.at[i]])] : [];
  return { html, voice, opts: {
    duration: r(T.endAt + 3.8), end: r(T.endAt + 0.2), bed: true, coverAt: 1.4, ...(voice ? { bedVolume: 0.16 } : {}),
    fx: [{ file: 'bbf-stamp.wav', at: r(T.stampAt + 0.26), volume: 1 }, ...cues.map(([k, a]) => ({ file: path.join(voice.dir, `${k}.wav`), at: r(a), volume: 0.95 }))],
  } };
}

export function meanwhileHtml(t, s, voice) {
  const L = voice?.lines || {};
  const hk = Math.max(2.6, (L.h0?.duration ?? 2.4) + 0.5);
  const n0 = r(hk + 4.7);
  const holds = t.episode.steve.map((x, i) => Math.max(2.4, (L[`s${i}`]?.duration ?? (1.5 + x.length / 18)) + 0.6));
  const at = [n0 + 0.3]; holds.slice(0, -1).forEach((h, i) => at.push(r(at[i] + h)));
  const nEnd = r(at.at(-1) + holds.at(-1) + 0.6);
  const stampAt = r(at.at(-1) + (L[`s${holds.length - 1}`]?.duration ?? 2) * 0.6);
  // an official figure (optional), with its source, after Steve
  const fEnd = t.fact ? r(nEnd + 5.2) : nEnd;
  const endAt = r(fEnd + 0.2);
  const T = { hk: r(hk), n0, at, nEnd, fEnd, stampAt, endAt };
  const day = new Date(`${s.original.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const n = s.original.text.join(' ').length;
  const size = n < 350 ? 46 : n < 650 ? 38 : n < 1300 ? 30 : 24;
  const hl = s.episode?.highlight;
  const FULL = s.original.text.map((x) => `<p class="t">${hl ? e(x).replace(e(hl), `<mark>${e(hl)}</mark>`) : e(x)}</p>`).join('');
  const stamp = STAMP_ASSET.replace('>NEUTRAL<', `>${e(t.stamp[0])}<`).replace('>SWISS<', `>${e(t.stamp[1])}<`).replace('letter-spacing="16"', 'letter-spacing="10"')
    // no Swiss cross here: a red check mark in its square instead
    .replace('<path d="M87 94 h18 v20 h20 v18 h-20 v20 h-18 v-20 h-20 v-18 h20 z" fill="#F4F0E6"/>', '<path d="M74 122 l18 18 l30 -38" fill="none" stroke="#F4F0E6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>');
  const talk = (k, t0) => (L[k] ? `talk .15s ease-in-out ${r(t0)}s ${Math.max(2, Math.round(L[k].duration / 0.15))} alternate` : '');
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
.mn{width:100%;height:auto;display:block;overflow:visible}
.m{position:absolute;z-index:2}
.m .eyes{animation:blink 3.4s steps(1) infinite}
@keyframes blink{0%,94%{transform:scaleY(1)}95%,99%{transform:scaleY(.1)}}
.m .mouth{transform:scaleY(.35)}
@keyframes talk{from{transform:scaleY(.35)}to{transform:scaleY(1.25)}}
@keyframes raise{to{transform:translateY(-6px)}}
/* 1. the hook */
#h{position:absolute;inset:0;animation:hide .3s ease-in ${T.hk}s forwards}
#h .q{position:absolute;left:70px;right:70px;top:330px;font-family:F;font-weight:600;font-size:86px;line-height:1.04;letter-spacing:-.02em;text-align:center}
#h .q em{font-style:italic;color:${RED}}
#s0{left:50%;margin-left:-240px;width:480px;top:960px}
#s0 .mouth{animation:${talk('h0', 0.3) || 'none'}}
#s0 .brows{animation:raise .4s ease-out .2s both}
/* 2. the post, in full */
.post{position:absolute;left:70px;right:70px;top:330px;background:#fffdf8;border:1px solid #171614;padding:34px 40px 30px;box-shadow:8px 8px 0 rgba(23,22,20,.08);transform-origin:50% 75%;animation:fadein .4s ease-out ${T.hk}s both,zoom 1.6s cubic-bezier(.3,0,.2,1) ${r(T.hk + 1.2)}s forwards,shrink .7s ease-in-out ${r(T.hk + 4.2)}s forwards,hide .4s ease-in ${r(T.nEnd - 0.2)}s forwards}
.post .who{display:flex;align-items:center;gap:16px;margin-bottom:8px;padding-bottom:16px;border-bottom:1px solid #d9d1c3}
.post .av{width:62px;height:62px;border-radius:50%;background:#6b665e;color:#fff;display:grid;place-items:center;font-weight:700;font-size:24px}
.post .nm{font-weight:800;font-size:30px}.post .hd{font-size:22px;color:#7a7368}
.post .tg{margin-left:auto;font-size:18px;font-weight:800;letter-spacing:.16em;color:${RED}}
.post p.t{font-size:${size}px;line-height:1.4;margin-top:14px;color:#171614}
.post mark{background:linear-gradient(transparent 60%,#efd27e 60%);font-weight:800}
@keyframes zoom{to{transform:scale(1.07)}}
@keyframes shrink{from{transform:scale(1.07)}to{transform:translateY(var(--ty,-260px)) scale(.46)}}
/* 3. meanwhile, Steve */
#n{animation:fadein .5s ease-out ${T.n0}s both,hide .4s ease-in ${T.nEnd}s forwards}
.sec{position:absolute;left:70px;right:70px;top:960px;display:flex;align-items:center;gap:16px;font-size:24px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${RED};padding-bottom:14px;border-bottom:2px solid #171614}
.sec small{margin-left:auto;color:#57524a;letter-spacing:.16em}
.bub{position:absolute;left:70px;right:70px;top:1020px;font-family:F;font-weight:500;font-size:58px;line-height:1.12;color:#171614;background:#fffdf8;border:3px solid #171614;border-radius:38px;padding:2px 34px 30px;box-shadow:6px 6px 0 rgba(23,22,20,.08)}
.bub::after{content:'';position:absolute;bottom:-46px;left:120px;width:56px;height:48px;background:#fffdf8;border:3px solid #171614;border-top:0;clip-path:polygon(0 0,100% 0,0 100%);transform:skewX(-20deg)}
.bub p{margin-top:26px}.bub em{font-style:italic;color:${RED}}
${T.at.slice(1).map((a, i) => `.bub .p${i + 2}{animation:fadein .5s ease-out ${r(a - 0.3)}s both}`).join('')}
#s1{left:50px;top:1560px;width:250px}
#s1 .mouth{animation:${t.episode.steve.map((_, i) => talk(`s${i}`, T.at[i])).filter(Boolean).join(',') || 'none'}}
#s1 .arm{animation:sip 1.2s ease-in-out ${r(T.at[1] + 1)}s 2 alternate}
@keyframes sip{to{transform:rotate(-55deg)}}
.stamp{position:absolute;right:56px;top:1620px;width:560px;transform:rotate(-8deg);animation:stampin .24s cubic-bezier(.5,0,.8,.4) ${T.stampAt}s both}
.stamp svg{width:100%;height:auto;display:block}
@keyframes stampin{from{opacity:0;transform:rotate(-13deg) scale(2.6)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
/* the facts */
#f{position:absolute;inset:0;animation:fadein .5s ease-out ${T.nEnd}s both,hide .4s ease-in ${T.fEnd}s forwards}
#f .sec{top:520px}
#f .num{position:absolute;left:70px;right:70px;top:620px;font-family:F;font-weight:600;font-size:150px;line-height:1;letter-spacing:-.03em;color:${RED}}
#f .txt{position:absolute;left:70px;right:70px;top:820px;font-family:F;font-size:58px;line-height:1.15}
#f .src{position:absolute;left:70px;right:70px;top:1360px;font-size:28px;line-height:1.35;color:#57524a;border-top:1px solid #171614;padding-top:18px}
#s3{left:auto;right:60px;top:1500px;width:230px;animation:fadein .4s ease-out ${r(T.nEnd + 0.4)}s both}
/* the end */
#end{background:#F4F0E6;animation:fadein .5s ease-out ${T.endAt}s both;gap:34px}
#end .tl{font-family:F;font-size:96px;line-height:1.05;max-width:900px}
#end .tl2{font-family:F;font-style:italic;font-size:80px;color:${RED};max-width:900px;line-height:1.1}
#end .rl{width:160px;border-top:2px solid #171614}
#s2{position:relative;width:220px}
</style>
<div class="mast"><div class="row"><span>Independent satire</span><span>Meanwhile</span><span>${day}</span></div><p class="nm">Big Beautiful <i>Flop</i></p><div class="rule"></div></div>
<div id="h"><p class="q">${mk(t.episode.hook)}</p><div class="m" id="s0">${steve('mug')}</div></div>
<div class="post"><div class="who"><span class="av">DT</span><div><p class="nm" style="margin:0">Donald J. Trump</p><p class="hd" style="margin:0">@realDonaldTrump · Truth Social · ${day}</p></div><span class="tg">THE ORIGINAL</span></div>${FULL}</div>
<div id="n"><p class="sec">Meanwhile, at a real American kitchen table <small>Satire</small></p><div class="bub">${t.episode.steve.map((x, i) => `<p${i ? ` class="p${i + 1}"` : ''}>${mk(x)}</p>`).join('')}</div><div class="m" id="s1">${steve('bill')}</div><div class="stamp">${stamp}</div></div>
${t.fact ? `<div id="f"><p class="sec">The facts <small>Official figures</small></p><p class="num">${e(t.fact.number)}</p><p class="txt">${e(t.fact.text)}</p><p class="src">Source: ${e(t.fact.source)}</p><div class="m" id="s3">${steve('mug')}</div></div>` : ''}
<div id="end"><p class="tl">${e(t.tagline[0])}</p><p class="tl2">${e(t.tagline[1])}</p><div class="m" id="s2">${steve('mug')}</div><div class="rl"></div><p class="url">bigbeautifulflop.com</p></div>
${GRAIN}<script>
window.fit = () => {
  const post = document.querySelector('.post');
  const H = post.offsetHeight;
  const top = Math.max(330, Math.round((1920 - H) / 2 - 170));
  post.style.top = top + 'px';
  post.style.setProperty('--ty', Math.round(815 - top - 0.865 * H) + 'px');
  const big = document.querySelector('.bub');
  for (let size = 58; size > 44 && big.getBoundingClientRect().bottom > 1535; size -= 2) big.style.fontSize = size - 2 + 'px';
};
</script>`;
  return { html, T };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, out] = process.argv.slice(2);
  const t = JSON.parse(readFileSync(path.join(root, 'content/tests', `${slug}.json`), 'utf8'));
  const s = loadStatements(path.join(root, 'content/statements')).find((x) => x.slug === t.base);
  const vdir = path.join(root, 'content/voices', slug);
  const voice = existsSync(path.join(vdir, 'lines.json')) ? JSON.parse(readFileSync(path.join(vdir, 'lines.json'), 'utf8')) : null;
  const { html, T } = meanwhileHtml(t, s, voice);
  const cues = voice ? [['h0', 0.3], ...t.episode.steve.map((_, i) => [`s${i}`, T.at[i]])] : [];
  mkdirSync(path.dirname(out), { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), 'bbf-meanwhile-'));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await render(page, work, html, out, {
    duration: r(T.endAt + 3.8), end: r(T.endAt + 0.2), bed: true, coverAt: 1.4, ...(voice ? { bedVolume: 0.16 } : {}),
    fx: [{ file: 'bbf-stamp.wav', at: r(T.stampAt + 0.26), volume: 1 }, ...cues.map(([k, a]) => ({ file: path.join(vdir, `${k}.wav`), at: r(a), volume: 0.95 }))],
  });
  await browser.close();
  rmSync(work, { recursive: true, force: true });
  console.log(out, r(T.endAt + 3.8), voice ? 'with voice' : 'NO VOICE');
}
