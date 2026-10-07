/* 영어 기초층 학습지 (알파벳 · 낱말 · 문장) — 4줄 공책 따라 쓰기, 그림-낱말 잇기, 빈칸·순서 문장
   W = { id, level, shuf, ri, box } → 문제 목록 [{t, b}] */
window.OKS_WS_EN = (function () {
  'use strict';
  var UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var FONT = "'Arial Rounded MT Bold','Nunito','Helvetica Neue',Arial,sans-serif";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function vis(o, sz) {
    sz = sz || 56;
    if (o.img) return '<img src="../' + o.img + '" alt="" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:contain">';
    if (o.color) return '<span style="display:inline-block;width:' + sz + 'px;height:' + sz + 'px;border-radius:12px;background:' + o.color + ';border:2px solid #2d2a26"></span>';
    if (o.emo) return '<span style="font-size:' + Math.round(sz * .78) + 'px;line-height:1">' + o.emo + '</span>';
    return '';
  }
  /* 4줄 공책 한 줄: 점선 글자(따라 쓰기) + 빈칸(혼자 쓰기) */
  function lines(items, o) {
    o = o || {};
    var H = o.h || 64, w = o.w || 640, cap = H * .5, base = H * .72, x = 14, gap = o.gap || 26, fs = cap / .72;
    var parts = '';
    items.forEach(function (it) {
      var t = it.t, est = t.length * fs * (t === t.toUpperCase() ? .68 : .56) + 6;
      if (it.trace) parts += '<text x="' + x + '" y="' + base + '" font-family="' + FONT + '" font-weight="700" font-size="' + fs.toFixed(1) + '" fill="none" stroke="#6f79ad" stroke-width="2" stroke-dasharray="4 3">' + esc(t) + '</text>';
      else if (it.ghost) parts += '<text x="' + x + '" y="' + base + '" font-family="' + FONT + '" font-weight="700" font-size="' + fs.toFixed(1) + '" fill="#e53935" class="ansonly">' + esc(t) + '</text>';
      x += (it.space || est) + gap;
    });
    var gl = '<line x1="4" x2="' + (w - 4) + '" y1="' + (base - cap) + '" y2="' + (base - cap) + '" stroke="#e7a3a3" stroke-width="1"/>' +
      '<line x1="4" x2="' + (w - 4) + '" y1="' + (base - cap * .52) + '" y2="' + (base - cap * .52) + '" stroke="#9fb0e6" stroke-width="1" stroke-dasharray="5 4"/>' +
      '<line x1="4" x2="' + (w - 4) + '" y1="' + base + '" y2="' + base + '" stroke="#e7a3a3" stroke-width="1.4"/>' +
      '<line x1="4" x2="' + (w - 4) + '" y1="' + (base + cap * .38) + '" y2="' + (base + cap * .38) + '" stroke="#d9d9d9" stroke-width="1"/>';
    return '<svg class="en4" viewBox="0 0 ' + w + ' ' + H + '" width="100%" style="max-width:' + w + 'px;display:block;margin:2px 0">' + gl + parts + '</svg>';
  }
  /* 동물 친구 탭이 붙은 따라 쓰기 카드 (컬러 테마에서만 보임) */
  var MASC = ['rabbit', 'panda', 'cat', 'monkey', 'koala', 'bear', 'dog', 'tiger', 'penguin'], mc = 0;
  function tcard(inner, label) {
    var n = mc++, m = MASC[n % MASC.length];
    return '<div class="tcard tc' + (n % 5) + '"><div class="ttab"><img class="deco" src="../art/ws/mascot_' + m + '.webp" alt=""><b>' + esc(label || '따라 써요') + '</b></div>' + inner + '</div>';
  }
  /* 따라 쓰기 줄: 점선 n번 + 빈칸 m번 */
  function traceRow(t, nT, nB) { var a = []; for (var i = 0; i < nT; i++) a.push({ t: t, trace: true }); for (var j = 0; j < nB; j++) a.push({ t: t, space: t.length * 34 + 10 }); return tcard(lines(a), t.length > 14 ? '따라 써요' : t); }
  function fill(a, w) { return '<span class="fillans" data-a="' + esc(a) + '" style="display:inline-block;min-width:' + (w || 90) + 'px;border-bottom:2px solid #3d3a35;text-align:center;font-size:22px">&nbsp;</span>'; }
  function choices(opts, ok) { return '<span class="row" style="display:inline-flex;gap:8px">' + opts.map(function (v) { return '<span class="card' + (v === ok ? ' circ' : '') + '" style="font-size:22px;padding:4px 12px;font-family:' + FONT + ';font-weight:700">' + esc(v) + '</span>'; }).join('') + '</span>'; }
  function match(L, R, ansText) {
    return '<div class="match">' + L.map(function (l, i) { return '<div class="l">' + l + '<span class="dot"></span></div><div></div><div class="r"><span class="dot"></span>' + R[i] + '</div>'; }).join('') + '</div><div class="ansline">답: ' + ansText + '</div>';
  }
  function bigL(t) { return '<span style="font-family:' + FONT + ';font-weight:700;font-size:30px">' + esc(t) + '</span>'; }

  function make(W) {
    mc = 0; var id = W.id, lv = W.level, shuf = W.shuf, C = window.OKS_CONTENT[id] || {}, B = window.OKS_EN_BASICS, qs = [];
    var k = [3, 4, 5, 6, 6][lv - 1];
    /* ---------- 알파벳 ---------- */
    if (id === '05-00-01-01') {
      var ls = shuf(UP).slice(0, lv <= 2 ? 4 : 6);
      qs.push({ t: '선생님이 읽어 주는 알파벳에 ○ 하세요.', b: ls.map(function (t, i) { var o = shuf([t].concat(shuf(UP.filter(function (x) { return x !== t; })).slice(0, lv <= 2 ? 1 : 2))); return '<div class="row" style="margin-bottom:6px"><span style="min-width:30px">(' + (i + 1) + ')</span>' + choices(lv >= 5 ? o.map(function (x) { return x.toLowerCase(); }) : o, lv >= 5 ? t.toLowerCase() : t) + '</div>'; }).join('') + '<div class="ansline">읽어 줄 글자: ' + ls.join(', ') + '</div>' });
      var st = W.ri(0, 20), seq = UP.slice(st, st + 6), miss = shuf([1, 2, 3, 4]).slice(0, lv <= 2 ? 1 : 2);
      qs.push({ t: '빈칸에 들어갈 알파벳을 쓰세요.', b: '<div class="row">' + seq.map(function (x, i) { return miss.indexOf(i) >= 0 ? W.box(x, lv <= 2) : '<span class="box" style="border-color:transparent">' + x + '</span>'; }).join('') + '</div>' });
      var m = shuf(UP).slice(0, 4), rr = shuf(m.slice());
      qs.push({ t: '같은 알파벳의 대문자와 소문자를 이으세요.', b: match(m.map(bigL), rr.map(function (x) { return bigL(x.toLowerCase()); }), m.map(function (x) { return x + '–' + x.toLowerCase(); }).join(', ')) });
      return qs;
    }
    if (id === '05-00-01-02' || id === '05-00-01-03') {
      var low = id === '05-00-01-03', st2 = W.ri(0, 26 - k), L2 = UP.slice(st2, st2 + k).map(function (x) { return low ? x.toLowerCase() : x; });
      var nT = [4, 3, 2, 2, 1][lv - 1], nB = [2, 2, 3, 3, 4][lv - 1];
      qs.push({ t: (low ? '소문자' : '대문자') + '를 점선을 따라 쓰고, 빈칸에 혼자 써 보세요.', b: L2.map(function (x) { return traceRow(x, nT, nB); }).join('') });
      var seq2 = UP.slice(st2, st2 + Math.min(8, k + 2)).map(function (x) { return low ? x.toLowerCase() : x; }), miss2 = shuf(seq2.map(function (x, i) { return i; }).slice(1)).slice(0, lv <= 2 ? 2 : 3);
      qs.push({ t: '순서대로 빈칸에 알맞은 ' + (low ? '소문자' : '대문자') + '를 쓰세요.', b: '<div class="row">' + seq2.map(function (x, i) { return miss2.indexOf(i) >= 0 ? W.box(x, lv <= 2) : '<span class="box" style="border-color:transparent">' + x + '</span>'; }).join('') + '</div>' });
      { var pr = shuf(UP).slice(0, lv <= 2 ? 4 : 5); qs.push({ t: (low ? '대문자를 보고 소문자를' : '소문자를 보고 대문자를') + ' 쓰세요.', b: '<div class="row" style="gap:18px">' + pr.map(function (x) { var a = low ? x : x.toLowerCase(), b = low ? x.toLowerCase() : x; return '<span style="display:inline-flex;align-items:center;gap:6px">' + bigL(a) + ' → ' + W.box(b, lv <= 2) + '</span>'; }).join('') + '</div>' }); }
      return qs;
    }
    if (id === '05-00-01-04') {
      var m4 = shuf(UP).slice(0, [4, 4, 5, 5, 6][lv - 1]);
      qs.push({ t: '대문자와 소문자 짝을 이으세요.', b: match(m4.map(bigL), shuf(m4.slice()).map(function (x) { return bigL(x.toLowerCase()); }), m4.map(function (x) { return x + '–' + x.toLowerCase(); }).join(', ')) });
      var m5 = shuf(UP).slice(0, 5);
      qs.push({ t: '짝이 되는 글자를 빈칸에 쓰세요.', b: '<div class="row" style="gap:18px">' + m5.map(function (x, i) { var up = i % 2 === 0; return '<span style="display:inline-flex;align-items:center;gap:6px">' + bigL(up ? x : x.toLowerCase()) + ' – ' + W.box(up ? x.toLowerCase() : x, lv <= 2) + '</span>'; }).join('') + '</div>' });
      var m6 = shuf(UP).slice(0, 3);
      qs.push({ t: '대문자와 소문자를 점선을 따라 쓰고 한 번 더 쓰세요.', b: m6.map(function (x) { return traceRow(x + ' ' + x.toLowerCase(), lv <= 2 ? 2 : 1, 1); }).join('') });
      return qs;
    }
    if (id === '05-00-01-05') {
      var A = B.ABC, pk = shuf(A).slice(0, lv <= 2 ? 3 : 4);
      qs.push({ t: '그림 이름의 첫 글자에 ○ 하세요.', b: '<div class="row" style="gap:16px">' + pk.map(function (w) { var ch = w.en[0].toUpperCase(), o = shuf([ch].concat(shuf(UP.filter(function (x) { return x !== ch; })).slice(0, 2))); return '<div class="card">' + vis(w, 60) + (lv <= 2 ? '<span style="font-size:14px">' + w.en + '</span>' : '') + choices(o, ch) + '</div>'; }).join('') + '</div>' });
      var t5 = shuf(A).slice(0, 3);
      qs.push({ t: '글자와 같은 소리로 시작하는 그림을 이으세요.', b: match(t5.map(function (w) { return bigL(w.en[0].toUpperCase() + ' ' + w.en[0]); }), shuf(t5.slice()).map(function (w) { return vis(w, 50); }), t5.map(function (w) { return w.en[0].toUpperCase() + '–' + w.en; }).join(', ')) });
      { var t6 = shuf(A).slice(0, lv <= 2 ? 3 : 4); qs.push({ t: '그림을 보고 첫 글자를 쓰세요.', b: '<div class="row" style="gap:18px">' + t6.map(function (w) { return '<span style="display:inline-flex;align-items:center;gap:6px">' + vis(w, 50) + W.box(w.en[0], lv <= 2) + '<span style="font-size:22px">' + w.en.slice(1) + '</span></span>'; }).join('') + '</div>' }); }
      return qs;
    }
    if (id === '05-00-01-06') {
      var ls6 = shuf(UP).slice(0, k), low6 = lv >= 5;
      qs.push({ t: '선생님이 읽어 주는 알파벳을 4줄 칸에 쓰세요.', b: lines(ls6.map(function (x, i) { return { t: low6 ? x.toLowerCase() : x, ghost: true, space: 40 }; }), { gap: 40 }) + '<div class="ansline">읽어 줄 글자: ' + ls6.map(function (x) { return low6 ? x.toLowerCase() : x; }).join(', ') + '</div>' });
      var ls7 = shuf(UP).slice(0, 4);
      qs.push({ t: '점선을 따라 쓰고 빈칸에 한 번 더 쓰세요.', b: ls7.map(function (x) { return traceRow(x + ' ' + x.toLowerCase(), 1, 2); }).join('') });
      var ls8 = shuf(UP).slice(0, 4);
      qs.push({ t: '선생님이 읽어 주는 알파벳에 ○ 하세요.', b: ls8.map(function (t, i) { var o = shuf([t].concat(shuf(UP.filter(function (x) { return x !== t; })).slice(0, lv <= 2 ? 2 : 3))); return '<div class="row" style="margin-bottom:6px"><span style="min-width:30px">(' + (i + 1) + ')</span>' + choices(o, t) + '</div>'; }).join('') + '<div class="ansline">읽어 줄 글자: ' + ls8.join(', ') + '</div>' });
      return qs;
    }
    if (id === '05-00-01-07') {
      var lw = lv >= 5, Fx = function (x) { return lw ? x.toLowerCase() : x; };
      var rowSeq = function (n, nm) { var a = W.ri(0, 26 - n), q = UP.slice(a, a + n), ms = shuf(q.map(function (x, i) { return i; }).slice(1, n - 1)).slice(0, nm);
        return '<div class="row" style="margin-bottom:8px">' + q.map(function (x, i) { return ms.indexOf(i) >= 0 ? W.box(Fx(x), lv <= 2) : '<span class="box" style="border-color:transparent">' + Fx(x) + '</span>'; }).join('') + '</div>'; };
      qs.push({ t: '알파벳 순서대로 빈칸에 알맞은 글자를 쓰세요.', b: [0, 1, 2, 3].map(function () { return rowSeq(lv <= 2 ? 5 : 7, lv <= 2 ? 1 : 2); }).join('') });
      var nx = shuf(UP.slice(0, 24)).slice(0, 5);
      qs.push({ t: '다음에 오는 알파벳을 쓰세요.', b: '<div class="row" style="gap:20px">' + nx.map(function (x) { return '<span style="display:inline-flex;align-items:center;gap:6px">' + bigL(Fx(x)) + ' → ' + W.box(Fx(UP[UP.indexOf(x) + 1])) + '</span>'; }).join('') + '</div>' });
      var ch = [], ans = [];
      for (var j = 0; j < 4; j++) { var a2 = W.ri(0, 21), c5 = UP.slice(a2, a2 + 5), sh; do { sh = shuf(c5.slice()); } while (sh.join('') === c5.join(''));
        ans.push(c5.map(Fx).join(' ')); ch.push('<div class="row" style="margin-bottom:8px"><span style="min-width:190px;font-family:' + FONT + ';font-weight:700;font-size:26px">' + sh.map(Fx).join(' · ') + '</span> → ' + c5.map(function () { return W.box(''); }).join('') + '</div>'); }
      qs.push({ t: '섞인 알파벳을 순서대로 다시 쓰세요.', b: ch.join('') + '<div class="ansline">답: ' + ans.join(' / ') + '</div>' });
      return qs;
    }
    /* ---------- 낱말 ---------- */
    if (C.kind === 'words') {
      var items = shuf(C.items).slice(0, lv >= 4 ? 3 : 4);
      qs.push({ t: '그림과 알맞은 영어 낱말을 이으세요.', b: match(items.map(function (w) { return vis(w, 56); }), shuf(items.slice()).map(function (w) { return '<span style="font-size:24px;font-family:' + FONT + ';font-weight:700">' + esc(w.en) + '</span>'; }), items.map(function (w) { return w.label + '–' + w.en; }).join(', ')) });
      var tr = shuf(C.items).slice(0, lv >= 4 ? 2 : 3);
      qs.push({ t: '낱말을 따라 쓰고 빈칸에 혼자 써 보세요.', b: tr.map(function (w) { return '<div class="row" style="flex-wrap:nowrap;gap:8px">' + vis(w, 48) + '<div style="flex:1">' + traceRow(w.en, lv <= 2 ? 2 : 1, lv <= 2 ? 1 : 2) + '</div></div>'; }).join('') });
      if (lv <= 2) {
        var hp = shuf(C.items).slice(0, 3);
        qs.push({ t: '선생님이 읽어 주는 낱말과 같은 그림에 ○ 하세요.', b: hp.map(function (w, i) { var opts = shuf([w].concat(shuf(C.items.filter(function (x) { return x !== w; })).slice(0, 2)));
          return '<div class="row" style="margin-bottom:6px;gap:14px"><span style="min-width:30px">(' + (i + 1) + ')</span>' + opts.map(function (o) { return '<span class="card' + (o === w ? ' circ' : '') + '" style="padding:4px 10px">' + vis(o, 54) + '</span>'; }).join('') + '</div>'; }).join('') + '<div class="ansline">읽어 줄 낱말: ' + hp.map(function (w) { return w.en; }).join(', ') + '</div>' });
      }
      if (lv >= 3) {
        var ms = shuf(C.items).slice(0, 4);
        qs.push({ t: lv >= 5 ? '그림을 보고 영어 낱말을 쓰세요.' : '빠진 글자를 채워 낱말을 완성하세요.', b: '<div class="row" style="gap:20px">' + ms.map(function (w) {
          if (lv >= 5) return '<span style="display:inline-flex;align-items:center;gap:8px">' + vis(w, 50) + fill(w.en, 110) + '</span>';
          var i2 = W.ri(1, Math.max(1, w.en.length - 1)); return '<span style="display:inline-flex;align-items:center;gap:6px">' + vis(w, 46) + '<span style="font-size:24px;font-family:' + FONT + ';font-weight:700">' + esc(w.en.slice(0, i2)) + '</span>' + W.box(w.en[i2], false) + '<span style="font-size:24px;font-family:' + FONT + ';font-weight:700">' + esc(w.en.slice(i2 + 1)) + '</span></span>';
        }).join('') + '</div>' });
      }
      if (lv >= 4) {
        var sc = shuf(C.items).slice(0, 3);
        qs.push({ t: '글자의 순서를 바로잡아 낱말을 쓰세요.', b: '<div class="row" style="gap:24px">' + sc.map(function (w) { var s2 = w.en.split(''), t2; do { t2 = shuf(s2.slice()).join(''); } while (t2 === w.en && w.en.length > 1); return '<span style="display:inline-flex;align-items:center;gap:8px">' + vis(w, 40) + '<b style="font-weight:400;font-size:20px;letter-spacing:.15em">' + esc(t2) + '</b> → ' + fill(w.en, 100) + '</span>'; }).join('') + '</div>' });
      }
      return qs;
    }
    /* ---------- 문장 ---------- */
    if (C.kind === 'sentences') {
      var S = shuf(C.sets).slice(0, lv >= 4 ? 3 : 4), bank = shuf(S.map(function (s) { return s.en.split(' ')[s.blank].replace(/[.!?,]/g, ''); }));
      qs.push({ t: '그림을 보고 빈칸에 알맞은 낱말을 〈보기〉에서 골라 쓰세요.', b: '<div style="margin-bottom:8px;font-size:18px">〈보기〉 ' + bank.map(function (w) { return '<span class="card" style="display:inline-block;padding:2px 10px;font-family:' + FONT + ';font-weight:700">' + esc(w) + '</span>'; }).join(' ') + '</div>' +
        S.map(function (s) { var ws = s.en.split(' '), a = ws[s.blank].replace(/[.!?,]/g, ''), tail = ws[s.blank].replace(a, ''); return '<div class="row" style="margin-bottom:6px">' + vis(s, 48) + '<span style="font-size:24px;font-family:' + FONT + ';font-weight:700">' + ws.map(function (w, i) { return i === s.blank ? fill(a, 100) + esc(tail) : esc(w); }).join(' ') + '</span></div>'; }).join('') });
      var t3 = shuf(C.sets).slice(0, lv >= 4 ? 2 : 3);
      qs.push({ t: '문장을 따라 쓰세요.', b: t3.map(function (s) { return tcard(lines([{ t: s.en, trace: true }], { h: 60, w: 700 }) + (lv >= 2 ? lines([{ t: s.en, space: 600 }], { h: 60, w: 700 }) : ''), '문장 쓰기'); }).join('') });
      if (lv >= 4) {
        var o3 = shuf(C.sets).slice(0, 2);
        qs.push({ t: '낱말의 순서를 바로잡아 문장을 쓰세요.', b: o3.map(function (s) { var ws2 = s.en.split(' '), sh; do { sh = shuf(ws2.slice()); } while (sh.join(' ') === s.en); return '<div style="margin-bottom:8px"><div class="row">' + vis(s, 40) + sh.map(function (w) { return '<span class="card" style="padding:2px 10px;font-size:20px;font-family:' + FONT + ';font-weight:700">' + esc(w) + '</span>'; }).join('') + '</div>' + lines([{ t: s.en, ghost: true, space: 600 }], { h: 56, w: 700 }) + '</div>'; }).join('') });
      }
      return qs;
    }
    return null;
  }
  return { has: function (id) { return /^05-00-/.test(id); }, make: make };
})();
