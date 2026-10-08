#!/usr/bin/env python3
"""sw.js의 오프라인 저장 목록(ASSETS)을 실제 파일에서 다시 만들고 CACHE_NAME 숫자를 1 올립니다.
사용: python3 scripts/build_sw.py"""
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PAGES = [
    './', './index.html', './classic.html', './manifest.json',
    './space/space.css', './core/oks-3d.js', './art/3d/models.js', './space/space.js', './space/zoom.js', './space/data.js', './art/art-ready.js',
    './playground/', './playground/index.html', './playground/jegi/', './playground/jegi/index.html', './playground/jegi/jegi.css', './playground/jegi/jegi.js', './playground/jegi/motion.js', './playground/jegi/pose-worker.js', './playground/chess/', './playground/chess/index.html', './playground/chess/chess.css', './playground/chess/chess.js', './playground/chess/engine.js', './playground/chess/ai-worker.js', './playground/janggi/', './playground/janggi/index.html', './playground/janggi/janggi.css', './playground/janggi/janggi.js', './playground/janggi/engine.js', './playground/janggi/ai-worker.js', './playground/common3d.js', './playground/go/', './playground/go/index.html', './playground/go/go.css', './playground/go/go.js', './playground/go/engine.js', './playground/go/ai-worker.js', './playground/go/lessons.js', './playground/go/lessons-l1.js', './playground/go/lessons-l2.js', './playground/go/lessons-l3.js', './playground/go/lessons-l4.js', './playground/go/lessons-eval.js', './playground/go/lessons-solved.js', './playground/omok/', './playground/omok/index.html', './playground/omok/omok.css', './playground/omok/omok.js', './playground/omok/engine.js', './playground/othello/', './playground/othello/index.html', './playground/othello/othello.css', './playground/othello/othello.js', './playground/othello/engine.js', './playground/darts/', './playground/darts/index.html', './playground/darts/darts.css', './playground/darts/darts.js',
    './sports/', './sports/index.html', './sports/sports.css', './sports/sports.js', './sports/curriculum.js', './sports/worksheet.html', './sports/athletics.js', './sports/athletics-race.js', './sports/athletics.css', './sports/athletics-run.js', './sports/athletics-run.css', './sports/titles.js', './sports/lessons.js', './sports/lessons2.js', './sports/lessons-ball.js', './sports/juice.js', './sports/pro.js', './sports/pro.css', './sports/tycoon.js', './sports/tycoon.css', './sports/juice.css', './sports/baseball.js', './sports/baseball.css', './sports/basketball.js', './sports/rugby.js', './sports/tennis.js', './sports/pingpong.js', './sports/basketball.css', './sports/rugby.css', './sports/tennis.css', './sports/pingpong.css', './sports/games.js',
    './learn/', './learn/index.html', './learn/learn.css', './learn/learn.js',
    './play/', './play/index.html', './play/play.css', './play/play.js', './play/content.js', './play/content2.js', './play/content-extra.js', './play/english-content.js', './play/english.js', './play/custom.js', './curriculum/editor.html', './play/describe.js', './curriculum/plan.html',
    './play/engines.js', './play/engines2.js', './play/farm.js',
    './core/oks-core.css', './core/oks-core.js', './core/oks-kit.js', './core/oks-eco.js', './curriculum/lessons.js', './curriculum/art-standards.js', 
    './shop/', './shop/index.html', './shop/shop.css', './shop/shop.js', './shop/shops.js', './shop/stations.js',
    './town/', './town/index.html', './town/town.css', './town/town.js', './town/cc.webp', './town/wj.webp',
    './games/farm/index.html', './games/birds/index.html', './games/shapes/index.html', './games/puzzle/index.html', './games/puzzle/images.js', './games/match/index.html', './games/look/index.html', './games/myface/index.html', './games/dots/index.html', './games/senses/index.html', './art/masters/masters.js', './worksheet/puzzle.html', './trace/alpha.html', './trace/trace.js', './trace/trace.css', './trace/data-alpha.js', './trace/hangul.html', './trace/hangul.js', './trace/data-hangul.js', './trace/alpha.js', './games/fishing/index.html', './games/balloons/index.html', './games/tycoon/index.html', './games/tycoon/town.js', './games/tycoon/town2.js', './games/tycoon/delivery.js', './worksheet/index.html', './worksheet/generic.js', './worksheet/english.js', './worksheet/hangul.js', './minigames/farm-v8/index.html',
    './career/cafe.html', './career/barista.html', './korean/index.html', './korean/catch.html',
    './lobby/lobby-v2.css', './lobby/lobby-v3.css', './curriculum/catalog.json', './curriculum/game-blueprint.json',
    './minigames/index.html', './minigames/art-tycoon.html', './minigames/packs.js',
    './quests/index.html', './curriculum/teacher-guide.html', './curriculum/reports.html',
]
files = sorted(glob.glob('vendor/three/**/*.js', recursive=True)) + sorted(glob.glob('playground/chess/assets/*.glb')) + sorted(glob.glob('playground/darts/assets/*.glb')) + sorted(glob.glob('playground/go/assets/*.glb')) + sorted(glob.glob('playground/othello/assets/*.glb')) + sorted(glob.glob('sports/assets/**/*.webp', recursive=True)) + sorted(glob.glob('playground/jegi/assets/*.webp'))
for pat in ['core/ui/*.webp', 'core/ui/*.png', 'art/scene/*.webp', 'art/space/*.webp', 'space/img/*.webp', 'art/3d/*.glb', 'art/build/*.webp', 'art/char/*.webp', 'art/obj/*.webp', 'art/en/*.webp', 'art/ws/*.webp', 'art/act/*.webp', 'art/people/*.webp', 'art/avatar/*.webp', 'games/farm/assets/*.webp', 'games/birds/img/*.webp', 'games/shapes/img/*.webp', 'games/fishing/img/*.webp', 'games/balloons/img/*.webp', 'games/tycoon/img/*.webp', 'games/tycoon/img/drone/*.webp', 'art/jj/*/*.webp', 'art/scenes/*.jpg', 'art/scenes/*.webp', 'icons/*.png', 'icons/*.jpg']:
    files += sorted(glob.glob(pat))
assets = [p for p in PAGES if p.endswith('/') or os.path.exists(p)] + ['./' + f for f in files]
src = open('sw.js', encoding='utf-8').read()
body = 'const ASSETS = [\n' + ',\n'.join("  '%s'" % a for a in assets) + '\n];'
src = re.sub(r'const ASSETS = \[.*?\];', body, src, flags=re.S)
m = re.search(r"CACHE_NAME = 'oks-class-v(\d+)'", src)
src = src.replace(m.group(0), "CACHE_NAME = 'oks-class-v%d'" % (int(m.group(1)) + 1))
open('sw.js', 'w', encoding='utf-8').write(src)
print(len(assets), 'assets, cache v%d' % (int(m.group(1)) + 1))
