/* 한글 따라 쓰기: 설정. 엔진은 trace.js */
(function () {
  'use strict';
  var O = window.OKS, D = window.OKS_TRACE_HANGUL;
  var CONS = D.CON_ORDER.map(function (c) { return { id: 'c:' + c, group: c, label: c, strokes: D.CON[c], say: c + ' ' + D.CON_NAME[c] + '을 따라 써요', sp: D.CON_NAME[c] }; });
  var VOWS = D.VOW_ORDER.map(function (v) { return { id: 'v:' + v, group: v, label: v, strokes: D.VOW[v], say: v + ' ' + D.VOW_SOUND[v] + ' 소리를 따라 써요', sp: D.VOW_SOUND[v] }; });
  var SYLS = D.SYL.map(function (s) { var g = D.syllable(s); return { id: 's:' + s, group: s, label: s, strokes: g.strokes, sw: 7, nr: 6, rScale: .7, say: s + ' 글자를 따라 써요', sp: s }; });
  /* 낱말: 글자(음절)마다 한 판. 같은 낱말의 글자는 group 이 같아서 함께 뽑혀요 */
  var WORDS = [];
  D.WORDS.forEach(function (w) {
    var list = w[0].split('').map(function (ch) { return D.syllable(ch); });
    if (list.some(function (x) { return !x; })) return;
    w[0].split('').forEach(function (ch, i) {
      WORDS.push({ id: 'w:' + w[0] + ':' + i, group: w[0], label: ch, cell: w[0], strokes: list[i].strokes, sw: 7, nr: 6, rScale: .7, picAlways: true,
        say: w[0] + '의 ' + (i + 1) + '번째 글자 ' + ch + '를 따라 써요', sp: ch, word: { text: w[0], img: w[1], emoji: '' } });
    });
  });
  function groups(all) { var o = [], seen = {}; all.forEach(function (g) { if (!seen[g.group]) { seen[g.group] = 1; o.push(g.group); } }); return o; }
  function byGroups(all, gs) { return all.filter(function (g) { return gs.indexOf(g.group) >= 0; }); }
  function some(all, n) { var gs = O.shuffle(groups(all)).slice(0, n); return byGroups(all, groups(all).filter(function (x) { return gs.indexOf(x) >= 0; })); }
  var cur = 'con';
  var EASY = { con: ['ㄱ', 'ㄴ', 'ㅇ', 'ㅁ', 'ㅅ'], vow: ['ㅏ', 'ㅣ', 'ㅗ', 'ㅜ', 'ㅡ'], syl: ['가', '나', '아', '다', '마'], word: ['소', '코', '눈'] };
  function setOf(all) { return all.length && all[0].id.charAt(0) === 'c' ? 'con' : all[0].id.charAt(0) === 'v' ? 'vow' : all[0].id.charAt(0) === 's' ? 'syl' : 'word'; }
  var N = { con: [0, 6, 8, 10, 14], vow: [0, 6, 8, 10, 10], syl: [0, 6, 8, 10, 14], word: [0, 2, 3, 3, 4] };
  function mkPick(lv) {
    return function (all) {
      var k = setOf(all);
      if (lv === 1) return byGroups(all, EASY[k]);
      var n = N[k][lv - 1]; return some(all, n);
    };
  }
  var G = [
    { R: 30, guide: { num: true, ghost: true, demo: true, reveal: true } },
    { R: 24, guide: { num: true, ghost: true, demo: true, reveal: true } },
    { R: 18, guide: { num: true, ghost: true, demo: false, reveal: true } },
    { R: 14, guide: { num: false, ghost: true, demo: false, reveal: false } },
    { R: 12, guide: { num: false, ghost: false, demo: false, reveal: false } }
  ];
  var LEVELS = {}; G.forEach(function (g, i) { LEVELS[i + 1] = { R: g.R, guide: g.guide, pick: mkPick(i + 1) }; });
  var SETS = [{ id: 'con', label: 'ㄱㄴㄷ 자음' }, { id: 'vow', label: 'ㅏㅑㅓ 모음' }, { id: 'syl', label: '가나다 글자' }, { id: 'word', label: '그림 낱말' }];

  OKS_TRACE.start({
    title: '한글 따라 쓰기', icon: '✏️', lessonDefault: 'mini-hangul-trace', subject: 'korean', school: 'elem', topic: '한글 따라 쓰기', engine: 'hangul',
    back: O.ROOT + 'index.html', doneTitle: '한글을 잘 썼어요!', cross: true, vb: { x: -12, y: -12, w: 124, h: 124 },
    intro: '번호 순서대로 손가락으로 따라 써요.<br>글자를 쓰면 소리와 그림을 만나요.',
    sets: SETS,
    glyphs: function (id) { return id === 'vow' ? VOWS : id === 'syl' ? SYLS : id === 'word' ? WORDS : CONS; },
    levels: LEVELS,
    speak: function (g) { return { text: g.sp, lang: 'ko-KR', rate: .85 }; },
    speakKey: function (k) { var g = CONS.concat(VOWS, SYLS).filter(function (x) { return x.label === k; })[0]; return { text: g ? g.sp : k, lang: 'ko-KR' }; }
  });
})();
