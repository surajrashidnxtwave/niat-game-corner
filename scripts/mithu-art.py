"""Draws Mithu, English Adda's host, in four poses: idle, correct, thinking, oops.

Style (owner, Nov 2026): cartoony, chunky and big, in the spirit of app mascots students already like: a huge round head,
huge eyes, stubby wings, flat colours, almost no detail. He is still his own character and must stay one:
a PARROT (big hooked red beak, three-feather crest, blue tail fan, rose neck ring), teal-green with a yellow front,
wearing purple commentator headphones with a mic. Never an owl, never lime green, no ear tufts.

Run:  python scripts/mithu-art.py        (writes public/assets/mithu/mithu-<pose>.svg)
"""
from pathlib import Path

G, GD, GL = '#16B58A', '#0E8F6C', '#3FD3A8'         # body teal-green, dark, light
BELLY = '#FFE27A'                                   # yellow front
BLUE, BLUED = '#3B8BEB', '#2468C2'                  # tail and crest tips
RED, REDD = '#F0524F', '#C2332F'                    # beak
INK, ROSE, FOOT = '#1E1B2E', '#FF8FB1', '#FF9A3D'
PUR, PURD = '#7C5CFF', '#5B43C9'                    # headphones (the Adda purple)

TAIL = (f'<ellipse cx="78" cy="178" rx="13" ry="26" fill="{BLUED}" transform="rotate(28 78 178)"/>'
        f'<ellipse cx="122" cy="178" rx="13" ry="26" fill="{BLUED}" transform="rotate(-28 122 178)"/>'
        f'<ellipse cx="100" cy="182" rx="14" ry="24" fill="{BLUE}"/>')
FEET = (f'<path d="M74 190 q8 -8 16 0 q6 -6 12 2 v4 h-34 z" fill="{FOOT}"/>'
        f'<path d="M100 192 q6 -8 12 -2 q8 -8 16 0 l4 6 h-34 z" fill="{FOOT}"/>')
BODY = f'<ellipse cx="100" cy="150" rx="50" ry="42" fill="{G}"/><ellipse cx="100" cy="158" rx="31" ry="29" fill="{BELLY}"/>'
HEAD = f'<ellipse cx="100" cy="82" rx="68" ry="62" fill="{G}"/><ellipse cx="78" cy="42" rx="26" ry="12" fill="{GL}" opacity=".45" transform="rotate(-18 78 42)"/>'
# the rose neck ring peeks out on both sides, where the head meets the body
RING = f'<path d="M52 130 Q100 158 148 130" fill="none" stroke="{ROSE}" stroke-width="7" stroke-linecap="round"/>'
CREST = (f'<path d="M100 26 Q84 6 92 -2 Q104 8 100 26 Z" fill="{GD}"/><path d="M104 26 Q104 4 118 2 Q120 16 104 26 Z" fill="{BLUE}"/>'
         f'<path d="M96 26 Q76 16 74 6 Q90 8 96 26 Z" fill="{BLUE}"/>')
CREST_MESSY = (f'<path d="M100 26 Q80 2 92 -4 Q106 8 100 26 Z" fill="{GD}"/><path d="M106 26 Q112 0 128 4 Q124 20 106 26 Z" fill="{BLUE}"/>'
               f'<path d="M94 26 Q66 22 64 6 Q84 6 94 26 Z" fill="{BLUE}"/>')
CHEEKS = f'<ellipse cx="45" cy="106" rx="10" ry="7" fill="{ROSE}"/><ellipse cx="155" cy="106" rx="10" ry="7" fill="{ROSE}"/>'
PHONES = (f'<path d="M30 84 Q30 18 100 18 Q170 18 170 84" fill="none" stroke="{PUR}" stroke-width="8" stroke-linecap="round"/>'
          f'<rect x="18" y="66" width="22" height="38" rx="11" fill="{PUR}"/><rect x="160" y="66" width="22" height="38" rx="11" fill="{PUR}"/>'
          f'<rect x="22" y="72" width="7" height="26" rx="3.5" fill="{PURD}"/><rect x="171" y="72" width="7" height="26" rx="3.5" fill="{PURD}"/>'
          f'<path d="M30 102 Q32 128 60 128" fill="none" stroke="{PURD}" stroke-width="4" stroke-linecap="round"/><circle cx="64" cy="128" r="6.5" fill="{PURD}"/>')
