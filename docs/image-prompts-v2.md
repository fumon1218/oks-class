# 그림 프롬프트 — 우주 콘셉트·교과 공간·그림 사전

옥쌤의 즐거운 교실(초·중·고 교육 앱)을 **우주 여행** 콘셉트로 바꾸는 데 필요한 그림 목록입니다. 정글 점프(강원특수교육원 홍보 게임)와 겹치지 않는 이 앱만의 그림이에요.
작업 페이지(`docs/image-prompts.html`)에서 복사 버튼으로 쓰면 편해요. 목록 원본은 `scripts/art_manifest.py`.

## 보내 주실 때

- 파일 이름을 표 그대로 해 주세요 (예: star_sea.png, sheet_fruit.png). png·jpg·webp 모두 괜찮아요. 여러 장은 zip 하나로 주셔도 돼요.
- 글자·숫자·로고가 들어가면 다시 만들어 주세요. 이름과 숫자는 앱에서 붙여요.
- 하나짜리 그림(건물·별·캐릭터)은 흰 배경이면 충분해요. 투명 배경이면 더 좋아요. 흰 배경은 제가 지워요.
- 여러 개를 한 장에(sheet_…) 그릴 때는 물건끼리 닿지 않게, 순서는 왼쪽 위부터 오른쪽으로. 순서가 바뀌면 알려 주세요.
- 캐릭터는 첫 그림을 참고 그림으로 함께 넣어야 같은 얼굴이 유지돼요 (옥쌤은 지금 앱의 옥쌤 그림).
- 돈·시계·달력·숫자·도형·색·표지판처럼 정확해야 하는 것은 제가 코드로 그려요. 만들지 않으셔도 돼요.
- 받은 것부터 바로 넣어요. 한꺼번에 다 주지 않으셔도 돼요.

### 어느 도구로?

- 챗GPT: 투명 배경과 여러 개 한 장(sheet)에 강해요 → 건물·사물·사람 추천.
- 제미나이: 참고 그림을 보고 같은 캐릭터 유지하기, 넓은 배경에 강해요 → 옥쌤·별지기·배경 추천.
- 프롬프트는 영어 그대로 붙여 넣으세요 (공통 그림체 문장이 이미 앞에 들어 있어요).

### 공통 그림체 (모든 프롬프트 앞에 이미 들어 있음)

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark.
```

---

## [1순위] 우주·별 — 그림 13장 → 파일 21개

> 첫 화면(우주 지도)에 쓰는 그림입니다. 별은 흰 배경 위에 하나씩, 위쪽 평평한 땅은 비워 두세요(건물은 따로 올려요).

### `space_bg.png` — 우주 배경 (가로)
- 비율 16:9 · 첫 화면 전체 배경 (태블릿·PC)

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A vast wide deep-space background, dark navy to violet gradient, soft pink and teal nebula clouds, countless tiny twinkling stars of different sizes, two or three faint distant galaxies, NO planets, NO spaceships, the whole middle area calm and empty so planets can be placed on top, 16:9, 2400x1350 or larger.
```

