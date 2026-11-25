// TEST FORMAT "Meanwhile": the politician's post, then Steve, a fictional regular American, at his kitchen table.
//   node scripts/social/meanwhile.mjs <test-slug> <out.mp4>     (content/tests/<slug>.json, voices in content/voices/<slug>/)
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
// the opening shout, “Big Beautiful Floooooop?” (Kokoro “Bella”, slowed, the Flop stretched, pitched up), loud over a
// quiet opening fanfare; Steve's hook comes after it
export const SHOUT = path.join(root, 'scripts/social/sound/bbf-shout.wav');
// George, the news anchor (Kokoro “bm_george”): “Big Beautiful Flop.”, alone, right after the opening sting
const ANCHOR = path.join(root, 'scripts/social/sound/bbf-anchor.wav');
const ANCHOR_DUR = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ANCHOR]).toString());
const SHOUT_END = 2.9;
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
export function meanwhileVideo(s, { style = s.meanwhile.style || 'breaking' } = {}) {
  const m = s.meanwhile;
  // BREAKING (from 22 November 2026): the news sound, George the anchor, and, when the episode has one, the duel board
  // with the BREAKING ticker (the official figure); otherwise the figure at the top of Steve's screen
  const t = { episode: { hook: m.hook, steve: m.steve }, fact: m.fact, board: m.board, ticker: m.ticker || (m.fact ? `${m.fact.number} ${m.fact.text} (${m.fact.source})` : ''),
    sound: 'news', style, stamp: m.stamp || ['REALITY', 'CHECK'], tagline: m.tagline || ['Politicians say it.', 'Real people pay for it.'] };
  const ANCHOR_AT = 2.9;
  t.h0at = r(ANCHOR_AT + ANCHOR_DUR + 0.4);
  const voice = voiceOfMeanwhile(s.slug, m);
  const { html, T } = meanwhileHtml(t, { ...s, episode: { highlight: m.highlight } }, voice);
  const cues = voice ? [['h0', T.h0at], ...m.steve.map((_, i) => [`s${i}`, T.at[i]])] : [];
  const V = style === 'video';
  return { html, voice, opts: {
    ...(V ? {
      // VIDEO (from 25 November 2026): two screens, no ending card: it stops on the stamp (shorter, watched to the end)
      duration: r(T.endAt), end: r(T.endAt), coverAt: 1.4, ending: null,
      opening: 'bbf-news-open.wav', bed: true, bedFile: 'bbf-news-bed.wav', bedStart: T.n0, bedVolume: 0.3, openingVolume: 0.8,
      fx: [{ file: ANCHOR, at: ANCHOR_AT, volume: 1.6 }, { file: 'bbf-count.wav', at: T.cd, volume: 1 }, { file: 'bbf-stamp.wav', at: r(T.stampAt + 0.26), volume: 1 }, ...cues.map(([k, a]) => ({ file: path.join(voice.dir, `${k}.wav`), at: r(a), volume: 0.95 }))],
    } : {
    // the news sting, George alone (“Big Beautiful Flop.”), Steve's hook, the tick-tock under Steve, the ending that flops
    duration: r(T.endAt + 3.8), end: r(T.endAt + 0.2), coverAt: 1.4,
    opening: 'bbf-news-open.wav', ending: 'bbf-news-end.wav', bed: true, bedFile: 'bbf-news-bed.wav', bedStart: T.n0, bedVolume: 0.3, openingVolume: 0.8,
    fx: [{ file: ANCHOR, at: ANCHOR_AT, volume: 1.6 }, { file: 'bbf-stamp.wav', at: r(T.stampAt + 0.26), volume: 1 }, ...cues.map(([k, a]) => ({ file: path.join(voice.dir, `${k}.wav`), at: r(a), volume: 0.95 }))],
    }),
  } };
}

