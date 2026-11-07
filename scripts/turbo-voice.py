"""Record Turbo's voice lines for Drive School with Kokoro (offline, free, open source).

Voice: af_heart, normal pitch, 100% speed. Each phrase is recorded on its own, with a short pause sized by its punctuation.
Output: public/assets/voice/<hash>.mp3 + manifest.json (line -> file, duration, word timings). Unused clips are removed.

Setup (once): pip install kokoro-onnx soundfile, and download kokoro-v1.0.onnx + voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0) into %USERPROFILE%/.cache/kokoro
(or set KOKORO_DIR).
Run after any change to lesson text:  python scripts/turbo-voice.py      (only new or changed lines are recorded)
Long runs can run out of memory on Windows: `python scripts/turbo-voice.py 40` records at most 40 lines; run it again to continue.
"""
import hashlib, json, os, re, subprocess, sys, unicodedata
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'voice')
MDIR = os.environ.get('KOKORO_DIR', os.path.join(os.path.expanduser('~'), '.cache', 'kokoro'))
VOICE = 'af_heart'
STYLE_VERSION = 'heart/v1'                                     # change to re-record everything
SR = 24000
GAP = {',': 0.16, ';': 0.25, ':': 0.32, '.': 0.42, '!': 0.40, '?': 0.50, '…': 0.55, '—': 0.30}

def key(text):
    """must match Voice.key() in public/drive/drive.js: tags removed, all whitespace removed, NFC"""
    return unicodedata.normalize('NFC', re.sub(r'\s+', '', re.sub(r'<[^>]*>', '', text)))

