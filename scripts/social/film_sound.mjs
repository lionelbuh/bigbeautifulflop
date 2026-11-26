// The sounds of the episode style "film" (silent film), synthesised here (no samples, no recordings):
//   bbf-film.wav   projector clatter from 0 s, then an original piano waltz in A minor from 1.5 s (after the 3-2-1 leader)
//   bbf-plonk.wav  the waltz breaks down on a low dissonant piano chord when the film turns into colour (reality)
//   node scripts/social/film_sound.mjs
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sound');
const SR = 44100;
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
function piano(L, t0, note, vel = 0.3, dur = 1.6) {
  const f = midi(note), s0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  for (let i = 0; i < n && s0 + i < L.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 300) * (Math.exp(-t * 2.2) * 0.7 + Math.exp(-t * 9) * 0.3) * Math.min(1, (n - i) / (0.08 * SR));
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * f * h * Math.sqrt(1 + 0.0004 * h * h) * t) * Math.exp(-t * h * 0.9) / (h * 1.3);
    L[s0 + i] += v * env * vel;
  }
}
function save(L, file, level = 0.7) {
  let peak = 0;
  for (const x of L) peak = Math.max(peak, Math.abs(x));
  const g = level / peak, data = Buffer.alloc(L.length * 4);
  for (let i = 0; i < L.length; i++) { const s = Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767); data.writeInt16LE(s, i * 4); data.writeInt16LE(s, i * 4 + 2); }
  const hd = Buffer.alloc(44);
  hd.write('RIFF', 0); hd.writeUInt32LE(36 + data.length, 4); hd.write('WAVE', 8); hd.write('fmt ', 12); hd.writeUInt32LE(16, 16); hd.writeUInt16LE(1, 20); hd.writeUInt16LE(2, 22);
  hd.writeUInt32LE(SR, 24); hd.writeUInt32LE(SR * 4, 28); hd.writeUInt16LE(4, 32); hd.writeUInt16LE(16, 34); hd.write('data', 36); hd.writeUInt32LE(data.length, 40);
  writeFileSync(path.join(dir, file), Buffer.concat([hd, data]));
}

// the waltz: long enough for any post (the video cuts it when the film turns into colour)
const TOTAL = 24;
const L = new Float32Array(TOTAL * SR);
const BAR = 1.25, b3 = BAR / 3;
const PROG = [
  [45, [57, 60, 64]], [50, [57, 62, 65]], [40, [56, 59, 62]], [45, [57, 60, 64]],
  [41, [57, 60, 65]], [48, [55, 60, 64]], [40, [56, 59, 62]], [45, [57, 60, 64]],
];
const MEL = [
  [[0, 76, 2], [2, 72, 1]], [[0, 74, 2], [2, 77, 1]], [[0, 76, 1], [1, 74, 1], [2, 71, 1]], [[0, 72, 3]],
  [[0, 77, 2], [2, 76, 1]], [[0, 76, 1], [1, 72, 1], [2, 79, 1]], [[0, 74, 1], [1, 71, 1], [2, 68, 1]], [[0, 69, 3]],
];
for (let bar = 0, t = 1.5; t < TOTAL - 1; bar++, t += BAR) {
  const [bass, ch] = PROG[bar % 8];
  piano(L, t, bass, 0.38, 1.2);
  for (const k of [1, 2]) ch.forEach((n) => piano(L, t + k * b3, n, 0.12, 0.5));
  for (const [beat, n, len] of MEL[bar % 8]) piano(L, t + beat * b3, n, 0.3, len * b3 + 0.4);
}
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
for (let i = 0; i < L.length; i++) { const ph = ((i / SR) * 18) % 1; L[i] += rnd() * (ph < 0.06 ? 0.05 : 0.006); }
save(L, 'bbf-film.wav');

// the plonk: a low cluster, both hands, slightly out of time
const P = new Float32Array(Math.round(2.6 * SR));
[[0, 33, 0.6], [0.02, 34, 0.5], [0.03, 40, 0.45], [0.05, 46, 0.4], [0.06, 47, 0.35]].forEach(([dt, n, v]) => piano(P, dt, n, v, 2.5));
save(P, 'bbf-plonk.wav', 0.8);
console.log('bbf-film.wav, bbf-plonk.wav');

// ---- the episode style "punch" (from 26 November 2026): a tight beat and an impact hit, also synthesised here
//   bbf-punch.wav  kick on every beat, sub bass, off-beat hats, a riser into the drop (120 bpm, 30 s)
//   bbf-boom.wav   the impact: a falling sub thump, a noise crack and a short tail
{
  const D = 30, B = new Float32Array(D * SR), beat = 0.5;
  let s2 = 3; const rn = () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const kick = (t0, v = 1) => { const s0 = Math.round(t0 * SR); for (let i = 0; i < 0.35 * SR && s0 + i < B.length; i++) { const t = i / SR; B[s0 + i] += Math.sin(2 * Math.PI * (45 + 110 * Math.exp(-t * 30)) * t) * Math.exp(-t * 9) * v; } };
  const hat = (t0, v = 0.12) => { const s0 = Math.round(t0 * SR); for (let i = 0; i < 0.05 * SR && s0 + i < B.length; i++) B[s0 + i] += rn() * Math.exp(-(i / SR) * 80) * v; };
  const bass = (t0, n, len) => { const f = midi(n), s0 = Math.round(t0 * SR); for (let i = 0; i < len * SR && s0 + i < B.length; i++) { const t = i / SR; B[s0 + i] += Math.tanh(2.2 * Math.sin(2 * Math.PI * f * t)) * 0.22 * Math.min(1, t * 80) * Math.min(1, (len - t) * 20); } };
  const line = [33, 33, 36, 31];
  for (let k = 0, t = 0; t < D - 0.5; k++, t += beat) {
    kick(t, k % 4 === 0 ? 1 : 0.8);
    hat(t + beat / 2);
    if (k % 2 === 0) bass(t, line[Math.floor(k / 8) % 4], beat * 1.8);
    if (k % 8 === 6) hat(t + beat * 0.75, 0.08);
  }
  save(B, 'bbf-punch.wav', 0.75);
  const X = new Float32Array(Math.round(1.6 * SR));
  for (let i = 0; i < X.length; i++) { const t = i / SR; X[i] = Math.sin(2 * Math.PI * (38 + 140 * Math.exp(-t * 14)) * t) * Math.exp(-t * 3.2) + rn() * Math.exp(-t * 40) * 0.6 + rn() * Math.exp(-t * 6) * 0.05; }
  save(X, 'bbf-boom.wav', 0.9);
  console.log('bbf-punch.wav, bbf-boom.wav');
}
