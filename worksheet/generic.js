/* 모든 차시 학습지: 앱 활동 자료(content.js)를 종이 문제로 바꿔요.
   W = { id, level, rnd 함수들, box, trace, nMax, LESSONS } 를 받아 문제 목록을 돌려줘요. */
window.OKS_WS_GENERIC = function (W) {
  'use strict';
  var id = W.id, level = W.level, shuf = W.shuf, ri = W.ri, box = W.box, trace = W.trace, nMax = W.nMax;
  var ROOT = '../';
  var NOPT = [2, 2, 3, 3, 4][level - 1];
  function vis(o, sz) {
    sz = sz || 56;
    if (o.img) return '<img src="' + ROOT + o.img + '" alt="" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:contain">';
    if (o.svg) return '<span style="display:inline-block;width:' + sz + 'px;height:' + sz + 'px">' + o.svg.replace('<svg ', '<svg width="100%" height="100%" ') + '</span>';
    if (o.color) return '<span style="display:inline-block;width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;background:' + o.color + ';border:2px solid #2d2a26"></span>';
    if (o.emo) return '<span style="font-size:' + Math.round(sz * .78) + 'px;line-height:1">' + o.emo + '</span>';
    return '';
  }
  function hasPic(o) { return !!(o && (o.img || o.svg || o.color || o.emo)); }
  function cfgOf(lv) {
    var raw = window.OKS_CONTENT[id];
    var base = window.OKS_CUSTOM ? window.OKS_CUSTOM.apply(id, raw) : raw;
    var c = Object.assign({}, base || {});
    if (c.byLevel && c.byLevel[lv]) c = Object.assign(c, c.byLevel[lv]);
    if (lv === 5 && c.l5) c = Object.assign(c, c.l5);
    return c;
  }
  function hasData(c) { return !!(c.items || c.sets || c.seqs || c.bins || c.pads || c.things); }
  function dataCfg() {
    var c = cfgOf(level); if (hasData(c)) return c;
    for (var d = 1; d <= 4; d++) {
      if (level - d >= 1 && hasData(cfgOf(level - d))) return cfgOf(level - d);
      if (level + d <= 5 && hasData(cfgOf(level + d))) return cfgOf(level + d);
    }
    return c;
  }
  var KO = '가나다라마';
  function optCard(o, ok, showLabel, sz) {
    sz = sz || 56;
    return '<div class="card' + (ok ? ' circ' : '') + '" style="min-width:' + (sz + 16) + 'px">' + (hasPic(o) ? vis(o, sz) : '') +
      (showLabel || !hasPic(o) ? '<span style="font-size:' + (hasPic(o) ? 15 : 19) + 'px;text-align:center;max-width:160px">' + o.label + '</span>' : '') + '</div>';
  }
  /* (1) 상황 고르기 */
  function setsQ(sets, cap) {
    var n = Math.min(sets.length, cap || [2, 3, 3, 3, 3][level - 1]), list = shuf(sets).slice(0, n);
    var body = list.map(function (st, i) {
      var oks = [].concat(st.ok), opts = st.opts.map(function (o, k) { return { o: o, ok: oks.indexOf(k) >= 0 }; });
      var right = opts.filter(function (x) { return x.ok; }), wrong = shuf(opts.filter(function (x) { return !x.ok; })).slice(0, Math.max(1, NOPT - right.length));
      return '<div style="margin-bottom:10px"><div style="font-size:18px;margin-bottom:4px">(' + KO[i] + ') ' + String(st.q).replace(/\{[a-z]+\}/g, '') + '</div><div class="row">' +
        shuf(right.concat(wrong)).map(function (x) { return optCard(x.o, x.ok, true, 46); }).join('') + '</div></div>';
    }).join('');
    return { t: '알맞은 것에 ○ 하세요.', b: body };
  }
  /* (2) 이름·소리·영어를 보고 그림 찾기 */
  function findQ(c) {
    var items = c.items.filter(hasPic); if (items.length < 2) return null;
    var targets = shuf(items).slice(0, [2, 3, 3, 3, 3][level - 1]);
    var body = targets.map(function (tg, i) {
      var opts = shuf([tg].concat(shuf(items.filter(function (x) { return x !== tg; })).slice(0, NOPT - 1)));
      var cue = c.voice === 'sound' && tg.snd ? '“' + tg.snd + '”' : c.voice === 'en' && tg.en ? '<span style="font-family:Nanum Gothic;font-weight:700">' + tg.en + '</span>' : tg.label;
      return '<div class="row" style="margin-bottom:10px"><span style="font-size:19px;min-width:130px">(' + KO[i] + ') ' + cue + '</span>' + opts.map(function (o) { return optCard(o, o === tg, false, 50); }).join('') + '</div>';
    }).join('');
    var tt = c.voice === 'sound' ? '이런 소리를 내는 것을 찾아 ○ 하세요.' : c.voice === 'en' ? '영어 낱말에 알맞은 그림에 ○ 하세요.' : '낱말에 알맞은 그림에 ○ 하세요.';
    return { t: tt, b: body };
  }
  /* (3) 그림과 낱말 잇기 */
  function matchQ(items, en) {
    items = items.filter(function (x) { return hasPic(x) && x.label && (!en || x.en); }); if (items.length < 2) return null;
    var L = shuf(items).slice(0, [2, 3, 3, 4, 4][level - 1]), R = shuf(L);
    var name = function (x) { return en ? '<span style="font-family:Nanum Gothic;font-weight:700">' + x.en + '</span>' : x.label; };
    return { t: '그림과 알맞은 ' + (en ? '영어 낱말' : '낱말') + '을 선으로 이으세요.', b: '<div class="match">' + L.map(function (x, i) {
      return '<div class="l">' + vis(x, 50) + '<span class="dot"></span></div><div></div><div class="r"><span class="dot"></span><span style="font-size:21px">' + name(R[i]) + '</span></div>'; }).join('') +
      '</div><div class="ansline">답: ' + L.map(function (x) { return x.label + (en ? '–' + x.en : ''); }).join(', ') + '</div>' };
  }
  /* (4) 낱말 따라 쓰기 */
  function traceQ(items, en) {
    items = items.filter(function (x) { var w = en ? x.en : x.label; return w && w.length <= (en ? 12 : 5) && !/[()~]/.test(w); }); if (!items.length) return null;
    var L = shuf(items).slice(0, level <= 2 ? 2 : 3);
    var row = function (x) {
      var w = en ? x.en : x.label, f = en ? 'Nanum Gothic' : 'Jua', wd = w.length * (en ? 20 : 36) + 24;
      return '<div class="row" style="margin-bottom:8px">' + (hasPic(x) ? vis(x, 46) : '') + '<span style="font-size:34px;font-family:' + f + ';color:#d2ccc1;-webkit-text-stroke:1px #a69d8d;letter-spacing:.08em;min-width:' + wd + 'px">' + w + '</span>' +
        new Array(level <= 2 && !en ? 3 : 2).join('<span style="display:inline-block;width:' + wd + 'px;height:48px;border-bottom:2px dashed #b9b0a0;margin-left:10px"></span>') + '</div>';
    };
    return { t: level <= 2 ? '흐린 글자를 따라 쓰고, 옆에 한 번 더 써 보세요.' : '낱말을 따라 쓰고, 옆에 스스로 써 보세요.', b: L.map(row).join('') };
  }
  /* (5) 순서 */
  function orderQ(seqs) {
    var list = shuf(seqs).slice(0, level <= 2 ? 1 : 2), four = level > 1;
    return { t: '차례대로 □에 1, 2, 3' + (four ? ', 4' : '') + '를 쓰세요.', b: list.map(function (sq) {
      var steps = sq.steps.slice(0, four ? 4 : 3), sh = shuf(steps.map(function (x, i) { return { x: x, n: i + 1 }; }));
      return '<div style="margin-bottom:10px"><div style="font-size:18px;margin-bottom:4px">' + (sq.title || '') + '</div><div class="row">' + sh.map(function (y) {
        return '<div class="card" style="width:130px">' + (hasPic(y.x) ? vis(y.x, 56) : '') + '<span style="font-size:14px;text-align:center">' + y.x.label + '</span>' + box(y.n) + '</div>'; }).join('') + '</div></div>';
    }).join('') };
  }
  /* (6) 무리 나누기 + 세기 */
  function sortQs(c) {
    var bins = c.bins.slice(0, level <= 2 ? 2 : 3);
    var items = shuf(c.items.filter(function (x) { return bins.some(function (b) { return b.key === x.bin; }); })).slice(0, level <= 2 ? 6 : 9);
    var cnt = bins.map(function (b) { return items.filter(function (x) { return x.bin === b.key; }).length; });
    var q1 = { t: '같은 무리끼리 나누어 세어 보세요.', b: '<div class="row" style="gap:20px"><div class="row" style="max-width:340px;gap:6px">' +
      items.map(function (x) { return '<div class="card" style="padding:3px 5px">' + vis(x, 40) + '<span style="font-size:12px">' + x.label + '</span></div>'; }).join('') +
      '</div><table class="tbl"><tr>' + bins.map(function (b) { return '<th>' + (b.emo || '') + ' ' + b.label + '</th>'; }).join('') + '</tr><tr>' + cnt.map(function (n) { return '<td>' + box(n, trace) + '</td>'; }).join('') + '</tr></table></div>' };
    var two = bins.slice(0, 2), few = shuf(items.filter(function (x) { return two.some(function (b) { return b.key === x.bin; }); })).slice(0, 4);
    if (few.length < 2) return [q1];
    var right = ['', '', '', '']; two.forEach(function (b, i) { right[i * 2] = (b.emo || '') + ' ' + b.label; });
    var q2 = { t: '알맞은 무리에 선으로 이으세요.', b: '<div class="match">' + few.map(function (x, i) {
      return '<div class="l">' + vis(x, 44) + '<span>' + x.label + '</span><span class="dot"></span></div><div></div><div class="r">' + (right[i] ? '<span class="dot"></span><span style="font-size:20px">' + right[i] + '</span>' : '') + '</div>'; }).join('') +
      '</div><div class="ansline">답: ' + few.map(function (x) { return x.label + '→' + two.filter(function (b) { return b.key === x.bin; })[0].label; }).join(', ') + '</div>' };
    return [q1, q2];
  }
  /* (7) 리듬 그림 악보 */
  function rhythmQs(c) {
    var pads = c.pads.slice(0, 4), songs = c.songs || {}, song = (songs[4] || songs[3] || [0, 1, 0, 1, 0, 1, 0, 1]).slice(0, 8).map(function (k) { return k % pads.length; });
    var miss = level <= 2 ? [song.length - 1] : [3, song.length - 1];
    var q1 = { t: '리듬 그림을 보고 빈칸에 들어갈 것에 ○ 하세요.', b: '<div class="pattern">' + song.map(function (k, i) {
      return miss.indexOf(i) >= 0 ? '<div class="cell empty">?</div>' : '<div class="cell">' + vis(pads[k], 40) + '</div>'; }).join('') +
      '</div><div class="row" style="margin-top:8px">' + pads.map(function (p, k) { return optCard(p, k === song[miss[0]], true, 44); }).join('') +
      '</div><div class="ansline">답: ' + miss.map(function (i) { return pads[song[i]].label; }).join(', ') + '</div>' };
    var q2 = matchQ(pads, false);
    var q3 = { t: '나만의 리듬을 만들어 그려 보세요. (예: ' + pads.map(function (p) { return p.emo || p.label; }).join(' ') + ')', b: '<div class="pattern">' + new Array(9).join('<div class="cell empty"></div>') + '</div>' };
    return [q1, q2, q3].filter(Boolean);
  }
  /* (8) 세기 */
  function countQ(things) {
    var t = shuf(things).slice(0, level <= 2 ? 3 : 4);
    return { t: '세어 보고 몇 개인지 쓰세요.', b: '<div class="row">' + t.map(function (x) {
      var n = ri(1, nMax), s = ''; for (var i = 0; i < n; i++) s += vis(x, 34);
      return '<div class="card"><div class="pics">' + s + '</div><div>' + box(n, trace) + ' 개</div></div>'; }).join('') + '</div>' };
  }
  function drawQ(text, h) { return { t: text, b: '<div style="height:' + (h || 170) + 'px;border:1.5px dashed #bbb;border-radius:10px"></div>' }; }
  function feelQ() {
    var f = [['기뻐요', '😊'], ['보통이에요', '😐'], ['어려워요', '😥'], ['신나요', '🤩']];
    return { t: '오늘 활동을 하고 난 내 마음에 ○ 하세요.', b: '<div class="row">' + f.map(function (x) { return '<div class="card"><span style="font-size:40px">' + x[1] + '</span><span>' + x[0] + '</span></div>'; }).join('') + '</div>' };
  }
  var MIXQ = [['빨강', '#e53935', '노랑', '#fdd835', '주황', '#fb8c00'], ['노랑', '#fdd835', '파랑', '#1e88e5', '초록', '#43a047'], ['빨강', '#e53935', '파랑', '#1e88e5', '보라', '#8e24aa']];
  function mixQ() {
    var dot = function (c) { return '<span style="display:inline-block;width:40px;height:40px;border-radius:50%;background:' + c + ';border:2px solid #2d2a26;vertical-align:middle"></span>'; };
    return { t: '두 색을 섞으면 무슨 색이 될까요? 알맞은 색에 ○ 하세요.', b: MIXQ.slice(0, level <= 2 ? 2 : 3).map(function (m) {
      var opts = shuf(MIXQ.map(function (x) { return [x[4], x[5]]; }));
      return '<div class="row" style="margin-bottom:10px">' + dot(m[1]) + '<span>' + m[0] + '</span><span style="font-size:24px">+</span>' + dot(m[3]) + '<span>' + m[2] + '</span><span style="font-size:24px">=</span>' +
        opts.map(function (o) { return '<div class="card' + (o[0] === m[4] ? ' circ' : '') + '">' + dot(o[1]) + '<span>' + o[0] + '</span></div>'; }).join('') + '</div>'; }).join('') };
  }

  var L0 = W.LESSONS.filter(function (l) { return l.id === id; })[0], c = dataCfg(), eng = cfgOf(level).engine, qs = [], subj = L0.subject, en = subj === 'english';
  if (eng === 'mix' || (window.OKS_CONTENT[id] || {}).engine === 'mix') qs.push(mixQ());
  if (c.sets && c.sets.length) qs.push(setsQ(c.sets, c.items || c.seqs || c.bins ? 2 : 0));
  if (c.items && !c.bins && c.items.some(hasPic)) {
    var f = findQ(c); if (f) qs.push(f);
    var m = matchQ(c.items, en); if (m) qs.push(m);
    if (subj === 'korean' || en) { var tr = traceQ(c.items, en); if (tr) qs.push(tr); }
  }
  if (c.seqs) qs.push(orderQ(c.seqs));
  if (c.bins && c.items) qs = qs.concat(sortQs(c));
  if (c.pads) qs = qs.concat(rhythmQs(c));
  if (c.things) qs.push(countQ(c.things));
  if (/^(draw|build|portal|route)$/.test(eng)) qs.push(drawQ('「' + L0.topic + '」 ' + L0.goal + ' — 생각을 그림으로 그려 보세요.', 260));
  if (qs.length < 3) qs.push(drawQ('오늘 배운 것을 그림이나 글로 나타내 보세요.', 150));
  if (qs.length < 3) qs.push(feelQ());
  return qs.slice(0, 4);
};
