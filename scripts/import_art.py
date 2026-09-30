#!/usr/bin/env python3
"""챗GPT·제미나이로 만든 그림 넣기 (scripts/art_manifest.py 목록 기준)
사용:
  python3 scripts/import_art.py <그림 폴더 또는 zip>   # 받은 그림을 잘라서 art/ 아래에 넣기
  python3 scripts/import_art.py --status               # 받은 것 / 아직 없는 것 보기
- 파일 이름은 프롬프트 문서의 이름 그대로 (예: star_sea.png, sheet_fruit.png). 대소문자·확장자(png/jpg/webp)는 상관없어요.
- 여러 개를 한 장에 그린 그림(sheet_…)은 빈 흰 줄을 찾아 칸을 나누고, 안 되면 가로×세로 칸으로 똑같이 자릅니다.
- 흰 배경은 가장자리부터 투명하게 지웁니다(물건 속 흰색은 남김).
- 끝나면 art/art-ready.js (그림 목록 + 이모지→그림 짝) 를 새로 만듭니다.
- 이전 문서의 차시 장면(forest.png, forest_piece.png …)도 같이 받으면 scripts/import_scene_art.py 로 넘깁니다."""
import os, re, sys, json, zipfile, tempfile, shutil
from collections import deque
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import art_manifest as M  # noqa: E402

WHITE = 238


def is_bg(p):
    r, g, b, a = p
    return a < 16 or (r >= WHITE and g >= WHITE and b >= WHITE)


def white_to_alpha(im):
    im = im.convert('RGBA'); px = im.load(); w, h = im.size
    if im.getextrema()[3][0] < 250:   # 이미 투명 배경
        return im
    seen = bytearray(w * h)
    q = deque([(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)])
    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y * w + x]: continue
        seen[y * w + x] = 1
        r, g, b, a = px[x, y]
        if a < 16 or (r > WHITE - 6 and g > WHITE - 6 and b > WHITE - 6):
            px[x, y] = (r, g, b, 0)
            q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return im


def trim(im, pad=6):
    bb = im.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if not bb: return im
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def bands(profile, want, total):
    """내용이 있는 구간 찾기. 작은 틈은 이어 붙이고, want 개가 되도록."""
    runs, on, st = [], False, 0
    for i, v in enumerate(profile):
        if v and not on: on, st = True, i
        if not v and on: on = False; runs.append([st, i])
    if on: runs.append([st, len(profile)])
    runs = [r for r in runs if r[1] - r[0] > total * 0.02]          # 티끌 버리기
    while len(runs) > want:                                          # 가장 좁은 틈부터 합치기
        gi = min(range(len(runs) - 1), key=lambda i: runs[i + 1][0] - runs[i][1])
        runs[gi] = [runs[gi][0], runs[gi + 1][1]]; del runs[gi + 1]
    return runs if len(runs) == want else None


def split_sheet(im, rows, cols):
    im = white_to_alpha(im)
    a = im.getchannel('A'); w, h = im.size
    data = a.load()
    rp = [any(data[x, y] > 20 for x in range(0, w, 2)) for y in range(h)]
    rb = bands(rp, rows, h)
    cells = []
    if rb:
        for (y0, y1) in rb:
            cp = [any(data[x, y] > 20 for y in range(y0, y1, 2)) for x in range(w)]
            cb = bands(cp, cols, w)
            if not cb: cells = None; break
            for (x0, x1) in cb: cells.append((x0, y0, x1, y1))
    if not rb or not cells:
        cells = [(round(c * w / cols), round(r * h / rows), round((c + 1) * w / cols), round((r + 1) * h / rows)) for r in range(rows) for c in range(cols)]
        print('   (칸을 똑같이 나눠 잘랐어요 — 잘린 모양을 확인해 주세요)')
    return [trim(im.crop(c)) for c in cells]


def save_cut(im, path, size):
    im = trim(white_to_alpha(im)); im.thumbnail((size, size), Image.LANCZOS)
    im.save(path, 'WEBP', quality=86, method=4)


def save_bg(im, path, width=1920):
    im = im.convert('RGB')
    if im.width > width: im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, 'WEBP', quality=80, method=4)


def index():
    idx = {}
    for g in M.GROUPS:
        for it in g['items']:
            idx[it['file'].lower()] = (g, it)
    return idx