def display_tokens(text):
    return re.sub(r'<[^>]*>', '', text).split()

ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = {2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty', 7: 'seventy', 8: 'eighty', 9: 'ninety'}

def two(n):
    return ONES[n] if n < 20 else TENS[n // 10] + ('' if n % 10 == 0 else '-' + ONES[n % 10])

def year_words(m):
    """1885 -> eighteen eighty-five, 1880s -> eighteen-eighties, 1900 -> nineteen hundred, 2006 -> two thousand six, 2015 -> twenty fifteen"""
    y, plural = int(m.group(1)), bool(m.group(2))
    hi, lo = divmod(y, 100)
    if plural and lo % 10 == 0 and lo >= 20:
        return two(hi) + '-' + TENS[lo // 10][:-1] + 'ies'
    if 2000 <= y <= 2009:
        return 'two thousand' + ('' if y == 2000 else ' ' + ONES[y - 2000])
    if lo == 0:
        return two(hi) + ' hundred'
    return two(hi) + ' ' + ('oh ' + ONES[lo] if lo < 10 else two(lo))

def speakable(t):
    """what Kokoro should read for one phrase of display text"""
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    t = re.sub(r'(?<![\d,.])\b(1[1-9]\d\d|20\d\d)(s)?\b(?![\d,])', year_words, t)   # years read like years
    t = re.sub(r'\bPOV\b', 'P-O-V', t)
    t = re.sub(r'\bB\.Tech\b', 'B Tech', t)
    t = re.sub(r'\be\.g\.', 'for example', t)
    t = re.sub(r'\bvs\.?', 'versus', t)
    t = re.sub(r'\+(\d)', r'plus \1', t)
    t = t.replace(' + ', ' plus ').replace(' = ', ' means ').replace('≠', " isn't ").replace('→', ' then ').replace('×', ' times ').replace('%', ' percent')
    t = ''.join(ch for ch in t if unicodedata.category(ch)[0] in 'LNPZ' or ch in "'-")   # drop emoji and symbols
    return re.sub(r'\s+', ' ', t).strip(' "')

def phrases(text):
    """group display tokens into phrases that end at a break; returns [(tokens, end_punct)]"""
    out, cur = [], []
    for tok in display_tokens(text):
        cur.append(tok)
        bare = re.sub(r'["”’)\]]+$', '', tok)
        if bare and bare[-1] in GAP and not re.fullmatch(r'(?:[A-Z]\.)+|B\.Tech\.?|e\.g\.', bare):
            out.append((cur, bare[-1])); cur = []
    if cur: out.append((cur, '.'))
    return out

k = Kokoro(os.path.join(MDIR, 'kokoro-v1.0.onnx'), os.path.join(MDIR, 'voices-v1.0.bin'))
def synth(text):
    a, _ = k.create(text, voice=VOICE, speed=1.0, lang='en-us')
    return a.astype(np.float32)

def record(text):
    parts, t, times = [np.zeros(int(SR * 0.05), np.float32)], 0.05, []
    ph = phrases(text)
    for i, (toks, end) in enumerate(ph):
        say = speakable(' '.join(toks))
        n = len(re.findall(r'[A-Za-z0-9]+', say))
        if not n:                                    # emoji-only bit: shows with the previous words
            times += [max(0.0, t - 0.2)] * len(toks); continue
        a = synth(say)
        dur = len(a) / SR
        w = [max(1, len(re.sub(r'[^A-Za-z0-9]', '', speakable(x)))) if re.search(r'[A-Za-z0-9]', x) else 0 for x in toks]
        tot, acc = sum(w) or 1, 0
        for x in w: times.append(t + dur * 0.92 * acc / tot); acc += x
        gap = GAP[end] if i < len(ph) - 1 else 0.12
        parts += [a, np.zeros(int(SR * gap), np.float32)]
        t += dur + gap
    audio = np.concatenate(parts)
    audio = audio / max(1e-6, float(np.abs(audio).max())) * 0.9
    toks = [x for p in ph for x in p[0]]
    offs, o = [], 0
    for x in toks: offs.append(o); o += len(x)
    return audio, [round(x, 2) for x in times], offs

def main():
    lines = json.loads(subprocess.run(['node', os.path.join(ROOT, 'scripts', 'turbo-lines.mjs')], capture_output=True, text=True, encoding='utf-8', check=True).stdout)
    os.makedirs(OUT, exist_ok=True)
    mpath = os.path.join(OUT, 'manifest.json')
    old = json.load(open(mpath, encoding='utf-8')) if os.path.exists(mpath) else {'lines': {}}
    ppath = os.path.join(OUT, 'progress.json')                      # clips made by a run that stopped early
    done_before = json.load(open(ppath, encoding='utf-8')) if os.path.exists(ppath) else {}
    same_style = old.get('style') == STYLE_VERSION
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10 ** 9      # optional: record at most N lines this run
    man = {'style': STYLE_VERSION, 'voice': VOICE, 'lines': {}}
    made = 0
    for text in lines:
        kk = key(text)
        f = hashlib.sha1((STYLE_VERSION + '|' + text + '|' + speakable(re.sub(r'<[^>]*>', '', text))).encode()).hexdigest()[:12] + '.mp3'   # changes when the words or how they're read change
        prev = old['lines'].get(kk)
        if not (same_style and prev and prev['f'] == f): prev = done_before.get(kk)
        if prev and prev['f'] == f and os.path.exists(os.path.join(OUT, f)):
            man['lines'][kk] = prev; continue
        if made >= limit:
            if kk in old['lines']: man['lines'][kk] = old['lines'][kk]   # keep the old clip until it is re-recorded
            continue
        audio, times, offs = record(text)
        sf.write(os.path.join(OUT, f), audio, SR, format='MP3', bitrate_mode='VARIABLE', compression_level=0.7)
        man['lines'][kk] = {'f': f, 'd': round(len(audio) / SR, 2), 't': times, 'c': offs}
        made += 1
        done_before[kk] = man['lines'][kk]
        json.dump(done_before, open(ppath, 'w', encoding='utf-8'), ensure_ascii=False)
        print(f'{made:3d}  {len(audio)/SR:4.1f}s  {text[:70]}', flush=True)
    keep = {v['f'] for v in man['lines'].values()} | {v['f'] for v in done_before.values()}
    gone = [x for x in os.listdir(OUT) if x.endswith('.mp3') and x not in keep]
    for x in gone: os.remove(os.path.join(OUT, x))
    json.dump(man, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    if made < limit and os.path.exists(ppath): os.remove(ppath)     # finished: no leftovers
    size = sum(os.path.getsize(os.path.join(OUT, x)) for x in keep)
    print(f'{len(lines)} lines, {made} recorded, {len(gone)} removed, {size/1e6:.1f} MB')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
