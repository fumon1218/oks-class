/* 옥쌤의 즐거운 교실 — 장기 규칙 엔진과 컴퓨터 상대 (외부 라이브러리 없음)
   칸 번호: s = 줄*9 + 칸. 줄 0이 초(楚) 쪽 맨 아래, 줄 9가 한(漢) 쪽 맨 위. 칸 0~8은 왼쪽→오른쪽.
   말: 초 +1~+7, 한 -1~-7 (졸/병·마·상·차·포·사·궁).
   사용: var g = new OKS_JANGGI.Game();  g.moves(), g.move(from,to), g.pass(), g.undo(), g.status(), g.inCheck(),
         OKS_JANGGI.ai.choose(g, level 1~5), OKS_JANGGI.ai.hint(g)
   단순화한 규칙: 두 궁이 마주 보게 되는 수(빅장)는 둘 수 없어요. 장군을 피할 수 없으면 외통(끝)이에요.
   움직일 수 있는 수가 하나도 없고 장군도 아니면 한 수 쉬어요. 너무 길어지면 점수(차13 포7 마5 상3 사3 졸2, 한은 +1.5)로 승패를 가려요. */
(function (root) {
  'use strict';
  var P = 1, H = 2, E = 3, R = 4, C = 5, A = 6, K = 7;
  var W = 9, HGT = 10, N = 90;
  var NAME = ['', '졸', '마', '상', '차', '포', '사', '궁'];
  var LETTER = { p: P, h: H, e: E, r: R, c: C, a: A, k: K };
  var LET = ['', 'p', 'h', 'e', 'r', 'c', 'a', 'k'];
  var VAL = [0, 200, 500, 300, 1300, 700, 300, 0];
  var PT = [0, 2, 5, 3, 13, 7, 3, 0];
  var ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]], DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var SETUPS = { left: [E, H, E, H], right: [H, E, H, E], inner: [H, E, E, H], outer: [E, H, H, E] };  // 칸 1·2·6·7
  var SETUP_KO = { left: '왼상', right: '오른상', inner: '안상', outer: '바깥상' };
  var MAX_PLY = 220, KOMI = 1.5;

  function inB(f, r) { return f >= 0 && f < W && r >= 0 && r < HGT; }
  /* 궁성: 칸 3~5, 줄 0~2(초) · 7~9(한). 대각선이 있는 점: 모서리 4곳과 가운데 */
  function palaceOf(f, r) { if (f < 3 || f > 5 || r < 0 || r > 9) return 0; if (r <= 2) return 1; if (r >= 7) return -1; return 0; }
  function isDiagPt(f, r) { var p = palaceOf(f, r); if (!p) return false; var lf = f - 3, lr = p > 0 ? r : r - 7; return ((lf + lr) & 1) === 0; }
  function diagEdge(f, r, f2, r2) {   // 두 점이 궁성 대각선으로 이어졌는가 (모서리↔가운데)
    return isDiagPt(f, r) && isDiagPt(f2, r2) && palaceOf(f, r) === palaceOf(f2, r2) && Math.abs(f - f2) === 1 && Math.abs(r - r2) === 1;
  }

  function Game(rows, turn) {
    this.board = new Int8Array(N); this.turn = 1; this.stack = []; this.keys = []; this.ks = [-1, -1]; this.free = false;
    if (rows && rows.indexOf('/') >= 0) this.load(rows, turn); else this.setup(rows, turn);
  }
  var G = Game.prototype;
  G.setup = function (cho, han) {
    cho = cho || 'inner'; han = han || 'inner';
    var rows = [];
    function back(set, r, mirror) {
      var row = '.'.repeat(9).split(''), s = SETUPS[set];
      var put = function (f, t) { row[mirror ? 8 - f : f] = t; };
      put(0, R); put(8, R); put(1, s[0]); put(2, s[1]); put(6, s[2]); put(7, s[3]); put(3, A); put(5, A);
      return row.map(function (t) { return typeof t === 'number' ? t : 0; });
    }
    var b = this.board; b.fill(0);
    var rc = back(cho, 0, false), rh = back(han, 9, true);
    for (var f = 0; f < 9; f++) { b[f] = rc[f]; b[81 + f] = -rh[f]; }
    b[4 + 9] = K; b[4 + 9 * 8] = -K;
    b[1 + 9 * 2] = C; b[7 + 9 * 2] = C; b[1 + 9 * 7] = -C; b[7 + 9 * 7] = -C;
    for (f = 0; f < 9; f += 2) { b[f + 27] = P; b[f + 54] = -P; }
    this.turn = 1; this.stack = []; this.keys = []; this.findKings(); this.keys.push(this.key());
  };
  G.findKings = function () { this.ks = [-1, -1]; for (var s = 0; s < N; s++) { if (this.board[s] === K) this.ks[0] = s; else if (this.board[s] === -K) this.ks[1] = s; } };
  G.load = function (str, turn) {   // "rnr.../..../" 위쪽(한) 줄부터, 대문자=초 소문자=한, 점=빈칸. 끝에 ' c' 또는 ' h'
    var parts = str.split(' '), rows = parts[0].split('/'); this.board.fill(0);
    for (var i = 0; i < 10; i++) { var r = 9 - i, row = rows[i]; for (var f = 0; f < 9; f++) { var ch = row[f]; if (!ch || ch === '.') continue; var low = ch.toLowerCase(); this.board[r * 9 + f] = ch === low ? -LETTER[low] : LETTER[low]; } }
    this.turn = (turn || parts[1] || 'c') === 'h' || turn === -1 ? -1 : 1; this.stack = []; this.keys = []; this.findKings(); this.keys.push(this.key());
  };
  G.fen = function () {
    var out = [];
    for (var r = 9; r >= 0; r--) { var row = ''; for (var f = 0; f < 9; f++) { var v = this.board[r * 9 + f]; row += v === 0 ? '.' : v > 0 ? LET[v].toUpperCase() : LET[-v]; } out.push(row); }
    return out.join('/') + ' ' + (this.turn > 0 ? 'c' : 'h');
  };
  G.key = function () { return this.fen(); };

  /* ---- 수 만들기(규칙에 맞는 모든 칸, 장군 확인 전) ---- */
  function gen(g, side, out) {
    var b = g.board, s, v, t, f, r, i, d, nf, nr, to, tv;
    for (s = 0; s < N; s++) {
      v = b[s]; if (!v || (v > 0) !== (side > 0)) continue;
      t = v > 0 ? v : -v; f = s % 9; r = (s / 9) | 0;
      switch (t) {
        case P:
          var fw = side > 0 ? 1 : -1;
          add(f, r + fw); add(f - 1, r); add(f + 1, r);
          if (isDiagPt(f, r)) { for (i = 0; i < 2; i++) { nf = f + (i ? 1 : -1); if (diagEdge(f, r, nf, r + fw)) add(nf, r + fw); } }
          break;
        case H:
          for (i = 0; i < 4; i++) {
            d = ORTH[i]; nf = f + d[0]; nr = r + d[1]; if (!inB(nf, nr) || b[nr * 9 + nf]) continue;
            for (var k = -1; k <= 1; k += 2) { add(nf + d[0] + (d[0] ? 0 : k), nr + d[1] + (d[1] ? 0 : k)); }
          }
          break;
        case E:
          for (i = 0; i < 4; i++) {
            d = ORTH[i]; nf = f + d[0]; nr = r + d[1]; if (!inB(nf, nr) || b[nr * 9 + nf]) continue;
            for (var kk = -1; kk <= 1; kk += 2) {
              var dx = d[0] + (d[0] ? 0 : kk), dy = d[1] + (d[1] ? 0 : kk), mf = nf + dx, mr = nr + dy;
              if (!inB(mf, mr) || b[mr * 9 + mf]) continue; add(mf + dx, mr + dy);
            }
          }
          break;
        case R:
          for (i = 0; i < 4; i++) { d = ORTH[i]; nf = f + d[0]; nr = r + d[1]; while (inB(nf, nr)) { if (!add(nf, nr)) break; nf += d[0]; nr += d[1]; } }
          if (isDiagPt(f, r)) for (i = 0; i < 4; i++) { d = DIAG[i]; nf = f + d[0]; nr = r + d[1]; while (inB(nf, nr) && diagEdge(nf - d[0], nr - d[1], nf, nr)) { if (!add(nf, nr)) break; nf += d[0]; nr += d[1]; } }
          break;
        case C:
          for (i = 0; i < 4; i++) {
            d = ORTH[i]; nf = f + d[0]; nr = r + d[1];
            while (inB(nf, nr) && !b[nr * 9 + nf]) { nf += d[0]; nr += d[1]; }
            if (!inB(nf, nr) || (b[nr * 9 + nf] > 0 ? b[nr * 9 + nf] : -b[nr * 9 + nf]) === C) continue;
            nf += d[0]; nr += d[1];
            while (inB(nf, nr)) { to = nr * 9 + nf; tv = b[to]; if (!tv) { push(to, 0); } else { if ((tv > 0) !== (side > 0) && (tv > 0 ? tv : -tv) !== C) push(to, tv); break; } nf += d[0]; nr += d[1]; }
          }
          if (isDiagPt(f, r) && !(palaceOf(f, r) && isCenter(f, r))) {
            for (i = 0; i < 4; i++) {
              d = DIAG[i]; var cf = f + d[0], cr = r + d[1], ef = f + 2 * d[0], er = r + 2 * d[1];
              if (!diagEdge(f, r, cf, cr) || !isCenter(cf, cr) || !inB(ef, er) || !diagEdge(cf, cr, ef, er)) continue;
              var sc = b[cr * 9 + cf]; if (!sc || (sc > 0 ? sc : -sc) === C) continue;
              to = er * 9 + ef; tv = b[to]; if (!tv || ((tv > 0) !== (side > 0) && (tv > 0 ? tv : -tv) !== C)) push(to, tv);
            }
          }
          break;
        default: // 사, 궁: 자기 궁성 안에서 한 칸 (대각선 줄 포함)
          var pal = side > 0 ? 1 : -1;
          for (i = 0; i < 4; i++) { d = ORTH[i]; addPal(f + d[0], r + d[1]); }
          if (isDiagPt(f, r)) for (i = 0; i < 4; i++) { d = DIAG[i]; if (diagEdge(f, r, f + d[0], r + d[1])) addPal(f + d[0], r + d[1]); }
      }
    }
    return out;
    function isCenter(x, y) { return x === 4 && (y === 1 || y === 8); }
    function push(to, tv) { out.push({ from: s, to: to, piece: v, captured: tv }); }
    function add(x, y) {   // 슬라이드용: 빈칸이면 true(계속), 상대 말이면 잡고 false
      if (!inB(x, y)) return false; var q = y * 9 + x, c = b[q];
      if (!c) { push(q, 0); return true; }
      if ((c > 0) !== (side > 0)) push(q, c); return false;
    }
    function addPal(x, y) { if (palaceOf(x, y) !== pal) return; var q = y * 9 + x, c = b[q]; if (!c || (c > 0) !== (side > 0)) push(q, c); }
  }
  function genSafe(g, side) { return gen(g, side, []); }

  /* ---- 두기 · 물리기 ---- */
  G.apply = function (m) {
    var b = this.board; b[m.to] = m.piece; b[m.from] = 0;
    if (m.piece === K) this.ks[0] = m.to; else if (m.piece === -K) this.ks[1] = m.to;
    if (m.captured === K) this.ks[0] = -1; else if (m.captured === -K) this.ks[1] = -1;
    this.turn = -this.turn;
  };
  G.revert = function (m) {
    var b = this.board; b[m.from] = m.piece; b[m.to] = m.captured;
    if (m.piece === K) this.ks[0] = m.from; else if (m.piece === -K) this.ks[1] = m.from;
    if (m.captured === K) this.ks[0] = m.to; else if (m.captured === -K) this.ks[1] = m.to;
    this.turn = -this.turn;
  };
  G.facing = function () {   // 두 궁이 같은 칸에서 사이에 말 없이 마주 보는가
    var a = this.ks[0], c = this.ks[1]; if (a < 0 || c < 0 || a % 9 !== c % 9) return false;
    for (var s = a + 9; s < c; s += 9) if (this.board[s]) return false; return true;
  };
  G.attacked = function (sq, bySide) {
    var ms = genSafe(this, bySide); for (var i = 0; i < ms.length; i++) if (ms[i].to === sq) return true; return false;
  };
  G.inCheck = function (side) {
    side = side || this.turn; var k = this.ks[side > 0 ? 0 : 1]; return k >= 0 && this.attacked(k, -side);
  };
  G.pseudo = function () { return gen(this, this.turn, []); };
  G.moves = function () {
    var list = gen(this, this.turn, []), out = [], side = this.turn, i, m;
    if (this.free) return list;
    for (i = 0; i < list.length; i++) {
      m = list[i]; this.apply(m);
      var ok = !this.facing() && !(this.ks[side > 0 ? 0 : 1] >= 0 && this.attacked(this.ks[side > 0 ? 0 : 1], -side));
      this.revert(m); if (ok) out.push(m);
    }
    return out;
  };
  G.movesFrom = function (sq) { return this.moves().filter(function (m) { return m.from === sq; }); };
  G.move = function (from, to) {
    var list = this.moves(), m = null, i;
    for (i = 0; i < list.length; i++) if (list[i].from === from && list[i].to === to) { m = list[i]; break; }
    if (!m) return null;
    var rec = { from: m.from, to: m.to, piece: m.piece, captured: m.captured, pass: false };
    this.apply(rec); this.stack.push(rec); this.keys.push(this.key()); return rec;
  };
  G.canPass = function () { return !this.inCheck(); };
  G.pass = function () {
    if (this.inCheck()) return null;
    var rec = { from: -1, to: -1, piece: 0, captured: 0, pass: true }; this.turn = -this.turn; this.stack.push(rec); this.keys.push(this.key()); return rec;
  };
  G.undo = function () {
    var rec = this.stack.pop(); if (!rec) return null; this.keys.pop();
    if (rec.pass) this.turn = -this.turn; else this.revert(rec); return rec;
  };
  G.last = function () { return this.stack.length ? this.stack[this.stack.length - 1] : null; };
  G.score = function () {
    var cho = 0, han = KOMI; for (var s = 0; s < N; s++) { var v = this.board[s]; if (v > 0) cho += PT[v]; else if (v < 0) han += PT[-v]; }
    return { cho: cho, han: han };
  };
  G.repeats = function () { var k = this.keys[this.keys.length - 1], n = 0; for (var i = 0; i < this.keys.length; i++) if (this.keys[i] === k) n++; return n; };
  /* 'playing' | 'check' | 'checkmate' | 'nomove'(한 수 쉬어야 함) | 'draw-repeat' | 'score' */
  G.status = function () {
    var chk = this.inCheck(), hasMove = this.moves().length > 0;
    if (!hasMove) return chk ? 'checkmate' : 'nomove';
    if (this.repeats() >= 3) return 'draw-repeat';
    if (this.stack.length >= MAX_PLY) return 'score';
    if (this.stack.length >= 2 && this.stack[this.stack.length - 1].pass && this.stack[this.stack.length - 2].pass) return 'score';
    return chk ? 'check' : 'playing';
  };
  G.kingSq = function (side) { return this.ks[side > 0 ? 0 : 1]; };

  /* ---- 컴퓨터 ---- */
  var MATE = 100000;
  function evalBoard(g) {
    var b = g.board, sc = 0, s, v, t, r;
    for (s = 0; s < N; s++) {
      v = b[s]; if (!v) continue; t = v > 0 ? v : -v; r = (s / 9) | 0;
      var x = VAL[t];
      if (t === P) { var adv = v > 0 ? r : 9 - r; x += adv * 12; if (adv >= 7) x += 40; }
      if (t === A) x += 15;
      if (t === H || t === E) { var cf = Math.abs((s % 9) - 4); x += 14 - cf * 3; }
      if (t === R || t === C) { x += 6; }
      sc += v > 0 ? x : -x;
    }
    return sc;
  }
  var nodes, deadline, timeUp;
  function ordered(list) {
    for (var i = 0; i < list.length; i++) { var m = list[i]; m.o = (m.captured ? 10000 + VAL[m.captured > 0 ? m.captured : -m.captured] * 10 - VAL[m.piece > 0 ? m.piece : -m.piece] : 0); }
    list.sort(function (a, b) { return b.o - a.o; }); return list;
  }
  function qsearch(g, alpha, beta, ply, qd) {
    var side = g.turn;
    if (g.facing()) return MATE - ply;
    var stand = evalBoard(g) * side; if (stand >= beta) return stand; if (stand > alpha) alpha = stand;
    if (qd <= 0) return stand;
    var list = ordered(gen(g, side, []).filter(function (m) { return m.captured; }));
    for (var i = 0; i < list.length; i++) {
      var m = list[i]; if ((m.captured > 0 ? m.captured : -m.captured) === K) return MATE - ply;
      g.apply(m); var v = -qsearch(g, -beta, -alpha, ply + 1, qd - 1); g.revert(m);
      if (v >= beta) return v; if (v > alpha) alpha = v;
    }
    return alpha;
  }
  function search(g, depth, alpha, beta, ply, qd) {
    if (++nodes % 2048 === 0 && Date.now() > deadline) timeUp = true; if (timeUp) return 0;
    if (g.facing()) return MATE - ply;
    if (depth <= 0) return qsearch(g, alpha, beta, ply, qd);
    var list = ordered(gen(g, g.turn, [])); if (!list.length) return 0;
    var best = -MATE * 2;
    for (var i = 0; i < list.length; i++) {
      var m = list[i]; if ((m.captured > 0 ? m.captured : -m.captured) === K) return MATE - ply;
      g.apply(m); var v = -search(g, depth - 1, -beta, -alpha, ply + 1, qd); g.revert(m);
      if (timeUp) return 0;
      if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break;
    }
    if (best <= -MATE + 1000 && !g.inCheck()) return evalBoard(g) * g.turn;   // 움직일 수 없지만 장군이 아니면 한 수 쉬어요(외통이 아님)
    return best;
  }
  function scoreMoves(g, list, depth, qd, ms, margin) {
    margin = margin || 0;
    ordered(list);
    var work = new Game(g.fen()); work.keys = g.keys.slice(); deadline = Date.now() + (ms || 2000); timeUp = false; nodes = 0;
    var res = list.map(function (m) { return { m: m, s: 0 }; }), d, best = null;
    for (d = 1; d <= depth; d++) {
      var cur = [], alpha = -MATE * 2, ok = true;
      ordered(res.map(function (x) { return x.m; }));
      for (var i = 0; i < res.length; i++) {
        var m = res[i].m; work.apply(m);
        var v = -search(work, d - 1, -MATE * 2, -(alpha - margin), 1, qd); work.revert(m);
        if (timeUp) { ok = false; break; }
        cur.push({ m: m, s: v }); if (v > alpha) alpha = v;
      }
      if (!ok) break;
      best = cur; res = cur.map(function (x) { return x; });
      res.sort(function (a, b) { return b.s - a.s; });
      res = res.map(function (x) { x.m.o = x.s; return x; });
    }
    return best ? best.sort(function (a, b) { return b.s - a.s; }) : res;
  }
  var ai = {
    choose: function (g, level) {
      var list = g.moves(); if (!list.length) return null;
      if (level <= 1) { var caps = list.filter(function (m) { return m.captured; }), pool = caps.length && Math.random() < 0.3 ? caps : list; return pool[(Math.random() * pool.length) | 0]; }
      var cfg = [null, null, { d: 1, q: 0, noise: 160, ms: 800 }, { d: 2, q: 2, noise: 50, ms: 1200 }, { d: 4, q: 2, noise: 15, ms: 1500 }, { d: 6, q: 3, noise: 0, ms: 2500 }][level] || { d: 2, q: 2, noise: 40, ms: 1200 };
      var res = scoreMoves(g, list.slice(), cfg.d, cfg.q, cfg.ms, cfg.noise ? cfg.noise * 2 + 130 : 0);
      var seen = {}; res.forEach(function (x) { x.s2 = x.s + (cfg.noise ? (Math.random() - 0.5) * 2 * cfg.noise : 0); });
      // 같은 말이 계속 왔다 갔다 하지 않도록: 곧 같은 판이 3번 나올 수 있는 수는 점수를 깎아요
      res.forEach(function (x) { g.apply(x.m); var k = g.fen(); g.revert(x.m); var n = 0; for (var i = 0; i < g.keys.length; i++) if (g.keys[i] === k) n++; if (n >= 1) x.s2 -= 40 * n; });
      res.sort(function (a, b) { return b.s2 - a.s2; }); return res[0].m;
    },
    hint: function (g) {
      var list = g.moves(); if (!list.length) return null;
      return scoreMoves(g, list.slice(), 3, 2, 1800)[0].m;
    }
  };

  root.OKS_JANGGI = { Game: Game, ai: ai, NAME: NAME, SETUP_KO: SETUP_KO, SETUPS: SETUPS, PT: PT, P: P, H: H, E: E, R: R, C: C, A: A, K: K, palaceOf: palaceOf, isDiagPt: isDiagPt, MAX_PLY: MAX_PLY };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.OKS_JANGGI;
})(typeof window !== 'undefined' ? window : globalThis);
