/**
 * Social videos (vertical 1080 × 1920, 31 s, H.264 + AAC), two per statement, from two series that take
 * turns (see videoSeriesFor in compose.mjs). A title card first (“Les Vaudoiseries de Trump”, so the
 * second video does not look like a repeat), then the series’ version and its English (or “What he
 * really means”), then Trump’s original, always on the same screen as the presidential version, then
 * the end card. The sound logo (scripts/social/jingle.py) opens with a fanfare and ends with the same
 * fanfare that flops.
 *
 *   npm run videos     after npm run images: the videos of statements waiting to be posted (others are deleted);
 *                      --slug <slug> renders one statement's videos
 *   npm run videos -- --weekly [YYYY-MM-DD]   the Sunday video of the week (run by .github/workflows/weekly.yml)
 *
 * Writes public/social/<slug>/video-1.mp4, video-2.mp4 and videos.json; a video is rebuilt only when
 * its statement or this script changes. Needs the pre-installed Playwright and ffmpeg.
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { cpus, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadStatements } from '../../src/site/content.js';
import { logoFlop } from '../../src/site/logo.js';
import { escapeHtml as e } from '../../src/site/html.js';
import { excerpt, englishOf, regionLabel, seriesVersion, videoSeriesFor, videosPending, videoTitle, regionTitle, weeklyPicks, SOCIAL_NETWORKS, VIDEO_SERIES } from './compose.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FPS = 30;
const DURATION = 31;
const END = 27; // the end card and the ending fanfare
const SELF = readFileSync(fileURLToPath(import.meta.url), 'utf8');
const font = (f) => pathToFileURL(path.join(root, 'node_modules/@fontsource-variable/fraunces/files', f)).href;
/** French spacing: « and » ; : ? ! never start or end a line alone. */
const nb = (x) => x.replace(/« /g, '«\u00a0').replace(/ ([»:;?!])/g, '\u00a0$1');
const inter = (f) => pathToFileURL(path.join(root, 'node_modules/@fontsource-variable/inter/files', f)).href;

/** What every video shares: fonts, cards, the title card, the end card and the animations. */
function styles(o) {
  return `@font-face{font-family:F;src:url('${font('fraunces-latin-opsz-normal.woff2')}');font-weight:100 900}
@font-face{font-family:I;src:url('${inter('inter-latin-wght-normal.woff2')}');font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;overflow:hidden;background:#f6f2ea;color:#171614;font-family:I,system-ui,'Segoe UI',Roboto,Arial,sans-serif;position:relative}
.top{position:absolute;left:70px;right:70px;top:90px;display:flex;align-items:center;gap:18px;padding-bottom:22px;border-bottom:5px double #171614}
.top svg{width:70px;height:70px}
.brand{font-family:F;font-weight:600;font-size:46px;letter-spacing:-.03em;text-transform:uppercase}
.brand i{color:#b3121a;font-weight:500;text-transform:none}
.kicker{position:absolute;left:70px;top:260px;font-size:30px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1f3a5f}
h1{position:absolute;left:70px;right:70px;top:310px;font-family:F;font-weight:500;font-size:84px;line-height:1.02;letter-spacing:-.02em}
.stage{position:absolute;left:60px;right:60px;top:${o.stageTop}px;display:grid}
.scene{grid-area:1/1;display:flex;flex-direction:column;gap:30px;align-self:start}
.card{background:#fff;border:2px solid #d9d1c3;border-radius:36px;padding:34px 40px}
.head{display:flex;align-items:center;gap:20px;margin-bottom:18px}
.av{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:28px;flex:none}
.name{font-weight:700;font-size:33px}
.badge{margin-left:auto;padding:5px 16px;border:3px solid currentColor;border-radius:999px;font-size:20px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7a7368}
.text{font-size:37px;line-height:1.34}
.trump{border-left:12px solid #b3121a}.trump .badge{color:#b3121a}
.pres{background:#e6ebf1;border-color:#c4cfdc}.pres .badge{color:#1f3a5f}
.note{font-size:24px;font-style:italic;color:#1f3a5f;margin:-8px 0 12px}
.fr .text{font-family:F;font-size:41px;line-height:1.3}
.box{background:#1f3a5f;color:#fff;border-radius:36px;padding:36px 40px}
.box .lab{font-size:26px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#f2cf78;margin-bottom:12px}
.box .text{font-family:F;font-size:${o.boxSize}px;line-height:1.24}
.foot{position:absolute;left:70px;right:70px;bottom:250px;display:flex;justify-content:space-between;font-size:28px;color:#57524a}
#title{position:absolute;inset:0;z-index:2;background:#1f3a5f;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;text-align:center;padding:0 80px}
#title svg{width:170px;height:170px}
#title .k{font-size:32px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#f2cf78}
#title .t{font-family:F;font-weight:500;font-size:112px;line-height:1.02;letter-spacing:-.02em}
#title .s{font-size:40px;line-height:1.35;color:#d7dfe9}
#title .h{font-family:F;font-weight:500;font-size:${o.hookSize}px;line-height:1.06;letter-spacing:-.02em}
#title em{font-style:normal;color:#f2cf78}
#title .s em{color:#fff}
${o.titleAnim ? '#title .t{animation:up .7s ease-out .2s both}#title .s{animation:fadein .6s ease-out .9s both}' : ''}
#title{animation:hide .4s ease-in 2.9s forwards}
#end{position:absolute;inset:0;background:#f6f2ea;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;text-align:center}
#end svg{width:220px;height:220px}
#end .big{font-family:F;font-size:88px;line-height:1.08}
#end .url{font-size:56px;font-weight:700;color:#1f3a5f}
#end .small{font-size:34px;color:#57524a;max-width:820px;line-height:1.4}
@keyframes up{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
@keyframes out{to{opacity:0;transform:translateY(-60px)}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes hide{to{opacity:0}}
`;
}

