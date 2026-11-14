// THE SWISS PRIORITIES REPORT: an occasional special edition (about one in five videos). Not a post by the
// President, but one of his projects (the ballroom, the name on everything, gold...), reviewed by Switzerland.
// Same look as the episodes: masthead, ivory paper, grain, red, the NEUTRAL SWISS stamp, the same music.
//   node scripts/social/priorities.mjs <slug>    renders content/specials/<slug>.json
//   -> public/social/priorities/<slug>/video-1.mp4 and cover-1.jpg
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml as e } from '../../src/site/html.js';
import { render, styles, STAMP_ASSET, RED, GRAIN, CROSS } from './videos.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (x) => Math.min(6.5, Math.max(4, 3.5 + x.replace(/\*/g, '').length / 30)); // as in the episodes
const r = (x) => Math.round(x * 10) / 10;
const mk = (x) => e(x).replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** The timeline, from the length of the texts: every sentence gets time to be read. */
export function schedule(sp) {
  const T = { facts: 2.2 };
  T.factsEnd = r(T.facts + 6.6); // the three short notes appear together
  T.review = T.factsEnd;
  T.a0 = r(T.review + 2.6);
  T.a = [];
  let t = T.a0;
  for (const x of sp.assessment) { T.a.push(r(t)); t += read(x); }
  T.aEnd = r(t);
  T.v0 = r(T.aEnd + 0.3);
  T.stamp = r(T.v0 + 1.4);
  T.vEnd = r(T.stamp + 3.8);
  T.endAt = r(T.vEnd + 0.2);
  return T;
}

const PARQUET = (() => {
  // a herringbone floor, drawn as an editorial figure (ink on paper)
  let tiles = '';
  for (let y = -120; y < 520; y += 60) for (let x = -120; x < 1060; x += 120) {
    tiles += `<rect x="${x}" y="${y}" width="120" height="30" transform="rotate(45 ${x} ${y})"/>`;
    tiles += `<rect x="${x + 60}" y="${y}" width="120" height="30" transform="rotate(-45 ${x + 60} ${y})"/>`;
  }
  return `<svg viewBox="0 0 940 380"><defs><clipPath id="c"><rect width="940" height="380"/></clipPath></defs><g clip-path="url(#c)" fill="#efe6d2" stroke="#171614" stroke-width="2">${tiles}</g><rect width="940" height="380" fill="none" stroke="#171614" stroke-width="4"/></svg>`;
})();

