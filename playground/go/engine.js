/* 옥쌤의 즐거운 교실 — 바둑 규칙 엔진 · 계가 · 컴퓨터(몬테카를로) · 사활 풀이기 (외부 라이브러리 없음)
   판은 n×n(5~19). 흑 +1, 백 -1. 칸 번호 s = y*n + x (왼쪽 위가 0). 규칙: 활로 없는 돌 따내기, 자충(착수 금지), 단순 패(바로 되따내기 금지), 한국식 계가(집 + 따낸 돌, 덤). */
(function (root) {
  'use strict';
  var WALL = 2;

  function Game(n) {
    n = n || 19; this.n = n; this.W = n + 2; this.b = new Int8Array(this.W * this.W);
    for (var i = 0; i < this.W * this.W; i++) { var x = i % this.W, y = (i / this.W) | 0; if (x === 0 || y === 0 || x === this.W - 1 || y === this.W - 1) this.b[i] = WALL; }
    this.mk = new Int32Array(this.W * this.W); this.lm = new Int32Array(this.W * this.W); this.qa = new Int32Array(this.W * this.W); this.dd = [1, -1, this.W, -this.W]; this.dg = [this.W + 1, this.W - 1, -this.W + 1, -this.W - 1]; this.qn = 0; this.libA = -1; this.stamp = 0;
    this.turn = 1; this.ko = -1; this.passes = 0; this.caps = { b: 0, w: 0 }; this.stack = []; this.err = ''; this.lastP = -1; this.handicap = 0;
  }
  var G = Game.prototype;
  G.p = function (x, y) { return (y + 1) * this.W + x + 1; };
  G.xy = function (p) { return [(p % this.W) - 1, ((p / this.W) | 0) - 1]; };
  G.s = function (p) { return (((p / this.W) | 0) - 1) * this.n + (p % this.W) - 1; };
  G.pOfS = function (s) { return this.p(s % this.n, (s / this.n) | 0); };
  G.at = function (x, y) { return x < 0 || y < 0 || x >= this.n || y >= this.n ? WALL : this.b[this.p(x, y)]; };
  G.get = function (s) { return this.b[this.pOfS(s)]; };   // 칸 번호로 돌 보기 (1 흑, -1 백, 0 빈 칸)
  G.copy = function () { var g = new Game(this.n); g.b.set(this.b); g.turn = this.turn; g.ko = this.ko; g.passes = this.passes; g.caps = { b: this.caps.b, w: this.caps.w }; g.lastP = this.lastP; g.handicap = this.handicap; g.stack = this.stack.slice(); return g; };
  G.copyFrom = function (o) { this.b.set(o.b); this.turn = o.turn; this.ko = o.ko; this.passes = o.passes; this.caps.b = o.caps.b; this.caps.w = o.caps.w; this.lastP = o.lastP; };

  /* 연결된 돌 덩어리와 활로 */
  G.scan = function (p) {
    var b = this.b, c = b[p]; if (!c || c === WALL) return null; var W = this.W, st = [p], libs = [], stamp = ++this.stamp, mk = this.mk, lm = this.lm, i, q, r, v, dd = [1, -1, W, -W], d;
    mk[p] = stamp;
    for (i = 0; i < st.length; i++) { q = st[i]; for (d = 0; d < 4; d++) { r = q + dd[d]; v = b[r]; if (v === 0) { if (lm[r] !== stamp) { lm[r] = stamp; libs.push(r); } } else if (v === c && mk[r] !== stamp) { mk[r] = stamp; st.push(r); } } }
    return { c: c, stones: st, libs: libs };
  };
  G.group = function (x, y) { var p = this.p(x, y), g = this.scan(p); if (!g) return null; var self = this; return { color: g.c, stones: g.stones.map(function (q) { return self.s(q); }), libs: g.libs.map(function (q) { return self.s(q); }) }; };

  /* 빠른 활로 검사(빠져나가면서 멈춤): 활로가 있으면 true. 없으면 덩어리 돌이 qa[0..qn)에 남아요 */
  G.hasLib = function (p) {
    var b = this.b, W = this.W, c = b[p], stamp = ++this.stamp, mk = this.mk, q = this.qa, h = 0, t = 0, s, r, v;
    q[t++] = p; mk[p] = stamp;
    while (h < t) { s = q[h++];
      r = s + 1; v = b[r]; if (v === 0) return true; if (v === c && mk[r] !== stamp) { mk[r] = stamp; q[t++] = r; }
      r = s - 1; v = b[r]; if (v === 0) return true; if (v === c && mk[r] !== stamp) { mk[r] = stamp; q[t++] = r; }
      r = s + W; v = b[r]; if (v === 0) return true; if (v === c && mk[r] !== stamp) { mk[r] = stamp; q[t++] = r; }
      r = s - W; v = b[r]; if (v === 0) return true; if (v === c && mk[r] !== stamp) { mk[r] = stamp; q[t++] = r; } }
    this.qn = t; return false;
  };
  /* 활로 개수(최대 2까지만 세요). 하나뿐이면 libA에 그 자리 */
  G.libs2 = function (p) {
    var b = this.b, W = this.W, c = b[p], stamp = ++this.stamp, mk = this.mk, lm = this.lm, q = this.qa, h = 0, t = 0, s, r, v, n = 0, d, dd = this.dd;
    q[t++] = p; mk[p] = stamp;
    while (h < t) { s = q[h++]; for (d = 0; d < 4; d++) { r = s + dd[d]; v = b[r]; if (v === 0) { if (lm[r] !== stamp) { lm[r] = stamp; if (n === 0) this.libA = r; n++; if (n >= 2) return 2; } } else if (v === c && mk[r] !== stamp) { mk[r] = stamp; q[t++] = r; } } }
    return n;
  };
  /* 돌 놓기(낮은 단계): 따낸 돌 목록을 돌려주고, 못 두면 null */
  G.tryPlace = function (p, c) {
    var b = this.b, W = this.W, cap = null, i, d, r, nc = 0;
    if (b[p] !== 0) { this.err = 'occupied'; return null; }
    if (p === this.ko) { this.err = 'ko'; return null; }
    b[p] = c; var dd = this.dd; cap = [];
    for (d = 0; d < 4; d++) { r = p + dd[d]; if (b[r] === -c && !this.hasLib(r)) { for (i = 0; i < this.qn; i++) { b[this.qa[i]] = 0; cap.push(this.qa[i]); } } }
    if (cap.length === 0 && !this.hasLib(p)) { b[p] = 0; this.err = 'suicide'; return null; }
    this.newKo = -1;
    if (cap.length === 1) { var fr = 0, em = 0; for (d = 0; d < 4; d++) { r = p + dd[d]; if (b[r] === c) fr++; else if (b[r] === 0) em++; } if (fr === 0 && em === 1) this.newKo = cap[0]; }
    return cap;
  };
  G.legalP = function (p, c) {
    var b = this.b, ko = this.ko, cap = this.tryPlace(p, c), i; if (!cap) return false;
    b[p] = 0; for (i = 0; i < cap.length; i++) b[cap[i]] = -c; this.ko = ko; return true;
  };
  G.legal = function (x, y, c) { if (x < 0 || y < 0 || x >= this.n || y >= this.n) return false; return this.legalP(this.p(x, y), c || this.turn); };
  G.play = function (x, y) {
    this.err = ''; if (this.passes >= 2) { this.err = 'over'; return null; }
    var p = this.p(x, y), c = this.turn, prevKo = this.ko, prevPasses = this.passes, cap = this.tryPlace(p, c); if (!cap) return null;
    if (c > 0) this.caps.b += cap.length; else this.caps.w += cap.length;
    this.ko = this.newKo; this.passes = 0; this.turn = -c; this.lastP = p;
    var self = this, rec = { x: x, y: y, s: y * this.n + x, color: c, captured: cap.map(function (q) { return self.s(q); }), pass: false, _ko: prevKo, _passes: prevPasses, _cap: cap };
    this.stack.push(rec); return rec;
  };
  G.pass = function () {
    if (this.passes >= 2) return null; var c = this.turn, rec = { x: -1, y: -1, s: -1, color: c, captured: [], pass: true, _ko: this.ko, _passes: this.passes, _cap: [] };
    this.passes++; this.ko = -1; this.turn = -c; this.lastP = -1; this.stack.push(rec); return rec;
  };
  G.undo = function () {
    var r = this.stack.pop(); if (!r) return null; var i;
    if (!r.pass) { this.b[this.p(r.x, r.y)] = 0; for (i = 0; i < r._cap.length; i++) this.b[r._cap[i]] = -r.color; if (r.color > 0) this.caps.b -= r._cap.length; else this.caps.w -= r._cap.length; }
    this.ko = r._ko; this.passes = r._passes; this.turn = r.color; var l = this.stack[this.stack.length - 1]; this.lastP = l && !l.pass ? this.p(l.x, l.y) : -1; return r;
  };
  G.ended = function () { return this.passes >= 2; };
  /* 접바둑 놓기: 흑 돌을 먼저 놓고 백이 시작해요 */
  var HC = { 9: { 2: [[6, 2], [2, 6]], 3: [[6, 2], [2, 6], [6, 6]], 4: [[6, 2], [2, 6], [6, 6], [2, 2]], 5: [[6, 2], [2, 6], [6, 6], [2, 2], [4, 4]] },
    13: { 2: [[9, 3], [3, 9]], 3: [[9, 3], [3, 9], [9, 9]], 4: [[9, 3], [3, 9], [9, 9], [3, 3]], 5: [[9, 3], [3, 9], [9, 9], [3, 3], [6, 6]], 6: [[9, 3], [3, 9], [9, 9], [3, 3], [3, 6], [9, 6]], 7: [[9, 3], [3, 9], [9, 9], [3, 3], [3, 6], [9, 6], [6, 6]], 8: [[9, 3], [3, 9], [9, 9], [3, 3], [3, 6], [9, 6], [6, 3], [6, 9]], 9: [[9, 3], [3, 9], [9, 9], [3, 3], [3, 6], [9, 6], [6, 3], [6, 9], [6, 6]] },
    19: { 2: [[15, 3], [3, 15]], 3: [[15, 3], [3, 15], [15, 15]], 4: [[15, 3], [3, 15], [15, 15], [3, 3]], 5: [[15, 3], [3, 15], [15, 15], [3, 3], [9, 9]], 6: [[15, 3], [3, 15], [15, 15], [3, 3], [3, 9], [15, 9]], 7: [[15, 3], [3, 15], [15, 15], [3, 3], [3, 9], [15, 9], [9, 9]], 8: [[15, 3], [3, 15], [15, 15], [3, 3], [3, 9], [15, 9], [9, 3], [9, 15]], 9: [[15, 3], [3, 15], [15, 15], [3, 3], [3, 9], [15, 9], [9, 3], [9, 15], [9, 9]] } };
  G.setHandicap = function (k) { var list = (HC[this.n] || {})[k]; if (!list) return []; var self = this; list.forEach(function (q) { self.b[self.p(q[0], q[1])] = 1; }); this.handicap = k; this.turn = -1; return list.map(function (q) { return q[1] * self.n + q[0]; }); };
  function maxHandicap(n) { return n >= 13 ? 9 : n === 9 ? 5 : 0; }
  /* 글자 그림으로 판 만들기: X 흑, O 백, . 빈 칸 */
  Game.fromRows = function (rows, turn, n) {
    n = n || rows.length; var g = new Game(n);
    rows.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { var ch = row[x]; if (ch === 'X') g.b[g.p(x, y)] = 1; else if (ch === 'O') g.b[g.p(x, y)] = -1; } });
    g.turn = turn === 'O' || turn === -1 ? -1 : 1; return g;
  };
  G.rows = function () { var out = [], x, y, r; for (y = 0; y < this.n; y++) { r = ''; for (x = 0; x < this.n; x++) { var v = this.at(x, y); r += v > 0 ? 'X' : v < 0 ? 'O' : '.'; } out.push(r); } return out; };
  G.key = function () { var s = '', p, W = this.W; for (p = 0; p < this.b.length; p++) s += this.b[p]; return s + (this.turn > 0 ? 'x' : 'o') + this.ko + 'p' + this.passes; };
  G.countStones = function () { var b = 0, w = 0, i; for (i = 0; i < this.b.length; i++) { if (this.b[i] === 1) b++; else if (this.b[i] === -1) w++; } return { b: b, w: w }; };

  /* ---- 눈 · 집 ---- */
  var DIAG = function (W) { return [W + 1, W - 1, -W + 1, -W - 1]; };
  G.isOwnEye = function (p, c) {   // c색의 "진짜 눈"으로 보이는 빈 점
    var b = this.b, dd = this.dd, d, r, bad = 0, wall = 0;
    for (d = 0; d < 4; d++) { r = p + dd[d]; if (b[r] === WALL) wall++; else if (b[r] !== c) return false; }
    var dg = this.dg; for (d = 0; d < 4; d++) { r = p + dg[d]; if (b[r] === WALL) wall++; else if (b[r] !== c) bad++; }
    return wall > 0 ? bad === 0 : bad <= 1;
  };
  /* 빈 곳 영역 나누기: dead 칸 번호 집합의 돌은 치워진 것으로 보고 계산 */
  G.territory = function (deadS) {
    var n = this.n, own = new Int8Array(n * n), seen = new Uint8Array(n * n), dead = new Uint8Array(n * n), s, i, tb = 0, tw = 0, deadB = 0, deadW = 0;
    (deadS || []).forEach(function (q) { dead[q] = 1; });
    var val = function (g, q) { var v = g.get(q); return dead[q] ? 0 : v; };
    for (s = 0; s < n * n; s++) {
      if (seen[s] || val(this, s) !== 0) continue;
      var reg = [s], touchB = false, touchW = false; seen[s] = 1;
      for (i = 0; i < reg.length; i++) {
        var q = reg[i], x = q % n, y = (q / n) | 0, nb = [x > 0 ? q - 1 : -1, x < n - 1 ? q + 1 : -1, y > 0 ? q - n : -1, y < n - 1 ? q + n : -1];
        for (var d = 0; d < 4; d++) { var t = nb[d]; if (t < 0) continue; var v = val(this, t); if (v === 0) { if (!seen[t]) { seen[t] = 1; reg.push(t); } } else if (v > 0) touchB = true; else touchW = true; }
      }
      var o = touchB && !touchW ? 1 : touchW && !touchB ? -1 : 0;
      for (i = 0; i < reg.length; i++) own[reg[i]] = o; if (o > 0) tb += reg.length; else if (o < 0) tw += reg.length;
    }
    for (s = 0; s < n * n; s++) { var v0 = this.get(s); if (v0 && !dead[s]) own[s] = v0; else if (v0 && dead[s]) { own[s] = own[s] || -v0; } }
    // 죽은 돌 자리는 상대 집으로 센다
    for (s = 0; s < n * n; s++) { if (dead[s]) { var v1 = this.get(s); if (v1 > 0) { deadB++; own[s] = -1; } else if (v1 < 0) { deadW++; own[s] = 1; } } }
    return { own: own, terrB: tb, terrW: tw, deadB: deadB, deadW: deadW };
  };
  /* 한국식 계가: 집 + 따낸 돌(죽은 돌 포함). 덤은 백에게 */
  G.score = function (deadS, komi) {
    var t = this.territory(deadS), k = komi == null ? 6.5 : komi;
    var b = t.terrB + this.caps.b + t.deadW, w = t.terrW + this.caps.w + t.deadB + k;
    return { black: b, white: w, diff: b - w, terrB: t.terrB, terrW: t.terrW, deadB: t.deadB, deadW: t.deadW, capsB: this.caps.b, capsW: this.caps.w, komi: k, own: t.own, winner: b > w ? 1 : -1 };
  };
  /* 중국식(돌+집) 점수: 컴퓨터가 끝까지 두어 본 뒤 판단할 때 써요 */
  function areaDiff(g) {
    var b = g.b, W = g.W, n = g.n, bs = 0, ws = 0, p, seen = g.mk, stamp = ++g.stamp, dd = [1, -1, W, -W], d, i, y, x;
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) { p = (y + 1) * W + x + 1; var v = b[p];
      if (v > 0) bs++; else if (v < 0) ws++;
      else if (seen[p] !== stamp) { var reg = [p], tb = false, tw = false; seen[p] = stamp;
        for (i = 0; i < reg.length; i++) { var q = reg[i]; for (d = 0; d < 4; d++) { var r = q + dd[d], u = b[r]; if (u === 0) { if (seen[r] !== stamp) { seen[r] = stamp; reg.push(r); } } else if (u === 1) tb = true; else if (u === -1) tw = true; } }
        if (tb && !tw) bs += reg.length; else if (tw && !tb) ws += reg.length; } }
    return bs - ws;
  }

  /* ---- 빠른 무작위 대국(몬테카를로) ---- */
  var seed = 2463534242; function rnd() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }
  function seedRnd(v) { seed = (v | 0) || 2463534242; }
  function pickMove(g, c, size) {
    var b = g.b, W = g.W, dd = [1, -1, W, -W], d, r, q, i, last = g.lastP;
    if (last > 0 && rnd() < 0.75) {   // 방금 둔 곳 주변: 따낼 수 있는 단수, 살릴 수 있는 단수를 우선
      var cands = [last, last + 1, last - 1, last + W, last - W];
      for (i = 0; i < 5; i++) { q = cands[i]; var v0 = b[q]; if (v0 === 0 || v0 === WALL) continue;
        if (g.libs2(q) === 1) { var lp = g.libA;
          if (v0 === -c) { if (g.legalP(lp, c)) return lp; }
          else if (rnd() < 0.6) { b[lp] = c; var nl = g.libs2(lp); b[lp] = 0; if (nl >= 2 && g.legalP(lp, c)) return lp; } } }
    }
    var tries = 0, tot = size * size, start = (rnd() * tot) | 0, k, p, x0, y0;
    for (k = 0; k < tot; k++) { var idx = (start + k) % tot; x0 = idx % size; y0 = (idx / size) | 0; p = (y0 + 1) * W + x0 + 1; if (b[p] !== 0) continue; if (g.isOwnEye(p, c)) continue;
      var cap = g.tryPlace(p, c); if (!cap) continue;
      var bad = cap.length === 0 && g.libs2(p) === 1 && rnd() < 0.9;   // 자충수는 피해요
      b[p] = 0; for (i = 0; i < cap.length; i++) b[cap[i]] = -c; if (bad) continue; return p; }
    return -1;
  }
  function playout(g, maxMoves) {
    var c = g.turn, n = g.n, moves = 0, passes = g.passes;
    while (passes < 2 && moves < maxMoves) {
      var p = pickMove(g, c, n);
      if (p < 0) { passes++; g.ko = -1; g.lastP = -1; } else { var cap = g.tryPlace(p, c); if (!cap) { passes++; } else { g.ko = g.newKo; g.lastP = p; passes = 0; } }
      c = -c; moves++;
    }
    g.turn = c; return areaDiff(g);
  }
  /* 지금 판에서 끝까지 두어 보기를 여러 번 해서 (1) 칸마다 누구 땅이 될 확률 (2) 죽은 돌 추정 */
  function estimate(g, runs, komi) {
    var n = g.n, tot = n * n, acc = new Float32Array(tot), sim = new Game(n), r, s, wins = 0, diffSum = 0, k = komi == null ? 6.5 : komi;
    for (r = 0; r < runs; r++) { sim.copyFrom(g); sim.passes = 0; sim.ko = g.ko; var diff = playout(sim, n * n * 2); diffSum += diff;
      for (s = 0; s < tot; s++) { var v = sim.get(s); if (v) acc[s] += v; else { var o = ownerOfEmpty(sim, s); acc[s] += o; } } if (diff - k > 0) wins++; }
    for (s = 0; s < tot; s++) acc[s] /= runs;
    var dead = []; for (s = 0; s < tot; s++) { var v2 = g.get(s); if (v2 && acc[s] * v2 < -0.4) dead.push(s); }
    return { own: acc, dead: dead, black: wins / runs, diff: diffSum / runs - k };
  }
  function ownerOfEmpty(g, s) { var n = g.n, p = g.pOfS(s), b = g.b, W = g.W, reg = [p], tb = false, tw = false, i, d, dd = [1, -1, W, -W], stamp = ++g.stamp;
    g.mk[p] = stamp; for (i = 0; i < reg.length; i++) { var q = reg[i]; for (d = 0; d < 4; d++) { var r = q + dd[d], u = b[r]; if (u === 0) { if (g.mk[r] !== stamp) { g.mk[r] = stamp; reg.push(r); } } else if (u === 1) tb = true; else if (u === -1) tw = true; } }
    return tb && !tw ? 1 : tw && !tb ? -1 : 0; }

  /* ---- 컴퓨터: 몬테카를로 나무 탐색 ---- */
  var STAR = { 9: [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]], 13: [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]], 19: [[3, 3], [15, 3], [3, 15], [15, 15], [9, 3], [3, 9], [15, 9], [9, 15], [9, 9], [3, 2], [2, 3], [16, 3], [3, 16], [15, 16], [16, 15], [2, 15], [15, 2]] };
  function genMoves(g, c) {   // 둘 만한 점 목록 (자기 눈 메우기는 뺌, 큰 판은 돌 근처만)
    var n = g.n, out = [], s, p, tot = n * n, near = null, stones = 0;
    if (n > 9) { near = new Uint8Array(tot); for (s = 0; s < tot; s++) if (g.get(s)) { stones++; var x = s % n, y = (s / n) | 0; for (var dy = -3; dy <= 3; dy++) for (var dx = -3; dx <= 3; dx++) { var nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < n && ny < n && Math.abs(dx) + Math.abs(dy) <= 4) near[ny * n + nx] = 1; } }
      if (stones < 3) { (STAR[n] || []).forEach(function (q) { var pp = g.p(q[0], q[1]); if (g.b[pp] === 0 && g.legalP(pp, c)) out.push(q[1] * n + q[0]); }); if (out.length) return out; } }
    for (s = 0; s < tot; s++) { p = g.pOfS(s); if (g.b[p] !== 0) continue; if (near && !near[s]) continue; if (g.isOwnEye(p, c)) continue; if (g.legalP(p, c)) out.push(s); }
    return out;
  }
  function Node(parent, move, c) { this.parent = parent; this.move = move; this.c = c; this.kids = []; this.untried = null; this.w = 0; this.v = 0; }
  function mcts(g, opt) {
    opt = opt || {}; var ms = opt.ms || 1000, maxIt = opt.maxIt || 1e9, komi = opt.komi == null ? 6.5 : opt.komi, c0 = g.turn, n = g.n, sim = new Game(n), t0 = Date.now();
    var root = new Node(null, -2, -c0); root.untried = genMoves(g, c0); root.untried.push(-1);   // -1 = 한 수 쉬기
    var it = 0, i;
    while (it < maxIt) {
      if ((it & 15) === 0 && Date.now() - t0 > ms) break; it++;
      sim.copyFrom(g); var node = root, passesNow = g.passes;
      while (node.untried && node.untried.length === 0 && node.kids.length) {   // 선택
        var best = null, bv = -1, lg = Math.log(node.v + 1);
        for (i = 0; i < node.kids.length; i++) { var k = node.kids[i], u = k.v ? k.w / k.v + 0.62 * Math.sqrt(lg / k.v) : 10 + rnd(); if (u > bv) { bv = u; best = k; } }
        node = best; if (node.move === -1) { sim.passes++; sim.ko = -1; sim.lastP = -1; sim.turn = -sim.turn; } else { sim.tryPlace(sim.pOfS(node.move), node.c) && (sim.ko = sim.newKo, sim.lastP = sim.pOfS(node.move)); sim.passes = 0; sim.turn = -sim.turn; }
        if (sim.passes >= 2) break;
      }
      if (sim.passes < 2) {
        if (!node.untried) { node.untried = genMoves(sim, sim.turn); node.untried.push(-1); }
        if (node.untried.length) {   // 펼치기
          var j = (rnd() * node.untried.length) | 0, mv = node.untried[j]; node.untried[j] = node.untried[node.untried.length - 1]; node.untried.pop();
          var kid = new Node(node, mv, sim.turn);
          if (mv === -1) { sim.passes++; sim.ko = -1; sim.lastP = -1; } else { var cp = sim.tryPlace(sim.pOfS(mv), sim.turn); if (!cp) { continue; } sim.ko = sim.newKo; sim.lastP = sim.pOfS(mv); sim.passes = 0; }
          sim.turn = -sim.turn; node.kids.push(kid); node = kid;
        }
      }
      var diff = sim.passes >= 2 ? areaDiff(sim) : playout(sim, n * n * 2), blackWin = diff - komi > 0 ? 1 : 0;
      for (; node; node = node.parent) { node.v++; if (node.c > 0) node.w += blackWin; else node.w += 1 - blackWin; }
    }
    var bestKid = null, bestV = -1; for (i = 0; i < root.kids.length; i++) { var kk = root.kids[i]; if (kk.v > bestV) { bestV = kk.v; bestKid = kk; } }
    var mine = c0 > 0 ? 1 : 0; if (!bestKid) return { s: -1, win: 0.5, iters: it, kids: [] };
    var kids = root.kids.map(function (kd) { return { s: kd.move, v: kd.v, win: kd.v ? kd.w / kd.v : 0 }; }).sort(function (a, b2) { return b2.v - a.v; });
    return { s: bestKid.move, win: bestKid.v ? bestKid.w / bestKid.v : 0.5, iters: it, kids: kids.slice(0, 6) };
  }
  /* 단순한 수 고르기(낮은 수준): 따내기 > 단수 도망 > 상대 돌 옆 > 아무 데나 */
  function easyMove(g, level) {
    var c = g.turn, n = g.n, moves = genMoves(g, c).filter(function (s) { return s >= 0; }), i, best = -1, bv = -1e9;
    if (!moves.length) return -1;
    for (i = 0; i < moves.length; i++) { var s = moves[i], p = g.pOfS(s), v = rnd() * (level <= 1 ? 40 : 6), dd = [1, -1, g.W, -g.W], d;
      for (d = 0; d < 4; d++) { var r = p + dd[d], u = g.b[r]; if (u === -c) { var gr = g.scan(r); if (gr.libs.length === 1) v += 30 + gr.stones.length * 4; else if (gr.libs.length === 2) v += 4; } else if (u === c) { var gm = g.scan(r); if (gm.libs.length === 1) v += level >= 2 ? 22 : 3; } }
      var cap = g.tryPlace(p, c); if (cap) { var own = g.scan(p); if (own.libs.length === 1 && cap.length === 0) v -= level >= 2 ? 35 : 5; g.b[p] = 0; for (var k = 0; k < cap.length; k++) g.b[cap[k]] = -c; }
      var x = s % n, y = (s / n) | 0, edge = Math.min(x, y, n - 1 - x, n - 1 - y); v += Math.min(edge, 3) * (level >= 2 ? 2 : 0.5);
      if (v > bv) { bv = v; best = s; } }
    return best;
  }
  var LV = { 1: { easy: 1 }, 2: { easy: 2 }, 3: { ms: 700, komi: 6.5 }, 4: { ms: 2000 }, 5: { ms: 4500 } };
  var ai = {
    choose: function (g, level, komi) {
      level = level || 3; komi = komi == null ? 6.5 : komi; var cfg = LV[level] || LV[3];
      if (g.stack.filter(function (r) { return !r.pass; }).length === 0 && g.n === 19 && !g.handicap) return { s: 3 * 19 + 15, win: 0.5 };
      if (cfg.easy) {   // 상대가 쉬었으면, 이길 것 같으면 따라서 쉬어요
        var last = g.stack[g.stack.length - 1]; if (last && last.pass) { var e = estimate(g, 60, komi); var mineWin = g.turn > 0 ? e.black : 1 - e.black; if (mineWin > 0.5) return { s: -1, pass: true, win: mineWin }; }
        var s0 = easyMove(g, cfg.easy); if (s0 < 0) return { s: -1, pass: true, win: 0.5 }; return { s: s0, win: 0.5 };
      }
      var r = mcts(g, { ms: cfg.ms * (g.n >= 19 ? 1.4 : 1), komi: komi }), lastR = g.stack[g.stack.length - 1];
      if (r.s === -1 || (lastR && lastR.pass && r.win >= 0.5 && r.kids.some(function (k) { return k.s === -1 && k.win >= r.win - 0.03; }))) return { s: -1, pass: true, win: r.win, iters: r.iters };
      return { s: r.s, win: r.win, iters: r.iters, kids: r.kids };
    },
    hint: function (g, komi) { var r = mcts(g, { ms: 900, komi: komi }); return { s: r.s, win: r.win, kids: r.kids }; }
  };

  /* ---- 사활 풀이기: 작은 판에서 "잡을 수 있나 / 살 수 있나"를 끝까지 따져 봐요 ---- */
  var solver = {};
  function ptsNear(g, targets, R) {   // 표적 돌 가까이의 빈 점들
    var n = g.n, set = {}, out = [];
    targets.forEach(function (s) { var x = s % n, y = (s / n) | 0; for (var dy = -R; dy <= R; dy++) for (var dx = -R; dx <= R; dx++) { var nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; var q = ny * n + nx; if (!set[q]) { set[q] = 1; out.push(q); } } });
    return out;
  }
  function solverCtx(g, target, attacker, opt) {
    opt = opt || {}; var n = g.n, tp = g.pOfS(target), def = -attacker, ctx = { g: g, tp: tp, def: def, att: attacker, R: opt.R || 2, tt: new Map(), nodes: 0, maxNodes: opt.maxNodes || 4e6, region: opt.region || null, ladder: !!opt.ladder, eyeShortcut: opt.eyeShortcut !== false };
    return ctx;
  }
  function defAliveQuick(ctx) {   // 눈이 두 개 확실하면 더 볼 필요 없이 산 돌
    var g = ctx.g, gr = g.scan(ctx.tp); if (!gr) return false; var b = g.b, W = g.W, eyes = 0, seen = {}, i, d, r, dd = [1, -1, W, -W], dg = DIAG(W), mkset = {};
    gr.stones.forEach(function (q) { mkset[q] = 1; });
    for (i = 0; i < gr.libs.length; i++) { var e = gr.libs[i], ok = true; if (seen[e]) continue;
      for (d = 0; d < 4; d++) { r = e + dd[d]; if (b[r] === WALL) continue; if (!mkset[r]) { ok = false; break; } }
      if (!ok) continue; for (d = 0; d < 4; d++) { r = e + dg[d]; if (b[r] !== WALL && b[r] !== ctx.def) { ok = false; break; } }   // 대각선이 모두 내 돌이거나 벽이어야 확실
      if (ok) { eyes++; seen[e] = 1; } }
    return eyes >= 2;
  }
  function solverMoves(ctx, mover) {
    var g = ctx.g, out = [], region = ctx.region || ptsNear(g, g.scan(ctx.tp) ? g.scan(ctx.tp).stones.map(function (q) { return g.s(q); }) : [], ctx.R), i, s, p;
    for (i = 0; i < region.length; i++) { s = region[i]; p = g.pOfS(s); if (g.b[p] !== 0) continue; if (g.isOwnEye(p, mover) && !(mover === ctx.att && false)) continue; if (g.legalP(p, mover)) out.push(s); }
    return out;
  }
  function order(ctx, moves, mover) {   // 표적의 활로·가까운 곳 먼저
    var g = ctx.g, gr = g.scan(ctx.tp); if (!gr) return moves; var libs = {}; gr.libs.forEach(function (q) { libs[g.s(q)] = 1; }); var n = g.n, tg = g.s(gr.stones[0]);
    return moves.map(function (s) { var x = s % n, y = (s / n) | 0, tx = tg % n, ty = (tg / n) | 0, sc = (libs[s] ? 0 : 10) + Math.abs(x - tx) + Math.abs(y - ty); return [sc, s]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (a) { return a[1]; });
  }
  function rec(ctx, depth, mover, lastPass) {   // 공격자가 표적을 잡으면 true
    var g = ctx.g; ctx.nodes++; if (ctx.nodes > ctx.maxNodes) throw new Error('solver-budget');
    if (g.b[ctx.tp] !== ctx.def) return true;
    if (depth <= 0) return false;
    if (ctx.eyeShortcut && defAliveQuick(ctx)) return false;
    var key = g.key() + ':' + lastPass, hit = ctx.tt.get(key); if (hit && hit.d >= depth) return hit.r; if (hit && hit.r === true && hit.d <= depth) return true;
    var moves = order(ctx, solverMoves(ctx, mover), mover), i, res;
    if (mover === ctx.att) {
      res = false;
      for (i = 0; i < moves.length && !res; i++) { var s = moves[i], r = g.play(s % g.n, (s / g.n) | 0); if (!r) continue; if (rec(ctx, depth - 1, -mover, 0)) res = true; g.undo(); }
      if (!res && !lastPass) { g.pass(); if (rec(ctx, depth - 1, -mover, 1)) res = true; g.undo(); }
    } else {
      res = true;
      for (i = 0; i < moves.length && res; i++) { var s2 = moves[i], r2 = g.play(s2 % g.n, (s2 / g.n) | 0); if (!r2) continue; if (!rec(ctx, depth - 1, -mover, 0)) res = false; g.undo(); }
      if (res) { if (lastPass) res = false; else { g.pass(); if (!rec(ctx, depth - 1, -mover, 1)) res = false; g.undo(); } }
    }
    ctx.tt.set(key, { d: depth, r: res }); return res;
  }
  /* 공격자가 먼저 두어서 target(칸 번호) 돌 덩어리를 잡을 수 있나? */
  solver.canKill = function (g0, target, attacker, depth, opt, mover) {
    var g = g0.copy(); mover = mover || attacker; g.turn = mover; g.passes = 0; var ctx = solverCtx(g, target, attacker, opt);
    try { return rec(ctx, depth || 15, mover, 0); } catch (e) { return null; }
  };
  /* 첫 수 후보마다 결과: 공격자가 둘 때는 "잡는 수" 목록, 지킬 때는 "사는 수" 목록 */
  solver.firstMoves = function (g0, target, attacker, mover, depth, opt) {
    var g = g0.copy(); g.turn = mover; g.passes = 0; var ctx = solverCtx(g, target, attacker, opt), moves = order(ctx, solverMoves(ctx, mover), mover), good = [], bad = [], i;
    for (i = 0; i < moves.length; i++) { var s = moves[i], r = g.play(s % g.n, (s / g.n) | 0); if (!r) continue; var killed; try { killed = rec(ctx, (depth || 15) - 1, -mover, 0); } catch (e) { killed = null; } g.undo();
      if (killed === null) continue; if (mover === attacker ? killed : !killed) good.push(s); else bad.push(s); }
    return { good: good, bad: bad };
  };
  /* 지금 판에서 공격자(attacker)가 둘 차례일 때, 가장 좋은 이어지는 길(첫 수부터 잡을 때까지) */
  solver.line = function (g0, target, attacker, mover, depth, opt) {
    var g = g0.copy(); g.turn = mover; g.passes = 0; var ctx = solverCtx(g, target, attacker, opt), seq = [], d = depth || 9, m = mover;
    try { while (d > 0 && g.b[ctx.tp] === ctx.def) { var moves = order(ctx, solverMoves(ctx, m), m), pick = -1, i, fallback = -1;
        for (i = 0; i < moves.length; i++) { var s = moves[i]; g.play(s % g.n, (s / g.n) | 0); var k = rec(ctx, d - 1, -m, 0); g.undo(); if (fallback < 0) fallback = s; if (m === attacker ? k : !k) { pick = s; break; } }
        if (pick < 0) pick = fallback; if (pick < 0) { g.pass(); seq.push(-1); } else { g.play(pick % g.n, (pick / g.n) | 0); seq.push(pick); } m = -m; d--; if (seq.length > 14) break; } } catch (e) { return seq; }
    return seq;
  };
  /* 축(사다리) 풀이: 도망가는 돌 덩어리가 쫓기는 대로 잡히나? 쫓는 쪽은 단수만, 도망가는 쪽은 늘리기만 해요 */
  solver.ladder = function (g0, runner, chaser, toMove, outPath) {   // runner: 도망 돌 칸 번호, chaser: 쫓는 색. outPath에 풀이 순서를 담아요
    var g = g0.copy(), tp = g.pOfS(runner), run = g.b[tp], path = [];
    function go(depthLeft, mover) {
      if (g.b[tp] !== run) return true;   // 잡힘
      var gr = g.scan(tp); if (!gr) return true; if (depthLeft <= 0) return false;
      if (mover === chaser) {   // 단수로 몰기
        if (gr.libs.length === 1) { var l0 = g.s(gr.libs[0]); var ok = g.play(l0 % g.n, (l0 / g.n) | 0); if (!ok) return false; path.push({ s: l0, color: chaser }); var rr = go(depthLeft - 1, -chaser); if (!rr) path.pop(); g.undo(); return rr; }
        if (gr.libs.length > 2) return false;
        for (var i = 0; i < gr.libs.length; i++) { var s1 = g.s(gr.libs[i]); var r = g.play(s1 % g.n, (s1 / g.n) | 0); if (!r) continue; var g2 = g.scan(tp); var atari = g2 && g2.libs.length === 1; path.push({ s: s1, color: chaser }); var res = atari ? go(depthLeft - 1, -chaser) : false; if (!res) path.pop(); g.undo(); if (res) return true; }
        return false;
      }
      var opts = []; gr.libs.forEach(function (q) { opts.push(g.s(q)); });
      var seen = {}; gr.stones.forEach(function (q) { [1, -1, g.W, -g.W].forEach(function (d) { var r2 = q + d; if (g.b[r2] === chaser) { var ch = g.scan(r2); if (ch.libs.length === 1) { var ls = g.s(ch.libs[0]); if (!seen[ls]) { seen[ls] = 1; opts.push(ls); } } } }); });
      var uniq = {}; opts = opts.filter(function (s2) { if (uniq[s2]) return false; uniq[s2] = 1; return true; });
      var worst = null;
      for (var j = 0; j < opts.length; j++) { var t = opts[j]; var rp = g.play(t % g.n, (t / g.n) | 0); if (!rp) continue; path.push({ s: t, color: run }); var mark = path.length; var out = go(depthLeft - 1, chaser); if (!out) { g.undo(); var keep = path.slice(); path.length = 0; Array.prototype.push.apply(path, keep); return false; } g.undo(); if (j < opts.length - 1) path.length = mark - 1; }
      return true;
    }
    var first = g.scan(tp); if (!first) return true; g.turn = toMove || (first.libs.length === 1 ? run : chaser);
    var res0 = go(80, g.turn); if (outPath) { outPath.length = 0; Array.prototype.push.apply(outPath, path); } return res0;
  };

  root.OKS_GO = { Game: Game, ai: ai, estimate: estimate, mcts: mcts, playout: playout, areaDiff: areaDiff, solver: solver, seedRnd: seedRnd, maxHandicap: maxHandicap, genMoves: genMoves, WALL: WALL, STAR: STAR };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.OKS_GO;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis));
