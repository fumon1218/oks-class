#!/usr/bin/env python3
"""제미나이로 만든 장면 그림 넣기
사용: python3 scripts/import_scene_art.py <그림 폴더 또는 zip>
- forest.png 같은 배경 → art/scene/forest.webp (가로 1600px)
- forest_piece.png 같은 조각 → art/scene/forest_piece.webp (256px, 흰 배경이면 투명하게)
- play/scenes.js 의 READY 목록을 자동으로 갱신합니다."""
import os, re, sys, zipfile, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS = ['forest', 'cafe', 'post', 'station', 'stage', 'gallery', 'mart', 'lab', 'sea', 'school', 'sky', 'village', 'garden', 'museum', 'hall']

def white_to_alpha(im):
    im = im.convert('RGBA'); px = im.load(); w, h = im.size
    # 가장자리에서 이어진 흰색만 투명하게 (물건 속 흰색은 남김)
    from collections import deque
    seen = set(); q = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    while q:
        x, y = q.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h): continue
        seen.add((x, y)); r, g, b, a = px[x, y]
        if a == 0 or (r > 236 and g > 236 and b > 236):
            px[x, y] = (r, g, b, 0)
            q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return im

def main(src):
    if src.endswith('.zip'):
        d = tempfile.mkdtemp(); zipfile.ZipFile(src).extractall(d); src = d
    out = os.path.join(ROOT, 'art/scene'); os.makedirs(out, exist_ok=True)
    done = []
    for dp, _, fs in os.walk(src):
        for f in fs:
            m = re.match(r'^([a-z]+)(_piece)?\.(png|jpe?g|webp)$', f.lower())
            if not m or m.group(1) not in KEYS: continue
            im = Image.open(os.path.join(dp, f))
            name = m.group(1) + (m.group(2) or '')
            if m.group(2):
                if im.mode != 'RGBA' or im.getextrema()[3][0] == 255: im = white_to_alpha(im)
                bb = im.getbbox();  im = im.crop(bb) if bb else im
                im.thumbnail((256, 256)); im.save(os.path.join(out, name + '.webp'), 'WEBP', quality=85, method=4)
            else:
                im = im.convert('RGB'); k = 1600 / im.width
                if k < 1: im = im.resize((1600, round(im.height * k)))
                im.save(os.path.join(out, name + '.webp'), 'WEBP', quality=80, method=4)
            done.append(name)
    ready = sorted(set(re.sub(r'\.webp$', '', f) for f in os.listdir(out) if f.endswith('.webp')))
    p = os.path.join(ROOT, 'play/scenes.js'); s = open(p, encoding='utf-8').read()
    s = re.sub(r"var READY = window\.OKS_SCENE_READY \|\| \[[^\]]*\];", "var READY = window.OKS_SCENE_READY || [" + ", ".join("'%s'" % r for r in ready) + "];", s)
    open(p, 'w', encoding='utf-8').write(s)
    print('넣은 그림:', ', '.join(sorted(done)) or '없음'); print('준비된 장면:', ', '.join(ready))

if __name__ == '__main__':
    main(sys.argv[1])
