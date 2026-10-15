/* 수학 · 화폐(돈) 학습지 7단계
   id 형식: mny-<1~7>   예) mny-3
   동전·지폐는 SVG 로 직접 그린 모형 화폐예요(‘보기’ 표시). 정답은 .ansonly/.circ/box 로 정답지에만 보여요. */
window.OKS_WS_MONEY = (function () {
  'use strict';
  var STAGES = [
    ['돈 알아보기', '동전과 지폐를 구별하고 얼마짜리인지 안다'],
    ['동전 세기', '10원·50원·100원·500원 동전을 세어 얼마인지 말한다'],
    ['지폐 세기', '1000원·5000원·10000원 지폐를 세어 얼마인지 말한다'],
    ['같은 금액 만들기', '같은 금액을 여러 가지 돈으로 나타낸다'],
    ['물건값과 돈', '가진 돈으로 살 수 있는지 알아본다'],
    ['급식 가게 계산', '물건값을 더하고 거스름돈을 구한다'],
    ['모형 화폐 오리기', '모형 돈을 오려서 놀이와 수업에 쓴다']
  ];
  function parse(id) { var m = /^mny-([1-7])$/.exec(id || ''); return m ? +m[1] : 0; }
  function has(id) { return !!parse(id); }
  function lessons() {
    return STAGES.map(function (s, i) {
      return { id: 'mny-' + (i + 1), subject: 'math', subjectName: '수학', schoolName: '화폐', unitNo: '', unit: '화폐', no: i + 1, topic: s[0], goal: s[1], special: true, sub: '수학 · 화폐 · ' + (i + 1) + '단계' };
    });
  }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var NAME = { 10: '십 원', 50: '오십 원', 100: '백 원', 500: '오백 원', 1000: '천 원', 5000: '오천 원', 10000: '만 원', 50000: '오만 원' };
  var BILL = { 1000: ['#cfe0f5', '#5d7fae', '#2f4a73'], 5000: ['#f3d4c6', '#b9705c', '#6f3a2c'], 10000: ['#cdeed8', '#4f9d73', '#1f5a3d'], 50000: ['#fbe3a3', '#d49a1e', '#7a4b0f'] };
  var COIN = { 10: ['#e6b07a', '#a96a35', 15], 50: ['#d9dde0', '#8b939a', 18], 100: ['#e3e6e8', '#8b939a', 21], 500: ['#eef0f1', '#7d858c', 26] };

  function coin(v, sz) {
    var c = COIN[v], r = c[2], d = r * 2 + 4; sz = sz || 1;
    return '<svg viewBox="0 0 ' + d + ' ' + d + '" width="' + Math.round(d * 1.9 * sz) + '" height="' + Math.round(d * 1.9 * sz) + '" style="flex:none"><circle cx="' + d / 2 + '" cy="' + d / 2 + '" r="' + r + '" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/><circle cx="' + d / 2 + '" cy="' + d / 2 + '" r="' + (r - 3.4) + '" fill="none" stroke="' + c[1] + '" stroke-width=".8" stroke-dasharray="1.6 1.6"/>' +
      '<text x="' + d / 2 + '" y="' + (d / 2 + 2) + '" text-anchor="middle" font-size="' + (v >= 100 ? r * .78 : r * .85) + '" font-weight="700" fill="#4a4f54" font-family="Jua,sans-serif">' + v + '</text><text x="' + d / 2 + '" y="' + (d / 2 + r * .6) + '" text-anchor="middle" font-size="' + r * .38 + '" fill="#4a4f54" font-family="Jua,sans-serif">원</text></svg>';
  }
  function bill(v, w, bo) {
    var c = BILL[v]; w = w || 150; var h = Math.round(w * .46);
    return '<svg viewBox="0 0 150 69" width="' + w + '" height="' + h + '" style="flex:none"><rect x="1.5" y="1.5" width="147" height="66" rx="5" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/><rect x="6" y="6" width="138" height="57" rx="3" fill="none" stroke="' + c[1] + '" stroke-width=".8"/>' +
      '<circle cx="106" cy="34" r="19" fill="' + c[1] + '" opacity=".28"/><circle cx="106" cy="34" r="13" fill="none" stroke="' + c[1] + '" stroke-width="1.4"/>' +
      '<text x="12" y="16" font-size="6.5" fill="' + c[2] + '" font-family="Jua,sans-serif">한국은행</text><text x="12" y="31" font-size="11.5" font-weight="700" fill="' + c[2] + '" font-family="Jua,sans-serif">' + NAME[v].replace(' ', '') + '</text>' +
      '<text x="12" y="58" font-size="' + (v >= 10000 ? 19 : 22) + '" font-weight="700" fill="' + c[2] + '" font-family="Jua,sans-serif">' + v + '</text><text x="138" y="17" text-anchor="end" font-size="8" fill="' + c[2] + '" font-family="Jua,sans-serif">' + v + '</text>' +
      '<text x="12" y="42" font-size="7.5" fill="#d0342c" font-family="Jua,sans-serif">보 기</text></svg>';
  }
  function item(v, sz) { return v >= 1000 ? bill(v, sz ? sz * 1.35 : 132) : coin(v, sz || .82); }
  function pile(list) { /* [[값, 개수], ...] */
    return '<div style="display:flex;flex-wrap:wrap;gap:4px 5px;align-items:center">' + list.map(function (p) { var s = ''; for (var i = 0; i < p[1]; i++) s += item(p[0]); return s; }).join('') + '</div>';
  }

  function make(W) {
    var level = W.level, shuf = W.shuf, ri = W.ri, box = W.box, trace = level <= 2, stage = parse(W.id), qs = [];
    function pk(a) { return a[ri(0, a.length - 1)]; }
    function cho(list, ans) { return '<div class="choices" style="justify-content:flex-start">' + list.map(function (v) { return '<span class="' + (v === ans ? 'circ' : '') + '" style="width:auto;min-width:46px;padding:0 10px;white-space:nowrap">' + v + '</span>'; }).join('') + '</div>'; }
    function wonBox(a, tr) { return box(a, tr === undefined ? trace : tr) + ' 원'; }
    function other(list, ans, n) { return shuf(shuf(list.filter(function (x) { return x !== ans; })).slice(0, n - 1).concat(ans)); }
    var NOPT = [2, 2, 3, 3, 4][level - 1];
    function row(arr) { return '<div style="display:flex;flex-wrap:wrap;gap:14px 22px;align-items:flex-end">' + arr.join('') + '</div>'; }
    function cell(inner) { return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:6px">' + inner + '</div>'; }
    var COINS = level <= 2 ? [100, 500] : [10, 50, 100, 500];
    var BILLS = level <= 2 ? [1000, 5000] : level === 3 ? [1000, 5000, 10000] : [1000, 5000, 10000, 50000];

    if (stage === 1) {
      var mix = shuf([[100, 'c'], [1000, 'b'], [500, 'c'], [5000, 'b'], [50, 'c'], [10000, 'b']]).slice(0, level <= 2 ? 3 : 4);
      qs.push({ t: '동전인지 지폐인지 ○ 하세요.', b: row(mix.map(function (m) { return cell(item(m[0]) + cho(['동전', '지폐'], m[1] === 'c' ? '동전' : '지폐')); })) });
      var cs = shuf(COINS.concat(BILLS)).slice(0, level <= 2 ? 3 : 4);
      qs.push({ t: '얼마짜리 돈인지 ○ 하세요.', b: row(cs.map(function (v) { var all = COINS.concat(BILLS).map(function (x) { return fmt(x) + '원'; }); return cell(item(v) + cho(other(all, fmt(v) + '원', NOPT), fmt(v) + '원')); })) });
      var tr = shuf(COINS.concat(BILLS)).slice(0, level <= 2 ? 2 : 3), sh = shuf(tr);
      qs.push({ t: '돈과 알맞은 금액을 이어 보세요.', b: '<div style="display:flex;justify-content:space-around;align-items:flex-end">' + tr.map(function (v) { return '<div style="text-align:center">' + item(v) + '<i class="dt"></i></div>'; }).join('') + '</div><div style="height:30px"></div><div style="display:flex;justify-content:space-around">' + sh.map(function (v) { return '<div style="text-align:center"><i class="dt"></i><div style="font-size:23px;border:1.4px solid #9fb8cc;border-radius:8px;padding:2px 14px;background:#fff">' + fmt(v) + '원</div></div>'; }).join('') + '</div><div class="ansline">답: ' + tr.map(function (v) { return fmt(v) + '원'; }).join(', ') + ' 순서대로 이어요</div>' });
      var pr = shuf(COINS.concat(BILLS)).slice(0, 2);
      if (pr[0] === pr[1]) pr[1] = pr[0] === 100 ? 500 : 100;
      qs.push({ t: '더 큰 돈에 ○ 하세요. (숫자가 큰 돈이에요)', b: row(pr.map(function (v) { return '<div class="card' + (v === Math.max(pr[0], pr[1]) ? ' circ' : '') + '" style="padding:8px">' + item(v) + '</div>'; })) });
    }

    if (stage === 2) {
      var n1 = level <= 2 ? ri(2, 4) : ri(3, 7);
      qs.push({ t: '100원 동전이 모두 얼마인지 ' + (trace ? '따라 쓰세요.' : '쓰세요.'), b: cell(pile([[100, n1]]) + '<span style="font-size:20px">100원 동전 ' + n1 + '개 → ' + wonBox(n1 * 100) + '</span>') });
      var a = ri(1, 2), b = ri(1, level <= 2 ? 2 : 4);
      qs.push({ t: '500원 동전과 100원 동전은 모두 얼마일까요?', b: cell(pile([[500, a], [100, b]]) + '<span style="font-size:20px">' + wonBox(a * 500 + b * 100) + '</span>') });
      if (level >= 3) { var c50 = ri(2, 5), c10 = ri(1, 4); qs.push({ t: '50원 동전과 10원 동전은 모두 얼마일까요?', b: cell(pile([[50, c50], [10, c10]]) + '<span style="font-size:20px">' + wonBox(c50 * 50 + c10 * 10, false) + '</span>') }); }
      var tg = pk(level <= 2 ? [300, 400, 500] : [600, 700, 800, 900]);
      qs.push({ t: tg + '원이 되도록 100원 동전을 그려 넣거나 세어 보세요.', b: cell('<span style="font-size:20px">' + tg + '원 = 100원 동전 ' + box(tg / 100, trace) + ' 개</span><div class="row">' + [1, 2, 3, 4].map(function () { return '<i style="display:inline-block;width:46px;height:46px;border:1.8px dashed #b9b0a0;border-radius:50%"></i>'; }).join('') + '</div>') });
    }

    if (stage === 3) {
      var p1 = ri(2, 5);
      qs.push({ t: '1000원 지폐가 모두 얼마인지 쓰세요.', b: cell(pile([[1000, p1]]) + '<span style="font-size:20px">1000원 지폐 ' + p1 + '장 → ' + wonBox(p1 * 1000) + '</span>') });
      var f5 = ri(1, 2), f1 = ri(1, 3);
      qs.push({ t: '5000원과 1000원 지폐는 모두 얼마일까요?', b: cell(pile([[5000, f5], [1000, f1]]) + '<span style="font-size:20px">' + wonBox(f5 * 5000 + f1 * 1000) + '</span>') });
      qs.push({ t: '알맞은 수를 써 넣으세요.', b: '<div style="font-size:21px;display:flex;flex-wrap:wrap;gap:10px 28px"><span>1000원 지폐 ' + box(5, trace) + ' 장 = 5000원</span><span>5000원 지폐 ' + box(2, trace) + ' 장 = 10000원</span>' + (level >= 4 ? '<span>10000원 지폐 ' + box(5, false) + ' 장 = 50000원</span>' : '') + '</div>' });
      if (level >= 3) { var t1 = pk([10000, 50000]), s5 = ri(1, 2); qs.push({ t: '지폐와 동전은 모두 얼마일까요?', b: cell(pile([[t1, 1], [5000, s5], [500, 1], [100, 2]]) + '<span style="font-size:20px">' + wonBox(t1 + s5 * 5000 + 700, false) + '</span>') }); }
    }

    if (stage === 4) {
      qs.push({ t: '같은 금액이 되도록 알맞은 수를 써 넣으세요.', b: '<div style="font-size:21px;display:flex;flex-direction:column;gap:8px"><span>500원 = 100원 동전 ' + box(5, trace) + ' 개</span><span>1000원 = 500원 동전 ' + box(2, trace) + ' 개</span>' + (level >= 3 ? '<span>1000원 = 100원 동전 ' + box(10, false) + ' 개</span><span>100원 = 50원 동전 ' + box(2, false) + ' 개</span>' : '') + '</div>' });
      var t = pk(level <= 2 ? [600, 700] : [900, 1100, 1200]);
      var ex = t < 1000 ? [[500, 1], [100, (t - 500) / 100]] : [[1000, 1], [500, 1], [100, (t - 1500) < 0 ? (t - 1000) / 100 : (t - 1500) / 100]];
      qs.push({ t: '같은 금액인 것끼리 ○ 하세요. 먼저 ' + fmt(t) + '원은 모두 얼마인지 쓰세요.', b: cell(pile(t < 1000 ? [[500, 1], [100, (t - 500) / 100]] : [[1000, 1], [100, (t - 1000) / 100]]) + '<span style="font-size:20px">' + wonBox(t) + '</span>') });
      var opts = [[500, 1], [100, 3]], o2 = [[100, 8]], o3 = [[500, 2]];
      var wA = [pile([[500, 1], [100, 3]]), pile([[100, 8]]), pile([[500, 2]])], lab = ['800원', '800원', '1000원'];
      qs.push({ t: '800원과 같은 금액에 ○ 하세요.', b: row([['500원 1개 + 100원 3개', 800, [[500, 1], [100, 3]]], ['100원 8개', 800, [[100, 8]]], ['500원 2개', 1000, [[500, 2]]]].map(function (x) { return '<div class="card' + (x[1] === 800 ? ' circ' : '') + '" style="padding:8px">' + pile(x[2]) + '</div>'; })) });
      qs.push({ t: '500원으로 낼 수 있는 방법을 써 보세요.', b: '<div style="font-size:21px;display:flex;flex-direction:column;gap:8px"><span>500원 동전 ' + box(1, trace) + ' 개</span><span>100원 동전 ' + box(5, trace) + ' 개</span>' + (level >= 3 ? '<span>100원 동전 ' + box(4, false) + ' 개 + 50원 동전 ' + box(2, false) + ' 개</span>' : '') + '</div>' });
    }

    var GOODS = [['🍎', '사과', 500], ['🥛', '우유', 300], ['🍞', '빵', 700], ['🍪', '과자', 600], ['🧃', '주스', 900], ['✏️', '연필', 200], ['📓', '공책', 1000], ['🧽', '지우개', 400]];
    function tag(g) { return '<div class="card" style="min-width:92px"><span style="font-size:34px">' + g[0] + '</span><span style="font-size:16px">' + g[1] + '</span><b style="font-size:18px;color:#c2410c">' + fmt(g[2]) + '원</b></div>'; }
    if (stage === 5) {
      var gs = shuf(GOODS).slice(0, level <= 2 ? 3 : 4), have = pk(level <= 2 ? [500, 600] : [700, 800, 1000]);
      qs.push({ t: '내 돈은 ' + fmt(have) + '원이에요. 살 수 있는 것에 ○ 하세요.', b: cell(pile(have === 1000 ? [[1000, 1]] : have === 500 ? [[500, 1]] : [[500, 1], [100, (have - 500) / 100]]) + row(gs.map(function (g) { return '<div class="card' + (g[2] <= have ? ' circ' : '') + '" style="min-width:92px;padding:5px"><span style="font-size:34px">' + g[0] + '</span><span style="font-size:16px">' + g[1] + '</span><b style="font-size:18px;color:#c2410c">' + fmt(g[2]) + '원</b></div>'; }))) });
      var g2 = shuf(GOODS).slice(0, 2); if (g2[0][2] === g2[1][2]) g2[1] = GOODS[3];
      qs.push({ t: '더 비싼 물건에 ○ 하세요.', b: row(g2.map(function (g) { return '<div class="card' + (g[2] === Math.max(g2[0][2], g2[1][2]) ? ' circ' : '') + '" style="min-width:92px;padding:5px"><span style="font-size:34px">' + g[0] + '</span><span style="font-size:16px">' + g[1] + '</span><b style="font-size:18px;color:#c2410c">' + fmt(g[2]) + '원</b></div>'; })) });
      var g3 = shuf(GOODS.filter(function (g) { return g[2] <= 500; })).slice(0, 2);
      qs.push({ t: '두 물건을 사려면 모두 얼마가 필요할까요?', b: row([tag(g3[0]), '<span style="font-size:30px">+</span>', tag(g3[1]), '<span style="font-size:30px">=</span>', '<span style="font-size:20px">' + wonBox(g3[0][2] + g3[1][2], trace && level <= 2) + '</span>']) });
      if (level >= 3) { var g4 = pk(GOODS.filter(function (g) { return g[2] >= 600 && g[2] < 1000; })); qs.push({ t: '1000원이 있어요. ' + g4[1] + '(' + fmt(g4[2]) + '원)을 사면 얼마가 남을까요?', b: row([tag(g4), '<span style="font-size:20px">1000원 − ' + fmt(g4[2]) + '원 = ' + wonBox(1000 - g4[2], false) + '</span>']) }); }
    }

    if (stage === 6) {
      var FD = [['🍚', '밥', 300], ['🍲', '국', 200], ['🥬', '반찬', 400], ['🍎', '과일', 500], ['🥛', '우유', 300]], f = shuf(FD).slice(0, level <= 2 ? 2 : 3), sum = f.reduce(function (s, x) { return s + x[2]; }, 0);
      qs.push({ t: '급식 가게예요. 모두 얼마일까요?', b: row(f.map(function (x, i) { return (i ? '<span style="font-size:28px">+</span>' : '') + tag(x); }).concat(['<span style="font-size:28px">=</span>', '<span style="font-size:20px">' + wonBox(sum, trace) + '</span>'])) });
      var pr2 = pk(FD.filter(function (x) { return x[2] <= 500; }));
      qs.push({ t: '1000원을 냈어요. ' + pr2[1] + '(' + pr2[2] + '원) 거스름돈은 얼마일까요?', b: row([pile([[1000, 1]]), '<span style="font-size:26px">→</span>', tag(pr2), '<span style="font-size:20px">거스름돈 ' + wonBox(1000 - pr2[2], trace && level <= 2) + '</span>']) });
      var ex2 = pk([[500, 100, 3], [500, 100, 4], [1000, 100, 5]]);
      qs.push({ t: '알맞은 돈 고르기: ' + fmt(ex2[0] === 500 ? 500 * 1 + 100 * ex2[2] : 1000 + 500) + '원이 되려면 어떻게 낼까요?', b: row(shuf([{ l: ex2[0] === 500 ? [[500, 1], [100, ex2[2]]] : [[1000, 1], [500, 1]], ok: true }, { l: [[100, 4]], ok: false }, { l: [[500, 1]], ok: false }]).slice(0, NOPT > 3 ? 3 : 3).map(function (x) { return '<div class="card' + (x.ok ? ' circ' : '') + '" style="padding:8px">' + pile(x.l) + '</div>'; })) });
      if (level >= 3) { var m3 = shuf(FD).slice(0, 2); qs.push({ t: '2000원으로 ' + m3[0][1] + '과(와) ' + m3[1][1] + '을(를) 사면 거스름돈은 얼마일까요?', b: row([tag(m3[0]), '<span style="font-size:28px">+</span>', tag(m3[1]), '<span style="font-size:20px">2000원 − ' + (m3[0][2] + m3[1][2]) + '원 = ' + wonBox(2000 - m3[0][2] - m3[1][2], false) + '</span>']) }); }
    }

    if (stage === 7) {
      var sheet = function (l) { return '<div style="display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;border:1.4px dashed #b9b0a0;border-radius:8px;padding:6px">' + l.map(function (p) { var s = ''; for (var i = 0; i < p[1]; i++) s += item(p[0], p[0] >= 1000 ? 1 : 1.0); return s; }).join('') + '</div>'; };
      qs.push({ t: '점선을 따라 오려서 놀이에 써요. (동전)', b: sheet([[10, 6], [50, 6], [100, 8], [500, 6]]) });
      qs.push({ t: '점선을 따라 오려서 놀이에 써요. (지폐)', b: sheet([[1000, 3], [5000, 2], [10000, 2], [50000, 1]]) });
    }
    if (!document.getElementById('clk-style')) { var st = document.createElement('style'); st.id = 'clk-style'; st.textContent = '.dt{display:block;width:12px;height:12px;border-radius:50%;background:#2d2a26;margin:5px auto}'; document.head.appendChild(st); }
    return qs;
  }
  return { has: has, make: make, lessons: lessons };
})();