function html(s, series) {
  const { region, edition } = seriesVersion(s, series);
  const english = !region.lang.startsWith('fr');
  const chip = `linear-gradient(135deg,${region.chip[0]} 50%,${region.chip[1]} 50%)`;
  const text = english ? excerpt(edition.text, series.id === 'diplomat' ? 460 : 380) : nb(`“${excerpt(edition.text, 400)}”`);
  const title = videoTitle(s, series);
  // the hook: the version’s punchline, readable from the very first frame (*words* in gold)
  const mark = (x) => e(x).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const hook = edition.hook
    ? `<p class="k">${e(title.title)} · satire</p><p class="h">${mark(edition.hook)}</p>${edition.hookEn ? `<p class="s">${mark(edition.hookEn)}</p>` : ''}`
    : `<p class="k">${e(series.kicker)}</p><p class="t">${e(title.title)}</p><p class="s">${e(title.sub)}</p>`;
  const box = series.id === 'diplomat' ? excerpt(edition.en, 220) : excerpt(series.id === 'swiss' || series.id === 'france' ? englishOf(region, edition) : edition.en, 260);
  return `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: s.headline.length > 30 ? 560 : 470, boxSize: series.id === 'diplomat' ? 46 : 38, hookSize: (edition.hook || '').length > 60 ? 92 : 108, titleAnim: !edition.hook })}.kicker,h1{animation:up .7s ease-out 3.1s both}h1{animation-delay:3.3s}
#s2 .card{animation:up .8s ease-out 3.8s both}
#s2 .box{animation:up .8s ease-out 9.8s both}
#s2{animation:out .6s ease-in 16s forwards}
#s1 .trump{animation:up .8s ease-out 16.6s both}
#s1 .pres{animation:up .8s ease-out 18.6s both}
.foot{animation:hide .4s ease-in 9.5s forwards,fadein .5s ease-out 16.6s forwards}
#end{animation:fadein .6s ease-out ${END}s both}
</style>
<div id="title">${logoFlop({ font: 'F' })}${hook}</div>
<div class="top">${logoFlop({ font: 'F' })}<span class="brand">Big Beautiful <i>Flop</i></span></div>
<p class="kicker">${e(series.kicker)}</p>
<h1>${e(s.headline)}</h1>
<div class="stage">
 <div class="scene" id="s1">
  <div class="card trump"><div class="head"><span class="av" style="background:#6b665e">DT</span><span class="name">Donald J. Trump · Truth Social</span><span class="badge">Original</span></div>
   <p class="text">“${e(excerpt(s.original.text, 230))}”</p></div>
  <div class="card pres"><div class="head"><span class="av" style="background:#1f3a5f">★</span><span class="name">The American President</span><span class="badge">Satire</span></div>
   <p class="note">The presidential version: how a statesmanlike president would say it</p>
   <p class="text">${e(excerpt(s.presidential.en, 250))}</p></div>
 </div>
 <div class="scene" id="s2">
  <div class="card${english ? '' : ' fr'}"><div class="head"><span class="av" style="background:${chip};box-shadow:inset 0 0 0 2px rgba(0,0,0,.15)"></span><span class="name">${e(regionLabel(region))}</span><span class="badge">Satire</span></div>
   <p class="text">${e(text)}</p></div>
  <div class="box"><p class="lab">${e(series.box)}</p><p class="text">${e(box)}</p></div>
 </div>
</div>
<p class="foot"><span>Independent satire · only the original is a quotation</span><span>bigbeautifulflop.com</span></p>
<div id="end">${logoFlop({ font: 'F' })}<p class="big">Trump’s posts,<br>made presidential.</p><p class="url">bigbeautifulflop.com</p><p class="small">Swiss, French, American and British versions, and three diplomats. Independent satire.</p></div>`;
}

