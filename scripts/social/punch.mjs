// Episode style "punch" (trial, 26 November 2026): a video, not slides. It grabs from the first frame:
//   0.0 s  the post, whole, and the camera already diving into the highlighted words (impact hit)
//   ~1.4 s a hard cut: the real figure slams in, huge, with its source (second impact)
//   ~3.6 s Steve, his lines as big captions that appear word by word with his voice, then the REALITY CHECK stamp
// A tight synthesised beat under everything (scripts/social/film_sound.mjs), no title card, no end card.
import path from 'node:path';
import { escapeHtml as e } from '../../src/site/html.js';
import { styles, STAMP_ASSET, RED } from './videos.mjs';
import { steve } from './assets/steve.mjs';

const r = (x) => Math.round(x * 100) / 100;

export function punchTimeline(m, voice) {
  const L = voice?.lines || {};
  const DIVE = 1.45, SLAM = 2.3; // the post until DIVE, the figure until DIVE + SLAM
  const s0 = r(DIVE + SLAM);
  const durs = m.steve.map((x, i) => L[`s${i}`]?.duration ?? (1.4 + x.length / 16));
  const at = [r(s0 + 0.35)];
  durs.slice(0, -1).forEach((d, i) => at.push(r(at[i] + d + 0.35)));
  const stampAt = r(at.at(-1) + durs.at(-1) * 0.7);
  const endAt = r(Math.max(at.at(-1) + durs.at(-1) + 0.6, stampAt + 1.4));
  return { DIVE, s0, at, durs, stampAt, endAt };
}

/** The figure that slams in: the official fact, or the right panel of the board. */
const slamOf = (m) => (m.fact
  ? { number: m.fact.number, text: m.fact.text, source: m.fact.source }
  : { number: m.board.right.value, text: `${m.board.right.label}: ${m.board.right.note}`, source: m.ticker || '' });

export function punchHtml(s, voice) {
  const m = s.meanwhile;
  const T = punchTimeline(m, voice);
  const day = new Date(`${s.original.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const TS = !s.original.channel || s.original.channel === 'Truth Social';
  const who = TS ? 'Donald J. Trump' : s.original.speaker;
  const where = TS ? '@realDonaldTrump · Truth Social' : s.original.channel;
  const hl = m.highlight;
  const FULL = s.original.text.map((x) => `<p class="t">${hl ? e(x).replace(e(hl), `<mark>${e(hl)}</mark>`) : e(x)}</p>`).join('');
  const slam = slamOf(m);
  const stamp = STAMP_ASSET.replace('>NEUTRAL<', '>REALITY<').replace('>SWISS<', '>CHECK<').replace('letter-spacing="16"', 'letter-spacing="10"')
    .replace('<path d="M87 94 h18 v20 h20 v18 h-20 v20 h-18 v-20 h-20 v-18 h20 z" fill="#F4F0E6"/>', '<path d="M74 122 l18 18 l30 -38" fill="none" stroke="#F4F0E6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>');
  // Steve's lines as captions: one line at a time, word by word with the voice
  const caps = m.steve.map((x, i) => {
    const punch = /^\*.*\*$/.test(x.trim());
    const words = x.replace(/\*/g, '').split(/\s+/);
    const step = (T.durs[i] * 0.92) / words.length;
    const until = i < m.steve.length - 1 ? `,hide .12s linear ${r(T.at[i + 1] - 0.15)}s forwards` : '';
    return `<p class="cap${punch ? ' pl' : ''}" style="animation:show .01s linear ${r(T.at[i] - 0.05)}s forwards${until}">${words.map((w, k) => `<span style="animation:pop .18s cubic-bezier(.2,1.6,.5,1) ${r(T.at[i] + k * step)}s both">${e(w)}</span>`).join(' ')}</p>`;
  }).join('');
  const talk = m.steve.map((_, i) => (voice?.lines?.[`s${i}`] ? `talk .15s ease-in-out ${T.at[i]}s ${Math.max(2, Math.round(T.durs[i] / 0.15))} alternate` : '')).filter(Boolean).join(',') || 'none';
  const html = `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 330, boxSize: 38, hookSize: 92, titleAnim: false })}
