/* 옥쌤의 즐거운 교실 — 바둑 전략 코치(초반·중반·종반)
   판의 모양을 보고 지금이 어느 단계인지, 무엇부터 해야 하는지 알려 줘요. 화면(go.js)과 시험(scripts/go-strategy-test.mjs)이 함께 써요.
   · 초반: 귀 → 변 → 중앙 순서로 큰 자리를 알려 줘요.
   · 중반: 활로가 적은 약한 돌(내 것 / 상대 것)을 찾아 줘요.
   · 종반: 집 차이를 보고 "안전하게 / 승부수"를 권해요(집 차이는 컴퓨터 어림값을 받아서 써요). */
(function (root) {
  'use strict';
  var PHASES = [
    { id: 'open', name: '초반', icon: '🌅', sub: '귀 → 변 → 중앙', motto: '빈 귀부터! 중앙은 마지막이에요.' },
    { id: 'mid', name: '중반', icon: '⚔️', sub: '약한 돌 · 공격과 방어', motto: '내 약한 돌부터 챙기고, 상대 약한 돌은 공격해요.' },
    { id: 'end', name: '종반', icon: '🏁', sub: '끝내기 · 승기 지키기', motto: '큰 곳부터, 선수 끝내기부터 둬요.' }
  ];

  /* 단계 나누기: 놓인 돌(접바둑 돌 포함)이 판 크기에 비해 얼마나 되는지로 정해요.
     9줄은 ~10수까지 초반·~34수까지 중반, 13줄은 ~21수 / ~70수, 19줄은 ~46수 / ~151수. */
  function movesOf(g) { return (g.stack ? g.stack.length : 0) + (g.handicap || 0); }
  function phaseOf(n, moves) { var f = moves / (n * n); return f < 0.13 ? 0 : f < 0.42 ? 1 : 2; }
  function phaseRange(n, ph) {   // 그 단계의 수 범위 [처음, 끝) — 맞히기 연습에서 써요
    var a = [0, Math.ceil(0.13 * n * n), Math.ceil(0.42 * n * n)], b = [a[1], a[2], 100000]; return [a[ph], b[ph]];
  }

  function allGroups(g) {
    var n = g.n, seen = {}, out = [];
    for (var s = 0; s < n * n; s++) { if (!g.get(s) || seen[s]) continue; var gr = g.group(s % n, (s / n) | 0); gr.stones.forEach(function (q) { seen[q] = 1; }); out.push(gr); }
    return out;
  }

  /* 귀: 판 모서리의 정사각형 칸에 돌이 하나도 없으면 "빈 귀" */
  function corners(g) {
    var n = g.n, r = n >= 19 ? 9 : n >= 13 ? 6 : 4, c = n >= 13 ? 3 : 2, out = [];
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (k) {
      var x0 = k[0] ? n - r : 0, y0 = k[1] ? n - r : 0, cnt = 0, mine = 0;
      for (var y = y0; y < y0 + r; y++) for (var x = x0; x < x0 + r; x++) if (g.get(y * n + x)) cnt++;
      out.push({ k: k, empty: cnt === 0, stones: cnt, star: (k[1] ? n - 1 - c : c) * n + (k[0] ? n - 1 - c : c) });
    });
    return out;
  }
  /* 변: 두 귀 사이 가운데 부근이 비어 있으면 "빈 변". 변 가운데 점(4선, 9줄은 3선)을 알려 줘요 */
  function sides(g) {
    var n = g.n, m = (n - 1) / 2, c = n >= 13 ? 3 : 2, h = n >= 19 ? 4 : n >= 13 ? 3 : 2, out = [];
    [[m, c, 'h', 0], [m, n - 1 - c, 'h', 1], [c, m, 'v', 0], [n - 1 - c, m, 'v', 1]].forEach(function (p) {
      var x = p[0], y = p[1], cnt = 0, lo = Math.floor(m) - h, hi = Math.ceil(m) + h;
      for (var i = lo; i <= hi; i++) for (var j = 0; j <= c + 1; j++) { var xx = p[2] === 'h' ? i : (p[3] ? n - 1 - j : j), yy = p[2] === 'h' ? (p[3] ? n - 1 - j : j) : i; if (g.get(yy * n + xx)) cnt++; }
      out.push({ empty: cnt === 0, s: y * n + x });
    });
    return out;
  }

  /* 약한 돌: 활로가 1~2개인 덩어리 */
  function weak(g, color) {
    var out = { atari: [], two: [] };
    allGroups(g).forEach(function (gr) { if (gr.color !== color) return; if (gr.libs.length === 1) out.atari.push(gr); else if (gr.libs.length === 2) out.two.push(gr); });
    return out;
  }

  /* 집 차이(흑 기준, 덤 포함)로 종반 충고 만들기. me: 내 돌 색(1 흑 / -1 백) */
  function adviceFromLead(lead, me) {
    var d = lead * me;   // 내가 앞서면 +
    if (d >= 8) return { level: 'ahead', text: '내가 ' + Math.round(d) + '집쯤 크게 앞서요! 무리하지 말고 약점을 지키면서 큰 끝내기만 챙겨요.' };
    if (d >= 2) return { level: 'ahead', text: '내가 ' + Math.round(d) + '집쯤 앞서요. 상대가 꼭 받아야 하는 선수 끝내기부터 두고 약점은 먼저 이어 둬요.' };
    if (d > -2) return { level: 'close', text: '거의 비슷한 접전이에요! 한 집이 승부를 가르니 가장 큰 끝내기부터 놓치지 말아요.' };
    if (d > -8) return { level: 'behind', text: '내가 ' + Math.round(-d) + '집쯤 뒤져요. 평범하게 두면 져요. 상대의 약점을 찾아 승부수를 준비해요.' };
    return { level: 'behind', text: '내가 ' + Math.round(-d) + '집쯤 크게 뒤져요. 끝내기만으로는 어려우니 상대 돌을 잡거나 침입하는 큰 승부를 걸어요.' };
  }

  /* 지금 판을 보고 코치 내용 만들기. me: 내 돌 색. 돌려주는 값: {phase, name, icon, sub, headline, tips, marks:{ring,warn,dot,danger}} */
  function analyze(g, me) {
    var n = g.n, mv = movesOf(g), ph = phaseOf(n, mv), P = PHASES[ph], tips = [], marks = { ring: [], warn: [], dot: [], danger: [] }, head = P.motto, i;
    if (ph === 0) {
      var cs = corners(g), emptyC = cs.filter(function (c) { return c.empty; });
      if (emptyC.length) {
        head = '빈 귀가 ' + emptyC.length + '곳 있어요. 귀부터 차지해요!'; emptyC.forEach(function (c) { marks.ring.push(c.star); });
        tips.push('귀는 두 변이 막아 주어서 적은 돌로 집을 만들기 쉬워요. 노란 동그라미가 귀의 큰 자리예요.');
      } else {
        var ss = sides(g).filter(function (q) { return q.empty; });
        if (ss.length) { head = '귀가 다 찼어요. 이제 빈 변이에요!'; ss.forEach(function (q) { marks.dot.push(q.s); }); tips.push('내 귀 옆 변으로 벌리거나, 상대 귀에 걸쳐 보세요. 파란 점이 빈 변의 큰 자리예요.'); }
        else { head = '귀와 변이 모두 자리 잡혔어요. 이제 중앙과 경계를 다퉈요.'; tips.push('약한 돌부터 안전하게 만들고, 상대 모양이 넓은 곳은 미리 줄여 두세요.'); }
      }
      tips.push('1줄·2줄은 너무 낮아서 집이 작아요. 3~4줄이 효율 좋아요.');
    } else if (ph === 1) {
      var mine = weak(g, me), theirs = weak(g, -me);
      mine.atari.forEach(function (gr) { marks.danger.push(gr.libs[0]); });
      mine.two.forEach(function (gr) { gr.libs.forEach(function (q) { marks.warn.push(q); }); });
      theirs.two.forEach(function (gr) { gr.libs.forEach(function (q) { marks.ring.push(q); }); });
      theirs.atari.forEach(function (gr) { marks.ring.push(gr.libs[0]); });
      if (mine.atari.length) { head = '내 돌이 단수예요! 먼저 살려요.'; tips.push('단수가 된 돌을 도망치거나, 상대 돌을 먼저 단수로 반격해요.'); }
      else if (mine.two.length) { head = '내 돌 ' + mine.two.length + '덩어리가 활로 2개예요. 먼저 튼튼하게!'; tips.push('주황 동그라미는 내 약한 돌의 활로예요. 공격하러 가기 전에 안전한지 확인해요.'); }
      else if (theirs.atari.length || theirs.two.length) { head = '상대 약한 돌이 보여요. 공격 기회예요!'; tips.push('노란 동그라미는 상대 약한 돌의 활로예요. 몰아붙이면서 내 집을 넓혀요.'); }
      else { head = '약한 돌이 없어요. 큰 곳을 찾아봐요.'; tips.push('상대 모양이 넓은 곳에 침입하거나, 내 집의 경계를 넓히는 곳이 큰 자리예요.'); }
      if (mine.two.length && !mine.atari.length) tips.push('내 약한 돌이 있을 때는 그 돌을 지키면서 상대를 공격하는 수가 가장 좋아요.');
    } else {
      head = '끝내기예요. 큰 곳부터!'; tips.push('경계에서 한 집이라도 큰 곳을 먼저 두고, 상대가 꼭 받아야 하는 수(선수)는 먼저 써요.', '이기고 있으면 안전하게, 지고 있으면 승부수를 준비해요.');
    }
    return { phase: ph, id: P.id, name: P.name, icon: P.icon, sub: P.sub, moves: mv, headline: head, tips: tips, marks: marks };
  }

  var api = { PHASES: PHASES, movesOf: movesOf, phaseOf: phaseOf, phaseRange: phaseRange, corners: corners, sides: sides, weak: weak, allGroups: allGroups, adviceFromLead: adviceFromLead, analyze: analyze };
  root.OKS_GO_STRATEGY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