export function prioritiesHtml(sp) {
  const T = schedule(sp);
  const day = new Date(`${sp.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `<!doctype html><meta charset="utf-8"><style>
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
/* 1. the special edition and its subject */
.kick{position:absolute;left:70px;right:70px;top:310px;text-align:center;animation:fadein .5s ease-out .2s both,hide .4s ease-in ${T.review - 0.2}s forwards}
.kick .k{display:inline-flex;align-items:center;gap:14px;font-size:26px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:#fff;background:${RED};padding:12px 22px}
.kick .tg{font-family:F;font-style:italic;font-size:38px;line-height:1.2;color:#1f3a5f;margin-top:20px}
.subj{position:absolute;left:70px;right:70px;top:520px;text-align:center;font-family:F;font-weight:600;font-size:104px;line-height:1.02;letter-spacing:-.025em;animation:fadein .6s ease-out .8s both,hide .4s ease-in ${T.review - 0.2}s forwards}
.fig{position:absolute;left:70px;right:70px;top:780px;animation:fadein .6s ease-out 1.4s both,hide .4s ease-in ${T.review - 0.2}s forwards}
.fig svg{width:100%;height:auto;display:block}
.fig p{font-family:F;font-style:italic;font-size:26px;color:#57524a;margin-top:10px;text-align:right}
.facts{position:absolute;left:70px;right:70px;top:1260px;animation:fadein .6s ease-out ${T.facts}s both,hide .4s ease-in ${T.review - 0.2}s forwards}
.facts h3{font-size:22px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#57524a;padding-bottom:10px;border-bottom:1px solid #171614}
.facts p{font-size:40px;line-height:1.3;margin-top:18px;padding-left:22px;border-left:4px solid ${RED}}
.src{position:absolute;left:70px;right:70px;top:1780px;font-size:22px;color:#7a7368;letter-spacing:.06em;animation:fadein .6s ease-out ${T.facts}s both,hide .4s ease-in ${T.review - 0.2}s forwards}
/* 2. Switzerland reviews it */
.rev{position:absolute;left:70px;right:70px;top:860px;text-align:center;font-family:F;font-style:italic;font-size:64px;line-height:1.15;color:#1f3a5f;animation:fadein .5s ease-out ${T.review}s both,hide .3s ease-in ${T.a0 - 0.3}s forwards}
.rev::before{content:'';display:block;width:120px;margin:0 auto 26px;border-top:2px solid #171614}
#a{animation:fadein .5s ease-out ${T.a0}s both,hide .4s ease-in ${T.aEnd}s forwards}
#a .sec{top:640px}
#a .big{top:700px}
${T.a.slice(1).map((t, i) => `#a .p${i + 2}{animation:fadein .5s ease-out ${t}s both}`).join('')}
/* 3. the verdict */
#v{animation:fadein .5s ease-out ${T.v0}s both,hide .4s ease-in ${T.vEnd}s forwards}
#v .intro{position:absolute;left:70px;right:70px;top:620px;font-family:F;font-style:italic;font-size:48px;line-height:1.2;color:#57524a}
#v .big{top:800px;font-size:104px;line-height:1.04;letter-spacing:-.02em}
#v .big p{margin-top:10px}
.stamp{position:absolute;left:50%;top:1260px;width:640px;margin-left:-320px;transform:rotate(-8deg);animation:stampin .24s cubic-bezier(.5,0,.8,.4) ${T.stamp}s both,hide .4s ease-in ${T.vEnd}s forwards}
.stamp svg{width:100%;height:auto;display:block}
@keyframes stampin{from{opacity:0;transform:rotate(-13deg) scale(2.6)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
/* the end */
#end{background:#F4F0E6;animation:fadein .5s ease-out ${T.endAt}s both}
#end .tl{font-family:F;font-size:84px;line-height:1.08;max-width:900px}
#end .tl2{font-family:F;font-style:italic;font-size:64px;color:${RED};max-width:880px;line-height:1.2}
#end .rl{width:160px;border-top:2px solid #171614}
</style>
<div class="mast"><div class="row"><span>Independent satire</span><span>Special edition</span><span>${day}</span></div><p class="nm">Big Beautiful <i>Flop</i></p><div class="rule"></div></div>
<div class="kick"><span class="k">${CROSS(30)} The Swiss Priorities Report</span><p class="tg">${sp.tagline.map(e).join('<br>')}</p></div>
<p class="subj">${e(sp.subject)}</p>
<div class="fig">${PARQUET}<p>${e(sp.figure)}</p></div>
<div class="facts"><h3>The facts</h3>${sp.facts.map((x) => `<p>${e(x)}</p>`).join('')}</div>
<p class="src">Sources: the White House, CBS News, SCOTUSblog</p>
<p class="rev">${e(sp.review)}</p>
<div id="a"><p class="sec">${CROSS(34)} The Swiss assessment <small>Satire</small></p><div class="big">${sp.assessment.map((x, i) => `<p${i ? ` class="p${i + 1}"` : ''}>${mk(x)}</p>`).join('')}</div></div>
<div id="v"><p class="intro">${e(sp.verdictIntro)}</p><div class="big">${sp.verdict.map((x) => `<p>${mk(x)}</p>`).join('')}</div><div class="stamp">${STAMP_ASSET}</div></div>
<div id="end">${CROSS(70)}<p class="tl">${e(sp.tagline[0])}</p><p class="tl2">${e(sp.tagline[1])}</p><div class="rl"></div><p class="url">bigbeautifulflop.com</p></div>
${GRAIN}`;
}

export async function renderPriorities(slug) {
  const sp = JSON.parse(readFileSync(path.join(root, 'content/specials', `${slug}.json`), 'utf8'));
  const T = schedule(sp);
  const dir = path.join(root, 'public/social/priorities', slug);
  mkdirSync(dir, { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), 'bbf-priorities-'));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await render(page, work, prioritiesHtml(sp), path.join(dir, 'video-1.mp4'), {
      duration: r(T.endAt + 3.8), end: r(T.endAt + 0.2), bed: true,
      fx: [{ file: 'bbf-stamp.wav', at: r(T.stamp + 0.26), volume: 1 }], coverAt: r(T.stamp + 1),
    });
  } finally {
    await browser.close();
    rmSync(work, { recursive: true, force: true });
  }
  return { dir, T };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const slug = process.argv[2];
  if (!slug) { console.error('usage: node scripts/social/priorities.mjs <slug>'); process.exit(1); }
  const { dir, T } = await renderPriorities(slug);
  console.log(`${slug}: ${dir}/video-1.mp4 (${r(T.endAt + 3.8)} s)`);
}
