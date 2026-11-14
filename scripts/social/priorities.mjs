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
import { monsieurNeutre } from './assets/monsieur-neutre.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (x) => Math.min(6.5, Math.max(4, 3.5 + x.replace(/\*/g, '').length / 30)); // as in the episodes
const r = (x) => Math.round(x * 10) / 10;
/** The fixed sign-off of every Priorities Report. */
export const SIGN_OFF = 'Switzerland remains available for a modest, well-insured alternative.';
const mk = (x) => e(x).replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** The timeline, from the length of the texts: every sentence gets time to be read. */
export function schedule(sp) {
  const T = { facts: 2.2 };
  T.factsEnd = r(T.facts + 6.6); // the three short notes appear together
  T.review = T.factsEnd;
  T.a0 = r(T.review + 2.6);
  if (!sp.assessment.length) T.a0 = r(T.review + 2.9);
  T.a = [];
  let t = T.a0;
  for (const x of sp.assessment) { T.a.push(r(t)); t += read(x); }
  T.aEnd = r(sp.assessment.length ? t : T.a0 - 0.3);
  // THE SWISS ALTERNATIVE (optional): the same money, the Swiss way
  if (sp.alternative) {
    T.alt0 = r(T.aEnd + 0.3);
    T.altCh = r(T.alt0 + 4.6);
    T.altClose = r(T.altCh + 4.6);
    T.altEnd = r(T.altClose + read(sp.alternative.closing));
  }
  T.v0 = r((T.altEnd ?? T.aEnd) + 0.3);
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

function altHtml(a) {
  const card = (id, c) => `<div class="cmp" id="${id}"><p class="fl">${e(c.flag)}</p><p class="lb">${e(c.label)}</p><p class="am">${e(c.amount)}${c.approx ? `<small>${e(c.approx)}</small>` : ''}</p><p class="nt">${e(c.note)}</p></div>`;
  return `<div id="alt"><p class="sec">${CROSS(34)} The Swiss Alternative <small>Satire</small></p>${card('us', a.us)}${card('ch', a.ch)}<p class="disc">${e(a.disclaimer)}</p><p class="close">${mk(a.closing)}</p></div>`;
}

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
/* THE SWISS ALTERNATIVE */
#alt{animation:fadein .5s ease-out ${T.alt0}s both,hide .4s ease-in ${T.altEnd}s forwards}
#alt .sec{top:400px}
.cmp{position:absolute;left:70px;right:70px;padding:26px 30px 28px;border:2px solid #171614;background:#fffdf8}
.cmp .fl{font-size:22px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#57524a}
.cmp .lb{font-family:F;font-size:44px;line-height:1.1;margin-top:8px}
.cmp .am{font-family:F;font-weight:600;font-size:84px;line-height:1;margin-top:12px;letter-spacing:-.02em}
.cmp .am small{display:block;font-size:38px;font-weight:500;color:#57524a;margin-top:6px;letter-spacing:0}
.cmp .nt{font-size:28px;line-height:1.3;color:#57524a;margin-top:12px}
#us{top:480px}
#ch{top:980px;border-color:${RED};animation:fadein .5s ease-out ${T.altCh}s both}
#ch .am{color:${RED}}
#alt .disc{position:absolute;left:70px;right:70px;top:1420px;font-family:F;font-style:italic;font-size:30px;color:#57524a;animation:fadein .5s ease-out ${T.altCh}s both}
#alt .close{position:absolute;left:70px;right:70px;top:1510px;font-family:F;font-size:60px;line-height:1.12;animation:fadein .5s ease-out ${T.altClose}s both}
#alt .close em{font-style:italic;color:${RED}}
/* 3. the verdict */
#v{animation:fadein .5s ease-out ${T.v0}s both,hide .4s ease-in ${T.vEnd}s forwards}
#v .intro{position:absolute;left:70px;right:70px;top:620px;font-family:F;font-style:italic;font-size:48px;line-height:1.2;color:#57524a}
#v .big{top:800px;font-size:104px;line-height:1.04;letter-spacing:-.02em}
#v .big p{margin-top:10px}
.stamp{position:absolute;left:50%;top:1260px;width:640px;margin-left:-320px;transform:rotate(-8deg);animation:stampin .24s cubic-bezier(.5,0,.8,.4) ${T.stamp}s both,hide .4s ease-in ${T.vEnd}s forwards}
.stamp svg{width:100%;height:auto;display:block}
@keyframes stampin{from{opacity:0;transform:rotate(-13deg) scale(2.6)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
/* Monsieur Neutre (optional, "mascot"): reads, nods, stamps, tips his hat */
.mn{width:100%;height:auto;display:block;overflow:visible}
.m{position:absolute;width:250px}
.m .eyes{animation:blink 3.4s steps(1) infinite}
@keyframes blink{0%,94%{transform:scaleY(1)}95%,99%{transform:scaleY(.1)}}
#m1{right:60px;top:1590px;width:220px;animation:fadein .5s ease-out 1.6s both,hide .3s ease-in ${T.a0 - 0.3}s forwards}
#m1 .arm{animation:scan 2.4s ease-in-out 1.6s infinite alternate}
@keyframes scan{from{transform:rotate(-14deg)}to{transform:rotate(8deg)}}
#m1 .head{animation:tilt 2.4s ease-in-out 1.6s infinite alternate,nod .5s ease-in-out ${T.review + 0.3}s 3 alternate}
@keyframes tilt{from{transform:rotate(-4deg)}to{transform:rotate(3deg)}}
@keyframes nod{to{transform:rotate(9deg) translateY(4px)}}
#m1 .brows{animation:raise .4s ease-out ${T.review}s both}
@keyframes raise{to{transform:translateY(-6px)}}
#m3{left:40px;top:1480px;width:300px;animation:fadein .4s ease-out ${T.v0}s both,hide .4s ease-in ${T.vEnd}s forwards}
#m3 .arm{animation:lift .5s ease-out ${T.v0}s both,slam .22s cubic-bezier(.6,0,.9,.5) ${T.stamp - 0.2}s both}
@keyframes lift{from{transform:rotate(0)}to{transform:rotate(-110deg)}}
@keyframes slam{from{transform:rotate(-110deg)}to{transform:rotate(-10deg)}}
#m3 .head{animation:proud .5s ease-out ${T.stamp + 0.4}s both}
@keyframes proud{to{transform:rotate(-6deg)}}
#m4{left:50%;margin-left:-110px;width:220px;top:1520px;z-index:3;animation:fadein .4s ease-out ${T.endAt + 0.3}s both}
#m4 .hat{animation:tip .9s ease-in-out ${T.endAt + 1.4}s both}
@keyframes tip{0%{transform:none}50%{transform:translate(18px,-34px) rotate(16deg)}100%{transform:none}}
#m4 .arm{animation:wave .9s ease-in-out ${T.endAt + 1.4}s both}
@keyframes wave{50%{transform:rotate(-120deg)}}
/* the end */
#end{background:#F4F0E6;animation:fadein .5s ease-out ${T.endAt}s both}
#end .tl{font-family:F;font-size:84px;line-height:1.08;max-width:900px}
#end .tl2{font-family:F;font-style:italic;font-size:64px;color:${RED};max-width:880px;line-height:1.2}
#end .rl{width:160px;border-top:2px solid #171614}
#end{gap:30px}
#end .el{font-family:F;font-size:46px;line-height:1.2;max-width:880px;animation:fadein .5s ease-out ${r(T.endAt + 1.6)}s both}
#end .so{font-family:F;font-style:italic;font-size:36px;line-height:1.25;color:#57524a;max-width:820px;animation:fadein .5s ease-out ${r(T.endAt + 3.2)}s both}
</style>
<div class="mast"><div class="row"><span>Independent satire</span><span>Special edition</span><span>${day}</span></div><p class="nm">Big Beautiful <i>Flop</i></p><div class="rule"></div></div>
<div class="kick"><span class="k">${CROSS(30)} The Swiss Priorities Report</span><p class="tg">${sp.tagline.map(e).join('<br>')}</p></div>
<p class="subj">${e(sp.subject)}</p>
<div class="fig">${PARQUET}<p>${e(sp.figure)}</p></div>
<div class="facts"><h3>The facts</h3>${sp.facts.map((x) => `<p>${e(x)}</p>`).join('')}</div>
<p class="src"${sp.mascot ? ' style="right:320px"' : ''}>${e(sp.sourcesLabel || 'Sources: the White House, CBS News, SCOTUSblog')}</p>
<p class="rev">${e(sp.review)}</p>
<div id="a"><p class="sec">${CROSS(34)} The Swiss assessment <small>Satire</small></p><div class="big">${sp.assessment.map((x, i) => `<p${i ? ` class="p${i + 1}"` : ''}>${mk(x)}</p>`).join('')}</div></div>
${sp.alternative ? altHtml(sp.alternative) : ''}
<div id="v"><p class="intro">${e(sp.verdictIntro)}</p><div class="big">${sp.verdict.map((x) => `<p>${mk(x)}</p>`).join('')}</div><div class="stamp">${STAMP_ASSET}</div></div>
${sp.mascot ? `<div class="m" id="m1">${monsieurNeutre('loupe')}</div><div class="m" id="m3">${monsieurNeutre('stamp')}</div>` : ''}
<div id="end">${CROSS(70)}<p class="tl">${e(sp.tagline[0])}</p><p class="tl2">${e(sp.tagline[1])}</p>${sp.endLine ? `<p class="el">${e(sp.endLine).replace(/\. /g, '.<br>')}</p>` : ''}<p class="so">${e(SIGN_OFF)}</p><div class="rl"></div><p class="url">bigbeautifulflop.com</p>${sp.mascot ? `<div class="m" id="m4">${monsieurNeutre()}</div>` : ''}</div>
${GRAIN}`;
}

export async function renderPriorities(slug, { json, out } = {}) {
  const sp = JSON.parse(readFileSync(json || path.join(root, 'content/specials', `${slug}.json`), 'utf8'));
  const T = schedule(sp);
  const dir = out || path.join(root, 'public/social/priorities', slug);
  mkdirSync(dir, { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), 'bbf-priorities-'));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await render(page, work, prioritiesHtml(sp), path.join(dir, 'video-1.mp4'), {
      duration: r(T.endAt + 7.2), end: r(T.endAt + 0.2), bed: true,
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
  const opt = (k) => { const i = process.argv.indexOf(k); return i > 0 ? path.resolve(process.argv[i + 1]) : undefined; };
  // --json <file> --out <dir>: render a draft without touching the published files
  const { dir, T } = await renderPriorities(slug, { json: opt('--json'), out: opt('--out') });
  console.log(`${slug}: ${dir}/video-1.mp4 (${r(T.endAt + 7.2)} s)`);
}
