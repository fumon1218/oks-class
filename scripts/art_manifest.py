# -*- coding: utf-8 -*-
"""옥쌤의 즐거운 교실 — 새 그림 목록(우주 콘셉트 + 교과 공간 + 그림 사전)
이 파일 하나가 기준입니다.
 - scripts/build_art_prompts.py 가 이 목록으로 프롬프트 문서(docs/image-prompts-v2.md)를 만들고
 - scripts/import_art.py 가 받은 그림을 이 목록대로 잘라서 art/ 아래에 넣습니다.
kind: bg(배경, 가로 그림 그대로) / cut(한 장에 하나, 흰 배경 지우기) / sheet(한 장에 여러 개, 잘라서 나누기)
"""

STYLE = ("Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, "
         "glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, "
         "no text, no letters, no numbers, no logos, no watermark.")
SPACE = ("Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, "
         "tiny twinkling stars, calm and cozy, never scary.")
ISO = ("Single subject isolated and centered on a pure plain white background (transparent background if possible), "
       "whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.")
SHEET = ("A {r}x{c} grid sprite sheet: {n} separate items arranged in {r} rows and {c} columns, evenly spaced with wide empty white gaps "
         "between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, "
         "pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.")
REF_OK = "Use the attached reference image of the teacher character and keep her exactly the same (same face, long wavy brown hair, lavender puff-sleeve dress with a cream bow)."
REF_KID = "Use the attached reference image (the boy with short black hair, yellow hoodie and blue jeans) and keep the SAME boy exactly (same face, hair and clothes) in every cell."


def S(key, ko, emo, en):
    return (key, ko, emo, en)