def write_ready():
    ready, icons = [], {}
    order = {'art/obj': 0, 'art/act': 1, 'art/people': 2}   # 같은 이모지는 사물 > 행동 > 사람 순으로
    for key, folder, emo, ko in sorted(M.all_keys(), key=lambda t: order.get(t[1], 9)):
        p = os.path.join(ROOT, folder, key + '.webp')
        if os.path.exists(p):
            rel = folder + '/' + key + '.webp'
            ready.append(rel)
            if emo and folder in ('art/obj', 'art/act', 'art/people'):
                # 이모지 여러 개가 붙어 있을 수 있어서 하나씩 나눔(합자 이모지는 통째로)
                for e in split_emoji(emo):
                    icons.setdefault(e, rel)
    js = ('/* 자동 생성: scripts/import_art.py — 손으로 고치지 마세요 */\n'
          'window.OKS_ART = ' + json.dumps({'ready': ready, 'icons': icons}, ensure_ascii=False, indent=0) + ';\n')
    open(os.path.join(ROOT, 'art/art-ready.js'), 'w', encoding='utf-8').write(js)
    return ready, icons


def split_emoji(s):
    out, cur = [], ''
    for ch in s:
        if cur and (ch in '‍️' or cur.endswith('‍') or 0x1F3FB <= ord(ch) <= 0x1F3FF or 0xFE00 <= ord(ch) <= 0xFE0F or ord(ch) == 0x20E3):
            cur += ch
        else:
            if cur: out.append(cur)
            cur = ch
    if cur: out.append(cur)
    return out


def status():
    have = miss = 0
    for g in M.GROUPS:
        print('\n[%d순위] %s' % (g['priority'], g['title']))
        for it in g['items']:
            keys = [n[0] for n in it['names']] if it['kind'] == 'sheet' else [it['file']]
            got = [k for k in keys if os.path.exists(os.path.join(ROOT, g['folder'], k + '.webp'))]
            mark = '✅' if len(got) == len(keys) else ('◐ ' if got else '⬜')
            have += len(got); miss += len(keys) - len(got)
            print('  %s %-22s %s%s' % (mark, it['file'], it['ko'], '' if len(keys) == 1 else ' (%d/%d)' % (len(got), len(keys))))
    print('\n받은 그림 %d개 / 남은 그림 %d개' % (have, miss))


def main(src):
    tmp = None
    if src.lower().endswith('.zip'):
        tmp = tempfile.mkdtemp(); zipfile.ZipFile(src).extractall(tmp); src = tmp
    idx = index(); done, skipped, scene = [], [], False
    for dp, _, fs in os.walk(src):
        for f in sorted(fs):
            m = re.match(r'^(.+?)\.(png|jpe?g|webp)$', f, re.I)
            if not m: continue
            name = m.group(1).lower().strip()
            base = re.sub(r'_piece$', '', name)
            if base in M.SCENE_KEYS: scene = True; continue
            if name not in idx: skipped.append(f); continue
            g, it = idx[name]
            out = os.path.join(ROOT, g['folder']); os.makedirs(out, exist_ok=True)
            im = Image.open(os.path.join(dp, f))
            if it['kind'] == 'bg':
                save_bg(im, os.path.join(out, it['file'] + '.webp'))
                done.append(it['file'])
            elif it['kind'] == 'cut':
                save_cut(im, os.path.join(out, it['file'] + '.webp'), it.get('size', 512))
                done.append(it['file'])
            else:
                r, c = it['grid']
                parts = split_sheet(im, r, c)
                for (k, ko, emo, en), part in zip(it['names'], parts):
                    part.thumbnail((it.get('size', 256),) * 2, Image.LANCZOS)
                    part.save(os.path.join(out, k + '.webp'), 'WEBP', quality=86, method=4)
                    done.append(k)
                print('  %s → %d조각' % (f, len(parts)))
    if scene:
        import import_scene_art
        import_scene_art.main(src)
    ready, icons = write_ready()
    if tmp: shutil.rmtree(tmp, ignore_errors=True)
    print('넣은 그림 %d개: %s' % (len(done), ', '.join(done) or '없음'))
    if skipped: print('이름이 목록에 없어 건너뜀:', ', '.join(skipped))
    print('준비된 그림 전체 %d개, 이모지 대신 그림 %d가지' % (len(ready), len(icons)))


if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    status() if sys.argv[1] == '--status' else main(sys.argv[1])
