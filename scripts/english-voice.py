"""Record English Adda's audio with Kokoro (offline, free, open source). Same voice and engine as Turbo (af_heart).

Lines come from scripts/english-lines.mjs: Yapper's lines (in public/english/english.js, YAPPER_LINES block) and
listening sentences from the game content (secret: the student has to type them, so they never appear in the manifest).
Output: public/assets/english/voice/<hash>.mp3 + manifest.json (public lines only: text -> file, duration, word timings).
File name = sha1("voice|speed|text")[:12].mp3, the same formula as clipName() in api/_lib/english-check.js.
Only new or changed lines are recorded; clips no longer used are deleted.

Setup: the same as scripts/turbo-voice.py (kokoro-onnx + model files in ~/.cache/kokoro).
Run after any change to Yapper's lines or listening content:  python scripts/english-voice.py
"""
import hashlib, importlib.util, json, os, subprocess, sys
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'english', 'voice')

# reuse Turbo's recorder (text clean-up, phrase pauses, word timings) so both mascots sound the same
spec = importlib.util.spec_from_file_location('turbo_voice', os.path.join(ROOT, 'scripts', 'turbo-voice.py'))
tv = importlib.util.module_from_spec(spec); spec.loader.exec_module(tv)

def clip_name(voice, speed, text):
    return hashlib.sha1(f'{voice}|{speed:.2f}|{text}'.encode()).hexdigest()[:12] + '.mp3'

def record_sentence(text, voice, speed):
    """one natural sentence for a listening task: a single Kokoro call, no inserted pauses"""
    a, _ = tv.k.create(tv.speakable(text), voice=voice, speed=speed, lang='en-us')
    a = a.astype(np.float32)
    pad = np.zeros(int(tv.SR * 0.15), np.float32)
    a = np.concatenate([pad, a, pad])
    return a / max(1e-6, float(np.abs(a).max())) * 0.9

def main():
    lines = json.loads(subprocess.run(['node', os.path.join(ROOT, 'scripts', 'english-lines.mjs')], capture_output=True, text=True, encoding='utf-8', check=True).stdout)
    os.makedirs(OUT, exist_ok=True)
    mpath = os.path.join(OUT, 'manifest.json')
    man = {'voice': 'af_heart', 'lines': {}}
    keep, made = set(), 0
    for L in lines:
        text, voice, speed, secret = L['t'], L['v'], float(L['s']), L.get('secret', False)
        f = clip_name(voice, speed, text)
        keep.add(f)
        path = os.path.join(OUT, f)
        if secret:
            if not os.path.exists(path):
                audio = record_sentence(text, voice, speed)
                sf.write(path, audio, tv.SR, format='MP3', bitrate_mode='VARIABLE', compression_level=0.7)
                made += 1; print(f'{made:3d}  secret  {len(audio)/tv.SR:4.1f}s  {f}', flush=True)
            continue
        if voice == tv.VOICE and speed == 1.0:
            if not os.path.exists(path):
                audio, times, offs = tv.record(text)
                sf.write(path, audio, tv.SR, format='MP3', bitrate_mode='VARIABLE', compression_level=0.7)
                made += 1; print(f'{made:3d}  {len(audio)/tv.SR:4.1f}s  {text[:70]}', flush=True)
                info = {'f': f, 'd': round(len(audio) / tv.SR, 2), 't': times, 'c': offs}
            else:
                old = json.load(open(mpath, encoding='utf-8'))['lines'].get(tv.key(text)) if os.path.exists(mpath) else None
                if old and old.get('f') == f: info = old
                else:
                    audio, times, offs = tv.record(text)
                    info = {'f': f, 'd': round(len(audio) / tv.SR, 2), 't': times, 'c': offs}
            man['lines'][tv.key(text)] = info
        else:
            raise SystemExit(f'Public lines use af_heart at speed 1.0 only: {text[:40]}')
    gone = [x for x in os.listdir(OUT) if x.endswith('.mp3') and x not in keep]
    for x in gone: os.remove(os.path.join(OUT, x))
    json.dump(man, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    size = sum(os.path.getsize(os.path.join(OUT, x)) for x in keep if os.path.exists(os.path.join(OUT, x)))
    print(f'{len(lines)} lines, {made} recorded, {len(gone)} removed, {size/1e6:.2f} MB')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
