/**
 * Social videos (vertical 1080 × 1920, 30 s, H.264 + AAC), two per statement, from two series that take
 * turns (see videoSeriesFor in compose.mjs). Screen 1 always shows Trump’s original and the presidential
 * version together; then the series’ version and its English (or “What he really means”); then the end
 * card. The sound logo (scripts/social/jingle.py) opens with a fanfare and ends with the same fanfare
 * that flops.
 *
 *   npm run videos     after npm run images: the videos of statements waiting to be posted (others are deleted);
 *                      --slug <slug> renders one statement's videos
 *
 * Writes public/social/<slug>/video-1.mp4, video-2.mp4 and videos.json; a video is rebuilt only when
 * its statement or this script changes. Needs the pre-installed Playwright and ffmpeg.
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadStatements } from '../../src/site/content.js';
import { logoFlop } from '../../src/site/logo.js';
import { escapeHtml as e } from '../../src/site/html.js';
import { excerpt, englishOf, regionLabel, seriesVersion, videoSeriesFor, videosPending } from './compose.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FPS = 30;
const DURATION = 30;
const SELF = readFileSync(fileURLToPath(import.meta.url), 'utf8');
const font = (f) => pathToFileURL(path.join(root, 'node_modules/@fontsource-variable/fraunces/files', f)).href;

function html(s, series) {
  const { region, edition } = seriesVersion(s, series);
  const english = !region.lang.startsWith('fr');
  const chip = `linear-gradient(135deg,${region.chip[0]} 50%,${region.chip[1]} 50%)`;
  const text = english ? excerpt(edition.text, series.id === 'diplomat' ? 460 : 380) : `“${excerpt(edition.text, 400)}”`;
  const box = series.id === 'diplomat' ? excerpt(edition.en, 220) : excerpt(series.id === 'swiss' || series.id === 'france' ? englishOf(region, edition) : edition.en, 260);
  return `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:F;src:url('${font('fraunces-latin-opsz-normal.woff2')}');font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;overflow:hidden;background:#f6f2ea;color:#171614;font-family:system-ui,'Segoe UI',Roboto,Arial,sans-serif;position:relative}
.top{position:absolute;left:70px;right:70px;top:90px;display:flex;align-items:center;gap:18px;padding-bottom:22px;border-bottom:5px double #171614}
.top svg{width:70px;height:70px}
.brand{font-family:F;font-weight:600;font-size:46px;letter-spacing:-.03em;text-transform:uppercase}
.brand i{color:#b3121a;font-weight:500;text-transform:none}
.kicker{position:absolute;left:70px;top:260px;font-size:30px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1f3a5f}
h1{position:absolute;left:70px;right:70px;top:310px;font-family:F;font-weight:500;font-size:84px;line-height:1.02;letter-spacing:-.02em}
.stage{position:absolute;left:60px;right:60px;top:${s.headline.length > 30 ? 560 : 470}px;display:grid}
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
.box .text{font-family:F;font-size:${series.id === 'diplomat' ? 46 : 38}px;line-height:1.24}
.foot{position:absolute;left:70px;right:70px;bottom:250px;display:flex;justify-content:space-between;font-size:28px;color:#57524a}
#end{position:absolute;inset:0;background:#f6f2ea;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;text-align:center}
#end svg{width:220px;height:220px}
#end .big{font-family:F;font-size:88px;line-height:1.08}
#end .url{font-size:56px;font-weight:700;color:#1f3a5f}
#end .small{font-size:34px;color:#57524a;max-width:820px;line-height:1.4}
@keyframes up{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
@keyframes out{to{opacity:0;transform:translateY(-60px)}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.kicker,h1{animation:up .7s ease-out both}h1{animation-delay:.3s}
#s1 .trump{animation:up .8s ease-out 1.5s both}
#s1 .pres{animation:up .8s ease-out 4.5s both}
#s1{animation:out .6s ease-in 13.2s forwards}
#s2 .card{animation:up .8s ease-out 13.8s both}
#s2 .box{animation:up .8s ease-out 20.5s both}
.foot{animation:out .4s ease-in 20.2s forwards}
#end{animation:fadein .6s ease-out 26.5s both}
</style>
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

async function render(page, work, markup, file) {
  const frames = path.join(work, 'frames');
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  writeFileSync(path.join(work, 'video.html'), markup);
  await page.goto(pathToFileURL(path.join(work, 'video.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  for (let i = 0; i < FPS * DURATION; i += 1) {
    await page.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t; }), (i * 1000) / FPS);
    await page.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  const sound = path.join(root, 'scripts/social/sound');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'),
    '-i', path.join(sound, 'bbf-opening.wav'), '-i', path.join(sound, 'bbf-ending.wav'),
    '-filter_complex', `[2:a]adelay=26500|26500[a2];[1:a][a2]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:${DURATION},afade=t=out:st=${DURATION - 0.4}:d=0.4[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-c:a', 'aac', '-b:a', '160k',
    '-t', String(DURATION), '-movflags', '+faststart', file]);
}

const all = loadStatements(path.join(root, 'content/statements'));
const config = JSON.parse(readFileSync(path.join(root, 'content/social/config.json'), 'utf8'));
const log = JSON.parse(readFileSync(path.join(root, 'content/social/posted.json'), 'utf8'));
const only = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : null;
const wanted = all.filter((s) => (only ? s.slug === only : videosPending(s, log, config.start)));
// the videos of statements already posted everywhere are deleted: the repository stays small
for (const s of all) {
  if (s.slug === only || videosPending(s, log, config.start)) continue;
  for (const f of ['video-1.mp4', 'video-2.mp4', 'videos.json']) rmSync(path.join(root, 'public/social', s.slug, f), { force: true });
}
const oldestFirst = [...all].reverse();
const work = mkdtempSync(path.join(tmpdir(), 'bbf-video-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
let built = 0;
for (const s of wanted) {
  const dir = path.join(root, 'public/social', s.slug);
  mkdirSync(dir, { recursive: true });
  const metaFile = path.join(dir, 'videos.json');
  const meta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, 'utf8')) : {};
  const series = videoSeriesFor(s, oldestFirst.indexOf(s));
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
rmSync(work, { recursive: true, force: true });
console.log(`Videos: ${built} rendered, ${wanted.length} statements.`);
