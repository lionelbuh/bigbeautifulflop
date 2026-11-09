# Big Beautiful Flop sound logo: a presidential fanfare (opening) and the same fanfare that flops (ending).
# Synthesised brass, so the sound is ours: no licence, unique to the site.
import sys, wave
import numpy as np
SR = 44100

def note_freq(name):
    names = {'C':0,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'Gb':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11}
    n, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (octave - 4) - 9) / 12)

def brass(freq, dur, vel=1.0, vib=0.0, mute=False, bend=0.0):
    t = np.arange(int(dur * SR)) / SR
    # pitch: slight bend (in semitones over the note) and vibrato
    f = freq * 2 ** ((bend * t / max(dur, 1e-3)) / 12) * (1 + vib * 0.012 * np.sin(2 * np.pi * 5.5 * t))
    phase = 2 * np.pi * np.cumsum(f) / SR
    attack = np.clip(t / 0.03, 0, 1)
    release = np.clip((dur - t) / 0.06, 0, 1)
    env = attack * release * (0.85 + 0.15 * np.exp(-t * 6))
    bright = 0.35 + 0.65 * np.clip(t / 0.08, 0, 1)          # brass brightens just after the attack
    if mute:                                                  # "wah": the mute opens and closes
        bright = bright * (0.35 + 0.65 * (0.5 - 0.5 * np.cos(2 * np.pi * np.clip(t / dur, 0, 1))))
    sig = np.zeros_like(t)
    for h in range(1, 12):
        sig += (bright ** (h / 3)) * np.sin(h * phase) / h ** 1.1
    return vel * env * sig

def chord(names, dur, **kw):
    return sum(brass(note_freq(n), dur, **kw) for n in names) / len(names)

def cymbal(dur, vel=0.25):
    t = np.arange(int(dur * SR)) / SR
    noise = np.random.default_rng(1).normal(size=t.size)
    noise = np.diff(noise, prepend=0)                         # brighter
    return vel * noise * np.exp(-t * 3.5)

def place(track, sig, at):
    i = int(at * SR)
    track[i:i + sig.size] += sig[:max(0, track.size - i)]

def fanfare_start(track, at):
    # ta-ta-ta (B flat major triad, short), then the beginning of the long note
    for k in range(3):
        place(track, chord(['Bb3', 'D4', 'F4'], 0.13, vel=0.9), at + k * 0.16)
    return at + 0.48

def opening():
    track = np.zeros(int(2.4 * SR))
    t = fanfare_start(track, 0.05)
    place(track, chord(['Bb3', 'F4', 'Bb4', 'D5'], 1.6, vel=1.0, vib=0.6), t)   # taaa! (up a fourth, triumphant)
    place(track, cymbal(1.8), t)
    return track

def ending():
    track = np.zeros(int(3.6 * SR))
    t = fanfare_start(track, 0.05)
    # ...and it flops: the sad trombone slide, wah, wah, wah, waaah
    steps = [('F4', 0.42, 0), ('E4', 0.42, 0), ('Eb4', 0.42, 0), ('D4', 1.5, -0.6)]
    for i, (n, d, bend) in enumerate(steps):
        place(track, brass(note_freq(n), d, vel=0.95, mute=True, vib=2.2 if i == 3 else 0.3, bend=bend), t)
        t += d if i < 3 else 0
    return track

def save(name, sig):
    sig = sig / (np.abs(sig).max() + 1e-9) * 0.8
    pcm = (sig * 32767).astype(np.int16)
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

out = sys.argv[1]
save(f'{out}/bbf-opening.wav', opening())
save(f'{out}/bbf-ending.wav', ending())
print('ok')
