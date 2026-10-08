/* 옥쌤의 즐거운 교실 — 오목 규칙 엔진과 컴퓨터 상대 (외부 라이브러리 없음)
   15×15, 흑이 먼저. 가로·세로·대각선으로 같은 색 5개 이상 이으면 이겨요(자유 오목).
   칸 번호 s = y*15 + x (왼쪽 위가 0). 흑 +1, 백 -1. */
(function (root) {
  'use strict';
  var N = 15, CELLS = N * N, DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  function Game(size) { this.n = size || N; this.cells = this.n * this.n; this.board = new Int8Array(this.cells); this.turn = 1; this.stack = []; this.win = null; }
  var G = Game.prototype;
  G.at = function (x, y) { return x < 0 || y < 0 || x >= this.n || y >= this.n ? 2 : this.board[y * this.n + x]; };
  G.line = function (x, y, c) {   // (x,y)를 지나 c색으로 이어진 줄 찾기: 5개 이상이면 그 칸들
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1], cells = [y * this.n + x], k;
      for (k = 1; this.at(x + dx * k, y + dy * k) === c; k++) cells.push((y + dy * k) * this.n + x + dx * k);
      for (k = 1; this.at(x - dx * k, y - dy * k) === c; k++) cells.unshift((y - dy * k) * this.n + x - dx * k);
      if (cells.length >= 5) return cells;
    }
    return null;
  };
  G.place = function (x, y) {
    if (this.win || x < 0 || y < 0 || x >= this.n || y >= this.n || this.board[y * this.n + x]) return null;
    var c = this.turn; this.board[y * this.n + x] = c;
    var rec = { x: x, y: y, color: c, s: y * this.n + x }; this.stack.push(rec); this.turn = -c;
    var line = this.line(x, y, c); if (line) this.win = { color: c, cells: line };
    return rec;
  };
  G.undo = function () { var r = this.stack.pop(); if (!r) return null; this.board[r.s] = 0; this.turn = r.color; this.win = null; return r; };
  G.status = function () { if (this.win) return 'win'; if (this.stack.length >= this.cells) return 'draw'; return 'playing'; };
  G.empty = function () { return this.stack.length === 0; };
  G.copy = function () { var g = new Game(this.n); g.board.set(this.board); g.turn = this.turn; g.stack = this.stack.slice(); g.win = this.win; return g; };
  G.winCells = function (c) {   // c색이 한 수로 5를 만들 수 있는 칸들
    var out = [], s, x, y; for (s = 0; s < this.cells; s++) { if (this.board[s]) continue; x = s % this.n; y = (s / this.n) | 0; this.board[s] = c; if (this.line(x, y, c)) out.push(s); this.board[s] = 0; }
    return out;
  };
  /* 한 줄의 모양을 글자로: x=내 돌, o=상대 돌·벽, .=빈칸. 가운데(index 4)가 방금 둔 칸 */
  G.window = function (x, y, c, d) {
    var dx = DIRS[d][0], dy = DIRS[d][1], s = '', k, v;
    for (k = -4; k <= 4; k++) { v = this.at(x + dx * k, y + dy * k); s += k === 0 ? 'x' : v === c ? 'x' : v === 0 ? '.' : 'o'; }
    return s;
  };
  var RE = {
    five: /xxxxx/, open4: /\.xxxx\./,
    four: /xxxx\.|\.xxxx|x\.xxx|xxx\.x|xx\.xx/,
    open3: /\.\.xxx\.|\.xxx\.\.|\.xx\.x\.|\.x\.xx\./,
    three: /xxx\.\.|\.\.xxx|xx\.x\.|\.x\.xx|xx\.\.x|x\.\.xx|\.xx\.x|x\.xx\.|x\.x\.x/,
    open2: /\.\.xx\.\.|\.x\.x\.|\.\.x\.x\.|\.x\.x\.\./, two: /xx\.\.\.|\.\.\.xx|x\.x\.\.|\.\.x\.x|x\.\.x\./
  };
  /* c색이 (x,y)에 둔다고 가정했을 때 만드는 모양 개수 (칸은 비어 있어야 함) */
  G.shapes = function (x, y, c) {
    var r = { five: 0, open4: 0, four: 0, open3: 0, three: 0, open2: 0, two: 0 }, d, w, rest;
    for (d = 0; d < 4; d++) {
      w = this.window(x, y, c, d);
      // 가운데 칸을 포함한 모양만 센다 (가운데 x를 가린 모양과 비교)
      var base = w.slice(0, 4) + '.' + w.slice(5);
      if (RE.five.test(w) && hasCenter(w, RE.five)) r.five++;
      else if (hasCenter(w, RE.open4)) r.open4++;
      else if (hasCenter(w, RE.four)) r.four++;
      else if (hasCenter(w, RE.open3)) r.open3++;
      else if (hasCenter(w, RE.three)) r.three++;
      else if (hasCenter(w, RE.open2)) r.open2++;
      else if (hasCenter(w, RE.two)) r.two++;
    }
    return r;
  };
  function hasCenter(w, re) {   // 정규식에 걸리는 부분 중 가운데(4번)를 포함하는 것이 있는가
    var g = new RegExp(re.source, 'g'), m;
    while ((m = g.exec(w))) { if (m.index <= 4 && m.index + m[0].length > 4) return true; g.lastIndex = m.index + 1; }
    return false;
  }
  var W = { five: 100000, open4: 12000, four: 1500, open3: 1500, three: 140, open2: 120, two: 12 };
  G.cellScore = function (x, y, c) {
    var sh = this.shapes(x, y, c), v = sh.five * W.five + sh.open4 * W.open4 + sh.four * W.four + sh.open3 * W.open3 + sh.three * W.three + sh.open2 * W.open2 + sh.two * W.two;
    if (sh.four >= 2 || (sh.four >= 1 && sh.open3 >= 1) || sh.open3 >= 2) v += 14000;   // 사사·사삼·삼삼은 거의 이긴 수
    return v;
  };
  G.candidates = function (rad) {
    rad = rad || 2; var out = [], seen = new Uint8Array(this.cells), i, s, x, y, dx, dy;
    var any = false; for (i = 0; i < this.cells; i++) if (this.board[i]) { any = true; break; }
    if (!any) return [((this.n >> 1) * this.n) + (this.n >> 1)];
    for (i = 0; i < this.cells; i++) { if (!this.board[i]) continue; x = i % this.n; y = (i / this.n) | 0;
      for (dy = -rad; dy <= rad; dy++) for (dx = -rad; dx <= rad; dx++) { var nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= this.n || ny >= this.n) continue; s = ny * this.n + nx; if (!this.board[s] && !seen[s]) { seen[s] = 1; out.push(s); } } }
    return out;
  };
  /* 지금 둘 차례 쪽이 알아야 할 것: 내가 이길 수 있는 칸, 막아야 하는 칸 */
  G.threats = function () {
    var me = this.turn, win = this.winCells(me), block = this.winCells(-me), out = { win: win, block: block, openThree: [], fourOpp: [] };
    var cs = this.candidates(2);
    cs.forEach(function (s) { }, this);
    return out;
  };
  /* 상대(-c)가 "열린 4"나 "4·3"을 만들 수 있는 칸 (c 쪽이 미리 막아야 할 칸) */
  G.forkCells = function (c) {
    var out = [], cs = this.candidates(2), i, s, x, y, sh;
    for (i = 0; i < cs.length; i++) { s = cs[i]; x = s % this.n; y = (s / this.n) | 0; sh = this.shapes(x, y, c); if (sh.open4 || sh.four >= 2 || (sh.four && sh.open3) || sh.open3 >= 2) out.push(s); }
    return out;
  };

  /* ---- 컴퓨터 ---- */
  function evalBoard(g, me) {   // 판 전체 점수(내 쪽에서 본)
    var total = 0, s, x, y, c; var cs = g.candidates(2);
    for (var i = 0; i < cs.length; i++) { s = cs[i]; x = s % g.n; y = (s / g.n) | 0; total += g.cellScore(x, y, me) * 0.5 - g.cellScore(x, y, -me) * 0.5; }
    return total;
  }
  function ranked(g, me, limit, noise) {
    var cs = g.candidates(2), out = [], i, s, x, y;
    for (i = 0; i < cs.length; i++) { s = cs[i]; x = s % g.n; y = (s / g.n) | 0; var a = g.cellScore(x, y, me), d = g.cellScore(x, y, -me); out.push({ s: s, a: a, d: d, v: a + d * 0.92 + (noise ? Math.random() * noise : 0) }); }
    out.sort(function (p, q) { return q.v - p.v; }); return limit ? out.slice(0, limit) : out;
  }
  function must(g, me) {   // 이기거나, 반드시 막아야 하는 칸
    var w = g.winCells(me); if (w.length) return w[0]; var b = g.winCells(-me); if (b.length) return b[0]; return -1;
  }
  function search(g, me, depth, alpha, beta, ply) {   // me 관점의 알파-베타
    if (g.win) return g.win.color === me ? 100000 - ply : -100000 + ply;
    if (depth === 0 || g.stack.length >= g.cells) return evalBoard(g, me);
    var turn = g.turn, list = ranked(g, turn, depth >= 3 ? 7 : 6, 0), i, best, v;
    if (turn === me) { best = -Infinity; for (i = 0; i < list.length; i++) { var x = list[i].s % g.n, y = (list[i].s / g.n) | 0; g.place(x, y); v = search(g, me, depth - 1, alpha, beta, ply + 1); g.undo(); if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break; } return best; }
    best = Infinity; for (i = 0; i < list.length; i++) { var x2 = list[i].s % g.n, y2 = (list[i].s / g.n) | 0; g.place(x2, y2); v = search(g, me, depth - 1, alpha, beta, ply + 1); g.undo(); if (v < best) best = v; if (v < beta) beta = v; if (alpha >= beta) break; } return best;
  }
  var ai = {
    choose: function (g, level) {
      var me = g.turn, n = g.n, mid = (n >> 1) * n + (n >> 1);
      if (!g.stack.length) return { x: n >> 1, y: n >> 1, s: mid };
      var mv = must(g, me), pick, list;
      var mk = function (s) { return { x: s % n, y: (s / n) | 0, s: s }; };
      if (level <= 1) { if (mv >= 0 && Math.random() < 0.6) return mk(mv); list = g.candidates(1); return mk(list[(Math.random() * list.length) | 0]); }
      if (level === 2) { if (mv >= 0 && Math.random() < 0.8) return mk(mv); list = ranked(g, me, 8, 900); return mk(list[(Math.random() * Math.min(3, list.length)) | 0].s); }
      if (mv >= 0) return mk(mv);
      if (level === 3) { list = ranked(g, me, 3, 80); return mk(list[0].s); }
      list = ranked(g, me, level >= 5 ? 9 : 7, 0);
      if (list[0].a >= 14000 || list[0].d >= 14000) return mk(list[0].s);   // 이미 크게 앞선 수
      var depth = level === 4 ? 2 : 3, bestV = -Infinity, bestS = list[0].s, i;
      for (i = 0; i < list.length; i++) { var x = list[i].s % n, y = (list[i].s / n) | 0; g.place(x, y); var v = search(g, me, depth - 1, -Infinity, Infinity, 1) + list[i].v * 0.15; g.undo(); if (v > bestV) { bestV = v; bestS = list[i].s; } }
      return mk(bestS);
    },
    hint: function (g) { var me = g.turn, mv = must(g, me); if (mv >= 0) return { x: mv % g.n, y: (mv / g.n) | 0, s: mv, why: g.winCells(me).indexOf(mv) >= 0 ? 'win' : 'block' }; var r = ai.choose(g.copy(), 4); r.why = 'good'; return r; }
  };

  /* ---- 연습 문제 만들기: 모양 틀을 뒤집고 돌려 놓고, 규칙 엔진으로 정답을 직접 계산해 확인해요 ---- */
  var SYM = [function (x, y) { return [x, y]; }, function (x, y) { return [-x, y]; }, function (x, y) { return [x, -y]; }, function (x, y) { return [-x, -y]; },
    function (x, y) { return [y, x]; }, function (x, y) { return [-y, x]; }, function (x, y) { return [y, -x]; }, function (x, y) { return [-y, -x]; },
    function (x, y) { return [x + y, x - y]; }, function (x, y) { return [-x - y, x - y]; }, function (x, y) { return [x + y, y - x]; }, function (x, y) { return [-x - y, y - x]; }];
  var TPL = {
    1: [{ b: [[0, 0], [1, 0], [2, 0], [3, 0]], w: [[-1, 0]] }, { b: [[0, 0], [1, 0], [3, 0], [4, 0]], w: [[-1, 0]] }, { b: [[0, 0], [1, 0], [2, 0], [3, 0]], w: [] }, { b: [[0, 0], [2, 0], [3, 0], [4, 0]], w: [[5, 0]] }],
    2: [{ w: [[0, 0], [1, 0], [2, 0], [3, 0]], b: [[-1, 0]] }, { w: [[0, 0], [1, 0], [3, 0], [4, 0]], b: [[-1, 0]] }, { w: [[0, 0], [1, 0], [2, 0], [4, 0]], b: [[5, 0]] }],
    3: [{ b: [[0, 0], [1, 0], [2, 0]], w: [] }, { b: [[0, 0], [2, 0], [3, 0]], w: [] }, { b: [[0, 0], [1, 0], [3, 0]], w: [] }],
    4: [{ w: [[0, 0], [1, 0], [2, 0]], b: [] }, { w: [[0, 0], [2, 0], [3, 0]], b: [] }],
    5: [{ b: [[0, 0], [1, 0], [2, 0], [3, 1], [3, 2]], w: [[-1, 0]] }, { b: [[0, 0], [1, 0], [2, 1], [2, 2]], w: [] }, { b: [[0, 0], [1, 0], [3, 1], [4, 2]], w: [[-1, 0]] }]
  };
  function solve(g, type) {   // 정답 칸들을 규칙 엔진으로 계산. 문제가 안 맞으면 null
    var n = g.n, out = [], s, x, y, sh, w1 = g.winCells(1), w2 = g.winCells(-1), i;
    if (type === 1) { if (!w1.length || w2.length) return null; return w1; }
    if (type === 2) { if (w1.length || w2.length !== 1) return null; return w2; }
    if (w1.length || w2.length) return null;
    var cs = g.candidates(3);
    if (type === 3 || type === 5) {
      for (i = 0; i < cs.length; i++) { s = cs[i]; x = s % n; y = (s / n) | 0; sh = g.shapes(x, y, 1);
        if (type === 3 ? sh.open4 > 0 : (sh.open4 || sh.four >= 2 || (sh.four && sh.open3) || sh.open3 >= 2)) out.push(s); }
      if (type === 5) { var simple = out.filter(function (c) { return g.shapes(c % n, (c / n) | 0, 1).open4 > 0; }); if (simple.length) return null; }
      return out.length && out.length <= 6 ? out : null;
    }
    if (type === 4) {   // 검은 돌이 어디에 두어야 흰 돌이 열린 4를 못 만드는가
      for (i = 0; i < cs.length; i++) { s = cs[i]; x = s % n; y = (s / n) | 0; g.board[s] = 1; g.stack.push({ x: x, y: y, color: 1, s: s }); var bad = false, c2 = g.candidates(3), j;
        for (j = 0; j < c2.length && !bad; j++) { var t = c2[j]; if (g.board[t]) continue; var sh2 = g.shapes(t % n, (t / n) | 0, -1); if (sh2.open4 > 0 || sh2.five > 0) bad = true; }
        g.stack.pop(); g.board[s] = 0; if (!bad) out.push(s); }
      return out.length && out.length <= 4 ? out : null;
    }
    return null;
  }
  function puzzle(type, rnd) {
    rnd = rnd || Math.random; var n = N, tries, pick = function (a) { return a[(rnd() * a.length) | 0]; };
    if (!type) type = 1 + ((rnd() * 5) | 0);
    for (tries = 0; tries < 1500; tries++) {
      var t = pick(TPL[type]), f = SYM[(rnd() * 12) | 0], g = new Game(n);
      var pts = t.b.map(function (p) { return f(p[0], p[1]); }), pw = t.w.map(function (p) { return f(p[0], p[1]); });
      var all = pts.concat(pw), mnx = 99, mxx = -99, mny = 99, mxy = -99; all.forEach(function (p) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); });
      var lox = 3 - mnx, hix = n - 4 - mxx, loy = 3 - mny, hiy = n - 4 - mxy; if (hix < lox || hiy < loy) continue;
      var ox = lox + ((rnd() * (hix - lox + 1)) | 0), oy = loy + ((rnd() * (hiy - loy + 1)) | 0);
      pts.forEach(function (p) { g.board[(p[1] + oy) * n + p[0] + ox] = 1; }); pw.forEach(function (p) { g.board[(p[1] + oy) * n + p[0] + ox] = -1; });
      g.turn = 1; if (!solve(g, type)) continue;
      var k = 1 + ((rnd() * 4) | 0), a, cx = ox + (mnx + mxx) / 2, cy = oy + (mny + mxy) / 2, col = rnd() < 0.5 ? 1 : -1;
      for (a = 0; a < 40 && k > 0; a++) {   // 방해 돌: 정답이 그대로일 때만 놓아요
        var x = Math.round(cx + (rnd() * 12 - 6)), y = Math.round(cy + (rnd() * 12 - 6)); if (x < 0 || y < 0 || x >= n || y >= n || g.board[y * n + x]) continue;
        g.board[y * n + x] = col; var sol0 = solve(g, type), shx = g.shapes(x, y, col);
        if (!sol0 || g.line(x, y, col) || shx.three + shx.open3 + shx.four + shx.open4) { g.board[y * n + x] = 0; continue; }
        col = -col; k--;
      }
      var sol = solve(g, type); if (!sol) continue;
      var black = [], white = []; for (var s = 0; s < g.cells; s++) { if (g.board[s] > 0) black.push(s); else if (g.board[s] < 0) white.push(s); }
      return { type: type, black: black, white: white, sol: sol };
    }
    return null;
  }
  root.OKS_OMOK = { Game: Game, ai: ai, N: N, DIRS: DIRS, puzzle: puzzle, solvePuzzle: solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.OKS_OMOK;
})(typeof window !== 'undefined' ? window : globalThis);
