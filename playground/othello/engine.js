/* 옥쌤의 즐거운 교실 — 오셀로 규칙 엔진과 컴퓨터 상대 (외부 라이브러리 없음)
   8×8, 칸 번호 s = 줄*8 + 칸 (왼쪽 위가 0). 검은 돌 +1이 먼저, 흰 돌 -1.
   둘 곳이 없으면 자동으로 차례를 넘기고, 둘 다 둘 곳이 없으면 끝나요. */
(function (root) {
  'use strict';
  var DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  var CORNERS = [0, 7, 56, 63], X_SQ = { 9: 0, 14: 7, 49: 56, 54: 63 }, C_SQ = { 1: 0, 8: 0, 6: 7, 15: 7, 48: 56, 57: 56, 55: 63, 62: 63 };
  function Game() { this.board = new Int8Array(64); this.board[27] = -1; this.board[36] = -1; this.board[28] = 1; this.board[35] = 1; this.turn = 1; this.stack = []; }
  var G = Game.prototype;
  G.flips = function (s, c) {
    if (this.board[s]) return []; var r0 = (s >> 3), c0 = s & 7, out = [], d, line, r, k, v;
    for (d = 0; d < 8; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1]; line = []; r = r0 + dy; k = c0 + dx;
      while (r >= 0 && r < 8 && k >= 0 && k < 8) { v = this.board[r * 8 + k]; if (v === -c) { line.push(r * 8 + k); r += dy; k += dx; } else { if (v === c && line.length) out = out.concat(line); break; } }
    }
    return out;
  };
  G.legal = function (s, c) { c = c || this.turn; if (this.board[s]) return false; var r0 = s >> 3, c0 = s & 7, d, r, k, n, v;
    for (d = 0; d < 8; d++) { var dx = DIRS[d][0], dy = DIRS[d][1]; r = r0 + dy; k = c0 + dx; n = 0;
      while (r >= 0 && r < 8 && k >= 0 && k < 8) { v = this.board[r * 8 + k]; if (v === -c) { n++; r += dy; k += dx; } else { if (v === c && n) return true; break; } } }
    return false; };
  G.moves = function (c) { c = c || this.turn; var out = [], s; for (s = 0; s < 64; s++) if (!this.board[s] && this.legal(s, c)) out.push(s); return out; };
  G.play = function (s) {
    var c = this.turn, fl = this.flips(s, c); if (!fl.length) return null;
    this.board[s] = c; for (var i = 0; i < fl.length; i++) this.board[fl[i]] = c;
    var rec = { s: s, color: c, flips: fl, passed: 0 }; this.stack.push(rec); this.turn = -c;
    if (!this.moves(-c).length && this.moves(c).length) { rec.passed = -c; this.turn = c; }   // 상대가 둘 곳이 없어 넘겨요
    return rec;
  };
  G.undo = function () { var r = this.stack.pop(); if (!r) return null; this.board[r.s] = 0; for (var i = 0; i < r.flips.length; i++) this.board[r.flips[i]] = -r.color; this.turn = r.color; return r; };
  G.over = function () { return !this.moves(this.turn).length; };   // 차례인 쪽이 둘 곳이 없으면(자동 넘김 뒤에도) 끝
  G.count = function () { var b = 0, w = 0, s; for (s = 0; s < 64; s++) { if (this.board[s] > 0) b++; else if (this.board[s] < 0) w++; } return { b: b, w: w, empty: 64 - b - w }; };
  G.copy = function () { var g = new Game(); g.board.set(this.board); g.turn = this.turn; g.stack = this.stack.slice(); return g; };
  G.winner = function () { var c = this.count(); return c.b > c.w ? 1 : c.w > c.b ? -1 : 0; };
  /* 만든 규칙 검사용: 몇 수 앞까지 갈 수 있는 길의 수 */
  G.perft = function (d) { if (d === 0) return 1; var ms = this.moves(), n = 0, i; if (!ms.length) return 1; for (i = 0; i < ms.length; i++) { this.play(ms[i]); n += this.perft(d - 1); this.undo(); } return n; };

  /* ---- 컴퓨터 ---- */
  var WT = [100, -22, 10, 5, 5, 10, -22, 100, -22, -50, -2, -2, -2, -2, -50, -22, 10, -2, 1, 1, 1, 1, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5, 5, -2, 1, 0, 0, 1, -2, 5, 10, -2, 1, 1, 1, 1, -2, 10, -22, -50, -2, -2, -2, -2, -50, -22, 100, -22, 10, 5, 5, 10, -22, 100];
  function evalPos(g, me) {
    var v = 0, s, w, b = g.board;
    for (s = 0; s < 64; s++) { if (!b[s]) continue; w = WT[s];
      if (w < 0 && (X_SQ[s] != null || C_SQ[s] != null)) { var cn = X_SQ[s] != null ? X_SQ[s] : C_SQ[s]; if (b[cn]) w = 3; }   // 구석이 이미 찼으면 옆 칸은 괜찮아요
      v += w * b[s] * me; }
    var mm = g.moves(me).length, om = g.moves(-me).length; v += (mm - om) * 7;
    var cnt = g.count(); if (cnt.empty <= 14) v += (me > 0 ? cnt.b - cnt.w : cnt.w - cnt.b) * (cnt.empty <= 8 ? 6 : 2);
    return v;
  }
  function order(g, ms) { return ms.slice().sort(function (a, b) { return WT[b] - WT[a]; }); }
  function ab(g, me, depth, alpha, beta, exact) {
    var ms = g.moves(g.turn); if (!ms.length) { var c = g.count(), d = me > 0 ? c.b - c.w : c.w - c.b; return d > 0 ? 10000 + d : d < 0 ? -10000 + d : 0; }
    if (depth <= 0 && !exact) return evalPos(g, me);
    ms = order(g, ms); var i, v, best;
    if (g.turn === me) { best = -Infinity; for (i = 0; i < ms.length; i++) { g.play(ms[i]); v = ab(g, me, depth - 1, alpha, beta, exact); g.undo(); if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break; } return best; }
    best = Infinity; for (i = 0; i < ms.length; i++) { g.play(ms[i]); v = ab(g, me, depth - 1, alpha, beta, exact); g.undo(); if (v < best) best = v; if (v < beta) beta = v; if (alpha >= beta) break; } return best;
  }
  var ai = {
    choose: function (g, level) {
      var ms = g.moves(); if (!ms.length) return null; var me = g.turn, i, best = ms[0], bv = -Infinity, v;
      if (level <= 1) { return { s: ms[(Math.random() * ms.length) | 0] }; }
      if (level === 2) { var mx = -1; ms.forEach(function (s) { var n = g.flips(s, me).length + Math.random() * 0.9 + (CORNERS.indexOf(s) >= 0 ? 6 : 0); if (n > mx) { mx = n; best = s; } }); return { s: best }; }
      var empties = g.count().empty, exact = (level >= 5 && empties <= 11) || (level === 4 && empties <= 8), depth = level === 3 ? 1 : level === 4 ? 3 : 5;
      ms = order(g, ms);
      for (i = 0; i < ms.length; i++) { g.play(ms[i]); v = ab(g, me, exact ? 99 : depth - 1, -Infinity, Infinity, exact) + (level === 3 ? Math.random() * 14 : 0); g.undo(); if (v > bv) { bv = v; best = ms[i]; } }
      return { s: best };
    },
    hint: function (g) {
      var r = ai.choose(g.copy(), 4), s = r.s, me = g.turn, n = g.flips(s, me).length, why;
      if (CORNERS.indexOf(s) >= 0) why = 'corner'; else { var h = g.copy(); h.play(s); var om = h.turn === me ? 99 : h.moves(h.turn).length; why = om <= 3 ? 'mobility' : n >= 4 ? 'many' : (s < 8 || s > 55 || (s & 7) === 0 || (s & 7) === 7) ? 'edge' : 'good'; }
      return { s: s, why: why, flips: n };
    }
  };

  /* ---- 연습 문제: 무작위로 진행한 판에서 조건에 맞는 장면을 찾고, 정답을 엔진으로 계산해요 ---- */
  function dirCount(g, s, c) { var r0 = s >> 3, c0 = s & 7, d, r, k, n, v, cnt = 0;
    for (d = 0; d < 8; d++) { var dx = DIRS[d][0], dy = DIRS[d][1]; r = r0 + dy; k = c0 + dx; n = 0;
      while (r >= 0 && r < 8 && k >= 0 && k < 8) { v = g.board[r * 8 + k]; if (v === -c) { n++; r += dy; k += dx; } else { if (v === c && n) cnt++; break; } } }
    return cnt; }
  function oppMob(g, s) { var h = g.copy(); h.play(s); return h.turn === g.turn ? 99 : h.moves(h.turn).length; }
  function judge(g, type) {   // 정답 칸들(없으면 null)
    var c = g.turn, ms = g.moves(c), i; if (ms.length < 2 || ms.length > 9) return null;
    if (type === 1) { return ms.length <= 4 && ms.every(function (m) { return g.flips(m, c).length <= 3; }) ? ms : null; }
    if (type === 2) { var multi = ms.filter(function (m) { return dirCount(g, m, c) >= 2; }); return multi.length && multi.length < ms.length ? multi : null; }
    if (type === 3) { var cor = ms.filter(function (m) { return CORNERS.indexOf(m) >= 0; }); if (cor.length !== 1) return null; var most = Math.max.apply(null, ms.map(function (m) { return g.flips(m, c).length; })); return g.flips(cor[0], c).length < most ? cor : null; }
    if (type === 4) { var risky = ms.filter(function (m) { var cn = X_SQ[m] != null ? X_SQ[m] : C_SQ[m]; return cn != null && !g.board[cn]; }), safe = ms.filter(function (m) { return risky.indexOf(m) < 0; });
      var hasX = risky.some(function (m) { return X_SQ[m] != null; }); return hasX && safe.length && risky.length >= 1 && g.moves(c).filter(function (m) { return CORNERS.indexOf(m) >= 0; }).length === 0 ? safe : null; }
    if (type === 5) { var vals = ms.map(function (m) { return oppMob(g, m); }), mn = Math.min.apply(null, vals), sorted = vals.slice().sort(function (a, b) { return a - b; }); if (ms.length < 3 || mn > 3 || sorted[1] - sorted[0] < 2) return null;
      return ms.filter(function (m, i2) { return vals[i2] === mn; }); }
    return null;
  }
  function puzzle(type, rnd) {
    rnd = rnd || Math.random; if (!type) type = 1 + ((rnd() * 5) | 0);
    for (var tries = 0; tries < 4000; tries++) {
      var g = new Game(), plies = (type === 1 ? 2 : 6) + ((rnd() * (type === 1 ? 10 : 40)) | 0), i;
      for (i = 0; i < plies && !g.over(); i++) { var ms = g.moves(); g.play(ms[(rnd() * ms.length) | 0]); }
      if (g.over()) continue; var sol = judge(g, type);
      if (sol) return { type: type, board: Array.prototype.slice.call(g.board), turn: g.turn, sol: sol };
    }
    return null;
  }
  root.OKS_OTHELLO = { puzzle: puzzle, judge: judge, dirCount: dirCount, Game: Game, ai: ai, CORNERS: CORNERS, X_SQ: X_SQ, C_SQ: C_SQ, WT: WT };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.OKS_OTHELLO;
})(typeof window !== 'undefined' ? window : globalThis);