### `space_bg_tall.png` — 우주 배경 (세로)
- 비율 9:16 · 휴대폰 세로 화면용 배경

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. The same vast deep-space background as a tall vertical image, dark navy to violet gradient, soft pink and teal nebula, countless tiny twinkling stars, NO planets, calm empty middle, 9:16, 1350x2400 or larger.
```

### `star_center.png` — 가운데 별 (학생회관 별)
- 비율 1:1 · 우주 한가운데 떠 있는 큰 별. 학생회관·부대시설이 올라가요

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A floating half-sphere mini world: the TOP is a flat round surface like a small park plaza with soft green lawn, pastel stone paths and a few round trees only at the rim; the BOTTOM is a rounded rocky half-ball with warm golden crystals and tiny dangling roots and a soft golden glow around it. Seen from slightly above (about 30 degrees) so the flat top looks like a wide oval. The top surface must be mostly EMPTY open ground (buildings will be added separately). Warm sunny golden theme. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `star_sea.png` — 바다별 (음악·미술)
- 비율 1:1 · 음악·미술 건물이 올라가는 별

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A floating half-sphere mini world in a turquoise ocean theme: the flat round TOP has a sandy beach ring, a small calm lagoon at one side, coral and seashells at the rim, and mostly EMPTY open sand in the middle; the rounded BOTTOM is made of glowing aqua-blue crystal with tiny waterfalls dripping off the edge and turning into sparkles. Seen from slightly above (about 30 degrees), flat top looks like a wide oval. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `star_love.png` — 사랑별 (수학·과학)
- 비율 1:1 · 수학·과학 건물이 올라가는 별

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A floating half-sphere mini world in a warm pink and peach theme: the flat round TOP has soft pink grass, blossom trees only at the rim and small heart-shaped stepping stones, mostly EMPTY open ground in the middle; the rounded BOTTOM is glowing rose-quartz crystal with a soft pink glow. Seen from slightly above (about 30 degrees), flat top looks like a wide oval. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `star_dream.png` — 꿈별 (사회·진로직업)
- 비율 1:1 · 사회·진로직업 건물이 올라가는 별

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A floating half-sphere mini world in a lavender twilight theme: the flat round TOP has lilac grass, a few star-shaped street lamps and tiny winding roads at the rim, mostly EMPTY open ground in the middle; the rounded BOTTOM is glowing purple amethyst crystal, with a tiny moon orbiting nearby. Seen from slightly above (about 30 degrees), flat top looks like a wide oval. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `star_farm.png` — 햇살 농장 위성 (여러 교과 함께)
- 비율 1:1 · 가운데 별 옆 작은 위성. 햇살 농장이 올라가요

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A small floating half-sphere mini world in a sunny farm theme: the flat round TOP has neat vegetable field rows and a wooden fence at the rim, open empty ground in the middle; the rounded BOTTOM is warm brown soil and rock with a few carrots and roots poking out, soft sunny glow. Seen from slightly above (about 30 degrees). Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `egg_sleep.png` — 아직 태어나지 않은 별 (잠든 알)
- 비율 1:1 · 업데이트로 태어날 새 교과·심화 단원

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A small cute baby star shaped like a round pearly egg, softly glowing white-lavender, with a sleeping peaceful face (closed eyes, tiny smile), a few little sparkles around it, floating. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `egg_crack.png` — 태어나는 중인 별 (금 간 알)
- 비율 1:1 · 곧 열릴 새 별

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. The same small pearly baby-star egg as a cute character, now with a zigzag crack on top and golden light shining out of the crack, eyes half open, excited expression, sparkles. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `egg_born.png` — 막 태어난 새 별
- 비율 1:1 · 새로 열린 별 표시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A newborn tiny five-pointed star character with round soft points, glowing warm yellow, big happy smiling face, pieces of pearly eggshell floating around it, confetti sparkles. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `ship.png` — 우주선 (옆모습)
- 비율 1:1 · 별과 별 사이를 오가는 우주선

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A cute round school-bus-like spaceship for kids, seen from the side facing RIGHT, pastel orange and cream body, three round porthole windows, small rounded wings, a little bubble cockpit on top, soft glow, no pilot visible, no text. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `ship_fly.png` — 우주선 (날아가는 모습)
- 비율 1:1 · 이동 연출

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. The SAME cute pastel orange and cream round spaceship facing RIGHT (match the previous image), now flying with a soft rainbow-colored flame trail and little star sparkles behind it, slight upward tilt. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `sheet_space_deco.png` — 우주 꾸미기 9종
- 비율 1:1 · 우주 지도 꾸밈(떠다니는 것)
- 칸 순서: 1.혜성 / 2.고리 행성 / 3.작은 달 / 4.인공위성 / 5.별똥별 / 6.은하 / 7.소행성 / 8.우주 구름 / 9.망원경

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a cute comet with a soft blue tail; 2) a small pastel ringed planet; 3) a small round cream moon with soft craters. Row 2 (left to right): 4) a cute toy satellite with solar panels; 5) a yellow shooting star with sparkle trail; 6) a small swirl galaxy in pink and violet. Row 3 (left to right): 7) a small round friendly grey space rock; 8) a puffy lavender space cloud; 9) a cute toy telescope on a tripod. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

---

## [1순위] 별 위의 건물 — 그림 29장 → 파일 29개

> 모든 건물은 같은 각도(살짝 위에서 본 3/4 모습), 흰 배경, 한 장에 건물 하나. 간판 글씨는 넣지 말아 주세요(이름은 앱에서 붙여요). 2×2로 네 채씩 한 장에 만들어도 돼요 — 그때는 파일 이름을 첫 번째 건물 이름으로 하고 알려 주세요.

### `b_hall.png` — 학생회관 (옥쌤의 즐거운 교실)
- 비율 1:1 · 가운데 별 · 가운데 별의 중심 건물 — 내 기록, 오늘의 미션

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A big friendly two-story school building for kids with a round clock tower in the middle (clock face with no numbers), a small golden star flag on top, big arched front door, pastel cream walls and a soft coral roof, flower boxes under the windows. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_library.png` — 이야기 도서관 (국어 — 읽기)
- 비율 1:1 · 가운데 별 · 국어 읽기 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small library building whose roof looks like an open storybook, stacks of giant books forming the walls, a round reading window, warm yellow light inside. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_post.png` — 동물 우체국 (국어 — 쓰기)
- 비율 1:1 · 가운데 별 · 국어 쓰기·낱말 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small post office building shaped like a big red round mailbox, a letter slot above the door, a little envelope-shaped window, a paper airplane weather vane on the roof. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_broadcast.png` — 방송국 (국어 — 말하기·듣기)
- 비율 1:1 · 가운데 별 · 국어 말하기·듣기 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small broadcasting station building with a tall antenna tower on the roof, a giant microphone shape beside the door, a round red ON-AIR light with no text, pastel blue walls. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_english.png` — 영어 여행사 (영어)
- 비율 1:1 · 가운데 별 · 영어 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small travel agency building with a big spinning globe on the roof, a little airplane mobile hanging from the eaves, suitcases stacked by the door, mint green walls. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_adventure.png` — 복습 모험장 (배운 것 복습 게임)
- 비율 1:1 · 가운데 별 · 배운 글자·숫자로 하는 복습 모험 (정글 점프식 복습)

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute adventure park gate made of big leafy vines and wooden logs, with a springy trampoline and floating stepping stones behind it, a treasure chest near the entrance, playful and bright. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_arcade.png` — 미니게임 놀이터
- 비율 1:1 · 가운데 별 · 미니게임 모음

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute colorful striped play tent like a tiny carnival pavilion, with round pastel flags, a small ball-toss booth and a spinning star on top. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_myroom.png` — 내 방 (꾸미기·기록)
- 비율 1:1 · 가운데 별 · 모은 코인으로 꾸미는 내 방, 내 성장 기록

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute tiny cozy cottage with a round door, a heart-shaped window, a small chimney and a flower pot, soft pastel yellow walls and a sky-blue roof. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_dock.png` — 우주 정거장 (출발하는 곳)
- 비율 1:1 · 가운데 별 · 다른 별로 떠나는 곳

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small spaceport launch pad: a round platform with glowing landing lights, a little control tower with a round window, and a curved boarding bridge, no spaceship on the pad. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_music_hall.png` — 숲속 음악당 (음악 — 감상·노래)
- 비율 1:1 · 바다별 · 음악 감상·노래 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute round music hall building shaped like a seashell bandshell, music-note shaped windows, little trees around it, pastel aqua and white. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_rhythm_stage.png` — 리듬 스테이지 (음악 — 리듬·악기)
- 비율 1:1 · 바다별 · 리듬·악기 연주 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small open-air round stage with a curved roof, a big drum and xylophone on the stage, colorful round spotlights on the roof edge, wooden floor. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_gugak.png` — 국악 정자 (음악 — 우리 음악)
- 비율 1:1 · 바다별 · 국악·전통 음악 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small traditional Korean pavilion (jeongja) with a curved tiled roof, red wooden pillars, and a janggu drum placed on its wooden floor, by a tiny pond. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_color_studio.png` — 색깔 공방 (미술 — 색·그리기)
- 비율 1:1 · 바다별 · 색·그리기 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small art workshop building shaped like a big paint bucket, colorful paint drips running down the roof edge, a giant paintbrush leaning by the door, rainbow windows. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_sculpt.png` — 조형 스튜디오 (미술 — 만들기)
- 비율 1:1 · 바다별 · 만들기·꾸미기 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small pottery and craft studio with a round kiln chimney, clay pots on the windowsill, a pottery wheel by the door, terracotta and cream colors. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_gallery.png` — 바다 미술관 (미술 — 감상)
- 비율 1:1 · 바다별 · 작품 감상·전시 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small art museum with a white dome roof, columns at the entrance, and empty picture frames on the outer walls, a little seahorse sculpture by the steps. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_bakery.png` — 동물 베이커리 (수학 — 수·세기)
- 비율 1:1 · 사랑별 · 수 세기·나누기 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small bakery building shaped like a layered strawberry cake, a cherry on top as the chimney, cookie-shaped windows, a striped awning over the door. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_mart.png` — 동물 마트 (수학 — 돈·계산)
- 비율 1:1 · 사랑별 · 돈 계산·장보기 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small grocery store with a big shopping-basket shaped roof sign (no text), fruit crates outside the door, a striped awning, glass front window. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_block_factory.png` — 숫자 블록 공장 (수학 — 도형·규칙)
- 비율 1:1 · 사랑별 · 도형·규칙·측정 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small toy factory built from big colorful building blocks (cubes, cylinders, triangles), a conveyor belt coming out of the door, a round gear on the wall. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_lab.png` — 실험실 (과학 — 물질·에너지)
- 비율 1:1 · 사랑별 · 실험·탐구 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small science lab building with a glass dome shaped like a round flask, bubbling green liquid inside the dome, a magnifying glass sign shape, white and mint walls. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_observatory.png` — 하늘 관측소 (과학 — 날씨·지구)
- 비율 1:1 · 사랑별 · 날씨·하늘·지구 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small observatory with a white round dome opened to show a telescope, a wind vane and a little rain gauge beside it, a cloud-shaped window. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_greenhouse.png` — 생태 온실 (과학 — 생명)
- 비율 1:1 · 사랑별 · 식물·동물·생태 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small glass greenhouse with a curved roof, green plants and a butterfly inside, a watering can by the door, a little pond with a frog statue. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_explorer.png` — 우리 동네 탐험대 (사회 — 마을·지도)
- 비율 1:1 · 꿈별 · 우리 동네·지도·시설 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small information center building with a big folded map shape on the wall (no writing), a compass on the roof, a tiny flag, binoculars on the windowsill. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_transit.png` — 교통센터 (사회 — 교통·안전)
- 비율 1:1 · 꿈별 · 버스·기차·교통 안전 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small transit center combining a bus stop shelter and a tiny train platform, a round clock with no numbers, a traffic light at the corner, a short crosswalk in front. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_safety.png` — 안전 도움 센터 (사회 — 안전·도움 요청)
- 비율 1:1 · 꿈별 · 위험할 때 도움 요청하기 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small friendly safety center building with a red and white striped roof, a round siren light on top (turned off), a first-aid cross shape on the wall, a little fire hydrant outside. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_meeting.png` — 마을 회의장 (사회 — 함께 사는 삶)
- 비율 1:1 · 꿈별 · 규칙·의견·권리 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small round community hall with a dome roof, big open doors showing a round table inside, benches and flower beds in front. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_museum.png` — 시간 여행 박물관 (사회 — 역사·문화)
- 비율 1:1 · 꿈별 · 옛날과 오늘·역사·문화 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small museum with a traditional Korean curved tile roof on top of a modern round building, a big hourglass statue by the entrance, stone steps. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_job_center.png` — 직업 체험관 (진로직업)
- 비율 1:1 · 꿈별 · 직업 알기·진로 차시

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small building with many different little doors and windows showing tools of jobs (a chef hat, a wrench, a paint palette, a stethoscope shapes), a big star on the roof. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_shop_street.png` — 일터 거리 입구 (가게 타이쿤)
- 비율 1:1 · 꿈별 · 가게 운영 게임(타이쿤) 입구

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small street gate arch decorated with bunting flags and hanging lanterns, with three tiny shop fronts behind it (a cafe, a flower shop, a workshop) with striped awnings, no text. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `b_farm.png` — 햇살 농장
- 비율 1:1 · 햇살 농장 위성 · 과학(자라기)·수학(세기)·진로(팔기)를 함께 하는 농장

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. A cute small red barn with a white fence, a big sunflower beside it, a little windmill, a basket of vegetables at the door. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

