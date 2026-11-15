"""English read by a French Piper voice: a light French (Swiss Romand) accent for Monsieur Neutre.

The English text is turned into sounds by espeak-ng (en-us), then the sounds French speakers do not make
are replaced by the ones they use instead ("th" -> z/s, no "h", French "r", short "i"...), and a French
Piper voice says them.   python3 voice_accent.py <voice.onnx> <out.wav> "text"
"""
import json, subprocess, sys, wave

FRENCH = [  # English sound -> what a French speaker says
    ('ð', 'z'), ('θ', 's'), ('ɹ', 'ʁ'), ('r', 'ʁ'), ('h', ''), ('æ', 'a'), ('ʌ', 'œ'), ('ɐ', 'a'), ('ɪ', 'i'),
    ('ʊ', 'u'), ('ɜː', 'œʁ'), ('ɚ', 'œʁ'), ('ᵻ', 'i'), ('ɾ', 't'), ('oʊ', 'o'), ('eɪ', 'e'), ('aɪ', 'aj'),
    ('aʊ', 'aw'), ('ɔɪ', 'ɔj'), ('dʒ', 'dʒ'), ('tʃ', 'tʃ'), ('ɑː', 'a'), ('ɔː', 'o'), ('iː', 'i'), ('uː', 'u'),
    ('ɑ', 'a'), ('ː', ''), ('ˌ', ''), ('ʔ', ''), ('ɫ', 'l'), ('l̩', 'œl'), ('n̩', 'œn'), ('ə', 'ə'),
]

def phonemes(text):
    out = subprocess.run(['espeak-ng', '-q', '-v', 'en-us', '--ipa=3', text], capture_output=True, text=True, check=True).stdout
    return ' '.join(out.split())

def frenchify(ipa):
    ipa = ipa.replace('_', '')
    for a, b in FRENCH:
        ipa = ipa.replace(a, b)
    return ipa

def main(model, out, text):
    from piper import PiperVoice
    voice = PiperVoice.load(model)
    cfg = json.load(open(model + '.json'))
    idmap = cfg['phoneme_id_map']
    ipa = frenchify(phonemes(text.replace('*', '')))
    seq = [c for c in ipa if c in idmap or c == ' ']
    ids = voice.phonemes_to_ids(seq)
    audio = voice.phoneme_ids_to_audio(ids)
    with wave.open(out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(cfg['audio']['sample_rate'])
        import numpy as np
        a = np.asarray(audio)
        if a.dtype != np.int16:
            a = (np.clip(a, -1, 1) * 32767).astype(np.int16)
        w.writeframes(a.tobytes())
    print(out, ipa)

if __name__ == '__main__':
    main(*sys.argv[1:4])
