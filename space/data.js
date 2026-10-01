/* 우주 지도 자료: 별·건물·차시 배정
   - 별마다 교과가 있고, 건물마다 그 교과의 차시(엑셀 '3D 게임 공간' 이름)를 나눠 담습니다.
   - 한 차시는 한 건물에만 들어갑니다. 규칙에 안 걸리면 그 교과의 첫 건물로 갑니다.
   - x·y는 별 위 화면(16:9)에서 건물 아래 가운데의 위치(%), s는 크기 배율. */
(function () {
  'use strict';
  var STARS = [
    { id: 'center', model: 'star_center', name: '학생회관 별', short: '학생회관', img: 'star_center', land: 'land_center', guide: 'ok_wave', guideName: '옥쌤',
      subjects: ['korean', 'english'], color: '#f3c24b', hello: '학생회관 별이에요! 국어와 영어를 배우고, 복습 모험도 할 수 있어요.',
      map: { x: 50, y: 56, w: 30 }, mapP: { x: 50, y: 36.0, w: 70 } },
    { id: 'sea', model: 'star_sea', name: '바다별', short: '바다별', img: 'star_sea', land: 'land_sea', guide: 'sea_wave', guideName: '물결이',
      subjects: ['music', 'art'], color: '#3fc1d0', hello: '바다별에 온 걸 환영해요! 음악과 미술을 배워요.',
      map: { x: 17, y: 28, w: 19 }, mapP: { x: 26, y: 19.2, w: 42 } },
    { id: 'love', model: 'star_love', name: '사랑별', short: '사랑별', img: 'star_love', land: 'land_love', guide: 'love_wave', guideName: '콩이',
      subjects: ['math', 'science'], color: '#f28bb0', hello: '사랑별이에요! 수학과 과학을 배워요.',
      map: { x: 83, y: 27, w: 19 }, mapP: { x: 75, y: 20.0, w: 42 } },
    { id: 'dream', model: 'star_dream', name: '꿈별', short: '꿈별', img: 'star_dream', land: 'land_dream', guide: 'dream_wave', guideName: '몽실이',
      subjects: ['social', 'career'], color: '#a98bf0', hello: '꿈별이에요! 사회와 진로를 배우고, 일터 거리에서 일해 봐요.',
      map: { x: 82, y: 76, w: 19 }, mapP: { x: 72, y: 65.6, w: 40 } },
    { id: 'farm', model: 'star_farm', name: '햇살 농장', short: '햇살 농장', img: 'star_farm', land: 'land_farm', guide: 'robot_wave', guideName: '별빛이',
      subjects: ['math', 'science'], color: '#e8a24a', hello: '햇살 농장이에요! 씨앗을 심고, 세고, 키워 봐요.',
      map: { x: 20, y: 78, w: 13 }, mapP: { x: 24, y: 64.8, w: 28 } }
  ];
  /* 아직 태어나지 않은 별 (업데이트되면 새 교과·심화 단원으로) */
  /* 다른 게임으로 가는 별 (우주선 타고 날아가서 그 게임으로) */
  var LINKS = [
    { id: 'jungle', name: '정글 점프 별', chip: '모험 게임', img: 'star_jungle', model: 'star_jungle', emo: '🌴', color: '#5fcf6a',
      url: 'https://fumon1218.github.io/jungle-jump/', say: '정글 점프 별로 날아가요! 나뭇가지를 뛰어넘으며 열매를 모아요.',
      map: { x: 37, y: 20, w: 12.5 }, mapP: { x: 28, y: 91, w: 36 } },
    { id: 'word', name: '한글별', chip: '워드 마스터', img: 'star_word', model: 'star_word', emo: '🔤', color: '#ffb74d',
      url: 'https://fumon1218.github.io/word-master/?from=oks', say: '한글별로 날아가요! 자음·모음부터 문장까지 한글을 익혀요.',
      map: { x: 62, y: 23, w: 11 }, mapP: { x: 73, y: 91, w: 34 } }
  ];
  var EGGS = [
    { img: 'egg_crack', x: 48, y: 9, w: 4.5, p: [50, 13, 10], say: '곧 태어날 별이에요! 새로운 공부가 준비되고 있어요.' },
    { img: 'egg_sleep', x: 56, y: 91, w: 4.5, p: [50, 79, 9], say: '아직 잠자는 별이에요. 새 공부가 생기면 깨어나요.' }
  ];
  var DECO = [
    { img: 'ring_planet', x: 6, y: 52, w: 6, p: [10, 50, 13] }, { img: 'comet', x: 72, y: 13, w: 6, drift: 1, p: [8, 76, 12] }, { img: 'satellite', x: 93, y: 52, w: 5.5, p: [90, 50, 13] },
    { img: 'galaxy', x: 70, y: 48, w: 5, dim: 1 }, { img: 'moon', x: 94, y: 8, w: 4.5 }, { img: 'asteroid', x: 30, y: 92, w: 3.5 }
  ];

  /* 건물. kind: lessons(차시) / hub / review / link / dock */
  var B = {
    center: [
      { id: 'b_hall', name: '학생회관', sub: '오늘의 미션 · 배움 지도', kind: 'hub', x: 50, y: 50, s: 1.3, emo: '🏫' },
      { id: 'b_library', name: '이야기 도서관', sub: '국어 · 읽기', kind: 'lessons', subject: 'korean', x: 20, y: 52, s: 1, emo: '📚',
        keys: ['소리 숲', '글자 정원', '동화', '이야기', '정보 탐정', '서류'] },
      { id: 'b_english', name: '영어 여행사', sub: '영어', kind: 'lessons', subject: 'english', x: 80, y: 52, s: 1, emo: '🌏' },
      { id: 'b_post', name: '동물 우체국', sub: '국어 · 쓰기', kind: 'lessons', subject: 'korean', x: 17, y: 90, s: .95, emo: '📮',
        keys: ['우체국', '메시지', '심부름', '행정'] },
      { id: 'b_broadcast', name: '방송국', sub: '국어 · 말하기·듣기', kind: 'lessons', subject: 'korean', x: 34, y: 90, s: .95, emo: '🎙️', rest: true },
      { id: 'b_adventure', name: '복습 모험장', sub: '배운 것 다시 하기 · 추천', kind: 'review', x: 66, y: 90, s: .95, emo: '🌿' },
      { id: 'b_arcade', name: '미니게임 놀이터', sub: '미니게임 · 예전 마을', kind: 'link', x: 83, y: 90, s: .9, emo: '🎪',
        links: [['🎮 미니게임 모음', 'minigames/index.html'], ['🏡 예전 학교 마을', 'classic.html'], ['🌸 마을 퀘스트', 'quests/index.html']] },
      { id: 'b_myroom', name: '내 방', sub: '내 기록 · 배지', kind: 'room', x: 50, y: 90, s: .8, emo: '🏠' },
      { id: 'b_dock', name: '우주 정거장', sub: '다른 별로 떠나요', kind: 'dock', x: 33, y: 31, s: .6, emo: '🚀', far: true }
    ],
    sea: [
      { id: 'b_music_hall', name: '숲속 음악당', sub: '음악 · 듣기·노래', kind: 'lessons', subject: 'music', x: 22, y: 52, s: 1.05, emo: '🎵',
        keys: ['소리 탐험', '음높이', '노래', '마음', '감정', '웰빙', '콘서트', '영화관', '멜로디'] },
      { id: 'b_rhythm_stage', name: '리듬 스테이지', sub: '음악 · 리듬·악기', kind: 'lessons', subject: 'music', x: 50, y: 52, s: 1.05, emo: '🥁', rest: true },
      { id: 'b_gugak', name: '국악 정자', sub: '음악 · 세계와 우리 음악', kind: 'lessons', subject: 'music', x: 78, y: 52, s: 1, emo: '🪘',
        keys: ['세계 음악', '음악 박물관'] },
      { id: 'b_color_studio', name: '색깔 공방', sub: '미술 · 색·그리기', kind: 'lessons', subject: 'art', x: 18, y: 90, s: 1, emo: '🎨', rest: true },
      { id: 'b_sculpt', name: '조형 스튜디오', sub: '미술 · 만들기', kind: 'lessons', subject: 'art', x: 50, y: 90, s: 1, emo: '🏺',
        keys: ['공방', '캐릭터 스튜디오', '디자인'] },
      { id: 'b_gallery', name: '바다 미술관', sub: '미술 · 감상', kind: 'lessons', subject: 'art', x: 82, y: 90, s: 1, emo: '🖼️',
        keys: ['미술관', '감상'] }
    ],
    love: [
      { id: 'b_bakery', name: '동물 베이커리', sub: '수학 · 수·나누기', kind: 'lessons', subject: 'math', x: 20, y: 52, s: 1, emo: '🎂', keys: ['베이커리'] },
      { id: 'b_block_factory', name: '숫자 블록 공장', sub: '수학 · 수·도형·규칙', kind: 'lessons', subject: 'math', x: 50, y: 52, s: 1.1, emo: '🧱', rest: true },
      { id: 'b_mart', name: '동물 마트', sub: '수학 · 돈·자료', kind: 'lessons', subject: 'math', x: 80, y: 52, s: 1, emo: '🛒',
        keys: ['마트', '확률', '통계', '분류'] },
      { id: 'b_lab', name: '실험실', sub: '과학 · 물질·에너지', kind: 'lessons', subject: 'science', x: 18, y: 90, s: 1, emo: '🧪', rest: true },
      { id: 'b_observatory', name: '하늘 관측소', sub: '과학 · 날씨·지구', kind: 'lessons', subject: 'science', x: 50, y: 90, s: 1, emo: '🔭',
        keys: ['하늘', '구름', '기후', '바닷가'] },
      { id: 'b_greenhouse', name: '생태 온실', sub: '과학 · 생명·환경', kind: 'lessons', subject: 'science', x: 82, y: 90, s: 1, emo: '🌱',
        keys: ['생태', '온실', '환경', '식품'] }
    ],
    dream: [
      { id: 'b_explorer', name: '우리 동네 탐험대', sub: '사회 · 마을·지도', kind: 'lessons', subject: 'social', x: 18, y: 52, s: 1, emo: '🗺️', rest: true },
      { id: 'b_transit', name: '교통센터', sub: '사회 · 교통', kind: 'lessons', subject: 'social', x: 42, y: 52, s: 1, emo: '🚌', keys: ['버스', '환승', '교통'] },
      { id: 'b_museum', name: '시간 여행 박물관', sub: '사회 · 역사·문화', kind: 'lessons', subject: 'social', x: 66, y: 52, s: 1, emo: '🏛️', keys: ['박물관', '시간', '축제'] },
      { id: 'b_safety', name: '안전 도움 센터', sub: '사회 · 공공 서비스', kind: 'lessons', subject: 'social', x: 88, y: 52, s: .95, emo: '🚨', keys: ['공공 서비스', '생활 정보'] },
      { id: 'b_meeting', name: '마을 회의장', sub: '사회 · 함께 사는 삶', kind: 'lessons', subject: 'social', x: 18, y: 90, s: 1, emo: '🤝',
        keys: ['회의', '함께', '갈등', '봉사', '보호'] },
      { id: 'b_job_center', name: '직업 체험관', sub: '진로직업', kind: 'lessons', subject: 'social', x: 50, y: 90, s: 1.05, emo: '🧑‍🔧',
        keys: ['직업'], links: [['☕ 바리스타 체험', 'career/barista.html'], ['🧃 쉬운 카페 체험', 'career/cafe.html']] },
      { id: 'b_shop_street', name: '일터 거리', sub: '가게 운영 (타이쿤)', kind: 'link', x: 82, y: 90, s: 1.05, emo: '🏪',
        links: [['🏪 가게 골라 일하기', 'shop/']] }
    ],
    farm: [
      { id: 'b_farm', name: '햇살 농장', sub: '수학·과학 함께', kind: 'lessons', subject: '*', x: 50, y: 70, s: 1.5, emo: '🌻', keys: ['농장'],
        links: [['🚜 농장 키우기 게임', 'games/farm/index.html']] }
    ]
  };

  /* 차시 → 건물 배정 */
  function assign(lessons) {
    var out = {};   // 건물 id → [lesson]
    lessons.forEach(function (l) {
      var hit = null, all = [];
      Object.keys(B).forEach(function (s) { B[s].forEach(function (b) { if (b.kind === 'lessons') all.push(b); }); });
      /* 1) 농장(여러 교과)  2) 같은 교과의 규칙  3) 같은 교과의 기본 건물 */
      all.forEach(function (b) { if (!hit && b.subject === '*' && b.keys.some(function (k) { return l.space.indexOf(k) >= 0; })) hit = b; });
      all.forEach(function (b) { if (!hit && b.subject === l.subject && b.keys && b.keys.some(function (k) { return l.space.indexOf(k) >= 0; })) hit = b; });
      all.forEach(function (b) { if (!hit && b.subject === l.subject && b.rest) hit = b; });
      all.forEach(function (b) { if (!hit && b.subject === l.subject) hit = b; });
      if (hit) (out[hit.id] = out[hit.id] || []).push(l);
    });
    return out;
  }
  window.OKS_SPACE = { STARS: STARS, LINKS: LINKS, EGGS: EGGS, DECO: DECO, B: B, assign: assign };
})();