GROUPS = [
# ───────────────────────────── 1순위 ─────────────────────────────
{'id': 'space', 'title': '우주·별', 'folder': 'art/space', 'priority': 1,
 'note': '첫 화면(우주 지도)에 쓰는 그림입니다. 별은 흰 배경 위에 하나씩, 위쪽 평평한 땅은 비워 두세요(건물은 따로 올려요).',
 'items': [
  {'file': 'space_bg', 'ko': '우주 배경 (가로)', 'kind': 'bg', 'ratio': '16:9', 'use': '첫 화면 전체 배경 (태블릿·PC)',
   'prompt': 'A vast wide deep-space background, dark navy to violet gradient, soft pink and teal nebula clouds, countless tiny twinkling stars of different sizes, two or three faint distant galaxies, NO planets, NO spaceships, the whole middle area calm and empty so planets can be placed on top, 16:9, 2400x1350 or larger.'},
  {'file': 'space_bg_tall', 'ko': '우주 배경 (세로)', 'kind': 'bg', 'ratio': '9:16', 'use': '휴대폰 세로 화면용 배경',
   'prompt': 'The same vast deep-space background as a tall vertical image, dark navy to violet gradient, soft pink and teal nebula, countless tiny twinkling stars, NO planets, calm empty middle, 9:16, 1350x2400 or larger.'},
  {'file': 'star_center', 'ko': '가운데 별 (학생회관 별)', 'kind': 'cut', 'size': 1024, 'use': '우주 한가운데 떠 있는 큰 별. 학생회관·부대시설이 올라가요',
   'prompt': 'A floating half-sphere mini world: the TOP is a flat round surface like a small park plaza with soft green lawn, pastel stone paths and a few round trees only at the rim; the BOTTOM is a rounded rocky half-ball with warm golden crystals and tiny dangling roots and a soft golden glow around it. Seen from slightly above (about 30 degrees) so the flat top looks like a wide oval. The top surface must be mostly EMPTY open ground (buildings will be added separately). Warm sunny golden theme.'},
  {'file': 'star_sea', 'ko': '바다별 (음악·미술)', 'kind': 'cut', 'size': 800, 'use': '음악·미술 건물이 올라가는 별',
   'prompt': 'A floating half-sphere mini world in a turquoise ocean theme: the flat round TOP has a sandy beach ring, a small calm lagoon at one side, coral and seashells at the rim, and mostly EMPTY open sand in the middle; the rounded BOTTOM is made of glowing aqua-blue crystal with tiny waterfalls dripping off the edge and turning into sparkles. Seen from slightly above (about 30 degrees), flat top looks like a wide oval.'},
  {'file': 'star_love', 'ko': '사랑별 (수학·과학)', 'kind': 'cut', 'size': 800, 'use': '수학·과학 건물이 올라가는 별',
   'prompt': 'A floating half-sphere mini world in a warm pink and peach theme: the flat round TOP has soft pink grass, blossom trees only at the rim and small heart-shaped stepping stones, mostly EMPTY open ground in the middle; the rounded BOTTOM is glowing rose-quartz crystal with a soft pink glow. Seen from slightly above (about 30 degrees), flat top looks like a wide oval.'},
  {'file': 'star_dream', 'ko': '꿈별 (사회·진로직업)', 'kind': 'cut', 'size': 800, 'use': '사회·진로직업 건물이 올라가는 별',
   'prompt': 'A floating half-sphere mini world in a lavender twilight theme: the flat round TOP has lilac grass, a few star-shaped street lamps and tiny winding roads at the rim, mostly EMPTY open ground in the middle; the rounded BOTTOM is glowing purple amethyst crystal, with a tiny moon orbiting nearby. Seen from slightly above (about 30 degrees), flat top looks like a wide oval.'},
  {'file': 'star_farm', 'ko': '햇살 농장 위성 (여러 교과 함께)', 'kind': 'cut', 'size': 600, 'use': '가운데 별 옆 작은 위성. 햇살 농장이 올라가요',
   'prompt': 'A small floating half-sphere mini world in a sunny farm theme: the flat round TOP has neat vegetable field rows and a wooden fence at the rim, open empty ground in the middle; the rounded BOTTOM is warm brown soil and rock with a few carrots and roots poking out, soft sunny glow. Seen from slightly above (about 30 degrees).'},
  {'file': 'star_jungle', 'ko': '정글 점프 별 (다른 게임으로 가는 별)', 'kind': 'cut', 'size': 800, 'use': '누르면 우주선 타고 정글 점프 게임으로',
   'prompt': 'A floating half-sphere mini world in a lush JUNGLE theme: the flat round TOP is a dense tropical jungle with big leafy trees, hanging vines, tree branches like stepping platforms, bright fruits (bananas, mangoes, berries) and a small waterfall, a wooden treasure chest peeking out; the rounded BOTTOM is mossy rock with roots and vines dangling down. Seen from slightly above (about 30 degrees).'},
  {'file': 'star_word', 'ko': '워드 마스터 별 (다른 게임으로 가는 별)', 'kind': 'cut', 'size': 800, 'use': '누르면 우주선 타고 워드 마스터(한글 게임)로',
   'prompt': 'A floating half-sphere mini world in a WORD and BOOK theme: the flat round TOP has giant colorful toy letter blocks (blank faces, no letters), stacks of big storybooks like little hills, a pencil-shaped tower and floating paper stars; the rounded BOTTOM is layered like the page edges of a thick book in pastel colors with a soft golden glow. Seen from slightly above (about 30 degrees). No readable text anywhere.'},
  {'file': 'egg_sleep', 'ko': '아직 태어나지 않은 별 (잠든 알)', 'kind': 'cut', 'size': 300, 'use': '업데이트로 태어날 새 교과·심화 단원',
   'prompt': 'A small cute baby star shaped like a round pearly egg, softly glowing white-lavender, with a sleeping peaceful face (closed eyes, tiny smile), a few little sparkles around it, floating.'},
  {'file': 'egg_crack', 'ko': '태어나는 중인 별 (금 간 알)', 'kind': 'cut', 'size': 300, 'use': '곧 열릴 새 별',
   'prompt': 'The same small pearly baby-star egg as a cute character, now with a zigzag crack on top and golden light shining out of the crack, eyes half open, excited expression, sparkles.'},
  {'file': 'egg_born', 'ko': '막 태어난 새 별', 'kind': 'cut', 'size': 300, 'use': '새로 열린 별 표시',
   'prompt': 'A newborn tiny five-pointed star character with round soft points, glowing warm yellow, big happy smiling face, pieces of pearly eggshell floating around it, confetti sparkles.'},
  {'file': 'ship', 'ko': '우주선 (옆모습)', 'kind': 'cut', 'size': 512, 'use': '별과 별 사이를 오가는 우주선',
   'prompt': 'A cute round school-bus-like spaceship for kids, seen from the side facing RIGHT, pastel orange and cream body, three round porthole windows, small rounded wings, a little bubble cockpit on top, soft glow, no pilot visible, no text.'},
  {'file': 'ship_fly', 'ko': '우주선 (날아가는 모습)', 'kind': 'cut', 'size': 640, 'use': '이동 연출',
   'prompt': 'The SAME cute pastel orange and cream round spaceship facing RIGHT (match the previous image), now flying with a soft rainbow-colored flame trail and little star sparkles behind it, slight upward tilt.'},
  {'file': 'sheet_space_deco', 'ko': '우주 꾸미기 9종', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'use': '우주 지도 꾸밈(떠다니는 것)',
   'names': [S('comet', '혜성', '', 'a cute comet with a soft blue tail'), S('ring_planet', '고리 행성', '', 'a small pastel ringed planet'),
             S('moon', '작은 달', '🌙', 'a small round cream moon with soft craters'), S('satellite', '인공위성', '', 'a cute toy satellite with solar panels'),
             S('shooting_star', '별똥별', '', 'a yellow shooting star with sparkle trail'), S('galaxy', '은하', '', 'a small swirl galaxy in pink and violet'),
             S('asteroid', '소행성', '🪨', 'a small round friendly grey space rock'), S('space_cloud', '우주 구름', '', 'a puffy lavender space cloud'),
             S('telescope', '망원경', '🔭', 'a cute toy telescope on a tripod')]},
 ]},

{'id': 'build', 'title': '별 위의 건물', 'folder': 'art/build', 'priority': 1,
 'note': '모든 건물은 같은 각도(살짝 위에서 본 3/4 모습), 흰 배경, 한 장에 건물 하나. 간판 글씨는 넣지 말아 주세요(이름은 앱에서 붙여요). 2×2로 네 채씩 한 장에 만들어도 돼요 — 그때는 파일 이름을 첫 번째 건물 이름으로 하고 알려 주세요.',
 'items': [
  # 가운데 별
  {'file': 'b_hall', 'star': '가운데 별', 'ko': '학생회관 (옥쌤의 즐거운 교실)', 'kind': 'cut', 'size': 640, 'use': '가운데 별의 중심 건물 — 내 기록, 오늘의 미션',
   'prompt': 'A big friendly two-story school building for kids with a round clock tower in the middle (clock face with no numbers), a small golden star flag on top, big arched front door, pastel cream walls and a soft coral roof, flower boxes under the windows.'},
  {'file': 'b_library', 'star': '가운데 별', 'ko': '이야기 도서관 (국어 — 읽기)', 'kind': 'cut', 'size': 512, 'use': '국어 읽기 차시',
   'prompt': 'A cute small library building whose roof looks like an open storybook, stacks of giant books forming the walls, a round reading window, warm yellow light inside.'},
  {'file': 'b_post', 'star': '가운데 별', 'ko': '동물 우체국 (국어 — 쓰기)', 'kind': 'cut', 'size': 512, 'use': '국어 쓰기·낱말 차시',
   'prompt': 'A cute small post office building shaped like a big red round mailbox, a letter slot above the door, a little envelope-shaped window, a paper airplane weather vane on the roof.'},
  {'file': 'b_broadcast', 'star': '가운데 별', 'ko': '방송국 (국어 — 말하기·듣기)', 'kind': 'cut', 'size': 512, 'use': '국어 말하기·듣기 차시',
   'prompt': 'A cute small broadcasting station building with a tall antenna tower on the roof, a giant microphone shape beside the door, a round red ON-AIR light with no text, pastel blue walls.'},
  {'file': 'b_english', 'star': '가운데 별', 'ko': '영어 여행사 (영어)', 'kind': 'cut', 'size': 512, 'use': '영어 차시',
   'prompt': 'A cute small travel agency building with a big spinning globe on the roof, a little airplane mobile hanging from the eaves, suitcases stacked by the door, mint green walls.'},
  {'file': 'b_adventure', 'star': '가운데 별', 'ko': '복습 모험장 (배운 것 복습 게임)', 'kind': 'cut', 'size': 512, 'use': '배운 글자·숫자로 하는 복습 모험 (정글 점프식 복습)',
   'prompt': 'A cute adventure park gate made of big leafy vines and wooden logs, with a springy trampoline and floating stepping stones behind it, a treasure chest near the entrance, playful and bright.'},
  {'file': 'b_arcade', 'star': '가운데 별', 'ko': '미니게임 놀이터', 'kind': 'cut', 'size': 512, 'use': '미니게임 모음',
   'prompt': 'A cute colorful striped play tent like a tiny carnival pavilion, with round pastel flags, a small ball-toss booth and a spinning star on top.'},
  {'file': 'b_myroom', 'star': '가운데 별', 'ko': '내 방 (꾸미기·기록)', 'kind': 'cut', 'size': 512, 'use': '모은 코인으로 꾸미는 내 방, 내 성장 기록',
   'prompt': 'A cute tiny cozy cottage with a round door, a heart-shaped window, a small chimney and a flower pot, soft pastel yellow walls and a sky-blue roof.'},
  {'file': 'b_dock', 'star': '가운데 별', 'ko': '우주 정거장 (출발하는 곳)', 'kind': 'cut', 'size': 512, 'use': '다른 별로 떠나는 곳',
   'prompt': 'A cute small spaceport launch pad: a round platform with glowing landing lights, a little control tower with a round window, and a curved boarding bridge, no spaceship on the pad.'},
  # 바다별
  {'file': 'b_music_hall', 'star': '바다별', 'ko': '숲속 음악당 (음악 — 감상·노래)', 'kind': 'cut', 'size': 512, 'use': '음악 감상·노래 차시',
   'prompt': 'A cute round music hall building shaped like a seashell bandshell, music-note shaped windows, little trees around it, pastel aqua and white.'},
  {'file': 'b_rhythm_stage', 'star': '바다별', 'ko': '리듬 스테이지 (음악 — 리듬·악기)', 'kind': 'cut', 'size': 512, 'use': '리듬·악기 연주 차시',
   'prompt': 'A cute small open-air round stage with a curved roof, a big drum and xylophone on the stage, colorful round spotlights on the roof edge, wooden floor.'},
  {'file': 'b_gugak', 'star': '바다별', 'ko': '국악 정자 (음악 — 우리 음악)', 'kind': 'cut', 'size': 512, 'use': '국악·전통 음악 차시',
   'prompt': 'A cute small traditional Korean pavilion (jeongja) with a curved tiled roof, red wooden pillars, and a janggu drum placed on its wooden floor, by a tiny pond.'},
  {'file': 'b_color_studio', 'star': '바다별', 'ko': '색깔 공방 (미술 — 색·그리기)', 'kind': 'cut', 'size': 512, 'use': '색·그리기 차시',
   'prompt': 'A cute small art workshop building shaped like a big paint bucket, colorful paint drips running down the roof edge, a giant paintbrush leaning by the door, rainbow windows.'},
  {'file': 'b_sculpt', 'star': '바다별', 'ko': '조형 스튜디오 (미술 — 만들기)', 'kind': 'cut', 'size': 512, 'use': '만들기·꾸미기 차시',
   'prompt': 'A cute small pottery and craft studio with a round kiln chimney, clay pots on the windowsill, a pottery wheel by the door, terracotta and cream colors.'},
  {'file': 'b_gallery', 'star': '바다별', 'ko': '바다 미술관 (미술 — 감상)', 'kind': 'cut', 'size': 512, 'use': '작품 감상·전시 차시',
   'prompt': 'A cute small art museum with a white dome roof, columns at the entrance, and empty picture frames on the outer walls, a little seahorse sculpture by the steps.'},
  # 사랑별
  {'file': 'b_bakery', 'star': '사랑별', 'ko': '동물 베이커리 (수학 — 수·세기)', 'kind': 'cut', 'size': 512, 'use': '수 세기·나누기 차시',
   'prompt': 'A cute small bakery building shaped like a layered strawberry cake, a cherry on top as the chimney, cookie-shaped windows, a striped awning over the door.'},
  {'file': 'b_mart', 'star': '사랑별', 'ko': '동물 마트 (수학 — 돈·계산)', 'kind': 'cut', 'size': 512, 'use': '돈 계산·장보기 차시',
   'prompt': 'A cute small grocery store with a big shopping-basket shaped roof sign (no text), fruit crates outside the door, a striped awning, glass front window.'},
  {'file': 'b_block_factory', 'star': '사랑별', 'ko': '숫자 블록 공장 (수학 — 도형·규칙)', 'kind': 'cut', 'size': 512, 'use': '도형·규칙·측정 차시',
   'prompt': 'A cute small toy factory built from big colorful building blocks (cubes, cylinders, triangles), a conveyor belt coming out of the door, a round gear on the wall.'},
  {'file': 'b_lab', 'star': '사랑별', 'ko': '실험실 (과학 — 물질·에너지)', 'kind': 'cut', 'size': 512, 'use': '실험·탐구 차시',
   'prompt': 'A cute small science lab building with a glass dome shaped like a round flask, bubbling green liquid inside the dome, a magnifying glass sign shape, white and mint walls.'},
  {'file': 'b_observatory', 'star': '사랑별', 'ko': '하늘 관측소 (과학 — 날씨·지구)', 'kind': 'cut', 'size': 512, 'use': '날씨·하늘·지구 차시',
   'prompt': 'A cute small observatory with a white round dome opened to show a telescope, a wind vane and a little rain gauge beside it, a cloud-shaped window.'},
  {'file': 'b_greenhouse', 'star': '사랑별', 'ko': '생태 온실 (과학 — 생명)', 'kind': 'cut', 'size': 512, 'use': '식물·동물·생태 차시',
   'prompt': 'A cute small glass greenhouse with a curved roof, green plants and a butterfly inside, a watering can by the door, a little pond with a frog statue.'},
  # 꿈별
  {'file': 'b_explorer', 'star': '꿈별', 'ko': '우리 동네 탐험대 (사회 — 마을·지도)', 'kind': 'cut', 'size': 512, 'use': '우리 동네·지도·시설 차시',
   'prompt': 'A cute small information center building with a big folded map shape on the wall (no writing), a compass on the roof, a tiny flag, binoculars on the windowsill.'},
  {'file': 'b_transit', 'star': '꿈별', 'ko': '교통센터 (사회 — 교통·안전)', 'kind': 'cut', 'size': 512, 'use': '버스·기차·교통 안전 차시',
   'prompt': 'A cute small transit center combining a bus stop shelter and a tiny train platform, a round clock with no numbers, a traffic light at the corner, a short crosswalk in front.'},
  {'file': 'b_safety', 'star': '꿈별', 'ko': '안전 도움 센터 (사회 — 안전·도움 요청)', 'kind': 'cut', 'size': 512, 'use': '위험할 때 도움 요청하기 차시',
   'prompt': 'A cute small friendly safety center building with a red and white striped roof, a round siren light on top (turned off), a first-aid cross shape on the wall, a little fire hydrant outside.'},
  {'file': 'b_meeting', 'star': '꿈별', 'ko': '마을 회의장 (사회 — 함께 사는 삶)', 'kind': 'cut', 'size': 512, 'use': '규칙·의견·권리 차시',
   'prompt': 'A cute small round community hall with a dome roof, big open doors showing a round table inside, benches and flower beds in front.'},
  {'file': 'b_museum', 'star': '꿈별', 'ko': '시간 여행 박물관 (사회 — 역사·문화)', 'kind': 'cut', 'size': 512, 'use': '옛날과 오늘·역사·문화 차시',
   'prompt': 'A cute small museum with a traditional Korean curved tile roof on top of a modern round building, a big hourglass statue by the entrance, stone steps.'},
  {'file': 'b_job_center', 'star': '꿈별', 'ko': '직업 체험관 (진로직업)', 'kind': 'cut', 'size': 512, 'use': '직업 알기·진로 차시',
   'prompt': 'A cute small building with many different little doors and windows showing tools of jobs (a chef hat, a wrench, a paint palette, a stethoscope shapes), a big star on the roof.'},
  {'file': 'b_shop_street', 'star': '꿈별', 'ko': '일터 거리 입구 (가게 타이쿤)', 'kind': 'cut', 'size': 512, 'use': '가게 운영 게임(타이쿤) 입구',
   'prompt': 'A cute small street gate arch decorated with bunting flags and hanging lanterns, with three tiny shop fronts behind it (a cafe, a flower shop, a workshop) with striped awnings, no text.'},
  # 햇살 농장
  {'file': 'b_farm', 'star': '햇살 농장 위성', 'ko': '햇살 농장', 'kind': 'cut', 'size': 512, 'use': '과학(자라기)·수학(세기)·진로(팔기)를 함께 하는 농장',
   'prompt': 'A cute small red barn with a white fence, a big sunflower beside it, a little windmill, a basket of vegetables at the door.'},
 ]},

{'id': 'char', 'title': '옥쌤과 별지기 캐릭터', 'folder': 'art/char', 'priority': 1,
 'note': '옥쌤은 지금 앱에 있는 옥쌤 그림(icons/mascot-cheer.png)을 참고 그림으로 꼭 함께 넣어 주세요. 별지기는 정글 점프 동물과 다른, 이 앱만의 새 친구들이에요(이름은 바꾸셔도 돼요).',
 'items': [
  {'file': 'ok_wave', 'ko': '옥쌤 — 손 흔들며 인사', 'kind': 'cut', 'size': 512, 'ref': 'icons/mascot-cheer.png', 'use': '첫 화면·시작 인사',
   'prompt': REF_OK + ' Full body, waving one hand hello with a warm smile.'},
  {'file': 'ok_point', 'ko': '옥쌤 — 옆을 가리키기', 'kind': 'cut', 'size': 512, 'ref': 'icons/mascot-cheer.png', 'use': '설명·안내',
   'prompt': REF_OK + ' Full body, standing and pointing with one hand to the RIGHT side, friendly explaining face.'},
  {'file': 'ok_think', 'ko': '옥쌤 — 생각하기', 'kind': 'cut', 'size': 512, 'ref': 'icons/mascot-cheer.png', 'use': '문제 낼 때',
   'prompt': REF_OK + ' Full body, one finger on her chin, looking up thoughtfully with a small smile, a tiny sparkle near her head.'},
  {'file': 'ok_clap', 'ko': '옥쌤 — 박수 치며 칭찬', 'kind': 'cut', 'size': 512, 'ref': 'icons/mascot-cheer.png', 'use': '정답·칭찬',
   'prompt': REF_OK + ' Full body, clapping her hands happily, eyes smiling.'},
  {'file': 'ok_comfort', 'ko': '옥쌤 — 괜찮아(격려)', 'kind': 'cut', 'size': 512, 'ref': 'icons/mascot-cheer.png', 'use': '틀렸을 때 다정한 격려',
   'prompt': REF_OK + ' Full body, gentle encouraging pose with both hands together near her chest, kind soft smile, head slightly tilted.'},
  {'file': 'ok_space', 'ko': '옥쌤 — 우주복', 'kind': 'cut', 'size': 512, 'ref': 'icons/mascot-cheer.png', 'use': '우주 여행 안내',
   'prompt': REF_OK + ' Full body, now wearing a cute lavender and white kids space suit with a star patch, holding a round bubble helmet under one arm, waving, same face and hair.'},
  {'file': 'sheet_robot', 'ko': '조종사 로봇 "별빛이" 3자세', 'kind': 'sheet', 'grid': (1, 3), 'size': 384, 'use': '우주선 조종사·이동 안내',
   'names': [S('robot_wave', '별빛이 인사', '', 'waving hello'), S('robot_point', '별빛이 가리키기', '', 'pointing to the right'), S('robot_cheer', '별빛이 만세', '', 'both arms up cheering')],
   'prompt_head': 'The same small cute round robot co-pilot character in 3 poses side by side in ONE row, evenly spaced with white gaps: a round white body, a glass dome head with a little star antenna, big friendly round screen eyes, pastel orange details matching a kids spaceship.'},
  {'file': 'sheet_guard_sea', 'ko': '바다별지기 "물결이"(아기 고래) 3자세', 'kind': 'sheet', 'grid': (1, 3), 'size': 384, 'use': '바다별 안내 (음악·미술)',
   'names': [S('sea_wave', '물결이 인사', '', 'waving a flipper hello'), S('sea_point', '물결이 가리키기', '', 'pointing to the right with a flipper'), S('sea_cheer', '물결이 만세', '', 'jumping happily with a little water spout')],
   'prompt_head': 'The same cute baby whale character standing upright like a mascot, in 3 poses side by side in ONE row, evenly spaced with white gaps: soft aqua-blue body, cream belly, tiny painter beret and small headphones around the neck.'},
  {'file': 'sheet_guard_love', 'ko': '사랑별지기 "콩이"(아기 고슴도치) 3자세', 'kind': 'sheet', 'grid': (1, 3), 'size': 384, 'use': '사랑별 안내 (수학·과학)',
   'names': [S('love_wave', '콩이 인사', '', 'waving hello'), S('love_point', '콩이 가리키기', '', 'pointing to the right'), S('love_cheer', '콩이 만세', '', 'both arms up cheering')],
   'prompt_head': 'The same cute baby hedgehog character in 3 poses side by side in ONE row, evenly spaced with white gaps: soft peach-pink rounded spines (not sharp), cream face, round lab goggles on the forehead, a small heart patch on its apron.'},
  {'file': 'sheet_guard_dream', 'ko': '꿈별지기 "몽실이"(아기 양) 3자세', 'kind': 'sheet', 'grid': (1, 3), 'size': 384, 'use': '꿈별 안내 (사회·진로직업)',
   'names': [S('dream_wave', '몽실이 인사', '', 'waving hello'), S('dream_point', '몽실이 가리키기', '', 'pointing to the right'), S('dream_cheer', '몽실이 만세', '', 'both arms up cheering')],
   'prompt_head': 'The same cute baby lamb character standing upright in 3 poses side by side in ONE row, evenly spaced with white gaps: fluffy lavender-white wool, small star-shaped hair clip, a little explorer backpack.'},
 ]},

# ───────────────────────────── 2순위 ─────────────────────────────
{'id': 'land', 'title': '별에 내렸을 때 배경', 'folder': 'art/space', 'priority': 2,
 'note': '별에 도착하면 보이는 가로 배경이에요. 건물 그림을 그 위에 올리니까 땅(아래 2/3)은 비워 주세요. 하늘에는 우주와 다른 별이 멀리 보여요.',
 'items': [
  {'file': 'land_center', 'ko': '가운데 별 위', 'kind': 'bg', 'ratio': '16:9', 'use': '학생회관 별 지도',
   'prompt': 'A wide horizontal scene standing on a small floating planet: soft green lawn and pastel paths covering the lower two thirds as wide EMPTY open ground (no buildings), a few round trees only at the far left and right edges, the sky above is starry deep space with a pink-teal nebula and three distant glowing planets (turquoise, pink, lavender). 16:9, 2400x1350.'},
  {'file': 'land_sea', 'ko': '바다별 위', 'kind': 'bg', 'ratio': '16:9', 'use': '음악·미술 지도',
   'prompt': 'A wide horizontal scene standing on a turquoise ocean planet: soft sand and shallow lagoon edges, coral and shells only at the edges, lower two thirds wide EMPTY sandy ground (no buildings), sky above is starry space with a big golden planet far away. 16:9, 2400x1350.'},
  {'file': 'land_love', 'ko': '사랑별 위', 'kind': 'bg', 'ratio': '16:9', 'use': '수학·과학 지도',
   'prompt': 'A wide horizontal scene standing on a pink and peach planet: soft pink grass, blossom trees only at the left and right edges, heart-shaped stepping stones, lower two thirds wide EMPTY ground (no buildings), sky above is starry space with a big golden planet far away. 16:9, 2400x1350.'},
  {'file': 'land_dream', 'ko': '꿈별 위', 'kind': 'bg', 'ratio': '16:9', 'use': '사회·진로직업 지도',
   'prompt': 'A wide horizontal scene standing on a lavender twilight planet: lilac grass, a few star-shaped street lamps at the edges, tiny winding road, lower two thirds wide EMPTY ground (no buildings), sky above is starry space with a small moon and a big golden planet far away. 16:9, 2400x1350.'},
  {'file': 'land_farm', 'ko': '햇살 농장 위', 'kind': 'bg', 'ratio': '16:9', 'use': '햇살 농장',
   'prompt': 'A wide horizontal scene standing on a small sunny farm planet: warm soil field rows and a wooden fence at the edges, lower two thirds wide EMPTY ground, sky above is soft starry space with a warm sunrise glow on the horizon. 16:9, 2400x1350.'},
 ]},

{'id': 'avatar', 'title': '학생 캐릭터 (내 캐릭터)', 'folder': 'art/avatar', 'priority': 2,
 'note': '학생이 고르는 내 캐릭터예요. 초등용(어린이)과 중·고등용(청소년)을 나눠요 — 고등학생도 유치하지 않게. 첫 장(kids)을 만든 뒤, 나머지 장에는 그 그림을 참고 그림으로 넣어 같은 얼굴을 유지해 주세요.',
 'items': [
  {'file': 'sheet_kids', 'ko': '어린이 4명 (초등)', 'kind': 'sheet', 'grid': (2, 2), 'size': 384, 'use': '초등 학생 캐릭터',
   'names': [S('kid_boy1', '남자아이 1', '', 'a Korean boy about 8 with short black hair, yellow hoodie, blue shorts'), S('kid_girl1', '여자아이 1', '', 'a Korean girl about 8 with two low pigtails, pink t-shirt, denim skirt'),
             S('kid_boy2', '남자아이 2', '', 'a Korean boy about 8 with round glasses and curly hair, green sweater, khaki pants'), S('kid_girl2', '여자아이 2', '', 'a Korean girl about 8 with a short bob, orange overalls, white shirt')],
   'prompt_head': 'Four different cute child characters, full body, standing and smiling, same style and same size:'},
  {'file': 'sheet_kids_space', 'ko': '어린이 4명 — 우주복', 'kind': 'sheet', 'grid': (2, 2), 'size': 384, 'use': '우주 여행할 때',
   'names': [S('kid_boy1_space', '남자아이 1 우주복', '', 'boy 1 in a yellow kids space suit'), S('kid_girl1_space', '여자아이 1 우주복', '', 'girl 1 in a pink kids space suit'),
             S('kid_boy2_space', '남자아이 2 우주복', '', 'boy 2 in a green kids space suit'), S('kid_girl2_space', '여자아이 2 우주복', '', 'girl 2 in an orange kids space suit')],
   'prompt_head': 'The SAME four children from the attached reference image (same faces and hair), now each wearing a cute rounded kids space suit with a star patch and holding a bubble helmet under one arm, full body, same order:'},
  {'file': 'sheet_teens', 'ko': '청소년 4명 (중·고등)', 'kind': 'sheet', 'grid': (2, 2), 'size': 384, 'use': '중·고등 학생 캐릭터',
   'names': [S('teen_boy1', '남학생 1', '', 'a Korean teenage boy about 16, short black hair, navy hoodie, jeans, sneakers'), S('teen_girl1', '여학생 1', '', 'a Korean teenage girl about 16, long straight hair in a ponytail, white shirt and beige cardigan'),
             S('teen_boy2', '남학생 2', '', 'a Korean teenage boy about 16, glasses, grey sweatshirt, cargo pants'), S('teen_girl2', '여학생 2', '', 'a Korean teenage girl about 16, short bob with a hair pin, mint zip jacket')],
   'prompt_head': 'Four different teenage student characters, full body, standing relaxed and smiling, slightly taller and more grown-up proportions than small children (not babyish) but still cute 3D style, same size:'},
  {'file': 'sheet_teens_space', 'ko': '청소년 4명 — 우주복', 'kind': 'sheet', 'grid': (2, 2), 'size': 384, 'use': '우주 여행할 때',
   'names': [S('teen_boy1_space', '남학생 1 우주복', '', 'teen boy 1 in a navy space suit'), S('teen_girl1_space', '여학생 1 우주복', '', 'teen girl 1 in a white and beige space suit'),
             S('teen_boy2_space', '남학생 2 우주복', '', 'teen boy 2 in a grey space suit'), S('teen_girl2_space', '여학생 2 우주복', '', 'teen girl 2 in a mint space suit')],
   'prompt_head': 'The SAME four teenagers from the attached reference image (same faces and hair), now each wearing a sleek rounded space suit with a star patch, holding a bubble helmet under one arm, full body, same order:'},
 ]},

{'id': 'scene', 'title': '차시 게임 장면 (배경·조각)', 'folder': 'art/scene', 'priority': 2,
 'note': '차시 게임 화면 위쪽 장면 띠와 게임판 배경이에요. 한 판 맞힐 때마다 조각이 하나씩 생기고 다 맞히면 장면이 완성돼요. 배경은 가운데와 아래를 비우고, 사람·동물은 넣지 마세요.',
 'items': [
  {'file': 'forest', 'ko': '숲 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 소리 숲, 정글 생태관, 생태 숲',
   'prompt': 'A wide horizontal scene of a magical friendly forest clearing seen from the front, tall rounded trees with soft green leaves on the left and right edges, a gentle dirt path and flower-less grass meadow filling the lower third, sunbeams through the canopy, small wooden signpost without text, open empty space in the center and bottom for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'forest_piece', 'ko': '숲 조각 — 한 판마다 피는 꽃', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute pink cosmos flower with a simple round bloom (no face) and two small leaves, 3D glossy toy style, centered.'},
  {'file': 'cafe', 'ko': '카페 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 동물 카페, 동물 베이커리, 스낵 바, 글로벌 베이커리',
   'prompt': 'A wide horizontal interior of a cozy animal cafe and bakery, wooden counter along the bottom, pastry display case, hanging lamps, big windows with trees outside, chalkboard menu without writing, empty clean counter surface and center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'cafe_piece', 'ko': '카페 조각 — 손님 자리에 놓이는 음료', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute latte cup on a small saucer with a heart latte art, soft steam, 3D glossy toy style, centered.'},
  {'file': 'post', 'ko': '우체국 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 낱말 우체국, 메시지 우체국, 안전 도움 센터',
   'prompt': 'A wide horizontal interior of a bright friendly village post office, red mailbox on the left, wall of wooden mail cubbies, parcels stacked neatly, service counter along the bottom, no writing on signs, open empty center and lower area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'post_piece', 'ko': '우체국 조각 — 배달된 편지', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute envelope with a red heart seal and a small stamp, slightly tilted, 3D glossy toy style, centered.'},
  {'file': 'station', 'ko': '기차역 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 규칙 기차역, 시간 여행 기차역, 버스 환승 마을, 여행 안내소',
   'prompt': 'A wide horizontal view of a cheerful small train station platform, railway track running left to right along the lower third, a big round station clock without numbers on a post, roof canopy, flower pots, mountains in the distance, empty track and center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'station_piece', 'ko': '기차역 조각 — 하나씩 이어지는 기차 칸', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute toy train carriage seen from the side, bright colors with round windows, 3D glossy toy style, centered.'},
  {'file': 'stage', 'ko': '무대 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 음악 전체: 리듬 산책길, 동물 오케스트라, 콘서트홀, 축제 무대…',
   'prompt': 'A wide horizontal view of a small friendly concert stage for children, red curtains on both sides, wooden stage floor along the bottom, unlit round spotlights on a bar at the top, musical instruments (drum, xylophone, tambourine) arranged at the sides, empty center of the stage for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'stage_piece', 'ko': '무대 조각 — 하나씩 켜지는 조명', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single glowing round stage spotlight lamp shining warm yellow light with a soft glow, 3D glossy toy style, centered.'},
  {'file': 'gallery', 'ko': '미술관·공방 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 미술 전체: 아틀리에, 디자인 센터, 미술관…',
   'prompt': "A wide horizontal interior of a bright children's art gallery and studio, pale walls with several EMPTY picture frames hanging in a row, wooden easel and paint jars at the sides, skylight, polished wooden floor in the lower third, open empty center for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger."},
  {'file': 'gallery_piece', 'ko': '미술관·공방 조각 — 벽에 걸리는 작품', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single small framed colorful abstract painting with a golden wooden frame, 3D glossy toy style, centered.'},
  {'file': 'mart', 'ko': '마트 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 동물 마트, 심부름 가게, 숫자 블록 공장, 분류·통계 센터',
   'prompt': 'A wide horizontal interior of a clean friendly small grocery store, shelves with fruits, vegetables and milk bottles on both sides, checkout counter at the bottom right, shopping baskets, no writing on labels, open empty aisle in the center for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'mart_piece', 'ko': '마트 조각 — 하나씩 차는 장바구니', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute shopping basket filled with an apple, a carrot and a milk bottle, 3D glossy toy style, centered.'},
  {'file': 'lab', 'ko': '실험실 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 실험실, 연구소, 과학 데이터룸, 에너지 실습관…',
   'prompt': "A wide horizontal interior of a colorful friendly children's science lab, white lab benches along the bottom, glass flasks with colorful liquids, microscope, magnifying glass, plants on shelves, big bright windows, open empty center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger."},
  {'file': 'lab_piece', 'ko': '실험실 조각 — 성공한 실험 병', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute round glass flask with bubbling bright green liquid and small sparkles, 3D glossy toy style, centered.'},
  {'file': 'sea', 'ko': '바닷가 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 바다 보호 본부, 바닷가 조사대, 물놀이 실험실',
   'prompt': 'A wide horizontal view of a calm clean beach and shallow turquoise sea, soft sand in the lower third, gentle waves, a small wooden pier on one side, rocks with seaweed, blue sky with small clouds, open empty center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'sea_piece', 'ko': '바닷가 조각 — 돌아오는 바다 친구', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute tropical fish, orange with white stripes, round friendly shape without scary teeth, 3D glossy toy style, centered.'},
  {'file': 'school', 'ko': '학교·방송국 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 토론 광장, 진로 스튜디오, 학교 방송국',
   'prompt': 'A wide horizontal interior of a warm friendly classroom, big green chalkboard left EMPTY at the back wall, wooden desks at the sides, bright windows with trees, a small microphone stand on one side, cork board with blank paper notes, open empty center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'school_piece', 'ko': '학교·방송국 조각 — 칭찬 스티커', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single shiny golden star sticker with a soft glow, 3D glossy toy style, centered.'},
  {'file': 'sky', 'ko': '하늘 관측소 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 하늘 관측소, 구름 실험관, 기후 대응 마을',
   'prompt': 'A wide horizontal view from a hilltop weather observatory with a small white dome and a wind vane on the left, big open sky with fluffy clouds, gentle green hills in the lower third, a small rain gauge and thermometer on a post (no numbers), open empty sky and center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'sky_piece', 'ko': '하늘 관측소 조각 — 맑아지는 구름', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single fluffy white cloud with no face with a small sun peeking behind it, 3D glossy toy style, centered.'},
  {'file': 'village', 'ko': '마을 광장 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 인사 광장, 안내소, 마을 지도, 놀이터…',
   'prompt': 'A wide horizontal view of a cozy Korean-style small town square, colorful cottages with dark windows along the back, a fountain on one side, flower beds and benches, cobblestone plaza in the lower third, evening golden sky, open empty plaza in the center for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'village_piece', 'ko': '마을 광장 조각 — 불이 켜지는 집', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute small cottage with warm glowing yellow windows and a red roof, 3D glossy toy style, centered.'},
  {'file': 'garden', 'ko': '정원·농장 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 글자 정원, 햇살 농장, 스마트 온실, 컬러 동물 정원',
   'prompt': 'A wide horizontal view of a sunny flower garden in front of a glass greenhouse, wooden fence, empty raised garden beds with dark soil along the lower third, watering can and small tools at the side, butterflies, open empty center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'garden_piece', 'ko': '정원·농장 조각 — 피어나는 꽃', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single bright red tulip in a tiny clay pot, 3D glossy toy style, centered.'},
  {'file': 'museum', 'ko': '박물관·이야기관 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 모험 이야기관, 동화 극장, 시간 여행 박물관',
   'prompt': "A wide horizontal interior of a friendly children's history museum, glass display cases with EMPTY stands, a traditional Korean roof model, old pottery on pedestals at the sides, warm spotlights, marble floor in the lower third, open empty center for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger."},
  {'file': 'museum_piece', 'ko': '박물관·이야기관 조각 — 찾은 보물', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single small traditional celadon pottery vase with a soft blue-green glaze and a tiny sparkle, 3D glossy toy style, centered.'},
  {'file': 'hall', 'ko': '마을 회의장·센터 배경', 'kind': 'bg', 'ratio': '16:9', 'use': '차시 게임 장면 — 마을 회의장, 봉사 활동 센터, 생활 서류 센터, 갈등 해결 극장',
   'prompt': 'A wide horizontal interior of a bright friendly community meeting hall, round wooden table with empty chairs in the lower third, blank whiteboard on the back wall, potted plants, big windows, notice board with blank colored papers, open empty center area for game cards, no people, no animals, no characters, 16:9, 1600x900 or larger.'},
  {'file': 'hall_piece', 'ko': '마을 회의장·센터 조각 — 모이는 의견 카드', 'kind': 'cut', 'size': 256, 'use': '한 판 맞힐 때마다 장면에 하나씩 생기는 조각',
   'prompt': 'A single cute speech bubble shaped card in soft yellow with a small green check mark, 3D glossy toy style, centered.'},
 ]},

# ───────────────────────────── 3순위: 그림 사전 ─────────────────────────────
{'id': 'act', 'title': '감정·행동 카드', 'folder': 'art/act', 'priority': 3,
 'note': '사회·국어·생활 차시에서 가장 많이 쓰는 그림이에요(“어떻게 할까요?” 문제). 같은 아이가 나와야 해서, 학생 캐릭터 그림(sheet_kids의 남자아이 1 또는 여자아이 1)을 참고 그림으로 넣어 주세요. 잘못된 행동도 무섭지 않게, 부드럽게.',
 'items': [
  {'file': 'sheet_feel', 'ko': '감정 9가지', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'ref': 'art/avatar/kid_boy1', 'use': '감정 알기·표현하기',
   'names': [S('feel_happy', '기뻐요', '😊😆😄', 'big happy smile'), S('feel_sad', '슬퍼요', '😢😭', 'sad with a small tear'), S('feel_angry', '화나요', '😠😡😤', 'angry frown with puffed cheeks (mild)'),
             S('feel_scared', '무서워요', '😨', 'scared, hugging itself'), S('feel_surprised', '놀라요', '😲', 'surprised with round eyes and open mouth'), S('feel_calm', '편안해요', '😌', 'calm and relaxed, eyes gently closed'),
             S('feel_tired', '졸려요', '😴💤', 'sleepy and yawning'), S('feel_sick', '아파요', '🤒', 'feeling sick with a hand on the tummy'), S('feel_proud', '뿌듯해요', '💪', 'proud, hands on hips')],
   'prompt_head': REF_KID + ' Upper-body portraits of the same child showing 9 feelings:'},
  {'file': 'sheet_do_school', 'ko': '학교 생활 행동 9가지', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'ref': 'art/avatar/kid_boy1', 'use': '인사·차례·학교 규칙',
   'names': [S('do_bow', '인사해요', '🙇', 'bowing politely to say hello'), S('do_hand_up', '손 들어요', '🙋✋', 'raising one hand high'), S('do_line_up', '줄 서요', '🧍', 'standing in line waiting, with a friend in front'),
             S('do_sit', '앉아요', '🪑', 'sitting nicely on a chair'), S('do_wash_hands', '손 씻어요', '🧼', 'washing hands at a sink with bubbles'), S('do_trash', '쓰레기 버려요', '🗑️', 'putting trash into a bin'),
             S('do_listen', '잘 들어요', '👂', 'listening carefully with a hand behind the ear'), S('do_clap', '박수 쳐요', '👏', 'clapping hands'), S('do_share', '나눠요', '🤝', 'sharing a toy with a friend')],
   'prompt_head': REF_KID + ' IMPORTANT: these are FULL-BODY ACTION scenes, NOT face portraits and NOT emotions. Full-body pictures of the same boy doing 9 school actions, each with the small prop it needs:'},
  {'file': 'sheet_do_safe', 'ko': '안전·도움 행동 9가지', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'ref': 'art/avatar/kid_boy1', 'use': '도움 요청·안전 차시',
   'names': [S('do_help', '도와주세요', '🙋🗣️', 'asking an adult for help, one hand raised'), S('do_stop', '멈춰요', '🛑', 'stopping at the edge of a crosswalk, one hand out'), S('do_walk', '걸어요', '🚶', 'walking calmly'),
             S('do_run', '뛰어요', '🏃', 'running fast'), S('do_ears', '귀를 막아요', '🙉', 'covering both ears'), S('do_quiet', '쉿, 조용히', '🤫', 'finger on lips saying shh'),
             S('do_cry', '울어요', '😭', 'crying'), S('do_push', '밀어요', '👐👊', 'pushing a friend (mild, not violent)'), S('do_ignore', '못 본 척해요', '🙈', 'covering eyes, looking away')],
   'prompt_head': REF_KID + ' IMPORTANT: these are FULL-BODY ACTION scenes, NOT face portraits and NOT emotions. Full-body pictures of the same boy in 9 safety situations, each with the small prop or person it needs:'},
  {'file': 'sheet_do_life', 'ko': '생활 자립 행동 9가지', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'ref': 'art/avatar/kid_boy1', 'use': '생활 자립·진로 차시',
   'names': [S('do_brush', '이 닦아요', '🪥', 'brushing teeth'), S('do_shoes', '신발 신어요', '👟', 'putting on shoes'), S('do_eat', '밥 먹어요', '🍚😋', 'eating rice with a spoon'),
             S('do_pour', '물 따라요', '💧', 'pouring water into a cup'), S('do_pay', '계산해요', '💵', 'paying at a shop counter'), S('do_card', '교통카드 찍어요', '💳', 'tapping a transit card on a bus reader'),
             S('do_call', '전화해요', '📞☎️', 'talking on a phone'), S('do_pack', '가방 챙겨요', '🎒', 'packing a school bag'), S('do_sleep', '잠자요', '🛌', 'sleeping in bed')],
   'prompt_head': REF_KID + ' Full-body pictures of the same child doing 9 daily-life actions:'},
 ]},

{'id': 'people', 'title': '사람 (직업·가족·이웃)', 'folder': 'art/people', 'priority': 3,
 'note': '모두 같은 귀여운 3D 인물 스타일, 전신, 웃는 얼굴. 한국 생활 모습으로.',
 'items': [
  {'file': 'sheet_people_help', 'ko': '도와주는 사람 9명', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'use': '도움 요청·우리 동네 차시',
   'names': [S('p_teacher', '선생님', '🧑‍🏫', 'a kind Korean school teacher holding a book'), S('p_nurse', '보건 선생님', '🧑‍⚕️🩹', 'a school nurse with a first-aid box'), S('p_police', '경찰관', '👮', 'a friendly Korean police officer'),
             S('p_firefighter', '소방관', '🧑‍🚒', 'a friendly firefighter with a helmet'), S('p_doctor', '의사', '👨‍⚕️', 'a doctor with a stethoscope'), S('p_pharmacist', '약사', '💊', 'a pharmacist holding a small medicine bag'),
             S('p_librarian', '사서', '📚', 'a librarian with a stack of books'), S('p_cook', '조리사', '🍱', 'a school cafeteria cook with a white hat and ladle'), S('p_guard', '안내 직원', '🧭', 'an information desk staff member pointing the way')],
   'prompt_head': 'Nine different friendly adult helper characters, full body, smiling:'},
  {'file': 'sheet_people_work', 'ko': '일하는 사람 9명', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'use': '직업·가게·진로 차시',
   'names': [S('p_cashier', '계산원', '🛒', 'a cashier at a counter'), S('p_barista', '바리스타', '☕', 'a barista holding a coffee cup'), S('p_baker', '제빵사', '🍞', 'a baker holding a tray of bread'),
             S('p_farmer', '농부', '🌾', 'a farmer with a straw hat and a basket'), S('p_delivery', '택배 기사', '📦', 'a delivery worker carrying a parcel'), S('p_driver', '버스 기사', '🚌', 'a bus driver with a cap'),
             S('p_cleaner', '환경미화원', '🧹', 'a street cleaner with a broom'), S('p_banker', '은행원', '🏦', 'a bank teller at a desk'), S('p_postman', '집배원', '📮', 'a mail carrier with a mail bag')],
   'prompt_head': 'Nine different friendly working adult characters, full body, smiling:'},
  {'file': 'sheet_people_career', 'ko': '진로 직업 9명', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'use': '중·고등 진로직업 차시',
   'names': [S('p_hair', '미용사', '💇', 'a hairdresser with scissors and comb'), S('p_wood', '목공 기술자', '🪚', 'a woodworker holding a small wooden chair'), S('p_packer', '물류 포장원', '📦', 'a packing worker taping a box'),
             S('p_care', '요양보호사', '🧓', 'a caregiver helping an elderly person walk'), S('p_office', '사무원', '💻', 'an office worker at a laptop'), S('p_gardener', '원예사', '🌱', 'a gardener with a watering can and plants'),
             S('p_musician', '음악가', '🎹', 'a musician holding a violin'), S('p_painter', '화가', '🎨', 'a painter with a palette and brush'), S('p_clerk', '주민센터 직원', '🏛️', 'a community service center clerk at a window desk')],
   'prompt_head': 'Nine different friendly adult worker characters, full body, smiling:'},
  {'file': 'sheet_people_family', 'ko': '가족·이웃 9명', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'use': '가족·관계·이웃 차시',
   'names': [S('p_mom', '엄마', '👩', 'a Korean mom'), S('p_dad', '아빠', '👨', 'a Korean dad'), S('p_grandma', '할머니', '👵', 'a Korean grandma'),
             S('p_grandpa', '할아버지', '👴', 'a Korean grandpa'), S('p_baby', '아기', '👶', 'a baby sitting'), S('p_sister', '언니·누나', '👧', 'a teenage older sister'),
             S('p_brother', '형·오빠', '👦', 'a teenage older brother'), S('p_friend_boy', '친구(남)', '🧒', 'a school friend boy'), S('p_neighbor', '이웃 아주머니', '🙋', 'a friendly neighbor lady waving')],
   'prompt_head': 'Nine different family and neighbor characters, full body, smiling:'},
 ]},

{'id': 'obj', 'title': '사물 그림 사전', 'folder': 'art/obj', 'priority': 3,
 'note': '지금 차시 카드에 이모지로 나오는 것들을 그림으로 바꿔요(525가지 중 자주 쓰는 것부터). 한 장에 9개씩. 받는 대로 해당 이모지가 그림으로 바뀌어요. 돈·시계·달력·숫자·도형·표지판처럼 글자나 숫자가 정확해야 하는 것은 제가 코드로 그려요.',
 'items': [
  {'file': 'sheet_fruit', 'ko': '과일', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('apple', '사과', '🍎', 'a red apple'), S('banana', '바나나', '🍌', 'a bunch of yellow bananas'), S('grape', '포도', '🍇', 'a bunch of purple grapes'),
    S('tangerine', '귤', '🍊', 'a Korean tangerine with a leaf'), S('pear', '배', '🍐', 'a round Korean pear'), S('peach', '복숭아', '🍑', 'a pink peach'),
    S('cherry', '체리', '🍒', 'two red cherries'), S('lemon', '레몬', '🍋', 'a yellow lemon'), S('pineapple', '파인애플', '🍍', 'a pineapple')]},
  {'file': 'sheet_food', 'ko': '음식·간식', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('rice', '밥', '🍚', 'a bowl of white rice'), S('pizza', '피자', '🍕', 'a slice of pizza'), S('burger', '햄버거', '🍔', 'a hamburger'),
    S('bread', '빵', '🍞', 'a loaf of bread'), S('cookie', '쿠키', '🍪', 'a chocolate chip cookie'), S('cake', '케이크', '🍰🎂', 'a slice of strawberry cake'),
    S('donut', '도넛', '🍩', 'a pink frosted donut'), S('icecream', '아이스크림', '🍦', 'a soft ice cream cone'), S('candy', '사탕', '🍬🍭', 'a wrapped candy')]},
  {'file': 'sheet_meal', 'ko': '음료·급식', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('milk', '우유', '🥛', 'a small milk carton (no text)'), S('juice', '주스', '🧃', 'a juice box with a straw'), S('water_cup', '물컵', '💧', 'a clear glass of water'),
    S('lunch_tray', '급식 식판', '🍱', 'a Korean school lunch tray with rice, soup and side dishes'), S('fried_egg', '달걀 프라이', '🍳', 'a fried egg on a small pan'), S('kimbap', '김밥', '', 'sliced kimbap rolls on a plate'),
    S('tteokbokki', '떡볶이', '', 'a small bowl of tteokbokki'), S('noodles', '국수·라면', '🍜', 'a bowl of noodles'), S('takeout_cup', '테이크아웃 컵', '🥤', 'a takeout drink cup with lid and straw')]},
  {'file': 'sheet_veg', 'ko': '채소', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('potato', '감자', '🥔', 'a potato'), S('sweet_potato', '고구마', '🍠', 'a sweet potato'), S('corn', '옥수수', '🌽', 'an ear of corn'),
    S('cucumber', '오이', '🥒', 'a cucumber'), S('onion', '양파', '🧅', 'an onion'), S('cabbage', '배추', '🥬', 'a Napa cabbage'),
    S('pumpkin', '호박', '🎃', 'a pumpkin with no face'), S('mushroom', '버섯', '🍄', 'a brown mushroom'), S('pepper', '고추', '🌶️', 'a red chili pepper')]},
  {'file': 'sheet_school', 'ko': '학용품', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('pencil', '연필', '✏️', 'a yellow pencil'), S('eraser', '지우개', '', 'a pink eraser'), S('ruler', '자', '📏', 'a wooden ruler with plain tick marks and no numbers'),
    S('scissors', '가위', '✂️', 'kids safety scissors'), S('glue', '풀', '', 'a glue stick'), S('crayons', '크레파스', '🖍️', 'a box of crayons'),
    S('notebook', '공책', '📓📝', 'a notebook'), S('book', '책', '📕📖📚', 'a closed red book'), S('backpack', '가방', '🎒', 'a school backpack')]},
  {'file': 'sheet_life1', 'ko': '생활 물건 1', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('alarm', '알람 시계', '⏰', 'a round twin-bell alarm clock with no numbers'), S('smartphone', '휴대폰', '📱', 'a smartphone with a blank screen'), S('telephone', '전화기', '☎️', 'a home telephone'),
    S('key', '열쇠', '🔑', 'a golden key'), S('umbrella', '우산', '☂️', 'an open umbrella'), S('toothbrush', '칫솔', '🪥', 'a toothbrush with toothpaste'),
    S('soap', '비누', '🧼', 'a bar of soap with bubbles'), S('towel', '수건', '', 'a folded towel'), S('spoon', '숟가락·젓가락', '🥄', 'a Korean spoon and chopsticks')]},
  {'file': 'sheet_life2', 'ko': '생활 물건 2 (집)', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('chair', '의자', '🪑', 'a wooden chair'), S('bed', '침대', '🛌🛏️', 'a small bed with a pillow'), S('tv', 'TV', '📺', 'a TV with a blank screen'),
    S('fridge', '냉장고', '🧊', 'a refrigerator'), S('fan', '선풍기', '🌀', 'an electric fan'), S('bulb', '전구', '💡', 'a glowing light bulb'),
    S('flashlight', '손전등', '🔦', 'a flashlight'), S('trash_can', '쓰레기통', '🗑️', 'a trash can with a lid'), S('eco_bag', '장바구니', '🛍️', 'a reusable shopping bag')]},
  {'file': 'sheet_life3', 'ko': '생활 물건 3', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('wallet', '지갑', '👛', 'a wallet'), S('card', '카드', '💳', 'a plain blue card with no text'), S('id_card', '신분증', '🪪', 'a plain ID card with a photo shape and no text'),
    S('ticket', '표', '🎫', 'a plain ticket with no text'), S('gift', '선물', '🎁', 'a wrapped gift box with a ribbon'), S('balloon', '풍선', '🎈', 'a red balloon'),
    S('teddy', '인형', '🧸', 'a teddy bear'), S('game', '게임기', '🎮', 'a handheld game controller'), S('camera', '카메라', '📷📸', 'a camera')]},
  {'file': 'sheet_clothes', 'ko': '옷·신발', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('tshirt', '티셔츠', '👕', 'a t-shirt'), S('shorts', '반바지', '🩳', 'shorts'), S('coat', '외투', '🧥', 'a warm winter coat'),
    S('scarf', '목도리', '🧣', 'a knitted scarf'), S('gloves', '장갑', '🧤', 'knitted gloves'), S('cap', '모자', '🧢', 'a baseball cap'),
    S('sneakers', '운동화', '👟', 'sneakers'), S('sandals', '샌들', '🩴', 'sandals'), S('swimsuit', '수영복', '🩱', 'a kids swimsuit')]},
  {'file': 'sheet_vehicle', 'ko': '탈것 1', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('car', '자동차', '🚗', 'a small car'), S('bus', '버스', '🚌', 'a city bus with no text'), S('taxi', '택시', '🚕', 'a taxi with a blank roof sign'),
    S('ambulance', '구급차', '🚑', 'an ambulance'), S('firetruck', '소방차', '🚒', 'a fire truck'), S('policecar', '경찰차', '🚓', 'a police car'),
    S('bicycle', '자전거', '🚲', 'a bicycle'), S('train', '기차', '🚂🚉🚃', 'a passenger train'), S('airplane', '비행기', '✈️', 'an airplane')]},
  {'file': 'sheet_vehicle2', 'ko': '탈것 2', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('boat', '배', '⛵🚢', 'a small boat'), S('subway', '지하철', '🚇', 'a subway train'), S('truck', '트럭', '🚚', 'a delivery truck'),
    S('motorbike', '오토바이', '🛵', 'a scooter motorbike'), S('kickboard', '킥보드', '🛴', 'a kick scooter'), S('helicopter', '헬리콥터', '🚁', 'a helicopter'),
    S('excavator', '포클레인', '🚜', 'an excavator'), S('wheelchair', '휠체어', '♿', 'a wheelchair'), S('elevator', '엘리베이터', '🛗', 'an elevator with open doors')]},
  {'file': 'sheet_place', 'ko': '장소 1', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('pl_school', '학교', '🏫', 'a small school building'), S('pl_hospital', '병원', '🏥', 'a small hospital with a cross'), S('pl_bank', '은행', '🏦', 'a small bank building'),
    S('pl_post', '우체국', '📮', 'a small post office with a red mailbox'), S('pl_police', '경찰서', '🚔', 'a small police station'), S('pl_fire', '소방서', '🚒', 'a small fire station'),
    S('pl_mart', '마트', '🛒', 'a small supermarket'), S('pl_library', '도서관', '📚', 'a small library'), S('pl_park', '공원', '🌳🏞️', 'a small park with trees and a bench')]},
  {'file': 'sheet_place2', 'ko': '장소 2', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('pl_pharmacy', '약국', '💊', 'a small pharmacy'), S('pl_busstop', '버스 정류장', '🚏', 'a bus stop shelter'), S('pl_station', '기차역', '🚉', 'a small train station'),
    S('pl_toilet', '화장실', '🚻', 'a clean restroom door with simple man and woman symbols'), S('pl_cafeteria', '급식실', '🍱', 'a school cafeteria with tables'), S('pl_center', '주민센터', '🏛️', 'a small community service center'),
    S('pl_cinema', '영화관', '🎬', 'a small movie theater'), S('pl_home', '집', '🏠', 'a cozy house'), S('pl_ground', '운동장', '⚽', 'a school playground with a soccer goal')]},
  {'file': 'sheet_music', 'ko': '악기 1', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('drum', '북', '🥁', 'a drum with sticks'), S('xylophone', '실로폰', '🎼', 'a rainbow xylophone with mallets'), S('piano', '피아노', '🎹', 'a small upright piano'),
    S('tambourine', '탬버린', '🔔', 'a tambourine'), S('triangle', '트라이앵글', '🔺', 'a triangle with a beater'), S('recorder', '리코더', '', 'a recorder'),
    S('guitar', '기타', '🎸', 'an acoustic guitar'), S('maracas', '마라카스', '', 'a pair of maracas'), S('janggu', '장구', '', 'a Korean janggu drum')]},
  {'file': 'sheet_music2', 'ko': '악기 2', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('sogo', '소고', '', 'a Korean sogo hand drum with a stick'), S('kkwaenggwari', '꽹과리', '', 'a Korean kkwaenggwari small gong'), S('jing', '징', '', 'a Korean jing large gong'),
    S('castanets', '캐스터네츠', '', 'castanets'), S('violin', '바이올린', '🎻', 'a violin'), S('trumpet', '트럼펫', '🎺', 'a trumpet'),
    S('bell', '종', '', 'a hand bell'), S('danso', '단소', '', 'a Korean danso bamboo flute'), S('headphones', '헤드폰', '🎧', 'headphones')]},
  {'file': 'sheet_art', 'ko': '미술 도구', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('brush', '붓', '🖌️', 'a paintbrush with paint on the tip'), S('palette', '팔레트', '🎨', 'a paint palette with colors'), S('watercolor', '물감', '', 'a watercolor paint set'),
    S('clay', '찰흙', '', 'colorful clay lumps'), S('easel', '이젤', '🖼️', 'an easel with a blank canvas'), S('sketchbook', '스케치북', '', 'an open sketchbook with a blank page'),
    S('inkstone', '먹과 벼루', '', 'a Korean ink stick and inkstone'), S('water_jar', '물통', '', 'a painting water jar'), S('colored_pencil', '색연필', '', 'colored pencils')]},
  {'file': 'sheet_sci', 'ko': '과학 도구', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('magnifier', '돋보기', '🔎🔍', 'a magnifying glass'), S('thermometer', '온도계', '🌡️', 'a thermometer with no numbers'), S('scale', '저울', '⚖️', 'a balance scale'),
    S('magnet', '자석', '🧲', 'a red and blue horseshoe magnet'), S('beaker', '비커', '🧪', 'a beaker with blue liquid'), S('dropper', '스포이트', '', 'a dropper'),
    S('microscope', '현미경', '🔬', 'a microscope'), S('compass', '나침반', '🧭', 'a compass with no letters'), S('battery_bulb', '전지와 전구', '🔋', 'a battery connected to a small bulb')]},
  {'file': 'sheet_measure', 'ko': '재는 도구', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('tape_measure', '줄자', '📐', 'a tape measure'), S('protractor', '각도기', '', 'a protractor with plain tick marks'), S('hourglass', '모래시계', '⏳⌛', 'an hourglass'),
    S('measuring_cup', '계량컵', '', 'a measuring cup'), S('measuring_spoon', '계량스푼', '', 'measuring spoons'), S('stopwatch', '스톱워치', '⏱️', 'a stopwatch with no numbers'),
    S('prism', '프리즘', '', 'a glass prism with a rainbow'), S('mirror', '거울', '🪞', 'a hand mirror'), S('bathroom_scale', '체중계', '', 'a bathroom scale')]},
  {'file': 'sheet_weather', 'ko': '날씨·하늘', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('sun', '해', '☀️', 'a bright round sun with no face'), S('cloud', '구름', '☁️', 'a fluffy cloud'), S('rain', '비', '🌧️', 'a rain cloud with drops'),
    S('snow', '눈', '❄️', 'a snow cloud with snowflakes'), S('rainbow', '무지개', '🌈', 'a rainbow with small clouds'), S('wind', '바람', '💨🌬️', 'swirling wind lines with a leaf'),
    S('moon_night', '달', '🌙', 'a crescent moon'), S('star', '별', '⭐', 'a yellow star'), S('lightning', '번개', '⚡', 'a thunder cloud with a lightning bolt')]},
  {'file': 'sheet_nature', 'ko': '자연', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('tree', '나무', '🌳', 'a round green tree'), S('flower', '꽃', '🌸🌷', 'a pink flower'), S('grass', '풀', '🌿', 'a tuft of grass'),
    S('rock', '돌', '🪨', 'a grey rock'), S('mountain', '산', '⛰️', 'a green mountain'), S('river', '강', '', 'a small river flowing between grass'),
    S('wave', '바다', '🌊', 'a blue ocean wave'), S('fire', '불', '🔥', 'a small campfire'), S('leaf', '낙엽', '🍂', 'autumn leaves')]},
  {'file': 'sheet_animal', 'ko': '동물 1', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('fish', '물고기', '🐟', 'a small fish'), S('turtle', '거북', '🐢', 'a turtle'), S('bird', '새', '🐦', 'a little bird'),
    S('eagle', '독수리', '🦅', 'an eagle'), S('butterfly', '나비', '🦋', 'a butterfly'), S('chicken', '닭', '🐔', 'a chicken'),
    S('cow', '소', '🐄', 'a cow'), S('pig', '돼지', '🐷', 'a pig'), S('duck', '오리', '🦆', 'a duck')]},
  {'file': 'sheet_animal2', 'ko': '동물 2', 'kind': 'sheet', 'grid': (3, 3), 'size': 256, 'names': [
    S('sheep', '양', '🐑', 'a sheep'), S('horse', '말', '🐴', 'a horse'), S('squirrel', '다람쥐', '🐿️', 'a squirrel'),
    S('whale', '고래', '🐳', 'a whale'), S('dolphin', '돌고래', '🐬', 'a dolphin'), S('crab', '게', '🦀', 'a crab'),
    S('octopus', '문어', '🐙', 'an octopus'), S('ant', '개미', '🐜', 'an ant'), S('snail', '달팽이', '🐌', 'a snail')]},
 ]},
]

