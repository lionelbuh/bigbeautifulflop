"""Monsieur Neutre's voice: his lines of an episode read by a free Piper voice (run by .github/workflows/voices.yml).

Voice: en_US-norman-medium (Piper, trained on public-domain LibriVox recordings). Writes
content/voices/<slug>/n0.wav, n1.wav... (Swiss Neutrality) and v0.wav... (the canton), and lines.json
with the exact texts and durations, so a video is made again whenever a line changes.
    python3 scripts/social/voice_lines.py <slug> <voice.onnx>
"""
import json, os, subprocess, sys, wave

slug, model = sys.argv[1], sys.argv[2]
LENGTH = sys.argv[3] if len(sys.argv) > 3 else '1.08'
s = json.load(open(f'content/statements/{slug}.json'))
out = f'content/voices/{slug}'
os.makedirs(out, exist_ok=True)
lines = {}
for part, key in (('h', 'hook'), ('n', 'neutral'), ('v', 'reaction')):
    texts = s['episode'].get(key) or []
    if isinstance(texts, str):
        texts = [texts]
    for i, text in enumerate(texts):
        clean = text.replace('*', '')
        f = f'{out}/{part}{i}.wav'
        # a little slower than Piper's default (1.0), which sounds mechanical; a short pause between sentences
        subprocess.run([sys.executable, '-m', 'piper', '-m', model, '-f', f, '--length-scale', LENGTH, '--sentence-silence', '0.2'], input=clean.encode(), check=True)
        with wave.open(f) as w:
            dur = w.getnframes() / w.getframerate()
        lines[f'{part}{i}'] = {'text': clean, 'duration': round(dur, 2)}
json.dump({'voice': os.path.basename(model).replace('.onnx', ''), 'lengthScale': LENGTH, 'lines': lines}, open(f'{out}/lines.json', 'w'), indent=2)
print(json.dumps(lines, indent=2))