# big hooked beak; the open one drops the lower part and shows the tongue
BEAK = (f'<path d="M80 100 Q100 84 120 100 Q122 122 100 136 Q94 118 80 100 Z" fill="{RED}"/>'
        f'<path d="M92 116 Q100 122 110 116 Q108 130 100 136 Q96 126 92 116 Z" fill="{REDD}"/>')
BEAK_OPEN = (f'<path d="M84 118 Q100 148 116 118 Z" fill="{REDD}"/><path d="M90 122 Q100 138 110 122 Z" fill="#FF9DA6"/>'
             f'<path d="M78 98 Q100 80 122 98 Q122 112 116 118 Q100 108 84 118 Q78 110 78 98 Z" fill="{RED}"/>')

def wing(cx, cy, rot, rx=15, ry=30):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{GD}" transform="rotate({rot} {cx} {cy})"/>'

def eyes(px=0, py=0, lid='half', r=11):
    """Two huge eyes. px/py move the pupils. lid: half (dry, unimpressed), brow (one eyebrow up), none (wide open)."""
    out = f'<ellipse cx="70" cy="80" rx="21" ry="24" fill="#fff"/><ellipse cx="130" cy="80" rx="21" ry="24" fill="#fff"/>'
    for cx in (74, 126):
        out += f'<circle cx="{cx + px}" cy="{84 + py}" r="{r}" fill="{INK}"/><circle cx="{cx + px + 4}" cy="{79 + py}" r="{r * .36:.1f}" fill="#fff"/>'
    lidL = f'<path d="M47 76 Q70 46 93 76 Z" fill="{GD}"/>'
    lidR = f'<path d="M107 76 Q130 46 153 76 Z" fill="{GD}"/>'
    if lid == 'half': out += lidL + lidR
    if lid == 'brow': out += lidL + f'<path d="M112 50 Q130 40 150 50" fill="none" stroke="{GD}" stroke-width="6" stroke-linecap="round"/>'
    return out

HAPPY_EYES = (f'<path d="M52 86 Q70 62 88 86" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
              f'<path d="M112 86 Q130 62 148 86" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>')
def spark(x, y, s=1):
    k = lambda n: f'{n * s:g}'
    return f'<path d="M{x} {y} l{k(3)} {k(8)} {k(8)} {k(3)} {k(-8)} {k(3)} {k(-3)} {k(8)} {k(-3)} {k(-8)} {k(-8)} {k(-3)} {k(8)} {k(-3)}z" fill="#FFC53D"/>'

POSES = {
    'idle': dict(label='Mithu', tilt=0, parts=[
        TAIL, FEET, wing(50, 150, 14), wing(150, 150, -14), BODY, RING, HEAD, CREST, CHEEKS, eyes(), BEAK, PHONES]),
    'correct': dict(label='Mithu, pleased', tilt=-3, parts=[
        TAIL, FEET, wing(50, 150, 14), wing(160, 128, -58, 14, 30), BODY, RING, HEAD, CREST, CHEEKS, HAPPY_EYES, BEAK_OPEN, PHONES,
        spark(184, 30), spark(12, 46, .7)]),
    'thinking': dict(label='Mithu, thinking', tilt=4, parts=[
        TAIL, FEET, wing(50, 150, 14), BODY, RING, HEAD, CREST, CHEEKS, eyes(5, -6, 'brow'), BEAK, PHONES,
        wing(134, 138, 40, 13, 26),
        f'<circle cx="172" cy="34" r="5" fill="{PUR}"/><circle cx="184" cy="20" r="7" fill="{PUR}"/>']),
    'oops': dict(label='Mithu, oops', tilt=-4, parts=[
        TAIL, FEET, wing(40, 140, 40), wing(160, 140, -40), BODY, RING, HEAD, CREST_MESSY, CHEEKS, eyes(0, 0, 'none', 8), BEAK_OPEN, PHONES,
        '<path d="M176 30 Q186 46 176 54 Q166 46 176 30 Z" fill="#7CC4F5"/>']),
}

def svg(pose):
    p = POSES[pose]
    body = ''.join(p['parts'])
    if p['tilt']:
        body = f'<g transform="rotate({p["tilt"]} 100 170)">{body}</g>'
    # a little air around him so tilted poses and the crest are never cut off
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -8 212 212" width="200" height="200" role="img" aria-label="{p["label"]}">{body}</svg>\n')

if __name__ == '__main__':
    out = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'mithu'
    out.mkdir(parents=True, exist_ok=True)
    for pose in POSES:
        (out / f'mithu-{pose}.svg').write_text(svg(pose), encoding='utf-8')
        print('wrote', f'mithu-{pose}.svg')