---

## [1순위] 옥쌤과 별지기 캐릭터 — 그림 10장 → 파일 18개

> 옥쌤은 지금 앱에 있는 옥쌤 그림(icons/mascot-cheer.png)을 참고 그림으로 꼭 함께 넣어 주세요. 별지기는 정글 점프 동물과 다른, 이 앱만의 새 친구들이에요(이름은 바꾸셔도 돼요).

### `ok_wave.png` — 옥쌤 — 손 흔들며 인사
- 비율 1:1 · 첫 화면·시작 인사
- **참고 그림: 지금 앱의 옥쌤 그림 (함께 보내 드린 mascot-cheer.png)**

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image of the teacher character and keep her exactly the same (same face, long wavy brown hair, lavender puff-sleeve dress with a cream bow). Full body, waving one hand hello with a warm smile. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `ok_point.png` — 옥쌤 — 옆을 가리키기
- 비율 1:1 · 설명·안내
- **참고 그림: 지금 앱의 옥쌤 그림 (함께 보내 드린 mascot-cheer.png)**

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image of the teacher character and keep her exactly the same (same face, long wavy brown hair, lavender puff-sleeve dress with a cream bow). Full body, standing and pointing with one hand to the RIGHT side, friendly explaining face. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `ok_think.png` — 옥쌤 — 생각하기
- 비율 1:1 · 문제 낼 때
- **참고 그림: 지금 앱의 옥쌤 그림 (함께 보내 드린 mascot-cheer.png)**

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image of the teacher character and keep her exactly the same (same face, long wavy brown hair, lavender puff-sleeve dress with a cream bow). Full body, one finger on her chin, looking up thoughtfully with a small smile, a tiny question-mark-free sparkle near her head. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `ok_clap.png` — 옥쌤 — 박수 치며 칭찬
- 비율 1:1 · 정답·칭찬
- **참고 그림: 지금 앱의 옥쌤 그림 (함께 보내 드린 mascot-cheer.png)**

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image of the teacher character and keep her exactly the same (same face, long wavy brown hair, lavender puff-sleeve dress with a cream bow). Full body, clapping her hands happily, eyes smiling. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `ok_comfort.png` — 옥쌤 — 괜찮아(격려)
- 비율 1:1 · 틀렸을 때 다정한 격려
- **참고 그림: 지금 앱의 옥쌤 그림 (함께 보내 드린 mascot-cheer.png)**

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image of the teacher character and keep her exactly the same (same face, long wavy brown hair, lavender puff-sleeve dress with a cream bow). Full body, gentle encouraging pose with both hands together near her chest, kind soft smile, head slightly tilted. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `ok_space.png` — 옥쌤 — 우주복
- 비율 1:1 · 우주 여행 안내
- **참고 그림: 지금 앱의 옥쌤 그림 (함께 보내 드린 mascot-cheer.png)**

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image of the teacher character and keep her exactly the same (same face, long wavy brown hair, lavender puff-sleeve dress with a cream bow). Full body, now wearing a cute lavender and white kids space suit with a star patch, holding a round bubble helmet under one arm, waving, same face and hair. Single subject isolated and centered on a pure plain white background (transparent background if possible), whole subject visible with empty margin around it, no ground shadow, no frame, square 1:1.
```

### `sheet_robot.png` — 조종사 로봇 "별빛이" 3자세
- 비율 3:1 · 우주선 조종사·이동 안내
- 칸 순서: 1.별빛이 인사 / 2.별빛이 가리키기 / 3.별빛이 만세

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. The same small cute round robot co-pilot character in 3 poses side by side in ONE row, evenly spaced with white gaps: a round white body, a glass dome head with a little star antenna, big friendly round screen eyes, pastel orange details matching a kids spaceship. From left to right: 1) waving hello; 2) pointing to the right; 3) both arms up cheering. 3 separate poses in ONE horizontal row, evenly spaced with wide empty white gaps, same size, not touching, pure plain white background, no labels, wide 3:1 image.
```

