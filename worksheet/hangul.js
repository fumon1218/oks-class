/* 국어 기초층(한글) 학습지 — 앱의 번호 획순 데이터(trace/data-hangul.js)로 따라 쓰기 칸을 만듭니다.
   배치 두 가지: 'big' 한 글자(낱말)를 크게 + 칸 많이 / 'multi' 여러 글자를 줄마다 연습
   수준이 올라갈수록 점선·번호가 줄어요. W = { id, level, shuf, ri, glyph, layout } → 문제 목록 [{t, b}] */
window.OKS_WS_KO = (function () {
  'use strict';
  var D = window.OKS_TRACE_HANGUL;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var SETS = { '01-00-01-01': 'con', '01-00-01-02': 'vow', '01-00-01-03': 'ext', '01-00-02-01': 'syl', '01-00-02-02': 'word' };
  function has(id) { return !!SETS[id]; }

  /* 글자 목록: {k, name, parts:[획 묶음], pic?} — parts 는 칸 하나에 쓰는 글자(낱말이면 글자별) */
  function items(id) {
    var s = SETS[id], out = [];
    if (s === 'con') D.CON_ORDER.forEach(function (c) { out.push({ k: c, name: c + ' ' + D.CON_NAME[c], parts: [D.CON[c]] }); });
    else if (s === 'vow') D.VOW_ORDER.forEach(function (v) { out.push({ k: v, name: v + ' ' + D.VOW_SOUND[v], parts: [D.VOW[v]] }); });
    else if (s === 'ext') { D.DBL_ORDER.forEach(function (c) { out.push({ k: c, name: c + ' ' + D.DBL_NAME[c], parts: [D.DBL[c]] }); }); D.COMP_ORDER.forEach(function (v) { out.push({ k: v, name: v + ' ' + D.COMP_SOUND[v], parts: [D.COMP[v]] }); }); }
    else if (s === 'syl') D.SYL.forEach(function (c) { out.push({ k: c, name: c, parts: [D.syllable(c).strokes] }); });
    else D.WORDS.forEach(function (w) {
      var sy = w[0].split('').map(function (c) { return D.syllable(c); }); if (sy.some(function (x) { return !x; })) return;
      out.push({ k: w[0], name: w[0], parts: sy.map(function (x) { return x.strokes; }), pic: w[1] });
    });
    return out;
  }
  function list(id) { return has(id) ? items(id).map(function (x) { return { k: x.k, name: x.name }; }) : []; }

  function pathD(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(''); }
  /* 칸 하나: 십자 안내선 + (점선 글자·번호) + 정답지용 붉은 글자 */
  function cell(strokes, o) {
    var sz = o.sz || 88, h = '<svg class="kc" width="' + sz + '" height="' + sz + '" viewBox="-6 -6 112 112" style="flex:none;background:#fff"><rect x="0" y="0" width="100" height="100" fill="none" stroke="#b9b0a0" stroke-width="1.6"/>' +
      '<path d="M50 0V100M0 50H100" stroke="#d6cdbd" stroke-width="1" stroke-dasharray="4 4" fill="none"/>';
    if (o.sample) h += strokes.map(function (s) { return '<path d="' + pathD(s) + '" fill="none" stroke="#ee5f95" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'; }).join('');
    else if (o.alpha > 0) h += '<g opacity="' + o.alpha + '">' + strokes.map(function (s) { return '<path d="' + pathD(s) + '" fill="none" stroke="#d3d9f0" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="' + pathD(s) + '" fill="none" stroke="#4f5ab0" stroke-width="1.7" stroke-dasharray="3 3" stroke-linecap="round" stroke-linejoin="round"/>'; }).join('') + '</g>';
    if (o.nums) { var placed = []; h += strokes.map(function (s, i) {
      var x = s[0][0], y = s[0][1], k = placed.filter(function (q) { return Math.abs(q[0] - x) < 9 && Math.abs(q[1] - y) < 9; }).length;
      x += k * 9; y += k * 9; placed.push([s[0][0] + k * 9, s[0][1] + k * 9]);   /* 시작점이 겹치는 획은 번호를 살짝 비껴 놓기 */
      return '<circle cx="' + x + '" cy="' + y + '" r="6.5" fill="#e8432e"/><text x="' + x + '" y="' + (y + 3.4) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="sans-serif">' + (i + 1) + '</text>'; }).join(''); }
    if (!o.sample) h += '<g class="kg">' + strokes.map(function (s) { return '<path d="' + pathD(s) + '" fill="none" stroke="#e53935" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'; }).join('') + '</g>';
    return h + '</svg>';
  }
  /* 수준별 길잡이: i = 줄 안의 칸 번호 */
  function pat(level, i) {
    if (level <= 1) return { alpha: 1, nums: true };
    if (level === 2) return { alpha: .85, nums: i < 2 };
    if (level === 3) return { alpha: .5, nums: false };
    if (level === 4) return i < 2 ? { alpha: .4, nums: false } : { alpha: 0, nums: false };
    return { alpha: 0, nums: false };
  }
  function row(html) { return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:7px;flex-wrap:nowrap">' + html + '</div>'; }
  function picImg(it, sz) { return it.pic ? '<img src="../' + (/^(art|games)\//.test(it.pic) ? '' : 'art/') + it.pic + '" alt="" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:contain;flex:none">' : ''; }
  function samples(it, level, sz) {
    if (level >= 5) return '<div style="flex:none;min-width:' + sz + 'px;padding:0 10px;font-size:26px;text-align:center">' + esc(it.name) + '</div>';
    return it.parts.map(function (p) { return cell(p, { sample: true, nums: true, sz: sz }); }).join('');
  }
  function practice(it, level, n, sz, offset, blankAll) {
    var per = it.parts.length * Math.max(1, Math.floor(n / it.parts.length)), h = '';
    for (var i = 0; i < per; i++) { var p = blankAll ? { alpha: 0, nums: false } : pat(level, offset + i); h += cell(it.parts[i % it.parts.length], { alpha: p.alpha, nums: p.nums, sz: sz }); }
    return h;
  }
  function feelQ() {
    var f = [['기뻐요', '😊'], ['보통이에요', '😐'], ['어려워요', '😥'], ['신나요', '🤩']];
    return { t: '오늘 활동을 하고 난 내 마음에 ○ 하세요.', b: '<div class="row">' + f.map(function (x) { return '<div class="card"><span style="font-size:40px">' + x[1] + '</span><span>' + x[0] + '</span></div>'; }).join('') + '</div>' };
  }

  function make(W) {
    var id = W.id, level = W.level, all = items(id), layout = W.layout === 'multi' ? 'multi' : 'big', qs = [];
    var pick = all.filter(function (x) { return x.k === W.glyph; })[0];
    var title = level >= 5 ? '이름을 읽고 빈 칸에 써 보세요.' : level === 4 ? '점선을 보고 쓰고, 빈 칸에 이어서 쓰세요.' : '번호 순서대로 점선을 따라 쓰세요.';
    if (layout === 'big') {
      var it = pick || W.shuf(all)[0], big = it.parts.length > 2 ? 78 : 94, sm = it.parts.length > 2 ? 100 : 130;
      var r0 = row((it.pic ? picImg(it, 110) : '') + samples(it, level, it.pic ? 88 : sm) + '<span style="flex:none;width:6px"></span>' + practice(it, level, it.parts.length > 1 ? 4 : 4, big, 0));
      var rows = [r0, row(practice(it, level, 7, big, 4)), row(practice(it, level, 7, big, 4))];
      qs.push({ t: '“' + it.name + '” ' + title, b: rows.join('') });
      qs.push({ t: '혼자 써 보세요.', b: row(practice(it, level, 7, big, 0, true)) + row(practice(it, level, 7, big, 0, true)) });
    } else {
      var n = SETS[id] === 'word' ? 3 : 4, cs = it0(), list;
      function it0() { return pick ? all.indexOf(pick) : -1; }
      if (cs >= 0) { list = []; for (var k = 0; k < n; k++) list.push(all[(cs + k) % all.length]); }
      else { var ch = W.shuf(all).slice(0, n); list = all.filter(function (x) { return ch.indexOf(x) >= 0; }); }
      var sz = 82;
      qs.push({ t: title, b: list.map(function (x) { return row((x.pic ? picImg(x, 70) : '') + samples(x, level, sz) + '<span style="flex:none;width:4px"></span>' + practice(x, level, 6, sz, 0)); }).join('') });
    }
    qs.push(feelQ());
    return qs;
  }
  return { has: has, make: make, list: list };
})();