# 이전 문서(docs/gemini-prompts-scenes.md)의 차시 장면 15종 — 이름 그대로 받으면 함께 넣습니다.
SCENE_KEYS = ['forest', 'cafe', 'post', 'station', 'stage', 'gallery', 'mart', 'lab', 'sea', 'school', 'sky', 'village', 'garden', 'museum', 'hall']


def sheet_prompt(it):
    r, c = it['grid']
    n = r * c
    names = it['names']
    rows = []
    for i in range(r):
        cells = names[i * c:(i + 1) * c]
        label = ('Row %d (left to right): ' % (i + 1)) if r > 1 else 'From left to right: '
        rows.append(label + '; '.join('%d) %s' % (i * c + j + 1, x[3]) for j, x in enumerate(cells)) + '.')
    head = it.get('prompt_head', 'Nine different cute 3D icon objects:')
    grid = SHEET.format(r=r, c=c, n=n)
    if r == 1:
        grid = ('%d separate poses in ONE horizontal row, evenly spaced with wide empty white gaps, same size, not touching, '
                'pure plain white background, no labels, wide 3:1 image.' % c)
    return ' '.join([STYLE, head, ' '.join(rows), grid])


def full_prompt(g, it):
    if it['kind'] == 'sheet':
        return sheet_prompt(it)
    parts = [STYLE]
    if g['id'] in ('space', 'land'):
        parts.append(SPACE)
    parts.append(it['prompt'])
    if it['kind'] == 'cut':
        parts.append(ISO)
    return ' '.join(parts)


def all_keys():
    """(key, 폴더, 이모지, 한글) — 최종으로 생기는 그림 파일 목록"""
    out = []
    for g in GROUPS:
        for it in g['items']:
            if it['kind'] == 'sheet':
                for k, ko, emo, _ in it['names']:
                    out.append((k, g['folder'], emo, ko))
            else:
                out.append((it['file'], g['folder'], '', it['ko']))
    return out