// a jar of quarters (the "BREAKING" variant)
const JAR = `<svg viewBox="0 0 120 140"><rect x="30" y="6" width="60" height="16" rx="4" fill="#8a8a8a" stroke="#171614" stroke-width="3"/><path d="M24 26 Q20 30 20 40 V118 Q20 132 34 132 H86 Q100 132 100 118 V40 Q100 30 96 26 Z" fill="#e9f3f5" fill-opacity=".7" stroke="#171614" stroke-width="3.5"/>${[[40, 120], [62, 122], [84, 120], [50, 110], [72, 110], [42, 100], [64, 98], [86, 100], [55, 88], [76, 88]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="5" fill="#c9c9c9" stroke="#171614" stroke-width="2"/>`).join('')}</svg>`;

// small drawings for the board panels: a gas pump, a pay check
const PUMP = `<svg viewBox="0 0 120 140"><rect x="22" y="14" width="56" height="116" rx="6" fill="#e2524a" stroke="#171614" stroke-width="3.5"/><rect x="32" y="26" width="36" height="26" rx="3" fill="#fffdf8" stroke="#171614" stroke-width="3"/><text x="50" y="45" text-anchor="middle" font-family="Inter, Arial" font-weight="900" font-size="13" fill="#171614">$$$</text><rect x="14" y="124" width="72" height="10" fill="#171614"/><path d="M78 40 h12 q8 0 8 8 v48 q0 8 -6 8 q-6 0 -6 -8 v-26" fill="none" stroke="#171614" stroke-width="4"/><rect x="84" y="62" width="10" height="16" rx="2" fill="#171614"/></svg>`;
const CHECK = `<svg viewBox="0 0 120 140"><g transform="rotate(-6 60 70)"><rect x="8" y="40" width="104" height="60" rx="4" fill="#e8f2e6" stroke="#171614" stroke-width="3.5"/><path d="M18 56 h40 M18 68 h60 M18 86 h30" stroke="#171614" stroke-width="3"/><text x="96" y="64" text-anchor="end" font-family="Inter, Arial" font-weight="900" font-size="16" fill="#1f7a3a">PAY</text><path d="M66 88 q8 -10 14 0 t14 0" fill="none" stroke="#171614" stroke-width="2.5"/></g></svg>`;
const ICONS = { jar: JAR, pump: PUMP, check: CHECK };

export function meanwhileHtml(t, s, voice, { shout = existsSync(SHOUT) } = {}) {
  const L = voice?.lines || {};
  // the BREAKING sound: the anchor says “Big Beautiful Flop.” on the sting; Steve's hook comes after it
  const h0at = t.sound === 'news' ? (t.h0at ?? 3.0) : shout ? SHOUT_END : 0.3; // Steve says the hook after the shout
  const hk = Math.max(2.6, h0at + (L.h0?.duration ?? 2.4) + 0.5);
  // no separate post screen any more: the post is on the first screen; Steve comes right after
  const V = t.style === 'video';
  // VIDEO: the 3-2-1 countdown right after the hook, then a swipe to Steve
  const cd = r(hk - 0.2);
  const n0 = V ? r(cd + 1.45) : r(hk + 0.4);
  const holds = t.episode.steve.map((x, i) => Math.max(2.4, (L[`s${i}`]?.duration ?? (1.5 + x.length / 18)) + 0.6));
  const at = [n0 + 0.3]; holds.slice(0, -1).forEach((h, i) => at.push(r(at[i] + h)));
  const nEnd = r(at.at(-1) + holds.at(-1) + 0.6);
  const stampAt = r(at.at(-1) + (L[`s${holds.length - 1}`]?.duration ?? 2) * 0.6);
  // an official figure (optional), with its source, after Steve
  // the figure is on Steve's screen (from 20 November 2026): no separate screen
  const fEnd = nEnd;
  const endAt = V ? r(Math.max(nEnd - 0.3, stampAt + 1.6)) : r(fEnd + 0.2);
  const T = { hk: r(hk), h0at, n0, at, nEnd, fEnd, stampAt, endAt, cd };
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
#s0{left:50%;margin-left:-170px;width:340px;top:1400px}
/* the post itself, small, right under the hook: we see what he said from the first second */
.hpost{position:absolute;left:110px;right:110px;top:700px;background:#fffdf8;border:1px solid #171614;padding:22px 28px 20px;box-shadow:6px 6px 0 rgba(23,22,20,.08);transform:rotate(-1.2deg)}
.hpost .who{display:flex;align-items:center;gap:12px;padding-bottom:10px;border-bottom:1px solid #d9d1c3}
.hpost .av{width:44px;height:44px;border-radius:50%;background:#6b665e;color:#fff;display:grid;place-items:center;font-weight:700;font-size:18px}
.hpost .nm{font-weight:800;font-size:22px;margin:0}.hpost .hd{font-size:16px;color:#7a7368;margin:0}
.hpost p.t{font-size:28px;line-height:1.35;margin-top:10px;color:#171614}
.hpost mark{background:linear-gradient(transparent 60%,#efd27e 60%);font-weight:800}
#s0 .mouth{animation:${talk('h0', h0at) || 'none'}}
#s0 .brows{animation:raise .4s ease-out .2s both}
/* 2. the post, in full */
.post{position:absolute;left:70px;right:70px;top:330px;background:#fffdf8;border:1px solid #171614;padding:34px 40px 30px;box-shadow:8px 8px 0 rgba(23,22,20,.08);transform-origin:50% 75%;transform:translateY(var(--ty,-260px)) scale(.46);animation:fadein .4s ease-out ${T.hk}s both,hide .4s ease-in ${r(T.nEnd - 0.2)}s forwards}
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
/* variant "BREAKING": a market board, Wall Street against Steve's jar, and a ticker with the official figure */
${t.board ? `.post,.nf{display:none}
.tick{position:absolute;left:0;right:0;top:250px;height:62px;background:${RED};color:#fff;overflow:hidden;display:flex;align-items:center;font-size:28px;font-weight:800;letter-spacing:.04em;white-space:nowrap}
.tick b{background:#171614;padding:0 22px;height:100%;display:flex;align-items:center;letter-spacing:.2em;z-index:1}
.tick span{display:inline-block;padding-left:40px;animation:scroll 14s linear ${r(T.n0)}s infinite}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.board{position:absolute;left:70px;right:70px;top:350px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
.pan{border:3px solid #171614;background:#fffdf8;padding:18px 20px 16px;text-align:center;box-shadow:6px 6px 0 rgba(23,22,20,.08)}
.pan .lb{font-size:24px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#57524a}
.pan .val{font-family:F;font-weight:700;font-size:62px;line-height:1.05;margin-top:10px;letter-spacing:-.02em}
.pan .nt{font-size:20px;color:#7a7368;margin-top:6px}
.pan.down{border-color:${RED}}.pan.down .val{color:${RED};animation:fall .9s cubic-bezier(.5,0,.9,.5) ${r(T.n0 + 0.6)}s both}
.pan.up{border-color:#1f7a3a}.pan.up .val{color:#1f7a3a;animation:rise .6s ease-out ${r(T.at[1] + 1.4)}s both}
@keyframes fall{0%{opacity:0;transform:translateY(-60px)}70%{opacity:1;transform:translateY(14px)}100%{transform:none}}
@keyframes rise{0%{opacity:0;transform:translateY(30px) scale(.8)}100%{opacity:1;transform:none}}
.pan .ar{font-size:54px;line-height:1}
.pan.down .ar{color:${RED};animation:bob .8s ease-in-out ${r(T.n0 + 1.5)}s infinite alternate}
.pan.up .ar{color:#1f7a3a;animation:bob .8s ease-in-out ${r(T.at[1] + 2)}s infinite alternate-reverse}
@keyframes bob{to{transform:translateY(10px)}}
.jar{width:150px;margin:6px auto 0}.jar svg{width:100%;height:auto;display:block}
` : ''}
/* the facts, at the top of Steve's screen (the post was on the first screen) */
${t.fact ? `.post{display:none}` : ''}
.nf{position:absolute;left:70px;right:70px;top:300px}
.nf .lb{display:flex;align-items:center;font-size:22px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${RED};padding-bottom:12px;border-bottom:2px solid #171614}
.nf .lb small{margin-left:auto;color:#57524a;letter-spacing:.16em}
.nf .num{font-family:F;font-weight:600;font-size:118px;line-height:1;letter-spacing:-.03em;color:${RED};margin-top:20px}
.nf .txt{font-family:F;font-size:44px;line-height:1.16;margin-top:12px}
.nf .src{font-size:22px;line-height:1.35;color:#57524a;margin-top:16px}
/* (former facts screen) */
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
${V ? `/* VIDEO style: a camera that moves, a countdown, a swipe, no end card */
#end,#s0,.post{display:none}
#h{animation:cam ${T.n0}s linear both,swipeout .35s cubic-bezier(.6,0,.9,.4) ${r(T.n0 - 0.3)}s forwards}
@keyframes cam{from{transform:scale(1)}to{transform:scale(1.07) translateY(-14px)}}
@keyframes swipeout{to{transform:translateX(-1100px) scale(1.07);filter:blur(10px)}}
#h .q{animation:qin .5s cubic-bezier(.2,1.4,.5,1) .15s both}
@keyframes qin{from{opacity:0;transform:translateY(50px) scale(.9)}}
.hpost{transform:rotate(-1.2deg);animation:pin .6s cubic-bezier(.2,1.3,.5,1) .4s both}
@keyframes pin{from{opacity:0;transform:rotate(-6deg) translateY(160px) scale(.85)}}
.hpost mark{background:linear-gradient(#efd27e,#efd27e) no-repeat 0 85%/0% 40%;animation:hl .7s ease-out ${r(h0at + 0.4)}s forwards}
@keyframes hl{to{background-size:100% 40%}}
.cd{position:absolute;inset:0;z-index:5;display:grid;place-items:center;pointer-events:none}
.cd i{position:absolute;top:760px;left:50%;width:400px;height:400px;margin-left:-200px;border-radius:50%;background:${RED};color:#fff;font:700 290px/400px F;font-style:normal;text-align:center;box-shadow:0 18px 0 rgba(23,22,20,.18);opacity:0}
${[0, 1, 2].map((k) => `.cd i:nth-child(${k + 1}){animation:cdn .5s cubic-bezier(.2,1.3,.5,1) ${r(cd + k * 0.5)}s both,hide .1s linear ${r(cd + k * 0.5 + 0.45)}s forwards}`).join('')}
.cd i:nth-child(3){background:#171614}
@keyframes cdn{from{opacity:0;transform:scale(2.2)}to{opacity:1;transform:scale(1)}}
#dim{position:absolute;inset:0;z-index:4;background:rgba(244,240,230,.6);backdrop-filter:blur(5px);opacity:0;animation:fadein .2s ease-out ${cd}s forwards,hide .2s linear ${r(T.n0 - 0.2)}s forwards}
#n{animation:swipein .38s cubic-bezier(.1,.6,.3,1) ${r(T.n0 - 0.2)}s both,cam2 ${r(T.endAt - T.n0 + 0.5)}s linear ${r(T.n0)}s both}
@keyframes swipein{from{transform:translateX(1100px);filter:blur(10px)}to{transform:none;filter:none}}
@keyframes cam2{to{transform:scale(1.035)}}
#n .stamp{animation:stampin .24s cubic-bezier(.5,0,.8,.4) ${T.stampAt}s both}
#shake{position:absolute;inset:0;animation:shake .35s linear ${r(T.stampAt + 0.24)}s both}
@keyframes shake{0%,100%{transform:none}20%{transform:translate(-14px,8px)}40%{transform:translate(12px,-10px)}60%{transform:translate(-8px,6px)}80%{transform:translate(5px,-3px)}}
#s1{animation:bob2 1.6s ease-in-out ${T.n0}s infinite alternate}
@keyframes bob2{to{transform:translateY(-8px)}}
` : ''}
</style>
<div class="mast"><div class="row"><span>Independent satire</span><span>Meanwhile</span><span>${day}</span></div><p class="nm">Big Beautiful <i>Flop</i></p><div class="rule"></div></div>
<div id="h"><p class="q">${mk(t.episode.hook)}</p><div class="hpost"><div class="who"><span class="av">DT</span><div><p class="nm">Donald J. Trump</p><p class="hd">@realDonaldTrump · Truth Social · ${day}</p></div></div>${FULL}</div><div class="m" id="s0">${steve('mug')}</div></div>
<div class="post"><div class="who"><span class="av">DT</span><div><p class="nm" style="margin:0">Donald J. Trump</p><p class="hd" style="margin:0">@realDonaldTrump · Truth Social · ${day}</p></div><span class="tg">THE ORIGINAL</span></div>${FULL}</div>
${V ? `<div id="dim"></div><div class="cd"><i>3</i><i>2</i><i>1</i></div>` : ''}<div id="shake"><div id="n">${t.board ? `<div class="tick"><b>BREAKING</b><span>${(e(t.ticker) + ' · ').repeat(4)}</span></div><div class="board">${[['left', '▼'], ['right', '▲']].map(([k, a]) => { const p = t.board[k]; return `<div class="pan ${p.dir}"><p class="lb">${e(p.label)}</p>${ICONS[p.icon || (k === 'right' ? 'jar' : '')] ? `<div class="jar">${ICONS[p.icon || 'jar']}</div>` : ''}<p class="ar">${p.arrow || a}</p><p class="val">${e(p.value)}</p><p class="nt">${e(p.note)}</p></div>`; }).join('')}</div>` : ''}${t.fact ? `<div class="nf"><p class="lb">The facts <small>Official figures</small></p><p class="num">${e(t.fact.number)}</p><p class="txt">${e(t.fact.text)}</p><p class="src">Source: ${e(t.fact.source)}</p></div>` : ''}<p class="sec">Meanwhile, at a real American kitchen table <small>Satire</small></p><div class="bub">${t.episode.steve.map((x, i) => `<p${i ? ` class="p${i + 1}"` : ''}>${mk(x)}</p>`).join('')}</div><div class="m" id="s1">${steve('bill')}</div><div class="stamp">${stamp}</div></div></div>
${false ? `<div id="f"><p class="sec">The facts <small>Official figures</small></p><p class="num">${e(t.fact.number)}</p><p class="txt">${e(t.fact.text)}</p><p class="src">Source: ${e(t.fact.source)}</p><div class="m" id="s3">${steve('mug')}</div></div>` : ''}
<div id="end"><p class="tl">${e(t.tagline[0])}</p><p class="tl2">${e(t.tagline[1])}</p><div class="m" id="s2">${steve('mug')}</div><div class="rl"></div><p class="url">bigbeautifulflop.com</p></div>
${GRAIN}<script>
window.fit = () => {
  const post = document.querySelector('.post');
  const H = post.offsetHeight;
  const top = Math.max(330, Math.round((1920 - H) / 2 - 170));
  post.style.top = top + 'px';
  post.style.setProperty('--ty', Math.round(815 - top - 0.865 * H) + 'px');
  // the small post on the first screen: its text shrinks until it fits between the hook and Steve
  const hq = document.querySelector('#h .q'), hp = document.querySelector('.hpost');
  hp.style.top = (hq.getBoundingClientRect().bottom + 40) + 'px';
  const V = ${V}, bottom = V ? 1780 : 1370;
  if (V) { hp.style.left = hp.style.right = '80px'; hp.querySelectorAll('p.t').forEach((p) => { p.style.fontSize = '40px'; }); }
  for (let size = V ? 40 : 28; size > 12 && hp.getBoundingClientRect().bottom > bottom; size -= 1) hp.querySelectorAll('p.t').forEach((p) => { p.style.fontSize = size - 1 + 'px'; });
  const big = document.querySelector('.bub');
  for (let size = 58; size > 44 && big.getBoundingClientRect().bottom > 1535; size -= 2) big.style.fontSize = size - 2 + 'px';
};
</script>`;
  return { html, T };
}

// node scripts/social/meanwhile.mjs --statement <slug> <out.mp4> [video|breaking]: a published episode in another style
if (import.meta.url === `file://${process.argv[1]}` && process.argv[2] === '--statement') {
  const [, slug, out, style = 'video'] = process.argv.slice(2);
  const s = loadStatements(path.join(root, 'content/statements')).find((x) => x.slug === slug);
  const { html, opts, voice } = meanwhileVideo(s, { style });
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), 'bbf-meanwhile-'));
  const browser = await chromium.launch();
  await render(await browser.newPage(), work, html, path.resolve(out), opts);
  await browser.close();
  rmSync(work, { recursive: true, force: true });
  console.log(out, opts.duration, voice ? 'with voice' : 'NO VOICE');
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, out] = process.argv.slice(2);
  const t = JSON.parse(readFileSync(path.join(root, 'content/tests', `${slug}.json`), 'utf8'));
  const s = loadStatements(path.join(root, 'content/statements')).find((x) => x.slug === t.base);
  const vdir = path.join(root, 'content/voices', t.voicesFrom || slug);
  const voice = existsSync(path.join(vdir, 'lines.json')) ? JSON.parse(readFileSync(path.join(vdir, 'lines.json'), 'utf8')) : null;
  // BREAKING: the anchor speaks alone, right after the opening sting (2.8 s); Steve's hook comes after him
  const ANCHOR_AT = 2.9;
  if (t.sound === 'news' && t.anchor) {
    const d = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(root, t.anchor)]).toString());
    t.h0at = r(ANCHOR_AT + d + 0.4);
  }
  const { html, T } = meanwhileHtml(t, s, voice);
  const cues = voice ? [['h0', 0.3], ...t.episode.steve.map((_, i) => [`s${i}`, T.at[i]])] : [];
  mkdirSync(path.dirname(out), { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), 'bbf-meanwhile-'));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const cuesH = cues.map(([k, a]) => (k === 'h0' ? [k, T.h0at] : [k, a]));
  const news = t.sound === 'news';
  const anchor = news && t.anchor ? path.join(root, t.anchor) : null;
  await render(page, work, html, out, {
    duration: r(T.endAt + 3.8), end: r(T.endAt + 0.2), coverAt: 1.4,
    ...(news
      ? { opening: 'bbf-news-open.wav', ending: 'bbf-news-end.wav', bed: true, bedFile: 'bbf-news-bed.wav', bedStart: T.n0, bedVolume: 0.3, openingVolume: 0.8 }
      : { bed: true, ...(voice ? { bedVolume: 0.16 } : {}) }),
    fx: [...(anchor ? [{ file: anchor, at: ANCHOR_AT, volume: 1.6 }] : []), { file: 'bbf-stamp.wav', at: r(T.stampAt + 0.26), volume: 1 }, ...cuesH.map(([k, a]) => ({ file: path.join(vdir, `${k}.wav`), at: r(a), volume: 0.95 }))],
  });
  await browser.close();
  rmSync(work, { recursive: true, force: true });
  console.log(out, r(T.endAt + 3.8), voice ? 'with voice' : 'NO VOICE');
}
