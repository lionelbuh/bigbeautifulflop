// Episode style "short" (trial, 26 November 2026): about 18 s, the newspaper look, little text at a time and big,
// for an older audience. Steve's voice from the first second. No countdown, no title card.
//   0 s     the hook as a front-page headline, and Steve's situation next to it (his voice reads the hook)
//   ~2.4 s  the promise: the highlighted words of the post, exact, as a big clipping (the full post is on the site)
//   ~6 s    the reality: the two accounts, one under the other (the board), with the official figure
//   then    Steve, his last lines as big captions with his voice
//   end     BIG BEAUTIFUL FLOP and the REALITY CHECK stamp
import path from 'node:path';
import { escapeHtml as e } from '../../src/site/html.js';
import { styles, STAMP_ASSET, RED, GRAIN } from './videos.mjs';
import { steve } from './assets/steve.mjs';

const r = (x) => Math.round(x * 100) / 100;
const INK = '#1d1a16', PAPER = '#efe6d2', GREEN = '#1f6b35';

export function shortTimeline(m, voice) {
  const L = voice?.lines || {};
  const d = (k, x) => L[k]?.duration ?? (1.4 + x.length / 16);
  const h0 = d('h0', m.hook.replace(/\*/g, ''));
  const P = 2.4; // the promise
  const R = r(Math.max(6, 0.2 + h0 + 0.5)); // the reality
  const lines = m.steve.map((x, i) => d(`s${i}`, x));
  const s0at = r(R + 0.9);
  const D = r(Math.max(R + 4.5, s0at + lines[0] + 0.4)); // Steve
  const at = [s0at, r(D + 0.3)];
  for (let i = 2; i < lines.length; i++) at.push(r(at[i - 1] + lines[i - 1] + 0.35));
  const E = r(at.at(-1) + lines.at(-1) + 0.4); // the end card
  return { P, R, D, E, at, lines, h0, end: r(E + 2.2) };
}

const plain = (x) => x.replace(/\*/g, '');
const headlineOf = (m) => plain(m.hook.split(/\s*\*/)[0]).trim();
/** The two accounts: the board, or the claim against the official figure. */
const accountsOf = (m) => (m.board
  ? [m.board.left, m.board.right]
  : [{ label: 'Trump says', value: m.highlight, dir: 'up' }, { label: 'Reality', value: m.fact.number, dir: 'down', note: m.fact.text }]);

