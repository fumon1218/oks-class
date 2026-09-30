/* 가게(타이쿤) 목록 — 정글 점프 춘천본원·원주분원 체험을 교육과정 차시와 연결했습니다.
   order(ctx, i) → 이번 손님 주문, steps(ctx, o) → 작업대 순서. 수준(ctx.level 1~5)에 따라 주문이 커지고 도움이 줄어듭니다. */
(function () {
  'use strict';
  var J = 'art/jj/', F = 'games/farm/assets/';
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var LV = function (ctx, arr) { return arr[ctx.level - 1]; };

  /* 색: 색각 차이가 있어도 알 수 있게 모양 기호를 함께 */
  var COLS = [
    { key: 'red', label: '빨강', color: '#e53935', sym: '●' }, { key: 'orange', label: '주황', color: '#fb8c00', sym: '▲' },
    { key: 'yellow', label: '노랑', color: '#fdd835', sym: '■' }, { key: 'green', label: '초록', color: '#43a047', sym: '★' },
    { key: 'blue', label: '파랑', color: '#1e88e5', sym: '◆' }, { key: 'purple', label: '보라', color: '#8e24aa', sym: '♣' },
    { key: 'pink', label: '분홍', color: '#f06292', sym: '♥' }
  ];
  var C = {}; COLS.forEach(function (c) { C[c.key] = c; });
  var MIXES = [{ to: 'orange', a: 'red', b: 'yellow' }, { to: 'green', a: 'yellow', b: 'blue' }, { to: 'purple', a: 'red', b: 'blue' }];
  function colItem(c) { return { key: c.key, label: c.label, svg: '<span class="swatch" style="background:' + c.color + '"><i>' + c.sym + '</i></span>', color: c.color }; }
  function hanky(color, color2) { return '<span class="hanky" style="--c:' + color + ';--c2:' + (color2 || color) + '"></span>'; }

  var S = {};

  /* ============ 춘천본원 · 진로직업 공방 ============ */
  S.dye = {
    camp: 'cc', hall: 'craft', name: '염색 공방', icon: '🎨', col: '#d81b60', bg: 'room-dye', price: 2000,
    desc: '손수건을 원하는 색으로 물들여요', lessons: ['06-01-01-01', '06-01-01-02'],
    how: ['손님이 원하는 색 물감을 골라요', '꾹 누르면 천이 물들어요. ✓ 칸에서 손을 떼요', '빨랫줄에 널어 말린 뒤 드려요'],
    order: function (ctx) {
      var lv = ctx.level;
      if (lv === 4) { var m = pick(MIXES); return { kind: 'mix', c: C[m.to], m: m, bubble: hanky(C[m.to].color) + '<b>' + C[m.to].label + '</b>', say: C[m.to].label + ' 손수건 주세요!', product: hanky(C[m.to].color) }; }
      if (lv === 5) { var two = shuffle(COLS).slice(0, 2); return { kind: 'two', c: two[0], c2: two[1], bubble: hanky(two[0].color, two[1].color) + '<b>' + two[0].label + '·' + two[1].label + '</b>', say: two[0].label + '과 ' + two[1].label + ' 두 가지 색 손수건 주세요!', product: hanky(two[0].color, two[1].color) }; }
      var c = pick(COLS.slice(0, lv <= 2 ? 5 : 7)); return { kind: 'one', c: c, bubble: hanky(c.color) + '<b>' + c.label + '</b>', say: c.label + ' 손수건 주세요!', product: hanky(c.color) };
    },
    steps: function (ctx, o) {
      var items = COLS.map(colItem), primaries = ['red', 'yellow', 'blue', 'green', 'pink'].map(function (k) { return colItem(C[k]); });
      var dip = function (col, col2) { return { k: 'hold', q: '꾹 누르면 천이 물들어요. ✓ 칸에서 손을 떼요', button: '꾹 담그기', art: 'dye', artHtml: hanky(col, col2), sfx: 'water', low: '조금 연해요. 다시 담가 봐요', high: '조금 진해요. 다시 해 봐요' }; };
      var hang = { k: 'tapN', q: '빨랫줄에 널어 말려요', n: 1, art: 'line', artHtml: '<span class="clothesline">' + o.product + '</span>', okText: '보송보송!' };
      if (o.kind === 'mix') return [{ k: 'pick', q: o.c.label + '을 만들려면 어떤 물감 두 개를 섞을까요?', items: primaries, targets: [colItem(C[o.m.a]), colItem(C[o.m.b])].map(function (t) { return primaries.filter(function (p) { return p.key === t.key; })[0]; }), n: 4, noLabel: false }, dip(o.c.color), hang];
      if (o.kind === 'two') return [{ k: 'pick', q: '먼저 ' + o.c.label + ', 다음에 ' + o.c2.label + '을 골라요', items: items, targets: [items.filter(function (x) { return x.key === o.c.key; })[0], items.filter(function (x) { return x.key === o.c2.key; })[0]], ordered: true, n: 4 }, dip(o.c.color, o.c2.color), hang];
      return [{ k: 'pick', q: o.c.label + ' 물감을 골라요', items: items, target: items.filter(function (x) { return x.key === o.c.key; })[0], zone: '물감 통', zoneIcon: '🪣' }, dip(o.c.color), hang];
    }
  };
  var WOOD = [{ label: '의자', emo: '🪑' }, { label: '나무 상자', emo: '📦' }, { label: '새집', emo: '🏠' }];
  S.wood = {
    camp: 'cc', hall: 'craft', name: '목공 공방', icon: '🪚', col: '#8d5524', bg: 'room-wood', price: 3000,
    desc: '사포질 · 못 박기 · 색칠', lessons: ['06-01-02-02', '04-01-02-02'],
    how: ['사포로 문질러 나무를 매끈하게 해요', '망치가 ✓ 칸에 오면 “탕!” 못을 박아요', '손님이 원하는 색으로 칠해요'],
    order: function (ctx) { var w = pick(WOOD), c = pick(COLS.slice(0, 5)); return { w: w, c: c, bubble: '<span class="emo">' + w.emo + '</span><span class="swatch sm" style="background:' + c.color + '"></span><b>' + c.label + ' ' + w.label + '</b>', say: c.label + ' ' + w.label + ' 만들어 주세요!', product: '<span class="emo tint" style="--c:' + c.color + '">' + w.emo + '</span>' }; },
    steps: function (ctx, o) {
      var items = COLS.map(colItem);
      return [
        { k: 'rub', q: '사포로 문질러서 나무를 매끈하게 해요', art: 'wood', artHtml: '<span class="emo">' + o.w.emo + '</span>', okText: '매끈매끈!' },
        { k: 'timing', q: '망치가 ✓ 칸에 오면 눌러서 못을 박아요', hits: LV(ctx, [1, 2, 3, 3, 4]), icon: '🔨', button: '탕!', unit: '못', art: 'nail', artHtml: '<span class="emo">🪵</span>', okText: '튼튼해요!' },
        { k: 'pick', q: o.c.label + ' 물감으로 칠해요', items: items, target: items.filter(function (x) { return x.key === o.c.key; })[0], zone: '붓', zoneIcon: '🖌️' }
      ];
    }
  };
  var GOODS = [{ label: '사과', emo: '🍎' }, { label: '귤', emo: '🍊' }, { label: '쿠키', emo: '🍪' }, { label: '컵케이크', emo: '🧁' }, { label: '도넛', emo: '🍩' }, { label: '딸기', img: F + 'strawberry_single.webp' }];
  var PACK = [{ label: '뚜껑 닫기', emo: '📦' }, { label: '테이프 붙이기', emo: '✂️' }, { label: '리본 달기', emo: '🎀' }];
  S.pack = {
    camp: 'cc', hall: 'craft', name: '포장 공방', icon: '🎁', col: '#e53935', bg: 'room-pack', price: 2000,
    desc: '세어서 담고 예쁘게 포장해요', lessons: ['02-01-01-02', '02-01-03-02'],
    how: ['손님이 말한 개수만큼 상자에 담아요', '다 담았으면 ✔ 버튼을 눌러요', '순서 카드대로 뚜껑 → 테이프 → 리본!'],
    order: function (ctx) {
      var lv = ctx.level, g = pick(GOODS);
      if (lv === 4) { var two = shuffle(GOODS).slice(0, 2), a = 1 + Math.floor(Math.random() * 3), b = 1 + Math.floor(Math.random() * 3); return { order: [{ item: two[0], n: a }, { item: two[1], n: b }], bubble: '<span>' + pic(two[0]) + '<b>' + a + '</b></span><span>' + pic(two[1]) + '<b>' + b + '</b></span>', say: two[0].label + ' ' + a + '개, ' + two[1].label + ' ' + b + '개 포장해 주세요!', product: '<span class="emo">🎁</span>' }; }
      var n = LV(ctx, [[1, 2], [2, 3], [3, 4, 5], [2, 3, 4], [5, 6, 7]]); n = pick(n);
      return { order: [{ item: g, n: n }], bubble: pic(g) + '<b>' + n + '</b>', say: g.label + ' ' + n + '개 포장해 주세요!', product: '<span class="emo">🎁</span>' };
    },
    steps: function (ctx, o) {
      var st = PACK.slice(0, LV(ctx, [1, 2, 3, 3, 3]));
      return [{ k: 'count', q: '주문한 개수만큼 상자에 담아요', order: o.order }, { k: 'seq', q: '순서대로 포장해요', steps: st, show: ctx.level <= 4 }];
    }
  };
  var BEADS = COLS.slice(0, 6).map(function (c) { return { key: c.key, label: c.label + ' 구슬', svg: '<span class="beadball" style="background:' + c.color + '"><i>' + c.sym + '</i></span>' }; });
  S.bead = {
    camp: 'cc', hall: 'craft', name: '구슬 공예', icon: '📿', col: '#8e24aa', bg: 'room-bead', price: 2000,
    desc: '규칙대로 팔찌를 만들어요', lessons: ['02-01-03-01'],
    how: ['팔찌 구슬의 규칙을 잘 봐요', '빈칸에 올 구슬을 골라요', '팔찌를 완성해서 손님께 드려요'],
    order: function (ctx) {
      var pat = LV(ctx, ['AB', 'AB', pick(['AAB', 'ABB']), 'ABC', pick(['AABB', 'ABC'])]);
      var syms = shuffle(BEADS).slice(0, 3), unit = pat.split('').map(function (ch) { return syms['ABC'.indexOf(ch)]; });
      var len = unit.length * (pat.length <= 2 ? 3 : 2) + LV(ctx, [1, 1, 1, 2, 3]);
      var seq = []; for (var k = 0; k < len; k++) seq.push(unit[k % unit.length]);
      return { seq: seq, blanks: LV(ctx, [1, 1, 1, 2, 3]), used: syms.slice(0, pat.indexOf('C') >= 0 ? 3 : 2), bubble: '<span class="emo">📿</span><b>규칙 팔찌</b>', say: '규칙이 있는 팔찌를 만들어 주세요!', product: '<span class="emo">📿</span>' };
    },
    steps: function (ctx, o) {
      var need = o.used, extra = shuffle(BEADS.filter(function (b) { return need.indexOf(b) < 0; }));
      var n = Math.max(need.length, LV(ctx, [1, 2, 3, 4, 4])), opts = ctx.level === 1 ? [o.seq[o.seq.length - 1]] : shuffle(need.concat(extra).slice(0, n));
      return [{ k: 'pattern', seq: o.seq, blanks: o.blanks, opts: opts }];
    }
  };
  function pic(it) { return it.img ? '<img src="' + (window.OKS ? OKS.ROOT : '../') + it.img + '" alt="">' : '<span class="emo">' + it.emo + '</span>'; }

  /* ============ 춘천본원 · 이해·보조공학실 ============ */
  var HELP = [
    { e: '🦽', t: '휠체어를 탄 친구가 문 앞에 있어요.', ok: ['🙋', '“문 열어 줄까?” 먼저 물어봐요'], no: [['🏃', '모른 척 지나가요'], ['👐', '휠체어를 마음대로 밀어요']], why: '도와주기 전에 먼저 물어보면 친구가 편안해요.' },
    { e: '🦯', t: '흰 지팡이를 쓰는 친구가 길을 찾고 있어요.', ok: ['🗣️', '“내 팔을 잡을래?” 말로 알려 줘요'], no: [['😶', '말없이 지팡이를 잡아당겨요'], ['👋', '멀리서 손만 흔들어요']], why: '눈이 잘 안 보이는 친구에게는 말로 알려 주는 게 좋아요.' },
    { e: '🧏', t: '귀가 잘 안 들리는 친구를 불렀는데 대답이 없어요.', ok: ['👋', '앞에서 손을 흔들고 눈을 맞춰요'], no: [['📢', '뒤에서 크게 소리 질러요'], ['😤', '대답 안 한다고 화를 내요']], why: '얼굴을 보고 눈을 맞추면 친구가 알아차릴 수 있어요.' },
    { e: '🦻', t: '보청기를 낀 친구와 이야기해요.', ok: ['😊', '얼굴을 보며 천천히 또박또박 말해요'], no: [['🙊', '입을 가리고 빨리 말해요'], ['🎵', '시끄러운 곳에서 이야기해요']], why: '입 모양이 보이게 천천히 말하면 더 잘 알아들어요.' },
    { e: '🖼️', t: '그림 카드로 말하는 친구가 카드를 고르고 있어요.', ok: ['⏳', '친구가 고를 때까지 기다려요'], no: [['🗯️', '내가 대신 말해 버려요'], ['⏰', '빨리 하라고 재촉해요']], why: '기다려 주면 친구가 스스로 말할 수 있어요.' },
    { e: '🐕‍🦺', t: '안내견과 함께 걷는 친구를 만났어요.', ok: ['🙋', '안내견은 만지지 않고 친구에게 인사해요'], no: [['🍖', '안내견에게 간식을 줘요'], ['🤗', '안내견을 쓰다듬어요']], why: '안내견은 일하는 중이에요. 만지거나 부르지 않아요.' },
    { e: '🔍', t: '글씨가 작아서 잘 안 보이는 친구가 있어요.', ok: ['🔎', '큰 글씨나 돋보기를 같이 찾아봐요'], no: [['😆', '못 본다고 놀려요'], ['📕', '책을 치워 버려요']], why: '알맞은 도구가 있으면 누구나 함께 읽을 수 있어요.' },
    { e: '🎧', t: '시끄러운 소리가 힘든 친구가 귀를 막고 있어요.', ok: ['🤫', '조용한 곳에 같이 가자고 해요'], no: [['📣', '더 크게 떠들어요'], ['✋', '손을 억지로 떼요']], why: '친구가 편안한 곳을 함께 찾아 주면 좋아요.' },
    { e: '🤟', t: '수어로 인사하는 친구를 만났어요.', ok: ['👋', '웃으며 손을 흔들어 인사해요'], no: [['🙄', '이상하다고 말해요'], ['🚶', '그냥 지나가요']], why: '수어도 소중한 말이에요. 몸짓과 표정으로 함께 인사해요.' },
    { e: '🧩', t: '놀이 규칙을 어려워하는 친구가 있어요.', ok: ['🧑‍🏫', '그림으로 천천히 알려 줘요'], no: [['🚫', '같이 안 논다고 해요'], ['😠', '왜 모르냐고 해요']], why: '천천히, 그림으로 알려 주면 함께 놀 수 있어요.' }
  ];
  S.help = {
    camp: 'cc', hall: 'ccmain', name: '친구 돕기', icon: '🤝', col: '#1b7fc4', bg: 'room-class', noPay: true, customerWord: '친구',
    desc: '장애이해교육 · 서로 돕는 방법', lessons: ['03-01-02-01', '01-01-02-02'],
    how: ['친구의 이야기를 잘 들어요', '어떻게 하면 좋을지 골라요', '서로 방법이 다를 뿐이에요!'],
    order: function (ctx, i) { ctx._help = ctx._help || shuffle(HELP); var h = ctx._help[i % HELP.length]; return { h: h, bubble: '<span class="emo">' + h.e + '</span>', say: h.t, product: '<span class="emo">💛</span>' }; },
    steps: function (ctx, o) {
      var opts = [{ emo: o.h.ok[0], label: o.h.ok[1] }].concat(o.h.no.map(function (n) { return { emo: n[0], label: n[1] }; }));
      return [{ k: 'situation', q: o.h.t + ' 어떻게 할까요?', opts: opts, why: o.h.why }];
    },
    noGreet: true
  };
  var SW_SETS = [
    { title: '먹고 싶은 과일', cards: [{ emo: '🍎', label: '사과' }, { emo: '🍌', label: '바나나' }, { emo: '🍇', label: '포도' }, { emo: '🍓', label: '딸기' }] },
    { title: '마시고 싶은 것', cards: [{ emo: '🧃', label: '주스' }, { emo: '🥛', label: '우유' }, { emo: '💧', label: '물' }, { emo: '🍵', label: '차' }] },
    { title: '지금 기분', cards: [{ emo: '😊', label: '기뻐요' }, { emo: '😢', label: '슬퍼요' }, { emo: '😠', label: '화나요' }, { emo: '😴', label: '졸려요' }] },
    { title: '하고 싶은 놀이', cards: [{ emo: '⚽', label: '공놀이' }, { emo: '🎨', label: '그리기' }, { emo: '🎵', label: '노래' }, { emo: '🧩', label: '퍼즐' }] },
    { title: '도움이 필요할 때', cards: [{ emo: '🚻', label: '화장실 가고 싶어요' }, { emo: '🙋', label: '도와주세요' }, { emo: '✋', label: '잠깐 쉴래요' }, { emo: '💧', label: '물 주세요' }] }
  ];
  S.switch = {
    camp: 'cc', hall: 'ccmain', name: '스위치 체험', icon: '🔘', col: '#6a1b9a', bg: 'room-at', noPay: true, customerWord: '친구',
    desc: '보조공학 · 버튼 하나로 말하기', lessons: ['01-01-02-02', '01-01-03-01'],
    how: ['불빛이 그림 카드를 하나씩 차례로 비춰요', '원하는 카드에 불빛이 오면 스위치를 눌러요', '스페이스 · 화면 · 큰 버튼 = 스위치'],
    order: function (ctx, i) { var s = SW_SETS[i % SW_SETS.length], t = pick(s.cards); return { s: s, t: t, bubble: '<span class="emo">' + t.emo + '</span><b>' + t.label + '</b>', say: '친구가 ' + s.title + '을 말하고 싶어 해요. ' + t.label + '!', product: '<span class="emo">💬</span>' }; },
    steps: function (ctx, o) { return [{ k: 'scan', q: o.s.title + ': 불빛이 “' + o.t.label + '”에 오면 스위치를 눌러요', cards: o.s.cards, target: o.t, sayOk: '저는 ' + o.t.label + '!' }]; },
    noGreet: true
  };

  /* ============ 원주분원 · 진로직업체험관 ============ */
  var CROPS = [
    { key: 'tomato', label: '토마토', img: F + 'harvest_tomato.webp', plant: F + 'tomato_plant.webp' },
    { key: 'strawberry', label: '딸기', img: F + 'strawberry_single.webp', plant: F + 'strawberry_plant.webp' },
    { key: 'lettuce', label: '상추', img: F + 'harvest_lettuce.webp', plant: F + 'lettuce_plant.webp' },
    { key: 'carrot', label: '당근', img: F + 'harvest_carrot.webp', plant: F + 'carrots.webp' }
  ];
  var TOOLS = [{ key: 'seed', label: '씨앗 심기', img: F + 'parcel_seed.webp' }, { key: 'water', label: '물 주기', img: F + 'watering_can.webp' }, { key: 'bug', label: '벌레 잡기', img: J + 'farm/tongs.webp' }, { key: 'harvest', label: '수확하기', img: F + 'basket.webp' }];
  S.farm = {
    camp: 'wj', hall: 'farm', name: '스마트팜', icon: '🌱', col: '#3f9b2f', bg: 'img:core/ui/greenhouse.webp', price: 3000,
    desc: '햇살 농장 · 키우고 세어서 팔아요', lessons: ['02-01-01-01', '04-01-01-01'],
    how: ['밭 상태를 보고 알맞은 도구를 골라요', '다 자라면 주문한 개수만큼 담아요', '돈을 받고 인사해요'],
    order: function (ctx) {
      var c = pick(CROPS), n = pick(LV(ctx, [[1, 2], [2, 3], [3, 4, 5], [2, 3, 4], [4, 5, 6]]));
      if (ctx.level === 4) { var c2 = pick(CROPS.filter(function (x) { return x !== c; })), n2 = 1 + Math.floor(Math.random() * 2); return { c: c, order: [{ item: c, n: n }, { item: c2, n: n2 }], bubble: pic(c) + '<b>' + n + '</b>' + pic(c2) + '<b>' + n2 + '</b>', say: c.label + ' ' + n + '개, ' + c2.label + ' ' + n2 + '개 주세요!', product: '<img src="' + OKS.ROOT + F + 'basket.webp" alt="">' }; }
      return { c: c, order: [{ item: c, n: n }], bubble: pic(c) + '<b>' + n + '</b>', say: c.label + ' ' + n + '개 주세요!', product: '<img src="' + OKS.ROOT + F + 'basket.webp" alt="">' };
    },
    steps: function (ctx, o) {
      var lv = ctx.level, T = {}; TOOLS.forEach(function (t) { T[t.key] = t; });
      var plant = function (src, cls) { return '<div class="plot ' + (cls || '') + '"><img src="' + OKS.ROOT + F + 'empty_planter.webp" class="box" alt=""><img src="' + OKS.ROOT + src + '" class="pl" alt=""></div>'; };
      var care = [];
      if (lv >= 3) care.push({ k: 'pick', q: '빈 밭이에요. 무엇부터 할까요?', items: TOOLS, target: T.seed, before: plant(F + 'soil_pot.webp', 'empty') });
      if (lv >= 2) care.push({ k: 'pick', q: '흙이 말랐어요. 무엇이 필요할까요?', items: TOOLS, target: T.water, before: plant(F + 'sprout_pot.webp', 'dry') });
      if (lv >= 4) care.push({ k: 'pick', q: '앗, 벌레가 잎을 먹어요! 어떻게 할까요?', items: TOOLS, target: T.bug, before: plant(F + 'young_plant.webp', 'bug') });
      if (lv === 5) care.push({ k: 'hold', q: '온실 온도를 맞춰요. ✓ 칸(18~24도)에서 손을 떼요', button: '꾹 눌러 따뜻하게', art: 'thermo', artHtml: '<span class="thermo"><i></i></span><b class="deg"></b>', onVal: function (v, a) { a.querySelector('.deg').textContent = Math.round(8 + v * 24) + '도'; }, zone: [(18 - 8) / 24, (24 - 8) / 24] });
      care.push({ k: 'pick', q: o.c.label + '가 빨갛게 잘 익었어요. 이제 무엇을 할까요?', items: TOOLS, target: T.harvest, n: lv === 1 ? 1 : undefined, before: plant(o.c.plant, 'ripe') });
      return care.concat([{ k: 'count', q: '주문한 개수만큼 바구니에 담아요', order: o.order }]);
    }
  };
  var KIM = [{ label: '단무지', img: J + 'snack/danmuji.webp' }, { label: '시금치', img: J + 'snack/spinach.webp' }, { label: '당근', img: J + 'snack/carrot.webp' }, { label: '달걀', img: J + 'snack/egg_strip.webp' }, { label: '햄', img: J + 'snack/ham.webp' }];
  var RAMEN_ADD = [{ label: '면', img: J + 'snack/noodle.webp' }, { label: '스프', img: J + 'snack/soup.webp' }, { label: '달걀', img: J + 'kitchen/ing_egg.webp' }, { label: '떡', img: J + 'snack/ricecake.webp' }];
  var MENU = { ramen: { label: '라면', img: J + 'snack/ramen_bowl.webp', price: 3000 }, kimbap: { label: '김밥', img: J + 'snack/kimbap_plate.webp', price: 2000 }, tteok: { label: '떡볶이', emo: '🍢', price: 3000 } };
  S.snack = {
    camp: 'wj', hall: 'snack', name: '분식집', icon: '🍜', col: '#e07b12', bg: 'img:art/jj/scenes/snack.webp',
    desc: '라면 끓이기 · 김밥 말기 · 계산', lessons: ['01-01-02-01', '01-01-03-02', '03-01-01-02'],
    how: ['손님께 인사하고 주문을 받아요', '순서대로 라면을 끓이고 김밥을 말아요', '돈을 세어서 받고 인사해요'],
    order: function (ctx, i) { var m = (i % 2 === 0) ? 'ramen' : 'kimbap'; if (ctx.level >= 3 && Math.random() < 0.5) m = m === 'ramen' ? 'kimbap' : 'ramen'; var M = MENU[m]; return { m: m, price: M.price, bubble: pic(M) + '<b>' + M.label + '</b>', say: M.label + ' 주세요!', product: pic(M) }; },
    steps: function (ctx, o) {
      var lv = ctx.level, menus = [MENU.ramen, MENU.kimbap, MENU.tteok];
      var s = [];
      if (lv >= 2) s.push({ k: 'pick', q: '손님이 무엇을 주문했나요? 주문서를 골라요', items: menus, target: MENU[o.m], zone: '주문서', zoneIcon: '📝' });
      if (o.m === 'ramen') {
        s.push({ k: 'hold', q: '냄비에 물을 부어요. 꾹 누르고 ✓ 칸에서 떼요', button: '꾹 붓기', art: 'pot', artHtml: '<img src="' + OKS.ROOT + J + 'snack/pot.webp" alt=""><i class="water"></i>', sfx: 'water', low: '물이 조금 적어요', high: '물이 조금 많아요' });
        s.push({ k: 'tapN', q: '불을 켜요', n: 1, artHtml: '<img src="' + OKS.ROOT + J + 'snack/stove.webp" alt="">', art: 'stove', okText: false });
        var need = RAMEN_ADD.slice(0, LV(ctx, [1, 2, 3, 3, 3]));
        s.push({ k: 'pick', q: need.map(function (x) { return x.label; }).join(', ') + '을(를) 넣어요', items: RAMEN_ADD, targets: need, n: lv <= 2 ? need.length + 1 : 4 });
        s.push({ k: 'wait', q: '보글보글 끓을 때까지 기다려요. 종이 울리면 눌러요', sec: LV(ctx, [3, 3, 4, 5, 5]), button: '다 끓었어요!' });
      } else {
        s.push({ k: 'tapN', q: '김을 올리고 밥을 펴요. 여러 번 톡톡!', n: LV(ctx, [2, 3, 4, 4, 5]), art: 'gim', artHtml: '<img src="' + OKS.ROOT + J + 'snack/gim.webp" alt=""><i class="rice"></i>' });
        var fill = shuffle(KIM).slice(0, LV(ctx, [2, 2, 3, 4, 5]));
        s.push({ k: 'seq', q: '순서 카드대로 재료를 올려요', steps: fill });
        s.push({ k: 'hold', q: '꾹 눌러서 김밥을 돌돌 말아요', button: '꾹 말기', art: 'roll', artHtml: '<img src="' + OKS.ROOT + J + 'snack/kimbap_roll.webp" alt="">', zone: lv === 1 ? null : [0.5, 1] });
        s.push({ k: 'tapN', q: '김밥을 썰어요', n: LV(ctx, [3, 4, 7, 7, 7]), art: 'cut', artHtml: '<img src="' + OKS.ROOT + J + 'snack/kimbap_roll.webp" alt=""><span class="knife">🔪</span>' });
      }
      return s;
    }
  };
  var TRASH = [
    { label: '신문지', img: J + 'recycle/newspaper.webp', bin: 'paper' }, { label: '택배 상자', img: J + 'recycle/box.webp', bin: 'paper' }, { label: '다 쓴 공책', img: J + 'recycle/notebook.webp', bin: 'paper' },
    { label: '샴푸 통', img: J + 'recycle/shampoo.webp', bin: 'plastic', wash: true }, { label: '플라스틱 컵', img: J + 'recycle/cup.webp', bin: 'plastic', wash: true }, { label: '우유병', img: J + 'recycle/milk_bottle.webp', bin: 'plastic', wash: true },
    { label: '음료 캔', img: J + 'recycle/can.webp', bin: 'can', wash: true }, { label: '통조림 캔', emo: '🥫', bin: 'can', wash: true },
    { label: '꿀 병', img: J + 'recycle/honey_jar.webp', bin: 'glass', wash: true }, { label: '유리병', emo: '🍾', bin: 'glass' }
  ];
  var BINS = [{ key: 'paper', label: '종이', img: J + 'recycle/bin_paper.webp' }, { key: 'plastic', label: '플라스틱', img: J + 'recycle/bin_plastic.webp' }, { key: 'can', label: '캔', img: J + 'recycle/bin_can.webp' }, { key: 'glass', label: '유리', img: J + 'recycle/bin_glass.webp' }];
  S.recycle = {
    camp: 'wj', hall: 'recycle', name: '분리수거장', icon: '♻️', col: '#1e88e5', bg: 'img:art/jj/scenes/recycle.webp', noPay: true, customerWord: '이웃',
    desc: '알맞은 통에 나누어 버려요', lessons: ['04-01-03-02'],
    how: ['이웃이 가져온 쓰레기를 봐요', '💧 표시가 있으면 먼저 헹궈요 (5수준)', '종이 · 플라스틱 · 캔 · 유리 나누기!'],
    order: function (ctx) {
      var nb = LV(ctx, [1, 2, 3, 4, 4]), bins = shuffle(BINS).slice(0, nb), keys = bins.map(function (b) { return b.key; });
      var pool = TRASH.filter(function (t) { return keys.indexOf(t.bin) >= 0; }), n = LV(ctx, [2, 3, 4, 5, 5]);
      var items = []; keys.forEach(function (k) { var one = shuffle(pool.filter(function (t) { return t.bin === k; }))[0]; if (one && items.length < n) items.push(one); });
      items = items.concat(shuffle(pool.filter(function (t) { return items.indexOf(t) < 0; })).slice(0, Math.max(0, n - items.length)));
      return { bins: bins, items: shuffle(items), bubble: '<span class="emo">🛍️</span><b>' + items.length + '개</b>', say: '쓰레기를 나누어 버려 주세요!', product: '<span class="emo">🌏</span>' };
    },
    steps: function (ctx, o) { return [{ k: 'sort', q: ctx.level === 5 ? '더러운 것은 헹구고, 알맞은 통에 넣어요' : '알맞은 통에 넣어요', items: o.items, bins: o.bins, rinse: ctx.level === 5 }]; }
  };
  var HOUSES = [{ key: 'red', label: '빨간 지붕 집', emo: '🏠', color: '#e53935' }, { key: 'blue', label: '파란 지붕 집', emo: '🏡', color: '#1e88e5' }, { key: 'school', label: '학교', emo: '🏫' }, { key: 'hospital', label: '병원', emo: '🏥' }, { key: 'mart', label: '마트', emo: '🏪' }, { key: 'post', label: '우체국', emo: '📮' }];
  S.drone = {
    camp: 'wj', hall: 'drone', name: '드론 배달', icon: '🚁', col: '#2b6cb0', bg: 'img:art/jj/scenes/drone.webp', noPay: true, customerWord: '주문',
    desc: '고리를 지나 택배를 배달해요', lessons: ['03-01-03-01', '04-01-02-02'],
    how: ['꾹 누르면 드론이 올라가요', '손을 떼면 천천히 내려와요', '고리를 지나 알맞은 곳에 배달해요'],
    order: function (ctx) { var h = pick(HOUSES); return { h: h, bubble: '<span class="emo">📦</span>➜<span class="emo">' + h.emo + '</span><b>' + h.label + '</b>', say: h.label + '에 택배를 보내 주세요!', product: '<img src="' + OKS.ROOT + J + 'drone/drone_box.webp" alt="">' }; },
    steps: function (ctx, o) { return [{ k: 'fly' }, { k: 'pick', q: '어디에 내려놓을까요? ' + o.h.label + '을 찾아요', items: HOUSES, target: o.h, zone: false }]; }
  };
  var STK = [{ key: 'star', label: '별', emo: '⭐' }, { key: 'heart', label: '하트', emo: '💖' }, { key: 'flower', label: '꽃', emo: '🌸' }, { key: 'butterfly', label: '나비', emo: '🦋' }];
  S.beauty = {
    camp: 'wj', hall: 'beauty', name: '뷰티숍', icon: '💅', col: '#d81b60', bg: 'room-beauty', price: 3000,
    desc: '요청 카드대로 꾸미고 손 마사지', lessons: ['06-01-01-01', '06-01-03-01'],
    how: ['손님의 요청 카드를 잘 봐요', '볼 스티커와 손톱 색을 골라요', '동그라미가 ✓에 오면 눌러 손 마사지!'],
    order: function (ctx) { var s = pick(STK), c = pick(COLS); return { s: s, c: c, bubble: '<span class="emo">' + s.emo + '</span><span class="swatch sm" style="background:' + c.color + '"></span>', say: '볼에 ' + s.label + ' 스티커, 손톱은 ' + c.label + '으로 해 주세요!', product: '<span class="emo">✨</span>' }; },
    steps: function (ctx, o) {
      var items = COLS.map(colItem), s = [{ k: 'pick', q: '볼에 붙일 ' + o.s.label + ' 스티커를 골라요', items: STK, target: o.s, zone: '볼', zoneIcon: '😊' }];
      if (ctx.level >= 2) s.push({ k: 'pick', q: '손톱은 ' + o.c.label + '이에요', items: items, target: items.filter(function (x) { return x.key === o.c.key; })[0], zone: '손톱', zoneIcon: '💅' });
      if (ctx.level >= 3) s.push({ k: 'timing', q: '손 마사지! ✓ 칸에 오면 눌러요', hits: LV(ctx, [1, 1, 2, 3, 3]), icon: '🤲', button: '꾹꾹', unit: '마사지', art: 'hand', artHtml: '<span class="emo">🖐️</span>' });
      return s;
    }
  };

  /* ============ 강릉분원 · 체험마을 ============ */
  var EFOOD = [
    { label: '우유', en: 'milk', img: J + 'kitchen/ing_milk.webp' }, { label: '팬케이크', en: 'pancake', img: J + 'kitchen/dish_pancake.webp' }, { label: '푸딩', en: 'pudding', img: J + 'kitchen/dish_pudding.webp' },
    { label: '수박', en: 'watermelon', img: J + 'kitchen/dish_watermelon.webp' }, { label: '달걀', en: 'egg', img: J + 'kitchen/dish_egg.webp' }, { label: '딸기', en: 'strawberry', img: F + 'strawberry_single.webp' },
    { label: '요구르트', en: 'yogurt', img: J + 'kitchen/ing_yogurt.webp' }, { label: '샐러드', en: 'salad', img: J + 'kitchen/dish_salad_mix.webp' }
  ];
  S.ecafe = {
    camp: 'gn', hall: 'village', name: '영어 스낵 바', icon: '🥞', col: '#ab47bc', bg: 'img:art/jj/scenes/cafe.webp', price: 2000,
    desc: 'Hello! 영어로 주문 받기', lessons: ['05-01-02-01', '05-01-01-01'],
    how: ['손님께 “Hello!” 인사해요', '영어 주문을 듣고 음식을 골라요', '“Here you are!” 하고 드려요'],
    greet: { text: 'Hello!', emo: '👋', wrong: 'Goodbye!', lang: 'en-US' },
    order: function (ctx) {
      var two = ctx.level >= 4, a = pick(EFOOD), b = pick(EFOOD.filter(function (x) { return x !== a; }));
      var en = two ? a.en + ' and ' + b.en + ', please.' : a.en.charAt(0).toUpperCase() + a.en.slice(1) + ', please.';
      return { a: a, b: two ? b : null, en: en, bubble: '<b class="en">🔊 ' + en + '</b>' + (ctx.level <= 2 ? pic(a) : ''), say: en, lang: 'en-US', product: pic(a) };
    },
    steps: function (ctx, o) { var t = o.b ? [o.a, o.b] : [o.a]; return [{ k: 'pick', q: '잘 듣고 골라요: ' + o.en, askOpt: { speak: '잘 듣고 골라요', replay: function () { return OKS.say(o.en, { lang: 'en-US', noRepeat: true }); } }, items: EFOOD, targets: t, n: o.b ? 4 : undefined, voice: 'en', zone: '쟁반', zoneIcon: '🍽️' }]; },
    bye: 'Here you are!'
  };

  /* 분원별 건물 → 가게 */
  var HALLS = {
    ccmain: { camp: 'cc', name: '이해·보조공학실', icon: '🏫', items: ['help', 'switch'] },
    craft: { camp: 'cc', name: '진로직업 공방', icon: '🧵', items: ['dye', 'wood', 'pack', 'bead'] },
    wjmain: { camp: 'wj', name: '진로직업체험관', icon: '🏫', items: ['farm', 'snack', 'recycle', 'drone', 'beauty'] },
    village: { camp: 'gn', name: '체험마을', icon: '🏪', items: ['ecafe'] }
  };
  Object.keys(S).forEach(function (k) { S[k].id = k; });
  window.OKS_SHOPS = S; window.OKS_HALLS = HALLS;
  window.OKS_SHOP_BY_LESSON = function (lessonId) { var L2 = window.OKS_SHOP_LINKS2 || {}; return Object.keys(S).filter(function (k) { return S[k].lessons.indexOf(lessonId) >= 0 || L2[lessonId] === k; }).map(function (k) { return S[k]; }); };
})();
