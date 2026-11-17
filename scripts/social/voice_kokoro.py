"""Monsieur Neutre's lines read by Kokoro (open source, Apache 2.0): same files as voice_lines.py.
    python3 scripts/social/voice_kokoro.py <slug> <voice|auto> [speed] [out_dir]
"auto": the voices take turns, one episode each (content/voices/rotation.json): Puck, then Onyx.
Voices: am_michael, am_adam, am_fenrir, am_puck (American), bm_george, bm_lewis, bm_daniel (British).
"""
import json, os, sys
import numpy as np, soundfile as sf
from kokoro import KPipeline

ROTATION = ['am_puck', 'am_onyx']  # Monsieur Neutre (Swiss episodes, before 17 November 2026)
STEVE = 'am_fenrir'  # Steve, the regular American (Meanwhile, from 17 November 2026)
slug, voice = sys.argv[1], sys.argv[2]
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.1
rot_file = 'content/voices/rotation.json'
_st = f'content/statements/{slug}.json'
if voice == 'auto' and os.path.exists(_st) and 'meanwhile' in json.load(open(_st)):
    voice = STEVE  # Steve always speaks with his own voice; the rotation is for Monsieur Neutre
if voice == 'auto':
    # an episode keeps its voice when it is read again; a new one takes the next voice in turn
    prev = f'content/voices/{slug}/lines.json'
    known = json.load(open(prev)).get('voice', '').replace('kokoro-', '') if os.path.exists(prev) else ''
    if known in ROTATION:
        voice = known
    else:
        rot = json.load(open(rot_file)) if os.path.exists(rot_file) else {'next': 0}
        voice = ROTATION[rot['next'] % len(ROTATION)]
        os.makedirs('content/voices', exist_ok=True)
        json.dump({'next': (rot['next'] + 1) % len(ROTATION), 'last': {'slug': slug, 'voice': voice}}, open(rot_file, 'w'), indent=2)
out = sys.argv[4] if len(sys.argv) > 4 else f'content/voices/{slug}'
pipe = KPipeline(lang_code='b' if voice.startswith('b') else 'a')
# an episode (content/statements) or a Priorities Report (content/specials): a few lines of it
if os.path.exists(f'content/tests/{slug}.json'):
    # a test of the "Meanwhile" format: the hook and Steve's lines
    s = json.load(open(f'content/tests/{slug}.json'))
    parts = (('h', 'hook'), ('s', 'steve'))
elif os.path.exists(f'content/statements/{slug}.json'):
    s = json.load(open(f'content/statements/{slug}.json'))
    parts = (('h', 'hook'), ('n', 'neutral'), ('v', 'reaction'))
    if 'meanwhile' in s:
        # "Meanwhile": the hook and Steve's lines, always in Steve's voice
        s = {'episode': s['meanwhile']}
        parts = (('h', 'hook'), ('s', 'steve'))
        if voice == 'auto':
            voice = STEVE
else:
    sp = json.load(open(f'content/specials/{slug}.json'))
    s = {'episode': {'review': sp['review'], 'closing': (sp.get('alternative') or {}).get('closing', ''), 'verdict': ' '.join(sp['verdict'])}}
    parts = (('r', 'review'), ('c', 'closing'), ('d', 'verdict'))
os.makedirs(out, exist_ok=True)
lines = {}
for part, key in parts:
    texts = s['episode'].get(key) or []
    if isinstance(texts, str):
        texts = [texts]
    for i, text in enumerate(texts):
        clean = text.replace('*', '')
        audio = np.concatenate([np.asarray(a) for _, _, a in pipe(clean, voice=voice, speed=speed)])
        # trim the silence Kokoro leaves at both ends, keeping a short breath
        loud = np.nonzero(np.abs(audio) > 0.01)[0]
        if loud.size:
            audio = audio[max(0, loud[0] - 1200):min(len(audio), loud[-1] + 3600)]
        f = f'{out}/{part}{i}.wav'
        sf.write(f, audio, 24000, subtype='PCM_16')
        lines[f'{part}{i}'] = {'text': clean, 'duration': round(len(audio) / 24000, 2)}
json.dump({'voice': f'kokoro-{voice}', 'speed': speed, 'lines': lines}, open(f'{out}/lines.json', 'w'), indent=2)
print(voice, json.dumps({k: v['duration'] for k, v in lines.items()}))