export function shortHtml(s, voice) {
  const m = s.meanwhile;
  const T = shortTimeline(m, voice);
  const day = new Date(`${s.original.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const TS = !s.original.channel || s.original.channel === 'Truth Social';
  const who = TS ? 'Donald J. Trump' : s.original.speaker;
  const where = TS ? 'Truth Social' : s.original.channel;
  const [A, B] = accountsOf(m);
  const fig = m.fact ? `${m.fact.number} ${m.fact.text}` : '';
  const src = m.fact ? m.fact.source : '';
  const stamp = STAMP_ASSET.replace('>NEUTRAL<', '>REALITY<').replace('>SWISS<', '>CHECK<').replace('letter-spacing="16"', 'letter-spacing="10"')
    .replace('<path d="M87 94 h18 v20 h20 v18 h-20 v20 h-18 v-20 h-20 v-18 h20 z" fill="#F4F0E6"/>', '<path d="M74 122 l18 18 l30 -38" fill="none" stroke="#F4F0E6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>');
  const caps = m.steve.slice(1).map((x, j) => {
    const i = j + 1, last = i === m.steve.length - 1;
    const words = plain(x).split(/\s+/), step = (T.lines[i] * 0.9) / words.length;
    const until = last ? '' : `,hide .12s linear ${r(T.at[i + 1] - 0.15)}s forwards`;
    return `<p class="cap${/^\*.*\*$/.test(x.trim()) ? ' pl' : ''}" style="animation:on .01s linear ${r(T.at[i] - 0.05)}s forwards${until}">${words.map((w, k) => `<span style="animation:pop .2s cubic-bezier(.2,1.5,.5,1) ${r(T.at[i] + k * step)}s both">${e(w)}</span>`).join(' ')}</p>`;
  }).join('');
  const talk = (ks) => ks.map(([k, a, dur]) => (voice?.lines?.[k] ? `talk .15s ease-in-out ${a}s ${Math.max(2, Math.round(dur / 0.15))} alternate` : '')).filter(Boolean).join(',') || 'none';
  const mast = (big) => `<div class="mast${big ? ' big' : ''}"><div class="row"><span>${e(day)}</span><span>Independent satire</span></div><p class="nm">Big Beautiful <i>Flop</i></p><div class="rule"></div></div>`;
  const html = `<!doctype html><meta charset="utf-8"><style>
${styles({ stageTop: 330, boxSize: 38, hookSize: 92, titleAnim: false })}
body{background:${PAPER};color:${INK}}
.grain{position:absolute;inset:0;width:1080px;height:1920px;opacity:.35;pointer-events:none;z-index:30}
@keyframes on{to{opacity:1}}
@keyframes hide{to{opacity:0}}
@keyframes pop{from{opacity:0;transform:scale(1.6)}to{opacity:1;transform:none}}
@keyframes slam{from{opacity:0;transform:scale(2.4) rotate(-4deg)}to{opacity:1;transform:none}}
@keyframes shk{0%,100%{translate:0 0}25%{translate:-14px 9px}50%{translate:12px -10px}75%{translate:-7px 5px}}
@keyframes push{from{transform:scale(1)}to{transform:scale(1.05)}}
.sc{position:absolute;inset:0;opacity:0}
.mast{position:absolute;left:60px;right:60px;top:70px;text-align:center}
.mast .row{display:flex;justify-content:space-between;font-size:24px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#5a5247;padding-bottom:10px;border-bottom:2px solid ${INK}}
.mast .nm{font-family:F;font-weight:700;font-size:64px;letter-spacing:-.02em;text-transform:uppercase;margin:10px 0 8px}
.mast .nm i{color:${RED};text-transform:none;font-weight:600}
.mast .rule{border-bottom:6px double ${INK}}
.m{position:absolute}.mn{width:100%;height:auto;display:block;overflow:visible}
.m .eyes{animation:blink 3.4s steps(1) infinite}
@keyframes blink{0%,94%{transform:scaleY(1)}95%,99%{transform:scaleY(.1)}}
.m .mouth{transform:scaleY(.35)}
@keyframes talk{from{transform:scaleY(.35)}to{transform:scaleY(1.25)}}
/* 1. the front page and Steve's situation */
#h{opacity:1;animation:hide .01s linear ${T.P}s forwards}
#h .in{position:absolute;inset:0;animation:push ${T.P}s linear both}
#h .hl{position:absolute;left:60px;right:60px;top:300px;font-family:F;font-weight:800;font-size:118px;line-height:.98;letter-spacing:-.03em;text-transform:uppercase;animation:punchin .3s cubic-bezier(.2,1.4,.5,1) 0s both}
@keyframes punchin{from{transform:scale(1.07)}to{transform:none}}
#h .dek{position:absolute;left:60px;right:60px;top:1010px;border-top:3px solid ${INK};padding-top:14px;font-weight:900;font-size:34px;letter-spacing:.14em;text-transform:uppercase;color:${RED}}
#h .m{left:40px;top:1080px;width:400px}
#h .m .mouth{animation:${talk([['h0', 0.2, T.h0]])}}
#h .sign{position:absolute;right:60px;top:1160px;width:520px;border:5px solid ${RED};background:#fffaf0;padding:22px 24px;text-align:center;transform:rotate(3deg);animation:slam .3s cubic-bezier(.3,0,.7,1) .55s both,shk .3s linear .85s both}
.sign .l{font-weight:900;font-size:36px;letter-spacing:.08em;text-transform:uppercase}
.sign .v{font-family:F;font-weight:800;font-size:132px;line-height:1;color:${RED};margin-top:4px}
/* 2. the promise */
#p{animation:on .01s linear ${T.P}s forwards,hide .01s linear ${T.R}s forwards}
#p .k{position:absolute;left:60px;right:60px;top:330px;font-weight:900;font-size:40px;letter-spacing:.2em;text-transform:uppercase;color:${RED}}
#p .clip{position:absolute;left:60px;right:60px;top:420px;background:#fffaf0;border:2px solid ${INK};padding:56px 52px;box-shadow:12px 12px 0 rgba(29,26,22,.15);transform:rotate(-1.5deg);animation:slam .35s cubic-bezier(.3,0,.7,1) ${T.P}s both}
#p .q{font-family:F;font-weight:700;font-size:124px;line-height:1.06;letter-spacing:-.02em}
#p .q mark{color:${INK};background:linear-gradient(#f4cf52,#f4cf52) no-repeat 0 88%/0% 42%;animation:hl .5s ease-out ${r(T.P + 0.45)}s forwards}
@keyframes hl{to{background-size:100% 42%}}
#p .by{margin-top:34px;font-size:34px;font-weight:700;color:#5a5247}
#p .full{position:absolute;left:60px;right:60px;top:1500px;text-align:center;font-size:30px;color:#5a5247}
/* 3. the reality: two accounts */
#r{animation:on .01s linear ${T.R}s forwards,hide .01s linear ${T.D}s forwards}
#r .k{position:absolute;left:60px;right:60px;top:320px;font-weight:900;font-size:40px;letter-spacing:.2em;text-transform:uppercase}
.acc{position:absolute;left:60px;right:60px;border:6px solid;background:#fffaf0;padding:26px 34px;display:flex;align-items:center;gap:26px}
.acc .l{font-weight:900;font-size:44px;letter-spacing:.06em;text-transform:uppercase;flex:1;line-height:1.1}
.acc .v{font-family:F;font-weight:800;font-size:124px;line-height:1;letter-spacing:-.02em}
.acc.a{top:400px;border-color:${GREEN};color:${GREEN};animation:slam .35s cubic-bezier(.3,0,.7,1) ${r(T.R + 0.1)}s both}
.acc.b{top:700px;border-color:${RED};color:${RED};animation:slam .35s cubic-bezier(.3,0,.7,1) ${r(T.R + 1.1)}s both,shk .3s linear ${r(T.R + 1.45)}s both}
.acc .l small{display:block;font-size:28px;font-weight:700;letter-spacing:0;text-transform:none;color:#5a5247;margin-top:6px}
#r .fig{position:absolute;left:60px;right:60px;top:1010px;font-family:F;font-weight:600;font-size:52px;line-height:1.15;animation:pop .3s ease-out ${r(T.R + 2)}s both}
#r .src{position:absolute;left:60px;right:60px;top:1330px;font-size:26px;line-height:1.35;color:#5a5247;animation:pop .3s ease-out ${r(T.R + 2.2)}s both}
#r .m{right:40px;left:auto;bottom:-60px;width:430px}
#r .m .mouth{animation:${talk([['s0', T.at[0], T.lines[0]]])}}
/* 4. Steve */
#d{animation:on .01s linear ${T.D}s forwards,hide .01s linear ${T.E}s forwards}
#d .k{position:absolute;left:60px;top:330px;font-weight:900;font-size:34px;letter-spacing:.18em;color:${RED}}
.cap{position:absolute;left:60px;right:60px;top:400px;opacity:0;font-family:F;font-weight:800;font-size:112px;line-height:1.03;letter-spacing:-.02em}
.cap span{display:inline-block}.cap.pl{color:${RED};font-style:italic}
#d .m{left:250px;bottom:-40px;width:580px}
#d .m .mouth{animation:${talk(m.steve.slice(1).map((_, j) => [`s${j + 1}`, T.at[j + 1], T.lines[j + 1]]))}}
/* 5. the end */
#e{animation:on .01s linear ${T.E}s forwards}
#e .mast{top:520px;animation:slam .35s cubic-bezier(.3,0,.7,1) ${T.E}s both}
#e .mast .nm{font-size:110px}
#e .tl{position:absolute;left:60px;right:60px;top:860px;text-align:center;font-family:F;font-size:62px;line-height:1.15}
#e .tl i{color:${RED}}
#e .stamp{position:absolute;left:260px;top:1150px;width:560px;transform:rotate(-8deg);animation:stampin .22s cubic-bezier(.5,0,.8,.4) ${r(T.E + 0.6)}s both}
#e .stamp svg{width:100%;height:auto;display:block}
@keyframes stampin{from{opacity:0;transform:rotate(-14deg) scale(2.8)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
#e .url{position:absolute;left:0;right:0;top:1640px;text-align:center;font-size:36px;font-weight:800;letter-spacing:.04em}
#flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:20;${[T.P, T.R, T.D, T.E].map((t) => '').join('')}animation:${[T.P, T.R, T.E].map((t) => `fl .2s linear ${r(t - 0.03)}s both`).join(',')}}
@keyframes fl{0%{opacity:0}25%{opacity:.85}100%{opacity:0}}
</style>
<div class="sc" id="h"><div class="in">${mast()}<p class="hl">${e(headlineOf(m))}</p><p class="dek">Meanwhile, at Steve’s kitchen table…</p><div class="m">${steve('bill')}</div><div class="sign"><p class="l">${e(B.label)}</p><p class="v">${e(B.value)}</p></div></div></div>
<div class="sc" id="p">${mast()}<p class="k">${e(who)} wrote</p><div class="clip"><p class="q">“…<mark>${e(m.highlight)}</mark>…”</p><p class="by">${e(who)}, ${e(where)}, ${e(day)}</p></div><p class="full">The full post: bigbeautifulflop.com</p></div>
<div class="sc" id="r">${mast()}<p class="k">The two accounts</p><div class="acc a"><p class="l">${e(A.label)}${A.note ? `<small>${e(A.note)}</small>` : ''}</p><p class="v">${e(A.value)}</p></div><div class="acc b"><p class="l">${e(B.label)}${B.note ? `<small>${e(B.note)}</small>` : ''}</p><p class="v">${e(B.value)}</p></div>${fig ? `<p class="fig">${e(fig)}</p><p class="src">Source: ${e(src)}</p>` : ''}<div class="m">${steve('mug')}</div></div>
<div class="sc" id="d">${mast()}<p class="k">STEVE, A REGULAR AMERICAN · SATIRE</p>${caps}<div class="m">${steve('bill')}</div></div>
<div class="sc" id="e">${mast(true)}<p class="tl">Politicians say it.<br><i>Real people pay for it.</i></p><div class="stamp">${stamp}</div><p class="url">bigbeautifulflop.com</p></div>
<div id="flash"></div>${GRAIN}
<script>
window.fit = () => {
  const fitTo = (el, max, min, limit) => { for (let z = max; z > min && el.getBoundingClientRect().bottom > limit; z -= 4) el.style.fontSize = z - 4 + 'px'; };
  fitTo(document.querySelector('#h .hl'), 118, 60, 990);
  fitTo(document.querySelector('#p .q'), 124, 44, 1300);
  document.querySelectorAll('.acc .v').forEach((v) => { for (let z = 124; z > 40 && v.scrollWidth > 560; z -= 4) v.style.fontSize = z - 4 + 'px'; });
  for (const c of document.querySelectorAll('.cap')) fitTo(c, 112, 56, 1180);
};
</script>`;
  return { html, T };
}

/** Render options: the hook voice from the first second, the beat underneath, impacts on the cuts. */
export function shortOpts(m, voice, T) {
  const v = (k, at) => (voice ? [{ file: path.join(voice.dir, `${k}.wav`), at, volume: 1 }] : []);
  return {
    duration: T.end, end: T.end, coverAt: 0.6, ending: null,
    opening: 'bbf-punch.wav', openingEnd: T.end, openingVolume: 0.22, bed: false,
    fx: [{ file: 'bbf-boom.wav', at: 0, volume: 0.7 }, { file: 'bbf-boom.wav', at: r(T.R + 1.1), volume: 0.8 }, { file: 'bbf-boom.wav', at: T.E, volume: 0.6 },
      { file: 'bbf-stamp.wav', at: r(T.E + 0.82), volume: 1 },
      ...v('h0', 0.2), ...m.steve.flatMap((_, i) => v(`s${i}`, T.at[i]))],
  };
}
