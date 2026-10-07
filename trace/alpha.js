/* 알파벳 따라 쓰기: 설정 (글자·수준·말하기). 엔진은 trace.js */
(function () {
  'use strict';
  var O = window.OKS, D = window.OKS_TRACE_ALPHA;
  function mk(ch, lower) {
    var base = ch.toUpperCase(), w = D.WORD[base];
    return { id: (lower ? 'l:' : 'u:') + ch, group: base, label: ch, cell: base + base.toLowerCase(), strokes: lower ? D.LOW[ch] : D.UP[ch],
      say: (lower ? '소문자 ' : '대문자 ') + ch + '를 따라 써요',
      word: { text: w[0], img: w[1], emoji: w[2], ko: D.KO[base] } };
  }
  var UPS = Object.keys(D.UP).map(function (c) { return mk(c, false); });
  var LOWS = Object.keys(D.LOW).map(function (c) { return mk(c, true); });
  var BOTH = []; UPS.forEach(function (u, i) { BOTH.push(u); BOTH.push(LOWS[i]); });
  function ids(all, s) { return all.filter(function (g) { return s.indexOf(g.group) >= 0 || s.indexOf(g.label) >= 0; }); }
  function some(all, n) { return O.shuffle(all).slice(0, n).sort(function (a, b) { return a.group < b.group ? -1 : 1; }); }

  /* 수준: R=허용 범위, guide: 번호(num)·점선 글자(ghost)·시범(demo)·그림 낱말 미리 보기(reveal) */
  var LEVELS = {
    1: { R: 30, guide: { num: true, ghost: true, demo: true, reveal: true }, pick: function (all) { return ids(all, 'ILTOC'.split('')); } },
    2: { R: 24, guide: { num: true, ghost: true, demo: true, reveal: true }, pick: function (all) { return some(all, 6); } },
    3: { R: 18, guide: { num: true, ghost: true, demo: false, reveal: true }, pick: function (all) { return some(all, 8); } },
    4: { R: 14, guide: { num: false, ghost: true, demo: false, reveal: false }, pick: function (all) { return some(all, 8); } },
    5: { R: 12, guide: { num: false, ghost: false, demo: false, reveal: false }, pick: function (all) { return some(all, 8); } }
  };
  var SETS = [{ id: 'up', label: 'ABC 대문자' }, { id: 'low', label: 'abc 소문자' }, { id: 'both', label: 'Aa 둘 다' }];
  function eng(g) { return { text: g.group.toLowerCase() === g.label ? g.label + '. ' + g.word.text : g.label + '. ' + g.word.text, lang: 'en-US', rate: .8 }; }

  OKS_TRACE.start({
    title: '알파벳 따라 쓰기', icon: '✏️', lessonDefault: 'mini-alpha-trace', subject: 'english', school: 'elem', topic: '알파벳 따라 쓰기', engine: 'alpha',
    back: O.ROOT + 'index.html', doneTitle: '알파벳을 잘 썼어요!',
    intro: '번호 순서대로 손가락으로 따라 써요.<br>글자를 쓰면 그림 낱말과 소리를 들을 수 있어요.',
    sets: SETS,
    glyphs: function (id) { return id === 'low' ? LOWS : id === 'both' ? BOTH : UPS; },
    levels: LEVELS,
    speak: function (g) { return eng(g); },
    speakKey: function (k) { return { text: k + '. ' + D.WORD[k][0], lang: 'en-US' }; }
  });
})();
