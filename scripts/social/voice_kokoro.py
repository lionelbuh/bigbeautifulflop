"""Monsieur Neutre's lines read by Kokoro (open source, Apache 2.0): same files as voice_lines.py.
    python3 scripts/social/voice_kokoro.py <slug> <voice> [speed] [out_dir]
Voices: am_michael, am_adam, am_fenrir, am_puck (American), bm_george, bm_lewis, bm_daniel (British).
"""
import json, os, sys
import numpy as np, soundfile as sf
from kokoro import KPipeline

slug, voice = sys.argv[1], sys.argv[2]
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
out = sys.argv[4] if len(sys.argv) > 4 else f'content/voices/{slug}'
pipe = KPipeline(lang_code='b' if voice.startswith('b') else 'a')
s = json.load(open(f'content/statements/{slug}.json'))
os.makedirs(out, exist_ok=True)
lines = {}
for part, key in (('h', 'hook'), ('n', 'neutral'), ('v', 'reaction')):
    texts = s['episode'].get(key) or []
    if isinstance(texts, str):
        texts = [texts]
    for i, text in enumerate(texts):
        clean = text.replace('*', '')
        audio = np.concatenate([np.asarray(a) for _, _, a in pipe(clean, voice=voice, speed=speed)])
        f = f'{out}/{part}{i}.wav'
        sf.write(f, audio, 24000, subtype='PCM_16')
        lines[f'{part}{i}'] = {'text': clean, 'duration': round(len(audio) / 24000, 2)}
json.dump({'voice': f'kokoro-{voice}', 'speed': speed, 'lines': lines}, open(f'{out}/lines.json', 'w'), indent=2)
print(voice, json.dumps({k: v['duration'] for k, v in lines.items()}))