/**
 * Frame by frame: every animation is paused and set to the frame's time. Several tabs share the work
 * (one per processor, up to four): GitHub's machines are much slower than a laptop.
 */
async function render(page, work, markup, file, { duration = DURATION, end = END, bed = false } = {}) {
  const frames = path.join(work, 'frames');
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  writeFileSync(path.join(work, 'video.html'), markup);
  const total = FPS * duration;
  const tabs = Math.max(1, Math.min(4, cpus().length));
  const pages = [page, ...(await Promise.all(Array.from({ length: tabs - 1 }, () => page.context().browser().newPage())))];
  await Promise.all(pages.map(async (pg, k) => {
    await pg.setViewportSize({ width: 1080, height: 1920 });
    await pg.goto(pathToFileURL(path.join(work, 'video.html')).href);
    await pg.evaluate(() => document.fonts.ready);
    await pg.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
    for (let i = k; i < total; i += tabs) {
      await pg.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t; }), (i * 1000) / FPS);
      await pg.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
    }
  }));
  await Promise.all(pages.slice(1).map((pg) => pg.close()));
  const sound = path.join(root, 'scripts/social/sound');
  // the opening fanfare, the ending fanfare that flops, and (short format) a light music bed in between
  const mix = bed
    ? `[2:a]adelay=${end * 1000}|${end * 1000}[a2];[3:a]atrim=0:${end - 2.2},afade=t=out:st=${end - 3.2}:d=1,volume=0.32,adelay=2200|2200[a3];[1:a][a2][a3]amix=inputs=3:duration=longest:normalize=0,apad,atrim=0:${duration},afade=t=out:st=${duration - 0.4}:d=0.4[a]`
    : `[2:a]adelay=${end * 1000}|${end * 1000}[a2];[1:a][a2]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:${duration},afade=t=out:st=${duration - 0.4}:d=0.4[a]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'),
    '-i', path.join(sound, 'bbf-opening.wav'), '-i', path.join(sound, 'bbf-ending.wav'), ...(bed ? ['-i', path.join(sound, 'bbf-bed.wav')] : []),
    '-filter_complex', mix,
    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-c:a', 'aac', '-b:a', '160k',
    '-t', String(duration), '-movflags', '+faststart', file]);
  // the first frame: the cover of the Reel on Instagram
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-frames:v', '1', '-q:v', '3', file.replace(/video(-\d)?\.mp4$/, (m, n) => `cover${n || ''}.jpg`)]);
}

/* ---------------- the short format (about 18 s, little to read) ---------------- */
const SHORT = { duration: 18, end: 14.5, bed: true };

/** The question of the end card: it asks for a comment and a like. */
export function endQuestion(series) {
  return {
    swiss: ['Quel canton fait le meilleur Trump ?', 'Dis-le en commentaire · Like si c’est le tien'],
    france: ['Quelle région fait le meilleur Trump ?', 'Dis-le en commentaire · Like si c’est la tienne'],
    uk: ['Which city does the best Trump?', 'Tell us in the comments · Like if it’s yours'],
    us: ['Which state does the best Trump?', 'Tell us in the comments · Like if it’s yours'],
    diplomat: ['Which diplomat would you hire?', 'Tell us in the comments · Like if you agree'],
  }[series.id] || ['Which version wins?', 'Tell us in the comments'];
}

function shortHtml(s, series) {
  const { region, edition } = seriesVersion(s, series);
  const french = region.lang.startsWith('fr');
  const title = videoTitle(s, series);
  const mark = (x) => e(x).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const hook = edition.hook
    ? `<p class="k">${e(title.title)} · satire</p><p class="h">${mark(edition.hook)}</p>${edition.hookEn ? `<p class="s">${mark(edition.hookEn)}</p>` : ''}`
    : `<p class="k">${e(series.kicker)}</p><p class="t">${e(title.title)}</p><p class="s">${e(title.sub)}</p>`;
  // the region’s punchline, word by word; the *gold* part comes last
  const short = edition.short || excerpt(edition.text, 150);
  const shortEn = series.id === 'diplomat' ? (edition.shortEn || excerpt(edition.en, 110)) : french ? (edition.shortEn || excerpt(englishOf(region, edition), 120)) : '';
  let i = 0;
  const words = nb(short).split(/(\*[^*]+\*)/).filter(Boolean).map((part) => {
    const gold = part.startsWith('*');
    return part.replace(/\*/g, '').split(/\s+/).filter(Boolean).map((w) => `<span class="w${gold ? ' g' : ''}" style="animation-delay:${(8.7 + 0.13 * i++).toFixed(2)}s">${e(w)}</span>`).join(' ');
  }).join(' ');
  const enAt = Math.min(12.6, 8.9 + 0.13 * i);
  const [question, ask] = endQuestion(series);
  const key = s.original.key || excerpt(s.original.text, 110);
  const presKey = s.presidential.key || excerpt(s.presidential.en, 110);
  return `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 330, boxSize: 38, hookSize: (edition.hook || '').length > 60 ? 92 : 108, titleAnim: !edition.hook })}
