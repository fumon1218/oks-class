/* 수학 · 시계와 시간 학습지 (시 → 분 → 초 → 시간의 길이)
   id 형식: clk-<단계 1~7>   예) clk-4
   기본 교육과정 시간 영역([6수학03-03] 몇 시·몇 시 30분, [9수학03-03] 1시간=60분)에 맞춘 자체 구성이에요.
   시계는 SVG 로 그려서 시각이 매번 바뀌어요. 정답 표시는 .ansonly 를 써서 정답지에만 보여요. */
window.OKS_WS_CLOCK = (function () {
  'use strict';
  var STAGES = [
    ['시계 살펴보기', '짧은바늘과 긴바늘, 시계의 숫자를 알아본다'],
    ['몇 시 (정각)', '짧은바늘이 가리키는 숫자로 ‘몇 시’를 읽고 나타낸다'],
    ['몇 시 30분', '긴바늘이 6일 때를 ‘몇 시 30분’으로 읽고 나타낸다'],
    ['몇 시 몇 분', '5분 단위로 시계를 읽고, 1시간은 60분임을 안다'],
    ['몇 분 전', '‘몇 시 몇 분 전’과 ‘몇 분이 남았는지’를 말한다'],
    ['초', '1분은 60초임을 알고 초침을 읽는다'],
    ['시간의 길이', '시작과 끝 시각으로 걸린 시간을 구하고 하루·일주일·1년을 안다'],
    ['오전 · 오후 · 하루', '오전과 오후를 가르고 하루는 24시간임을 안다'],
    ['하루 일과 순서', '시각을 보고 하루 일과를 먼저 한 것부터 차례로 말한다'],
    ['시간표 읽기', '시간표에서 시각과 하는 일을 찾아 읽는다'],
    ['1분 체험과 시간 어림', '10초·1분·1시간의 길이를 느끼고, 시간과 돈을 이어 생각한다']
  ];
  /* 배움 근거(2022 개정 특수교육 기본 교육과정 수학 ‘시간’ 영역) — tier: 핵심 = 성취기준 안, 심화 = 자체 구성(성취기준 밖) */
  var META = [
    null,
    { basis: '[6수학03-03] 시계의 공통 구성 요소(시침·분침·숫자)를 탐색', tier: '핵심' },
    { basis: '[6수학03-03] 시각을 ‘몇 시’로 나타낸다', tier: '핵심' },
    { basis: '[6수학03-03] 시각을 ‘몇 시 30분’으로 나타낸다', tier: '핵심' },
    { basis: '[9수학03-03] 1시간은 60분임을 알고 시간을 ‘몇 분’으로 나타낸다', tier: '핵심' },
    { basis: '[9수학03-03]을 넓힌 ‘몇 분 전·후’ (기본 교육과정에는 없는 자체 구성)', tier: '심화' },
    { basis: '교육과정에는 분·시간까지만 있어요 · 초는 자체 구성', tier: '심화' },
    { basis: '[9수학03-03] 시작·끝 시각을 비교해 걸린 시간을 안다 · [6수학03-04] 1일·1주일', tier: '핵심' },
    { basis: '[6수학03-04] 1일은 하루 동안의 시간 · 오전/오후는 자체 구성', tier: '핵심+심화' },
    { basis: '[6수학03-03] 일상생활과 관련된 시각 · [6수학03-04] 하루의 활동', tier: '핵심' },
    { basis: '[6수학03-04] 일정표 읽기(주간 일정표를 하루 시간표로 바꾼 자체 구성)', tier: '핵심+심화' },
    { basis: '[9수학03-03] 5·10·30분 단위의 짧은 시간을 놀이로 경험 · 시간과 돈 연결은 자체 구성', tier: '핵심+심화' }
  ];
  var LVNOTE = ['따라 쓰기 · 보기 2개 (도움이 가장 많아요)', '따라 쓰기 · 보기 2개', '스스로 쓰기 · 보기 3개', '스스로 쓰기 · 보기 3개 · 문항 늘어남', '스스로 쓰기 · 보기 4개 · 도전(★) 문제'];
  /* 게임 차시(02-00-단원-차시)는 같은 순서의 학습지 단계와 이어요 */
  var ALIAS = { '02-00-01-01': 1, '02-00-01-02': 2, '02-00-01-03': 3, '02-00-01-04': 4, '02-00-01-05': 5, '02-00-02-01': 6, '02-00-02-02': 7, '02-00-02-03': 8, '02-00-03-01': 9, '02-00-03-02': 10, '02-00-03-03': 11 };
  function parse(id) { if (ALIAS[id]) return ALIAS[id]; var m = /^clk-([1-9]|1[01])$/.exec(id || ''); return m ? +m[1] : 0; }
  function meta(id, level) { var st = parse(id); if (!st) return null; var m = META[st]; return { goal: STAGES[st - 1][1], basis: m.basis, tier: m.tier, level: LVNOTE[(level || 3) - 1] }; }
  function has(id) { return !!parse(id); }
  function lessons() {
    return STAGES.map(function (s, i) {
      return { id: 'clk-' + (i + 1), subject: 'math', subjectName: '수학', schoolName: '시계와 시간', unitNo: '', unit: '시계와 시간', no: i + 1, topic: s[0], goal: s[1], special: true, sub: '수학 · 시계와 시간 · ' + (i + 1) + '단계' };
    });
  }

  /* ---------- 시계 그림 ---------- */
  var RED = '#e53935', BLUE = '#1e88e5', GRN = '#2e9d4f';
  function pt(deg, r) { var a = (deg - 90) * Math.PI / 180; return [60 + r * Math.cos(a), 60 + r * Math.sin(a)]; }
  function hand(deg, len, w, col, cls, tail) {
    var p = pt(deg, len), t = tail ? pt(deg + 180, tail) : [60, 60];
    return '<line class="' + (cls || '') + '" x1="' + t[0].toFixed(1) + '" y1="' + t[1].toFixed(1) + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }
  /* o: h, m, s(초침), noHour/noMin(손 감춤), ansH/ansM(정답지에만 그려 보이는 바늘), blankNums(숨길 숫자), mins(분 숫자), size, sec(초 시계) */
  function clock(o) {
    o = o || {}; var sz = o.size || 118, s = '<svg viewBox="0 0 120 120" width="' + sz + '" height="' + sz + '" style="flex:none"' + (o.h != null && o.m != null ? ' data-t="' + o.h + ':' + o.m + '"' : '') + '>';
    s += '<circle cx="60" cy="60" r="57" fill="#fffdf8" stroke="' + (o.rim || '#d9728a') + '" stroke-width="5"/>';
    for (var i = 0; i < 60; i++) { var a = pt(i * 6, 52), b = pt(i * 6, i % 5 ? 49.5 : 46); s += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="#2d2a26" stroke-width="' + (i % 5 ? .6 : 1.4) + '"/>'; }
    for (var n = 1; n <= 12; n++) {
      var p = pt(n * 30, o.mins ? 33 : 37), hide = o.blankNums && o.blankNums.indexOf(n) >= 0;
      if (hide) s += '<rect x="' + (p[0] - 7) + '" y="' + (p[1] - 7) + '" width="14" height="14" rx="3" fill="#fff" stroke="#9fb8cc" stroke-dasharray="2 2"/><text class="ansonly" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4.5).toFixed(1) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + RED + '" font-family="Jua,sans-serif">' + n + '</text>';
      else s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4.5).toFixed(1) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#2d2a26" font-family="Jua,sans-serif">' + n + '</text>';
      if (o.mins) { var q = pt(n * 30, 22); s += '<text x="' + q[0].toFixed(1) + '" y="' + (q[1] + 2.6).toFixed(1) + '" text-anchor="middle" font-size="7.5" font-weight="700" fill="' + BLUE + '" font-family="Jua,sans-serif">' + (n * 5) + '</text>'; }
    }
    if (o.ansM != null) s += hand(o.ansM * 6, 42, 3, RED, 'ansonly');
    if (o.ansH != null) s += hand(o.ansH % 12 * 30 + (o.ansM || 0) * .5, 27, 5.5, RED, 'ansonly');
    if (!o.noMin && o.m != null) s += hand(o.m * 6, 42, 3, BLUE);
    if (!o.noHour && o.h != null) s += hand((o.h % 12) * 30 + (o.m || 0) * .5, 27, 5.5, RED);
    if (o.s != null) s += hand(o.s * 6, 46, 1.6, GRN, '', 9);
    return s + '<circle cx="60" cy="60" r="3.4" fill="#f4b73f" stroke="#2d2a26" stroke-width=".8"/></svg>';
  }
  function dial(sec) { /* 초 시계: 숫자는 5초 단위 */
    var s = '<svg viewBox="0 0 120 120" width="124" height="124"><circle cx="60" cy="60" r="57" fill="#fffdf8" stroke="' + GRN + '" stroke-width="5"/>';
    for (var i = 0; i < 60; i++) { var a = pt(i * 6, 52), b = pt(i * 6, i % 5 ? 49.5 : 46); s += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="#2d2a26" stroke-width="' + (i % 5 ? .6 : 1.4) + '"/>'; }
    for (var n = 1; n <= 12; n++) { var p = pt(n * 30, 36); s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + GRN + '" font-family="Jua,sans-serif">' + (n * 5) + '</text>'; }
    if (sec != null) s += hand(sec * 6, 46, 2, GRN, '', 10);
    return s + '<circle cx="60" cy="60" r="3.4" fill="#f4b73f" stroke="#2d2a26" stroke-width=".8"/></svg>';
  }

  /* ---------- 공통 도구 ---------- */
  function make(W) {
    var level = W.level, shuf = W.shuf, ri = W.ri, box = W.box, trace = level <= 2, stage = parse(W.id), qs = [];
    var NOPT = [2, 2, 3, 3, 4][level - 1];
    function pickOne(a) { return a[ri(0, a.length - 1)]; }
    function hint() { return level <= 2; }
    function cho(list, ans) { return '<div class="choices" style="justify-content:flex-start">' + list.map(function (v) { return '<span class="' + (v === ans ? 'circ' : '') + '" style="width:auto;min-width:46px;padding:0 10px;white-space:nowrap">' + v + '</span>'; }).join('') + '</div>'; }
    function pair(h, m) { return box(h, trace) + ' 시 ' + (m === undefined ? '' : box(m, trace) + ' 분'); }
    function fr(items) { return '<div style="display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end">' + items.join('') + '</div>'; }
    function cell(inner) { return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:130px">' + inner + '</div>'; }
    function label(t) { return '<span style="font-size:19px">' + t + '</span>'; }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function other(list, ans, n) { var o = shuf(list.filter(function (x) { return x !== ans; })).slice(0, n - 1).concat(ans); return shuf(o); }
    function hr() { return ri(1, 12); }
    function uniq(n, gen) { var out = [], k = 0; while (out.length < n && k++ < 60) { var v = gen(); if (!out.some(function (x) { return x.h === v.h && x.m === v.m; })) out.push(v); } return out; }
    /* 단계별로 쓸 수 있는 분 */
    var MIN = { 1: [0], 2: [0], 3: [30], 4: level <= 2 ? [15, 30, 45] : level === 3 ? [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] : [5, 10, 15, 20, 25, 35, 40, 45, 50, 55], 5: [45, 50, 55] };
    var t2 = { 2: [0], 3: level >= 4 ? [0, 30] : [30] };
    function tm(st) { var ms = st === 2 ? [0] : st === 3 ? t2[3] : MIN[st]; return { h: hr(), m: pickOne(ms) }; }
    var dg = function (h, m) { return h + ':' + pad(m); };
    var sayT = function (h, m) { return h + '시' + (m ? ' ' + m + '분' : ''); };

    /* ===== 1단계: 시계 살펴보기 ===== */
    if (stage === 1) {
      var A = tm(1);
      qs.push({ t: '짧은바늘은 무슨 색일까요? ○ 하세요.', b: fr([clock({ h: A.h, m: 0, size: 130 }), '<div style="display:flex;flex-direction:column;gap:10px"><div>' + label('짧은바늘(시침)은') + ' ' + cho(['빨강', '파랑'], '빨강') + '</div><div>' + label('긴바늘(분침)은') + ' ' + cho(['빨강', '파랑'], '파랑') + '</div></div>']) });
      var bl = level <= 2 ? [12, 6] : [12, 3, 6, 9];
      qs.push({ t: '시계에서 비어 있는 숫자를 ' + (trace ? '따라 써 보세요.' : '써 보세요.') + ' (칸에 쓰기)', b: fr([clock({ blankNums: bl, size: 136, noHour: true, noMin: true }), '<div style="font-size:17px;color:#666;max-width:310px">12는 맨 위, 3은 오른쪽, 6은 맨 아래, 9는 왼쪽에 있어요. 빈 칸에 알맞은 숫자를 써 넣어요.<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' + bl.map(function (n) { return box(n, trace); }).join('') + '</div></div>']) });
      var ts = uniq(level <= 2 ? 2 : 3, function () { return tm(1); });
      qs.push({ t: '짧은바늘이 가리키는 숫자를 ' + (trace ? '따라 쓰세요.' : '쓰세요.'), b: fr(ts.map(function (x) { return cell(clock({ h: x.h, m: 0, size: 112 }) + '<span>짧은바늘 ' + box(x.h, trace) + '</span>'); })) });
      var B = uniq(2, function () { return tm(1); }), pa = shuf([0, 1]);
      qs.push({ t: '긴바늘이 12에 있는 시계에 ○ 하세요.', b: fr(shuf([{ h: B[0].h, m: 0 }, { h: B[1].h, m: 30 }]).map(function (x) { return '<div class="card' + (x.m === 0 ? ' circ' : '') + '" style="padding:8px">' + clock({ h: x.h, m: x.m, size: 108 }) + '</div>'; })) });
    }

    /* ===== 2단계: 정각 ===== */
    if (stage === 2) {
      var R = uniq(3, function () { return tm(2); });
      qs.push({ t: '시계를 보고 몇 시인지 ' + (level <= 2 ? '○ 하세요.' : '써 보세요.'), b: fr(R.map(function (x) {
        var hs = other([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(function (v) { return Math.abs(v - x.h) <= 3 || level >= 4; }), x.h, NOPT);
        return cell(clock({ h: x.h, m: 0, size: 112 }) + (level <= 2 ? cho(hs.map(function (v) { return v + '시'; }), x.h + '시') : '<span>' + box(x.h, trace && level <= 2) + ' 시</span>')); })) });
      var D = uniq(level <= 2 ? 2 : 3, function () { return tm(2); });
      qs.push({ t: '시각에 맞게 짧은바늘을 그려 넣으세요. (긴바늘은 12)', b: fr(D.map(function (x) { return cell('<span style="font-size:22px;background:#e8f3fb;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 14px">' + x.h + '시</span>' + clock({ m: 0, noHour: true, ansH: x.h, ansM: 0, size: 112 })); })) });
      var M = uniq(3, function () { return tm(2); }), lb = shuf(M.map(function (x, i) { return { x: x, i: i }; }));
      qs.push({ t: '같은 시각끼리 이어 보세요.', b: '<div style="display:flex;justify-content:space-around;margin-bottom:6px">' + M.map(function (x) { return '<div style="text-align:center">' + clock({ h: x.h, m: 0, size: 104 }) + '<i class="dt"></i></div>'; }).join('') + '</div><div style="height:30px"></div><div style="display:flex;justify-content:space-around">' + lb.map(function (o) { return '<div style="text-align:center"><i class="dt"></i><div style="font-size:23px;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 16px;background:#fff">' + dg(o.x.h, 0) + ' <small style="font-size:14px">(' + o.x.h + '시)</small></div></div>'; }).join('') + '</div><div class="ansline">답: ' + M.map(function (x) { return x.h + '시'; }).join(', ') + ' 순서대로 이어요</div>' });
      if (level >= 3) {
        var Z = uniq(2, function () { return tm(2); });
        qs.push({ t: '1시간 뒤는 몇 시일까요?', b: fr(Z.map(function (x) { return cell(clock({ h: x.h, m: 0, size: 100 }) + '<span style="font-size:18px">1시간 뒤 ' + box(x.h % 12 + 1, false) + ' 시</span>'); })) });
      }
    }

    /* ===== 3단계: 몇 시 30분 ===== */
    if (stage === 3) {
      var C = uniq(3, function () { var m = level >= 4 ? pickOne([0, 30]) : 30; return { h: hr(), m: m }; });
      qs.push({ t: '시계를 보고 알맞은 시각을 ' + (level <= 2 ? '○ 하세요.' : '써 보세요.'), b: fr(C.map(function (x) {
        var wrong = [sayT(x.h, x.m ? 0 : 30), sayT(x.h % 12 + 1, x.m), sayT(x.h, x.m)];
        return cell(clock({ h: x.h, m: x.m, size: 112 }) + (level <= 2 ? cho(other(wrong, sayT(x.h, x.m), NOPT), sayT(x.h, x.m)) : '<span>' + pair(x.h, x.m) + '</span>')); })) });
      qs.push({ t: '긴바늘이 6을 가리키면 몇 분일까요?', b: fr([clock({ h: 3, m: 30, size: 116, noHour: true, mins: true }), '<div style="font-size:21px">긴바늘이 6 → ' + box(30, trace) + ' 분<div style="font-size:16px;color:#666;margin-top:6px">(1시간의 반이 30분이에요)</div></div>']) });
      var E = uniq(level <= 2 ? 2 : 3, function () { return { h: hr(), m: 30 }; });
      qs.push({ t: '시각에 맞게 긴바늘을 그려 넣으세요.', b: fr(E.map(function (x) { return cell('<span style="font-size:22px;background:#e8f3fb;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 14px">' + x.h + '시 30분</span>' + clock({ h: x.h, m: 30, noMin: true, ansM: 30, size: 112 })); })) });
      var F = uniq(2, function () { return { h: hr(), m: 30 }; });
      qs.push({ t: '짧은바늘은 어디에 있을까요? ○ 하세요. (30분일 때 짧은바늘은 두 숫자의 가운데예요)', b: fr(F.map(function (x) { return cell(clock({ h: x.h, m: 30, size: 108 }) + '<span style="font-size:18px">' + cho([x.h + '와 ' + (x.h % 12 + 1) + ' 사이', ((x.h + 2) % 12 + 1) + '와 ' + ((x.h + 3) % 12 + 1) + ' 사이'].slice(0, level <= 2 ? 2 : 2), x.h + '와 ' + (x.h % 12 + 1) + ' 사이') + '</span>'); })) });
    }

    /* ===== 4단계: 몇 시 몇 분 ===== */
    if (stage === 4) {
      var mw = level <= 2 ? [1, 2, 3, 4] : [1, 2, 3, 4, 6, 8, 9, 12];
      qs.push({ t: '긴바늘이 숫자를 가리키면 몇 분일까요? 5씩 세어요. (5, 10, 15 …)', b: fr([clock({ size: 128, mins: true, noHour: true, noMin: true })]) + '<div class="row" style="margin-top:8px">' + mw.map(function (n) { return '<div class="card" style="min-width:74px"><span style="font-size:20px">숫자 ' + n + '</span><span>' + box(n * 5, trace) + ' 분</span></div>'; }).join('') + '</div>' });
      var G = uniq(3, function () { return tm(4); });
      qs.push({ t: '시계를 보고 몇 시 몇 분인지 ' + (trace ? '따라 쓰세요.' : '쓰세요.'), b: fr(G.map(function (x) { return cell(clock({ h: x.h, m: x.m, size: 112, mins: level <= 2 }) + '<span>' + pair(x.h, x.m) + '</span>'); })) });
      var H = uniq(level <= 2 ? 2 : 4, function () { return tm(4); });
      qs.push({ t: '시각에 맞게 긴바늘을 그려 넣으세요.', b: fr(H.map(function (x) { return cell('<span style="font-size:20px;background:#e8f3fb;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 10px">' + x.h + '시 ' + x.m + '분</span>' + clock({ h: x.h, m: x.m, noMin: true, ansM: x.m, size: 104, mins: level <= 2 })); })) });
      qs.push({ t: '알맞은 수를 써 넣으세요.', b: '<div style="font-size:22px;display:flex;gap:26px;flex-wrap:wrap">' + '<span>1시간 = ' + box(60, trace) + ' 분</span><span>30분 = 1시간의 ' + box('반', trace) + '</span>' + (level >= 3 ? '<span>2시간 = ' + box(120, false) + ' 분</span>' : '') + '</div>' });
    }

    /* ===== 5단계: 몇 분 전 ===== */
    if (stage === 5) {
      var K = uniq(3, function () { return { h: hr(), m: pickOne([45, 50, 55]) }; });
      qs.push({ t: '시계를 보고 알맞은 수를 써 보세요.', b: fr(K.map(function (x) { return cell(clock({ h: x.h, m: x.m, size: 112 }) + '<span style="font-size:19px;line-height:2">' + box(x.h, trace) + '시 ' + box(x.m, trace) + '분<br>= ' + box(x.h % 12 + 1, trace) + '시 ' + box(60 - x.m, trace) + '분 전</span>'); })) });
      var P = uniq(2, function () { return { h: hr(), m: pickOne([45, 50, 55]) }; });
      qs.push({ t: '다음 시각이 되려면 몇 분이 더 지나야 할까요?', b: fr(P.map(function (x) { return cell(clock({ h: x.h, m: x.m, size: 108 }) + '<span style="font-size:18px">' + (x.h % 12 + 1) + '시가 되려면 ' + box(60 - x.m, trace) + ' 분 남았어요</span>'); })) });
      var N = uniq(2, function () { return { h: hr(), m: pickOne([45, 50, 55]) }; });
      qs.push({ t: '시각에 맞게 긴바늘을 그려 넣으세요.', b: fr(N.map(function (x) { return cell('<span style="font-size:20px;background:#e8f3fb;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 10px">' + (x.h % 12 + 1) + '시 ' + (60 - x.m) + '분 전</span>' + clock({ h: x.h, m: x.m, noMin: true, ansM: x.m, size: 108 })); })) });
    }

    /* ===== 6단계: 초 ===== */
    if (stage === 6) {
      qs.push({ t: '알맞은 수를 써 넣으세요.', b: '<div style="font-size:23px;display:flex;gap:30px;flex-wrap:wrap"><span>1분 = ' + box(60, trace) + ' 초</span>' + (level >= 3 ? '<span>2분 = ' + box(120, false) + ' 초</span>' : '') + '</div><div style="font-size:16px;color:#666;margin-top:6px">초침(초록 바늘)이 한 바퀴 돌면 1분이에요.</div>' });
      var SS = uniq(3, function () { var s = pickOne(level <= 2 ? [15, 30, 45] : [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]); return { h: s, m: 0 }; });
      qs.push({ t: '초침이 가리키는 숫자는 몇 초일까요? 5씩 세어요.', b: fr(SS.map(function (x) { return cell(dial(x.h) + '<span>' + box(x.h, trace) + ' 초</span>'); })) });
      var UN = [['눈 깜빡이기', '👀', '초', 1], ['손 씻기', '🧼', '초', 20], ['점심 먹기', '🍚', '분', 20], ['수업 한 교시', '📚', '분', 40], ['잠자기', '😴', '시간', 8], ['박수 10번 치기', '👏', '초', 10]];
      var us = shuf(UN).slice(0, level <= 2 ? 3 : 4);
      qs.push({ t: '알맞은 단위에 ○ 하세요. (초 · 분 · 시간)', b: '<div class="row" style="gap:12px 20px">' + us.map(function (u) { return '<div class="card" style="min-width:150px"><span style="font-size:34px">' + u[1] + '</span><span style="font-size:17px">' + u[0] + '</span>' + cho(['초', '분', '시간'], u[2]) + '</div>'; }).join('') + '</div>' });
      var T2 = uniq(2, function () { return { h: pickOne([10, 20, 30, 40, 50]), m: 0 }; });
      qs.push({ t: '초침을 알맞은 곳에 그려 넣으세요.', b: fr(T2.map(function (x) { return cell('<span style="font-size:20px;background:#e8f3fb;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 10px">' + x.h + '초</span>' + dial(null).replace('</svg>', hand(x.h * 6, 46, 2, GRN, 'ansonly', 10) + '</svg>')); })) });
    }

    /* ===== 7단계: 시간의 길이 ===== */
    if (stage === 7) {
      var W1 = uniq(2, function () { var h = hr(); return { h: h, m: 0, d: ri(1, 3) }; });
      qs.push({ t: '시계 두 개를 보고 몇 시간이 지났는지 구하세요.', b: fr(W1.map(function (x) { return cell('<div style="display:flex;align-items:center;gap:8px">' + clock({ h: x.h, m: 0, size: 96 }) + '<span style="font-size:26px">→</span>' + clock({ h: x.h + x.d, m: 0, size: 96 }) + '</div><span style="font-size:19px">' + x.h + '시부터 ' + ((x.h + x.d - 1) % 12 + 1) + '시까지 ' + box(x.d, trace) + ' 시간</span>'); })) });
      var mn = pickOne([0, 10, 20]);
      qs.push({ t: '급식 시간은 얼마나 걸렸을까요? (시간 띠에 색칠해 보세요)', b: fr([cell('<div style="display:flex;align-items:center;gap:8px">' + clock({ h: 12, m: mn, size: 100 }) + '<span style="font-size:26px">→</span>' + clock({ h: 12, m: mn + 30, size: 100 }) + '</div><div style="font-size:15px;color:#555">시작 12시 ' + mn + '분 → 끝 ' + '12시 ' + (mn + 30) + '분' + '</div>'),
        '<div style="flex:1;min-width:200px"><div style="display:flex;border:1.6px solid #2d2a26;border-radius:6px;overflow:hidden;font-size:12px;text-align:center">' + [0, 10, 20, 30, 40, 50].map(function (v) { return '<div style="flex:1;height:32px;border-right:1px dashed #9aa;padding-top:34px;margin:0">' + '</div>'; }).join('') + '</div><div style="display:flex;justify-content:space-between;font-size:12px;margin-top:2px"><span>12시</span><span>10분</span><span>20분</span><span>30분</span><span>40분</span><span>50분</span><span>1시</span></div><div style="margin-top:8px;font-size:20px">걸린 시간 ' + box(30, trace) + ' 분</div></div>']) });
      var cls = [[9, 0, 40], [9, 50, 40], [10, 40, 40]];
      var lessonStart = pickOne([9, 10]);
      qs.push({ t: '수업 시간표를 보고 끝나는 시각을 써 보세요. (40분 수업)', b: '<div style="background:#2f5d50;color:#fff;border-radius:10px;padding:10px 18px;font-size:20px;display:inline-block;line-height:1.9"><div>1교시 ' + lessonStart + ':00 ~ ' + lessonStart + ':40</div><div>2교시 ' + lessonStart + ':50 ~ ?</div></div><div style="font-size:21px;margin-top:8px">2교시는 ' + pair(lessonStart + 1, 30) + ' 에 끝나요. <span style="color:#777;font-size:15px">(' + lessonStart + '시 50분 + 40분)</span></div>' });
      qs.push({ t: '알맞은 수를 써 넣으세요.', b: '<div style="font-size:22px;display:flex;gap:10px 30px;flex-wrap:wrap"><span>1일 = ' + box(24, trace) + ' 시간</span><span>1주일 = ' + box(7, trace) + ' 일</span><span>1년 = ' + box(12, trace) + ' 개월</span>' + (level >= 4 ? '<span>2일 = ' + box(48, false) + ' 시간</span>' : '') + '</div>' });
    }

    /* ===== 8단계: 오전 · 오후 · 하루 ===== */
    if (stage === 8) {
      var SC = [['🌅', '아침에 일어나요', '오전'], ['🏫', '1교시 수업을 해요', '오전'], ['🍚', '점심을 먹어요', '오후'], ['⚽', '학교가 끝나고 놀아요', '오후'], ['🍽️', '저녁을 먹어요', '오후'], ['🥣', '아침밥을 먹어요', '오전'], ['🌙', '밤에 잠을 자요', '오후']];
      var sc = shuf(SC).slice(0, level <= 2 ? 3 : 4);
      qs.push({ t: '오전일까요, 오후일까요? ○ 하세요.', b: '<div class="row" style="gap:12px 20px">' + sc.map(function (u) { return '<div class="card" style="min-width:160px"><span style="font-size:36px">' + u[0] + '</span><span style="font-size:17px">' + u[1] + '</span>' + cho(['오전', '오후'], u[2]) + '</div>'; }).join('') + '</div>' });
      var AP = uniq(level <= 2 ? 2 : 3, function () { return { h: pickOne([7, 8, 9, 10, 1, 2, 3, 4, 5, 6]), m: 0 }; });
      qs.push({ t: '시계의 시각에 맞는 말을 ' + (trace ? '따라 쓰세요.' : '쓰세요.') + ' (낮 12시 전은 오전, 낮 12시 뒤는 오후)', b: fr(AP.map(function (x) { var pm = x.h <= 6; return cell(clock({ h: x.h, m: 0, size: 108 }) + '<span style="font-size:18px">' + (pm ? '👉 학교가 끝난 뒤' : '👉 학교 가기 전·수업 중') + '</span><span>' + box(pm ? '오후' : '오전', trace) + ' ' + x.h + '시</span>'); })) });
      qs.push({ t: '알맞은 수를 써 넣으세요.', b: '<div style="font-size:22px;display:flex;gap:10px 30px;flex-wrap:wrap"><span>오전 = ' + box(12, trace) + ' 시간</span><span>오후 = ' + box(12, trace) + ' 시간</span><span>하루 = ' + box(24, trace) + ' 시간</span></div><div style="font-size:16px;color:#666;margin-top:6px">밤 12시부터 낮 12시까지가 오전, 낮 12시부터 밤 12시까지가 오후예요.</div>' });
      if (level >= 3) {
        var Q8 = pickOne([['오후 3시', 2, '오후', 5], ['오전 10시', 3, '오후', 1], ['오전 8시', 2, '오전', 10], ['오후 1시', 4, '오후', 5]]);
        qs.push({ adv: level >= 4, t: '시간이 지난 뒤의 시각을 써 보세요.', b: '<div style="font-size:21px">' + Q8[0] + '에서 ' + Q8[1] + '시간이 지나면 → ' + box(Q8[2], false) + ' ' + box(Q8[3], false) + ' 시</div>' });
      }
    }

    /* ===== 9단계: 하루 일과 순서 ===== */
    if (stage === 9) {
      var RT = [['🌅', '일어나요', 7, 0], ['🪥', '이를 닦아요', 7, 20], ['🍞', '아침을 먹어요', 7, 40], ['🚌', '학교에 가요', 8, 30], ['📖', '공부해요', 10, 0], ['🍚', '점심을 먹어요', 12, 10], ['🏠', '집에 돌아와요', 15, 0], ['🍽️', '저녁을 먹어요', 18, 0], ['🛁', '씻어요', 20, 0], ['🛏️', '잠을 자요', 21, 30]];
      var nR = [2, 2, 3, 4, 4][level - 1], st0 = ri(0, RT.length - nR), pk = RT.slice(st0, st0 + nR), sh = shuf(pk.map(function (x, i) { return { x: x, i: i }; }));
      var tstr = function (x) { return (x[2] >= 12 ? '오후 ' : '오전 ') + ((x[2] + 11) % 12 + 1) + '시' + (x[3] ? ' ' + x[3] + '분' : ''); };
      qs.push({ t: '먼저 하는 것부터 1, 2, 3… 번호를 ' + (trace ? '따라 쓰세요.' : '쓰세요.'), b: fr(sh.map(function (o) { return cell('<span style="font-size:40px">' + o.x[0] + '</span><span style="font-size:18px">' + o.x[1] + '</span>' + (level <= 3 ? '<span style="font-size:18px;color:#e0572f;font-weight:700">' + tstr(o.x) + '</span>' : clock({ h: o.x[2], m: o.x[3], size: 86 })) + '<span>' + box(o.i + 1, trace) + '</span>'); })) });
      var one = pickOne(pk), bad = RT.filter(function (x) { return x[2] % 12 !== one[2] % 12 || x[3] !== one[3]; }), pc = shuf([{ x: one, ok: true }].concat(shuf(bad).slice(0, NOPT - 1).map(function (x) { return { x: x, ok: false }; })));
      qs.push({ t: '“' + one[0] + ' ' + one[1] + '” 시각을 나타낸 시계에 ○ 하세요.', b: fr(pc.map(function (o) { return '<div class="card' + (o.ok ? ' circ' : '') + '" style="padding:8px">' + clock({ h: o.x[2], m: o.x[3], size: 100 }) + '</div>'; })) });
      var my = pickOne([[7, 0, '일어나는 시각'], [8, 30, '학교에 가는 시각'], [12, 10, '점심 먹는 시각'], [6, 0, '저녁 먹는 시각']]);
      qs.push({ t: '나의 하루: 시각에 맞게 긴바늘과 짧은바늘을 그려 넣으세요.', b: fr([cell('<span style="font-size:20px;background:#e8f3fb;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 10px">' + my[2] + ' ' + my[0] + '시' + (my[1] ? ' ' + my[1] + '분' : '') + '</span>' + clock({ noHour: true, noMin: true, ansH: my[0], ansM: my[1], size: 116 }))]) });
      if (level >= 4) {
        var gapM = (pk[nR - 1][2] * 60 + pk[nR - 1][3]) - (pk[0][2] * 60 + pk[0][3]);
        qs.push({ adv: true, t: '일과 사이의 시간을 써 보세요.', b: '<div style="font-size:21px">' + pk[0][1] + '(' + tstr(pk[0]) + ') → ' + pk[nR - 1][1] + '(' + tstr(pk[nR - 1]) + ') : ' + box(Math.floor(gapM / 60), false) + ' 시간 ' + box(gapM % 60, false) + ' 분</div>' });
      }
    }

    /* ===== 10단계: 시간표 읽기 ===== */
    if (stage === 10) {
      var TT = [['9:00', '국어', '📖'], ['10:00', '수학', '🔢'], ['11:00', '통합', '🎨'], ['12:00', '점심', '🍚'], ['1:00', '체육', '⚽'], ['2:00', '청소', '🧹']];
      var nT = level <= 2 ? 4 : 6, tt = TT.slice(0, nT);
      var ttab = function () { return '<table style="border-collapse:collapse;font-size:20px;background:#fff"><tr><th style="border:1.6px solid #2d2a26;padding:4px 18px;background:#e8f3fb">시각</th><th style="border:1.6px solid #2d2a26;padding:4px 18px;background:#e8f3fb">하는 일</th></tr>' + tt.map(function (r) { return '<tr><td style="border:1.6px solid #2d2a26;padding:4px 18px;text-align:center">' + r[0] + '</td><td style="border:1.6px solid #2d2a26;padding:4px 18px">' + r[2] + ' ' + r[1] + '</td></tr>'; }).join('') + '</table>'; };
      var r1 = pickOne(tt), r2 = pickOne(tt.slice(0, nT - 1));
      qs.push({ t: '시간표를 보고 알맞은 것에 ○ 하세요.', b: fr([ttab(), '<div style="display:flex;flex-direction:column;gap:12px"><div style="font-size:20px">' + r1[0] + '에 하는 일은? ' + cho(other(tt.map(function (r) { return r[1]; }), r1[1], NOPT), r1[1]) + '</div><div style="font-size:20px">' + r1[1] + ' 시간은 몇 시? ' + cho(other(tt.map(function (r) { return r[0]; }), r1[0], NOPT), r1[0]) + '</div></div>']) });
      var nx = tt[tt.indexOf(r2) + 1];
      qs.push({ t: '시간표를 보고 ' + (trace ? '따라 쓰세요.' : '쓰세요.'), b: '<div style="font-size:21px;line-height:2.1">' + r2[1] + ' 다음에는 ' + box(nx[1], trace) + ' 을(를) 해요.<br>' + nx[1] + '은 ' + box(nx[0], trace) + ' 에 시작해요.</div>' });
      qs.push({ adv: level >= 4, t: '시간표를 보고 알맞은 수를 써 넣으세요.', b: '<div style="font-size:21px;line-height:2.1">수업 한 시간은 ' + box(1, false) + ' 시간(= ' + box(60, false) + ' 분)이에요.<br>' + tt[0][1] + ' 시간부터 ' + tt[2][1] + ' 시간이 시작할 때까지 ' + box(2, false) + ' 시간이 걸려요.</div>' });
      qs.push({ t: '우리 반 시간표는? 칸에 직접 써 보세요. (게임의 “✏️ 우리 반 시간표”로 입력할 수도 있어요)', b: '<table style="border-collapse:collapse;font-size:20px"><tr><th style="border:1.6px solid #2d2a26;padding:6px 26px;background:#fff6dd">시각</th><th style="border:1.6px solid #2d2a26;padding:6px 60px;background:#fff6dd">하는 일</th></tr>' + [0, 1, 2, 3].map(function () { return '<tr><td style="border:1.6px solid #2d2a26;height:34px"></td><td style="border:1.6px solid #2d2a26"></td></tr>'; }).join('') + '</table>' });
    }

    /* ===== 11단계: 1분 체험과 시간 어림 ===== */
    if (stage === 11) {
      var TL = [['눈 한 번 깜빡이기', '👀', '초'], ['손 씻기', '🧼', '초'], ['점심 먹기', '🍚', '분'], ['수업 한 시간', '📚', '분'], ['영화 한 편 보기', '🎬', '시간'], ['밤에 자기', '😴', '시간']];
      var tl = shuf(TL).slice(0, level <= 2 ? 3 : 4);
      qs.push({ t: '알맞은 단위에 ○ 하세요. (초 · 분 · 시간)', b: '<div class="row" style="gap:12px 20px">' + tl.map(function (u) { return '<div class="card" style="min-width:150px"><span style="font-size:34px">' + u[1] + '</span><span style="font-size:17px">' + u[0] + '</span>' + cho(['초', '분', '시간'], u[2]) + '</div>'; }).join('') + '</div>' });
      var secs = [10, 20, 30, 60][Math.min(level, 4) - 1];
      qs.push({ t: '해 보아요: ' + secs + '초 동안 박수를 몇 번 쳤나요? (선생님이 초시계를 눌러 줘요)', b: '<div style="font-size:21px;line-height:2.2">' + secs + '초 동안 박수 <span class="box" style="min-width:70px"></span> 번<br>1분 동안 하면 몇 번쯤? ( <span class="box" style="min-width:70px"></span> 번 )</div><div style="font-size:15px;color:#666">정답은 사람마다 달라요. 시간을 몸으로 느끼는 활동이에요.</div>', free: true });
      var K = pickOne([[10, 500, '🅿️ 주차'], [10, 1000, '🎠 놀이기구'], [20, 500, '🚲 자전거']]), mult = ri(2, 4);
      qs.push({ t: '시간과 돈 — ' + K[2] + '은 ' + K[0] + '분에 ' + K[1] + '원이에요. 알맞은 수를 써 보세요.', b: '<div style="font-size:21px;line-height:2.2">' + K[0] * mult + '분은 ' + K[0] + '분이 ' + box(mult, trace) + ' 번이에요.<br>그래서 ' + box(K[1] * mult, trace) + ' 원이에요.</div><div style="font-size:15px;color:#666">💡 ' + K[1] + '원 = ' + (K[1] === 500 ? '500원 동전 1개' : '1000원 지폐 1장') + '</div>' });
      qs.push({ adv: level >= 4, t: '알맞은 수를 써 보세요.', b: '<div style="font-size:23px">1분 = ' + box(60, trace) + ' 초 &nbsp;&nbsp; 1시간 = ' + box(60, trace) + ' 분</div>' });
    }

    /* 점선 이음 표시용 작은 점 스타일: 문서에 한 번만 넣어요 */
    if (!document.getElementById('clk-style')) { var st = document.createElement('style'); st.id = 'clk-style'; st.textContent = '.dt{display:block;width:12px;height:12px;border-radius:50%;background:#2d2a26;margin:5px auto}'; document.head.appendChild(st); }
    return qs;
  }
  return { has: has, make: make, lessons: lessons, clock: clock, meta: meta, STAGES: STAGES.length };
})();
