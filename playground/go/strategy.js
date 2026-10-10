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

  /* ====================================================================
     수 종류 해설: 한 수가 "무슨 수"인지 이름을 붙여서 이유와 함께 알려 줘요(복기·프로 기보·코치가 함께 써요).
     ==================================================================== */
  function nbrs(n, x, y) { var o = []; if (x > 0) o.push(y * n + x - 1); if (x < n - 1) o.push(y * n + x + 1); if (y > 0) o.push((y - 1) * n + x); if (y < n - 1) o.push((y + 1) * n + x); return o; }
  function lineOf(n, s) { var x = s % n, y = (s / n) | 0, a = Math.min(x, n - 1 - x) + 1, b = Math.min(y, n - 1 - y) + 1; return a < b ? [a, b] : [b, a]; }   // [낮은 줄, 높은 줄] (1줄이 가장자리)
  function cheb(n, a, b) { return Math.max(Math.abs((a % n) - (b % n)), Math.abs(((a / n) | 0) - ((b / n) | 0))); }
  function cornerIdx(n, s) { var r = n >= 19 ? 9 : n >= 13 ? 6 : 4, x = s % n, y = (s / n) | 0, l = x < r, rt = x >= n - r, t = y < r, b = y >= n - r; if (!((l || rt) && (t || b))) return -1; return (rt ? 1 : 0) + (b ? 2 : 0); }
  function sideOf(n, s) { var x = s % n, y = (s / n) | 0, d = [x, n - 1 - x, y, n - 1 - y], m = Math.min.apply(null, d), k = d.indexOf(m); return d.filter(function (v) { return v === m; }).length > 1 ? -1 : k; }
  var CORNER_NAME = { '3-3': '삼삼', '3-4': '소목', '4-4': '화점', '3-5': '외목' };
  function groupsAround(g, n, s, color) {   // s 둘레에서 color 색 덩어리(중복 없이)
    var seen = {}, out = []; nbrs(n, s % n, (s / n) | 0).forEach(function (q) { if (g.get(q) !== color) return; var gr = g.group(q % n, (q / n) | 0), k = gr.stones[0]; if (seen[k]) return; seen[k] = 1; out.push(gr); }); return out;
  }
  function stonesOf(g, n, color) { var o = []; for (var q = 0; q < n * n; q++) if (g.get(q) === color) o.push(q); return o; }
  function rd(t, kind, icon, tag, text) { return { kind: kind, icon: icon, tag: tag, text: text }; }

  /* g: 두기 전의 판(바꾸지 않아요), mv: {x,y} 또는 {pass:true}. 돌려주는 값: {kind, icon, tag, text} 또는 null(둘 수 없는 수) */
  function describeMove(g, mv) {
    if (!mv || mv.pass) return rd(0, 'pass', '⏸', '쉼', '한 수 쉬었어요.');
    var n = g.n, color = g.turn, x = mv.x, y = mv.y, s = y * n + x; if (g.get(s)) return null;
    var g2 = g.copy(), rec = g2.play(x, y); if (!rec) return null;
    var ph = phaseOf(n, movesOf(g)), enemyBefore = groupsAround(g, n, s, -color), mineBefore = groupsAround(g, n, s, color), enemyAfter = groupsAround(g2, n, s, -color), me2 = g2.group(x, y), myLibs = me2 ? me2.libs.length : 0, ln = lineOf(n, s);
    if (rec.captured && rec.captured.length) return rd(0, 'capture', '💥', '따냄', '상대 돌 ' + rec.captured.length + '점을 따냈어요. 활로가 하나뿐이던 돌을 마지막으로 막았어요.');
    var atariBefore = mineBefore.filter(function (gr) { return gr.libs.length === 1; });
    if (atariBefore.length && myLibs >= 2) return rd(0, 'escape', '🏃', '도망', '단수가 된 내 돌이 활로를 늘려서 살아 나갔어요.');
    var at = enemyAfter.filter(function (gr) { return gr.libs.length === 1; });
    if (at.length) return rd(0, 'atari', '⚡', '단수', '상대 돌 ' + at.reduce(function (a, gr) { return a + gr.stones.length; }, 0) + '점을 단수로 몰았어요. 다음 수로 따낼 수 있어요.');
    if (mineBefore.length >= 2) return rd(0, 'connect', '🔗', '이음', '떨어져 있던 내 돌 ' + mineBefore.length + '덩어리를 하나로 이었어요. 이어 두면 약점이 없어져요.');
    if (enemyBefore.length >= 2) return rd(0, 'cut', '✂️', '끊음', '상대 돌 ' + enemyBefore.length + '덩어리 사이를 끊었어요. 갈라진 돌은 약해져요.');
    if (ph === 0 && n >= 9) {
      var ci = cornerIdx(n, s), cs = corners(g);
      if (ci >= 0 && cs[ci] && cs[ci].empty) { var nm = n >= 13 ? CORNER_NAME[ln[0] + '-' + ln[1]] : ''; return rd(0, 'corner', '🏠', '귀 차지', '빈 귀에 먼저 두었어요' + (nm ? '(' + nm + ')' : '') + '. 귀는 두 변이 막아 줘서 적은 돌로 집을 만들기 쉬워요.'); }
      if (n >= 13) {
        var es = stonesOf(g, n, -color), ms = stonesOf(g, n, color), i;
        for (i = 0; i < es.length; i++) { var el = lineOf(n, es[i]); if (cheb(n, s, es[i]) <= 2 && el[0] <= 4 && el[1] <= 5 && ln[0] <= 5) return rd(0, 'kakari', '🤏', '걸침', '상대가 차지한 귀에 걸쳤어요. 귀를 혼자 차지하지 못하게 방해하는 수예요.'); }
        for (i = 0; i < ms.length; i++) { var ml = lineOf(n, ms[i]); if (ml[0] <= 4 && ln[0] <= 4 && cheb(n, s, ms[i]) <= 2) return rd(0, 'fold', '🧱', '굳힘', '내 귀의 돌 옆에 한 수 더 두어 귀를 단단하게 만들었어요.');
          var sd = sideOf(n, s), q9 = ms[i], qx = q9 % n, qy = (q9 / n) | 0, edgeD = sd < 0 ? 99 : [qx, n - 1 - qx, qy, n - 1 - qy][sd], gap = sd < 0 ? 0 : (sd < 2 ? Math.abs(((s / n) | 0) - qy) : Math.abs((s % n) - qx));
          if (sd >= 0 && ln[0] <= 4 && edgeD <= 3 && gap >= 3 && gap <= (n >= 19 ? 9 : 6)) return rd(0, 'extend', '↔️', '변 벌림', '내 귀의 돌에서 같은 변으로 멀리 벌렸어요. 변에 넓은 집 모양을 만들어요.'); }
      }
    }
    var wk = mineBefore.filter(function (gr) { return gr.libs.length <= 2; });
    if (wk.length && myLibs >= 3) return rd(0, 'protect', '🛡️', '보강', '활로가 적던 내 돌을 늘려서 튼튼하게 만들었어요.');
    var near2 = enemyAfter.filter(function (gr) { return gr.libs.length === 2; });
    if (near2.length) return rd(0, 'attack', '⚔️', '공격', '상대 돌의 활로를 2개로 줄였어요. 몰아붙이면 잡을 수 있어요.');
    var mv9 = stonesOf(g, n, color), sh = null;
    mv9.forEach(function (q) { var dx = Math.abs((q % n) - x), dy = Math.abs(((q / n) | 0) - y); if (sh) return;
      if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) sh = rd(0, 'knight', '🐴', '눈목자', '내 돌에서 눈목자(말처럼 한 칸 건너 대각선으로 뛴 모양)로 두었어요. 빠르게 퍼지면서도 이어질 수 있는 모양이에요.');
      else if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2)) { var mid = (((q / n) | 0) + y) / 2 * n + (q % n + x) / 2; if (!g.get(mid)) sh = rd(0, 'jump', '🦘', '한 칸 뜀', '내 돌에서 한 칸 떨어져 두었어요. 넓게 벌리지만 끼워 들어올 틈이 있어요.'); }
      else if (dx === 1 && dy === 1) sh = rd(0, 'diag', '◢', '날일자', '내 돌과 대각선(날일자)으로 놓았어요. 가볍게 이어지지만 끊기는 약점을 조심해요.'); });
    if (sh) return sh;
    if (enemyBefore.length === 1 && !mineBefore.length) return rd(0, 'contact', '🤝', '붙임', '상대 돌에 바로 붙였어요. 힘겨루기가 시작돼요.');
    if (ph === 2 && ln[0] <= 3) return rd(0, 'yose', '🏁', '끝내기', '경계를 정리하는 끝내기예요. 큰 곳부터 두는 게 좋아요.');
    if (ph === 0) return rd(0, 'big', '🌅', '큰 자리', '초반의 큰 자리를 차지했어요.');
    if (ph === 1) return rd(0, 'shape', '🧩', '모양 갖추기', '중반에 돌의 모양과 집의 경계를 정리하는 수예요.');
    return rd(0, 'yose', '🏁', '끝내기', '종반에 한 집이라도 큰 곳을 챙기는 수예요.');
  }

  /* 한 판 전체를 다시 두어 보며 내 수를 단계별로 평가해요.
     newGame: 새 판을 돌려주는 함수(접바둑 돌 포함), hist: [{s, pass}], me: 내 돌 색. 점수는 규칙 기반의 "대략"이에요. */
  function report(newGame, hist, me) {
    var g = newGame(), n = g.n, P = [0, 1, 2].map(function (i) { return { ph: i, my: 0, tags: {}, skipCorner: 0, low: 0, ignored: 0, lost: 0, won: 0, hit: 0 }; }), i, h;
    for (i = 0; i < hist.length; i++) {
      h = hist[i]; var color = g.turn, ph = phaseOf(n, movesOf(g)), R = P[ph], mine = color === me, before = g, d = null, atariIds = [];
      if (mine && !h.pass) {
        d = describeMove(g, { x: h.s % n, y: (h.s / n) | 0 }); R.my++; if (d) R.tags[d.kind] = (R.tags[d.kind] || 0) + 1;
        var ln = lineOf(n, h.s);
        if (ph === 0 && ln[0] <= (n >= 13 ? 2 : 1)) R.low++;
        if (ph === 0 && n >= 13 && d && d.kind !== 'corner' && d.kind !== 'capture' && d.kind !== 'atari' && d.kind !== 'escape' && corners(g).some(function (c) { return c.empty; }) && d.kind !== 'kakari') R.skipCorner++;
        allGroups(g).forEach(function (gr) { if (gr.color === me && gr.libs.length === 1) atariIds.push(gr.stones[0]); });
      }
      var rec = h.pass ? g.pass() : g.play(h.s % n, (h.s / n) | 0); if (!rec) break;
      if (mine && !h.pass) {
        atariIds.forEach(function (st) { if (g.get(st) === me) { var gr = g.group(st % n, (st / n) | 0); if (gr && gr.libs.length === 1) R.ignored++; } });
        if (d && (d.kind === 'capture' || d.kind === 'atari' || d.kind === 'attack' || d.kind === 'cut')) R.hit++;
        if (rec.captured && rec.captured.length) R.won += rec.captured.length;
      } else if (!mine && rec.captured && rec.captured.length) R.lost += rec.captured.length;
    }
    var clamp = function (v) { return Math.max(0, Math.min(100, Math.round(v))); }, out = [];
    P.forEach(function (R) {
      if (R.my < 2) return; var notes = [], score = 100, less = null, name = PHASES[R.ph].name;
      if (R.ph === 0) {
        score -= R.low * 18 + Math.min(R.skipCorner, 3) * 10; var big = (R.tags.corner || 0) + (R.tags.kakari || 0) + (R.tags.extend || 0) + (R.tags.fold || 0); if (n >= 13 && !big) score -= 15;
        if (R.tags.corner) notes.push('빈 귀를 ' + R.tags.corner + '번 차지했어요.'); if (R.tags.kakari) notes.push('걸침 ' + R.tags.kakari + '번, 좋은 공격이에요.'); if (R.tags.extend) notes.push('변으로 벌린 수가 ' + R.tags.extend + '번 있어요.');
        if (R.low) notes.push('1~2줄 낮은 곳에 ' + R.low + '번 두었어요. 3~4줄이 효율이 좋아요.'); if (R.skipCorner) notes.push('빈 귀가 남아 있는데 다른 곳에 둔 적이 ' + R.skipCorner + '번 있어요.');
        less = (R.low || R.skipCorner) ? 's3' : 's4';
      } else {
        score -= R.ignored * 25 + Math.min(R.lost, 5) * 8; score += Math.min(R.hit, 4) * 5;
        if (R.hit) notes.push('상대를 단수·공격·끊은 수가 ' + R.hit + '번 있어요.'); if (R.won) notes.push('돌 ' + R.won + '점을 따냈어요.');
        if (R.ignored) notes.push('내 돌이 단수인데 살리지 않은 적이 ' + R.ignored + '번 있어요.'); if (R.lost) notes.push('돌 ' + R.lost + '점을 빼앗겼어요.');
        if (R.ph === 2 && R.tags.yose) notes.push('끝내기를 ' + R.tags.yose + '번 챙겼어요.');
        less = R.ignored ? 's7' : R.lost ? 's6' : R.ph === 1 ? 's8' : 's11';
        if (R.ph === 2 && !R.ignored && !R.lost) less = 's10';
      }
      if (!notes.length) notes.push('특별히 흔들린 곳이 없어요.');
      out.push({ ph: R.ph, name: name, icon: PHASES[R.ph].icon, score: clamp(score), notes: notes, lesson: less, my: R.my });
    });
    var best = out.slice().sort(function (a, b) { return b.score - a.score; })[0], worst = out.slice().sort(function (a, b) { return a.score - b.score; })[0];
    return { phases: out, best: best || null, worst: worst || null };
  }

  var api = { describeMove: describeMove, report: report, lineOf: lineOf, PHASES: PHASES, movesOf: movesOf, phaseOf: phaseOf, phaseRange: phaseRange, corners: corners, sides: sides, weak: weak, allGroups: allGroups, adviceFromLead: adviceFromLead, analyze: analyze };
  root.OKS_GO_STRATEGY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