#title{animation:hide .3s ease-in 2.5s forwards}
.kicker{top:250px;animation:up .6s ease-out 2.7s both}
.stage{top:330px;bottom:300px}
.stage .scene{align-self:center}
#a{gap:40px}
#a .card{padding:40px 46px}
#a .card .text{font-size:60px;line-height:1.2}
#a .name{font-size:36px}
#a .trump{animation:up .7s ease-out 2.9s both}
#a .pres{animation:up .7s ease-out 4.6s both}
#a{animation:out .5s ease-in 8.1s forwards}
#b{gap:40px}
#b .on{font-size:36px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#b3121a;animation:up .6s ease-out 8.5s both}
#b .big{font-family:F;font-weight:500;font-size:96px;line-height:1.14;letter-spacing:-.015em;color:#171614}
#b .w{display:inline-block;animation:pop .35s ease-out both}
#b .g{color:#b3121a}
#b .en{font-size:44px;line-height:1.35;color:#1f3a5f;animation:fadein .6s ease-out ${enAt.toFixed(1)}s both}
#b .en em{font-style:normal;font-weight:700}
@keyframes pop{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.foot{animation:fadein .5s ease-out 2.9s both}
#end .q{font-family:F;font-size:96px;line-height:1.06;letter-spacing:-.02em;max-width:900px}
#end .ask{font-size:40px;color:#b3121a;font-weight:700}
#end{animation:fadein .5s ease-out ${SHORT.end}s both}
</style>
<div id="title">${logoFlop({ font: 'F' })}${hook}</div>
<div class="top">${logoFlop({ font: 'F' })}<span class="brand">Big Beautiful <i>Flop</i></span></div>
<p class="kicker">${e(s.headline)}</p>
<div class="stage">
 <div class="scene" id="a">
  <div class="card trump"><div class="head"><span class="av" style="background:#6b665e">DT</span><span class="name">Donald J. Trump · Truth Social</span><span class="badge">Original</span></div>
   <p class="text">“${e(key)}”</p></div>
  <div class="card pres"><div class="head"><span class="av" style="background:#1f3a5f">★</span><span class="name">The American President</span><span class="badge">Satire</span></div>
   <p class="note">How a statesmanlike president would say it</p>
   <p class="text">${e(presKey)}</p></div>
 </div>
 <div class="scene" id="b">
  <p class="on">${e(title.title)} · satire</p>
  <p class="big">${words}</p>
  ${shortEn ? `<p class="en">${mark(shortEn)}</p>` : ''}
 </div>
</div>
<p class="foot"><span>Independent satire · only the original is a quotation</span><span>bigbeautifulflop.com</span></p>
<div id="end">${logoFlop({ font: 'F' })}<p class="q">${e(question)}</p><p class="ask">${e(ask)}</p><p class="url">bigbeautifulflop.com</p></div>`;
}

/* ---------------- the Sunday video ---------------- */
const WEEKLY = { duration: 34, end: 30 };

function weeklyHtml(p) {
  const mark = (x) => e(x).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const day = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const s = p.original;
  const version = (v, id) => {
    if (!v) return '';
    const t = regionTitle(v.region);
    const hook = v.edition.hook ? mark(v.edition.hook) : e(`“${excerpt(v.edition.text, 120)}”`);
    const en = v.edition.hookEn ? mark(v.edition.hookEn) : '';
    return `<div class="scene wk" id="${id}"><p class="on">${e(t.title)} · satire</p>
  <div class="box hk"><p class="h">${hook}</p>${en ? `<p class="s">${en}</p>` : ''}</div>
  <div class="card fr"><div class="head"><span class="av" style="background:linear-gradient(135deg,${v.region.chip[0]} 50%,${v.region.chip[1]} 50%);box-shadow:inset 0 0 0 2px rgba(0,0,0,.15)"></span><span class="name">${e(regionLabel(v.region))}</span><span class="badge">Satire</span></div>
   <p class="text">${e(nb(`“${excerpt(v.edition.text, 300)}”`))}</p></div>
  <p class="on2">On Trump’s post: ${e(v.s.headline)}</p></div>`;
  };
  return `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 330, boxSize: 38, hookSize: 108, titleAnim: false })}
