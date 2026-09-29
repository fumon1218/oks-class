/* 초등 42차시 게임 내용표
   각 차시의 활동ID(curriculum/lessons.js)에 게임 엔진과 소재를 짝지어 둡니다.
   중등·고등 차시는 여기에 적어 넣으면 바로 열립니다. 적혀 있지 않은 차시는 '준비 중(수준별 계획 보기)'으로 보입니다. */
(function () {
  'use strict';
  var J = 'art/jj/', F = 'games/farm/assets/';
  function set(q, ok, wrongs, extra) { /* 상황 고르기 한 문제: 맞는 것 1개 + 틀린 것들 */
    return Object.assign({ q: q, opts: [ok].concat(wrongs), ok: 0 }, extra || {});
  }
  function multi(q, oks, wrongs, extra) { return Object.assign({ q: q, opts: oks.concat(wrongs), ok: oks.map(function (x, i) { return i; }) }, extra || {}); }
  function shape(kind, color) {
    var sh = { circle: '<circle cx="50" cy="50" r="40"/>', square: '<rect x="12" y="12" width="76" height="76" rx="6"/>', triangle: '<polygon points="50,8 94,90 6,90"/>', rect: '<rect x="6" y="26" width="88" height="48" rx="6"/>', star: '<polygon points="50,6 62,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 38,38"/>' }[kind];
    return '<svg viewBox="0 0 100 100" class="sym"><g fill="' + color + '" stroke="rgba(0,0,0,.25)" stroke-width="4">' + sh + '</g></svg>';
  }
  /* 자주 쓰는 소재 */
  var AN = {
    dog: { label: '강아지', img: J + 'animals/dog.webp', snd: '멍멍', en: 'dog' },
    cat: { label: '고양이', img: J + 'animals/cat.webp', snd: '야옹', en: 'cat' },
    frog: { label: '개구리', img: J + 'animals/frog.webp', snd: '개굴개굴', en: 'frog' },
    tiger: { label: '호랑이', img: J + 'animals/tiger.webp', snd: '어흥', en: 'tiger' },
    elephant: { label: '코끼리', img: J + 'animals/elephant.webp', snd: '뿌우', en: 'elephant' },
    owl: { label: '부엉이', img: J + 'animals/owl.webp', snd: '부엉부엉', en: 'owl' },
    bee: { label: '벌', img: J + 'foes/bee.webp', snd: '윙윙', en: 'bee' },
    rabbit: { label: '토끼', img: J + 'animals/rabbit.webp', en: 'rabbit' },
    bear: { label: '곰', img: J + 'animals/bear.webp', en: 'bear' },
    panda: { label: '판다', img: J + 'animals/panda.webp', en: 'panda' },
    penguin: { label: '펭귄', img: J + 'animals/penguin.webp', en: 'penguin' },
    monkey: { label: '원숭이', img: J + 'animals/monkey.webp', en: 'monkey' },
    parrot: { label: '앵무새', img: J + 'animals/parrot.webp', en: 'bird' },
    fox: { label: '여우', img: J + 'animals/fox.webp', en: 'fox' },
    koala: { label: '코알라', img: J + 'animals/koala.webp', en: 'koala' },
    sloth: { label: '나무늘보', img: J + 'animals/sloth.webp' },
    chameleon: { label: '카멜레온', img: J + 'animals/chameleon.webp' },
    snake: { label: '뱀', img: J + 'foes/snake.webp' },
    bat: { label: '박쥐', img: J + 'foes/bat.webp' }
  };
  var FOOD = {
    milk: { label: '우유', img: J + 'kitchen/ing_milk.webp', en: 'milk' },
    egg: { label: '달걀', img: J + 'kitchen/ing_egg.webp', en: 'egg' },
    honey: { label: '꿀', img: J + 'kitchen/ing_honey.webp', en: 'honey' },
    flour: { label: '밀가루', img: J + 'kitchen/ing_flour.webp' },
    pancake: { label: '팬케이크', img: J + 'kitchen/dish_pancake.webp', en: 'pancake' },
    pudding: { label: '푸딩', img: J + 'kitchen/dish_pudding.webp', en: 'pudding' },
    watermelon: { label: '수박', img: J + 'kitchen/dish_watermelon.webp', en: 'watermelon' },
    choco: { label: '초콜릿', img: J + 'kitchen/ing_choco.webp', en: 'chocolate' },
    kimbap: { label: '김밥', img: J + 'snack/kimbap_plate.webp', en: 'gimbap' },
    ramen: { label: '라면', img: J + 'snack/ramen_bowl.webp', en: 'noodles' },
    ricecake: { label: '떡', img: J + 'snack/ricecake.webp', en: 'rice cake' },
    tomato: { label: '토마토', img: F + 'harvest_tomato.webp', en: 'tomato' },
    strawberry: { label: '딸기', img: F + 'strawberry_single.webp', en: 'strawberry' },
    carrot: { label: '당근', img: F + 'harvest_carrot.webp', en: 'carrot' },
    lettuce: { label: '상추', img: F + 'harvest_lettuce.webp', en: 'lettuce' },
    yogurt: { label: '요구르트', img: J + 'kitchen/ing_yogurt.webp', en: 'yogurt' }
  };
  var COLORS = [
    { label: '빨강', color: '#e53935', en: 'red' }, { label: '노랑', color: '#fbc02d', en: 'yellow' }, { label: '파랑', color: '#1e88e5', en: 'blue' },
    { label: '초록', color: '#43a047', en: 'green' }, { label: '주황', color: '#fb8c00', en: 'orange' }, { label: '보라', color: '#8e24aa', en: 'purple' }
  ];
  var C = {}; COLORS.forEach(function (c) { C[c.label] = c; });
  var SHAPES = {
    circle: { label: '동그라미', svg: shape('circle', '#ef6c00') }, triangle: { label: '세모', svg: shape('triangle', '#43a047') },
    square: { label: '네모', svg: shape('square', '#1e88e5') }, rect: { label: '긴 네모', svg: shape('rect', '#8e24aa') }
  };
  var GROW = [
    { label: '씨앗을 심어요', img: F + 'soil_pot.webp', story: '씨앗을 심어요' },
    { label: '새싹이 나요', img: F + 'sprout_pot.webp', story: '새싹이 나요' },
    { label: '잎이 자라요', img: F + 'young_plant.webp', story: '잎이 자라요' },
    { label: '열매가 열려요', img: F + 'tomato_plant.webp', story: '토마토가 열려요' }
  ];
  function big(it, s, lab) { return Object.assign({}, it, { scale: s, label: lab }); }

  var CONTENT = {
    /* ===================== 국어 ===================== */
    '01-01-01-01': { engine: 'pick', voice: 'sound', q: '“{snd}” 소리를 내는 친구는 누구일까요?', l1: '친구를 눌러서 소리를 들어 봐요',
      items: [AN.dog, AN.cat, AN.frog, AN.tiger, AN.elephant, AN.owl, AN.bee,
        { label: '자동차', emo: '🚗', snd: '빵빵' }, { label: '전화기', emo: '☎️', snd: '따르릉' }, { label: '초인종', emo: '🔔', snd: '딩동' }],
      l5: { sets: [
        set('아침에 “따르르릉” 울려요. 무엇일까요?', { label: '알람 시계', emo: '⏰' }, [{ label: '냉장고', emo: '🧊' }, { label: '책', emo: '📕' }, { label: '베개', emo: '🛏️' }]),
        set('“딩동!” 누가 왔나 봐요. 무슨 소리일까요?', { label: '초인종', emo: '🔔' }, [{ label: '물컵', emo: '🥛' }, { label: '연필', emo: '✏️' }, { label: '시계', emo: '🕐' }]),
        set('길에서 “빵빵!” 소리가 나요. 무엇일까요?', { label: '자동차', emo: '🚗' }, [{ label: '나비', emo: '🦋' }, { label: '꽃', emo: '🌷' }, { label: '구름', emo: '☁️' }]),
        set('“삐뽀삐뽀” 소리가 나요. 무엇일까요?', { label: '구급차', emo: '🚑' }, [{ label: '자전거', emo: '🚲' }, { label: '버스', emo: '🚌' }, { label: '배', emo: '⛵' }]),
        set('숲에서 “부엉부엉” 소리가 나요', AN.owl, [AN.dog, AN.frog, AN.cat])
      ] } },
    '01-01-01-02': { engine: 'pairs', items: [AN.dog, AN.cat, AN.frog, AN.tiger, AN.elephant, AN.rabbit, AN.bear, AN.penguin, FOOD.milk, FOOD.egg, FOOD.tomato, FOOD.carrot], q: '그림과 같은 낱말 봉투에 옮겨요' },
    '01-01-02-01': { engine: 'pick', q: '“{x} 주세요!” {x}를 찾아요', zoneLabel: '장바구니에 담아요', zoneIcon: '🛒', l1: '가게 물건을 눌러서 이름을 들어 봐요',
      items: [FOOD.milk, FOOD.egg, FOOD.honey, FOOD.flour, FOOD.kimbap, FOOD.ramen, FOOD.ricecake, FOOD.carrot, FOOD.strawberry, FOOD.yogurt],
      l5: { sets: [
        multi('엄마 심부름: “우유와 달걀을 사 오렴.” 두 개를 골라요', [FOOD.milk, FOOD.egg], [FOOD.ramen, FOOD.choco]),
        multi('“김밥이랑 떡을 사 올래?” 두 개를 골라요', [FOOD.kimbap, FOOD.ricecake], [FOOD.honey, FOOD.flour]),
        multi('“팬케이크 만들 밀가루와 꿀이 필요해.”', [FOOD.flour, FOOD.honey], [FOOD.carrot, FOOD.ramen]),
        multi('“딸기랑 요구르트 주세요.”', [FOOD.strawberry, FOOD.yogurt], [FOOD.egg, FOOD.kimbap])
      ] } },
    '01-01-02-02': { engine: 'pick', sets: [
        set('아침에 선생님을 만났어요. 뭐라고 인사할까요?', { label: '안녕하세요', emo: '🙇' }, [{ label: '잘 자', emo: '😴' }, { label: '잘 먹겠습니다', emo: '🍚' }, { label: '미안해', emo: '🙏' }]),
        set('친구가 선물을 주었어요. 뭐라고 말할까요?', { label: '고마워', emo: '🎁' }, [{ label: '안녕히 계세요', emo: '👋' }, { label: '잘 먹겠습니다', emo: '🍚' }, { label: '싫어', emo: '🙅' }]),
        set('밥을 먹기 전에 뭐라고 말할까요?', { label: '잘 먹겠습니다', emo: '🍚' }, [{ label: '고마워', emo: '🎁' }, { label: '잘 자', emo: '😴' }, { label: '안녕', emo: '👋' }]),
        set('친구 발을 밟았어요. 뭐라고 말할까요?', { label: '미안해', emo: '🙏' }, [{ label: '고마워', emo: '🎁' }, { label: '잘 먹겠습니다', emo: '🍚' }, { label: '안녕하세요', emo: '🙇' }]),
        set('연필을 빌리고 싶어요. 어떻게 부탁할까요?', { label: '연필 빌려 줄래?', emo: '✏️' }, [{ label: '연필 내놔', emo: '😠' }, { label: '잘 자', emo: '😴' }, { label: '미안해', emo: '🙏' }]),
        set('집에 갈 때 선생님께 뭐라고 인사할까요?', { label: '안녕히 계세요', emo: '👋' }, [{ label: '잘 먹겠습니다', emo: '🍚' }, { label: '미안해', emo: '🙏' }, { label: '고마워', emo: '🎁' }])
      ],
      l5: { sets: [
        set('마트에서 우유를 못 찾겠어요. 직원에게 어떻게 말할까요?', { label: '우유는 어디 있어요?', emo: '🥛' }, [{ label: '우유!', emo: '😠' }, { label: '잘 자요', emo: '😴' }, { label: '안녕히 계세요', emo: '👋' }]),
        set('도움이 필요해요. 어떻게 말할까요?', { label: '도와주세요', emo: '🙋' }, [{ label: '잘 먹겠습니다', emo: '🍚' }, { label: '저리 가', emo: '🙅' }, { label: '안녕', emo: '👋' }]),
        set('화장실에 가고 싶어요. 선생님께 어떻게 말할까요?', { label: '화장실 다녀와도 돼요?', emo: '🚻' }, [{ label: '배고파요', emo: '🍚' }, { label: '고마워요', emo: '🎁' }, { label: '안녕히 계세요', emo: '👋' }]),
        set('버스에서 내릴 때 기사님께', { label: '감사합니다', emo: '🚌' }, [{ label: '미안해', emo: '🙏' }, { label: '잘 자', emo: '😴' }, { label: '내놔', emo: '😠' }])
      ] } },
    '01-01-03-01': { engine: 'pick', q: '“{x}” 표지를 찾아요', l1: '생활 표지를 눌러서 이름을 들어 봐요',
      items: [{ label: '화장실', emo: '🚻' }, { label: '멈춤', emo: '🛑' }, { label: '병원', emo: '🏥' }, { label: '엘리베이터', emo: '🛗' }, { label: '비상구', emo: '🏃' }, { label: '어린이 보호', emo: '🚸' }, { label: '금연', emo: '🚭' }, { label: '출입 금지', emo: '⛔' }],
      l5: { sets: [
        set('화장실에 가고 싶어요. 어떤 표지를 찾을까요?', { label: '화장실', emo: '🚻' }, [{ label: '엘리베이터', emo: '🛗' }, { label: '병원', emo: '🏥' }, { label: '금연', emo: '🚭' }]),
        set('불이 났어요! 어디로 나가야 할까요?', { label: '비상구', emo: '🏃' }, [{ label: '화장실', emo: '🚻' }, { label: '엘리베이터', emo: '🛗' }, { label: '출입 금지', emo: '⛔' }]),
        set('들어가면 안 되는 곳 표지는?', { label: '출입 금지', emo: '⛔' }, [{ label: '화장실', emo: '🚻' }, { label: '병원', emo: '🏥' }, { label: '어린이 보호', emo: '🚸' }]),
        set('다리가 아파서 계단 대신 탈 것은?', { label: '엘리베이터', emo: '🛗' }, [{ label: '비상구', emo: '🏃' }, { label: '멈춤', emo: '🛑' }, { label: '금연', emo: '🚭' }])
      ] } },
    '01-01-03-02': { engine: 'order', seqs: [
        { title: '토마토가 자라요', steps: GROW },
        { title: '달걀 요리', steps: [{ label: '달걀을 꺼내요', img: J + 'kitchen/ing_egg.webp' }, { label: '프라이팬에 구워요', img: J + 'kitchen/tool_pan.webp' }, { label: '접시에 담아요', img: J + 'kitchen/dish_egg.webp' }, { label: '맛있게 먹어요', emo: '😋' }] },
        { title: '김밥 만들기', steps: [{ label: '김을 깔아요', img: J + 'snack/gim.webp' }, { label: '재료를 올려요', img: J + 'snack/ham.webp' }, { label: '돌돌 말아요', img: J + 'snack/kimbap_roll.webp' }, { label: '썰어서 담아요', img: J + 'snack/kimbap_plate.webp' }] }
      ],
      l5: { seqs: [
        { title: '학교 가는 아침', steps: [{ label: '일어나요', emo: '🥱' }, { label: '이를 닦아요', emo: '🪥' }, { label: '옷을 입어요', emo: '👕' }, { label: '학교에 가요', emo: '🎒' }] },
        { title: '손 씻기', steps: [{ label: '물을 틀어요', emo: '🚰' }, { label: '비누칠해요', emo: '🧼' }, { label: '물로 헹궈요', emo: '💦' }, { label: '수건으로 닦아요', emo: '🧻' }] }
      ] } },

    /* ===================== 수학 ===================== */
    '02-01-01-01': { engine: 'farm', mode: 'math' },
    '02-01-01-02': { engine: 'count', things: [{ label: '블록', svg: shape('square', '#1e88e5') }, { label: '사과', emo: '🍎' }, { label: '별', img: 'core/ui/star_gold.webp' }, { label: '딸기', img: F + 'strawberry_single.webp' }] },
    '02-01-02-01': { engine: 'pick', q: '{x} 모양을 찾아요', zoneLabel: '집 짓는 자리에 옮겨요', zoneIcon: '🏠', l1: '모양을 눌러서 이름을 들어 봐요',
      items: [SHAPES.circle, SHAPES.triangle, SHAPES.square, SHAPES.rect],
      l5: { sets: [
        set('공은 어떤 모양일까요?', SHAPES.circle, [SHAPES.triangle, SHAPES.square, SHAPES.rect], { say: '공은 어떤 모양일까요? ⚽' }),
        set('🍕 피자 한 조각은 어떤 모양일까요?', SHAPES.triangle, [SHAPES.circle, SHAPES.square, SHAPES.rect]),
        set('🎁 선물 상자는 어떤 모양일까요?', SHAPES.square, [SHAPES.circle, SHAPES.triangle, SHAPES.rect]),
        set('🕐 시계는 어떤 모양일까요?', SHAPES.circle, [SHAPES.triangle, SHAPES.square, SHAPES.rect]),
        set('🚪 문은 어떤 모양일까요?', SHAPES.rect, [SHAPES.circle, SHAPES.triangle, SHAPES.square])
      ] } },
    '02-01-02-02': { engine: 'pick', sets: [
        set('가장 큰 토마토를 골라요', big(FOOD.tomato, 1, '큰 토마토'), [big(FOOD.tomato, .72, '중간 토마토'), big(FOOD.tomato, .5, '작은 토마토'), big(FOOD.tomato, .35, '아주 작은 토마토')]),
        set('가장 작은 딸기를 골라요', big(FOOD.strawberry, .35, '아주 작은 딸기'), [big(FOOD.strawberry, 1, '큰 딸기'), big(FOOD.strawberry, .72, '중간 딸기'), big(FOOD.strawberry, .52, '작은 딸기')]),
        set('가장 무거운 동물은 누구일까요?', AN.elephant, [AN.tiger, AN.rabbit, AN.frog]),
        set('가장 가벼운 동물은 누구일까요?', AN.bee, [AN.elephant, AN.bear, AN.tiger]),
        set('가장 큰 바구니를 골라요', { label: '큰 바구니', img: F + 'basket.webp', scale: 1 }, [{ label: '작은 바구니', img: F + 'basket.webp', scale: .55 }, { label: '더 작은 바구니', img: F + 'basket.webp', scale: .4 }, { label: '중간 바구니', img: F + 'basket.webp', scale: .75 }]),
        set('더 무거운 것은 어느 것일까요?', FOOD.watermelon, [FOOD.strawberry, { label: '깃털', emo: '🪶' }, { label: '종이', emo: '📄' }])
      ],
      l5: { sets: [
        set('장바구니가 무거워요. 가장 무거운 물건은?', FOOD.watermelon, [FOOD.egg, FOOD.strawberry, { label: '과자', emo: '🍪' }]),
        set('동생에게 줄 가장 작은 옷을 골라요', { label: '작은 옷', emo: '👕', scale: .45 }, [{ label: '큰 옷', emo: '👕', scale: 1 }, { label: '중간 옷', emo: '👕', scale: .72 }, { label: '조금 큰 옷', emo: '👕', scale: .85 }]),
        set('가장 긴 연필을 골라요', { label: '긴 연필', emo: '✏️', scale: 1 }, [{ label: '짧은 연필', emo: '✏️', scale: .45 }, { label: '중간 연필', emo: '✏️', scale: .7 }, { label: '조금 짧은 연필', emo: '✏️', scale: .58 }])
      ] } },
    '02-01-03-01': { engine: 'pattern' },
    '02-01-03-02': { engine: 'sort', countAfter: true, q: '같은 무리끼리 나누어 담아요', l1: '모두 이 상자에 넣어요',
      bins: [{ key: 'animal', label: '동물', emo: '🐾' }, { key: 'fruit', label: '과일', emo: '🧺' }, { key: 'car', label: '탈것', emo: '🚦' }, { key: 'cloth', label: '옷', emo: '🧺' }],
      items: [Object.assign({ bin: 'animal' }, AN.dog), Object.assign({ bin: 'animal' }, AN.cat), Object.assign({ bin: 'animal' }, AN.rabbit), Object.assign({ bin: 'animal' }, AN.panda), Object.assign({ bin: 'animal' }, AN.penguin),
        Object.assign({ bin: 'fruit' }, FOOD.strawberry), { label: '사과', emo: '🍎', bin: 'fruit' }, { label: '바나나', emo: '🍌', bin: 'fruit' }, { label: '포도', emo: '🍇', bin: 'fruit' }, Object.assign({ bin: 'fruit' }, FOOD.watermelon),
        { label: '자동차', emo: '🚗', bin: 'car' }, { label: '버스', emo: '🚌', bin: 'car' }, { label: '자전거', emo: '🚲', bin: 'car' }, { label: '기차', emo: '🚆', bin: 'car' },
        { label: '티셔츠', emo: '👕', bin: 'cloth' }, { label: '바지', emo: '👖', bin: 'cloth' }, { label: '양말', emo: '🧦', bin: 'cloth' }, { label: '모자', emo: '🧢', bin: 'cloth' }] },

    /* ===================== 사회 ===================== */
    '03-01-01-01': { engine: 'pick', q: '{x}은(는) 어디일까요?', l1: '학교 곳곳을 눌러서 이름을 들어 봐요',
      items: [{ label: '교실', emo: '🧑‍🏫' }, { label: '보건실', emo: '🩹' }, { label: '도서관', emo: '📚' }, { label: '급식실', emo: '🍱' }, { label: '화장실', emo: '🚻' }, { label: '운동장', emo: '⚽' }, { label: '음악실', emo: '🎵' }],
      l5: { sets: [
        set('넘어져서 무릎이 아파요. 어디로 갈까요?', { label: '보건실', emo: '🩹' }, [{ label: '음악실', emo: '🎵' }, { label: '운동장', emo: '⚽' }, { label: '도서관', emo: '📚' }]),
        set('점심시간이에요. 어디로 갈까요?', { label: '급식실', emo: '🍱' }, [{ label: '보건실', emo: '🩹' }, { label: '화장실', emo: '🚻' }, { label: '음악실', emo: '🎵' }]),
        set('동화책을 빌리고 싶어요.', { label: '도서관', emo: '📚' }, [{ label: '급식실', emo: '🍱' }, { label: '운동장', emo: '⚽' }, { label: '보건실', emo: '🩹' }]),
        set('공놀이를 하고 싶어요.', { label: '운동장', emo: '⚽' }, [{ label: '도서관', emo: '📚' }, { label: '보건실', emo: '🩹' }, { label: '급식실', emo: '🍱' }])
      ] } },
    '03-01-01-02': { engine: 'pick', q: '{x}을(를) 찾아요', l1: '마을 곳곳을 눌러서 이름을 들어 봐요',
      items: [{ label: '우체국', emo: '📮' }, { label: '마트', emo: '🛒' }, { label: '공원', emo: '🌳' }, { label: '병원', emo: '🏥' }, { label: '소방서', emo: '🚒' }, { label: '경찰서', emo: '🚓' }, { label: '은행', emo: '🏦' }, { label: '버스 정류장', emo: '🚏' }],
      l5: { sets: [
        set('할머니께 편지를 보내요. 어디로 갈까요?', { label: '우체국', emo: '📮' }, [{ label: '공원', emo: '🌳' }, { label: '은행', emo: '🏦' }, { label: '소방서', emo: '🚒' }]),
        set('감기에 걸렸어요. 어디로 갈까요?', { label: '병원', emo: '🏥' }, [{ label: '마트', emo: '🛒' }, { label: '우체국', emo: '📮' }, { label: '버스 정류장', emo: '🚏' }]),
        set('저녁 반찬을 사요.', { label: '마트', emo: '🛒' }, [{ label: '경찰서', emo: '🚓' }, { label: '병원', emo: '🏥' }, { label: '공원', emo: '🌳' }]),
        set('버스를 타고 학교에 가요.', { label: '버스 정류장', emo: '🚏' }, [{ label: '은행', emo: '🏦' }, { label: '우체국', emo: '📮' }, { label: '병원', emo: '🏥' }]),
        set('길을 잃었어요. 누구에게 도움을 청할까요?', { label: '경찰서', emo: '🚓' }, [{ label: '공원', emo: '🌳' }, { label: '마트', emo: '🛒' }, { label: '은행', emo: '🏦' }])
      ] } },
    '03-01-02-01': { engine: 'pick', sets: [
        set('미끄럼틀 앞에 친구들이 줄을 서 있어요.', { label: '줄 서서 기다려요', emo: '🧍' }, [{ label: '새치기해요', emo: '🏃' }, { label: '밀어요', emo: '👐' }, { label: '울어요', emo: '😭' }]),
        set('도서관에서는 어떻게 할까요?', { label: '조용히 해요', emo: '🤫' }, [{ label: '크게 떠들어요', emo: '📢' }, { label: '뛰어다녀요', emo: '🏃' }, { label: '책을 던져요', emo: '📕' }]),
        set('횡단보도를 건너요.', { label: '초록불에 건너요', emo: '🟢' }, [{ label: '빨간불에 뛰어요', emo: '🔴' }, { label: '휴대폰을 봐요', emo: '📱' }, { label: '공을 차요', emo: '⚽' }]),
        set('친구가 넘어졌어요.', { label: '괜찮아? 도와줘요', emo: '🤝' }, [{ label: '웃어요', emo: '😆' }, { label: '모른 척해요', emo: '🙈' }, { label: '화내요', emo: '😠' }]),
        set('친구 장난감으로 놀고 싶어요.', { label: '같이 놀자고 말해요', emo: '🙋' }, [{ label: '빼앗아요', emo: '😠' }, { label: '숨겨요', emo: '🙈' }, { label: '던져요', emo: '🤾' }]),
        set('밥 먹기 전에 할 일은?', { label: '손을 씻어요', emo: '🧼' }, [{ label: '그냥 먹어요', emo: '🍚' }, { label: '누워요', emo: '🛌' }, { label: '뛰어요', emo: '🏃' }])
      ],
      l5: { sets: [
        set('버스에 사람이 많아요. 어떻게 탈까요?', { label: '차례대로 타요', emo: '🚌' }, [{ label: '밀고 먼저 타요', emo: '👐' }, { label: '소리 질러요', emo: '📢' }, { label: '뛰어 들어가요', emo: '🏃' }]),
        set('게임에서 졌어요. 어떻게 할까요?', { label: '축하해 줘요', emo: '👏' }, [{ label: '화내요', emo: '😠' }, { label: '울면서 가요', emo: '😭' }, { label: '판을 엎어요', emo: '💥' }]),
        set('급식실에서 차례를 기다려요.', { label: '식판 들고 줄 서요', emo: '🍱' }, [{ label: '친구 밥을 먹어요', emo: '😋' }, { label: '새치기해요', emo: '🏃' }, { label: '누워요', emo: '🛌' }])
      ] } },
    '03-01-02-02': { engine: 'pairs', q: '하는 일과 쓰는 물건을 짝지어요',
      items: [{ label: '소방관', emo: '🧑‍🚒', word: '🧯 소화기' }, { label: '요리사', emo: '🧑‍🍳', word: '🍳 프라이팬' }, { label: '의사', emo: '🧑‍⚕️', word: '🩺 청진기' }, { label: '경찰관', emo: '👮', word: '🚓 경찰차' },
        { label: '농부', emo: '🧑‍🌾', word: '🥕 채소 밭' }, { label: '선생님', emo: '🧑‍🏫', word: '📚 교과서' }, { label: '바리스타', img: J + 'coffee/cup_latte.webp', word: '☕ 커피 머신' }, { label: '조종사', emo: '🧑‍✈️', word: '✈️ 비행기' }] },
    '03-01-03-01': { engine: 'route' },
    '03-01-03-02': { engine: 'pick', q: '{x}을(를) 찾아요', l1: '축제 마당을 눌러서 이름을 들어 봐요',
      items: [{ label: '태극기', emo: '🇰🇷' }, { label: '연날리기', emo: '🪁' }, { label: '탈춤', emo: '🎭' }, { label: '북 치기', emo: '🥁' }, { label: '부채', emo: '🪭' }, { label: '떡', img: J + 'snack/ricecake.webp' }, { label: '보름달', emo: '🌕' }],
      l5: { sets: [
        set('추석 밤하늘에서 소원을 비는 것은?', { label: '보름달', emo: '🌕' }, [{ label: '무지개', emo: '🌈' }, { label: '눈사람', emo: '⛄' }, { label: '해바라기', emo: '🌻' }]),
        set('바람 부는 날 하늘 높이 날리는 놀이는?', { label: '연날리기', emo: '🪁' }, [{ label: '수영', emo: '🏊' }, { label: '탈춤', emo: '🎭' }, { label: '줄넘기', emo: '🪢' }]),
        set('설날에 떡국을 만드는 재료는?', { label: '떡', img: J + 'snack/ricecake.webp' }, [{ label: '초콜릿', img: J + 'kitchen/ing_choco.webp' }, { label: '얼음', img: J + 'kitchen/ing_ice.webp' }, { label: '꿀', img: J + 'kitchen/ing_honey.webp' }]),
        set('우리나라를 나타내는 깃발은?', { label: '태극기', emo: '🇰🇷' }, [{ label: '체크 깃발', emo: '🏁' }, { label: '무지개 깃발', emo: '🏳️‍🌈' }, { label: '하얀 깃발', emo: '🏳️' }])
      ] } },

    /* ===================== 과학 ===================== */
    '04-01-01-01': { engine: 'farm', mode: 'science', byLevel: {
      3: { engine: 'order', q: '식물이 자라는 차례대로 옮겨요', q3: '식물이 자라는 차례대로 번호 칸에 옮겨요', seqs: [{ title: '토마토가 자라요', steps: GROW }, { title: '딸기가 자라요', steps: GROW.slice(0, 3).concat([{ label: '딸기가 열려요', img: F + 'strawberry_plant.webp' }]) }, { title: '상추가 자라요', steps: GROW.slice(0, 3).concat([{ label: '상추가 커져요', img: F + 'lettuce_plant.webp' }]) }] },
      4: { engine: 'pick', sets: [
        multi('식물이 자라려면 무엇이 필요할까요? 두 개를 골라요', [{ label: '물', emo: '💧' }, { label: '햇빛', emo: '☀️' }], [{ label: '사탕', emo: '🍭' }, { label: '휴대폰', emo: '📱' }]),
        set('새싹 다음에는 어떻게 될까요?', { label: '잎이 자라요', img: F + 'young_plant.webp' }, [{ label: '씨앗', img: F + 'soil_pot.webp' }, { label: '빈 화분', img: F + 'empty_planter.webp' }, { label: '씨앗 봉투', img: F + 'parcel_seed.webp' }]),
        set('씨앗은 어디에 심을까요?', { label: '흙', img: F + 'empty_planter.webp' }, [{ label: '물컵', emo: '🥛' }, { label: '책상', emo: '🪑' }, { label: '가방', emo: '🎒' }]),
        set('열매가 열리기 전에는 무엇이 필까요?', { label: '꽃', emo: '🌼' }, [{ label: '눈', emo: '❄️' }, { label: '구름', emo: '☁️' }, { label: '돌', emo: '🪨' }])
      ] } } },
    '04-01-01-02': { engine: 'pick', sets: [
        set('날개가 있어서 날 수 있는 동물은?', AN.owl, [AN.dog, AN.tiger, AN.frog]),
        set('코가 아주 긴 동물은?', AN.elephant, [AN.cat, AN.rabbit, AN.penguin]),
        set('귀가 길고 깡충깡충 뛰는 동물은?', AN.rabbit, [AN.bear, AN.elephant, AN.owl]),
        set('줄무늬가 있는 동물은?', AN.tiger, [AN.panda, AN.frog, AN.penguin]),
        set('차가운 물에서 헤엄치는 새는?', AN.penguin, [AN.monkey, AN.tiger, AN.dog]),
        set('나무에 매달려 천천히 움직이는 동물은?', AN.sloth, [AN.frog, AN.penguin, AN.elephant]),
        set('몸 색깔을 바꿀 수 있는 동물은?', AN.chameleon, [AN.bear, AN.dog, AN.owl])
      ],
      l5: { sets: [
        multi('물속과 땅에서 모두 사는 동물은? (두 개)', [AN.frog, { label: '거북', emo: '🐢' }], [AN.owl, AN.monkey]),
        multi('날개가 있는 동물을 모두 골라요', [AN.owl, AN.parrot], [AN.tiger, AN.panda]),
        multi('털이 복슬복슬한 동물을 모두 골라요', [AN.bear, AN.panda], [AN.frog, AN.snake])
      ] } },
    '04-01-02-01': { engine: 'sort', mode: 'water', fixedBins: true, q: '물에 뜰까요, 가라앉을까요? 알맞은 곳에 넣어요',
      bins: [{ key: 'float', label: '둥둥 떠요', emo: '🛟' }, { key: 'sink', label: '가라앉아요', emo: '⚓' }],
      items: [{ label: '나무 조각', emo: '🪵', bin: 'float', float: true }, { label: '돌', emo: '🪨', bin: 'sink' }, { label: '고무 오리', emo: '🦆', bin: 'float', float: true }, { label: '동전', img: 'core/ui/coin.webp', bin: 'sink' },
        { label: '나뭇잎', emo: '🍃', bin: 'float', float: true }, { label: '열쇠', emo: '🔑', bin: 'sink' }, { label: '공', emo: '⚽', bin: 'float', float: true }, { label: '숟가락', emo: '🥄', bin: 'sink' },
        { label: '스펀지', emo: '🧽', bin: 'float', float: true }, { label: '못', emo: '🔩', bin: 'sink' }] },
    '04-01-02-02': { engine: 'gauge', byLevel: {
      2: { engine: 'pick', sets: [
        set('유모차를 앞으로 움직여요.', { label: '밀기', emo: '👐' }, [{ label: '당기기', emo: '🫳' }]),
        set('서랍을 열어요.', { label: '당기기', emo: '🫳' }, [{ label: '밀기', emo: '👐' }]),
        set('그네에 탄 친구를 앞으로 보내요.', { label: '밀기', emo: '👐' }, [{ label: '당기기', emo: '🫳' }]),
        set('줄다리기를 해요.', { label: '당기기', emo: '🫳' }, [{ label: '밀기', emo: '👐' }]),
        set('마트 카트를 움직여요.', { label: '밀기', emo: '👐' }, [{ label: '당기기', emo: '🫳' }])
      ] },
      5: { engine: 'pick', sets: [
        set('🚪 문을 닫아요. 어떻게 할까요?', { label: '밀기', emo: '👐' }, [{ label: '당기기', emo: '🫳' }, { label: '들기', emo: '🏋️' }, { label: '던지기', emo: '🤾' }]),
        set('🐕 강아지 줄을 잡고 집으로 와요.', { label: '당기기', emo: '🫳' }, [{ label: '밀기', emo: '👐' }, { label: '던지기', emo: '🤾' }, { label: '차기', emo: '🦶' }]),
        set('⚽ 공을 친구에게 보내요.', { label: '차기', emo: '🦶' }, [{ label: '당기기', emo: '🫳' }, { label: '들기', emo: '🏋️' }, { label: '안기', emo: '🤗' }]),
        set('📦 무거운 상자를 옆으로 옮겨요.', { label: '밀기', emo: '👐' }, [{ label: '던지기', emo: '🤾' }, { label: '차기', emo: '🦶' }, { label: '안기', emo: '🤗' }]),
        set('🧻 휴지를 한 칸 뽑아요.', { label: '당기기', emo: '🫳' }, [{ label: '밀기', emo: '👐' }, { label: '차기', emo: '🦶' }, { label: '던지기', emo: '🤾' }])
      ] } } },
    '04-01-03-01': { engine: 'pick', q: '“{x}” 날씨를 찾아요', l1: '날씨를 눌러서 이름을 들어 봐요',
      items: [{ label: '맑아요', emo: '☀️' }, { label: '비가 와요', emo: '🌧️' }, { label: '눈이 와요', emo: '☃️' }, { label: '흐려요', emo: '☁️' }, { label: '바람이 불어요', emo: '🌬️' }, { label: '천둥 번개', emo: '⛈️' }],
      byLevel: { 4: { sets: [
        set('비가 와요. 무엇을 챙길까요?', { label: '우산', emo: '☂️' }, [{ label: '선글라스', emo: '🕶️' }, { label: '부채', emo: '🪭' }, { label: '수영복', emo: '🩱' }]),
        set('눈이 와요. 무엇을 낄까요?', { label: '장갑', emo: '🧤' }, [{ label: '반바지', emo: '🩳' }, { label: '부채', emo: '🪭' }, { label: '샌들', emo: '🩴' }]),
        set('해가 쨍쨍해요. 무엇을 쓸까요?', { label: '모자', emo: '🧢' }, [{ label: '목도리', emo: '🧣' }, { label: '장갑', emo: '🧤' }, { label: '우산', emo: '☂️' }]),
        set('찬 바람이 불어요. 무엇을 입을까요?', { label: '겉옷', emo: '🧥' }, [{ label: '수영복', emo: '🩱' }, { label: '반바지', emo: '🩳' }, { label: '샌들', emo: '🩴' }])
      ] } },
      l5: { sets: [
        multi('오늘은 눈이 와요. 입을 것을 모두 골라요', [{ label: '목도리', emo: '🧣' }, { label: '장갑', emo: '🧤' }], [{ label: '반바지', emo: '🩳' }, { label: '선글라스', emo: '🕶️' }]),
        multi('비 오는 날 등굣길, 챙길 것 두 개', [{ label: '우산', emo: '☂️' }, { label: '장화', emo: '👢' }], [{ label: '부채', emo: '🪭' }, { label: '수영복', emo: '🩱' }]),
        multi('더운 여름날 바닷가에 가요. 챙길 것 두 개', [{ label: '모자', emo: '👒' }, { label: '물', emo: '💧' }], [{ label: '목도리', emo: '🧣' }, { label: '털장갑', emo: '🧤' }])
      ] } },
    '04-01-03-02': { engine: 'sort', rinse: true, q: '재료에 맞는 분리수거 통에 넣어요', l1: '모두 이 통에 넣어요',
      bins: [{ key: 'can', label: '캔', img: J + 'recycle/bin_can.webp' }, { key: 'glass', label: '유리', img: J + 'recycle/bin_glass.webp' }, { key: 'paper', label: '종이', img: J + 'recycle/bin_paper.webp' }, { key: 'plastic', label: '플라스틱', img: J + 'recycle/bin_plastic.webp' }],
      items: [{ label: '음료 캔', img: J + 'recycle/can.webp', bin: 'can', wash: true }, { label: '통조림', emo: '🥫', bin: 'can', wash: true },
        { label: '꿀 유리병', img: J + 'recycle/honey_jar.webp', bin: 'glass', wash: true }, { label: '유리병', emo: '🍾', bin: 'glass' },
        { label: '신문지', img: J + 'recycle/newspaper.webp', bin: 'paper' }, { label: '공책', img: J + 'recycle/notebook.webp', bin: 'paper' }, { label: '상자', img: J + 'recycle/box.webp', bin: 'paper' },
        { label: '플라스틱 병', img: J + 'recycle/milk_bottle.webp', bin: 'plastic', wash: true }, { label: '플라스틱 컵', img: J + 'recycle/cup.webp', bin: 'plastic', wash: true }, { label: '샴푸 통', img: J + 'recycle/shampoo.webp', bin: 'plastic' }] },

    /* ===================== 영어 ===================== */
    '05-01-01-01': { engine: 'pick', voice: 'en', q: '잘 듣고 알맞은 그림을 골라요', l1: '그림을 눌러 영어 인사를 들어 봐요',
      items: [{ label: '안녕 (만날 때)', emo: '👋', en: 'Hello!' }, { label: '잘 가', emo: '🚪', en: 'Goodbye!' }, { label: '고마워', emo: '🎁', en: 'Thank you!' }, { label: '미안해', emo: '🙏', en: 'Sorry!' }, { label: '좋은 아침', emo: '🌅', en: 'Good morning!' }, { label: '잘 자', emo: '🌙', en: 'Good night!' }],
      l5: { voice: 'en', sets: [
        set('아침에 친구를 만났어요. 뭐라고 할까요?', { label: 'Good morning!', emo: '🌅', en: 'Good morning!' }, [{ label: 'Good night!', emo: '🌙', en: 'Good night!' }, { label: 'Sorry!', emo: '🙏', en: 'Sorry!' }, { label: 'Goodbye!', emo: '🚪', en: 'Goodbye!' }]),
        set('선물을 받았어요.', { label: 'Thank you!', emo: '🎁', en: 'Thank you!' }, [{ label: 'Hello!', emo: '👋', en: 'Hello!' }, { label: 'Good night!', emo: '🌙', en: 'Good night!' }, { label: 'Sorry!', emo: '🙏', en: 'Sorry!' }]),
        set('잠자기 전에 가족에게', { label: 'Good night!', emo: '🌙', en: 'Good night!' }, [{ label: 'Good morning!', emo: '🌅', en: 'Good morning!' }, { label: 'Thank you!', emo: '🎁', en: 'Thank you!' }, { label: 'Hello!', emo: '👋', en: 'Hello!' }]),
        set('친구와 헤어져요.', { label: 'Goodbye!', emo: '🚪', en: 'Goodbye!' }, [{ label: 'Sorry!', emo: '🙏', en: 'Sorry!' }, { label: 'Good morning!', emo: '🌅', en: 'Good morning!' }, { label: 'Thank you!', emo: '🎁', en: 'Thank you!' }])
      ] } },
    '05-01-01-02': { engine: 'pick', voice: 'en', q: '잘 듣고 골라요', hideLabel: 4, l1: '눌러서 영어 이름을 들어 봐요',
      items: COLORS.concat([AN.cat, AN.dog, AN.rabbit, AN.bear, AN.frog, AN.monkey]),
      l5: { sets: [
        set('잘 듣고 골라요', { label: '빨간 사과', emo: '🍎' }, [{ label: '초록 사과', emo: '🍏' }, { label: '바나나', emo: '🍌' }, { label: '포도', emo: '🍇' }], { en: 'a red apple' }),
        set('잘 듣고 골라요', { label: '노란 별', emo: '⭐' }, [{ label: '파란 하트', emo: '💙' }, { label: '빨간 하트', emo: '❤️' }, { label: '초록 나무', emo: '🌳' }], { en: 'a yellow star' }),
        set('잘 듣고 골라요', { label: '초록 개구리', img: J + 'animals/frog.webp' }, [{ label: '곰', img: J + 'animals/bear.webp' }, { label: '고양이', img: J + 'animals/cat.webp' }, { label: '펭귄', img: J + 'animals/penguin.webp' }], { en: 'a green frog' }),
        set('잘 듣고 골라요', { label: '파란 하트', emo: '💙' }, [{ label: '빨간 하트', emo: '❤️' }, { label: '노란 하트', emo: '💛' }, { label: '보라 하트', emo: '💜' }], { en: 'a blue heart' })
      ] } },
    '05-01-02-01': { engine: 'pick', voice: 'en', q: '잘 듣고 알맞은 음식을 골라요', hideLabel: 4, zoneLabel: '쟁반에 올려요', zoneIcon: '🍽️', l1: '음식을 눌러 영어 이름을 들어 봐요',
      items: [FOOD.milk, FOOD.egg, FOOD.honey, FOOD.pancake, FOOD.pudding, FOOD.watermelon, FOOD.tomato, FOOD.strawberry, FOOD.carrot, FOOD.ramen],
      l5: { free: true, q: 'What do you want? 먹고 싶은 것을 골라요', freeSay: 'I want {en}, please.', items: [FOOD.milk, FOOD.pancake, FOOD.pudding, FOOD.watermelon, FOOD.strawberry, FOOD.ramen] } },
    '05-01-02-02': { engine: 'pick', voice: 'en', q: '잘 듣고 알맞은 동작을 골라요', l1: '그림을 눌러 영어 신호를 들어 봐요',
      items: [{ label: '가요', emo: '🟢', en: 'Go!' }, { label: '멈춰요', emo: '🛑', en: 'Stop!' }, { label: '뛰어올라요', emo: '🦘', en: 'Jump!' }, { label: '앉아요', emo: '🪑', en: 'Sit down.' }, { label: '일어나요', emo: '🧍', en: 'Stand up.' }, { label: '손뼉 쳐요', emo: '👏', en: 'Clap your hands.' }, { label: '걸어요', emo: '🚶', en: 'Walk.' }],
      l5: { sets: [
        multi('두 가지 동작을 들어요. 모두 골라요', [{ label: '일어나요', emo: '🧍', en: 'Stand up.' }, { label: '손뼉 쳐요', emo: '👏', en: 'Clap.' }], [{ label: '앉아요', emo: '🪑', en: 'Sit down.' }, { label: '뛰어올라요', emo: '🦘', en: 'Jump!' }], { en: 'Stand up and clap.' }),
        multi('두 가지 동작을 들어요. 모두 골라요', [{ label: '뛰어올라요', emo: '🦘', en: 'Jump!' }, { label: '멈춰요', emo: '🛑', en: 'Stop!' }], [{ label: '걸어요', emo: '🚶', en: 'Walk.' }, { label: '앉아요', emo: '🪑', en: 'Sit down.' }], { en: 'Jump, jump, and stop!' }),
        multi('두 가지 동작을 들어요. 모두 골라요', [{ label: '걸어요', emo: '🚶', en: 'Walk.' }, { label: '앉아요', emo: '🪑', en: 'Sit down.' }], [{ label: '손뼉 쳐요', emo: '👏', en: 'Clap.' }, { label: '가요', emo: '🟢', en: 'Go!' }], { en: 'Walk and sit down.' })
      ] } },
    '05-01-03-01': { engine: 'pick', voice: 'en', q: '잘 듣고, 무엇을 좋아한다고 했는지 골라요', l1: '그림을 눌러 “I like ~” 를 들어 봐요',
      items: [{ label: '사과', emo: '🍎', en: 'I like apples.' }, { label: '공', emo: '⚽', en: 'I like balls.' }, { label: '강아지', img: J + 'animals/dog.webp', en: 'I like dogs.' }, { label: '고양이', img: J + 'animals/cat.webp', en: 'I like cats.' }, { label: '우유', img: J + 'kitchen/ing_milk.webp', en: 'I like milk.' }, { label: '노래', emo: '🎵', en: 'I like music.' }, { label: '그림', emo: '🎨', en: 'I like drawing.' }],
      l5: { free: true, q: '내가 좋아하는 것을 골라요. 영어로 말해 볼까요?', freeSay: '{en}' } },
    '05-01-03-02': { engine: 'pairs', wordOf: 'en', q: '그림과 같은 영어 낱말을 찾아요',
      items: [AN.cat, AN.dog, AN.frog, AN.bee, AN.owl, AN.fox, AN.bear, FOOD.egg, FOOD.milk, { label: '컵', img: J + 'recycle/cup.webp', en: 'cup' }, { label: '상자', img: J + 'recycle/box.webp', en: 'box' }] },

    /* ===================== 미술 ===================== */
    '06-01-01-01': { engine: 'pick', q: '{x}을 찾아요', l1: '물감을 눌러서 색 이름을 들어 봐요', zoneLabel: '팔레트에 옮겨요', zoneIcon: '🎨',
      items: COLORS,
      l5: { sets: [
        set('바나나는 무슨 색일까요? 🍌', C['노랑'], [C['파랑'], C['보라'], C['초록']]),
        set('딸기는 무슨 색일까요? 🍓', C['빨강'], [C['파랑'], C['노랑'], C['초록']]),
        set('나뭇잎은 무슨 색일까요? 🍃', C['초록'], [C['빨강'], C['보라'], C['주황']]),
        set('바다는 무슨 색일까요? 🌊', C['파랑'], [C['주황'], C['노랑'], C['빨강']]),
        set('포도는 무슨 색일까요? 🍇', C['보라'], [C['노랑'], C['주황'], C['초록']]),
        set('당근은 무슨 색일까요? 🥕', C['주황'], [C['파랑'], C['보라'], C['초록']])
      ] } },
    '06-01-01-02': { engine: 'mix', byLevel: { 2: { engine: 'pick', q: '{x} 물감을 골라요', items: [C['빨강'], C['노랑'], C['파랑']] } } },
    '06-01-02-01': { engine: 'draw' },
    '06-01-02-02': { engine: 'build' },
    '06-01-03-01': { engine: 'portal', go: 'draw:sticker', emo: '🧩', title: '촉감 스티커 콜라주', button: '미술실 스티커 꾸미기로 가기' },
    '06-01-03-02': { engine: 'portal', go: 'gallery:view', emo: '🖼️', title: '우리 반 작은 미술관', button: '작품 전시관으로 가기' },

    /* ===================== 음악 ===================== */
    '07-01-01-01': { engine: 'pick', voice: 'inst', q: '이 소리는 어떤 악기일까요?', l1: '악기를 눌러서 소리를 들어 봐요',
      items: [{ label: '북', emo: '🥁', inst: 'drum' }, { label: '종', emo: '🔔', inst: 'bell' }, { label: '박수', emo: '👏', inst: 'clap' }, { label: '피아노', emo: '🎹', inst: 'piano', freq: 262 }, { label: '트라이앵글', emo: '🔺', inst: 'triangle' }, { label: '실로폰', emo: '🎼', inst: 'xylo', freq: 523 }],
      l5: { free: true, q: '좋아하는 악기를 골라 연주해요', freeSay: '{x} 소리 멋져요' } },
    '07-01-01-02': { engine: 'pick', voice: 'inst', q: '잘 듣고 골라요. 높은 소리일까요, 낮은 소리일까요?', l1: '눌러서 높은 소리와 낮은 소리를 들어 봐요',
      items: [{ label: '높은 소리', emo: '🐦', inst: 'high' }, { label: '낮은 소리', emo: '🐻', inst: 'low' }, { label: '가운데 소리', emo: '🐱', inst: 'xylo', freq: 440 }] },
    '07-01-02-01': { engine: 'rhythm', tempo: 76, q2: '반짝일 때 발을 쿵! 눌러요',
      pads: [{ label: '왼발', emo: '🦶', inst: 'drum' }, { label: '오른발', emo: '🦶', inst: 'clap' }, { label: '박수', emo: '👏', inst: 'tambourine' }],
      songs: { 3: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1], 4: [0, 1, 0, 1, 2, 2, 0, 1, 0, 1, 2, 2] } },
    '07-01-02-02': { engine: 'rhythm', tempo: 84, pads: [{ label: '북', emo: '🥁', inst: 'drum' }, { label: '탬버린', emo: '🔔', inst: 'tambourine' }, { label: '마라카스', emo: '🎍', inst: 'maracas' }] },
    '07-01-03-01': { engine: 'rhythm', tempo: 88, q3: '음표가 선에 닿을 때 눌러서 노래를 연주해요',
      pads: [{ label: '도', emo: '🔴', inst: 'xylo', note: 'C4' }, { label: '레', emo: '🟠', inst: 'xylo', note: 'D4' }, { label: '미', emo: '🟡', inst: 'xylo', note: 'E4' }, { label: '솔', emo: '🔵', inst: 'xylo', note: 'G4' }],
      songs: { 3: [2, 1, 0, 2, 1, 0, 0, 0, 1, 1, 2, 1, 0], 4: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 3, 3, 2, 1, 0, 1, 2, 2, 2, 1, 1, 2, 1, 0] } },
    '07-01-03-02': { engine: 'pick', voice: 'mel', q: '음악을 듣고 어떤 느낌인지 골라요', l1: '얼굴을 눌러서 음악을 들어 봐요',
      items: [
        { label: '기뻐요', emo: '😄', mel: ['C4:.5', 'E4:.5', 'G4:.5', 'C5:.5', 'G4:.5', 'C5:1'], tempo: 140 },
        { label: '슬퍼요', emo: '😢', mel: ['A4:1.5', 'G4:.5', 'E4:1', 'D4:1', 'C4:2'], tempo: 58, inst2: 'piano' },
        { label: '편안해요', emo: '😌', mel: ['E4:1', 'G4:1', 'E4:1', 'D4:1', 'C4:2'], tempo: 70, inst2: 'bell' },
        { label: '신나요', emo: '🤩', mel: ['C4:.25', 'C4:.25', 'G4:.5', 'C4:.25', 'C4:.25', 'A4:.5', 'G4:.5', 'C5:1'], tempo: 150, inst2: 'xylo' }
      ],
      l5: { free: true, q: '음악을 틀고, 들려주고 싶은 느낌을 골라요', freeSay: '{x}' } }
  };
  window.OKS_CONTENT = CONTENT;
})();