### `sheet_guard_sea.png` — 바다별지기 "물결이"(아기 고래) 3자세
- 비율 3:1 · 바다별 안내 (음악·미술)
- 칸 순서: 1.물결이 인사 / 2.물결이 가리키기 / 3.물결이 만세

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. The same cute baby whale character standing upright like a mascot, in 3 poses side by side in ONE row, evenly spaced with white gaps: soft aqua-blue body, cream belly, tiny painter beret and small headphones around the neck. From left to right: 1) waving a flipper hello; 2) pointing to the right with a flipper; 3) jumping happily with a little water spout. 3 separate poses in ONE horizontal row, evenly spaced with wide empty white gaps, same size, not touching, pure plain white background, no labels, wide 3:1 image.
```

### `sheet_guard_love.png` — 사랑별지기 "콩이"(아기 고슴도치) 3자세
- 비율 3:1 · 사랑별 안내 (수학·과학)
- 칸 순서: 1.콩이 인사 / 2.콩이 가리키기 / 3.콩이 만세

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. The same cute baby hedgehog character in 3 poses side by side in ONE row, evenly spaced with white gaps: soft peach-pink rounded spines (not sharp), cream face, round lab goggles on the forehead, a small heart patch on its apron. From left to right: 1) waving hello; 2) pointing to the right; 3) both arms up cheering. 3 separate poses in ONE horizontal row, evenly spaced with wide empty white gaps, same size, not touching, pure plain white background, no labels, wide 3:1 image.
```

### `sheet_guard_dream.png` — 꿈별지기 "몽실이"(아기 양) 3자세
- 비율 3:1 · 꿈별 안내 (사회·진로직업)
- 칸 순서: 1.몽실이 인사 / 2.몽실이 가리키기 / 3.몽실이 만세

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. The same cute baby lamb character standing upright in 3 poses side by side in ONE row, evenly spaced with white gaps: fluffy lavender-white wool, small star-shaped hair clip, a little explorer backpack. From left to right: 1) waving hello; 2) pointing to the right; 3) both arms up cheering. 3 separate poses in ONE horizontal row, evenly spaced with wide empty white gaps, same size, not touching, pure plain white background, no labels, wide 3:1 image.
```

---

## [2순위] 별에 내렸을 때 배경 — 그림 5장 → 파일 5개

> 별에 도착하면 보이는 가로 배경이에요. 건물 그림을 그 위에 올리니까 땅(아래 2/3)은 비워 주세요. 하늘에는 우주와 다른 별이 멀리 보여요.

### `land_center.png` — 가운데 별 위
- 비율 16:9 · 학생회관 별 지도

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A wide horizontal scene standing on a small floating planet: soft green lawn and pastel paths covering the lower two thirds as wide EMPTY open ground (no buildings), a few round trees only at the far left and right edges, the sky above is starry deep space with a pink-teal nebula and three distant glowing planets (turquoise, pink, lavender). 16:9, 2400x1350.
```

### `land_sea.png` — 바다별 위
- 비율 16:9 · 음악·미술 지도

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A wide horizontal scene standing on a turquoise ocean planet: soft sand and shallow lagoon edges, coral and shells only at the edges, lower two thirds wide EMPTY sandy ground (no buildings), sky above is starry space with a big golden planet far away. 16:9, 2400x1350.
```

### `land_love.png` — 사랑별 위
- 비율 16:9 · 수학·과학 지도

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A wide horizontal scene standing on a pink and peach planet: soft pink grass, blossom trees only at the left and right edges, heart-shaped stepping stones, lower two thirds wide EMPTY ground (no buildings), sky above is starry space with a big golden planet far away. 16:9, 2400x1350.
```

### `land_dream.png` — 꿈별 위
- 비율 16:9 · 사회·진로직업 지도

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A wide horizontal scene standing on a lavender twilight planet: lilac grass, a few star-shaped street lamps at the edges, tiny winding road, lower two thirds wide EMPTY ground (no buildings), sky above is starry space with a small moon and a big golden planet far away. 16:9, 2400x1350.
```

### `land_farm.png` — 햇살 농장 위
- 비율 16:9 · 햇살 농장

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Dreamy magical outer space mood, deep navy and violet sky with soft pink and teal nebula glow, tiny twinkling stars, calm and cozy, never scary. A wide horizontal scene standing on a small sunny farm planet: warm soil field rows and a wooden fence at the edges, lower two thirds wide EMPTY ground, sky above is soft starry space with a warm sunrise glow on the horizon. 16:9, 2400x1350.
```