body{background:#111}
@keyframes show{from{opacity:1}to{opacity:1}}
@keyframes hide{to{opacity:0}}
@keyframes pop{from{opacity:0;transform:scale(1.8) translateY(-20px)}to{opacity:1;transform:none}}
.sc{position:absolute;inset:0;overflow:hidden}
/* 1. the post, and the camera diving into the highlight */
#p{background:radial-gradient(circle at 50% 40%,#2b2b2b,#0b0b0b);animation:hide .01s linear ${T.DIVE}s forwards}
#p .cam{position:absolute;inset:0;transform-origin:var(--ox,50%) var(--oy,50%);animation:dive ${T.DIVE}s cubic-bezier(.55,0,.75,.2) 0s both}
@keyframes dive{0%{transform:scale(1.02) rotate(-1deg)}100%{transform:scale(var(--z,2.6)) rotate(0)}}
.card{position:absolute;left:60px;right:60px;top:300px;background:#fff;border-radius:28px;padding:36px 40px 30px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.card .who{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid #e3e0da}
.card .av{width:64px;height:64px;border-radius:50%;background:#5b5650;color:#fff;display:grid;place-items:center;font-weight:800;font-size:24px}
.card .nm{font-weight:800;font-size:30px}.card .hd{font-size:22px;color:#77716a}
.card p.t{font-size:34px;line-height:1.38;margin-top:14px;color:#171614}
.card mark{color:#171614;background:linear-gradient(#ffd84d,#ffd84d) no-repeat 0 90%/0% 45%;animation:hl .45s ease-out .35s forwards;font-weight:800}
@keyframes hl{to{background-size:100% 90%}}
.lbl{position:absolute;z-index:5;left:0;right:0;top:0;padding:110px 0 26px;background:linear-gradient(#0b0b0b 70%,rgba(11,11,11,0));text-align:center;font-weight:900;font-size:46px;letter-spacing:.12em;color:#fff;text-transform:uppercase;text-shadow:0 4px 0 #000}
.lbl b{background:${RED};padding:6px 20px}
#flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:20;animation:fl .22s linear ${r(T.DIVE - 0.04)}s both,fl .22s linear ${r(T.s0 - 0.04)}s both}
@keyframes fl{0%{opacity:0}20%{opacity:1}100%{opacity:0}}
/* 2. the real figure */
#f{background:${RED};opacity:0;animation:show .01s linear ${T.DIVE}s forwards,hide .01s linear ${T.s0}s forwards}
#f .k{position:absolute;left:0;right:0;top:330px;text-align:center;font-weight:900;font-size:54px;letter-spacing:.3em;color:#fff;animation:pop .3s cubic-bezier(.2,1.6,.5,1) ${r(T.DIVE + 0.05)}s both}
#f .n{position:absolute;left:0;right:0;top:520px;text-align:center;font-family:F;font-weight:800;font-size:330px;line-height:1;letter-spacing:-.04em;color:#fff;animation:slam .35s cubic-bezier(.3,0,.7,1) ${r(T.DIVE + 0.1)}s both,shk .3s linear ${r(T.DIVE + 0.45)}s both}
@keyframes slam{from{opacity:0;transform:scale(3.2) rotate(-6deg)}to{opacity:1;transform:rotate(-2deg)}}
@keyframes shk{0%,100%{translate:0 0}25%{translate:-16px 10px}50%{translate:14px -12px}75%{translate:-8px 6px}}
#f .x{position:absolute;left:90px;right:90px;top:960px;text-align:center;font-family:F;font-weight:600;font-size:58px;line-height:1.15;color:#fff;animation:pop .3s ease-out ${r(T.DIVE + 0.55)}s both}
#f .src{position:absolute;left:90px;right:90px;top:1560px;text-align:center;font-size:30px;line-height:1.35;color:rgba(255,255,255,.85);animation:pop .3s ease-out ${r(T.DIVE + 0.8)}s both}
/* 3. Steve */
#s{background:#f4f0e6;opacity:0;animation:show .01s linear ${T.s0}s forwards}
#s .cam{position:absolute;inset:0;animation:drift ${r(T.endAt - T.s0)}s linear ${T.s0}s both}
@keyframes drift{from{transform:scale(1.06)}to{transform:scale(1)}}
#s .top{position:absolute;left:60px;right:60px;top:110px;display:flex;justify-content:space-between;align-items:center;font-weight:900;font-size:30px;letter-spacing:.14em;text-transform:uppercase;border:0;padding:0}
#s .top .b{font-family:F;font-size:44px;letter-spacing:-.02em;text-transform:uppercase}#s .top .b i{color:${RED};text-transform:none}
#s .top .sat{color:#57524a;font-size:24px}
.cap{position:absolute;left:60px;right:60px;top:310px;opacity:0;font-family:F;font-weight:700;font-size:112px;line-height:1.05;letter-spacing:-.02em;color:#171614}
.cap span{display:inline-block}.cap.pl{color:${RED};font-style:italic}
.who2{position:absolute;left:60px;top:250px;font-weight:900;font-size:26px;letter-spacing:.2em;color:${RED}}
.m{position:absolute;left:40px;bottom:-30px;width:520px}
.mn{width:100%;height:auto;display:block;overflow:visible}
.m .eyes{animation:blink 3.4s steps(1) infinite}
@keyframes blink{0%,94%{transform:scaleY(1)}95%,99%{transform:scaleY(.1)}}
.m .mouth{transform:scaleY(.35);animation:${talk}}
@keyframes talk{from{transform:scaleY(.35)}to{transform:scaleY(1.25)}}
.mini{position:absolute;right:50px;bottom:560px;width:440px;background:#fff;border:3px solid #171614;border-radius:20px;padding:18px 22px;box-shadow:8px 8px 0 rgba(0,0,0,.12)}
.mini .n{font-family:F;font-weight:800;font-size:76px;color:${RED};line-height:1}.mini .t{font-size:22px;line-height:1.3;margin-top:6px;color:#57524a}
.stamp{position:absolute;right:40px;bottom:220px;width:560px;transform:rotate(-8deg);opacity:0;animation:stampin .22s cubic-bezier(.5,0,.8,.4) ${T.stampAt}s both}
.stamp svg{width:100%;height:auto;display:block}
@keyframes stampin{from{opacity:0;transform:rotate(-14deg) scale(2.8)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
#s .shake{position:absolute;inset:0;animation:shk .35s linear ${r(T.stampAt + 0.22)}s both}
</style>
<div class="sc" id="p"><div class="cam"><div class="card"><div class="who"><span class="av">${e(who.split(/\s+/).map((w) => w[0]).join('').slice(0, 2))}</span><div><p class="nm">${e(who)}</p><p class="hd">${e(where)} · ${e(day)}</p></div></div>${FULL}</div></div><p class="lbl"><b>${TS ? 'Trump' : e(who)}</b> said it</p></div>
<div class="sc" id="f"><p class="k">REALITY</p><p class="n">${e(slam.number)}</p><p class="x">${e(slam.text)}</p><p class="src">Source: ${e(slam.source)}</p></div>
<div class="sc" id="s"><div class="shake"><div class="cam"><div class="top"><span class="b">Big Beautiful <i>Flop</i></span><span class="sat">Satire</span></div><p class="who2">STEVE, A REGULAR AMERICAN</p>${caps}<div class="mini"><p class="n">${e(slam.number)}</p><p class="t">${e(slam.source)}</p></div><div class="m">${steve('bill')}</div><div class="stamp">${stamp}</div></div></div></div>
<div id="flash"></div>
<script>
window.fit = () => {
  // the whole post fits the card; the camera dives towards the highlighted words
  const card = document.querySelector('.card');
  for (let size = 34; size > 14 && card.getBoundingClientRect().bottom > 1820; size -= 1) card.querySelectorAll('p.t').forEach((p) => { p.style.fontSize = size - 1 + 'px'; });
  const mk = card.querySelector('mark'), cam = document.querySelector('#p .cam');
  if (mk) {
    const b = mk.getBoundingClientRect();
    cam.style.setProperty('--ox', (b.left + b.width / 2) + 'px');
    cam.style.setProperty('--oy', (b.top + b.height / 2) + 'px');
    cam.style.setProperty('--z', Math.min(3.4, Math.max(1.6, 940 / Math.max(b.width, 300))).toFixed(2));
  }
  for (const c of document.querySelectorAll('.cap')) for (let size = 112; size > 56 && c.getBoundingClientRect().height > 640; size -= 4) c.style.fontSize = size - 4 + 'px';
};
</script>`;
  return { html, T };
}

/** Render options: the beat from the first frame, impacts on the two cuts, Steve's voice, the stamp. No hook voice. */
export function punchOpts(m, voice, T) {
  return {
    duration: T.endAt, end: T.endAt, coverAt: 0.9, ending: null,
    opening: 'bbf-punch.wav', openingEnd: T.endAt, openingVolume: 0.32, bed: false,
    fx: [{ file: 'bbf-boom.wav', at: 0, volume: 0.9 }, { file: 'bbf-boom.wav', at: r(T.DIVE), volume: 1 }, { file: 'bbf-boom.wav', at: r(T.s0), volume: 0.55 },
      { file: 'bbf-stamp.wav', at: r(T.stampAt + 0.22), volume: 1 },
      ...(voice ? m.steve.map((_, i) => ({ file: path.join(voice.dir, `s${i}.wav`), at: T.at[i], volume: 1 })) : [])],
  };
}
