"""The "BREAKING" sound of the videos (from 22 November 2026): a news opening sting, a news-room tick-tock bed,
and an ending sting that flops. Synthesised here (no samples, no licence questions).
    python3 scripts/social/news_sound.py scripts/social/sound
"""
import sys, wave
import numpy as np

SR = 44100

def save(name, sig, peak=0.85):
    sig = sig / (np.abs(sig).max() + 1e-9) * peak
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((sig * 32767).astype(np.int16).tobytes())

def t_(d):
    return np.arange(int(d * SR)) / SR

def env(n, a=0.005, r=0.3):
    e = np.ones(n); ai = int(a * SR); ri = int(r * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri and ri < n: e[-ri:] = np.linspace(1, 0, ri)
    return e

def brass(freqs, d, bright=1.0):
    t = t_(d); s = np.zeros_like(t)
    for f in freqs:
        for k in range(1, 9):  # sawtooth-like, a bit softened
            s += (bright ** (k - 1)) * np.sin(2 * np.pi * f * k * t * (1 + 0.002 * np.sin(2 * np.pi * 5 * t))) / k
    return s * env(len(t), 0.02, min(0.25, d * 0.6))

def boom(d=1.2, f=52):
    t = t_(d)
    return np.sin(2 * np.pi * f * t * (1 - 0.25 * t)) * np.exp(-t * 3.2)

def noise(d, seed=1):
    return np.random.default_rng(seed).normal(size=int(d * SR))

def place(track, sig, at, gain=1.0):
    i = int(at * SR); j = min(len(track), i + len(sig))
    track[i:j] += sig[:j - i] * gain

def hz(n):  # MIDI note to Hz
    return 440 * 2 ** ((n - 69) / 12)

def opening():
    d = 2.8; tr = np.zeros(int(d * SR))
    # a riser (noise swelling, filtered by a moving average) then the hits
    r = noise(0.7, 3); r = np.convolve(r, np.ones(30) / 30, mode='same') * np.linspace(0, 1, len(r)) ** 2
    place(tr, r, 0.0, 0.5)
    place(tr, boom(), 0.7, 1.0)
    chord = [hz(n) for n in (50, 57, 62, 66)]  # D major, low brass
    for at, dd, g in ((0.7, 0.18, 0.9), (0.95, 0.18, 0.9), (1.2, 1.5, 1.0)):
        place(tr, brass(chord, dd, 0.9), at, g * 0.25)
    place(tr, boom(1.5, 46), 1.2, 0.8)
    # a bright stab on top
    place(tr, brass([hz(74), hz(78)], 1.2, 0.8), 1.2, 0.12)
    return tr * env(len(tr), 0.001, 0.5)

def bed(d=46.0):
    tr = np.zeros(int(d * SR)); beat = 0.5
    click = lambda f: np.sin(2 * np.pi * f * t_(0.03)) * np.exp(-t_(0.03) * 160)
    for k in range(int(d / beat)):
        place(tr, click(2400 if k % 2 == 0 else 1800), k * beat, 0.5)          # tick, tock
        if k % 4 == 0:
            place(tr, np.sin(2 * np.pi * hz(38) * t_(0.45)) * np.exp(-t_(0.45) * 5), k * beat, 0.5)  # a low pulse
    pad = np.sin(2 * np.pi * hz(62) * t_(d)) * 0.04 + np.sin(2 * np.pi * hz(69) * t_(d)) * 0.03
    return (tr + pad) * env(len(tr), 0.5, 1.5)

def ending():
    d = 3.6; tr = np.zeros(int(d * SR))
    chord = [hz(n) for n in (50, 57, 62, 66)]
    place(tr, boom(), 0.0, 0.9)
    place(tr, brass(chord, 0.9, 0.9), 0.0, 0.25)
    # then the flop: the chord slides down and runs out of air
    t = t_(2.2); s = np.zeros_like(t)
    for f in chord:
        ph = 2 * np.pi * np.cumsum(f * (1 - 0.45 * (t / t[-1]) ** 1.5)) / SR
        for k in range(1, 7):
            s += np.sin(k * ph) / k
    s *= np.exp(-t * 1.2) * (1 - 0.5 * (np.sin(2 * np.pi * 6 * t) > 0))  # a wobble
    place(tr, s, 1.0, 0.18)
    return tr * env(len(tr), 0.001, 0.4)

if __name__ == '__main__':
    out = sys.argv[1]
    save(f'{out}/bbf-news-open.wav', opening())
    save(f'{out}/bbf-news-bed.wav', bed(), 0.5)
    save(f'{out}/bbf-news-end.wav', ending())
    print('ok')