---

## [2순위] 학생 캐릭터 (내 캐릭터) — 그림 4장 → 파일 16개

> 학생이 고르는 내 캐릭터예요. 초등용(어린이)과 중·고등용(청소년)을 나눠요 — 고등학생도 유치하지 않게. 첫 장(kids)을 만든 뒤, 나머지 장에는 그 그림을 참고 그림으로 넣어 같은 얼굴을 유지해 주세요.

### `sheet_kids.png` — 어린이 4명 (초등)
- 비율 1:1 · 초등 학생 캐릭터
- 칸 순서: 1.남자아이 1 / 2.여자아이 1 / 3.남자아이 2 / 4.여자아이 2

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Four different cute child characters, full body, standing and smiling, same style and same size: Row 1 (left to right): 1) a Korean boy about 8 with short black hair, yellow hoodie, blue shorts; 2) a Korean girl about 8 with two low pigtails, pink t-shirt, denim skirt. Row 2 (left to right): 3) a Korean boy about 8 with round glasses and curly hair, green sweater, khaki pants; 4) a Korean girl about 8 with a short bob, orange overalls, white shirt. A 2x2 grid sprite sheet: 4 separate items arranged in 2 rows and 2 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_kids_space.png` — 어린이 4명 — 우주복
- 비율 1:1 · 우주 여행할 때
- 칸 순서: 1.남자아이 1 우주복 / 2.여자아이 1 우주복 / 3.남자아이 2 우주복 / 4.여자아이 2 우주복

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. The SAME four children from the attached reference image (same faces and hair), now each wearing a cute rounded kids space suit with a star patch and holding a bubble helmet under one arm, full body, same order: Row 1 (left to right): 1) boy 1 in a yellow kids space suit; 2) girl 1 in a pink kids space suit. Row 2 (left to right): 3) boy 2 in a green kids space suit; 4) girl 2 in an orange kids space suit. A 2x2 grid sprite sheet: 4 separate items arranged in 2 rows and 2 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_teens.png` — 청소년 4명 (중·고등)
- 비율 1:1 · 중·고등 학생 캐릭터
- 칸 순서: 1.남학생 1 / 2.여학생 1 / 3.남학생 2 / 4.여학생 2

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Four different teenage student characters, full body, standing relaxed and smiling, slightly taller and more grown-up proportions than small children (not babyish) but still cute 3D style, same size: Row 1 (left to right): 1) a Korean teenage boy about 16, short black hair, navy hoodie, jeans, sneakers; 2) a Korean teenage girl about 16, long straight hair in a ponytail, white shirt and beige cardigan. Row 2 (left to right): 3) a Korean teenage boy about 16, glasses, grey sweatshirt, cargo pants; 4) a Korean teenage girl about 16, short bob with a hair pin, mint zip jacket. A 2x2 grid sprite sheet: 4 separate items arranged in 2 rows and 2 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_teens_space.png` — 청소년 4명 — 우주복
- 비율 1:1 · 우주 여행할 때
- 칸 순서: 1.남학생 1 우주복 / 2.여학생 1 우주복 / 3.남학생 2 우주복 / 4.여학생 2 우주복

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. The SAME four teenagers from the attached reference image (same faces and hair), now each wearing a sleek rounded space suit with a star patch, holding a bubble helmet under one arm, full body, same order: Row 1 (left to right): 1) teen boy 1 in a navy space suit; 2) teen girl 1 in a white and beige space suit. Row 2 (left to right): 3) teen boy 2 in a grey space suit; 4) teen girl 2 in a mint space suit. A 2x2 grid sprite sheet: 4 separate items arranged in 2 rows and 2 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

---

## [3순위] 감정·행동 카드 — 그림 4장 → 파일 36개

> 사회·국어·생활 차시에서 가장 많이 쓰는 그림이에요(“어떻게 할까요?” 문제). 같은 아이가 나와야 해서, 학생 캐릭터 그림(sheet_kids의 남자아이 1 또는 여자아이 1)을 참고 그림으로 넣어 주세요. 잘못된 행동도 무섭지 않게, 부드럽게.

### `sheet_feel.png` — 감정 9가지
- 비율 1:1 · 감정 알기·표현하기
- **참고 그림: 학생 캐릭터 sheet_kids 그림**
- 칸 순서: 1.기뻐요 / 2.슬퍼요 / 3.화나요 / 4.무서워요 / 5.놀라요 / 6.편안해요 / 7.졸려요 / 8.아파요 / 9.뿌듯해요

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image (student avatar sheet) and keep the SAME child exactly (same face, hair and clothes) in every cell. Upper-body portraits of the same child showing 9 feelings: Row 1 (left to right): 1) big happy smile; 2) sad with a small tear; 3) angry frown with puffed cheeks (mild). Row 2 (left to right): 4) scared, hugging itself; 5) surprised with round eyes and open mouth; 6) calm and relaxed, eyes gently closed. Row 3 (left to right): 7) sleepy and yawning; 8) feeling sick with a hand on the tummy; 9) proud, hands on hips. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_do_school.png` — 학교 생활 행동 9가지
- 비율 1:1 · 인사·차례·학교 규칙
- **참고 그림: 학생 캐릭터 sheet_kids 그림**
- 칸 순서: 1.인사해요 / 2.손 들어요 / 3.줄 서요 / 4.앉아요 / 5.손 씻어요 / 6.쓰레기 버려요 / 7.잘 들어요 / 8.박수 쳐요 / 9.나눠요

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image (student avatar sheet) and keep the SAME child exactly (same face, hair and clothes) in every cell. Full-body pictures of the same child doing 9 school actions: Row 1 (left to right): 1) bowing politely to say hello; 2) raising one hand high; 3) standing in line waiting, with a friend in front. Row 2 (left to right): 4) sitting nicely on a chair; 5) washing hands at a sink with bubbles; 6) putting trash into a bin. Row 3 (left to right): 7) listening carefully with a hand behind the ear; 8) clapping hands; 9) sharing a toy with a friend. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_do_safe.png` — 안전·도움 행동 9가지
- 비율 1:1 · 도움 요청·안전 차시
- **참고 그림: 학생 캐릭터 sheet_kids 그림**
- 칸 순서: 1.도와주세요 / 2.멈춰요 / 3.걸어요 / 4.뛰어요 / 5.귀를 막아요 / 6.쉿, 조용히 / 7.울어요 / 8.밀어요 / 9.못 본 척해요

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image (student avatar sheet) and keep the SAME child exactly (same face, hair and clothes) in every cell. Full-body pictures of the same child in 9 safety situations: Row 1 (left to right): 1) asking an adult for help, one hand raised; 2) stopping at the edge of a crosswalk, one hand out; 3) walking calmly. Row 2 (left to right): 4) running fast; 5) covering both ears; 6) finger on lips saying shh. Row 3 (left to right): 7) crying; 8) pushing a friend (mild, not violent); 9) covering eyes, looking away. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_do_life.png` — 생활 자립 행동 9가지
- 비율 1:1 · 생활 자립·진로 차시
- **참고 그림: 학생 캐릭터 sheet_kids 그림**
- 칸 순서: 1.이 닦아요 / 2.신발 신어요 / 3.밥 먹어요 / 4.물 따라요 / 5.계산해요 / 6.교통카드 찍어요 / 7.전화해요 / 8.가방 챙겨요 / 9.잠자요

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Use the attached reference image (student avatar sheet) and keep the SAME child exactly (same face, hair and clothes) in every cell. Full-body pictures of the same child doing 9 daily-life actions: Row 1 (left to right): 1) brushing teeth; 2) putting on shoes; 3) eating rice with a spoon. Row 2 (left to right): 4) pouring water into a cup; 5) paying at a shop counter; 6) tapping a transit card on a bus reader. Row 3 (left to right): 7) talking on a phone; 8) packing a school bag; 9) sleeping in bed. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

