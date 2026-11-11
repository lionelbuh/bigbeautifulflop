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
async function render(page, work, markup, file, { duration = DURATION, end = END, bed = false, fx = [], coverAt = 0 } = {}) {
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
  // inputs: 1 opening, 2 ending, 3 music bed (short format), then the sound effects of the first screen
  const inputs = ['bbf-opening.wav', 'bbf-ending.wav', ...(bed ? ['bbf-bed.wav'] : []), ...fx.map((x) => x.file)];
  const chains = [`[2:a]adelay=${end * 1000}|${end * 1000}[a2]`];
  if (bed) chains.push(`[3:a]atrim=0:${end - 2.2},afade=t=out:st=${end - 3.2}:d=1,volume=0.32,adelay=2200|2200[a3]`);
  fx.forEach((x, k) => chains.push(`[${(bed ? 4 : 3) + k}:a]volume=${x.volume ?? 1},adelay=${Math.round(x.at * 1000)}|${Math.round(x.at * 1000)}[f${k}]`));
  const labels = ['[1:a]', '[a2]', ...(bed ? ['[a3]'] : []), ...fx.map((_, k) => `[f${k}]`)];
  const mix = `${chains.join(';')};${labels.join('')}amix=inputs=${labels.length}:duration=longest:normalize=0,apad,atrim=0:${duration},afade=t=out:st=${duration - 0.4}:d=0.4[a]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'),
    ...inputs.flatMap((f) => ['-i', path.join(sound, f)]),
    '-filter_complex', mix,
    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-c:a', 'aac', '-b:a', '160k',
    '-t', String(duration), '-movflags', '+faststart', file]);
  // the first frame: the cover of the Reel on Instagram
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(coverAt), '-i', file, '-frames:v', '1', '-q:v', '3', file.replace(/video(-\d)?\.mp4$/, (m, n) => `cover${n || ''}.jpg`)]);
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

/* the animated first screen: a presidential lectern with a red tie, then the region’s object drops on it */
const LECTERN = `<svg class="lectern" viewBox="0 0 640 640" aria-hidden="true"><rect x="300" y="10" width="8" height="110" fill="#2b2b2b"/><rect x="332" y="10" width="8" height="110" fill="#2b2b2b"/><rect x="292" y="0" width="24" height="34" rx="12" fill="#3a3a3a"/><rect x="324" y="0" width="24" height="34" rx="12" fill="#3a3a3a"/><path d="M90 150 H550 L515 640 H125 Z" fill="#6b4a2b"/><path d="M110 170 H530 L500 620 H140 Z" fill="#7d5634"/><rect x="40" y="110" width="560" height="44" rx="8" fill="#8b6239"/><circle cx="320" cy="370" r="96" fill="#1f3a5f" stroke="#f2cf78" stroke-width="8"/><path d="M320 300 l18 52 h55 l-44 32 17 53 -46 -33 -46 33 17 -53 -44 -32 h55 z" fill="#f2cf78"/></svg>`;
const SUIT = `<svg class="suit" viewBox="0 0 560 440" aria-hidden="true"><path d="M20 440 Q30 120 170 70 L230 40 H330 L390 70 Q530 120 540 440 Z" fill="#16233a"/><path d="M230 40 L280 230 L330 40 Z" fill="#f6f2ea"/><path d="M230 40 L200 120 L262 170 Z M330 40 L360 120 L298 170 Z" fill="#e6e1d6"/><path d="M170 70 L232 300 L200 440 M390 70 L328 300 L360 440" fill="none" stroke="#0e1828" stroke-width="10"/></svg>`;
const TIE = `<svg class="tie" viewBox="0 0 140 520" aria-hidden="true"><path d="M40 0 H100 L112 50 L70 82 L28 50 Z" fill="#a50d24"/><path d="M48 78 H92 L132 430 L70 520 L8 430 Z" fill="#c8102e"/><path d="M58 120 L120 300" stroke="#a50d24" stroke-width="10" opacity=".5"/><path d="M40 260 L128 400" stroke="#a50d24" stroke-width="10" opacity=".5"/></svg>`;
const OBJECTS = {
  switzerland: `<svg viewBox="0 0 240 300" aria-hidden="true"><path d="M60 40 Q120 -20 180 40" fill="none" stroke="#c8102e" stroke-width="22"/><path d="M60 40 Q120 -20 180 40" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="14 12"/><path d="M70 50 H170 L205 250 Q120 285 35 250 Z" fill="#b8b2a6"/><path d="M80 60 H120 L110 250 Q70 255 45 245 Z" fill="#d9d4c9"/><path d="M35 250 Q120 285 205 250" fill="none" stroke="#7d776c" stroke-width="10"/><circle cx="120" cy="268" r="20" fill="#5a554c"/></svg>`,
  france: `<svg viewBox="0 0 300 200" aria-hidden="true"><ellipse cx="150" cy="130" rx="140" ry="50" fill="#1d1d1f"/><ellipse cx="150" cy="105" rx="120" ry="70" fill="#2a2a2d"/><rect x="142" y="18" width="16" height="30" rx="6" fill="#1d1d1f"/></svg>`,
  'united-states': `<svg viewBox="0 0 340 200" aria-hidden="true"><path d="M10 140 Q170 210 330 140 Q300 175 170 180 Q40 175 10 140 Z" fill="#8a5a2b"/><path d="M90 150 Q80 40 130 30 Q170 60 210 30 Q260 40 250 150 Z" fill="#a46c37"/><path d="M95 130 H245" stroke="#5a3a1a" stroke-width="12"/></svg>`,
  'united-kingdom': `<svg viewBox="0 0 280 220" aria-hidden="true"><path d="M50 60 H200 L185 190 Q125 215 65 190 Z" fill="#fff" stroke="#1f3a5f" stroke-width="8"/><path d="M200 90 Q260 95 245 140 Q235 165 192 160" fill="none" stroke="#1f3a5f" stroke-width="12"/><ellipse cx="125" cy="62" rx="75" ry="14" fill="#8b5a2b"/><path d="M100 30 q10 -20 0 -30 M140 30 q10 -20 0 -30" stroke="#bbb" stroke-width="5" fill="none"/></svg>`,
  diplomat: `<svg viewBox="0 0 300 160" aria-hidden="true"><path d="M0 120 L300 120 L270 160 L30 160 Z" fill="#a50d24"/><rect x="20" y="40" width="260" height="84" rx="10" fill="#c8102e"/><path d="M20 82 H280" stroke="#f2cf78" stroke-width="6"/></svg>`,
};
/* the trophy “THE BEST EVER”, then what the region makes of it */
const TROPHY = `<svg viewBox="0 0 300 380" aria-hidden="true"><path d="M70 20 H230 Q232 150 150 190 Q68 150 70 20 Z" fill="#e8b923"/><path d="M90 30 H150 Q140 140 120 170 Q85 140 90 30 Z" fill="#f6d55c"/><path d="M70 40 Q10 40 20 100 Q30 140 85 140" fill="none" stroke="#c99a12" stroke-width="16"/><path d="M230 40 Q290 40 280 100 Q270 140 215 140" fill="none" stroke="#c99a12" stroke-width="16"/><rect x="132" y="185" width="36" height="70" fill="#c99a12"/><rect x="70" y="250" width="160" height="40" rx="6" fill="#e8b923"/><rect x="40" y="290" width="220" height="80" rx="8" fill="#3a2a14"/><rect x="58" y="306" width="184" height="48" rx="4" fill="#e8b923"/><text x="150" y="339" text-anchor="middle" font-family="I" font-weight="900" font-size="24" fill="#3a2a14">THE BEST EVER</text></svg>`;
const CHEESE = `<svg viewBox="0 0 320 220" aria-hidden="true"><ellipse cx="160" cy="160" rx="150" ry="50" fill="#d9a520"/><rect x="10" y="80" width="300" height="80" fill="#e8b52e"/><ellipse cx="160" cy="80" rx="150" ry="50" fill="#f7d774"/><ellipse cx="160" cy="80" rx="118" ry="36" fill="none" stroke="#e8c25a" stroke-width="4"/><text x="160" y="90" text-anchor="middle" font-family="F" font-weight="700" font-size="34" fill="#9a6e10">GRUYÈRE</text></svg>`;
const MODEST = { switzerland: 'pas mal', france: 'bof', 'united-kingdom': 'not bad', 'united-states': 'pretty good', diplomat: 'noted' };
const font2 = (pkg, f) => pathToFileURL(path.join(root, 'node_modules/@fontsource', pkg, 'files', f)).href;
const HANDS = `@font-face{font-family:M;src:url('${font2('permanent-marker', 'permanent-marker-latin-400-normal.woff2')}')}
@font-face{font-family:C;src:url('${font2('caveat', 'caveat-latin-700-normal.woff2')}');font-weight:700}`;
/* the hook in two parts: what he shouts, and the region’s quiet answer (the *gold* part) */
const hookParts = (hook) => {
  const m = (hook || '').match(/^(.*?)\s*\*([^*]+)\*\s*$/);
  return m ? [m[1], m[2]] : [hook || '', ''];
};

/* the stamp: what the version is “translated into” */
const STAMPS = {
  vaudois: 'Traduit en vaudois', valaisan: 'Traduit en valaisan', genevois: 'Traduit en genevois', fribourgeois: 'Traduit en fribourgeois', neuchatelois: 'Traduit en neuchâtelois',
  parisien: 'Traduit en parisien', sud: 'Traduit en marseillais', chti: 'Traduit en ch’ti', lyonnais: 'Traduit en lyonnais', breton: 'Traduit en breton',
  'new-york': 'Translated into New Yorker', texas: 'Translated into Texan', 'deep-south': 'Translated into Southern', california: 'Translated into Californian', boston: 'Translated into Bostonian', midwest: 'Translated into Midwestern',
  london: 'Translated into Londoner', liverpool: 'Translated into Scouse', manchester: 'Translated into Manc', yorkshire: 'Translated into Yorkshire', scotland: 'Translated into Scottish', wales: 'Translated into Welsh',
};

/** The first screen and its sounds, for each intro: "lectern" (animated), "stamp", or the plain title card. */
function introOf(intro, region, series, s) {
  if (intro === 'lectern') {
    const obj = OBJECTS[region.country] || '';
    return {
      css: `#title{justify-content:flex-start;padding-top:230px;gap:36px}
#title .h{font-size:92px}
#title .lectern{position:absolute;left:220px;bottom:-40px;width:640px;height:640px;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both}
#title .suit{position:absolute;left:260px;bottom:430px;width:560px;height:440px;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both}
#title .tie{position:absolute;left:497px;bottom:420px;width:86px;height:320px;transform-origin:50% 0;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both,swing 1.1s ease-in-out .45s infinite alternate}
#title .obj{position:absolute;left:630px;bottom:490px;width:240px;animation:drop .7s cubic-bezier(.3,0,.4,1) .55s both,wobble .25s ease-in-out 1.25s 5 alternate}
#title .obj svg{width:240px;height:auto}
@keyframes rise{from{transform:translateY(700px)}to{transform:none}}
@keyframes swing{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
@keyframes drop{0%{transform:translateY(-1500px) rotate(-25deg)}70%{transform:translateY(0) rotate(4deg)}85%{transform:translateY(-60px) rotate(-3deg)}100%{transform:none}}
@keyframes wobble{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}`,
      art: `${SUIT}${TIE}${LECTERN}${obj ? `<div class="obj">${obj}</div>` : ''}`,
      logo: false,
      fx: region.country === 'switzerland' ? [{ file: 'bbf-cowbell.wav', at: 1.15, volume: 0.9 }] : [{ file: 'bbf-stamp.wav', at: 1.15, volume: 0.8 }],
    };
  }
  if (intro === 'marker') {
    // a felt marker rewrites the hook in CAPITALS, then the region adds its quiet answer by hand
    const ed = seriesVersion(s, series).edition;
    const [loud, quiet] = hookParts(ed.hook);
    const caps = `${loud.replace(/[\s.,;:!?…]+$/, '').toUpperCase()}${region.lang.startsWith('fr') ? ' ' : ''}!!!`;
    const answer = quiet ? quiet.charAt(0).toLowerCase() + quiet.slice(1) : '';
    return {
      css: `${HANDS}
#title{background:#f6f2ea;color:#171614;justify-content:flex-start;padding-top:230px;gap:30px}
#title .k{color:#b3121a}
#title .caps{position:relative;font-family:M;font-size:${caps.length > 34 ? 96 : 116}px;line-height:1.05;color:#111;transform:rotate(-4deg);max-width:960px;clip-path:inset(0 100% 0 0);animation:write 1s steps(24,end) .2s forwards}
#title .pen{position:absolute;top:330px;left:40px;width:150px;animation:pen 1s linear .2s both,away .3s ease-in 1.25s forwards}
#title .quiet{font-family:C;font-weight:700;font-size:92px;color:#1f3a5f;transform:rotate(3deg);animation:fadein .35s ease-out 1.45s both}
#title .quiet::before{content:'↳ ';color:#b3121a}
#title .s{color:#57524a;animation:fadein .4s ease-out 1.7s both}
#title .lectern{position:absolute;left:300px;bottom:-60px;width:480px;height:480px;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both}
#title .suit{position:absolute;left:345px;bottom:290px;width:390px;height:306px;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both}
#title .tie{position:absolute;left:510px;bottom:280px;width:60px;height:224px;transform-origin:50% 0;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both,swing 1.1s ease-in-out .45s infinite alternate}
@keyframes write{to{clip-path:inset(0 0 0 0)}}
@keyframes pen{from{transform:translate(0,40px) rotate(20deg)}to{transform:translate(820px,120px) rotate(20deg)}}
@keyframes away{to{transform:translate(1200px,-300px) rotate(60deg);opacity:0}}
@keyframes rise{from{transform:translateY(700px)}to{transform:none}}
@keyframes swing{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}`,
      text: `<p class="caps">${e(caps)}</p>${answer ? `<p class="quiet">${e(answer)}</p>` : ''}${ed.hookEn ? `<p class="s">${e(ed.hookEn.replace(/\*/g, ''))}</p>` : ''}`,
      art: `<svg class="pen" viewBox="0 0 150 420" aria-hidden="true"><rect x="45" y="0" width="60" height="300" rx="14" fill="#1a1a1a"/><rect x="45" y="60" width="60" height="30" fill="#e8e8e8"/><path d="M50 300 H100 L88 370 H62 Z" fill="#333"/><path d="M66 370 H84 L78 410 H72 Z" fill="#000"/></svg>${SUIT}${TIE}${LECTERN}`,
      logo: false,
      coverAt: 2.0,
      fx: [{ file: 'bbf-scribble.wav', at: 0.2, volume: 0.9 }],
    };
  }
  if (intro === 'trophy') {
    const obj = region.country === 'switzerland' ? CHEESE : OBJECTS[region.country] || CHEESE;
    return {
      css: `#title{justify-content:flex-start;padding-top:230px;gap:36px}
#title .h{font-size:92px}
#title .lectern{position:absolute;left:220px;bottom:-40px;width:640px;height:640px;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both}
#title .suit{position:absolute;left:260px;bottom:430px;width:560px;height:440px;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both}
#title .tie{position:absolute;left:497px;bottom:420px;width:86px;height:320px;transform-origin:50% 0;animation:rise .45s cubic-bezier(.2,.8,.3,1.2) both,swing 1.1s ease-in-out .45s infinite alternate}
#title .trophy{position:absolute;left:600px;bottom:490px;width:280px;animation:drop .6s cubic-bezier(.3,0,.4,1) .5s both,gone .25s ease-in 1.55s forwards}
#title .trophy svg,#title .after svg{width:100%;height:auto}
#title .after{position:absolute;left:590px;bottom:490px;width:300px;animation:popin .35s cubic-bezier(.2,.8,.3,1.4) 1.65s both}
#title .tag{position:absolute;left:640px;bottom:690px;font-family:I;font-weight:800;font-size:44px;color:#171614;background:#f2cf78;padding:8px 22px;border-radius:12px;transform:rotate(-6deg);animation:popin .3s cubic-bezier(.2,.8,.3,1.4) 1.95s both}
@keyframes rise{from{transform:translateY(700px)}to{transform:none}}
@keyframes swing{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
@keyframes drop{0%{transform:translateY(-1500px)}70%{transform:translateY(0)}85%{transform:translateY(-50px)}100%{transform:none}}
@keyframes gone{to{transform:scale(0) rotate(30deg);opacity:0}}
@keyframes popin{from{transform:scale(0);opacity:0}to{transform:none;opacity:1}}`,
      art: `${SUIT}${TIE}${LECTERN}<div class="trophy">${TROPHY}</div><div class="after">${obj}</div><p class="tag">${e(MODEST[region.country] || 'not bad')}</p>`,
      logo: false,
      coverAt: 1.2,
      fx: [{ file: 'bbf-cowbell.wav', at: 0.95, volume: 0.45 }, { file: 'bbf-stamp.wav', at: 1.65, volume: 0.5 }],
    };
  }
  if (intro === 'stamp') {
    const label = series.id === 'diplomat' ? 'Translated into diplomatic' : STAMPS[region.id] || `Translated into ${region.name}`;
    return {
      css: `.stamp{font-size:64px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#e0233f;border:10px double #e0233f;border-radius:18px;padding:18px 34px;background:rgba(246,242,234,.96);transform:rotate(-8deg);animation:stamp .28s cubic-bezier(.5,0,.8,.4) .35s both}
#title{inset:-40px;animation:shake .32s linear .63s,hide .3s ease-in 2.5s forwards}
@keyframes stamp{from{opacity:0;transform:rotate(-14deg) scale(3.2)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
@keyframes shake{0%,100%{transform:none}20%{transform:translate(-14px,8px)}40%{transform:translate(12px,-10px)}60%{transform:translate(-8px,6px)}80%{transform:translate(6px,-4px)}}`,
      stamp: `<p class="stamp">${e(label)}</p>`,
      logo: true,
      fx: [{ file: 'bbf-stamp.wav', at: 0.6, volume: 1 }],
    };
  }
  return { css: '', art: '', logo: true, fx: [] };
}

function shortHtml(s, series, { intro = '' } = {}) {
  const { region, edition } = seriesVersion(s, series);
  const french = region.lang.startsWith('fr');
  const title = videoTitle(s, series);
  const mark = (x) => e(x).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const first = introOf(intro, region, series, s);
  const hook = first.text ? `<p class="k">${e(title.title)} · satire</p>${first.text}` : edition.hook
    ? `<p class="k">${e(title.title)} · satire</p>${first.stamp || ''}<p class="h">${mark(edition.hook)}</p>${edition.hookEn ? `<p class="s">${mark(edition.hookEn)}</p>` : ''}`
    : `<p class="k">${e(series.kicker)}</p>${first.stamp || ''}<p class="t">${e(title.title)}</p><p class="s">${e(title.sub)}</p>`;
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
  // long key lines: smaller type, so both cards always fit above the footer
  const total = [...key].length + [...presKey].length;
  const keySize = total > 280 ? 44 : total > 230 ? 50 : total > 180 ? 54 : 60;
  return `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 330, boxSize: 38, hookSize: (edition.hook || '').length > 60 ? 92 : 108, titleAnim: !edition.hook })}
#title{animation:hide .3s ease-in 2.5s forwards}
${first.css}
.kicker{top:250px;animation:up .6s ease-out 2.7s both}
.stage{top:330px;bottom:300px}
.stage .scene{align-self:center}
#a{gap:40px}
#a .card{padding:40px 46px}
#a .card .text{font-size:${keySize}px;line-height:1.2}
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
<div id="title">${first.logo ? logoFlop({ font: 'F' }) : ''}${hook}${first.art || ''}</div>
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

/* ---------------- the meme format: “the invisible President”, at his desk ---------------- */
const MEME = { duration: 24, end: 20.5, bed: true };
const OFFICE = `<svg class="office" viewBox="0 0 1080 1920" aria-hidden="true">
<rect width="1080" height="1920" fill="#e9e1cf"/><rect y="1380" width="1080" height="540" fill="#d8ccb1"/>
<rect x="330" y="760" width="420" height="520" rx="6" fill="#bcd3e6" stroke="#f6f2ea" stroke-width="22"/><path d="M540 760 V1280 M330 1020 H750" stroke="#f6f2ea" stroke-width="14"/>
<path d="M330 760 h80 v520 h-80 z M670 760 h80 v520 h-80 z" fill="#8a1c2b" opacity=".9"/>
<rect x="150" y="820" width="10" height="700" fill="#b8932f"/><path d="M160 840 h170 v200 h-170 z" fill="#f6f2ea"/><path d="M160 840 h170 v22 h-170 z M160 884 h170 v22 h-170 z M160 928 h170 v22 h-170 z M160 972 h170 v22 h-170 z M160 1016 h170 v24 h-170 z" fill="#b22234"/><path d="M160 840 h80 v110 h-80 z" fill="#3c3b6e"/>
<rect x="920" y="820" width="10" height="700" fill="#b8932f"/><path d="M750 840 h170 v200 h-170 z" fill="#1f3a5f"/><circle cx="835" cy="940" r="46" fill="none" stroke="#f2cf78" stroke-width="8"/>
</svg>`;
const DESK = `<svg class="desk" viewBox="0 0 1080 520" aria-hidden="true"><rect x="40" y="0" width="1000" height="46" rx="8" fill="#6b4226"/><rect x="70" y="46" width="940" height="474" fill="#7d5634"/><rect x="120" y="100" width="360" height="360" rx="10" fill="none" stroke="#5e3d22" stroke-width="10"/><rect x="600" y="100" width="360" height="360" rx="10" fill="none" stroke="#5e3d22" stroke-width="10"/><circle cx="540" cy="280" r="58" fill="#1f3a5f" stroke="#f2cf78" stroke-width="7"/><path d="M540 238 l12 34 h36 l-29 21 11 35 -30 -22 -30 22 11 -35 -29 -21 h36 z" fill="#f2cf78"/><rect x="700" y="-60" width="110" height="64" rx="10" fill="#f6f2ea" stroke="#555" stroke-width="6"/><path d="M810 -45 q40 0 30 30 q-8 22 -30 18" fill="none" stroke="#555" stroke-width="6"/></svg>`;
const CAP = `<svg viewBox="0 0 320 180" aria-hidden="true"><path d="M60 120 Q60 20 170 20 Q270 20 275 120 Z" fill="#1f3a5f"/><path d="M160 22 V118" stroke="#16233a" stroke-width="6"/><circle cx="168" cy="22" r="10" fill="#16233a"/><path d="M40 118 H300 Q300 150 230 150 H60 Q30 150 40 118 Z" fill="#16233a"/></svg>`;
const PROPS = {
  switzerland: { svg: OBJECTS.switzerland, css: 'left:470px;top:1250px;width:140px' },
  france: { svg: OBJECTS.france, css: 'left:400px;top:950px;width:280px' },
  'united-states': { svg: OBJECTS['united-states'], css: 'left:365px;top:930px;width:350px' },
  'united-kingdom': { svg: OBJECTS['united-kingdom'], css: 'left:180px;top:1380px;width:190px' },
  diplomat: { svg: OBJECTS.diplomat, css: 'left:380px;top:1440px;width:320px' },
};
const MEME_ASK = {
  switzerland: (r) => `Le même, s’il était ${r.name.toLowerCase()} :`, france: (r) => `Le même, s’il était ${r.name.toLowerCase()} :`,
  'united-states': (r) => `Same post, if he were from ${r.name}:`, 'united-kingdom': (r) => `Same post, if he were from ${r.name}:`,
  diplomat: () => 'What a diplomat hears:',
};

function memeHtml(s, series) {
  const { region, edition } = seriesVersion(s, series);
  // the cowboy hat belongs to Texas; other American regions get a baseball cap
  const capFor = region.country === 'united-states' && region.id !== 'texas' ? { svg: CAP, css: 'left:390px;top:1010px;width:300px' } : null;
  const french = region.lang.startsWith('fr');
  const mark = (x) => e(nb(x)).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const key = s.original.key || excerpt(s.original.text, 110);
  const presKey = s.presidential.key || excerpt(s.presidential.en, 110);
  const short = edition.short || excerpt(edition.text, 150);
  const shortEn = series.id === 'diplomat' ? (edition.shortEn || '') : french ? (edition.shortEn || '') : '';
  const prop = capFor || PROPS[region.country] || PROPS.switzerland;
  const ask = (MEME_ASK[region.country] || MEME_ASK.switzerland)(region);
  const [question, sub] = endQuestion(series);
  const big = [...key].length > 90 ? 52 : 60;
  return `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 330, boxSize: 38, hookSize: 92, titleAnim: false })}
#title{display:none}
.office{position:absolute;inset:0;width:1080px;height:1920px}
.desk{position:absolute;left:0;bottom:-120px;width:1080px;height:520px}
.suit{position:absolute;left:260px;top:1120px;width:560px;height:440px}
.tie{position:absolute;left:497px;top:1160px;width:86px;height:320px;transform-origin:50% 0;animation:swing 1.2s ease-in-out infinite alternate}
.prop{position:absolute;${prop.css};animation:drop .6s cubic-bezier(.3,0,.4,1) 9.3s both,wobble .3s ease-in-out 9.9s 6 alternate}
.prop svg{width:100%;height:auto}
.cap{position:absolute;left:56px;right:56px;top:150px;background:#fff;border-radius:26px;padding:34px 40px;text-align:center;box-shadow:0 8px 0 rgba(0,0,0,.12)}
.cap .lab{font-size:32px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#b3121a;margin-bottom:14px}
.cap .q{font-size:${big}px;font-weight:800;line-height:1.14;color:#111}
.cap .q em{font-style:normal;color:#b3121a}
.sub{position:absolute;left:110px;right:110px;background:#1f3a5f;color:#fff;border-radius:20px;padding:22px 30px;font-size:33px;line-height:1.3;text-align:center}
.sub b{display:block;font-size:24px;letter-spacing:.12em;text-transform:uppercase;color:#f2cf78;margin-bottom:6px}
#m1,#m1s{animation:hide .3s ease-in 9s forwards}
#m2,#m2s{animation:fadein .35s ease-out 9.2s both}
#m2s{animation-delay:11.5s}
.tag{position:absolute;right:56px;top:96px;font-size:24px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#57524a}
@keyframes swing{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
@keyframes drop{0%{transform:translateY(-1400px) rotate(-20deg)}70%{transform:translateY(0) rotate(4deg)}85%{transform:translateY(-50px) rotate(-3deg)}100%{transform:none}}
@keyframes wobble{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
#end .q2{font-family:F;font-size:96px;line-height:1.06;letter-spacing:-.02em;max-width:900px}
#end .ask{font-size:40px;color:#b3121a;font-weight:700}
#end{animation:fadein .5s ease-out ${MEME.end}s both}
</style>
${OFFICE}${SUIT}${TIE}<div class="prop">${prop.svg}</div>${DESK}
<p class="tag">Big Beautiful Flop · satire</p>
<div class="cap" id="m1"><p class="lab">Trump, on Truth Social</p><p class="q">“${e(key)}”</p></div>
<div class="sub" id="m1s" style="top:${big === 60 ? 620 : 600}px"><b>A statesmanlike president</b>${e(presKey)}</div>
<div class="cap" id="m2"><p class="lab">${e(ask)}</p><p class="q">${mark(short)}</p></div>
${shortEn ? `<div class="sub" id="m2s" style="top:780px">${mark(shortEn)}</div>` : ''}
<div id="end">${logoFlop({ font: 'F' })}<p class="q2">${e(question)}</p><p class="ask">${e(sub)}</p><p class="url">bigbeautifulflop.com</p></div>`;
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
    const [slug, n, out, intro = ''] = argv.slice(argv.indexOf('--test-short') + 1);
    const s = all.find((x) => x.slug === slug);
    const meta = JSON.parse(readFileSync(path.join(root, 'public/social', slug, 'videos.json'), 'utf8'));
    const series = VIDEO_SERIES.find((x) => x.id === meta[n].series);
    const work = mkdtempSync(path.join(tmpdir(), 'bbf-short-'));
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const { region } = seriesVersion(s, series);
    await render(page, work, shortHtml(s, series, { intro }), path.resolve(out), { ...SHORT, fx: introOf(intro, region, series, s).fx, coverAt: introOf(intro, region, series, s).coverAt });
    await browser.close();
    rmSync(work, { recursive: true, force: true });
    console.log(`Short format: ${slug} video ${n} (${series.kicker}) → ${out}`);
    return;
  }

  // --test-meme <slug> <1|2> <file.mp4>: one video in the meme format, written outside the site
  if (argv.includes('--test-meme')) {
    const [slug, n, out] = argv.slice(argv.indexOf('--test-meme') + 1);
    const s = all.find((x) => x.slug === slug);
    const meta = JSON.parse(readFileSync(path.join(root, 'public/social', slug, 'videos.json'), 'utf8'));
    const series = VIDEO_SERIES.find((x) => x.id === meta[n].series);
    const { region } = seriesVersion(s, series);
    const work = mkdtempSync(path.join(tmpdir(), 'bbf-meme-'));
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const fx = [{ file: region.country === 'switzerland' ? 'bbf-cowbell.wav' : 'bbf-stamp.wav', at: 9.75, volume: 0.8 }];
    await render(page, work, memeHtml(s, series), path.resolve(out), { ...MEME, fx, coverAt: 12 });
    await browser.close();
    rmSync(work, { recursive: true, force: true });
    console.log(`Meme format: ${slug} video ${n} → ${out}`);
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
    // the format is chosen once: statements rendered before the short format keep the classic one
    let format = meta.format || (series.length ? 'classic' : 'meme');
    if (!series.length || series.some((x) => !x || !seriesVersion(s, x))) {
      series = videoSeriesFor(s, turn);
      turn = (VIDEO_SERIES.indexOf(series.at(-1)) + 1) % VIDEO_SERIES.length;
    }
    const next = { format };
    for (const [i, sr] of series.entries()) {
      const file = path.join(dir, `video-${i + 1}.mp4`);
      const hash = createHash('sha256').update(JSON.stringify(s) + sr.id + SELF).digest('hex').slice(0, 16);
      next[i + 1] = { series: sr.id, hash };
      if (meta[i + 1]?.hash === hash && existsSync(file)) continue;
      if (format === 'meme') {
        // the invisible President at his desk (owner's choice from 11 November 2026)
        const { region } = seriesVersion(s, sr);
        const fx = [{ file: region.country === 'switzerland' ? 'bbf-cowbell.wav' : 'bbf-stamp.wav', at: 9.75, volume: 0.8 }];
        await render(page, work, memeHtml(s, sr), file, { ...MEME, fx, coverAt: 12 });
      } else if (format === 'short') {
        // the first screen: the felt marker that rewrites the hook in capitals (owner's choice), when there is a hook
        const { region, edition } = seriesVersion(s, sr);
        const intro = edition.hook ? 'marker' : '';
        const first = introOf(intro, region, sr, s);
        await render(page, work, shortHtml(s, sr, { intro }), file, { ...SHORT, fx: first.fx, coverAt: first.coverAt || 0 });
      }
      else await render(page, work, html(s, sr), file);
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