.wk{gap:34px}
.on{font-size:30px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#b3121a}
.on2{font-size:32px;color:#57524a;font-style:italic}
.hk .h{font-family:F;font-weight:500;font-size:84px;line-height:1.08;letter-spacing:-.02em}
.hk em{font-style:normal;color:#f2cf78}
.hk .s{font-size:36px;line-height:1.35;color:#d7dfe9;margin-top:26px}
.hk .s em{color:#fff}
.hd{font-family:F;font-weight:500;font-size:64px;line-height:1.04;letter-spacing:-.02em}
.kicker{top:250px}
.kicker{animation:up .7s ease-out 3.1s both}
#w1 .hd{animation:up .7s ease-out 3.3s both}
#w1 .trump{animation:up .8s ease-out 3.6s both}
#w1 .pres{animation:up .8s ease-out 5.8s both}
#w1{animation:out .6s ease-in 13.4s forwards}
#w2 > *{animation:up .8s ease-out 14s both}
#w2{animation:out .6s ease-in 21.6s forwards}
#w3 > *{animation:up .8s ease-out 22.2s both}
#end{animation:fadein .6s ease-out ${WEEKLY.end}s both}
</style>
<div id="title">${logoFlop({ font: 'F' })}<p class="k">Big Beautiful Flop</p><p class="t">The Flop of the week</p><p class="s">${e(day(p.from))} – ${e(day(p.to))}</p></div>
<div class="top">${logoFlop({ font: 'F' })}<span class="brand">Big Beautiful <i>Flop</i></span></div>
<p class="kicker">The Flop of the week</p>
<div class="stage">
 <div class="scene wk" id="w1">
  <p class="hd">${e(s.headline)}</p>
  <div class="card trump"><div class="head"><span class="av" style="background:#6b665e">DT</span><span class="name">Donald J. Trump · Truth Social</span><span class="badge">Original</span></div>
   <p class="text">“${e(excerpt(s.original.text, 230))}”</p></div>
  <div class="card pres"><div class="head"><span class="av" style="background:#1f3a5f">★</span><span class="name">The American President</span><span class="badge">Satire</span></div>
   <p class="note">The presidential version: how a statesmanlike president would say it</p>
   <p class="text">${e(excerpt(s.presidential.en, 250))}</p></div>
 </div>
 ${version(p.swiss, 'w2')}
 ${version(p.france, 'w3')}
</div>
<div id="end">${logoFlop({ font: 'F' })}<p class="big">${p.swiss && p.france ? 'Switzerland or France:<br>which one wins?' : 'Trump’s posts,<br>made presidential.'}</p><p class="small">${p.swiss && p.france ? 'Tell us in the comments.' : 'Independent satire.'}</p><p class="url">bigbeautifulflop.com</p></div>`;
}

const ref = (v) => (v ? `${v.s.slug}/${v.region.id}` : null);
const weeklyDir = (date) => path.join(root, 'public/social/weekly', date);

/** Renders public/social/weekly/<sunday>/video.mp4 (+ cover.jpg, weekly.json). */
export async function renderWeekly(sunday, { statements, override = {} } = {}) {
  const all = statements || loadStatements(path.join(root, 'content/statements'));
  const p = weeklyPicks(all, sunday, override);
  if (!p) return null;
  const dir = weeklyDir(sunday);
  mkdirSync(dir, { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), 'bbf-weekly-'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await render(page, work, weeklyHtml(p), path.join(dir, 'video.mp4'), WEEKLY);
  await browser.close();
  rmSync(work, { recursive: true, force: true });
  const meta = { from: p.from, to: p.to, original: p.original.slug, swiss: ref(p.swiss), france: ref(p.france) };
  writeFileSync(path.join(dir, 'weekly.json'), `${JSON.stringify(meta, null, 2)}\n`);
  return meta;
}

/** The Sunday videos posted on every network are deleted (and those more than two weeks old). */
function cleanWeekly(log, networks) {
  const base = path.join(root, 'public/social/weekly');
  if (!existsSync(base)) return;
  for (const date of readdirSync(base)) {
    const done = networks.every((n) => log.weekly?.[date]?.[n]);
    const old = Date.now() - Date.parse(`${date}T00:00:00Z`) > 14 * 86400000;
    if (done || old) rmSync(path.join(base, date), { recursive: true, force: true });
  }
  if (!readdirSync(base).length) rmSync(base, { recursive: true, force: true });
}

async function main() {
  const all = loadStatements(path.join(root, 'content/statements'));
  const config = JSON.parse(readFileSync(path.join(root, 'content/social/config.json'), 'utf8'));
  const log = JSON.parse(readFileSync(path.join(root, 'content/social/posted.json'), 'utf8'));
  const argv = process.argv.slice(2);
  const opt = (name) => (argv.includes(`--${name}`) ? argv[argv.indexOf(`--${name}`) + 1] : null);
  const networks = [...SOCIAL_NETWORKS, ...(config.youtubeStart ? ['youtube'] : [])];

  // --test-short <slug> <1|2> <file.mp4>: one video in the short format, written outside the site
  if (argv.includes('--test-short')) {
    const [slug, n, out] = argv.slice(argv.indexOf('--test-short') + 1);
    const s = all.find((x) => x.slug === slug);
    const meta = JSON.parse(readFileSync(path.join(root, 'public/social', slug, 'videos.json'), 'utf8'));
    const series = VIDEO_SERIES.find((x) => x.id === meta[n].series);
    const work = mkdtempSync(path.join(tmpdir(), 'bbf-short-'));
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    await render(page, work, shortHtml(s, series), path.resolve(out), SHORT);
    await browser.close();
    rmSync(work, { recursive: true, force: true });
    console.log(`Short format: ${slug} video ${n} (${series.kicker}) → ${out}`);
    return;
  }

  if (argv.includes('--weekly')) {
    // the Sunday of this week (UTC), or the date given
    const given = opt('weekly');
    const today = new Date();
    const sunday = /^\d{4}-\d{2}-\d{2}$/.test(given || '') ? given : new Date(today.getTime() + ((7 - today.getUTCDay()) % 7) * 86400000).toISOString().slice(0, 10);
    const overrideFile = path.join(root, 'content/social/weekly.json');
    const override = existsSync(overrideFile) ? JSON.parse(readFileSync(overrideFile, 'utf8'))[sunday] || {} : {};
    cleanWeekly(log, networks);
    const meta = await renderWeekly(sunday, { statements: all, override });
    console.log(meta ? `Sunday video ${sunday}: ${meta.original}, ${meta.swiss}, ${meta.france}` : `Sunday video ${sunday}: no statement this week`);
    return;
  }

  // --slug a,b: render these statements' videos (for example to send older ones to YouTube)
  const only = (opt('slug') || '').split(',').filter(Boolean);
  const pending = (s) => videosPending(s, log, config.start, config.youtubeStart);
  const wanted = all.filter((s) => (only.length ? only.includes(s.slug) : pending(s)));
  // the videos of statements already posted everywhere are deleted: the repository stays small
  for (const s of all) {
    if (only.includes(s.slug) || pending(s)) continue;
    for (const f of ['video-1.mp4', 'video-2.mp4', 'cover-1.jpg', 'cover-2.jpg', 'videos.json']) rmSync(path.join(root, 'public/social', s.slug, f), { force: true });
  }
  cleanWeekly(log, networks);
  // series take turns: a statement keeps the series it was given (its first video may be posted
  // already); a new one takes the next ones in the rotation
  const rotationFile = path.join(root, 'content/social/video-rotation.json');
  let turn = existsSync(rotationFile) ? JSON.parse(readFileSync(rotationFile, 'utf8')).next : 0;
  const byId = (id) => VIDEO_SERIES.find((x) => x.id === id);
  wanted.sort((a, b) => `${a.published} ${a.original.date}T${a.original.time}`.localeCompare(`${b.published} ${b.original.date}T${b.original.time}`));
  const work = mkdtempSync(path.join(tmpdir(), 'bbf-video-'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  let built = 0;
  for (const s of wanted) {
    const dir = path.join(root, 'public/social', s.slug);
    mkdirSync(dir, { recursive: true });
    const metaFile = path.join(dir, 'videos.json');
    const meta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, 'utf8')) : {};
    let series = [meta[1]?.series, meta[2]?.series].filter(Boolean).map(byId);
    if (!series.length || series.some((x) => !x || !seriesVersion(s, x))) {
      series = videoSeriesFor(s, turn);
      turn = (VIDEO_SERIES.indexOf(series.at(-1)) + 1) % VIDEO_SERIES.length;
    }
    const next = {};
    for (const [i, sr] of series.entries()) {
      const file = path.join(dir, `video-${i + 1}.mp4`);
      const hash = createHash('sha256').update(JSON.stringify(s) + sr.id + SELF).digest('hex').slice(0, 16);
      next[i + 1] = { series: sr.id, hash };
      if (meta[i + 1]?.hash === hash && existsSync(file)) continue;
      await render(page, work, html(s, sr), file);
      built += 1;
      console.log(`${s.slug}: video ${i + 1} (${sr.kicker})`);
    }
    writeFileSync(metaFile, `${JSON.stringify(next, null, 2)}\n`);
  }
  await browser.close();
  writeFileSync(rotationFile, `${JSON.stringify({ next: turn }, null, 2)}\n`);
  rmSync(work, { recursive: true, force: true });
  console.log(`Videos: ${built} rendered, ${wanted.length} statements.`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