---

## [3순위] 사람 (직업·가족·이웃) — 그림 4장 → 파일 36개

> 모두 같은 귀여운 3D 인물 스타일, 전신, 웃는 얼굴. 한국 생활 모습으로.

### `sheet_people_help.png` — 도와주는 사람 9명
- 비율 1:1 · 도움 요청·우리 동네 차시
- 칸 순서: 1.선생님 / 2.보건 선생님 / 3.경찰관 / 4.소방관 / 5.의사 / 6.약사 / 7.사서 / 8.조리사 / 9.안내 직원

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different friendly adult helper characters, full body, smiling: Row 1 (left to right): 1) a kind Korean school teacher holding a book; 2) a school nurse with a first-aid box; 3) a friendly Korean police officer. Row 2 (left to right): 4) a friendly firefighter with a helmet; 5) a doctor with a stethoscope; 6) a pharmacist holding a small medicine bag. Row 3 (left to right): 7) a librarian with a stack of books; 8) a school cafeteria cook with a white hat and ladle; 9) an information desk staff member pointing the way. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_people_work.png` — 일하는 사람 9명
- 비율 1:1 · 직업·가게·진로 차시
- 칸 순서: 1.계산원 / 2.바리스타 / 3.제빵사 / 4.농부 / 5.택배 기사 / 6.버스 기사 / 7.환경미화원 / 8.은행원 / 9.집배원

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different friendly working adult characters, full body, smiling: Row 1 (left to right): 1) a cashier at a counter; 2) a barista holding a coffee cup; 3) a baker holding a tray of bread. Row 2 (left to right): 4) a farmer with a straw hat and a basket; 5) a delivery worker carrying a parcel; 6) a bus driver with a cap. Row 3 (left to right): 7) a street cleaner with a broom; 8) a bank teller at a desk; 9) a mail carrier with a mail bag. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_people_career.png` — 진로 직업 9명
- 비율 1:1 · 중·고등 진로직업 차시
- 칸 순서: 1.미용사 / 2.목공 기술자 / 3.물류 포장원 / 4.요양보호사 / 5.사무원 / 6.원예사 / 7.음악가 / 8.화가 / 9.주민센터 직원

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different friendly adult worker characters, full body, smiling: Row 1 (left to right): 1) a hairdresser with scissors and comb; 2) a woodworker holding a small wooden chair; 3) a packing worker taping a box. Row 2 (left to right): 4) a caregiver helping an elderly person walk; 5) an office worker at a laptop; 6) a gardener with a watering can and plants. Row 3 (left to right): 7) a musician holding a violin; 8) a painter with a palette and brush; 9) a community service center clerk at a window desk. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_people_family.png` — 가족·이웃 9명
- 비율 1:1 · 가족·관계·이웃 차시
- 칸 순서: 1.엄마 / 2.아빠 / 3.할머니 / 4.할아버지 / 5.아기 / 6.언니·누나 / 7.형·오빠 / 8.친구(남) / 9.이웃 아주머니

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different family and neighbor characters, full body, smiling: Row 1 (left to right): 1) a Korean mom; 2) a Korean dad; 3) a Korean grandma. Row 2 (left to right): 4) a Korean grandpa; 5) a baby sitting; 6) a teenage older sister. Row 3 (left to right): 7) a teenage older brother; 8) a school friend boy; 9) a friendly neighbor lady waving. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

---

## [3순위] 사물 그림 사전 — 그림 22장 → 파일 198개

> 지금 차시 카드에 이모지로 나오는 것들을 그림으로 바꿔요(525가지 중 자주 쓰는 것부터). 한 장에 9개씩. 받는 대로 해당 이모지가 그림으로 바뀌어요. 돈·시계·달력·숫자·도형·표지판처럼 글자나 숫자가 정확해야 하는 것은 제가 코드로 그려요.

### `sheet_fruit.png` — 과일
- 비율 1:1 · 
- 칸 순서: 1.사과 / 2.바나나 / 3.포도 / 4.귤 / 5.배 / 6.복숭아 / 7.체리 / 8.레몬 / 9.파인애플

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a red apple; 2) a bunch of yellow bananas; 3) a bunch of purple grapes. Row 2 (left to right): 4) a Korean tangerine with a leaf; 5) a round Korean pear; 6) a pink peach. Row 3 (left to right): 7) two red cherries; 8) a yellow lemon; 9) a pineapple. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_food.png` — 음식·간식
- 비율 1:1 · 
- 칸 순서: 1.밥 / 2.피자 / 3.햄버거 / 4.빵 / 5.쿠키 / 6.케이크 / 7.도넛 / 8.아이스크림 / 9.사탕

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a bowl of white rice; 2) a slice of pizza; 3) a hamburger. Row 2 (left to right): 4) a loaf of bread; 5) a chocolate chip cookie; 6) a slice of strawberry cake. Row 3 (left to right): 7) a pink frosted donut; 8) a soft ice cream cone; 9) a wrapped candy. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_meal.png` — 음료·급식
- 비율 1:1 · 
- 칸 순서: 1.우유 / 2.주스 / 3.물컵 / 4.급식 식판 / 5.달걀 프라이 / 6.김밥 / 7.떡볶이 / 8.국수·라면 / 9.테이크아웃 컵

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a small milk carton (no text); 2) a juice box with a straw; 3) a clear glass of water. Row 2 (left to right): 4) a Korean school lunch tray with rice, soup and side dishes; 5) a fried egg on a small pan; 6) sliced kimbap rolls on a plate. Row 3 (left to right): 7) a small bowl of tteokbokki; 8) a bowl of noodles; 9) a takeout drink cup with lid and straw. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_veg.png` — 채소
- 비율 1:1 · 
- 칸 순서: 1.감자 / 2.고구마 / 3.옥수수 / 4.오이 / 5.양파 / 6.배추 / 7.호박 / 8.버섯 / 9.고추

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a potato; 2) a sweet potato; 3) an ear of corn. Row 2 (left to right): 4) a cucumber; 5) an onion; 6) a Napa cabbage. Row 3 (left to right): 7) a pumpkin with no face; 8) a brown mushroom; 9) a red chili pepper. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_school.png` — 학용품
- 비율 1:1 · 
- 칸 순서: 1.연필 / 2.지우개 / 3.자 / 4.가위 / 5.풀 / 6.크레파스 / 7.공책 / 8.책 / 9.가방

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a yellow pencil; 2) a pink eraser; 3) a wooden ruler with plain tick marks and no numbers. Row 2 (left to right): 4) kids safety scissors; 5) a glue stick; 6) a box of crayons. Row 3 (left to right): 7) a notebook; 8) a closed red book; 9) a school backpack. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_life1.png` — 생활 물건 1
- 비율 1:1 · 
- 칸 순서: 1.알람 시계 / 2.휴대폰 / 3.전화기 / 4.열쇠 / 5.우산 / 6.칫솔 / 7.비누 / 8.수건 / 9.숟가락·젓가락

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a round twin-bell alarm clock with no numbers; 2) a smartphone with a blank screen; 3) a home telephone. Row 2 (left to right): 4) a golden key; 5) an open umbrella; 6) a toothbrush with toothpaste. Row 3 (left to right): 7) a bar of soap with bubbles; 8) a folded towel; 9) a Korean spoon and chopsticks. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_life2.png` — 생활 물건 2 (집)
- 비율 1:1 · 
- 칸 순서: 1.의자 / 2.침대 / 3.TV / 4.냉장고 / 5.선풍기 / 6.전구 / 7.손전등 / 8.쓰레기통 / 9.장바구니

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a wooden chair; 2) a small bed with a pillow; 3) a TV with a blank screen. Row 2 (left to right): 4) a refrigerator; 5) an electric fan; 6) a glowing light bulb. Row 3 (left to right): 7) a flashlight; 8) a trash can with a lid; 9) a reusable shopping bag. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_life3.png` — 생활 물건 3
- 비율 1:1 · 
- 칸 순서: 1.지갑 / 2.카드 / 3.신분증 / 4.표 / 5.선물 / 6.풍선 / 7.인형 / 8.게임기 / 9.카메라

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a wallet; 2) a plain blue card with no text; 3) a plain ID card with a photo shape and no text. Row 2 (left to right): 4) a plain ticket with no text; 5) a wrapped gift box with a ribbon; 6) a red balloon. Row 3 (left to right): 7) a teddy bear; 8) a handheld game controller; 9) a camera. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_clothes.png` — 옷·신발
- 비율 1:1 · 
- 칸 순서: 1.티셔츠 / 2.반바지 / 3.외투 / 4.목도리 / 5.장갑 / 6.모자 / 7.운동화 / 8.샌들 / 9.수영복

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a t-shirt; 2) shorts; 3) a warm winter coat. Row 2 (left to right): 4) a knitted scarf; 5) knitted gloves; 6) a baseball cap. Row 3 (left to right): 7) sneakers; 8) sandals; 9) a kids swimsuit. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_vehicle.png` — 탈것 1
- 비율 1:1 · 
- 칸 순서: 1.자동차 / 2.버스 / 3.택시 / 4.구급차 / 5.소방차 / 6.경찰차 / 7.자전거 / 8.기차 / 9.비행기

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a small car; 2) a city bus with no text; 3) a taxi with a blank roof sign. Row 2 (left to right): 4) an ambulance; 5) a fire truck; 6) a police car. Row 3 (left to right): 7) a bicycle; 8) a passenger train; 9) an airplane. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_vehicle2.png` — 탈것 2
- 비율 1:1 · 
- 칸 순서: 1.배 / 2.지하철 / 3.트럭 / 4.오토바이 / 5.킥보드 / 6.헬리콥터 / 7.포클레인 / 8.휠체어 / 9.엘리베이터

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a small boat; 2) a subway train; 3) a delivery truck. Row 2 (left to right): 4) a scooter motorbike; 5) a kick scooter; 6) a helicopter. Row 3 (left to right): 7) an excavator; 8) a wheelchair; 9) an elevator with open doors. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_place.png` — 장소 1
- 비율 1:1 · 
- 칸 순서: 1.학교 / 2.병원 / 3.은행 / 4.우체국 / 5.경찰서 / 6.소방서 / 7.마트 / 8.도서관 / 9.공원

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a small school building; 2) a small hospital with a cross; 3) a small bank building. Row 2 (left to right): 4) a small post office with a red mailbox; 5) a small police station; 6) a small fire station. Row 3 (left to right): 7) a small supermarket; 8) a small library; 9) a small park with trees and a bench. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_place2.png` — 장소 2
- 비율 1:1 · 
- 칸 순서: 1.약국 / 2.버스 정류장 / 3.기차역 / 4.화장실 / 5.급식실 / 6.주민센터 / 7.영화관 / 8.집 / 9.운동장

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a small pharmacy; 2) a bus stop shelter; 3) a small train station. Row 2 (left to right): 4) a clean restroom door with simple man and woman symbols; 5) a school cafeteria with tables; 6) a small community service center. Row 3 (left to right): 7) a small movie theater; 8) a cozy house; 9) a school playground with a soccer goal. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_music.png` — 악기 1
- 비율 1:1 · 
- 칸 순서: 1.북 / 2.실로폰 / 3.피아노 / 4.탬버린 / 5.트라이앵글 / 6.리코더 / 7.기타 / 8.마라카스 / 9.장구

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a drum with sticks; 2) a rainbow xylophone with mallets; 3) a small upright piano. Row 2 (left to right): 4) a tambourine; 5) a triangle with a beater; 6) a recorder. Row 3 (left to right): 7) an acoustic guitar; 8) a pair of maracas; 9) a Korean janggu drum. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_music2.png` — 악기 2
- 비율 1:1 · 
- 칸 순서: 1.소고 / 2.꽹과리 / 3.징 / 4.캐스터네츠 / 5.바이올린 / 6.트럼펫 / 7.종 / 8.단소 / 9.헤드폰

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a Korean sogo hand drum with a stick; 2) a Korean kkwaenggwari small gong; 3) a Korean jing large gong. Row 2 (left to right): 4) castanets; 5) a violin; 6) a trumpet. Row 3 (left to right): 7) a hand bell; 8) a Korean danso bamboo flute; 9) headphones. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_art.png` — 미술 도구
- 비율 1:1 · 
- 칸 순서: 1.붓 / 2.팔레트 / 3.물감 / 4.찰흙 / 5.이젤 / 6.스케치북 / 7.먹과 벼루 / 8.물통 / 9.색연필

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a paintbrush with paint on the tip; 2) a paint palette with colors; 3) a watercolor paint set. Row 2 (left to right): 4) colorful clay lumps; 5) an easel with a blank canvas; 6) an open sketchbook with a blank page. Row 3 (left to right): 7) a Korean ink stick and inkstone; 8) a painting water jar; 9) colored pencils. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_sci.png` — 과학 도구
- 비율 1:1 · 
- 칸 순서: 1.돋보기 / 2.온도계 / 3.저울 / 4.자석 / 5.비커 / 6.스포이트 / 7.현미경 / 8.나침반 / 9.전지와 전구

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a magnifying glass; 2) a thermometer with no numbers; 3) a balance scale. Row 2 (left to right): 4) a red and blue horseshoe magnet; 5) a beaker with blue liquid; 6) a dropper. Row 3 (left to right): 7) a microscope; 8) a compass with no letters; 9) a battery connected to a small bulb. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_measure.png` — 재는 도구
- 비율 1:1 · 
- 칸 순서: 1.줄자 / 2.각도기 / 3.모래시계 / 4.계량컵 / 5.계량스푼 / 6.스톱워치 / 7.프리즘 / 8.거울 / 9.체중계

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a tape measure; 2) a protractor with plain tick marks; 3) an hourglass. Row 2 (left to right): 4) a measuring cup; 5) measuring spoons; 6) a stopwatch with no numbers. Row 3 (left to right): 7) a glass prism with a rainbow; 8) a hand mirror; 9) a bathroom scale. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_weather.png` — 날씨·하늘
- 비율 1:1 · 
- 칸 순서: 1.해 / 2.구름 / 3.비 / 4.눈 / 5.무지개 / 6.바람 / 7.달 / 8.별 / 9.번개

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a smiling-free bright sun; 2) a fluffy cloud; 3) a rain cloud with drops. Row 2 (left to right): 4) a snow cloud with snowflakes; 5) a rainbow with small clouds; 6) swirling wind lines with a leaf. Row 3 (left to right): 7) a crescent moon; 8) a yellow star; 9) a thunder cloud with a lightning bolt. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_nature.png` — 자연
- 비율 1:1 · 
- 칸 순서: 1.나무 / 2.꽃 / 3.풀 / 4.돌 / 5.산 / 6.강 / 7.바다 / 8.불 / 9.낙엽

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a round green tree; 2) a pink flower; 3) a tuft of grass. Row 2 (left to right): 4) a grey rock; 5) a green mountain; 6) a small river flowing between grass. Row 3 (left to right): 7) a blue ocean wave; 8) a small campfire; 9) autumn leaves. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_animal.png` — 동물 1
- 비율 1:1 · 
- 칸 순서: 1.물고기 / 2.거북 / 3.새 / 4.독수리 / 5.나비 / 6.닭 / 7.소 / 8.돼지 / 9.오리

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a small fish; 2) a turtle; 3) a little bird. Row 2 (left to right): 4) an eagle; 5) a butterfly; 6) a chicken. Row 3 (left to right): 7) a cow; 8) a pig; 9) a duck. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

### `sheet_animal2.png` — 동물 2
- 비율 1:1 · 
- 칸 순서: 1.양 / 2.말 / 3.다람쥐 / 4.고래 / 5.돌고래 / 6.게 / 7.문어 / 8.개미 / 9.달팽이

```
Cute 3D cartoon illustration for a children's special-education learning app, soft rounded clay-like shapes, glossy Pixar-style rendering, soft studio lighting, bright pastel colors, friendly and calm, very clean and simple, no text, no letters, no numbers, no logos, no watermark. Nine different cute 3D icon objects: Row 1 (left to right): 1) a sheep; 2) a horse; 3) a squirrel. Row 2 (left to right): 4) a whale; 5) a dolphin; 6) a crab. Row 3 (left to right): 7) an octopus; 8) an ant; 9) a snail. A 3x3 grid sprite sheet: 9 separate items arranged in 3 rows and 3 columns, evenly spaced with wide empty white gaps between items, each item centered in its own equal cell and about the same size, same slightly-front 3/4 view for all, pure plain white background, items must not touch or overlap, no grid lines, no labels, square 1:1.
```

---

### 이전 문서의 차시 장면 15종

`docs/gemini-prompts-scenes.md`의 배경·조각 30장도 그대로 쓰여요(차시 게임 안 장면). 같은 방법으로 보내 주시면 함께 넣어요.
