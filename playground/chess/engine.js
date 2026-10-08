/* 옥쌤의 즐거운 교실 — 체스 규칙 엔진과 컴퓨터 상대 (외부 라이브러리 없음)
   사용: var g = new OKS_CHESS.Game();  g.moves() → 합법 수 목록,  g.move(from, to, promo) → 수 적용,
   g.undo(), g.status(), g.inCheck(), OKS_CHESS.ai.choose(g, level 1~5), OKS_CHESS.ai.hint(g)
   칸 번호: 0=a1, 1=b1 … 7=h1, 8=a2 … 63=h8.  말: 흰 +1~+6, 검정 -1~-6 (폰·나이트·비숍·룩·퀸·킹) */
(function (root) {
  'use strict';
  var P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  var START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var KN = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  var KG = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  var DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]], ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var LETTER = { p: P, n: N, b: B, r: R, q: Q, k: K };
  var NAME = ['', '폰', '나이트', '비숍', '룩', '퀸', '킹'];
  var FILES = 'abcdefgh';
  function file(s) { return s & 7; }
  function rank(s) { return s >> 3; }
  function sqName(s) { return FILES[file(s)] + (rank(s) + 1); }
  function sqFrom(n) { return (n.charCodeAt(1) - 49) * 8 + (n.charCodeAt(0) - 97); }

  function Game(fen) { this.board = new Int8Array(64); this.stack = []; this.keys = []; this.load(fen || START); }

  Game.prototype.load = function (fen) {
    var parts = fen.split(' '), rows = parts[0].split('/'), r, f, i, ch;
    this.board.fill(0);
    for (r = 0; r < 8; r++) {
      f = 0;
      for (i = 0; i < rows[r].length; i++) {
        ch = rows[r][i];
        if (ch >= '1' && ch <= '8') f += +ch;
        else { this.board[(7 - r) * 8 + f] = LETTER[ch.toLowerCase()] * (ch === ch.toUpperCase() ? 1 : -1); f++; }
      }
    }
    this.turn = parts[1] === 'b' ? -1 : 1;
    var c = parts[2] || '-';
    this.castle = (c.indexOf('K') >= 0 ? 1 : 0) | (c.indexOf('Q') >= 0 ? 2 : 0) | (c.indexOf('k') >= 0 ? 4 : 0) | (c.indexOf('q') >= 0 ? 8 : 0);
    this.ep = parts[3] && parts[3] !== '-' ? sqFrom(parts[3]) : -1;
    this.half = +(parts[4] || 0); this.full = +(parts[5] || 1);
    this.stack = []; this.keys = [this.key()];
    this.kingSq = [0, 0, 0]; this.findKings();
  };
  Game.prototype.findKings = function () {
    for (var s = 0; s < 64; s++) { if (this.board[s] === K) this.kingSq[1] = s; else if (this.board[s] === -K) this.kingSq[2] = s; }
  };
  Game.prototype.key = function () { return Array.prototype.join.call(this.board, ',') + '|' + this.turn + '|' + this.castle + '|' + this.epKey(); };
  /* 반복 판정용: 실제로 앙파상이 가능할 때만 칸을 포함 */
  Game.prototype.epKey = function () {
    if (this.ep < 0) return -1;
    var t = this.turn, f = file(this.ep), r = rank(this.ep) - t;
    if (r < 0 || r > 7) return -1;
    if (f > 0 && this.board[r * 8 + f - 1] === t * P) return this.ep;
    if (f < 7 && this.board[r * 8 + f + 1] === t * P) return this.ep;
    return -1;
  };
  Game.prototype.fen = function () {
    var out = [], r, f, e, v, row, L = ' pnbrqk';
    for (r = 7; r >= 0; r--) {
      row = ''; e = 0;
      for (f = 0; f < 8; f++) {
        v = this.board[r * 8 + f];
        if (!v) { e++; continue; }
        if (e) { row += e; e = 0; }
        row += v > 0 ? L[v].toUpperCase() : L[-v];
      }
      if (e) row += e; out.push(row);
    }
    var c = (this.castle & 1 ? 'K' : '') + (this.castle & 2 ? 'Q' : '') + (this.castle & 4 ? 'k' : '') + (this.castle & 8 ? 'q' : '');
    return out.join('/') + ' ' + (this.turn > 0 ? 'w' : 'b') + ' ' + (c || '-') + ' ' + (this.ep >= 0 ? sqName(this.ep) : '-') + ' ' + this.half + ' ' + this.full;
  };

  /* 칸 s 를 color 쪽 말이 공격하는가 */
  Game.prototype.attacked = function (s, color) {
    var b = this.board, f = file(s), r = rank(s), i, nf, nr, v, d, df, dr;
    var pr = r - color; // 폰이 공격하려면 s 보다 한 칸 아래(자기 기준)에 있어야 함
    if (pr >= 0 && pr < 8) {
      if (f > 0 && b[pr * 8 + f - 1] === color * P) return true;
      if (f < 7 && b[pr * 8 + f + 1] === color * P) return true;
    }
    for (i = 0; i < 8; i++) {
      nf = f + KN[i][0]; nr = r + KN[i][1];
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8 && b[nr * 8 + nf] === color * N) return true;
      nf = f + KG[i][0]; nr = r + KG[i][1];
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8 && b[nr * 8 + nf] === color * K) return true;
    }
    for (d = 0; d < 8; d++) {
      df = (d < 4 ? ORTH[d] : DIAG[d - 4])[0]; dr = (d < 4 ? ORTH[d] : DIAG[d - 4])[1];
      nf = f + df; nr = r + dr;
      while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
        v = b[nr * 8 + nf];
        if (v) {
          if (v * color > 0) { v = Math.abs(v); if (v === Q || (d < 4 ? v === R : v === B)) return true; }
          break;
        }
        nf += df; nr += dr;
      }
    }
    return false;
  };
  Game.prototype.inCheck = function (color) { color = color || this.turn; return this.attacked(this.kingSq[color > 0 ? 1 : 2], -color); };

  function mk(from, to, piece, cap, extra) {
    var m = { from: from, to: to, piece: piece, captured: cap || 0, promo: 0, ep: false, castle: 0, double: false };
    if (extra) for (var k in extra) m[k] = extra[k];
    return m;
  }

  /* 의사 합법(왕이 체크에 놓이는지는 나중에 걸러냄) */
  Game.prototype.pseudo = function () {
    var b = this.board, t = this.turn, out = [], s, v, a, f, r, i, nf, nr, to, tv, d, df, dr, dir, start, last;
    for (s = 0; s < 64; s++) {
      v = b[s]; if (!v || v * t < 0) continue; a = v * t; f = file(s); r = rank(s);
      if (a === P) {
        dir = t; start = t > 0 ? 1 : 6; last = t > 0 ? 7 : 0;
        nr = r + dir;
        if (nr >= 0 && nr < 8) {
          to = nr * 8 + f;
          if (!b[to]) {
            if (nr === last) { for (i = Q; i >= N; i--) out.push(mk(s, to, v, 0, { promo: i * t })); }
            else {
              out.push(mk(s, to, v, 0));
              if (r === start && !b[to + dir * 8]) out.push(mk(s, to + dir * 8, v, 0, { double: true }));
            }
          }
          for (i = -1; i <= 1; i += 2) {
            nf = f + i; if (nf < 0 || nf > 7) continue;
            to = nr * 8 + nf; tv = b[to];
            if (tv && tv * t < 0) {
              if (nr === last) { for (d = Q; d >= N; d--) out.push(mk(s, to, v, tv, { promo: d * t })); }
              else out.push(mk(s, to, v, tv));
            } else if (to === this.ep && !tv) out.push(mk(s, to, v, -t * P, { ep: true }));
          }
        }
      } else if (a === N || a === K) {
        var tab = a === N ? KN : KG;
        for (i = 0; i < 8; i++) {
          nf = f + tab[i][0]; nr = r + tab[i][1];
          if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
          to = nr * 8 + nf; tv = b[to];
          if (!tv || tv * t < 0) out.push(mk(s, to, v, tv));
        }
        if (a === K) this.castleMoves(s, out);
      } else {
        for (d = (a === B ? 4 : 0); d < (a === R ? 4 : 8); d++) {
          df = (d < 4 ? ORTH[d] : DIAG[d - 4])[0]; dr = (d < 4 ? ORTH[d] : DIAG[d - 4])[1];
          nf = f + df; nr = r + dr;
          while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
            to = nr * 8 + nf; tv = b[to];
            if (!tv) out.push(mk(s, to, v, 0));
            else { if (tv * t < 0) out.push(mk(s, to, v, tv)); break; }
            nf += df; nr += dr;
          }
        }
      }
    }
    return out;
  };
  Game.prototype.castleMoves = function (s, out) {
    var t = this.turn, b = this.board, home = t > 0 ? 4 : 60, base = t > 0 ? 0 : 56;
    if (s !== home) return;
    var ks = t > 0 ? 1 : 4, qs = t > 0 ? 2 : 8;
    if (!(this.castle & (ks | qs))) return;
    if (this.attacked(s, -t)) return;
    if ((this.castle & ks) && b[base + 7] === t * R && !b[base + 5] && !b[base + 6] &&
      !this.attacked(base + 5, -t) && !this.attacked(base + 6, -t)) out.push(mk(s, base + 6, t * K, 0, { castle: 1 }));
    if ((this.castle & qs) && b[base] === t * R && !b[base + 1] && !b[base + 2] && !b[base + 3] &&
      !this.attacked(base + 3, -t) && !this.attacked(base + 2, -t)) out.push(mk(s, base + 2, t * K, 0, { castle: 2 }));
  };

  /* 수를 실제로 둠(검사 없음) */
  Game.prototype.make = function (m) {
    var b = this.board, t = this.turn;
    var u = { m: m, castle: this.castle, ep: this.ep, half: this.half, full: this.full, king: this.kingSq[t > 0 ? 1 : 2] };
    b[m.from] = 0;
    if (m.ep) b[m.to - t * 8] = 0;
    b[m.to] = m.promo || m.piece;
    if (m.castle) {
      var base = t > 0 ? 0 : 56;
      if (m.castle === 1) { b[base + 5] = b[base + 7]; b[base + 7] = 0; } else { b[base + 3] = b[base]; b[base] = 0; }
    }
    if (Math.abs(m.piece) === K) this.kingSq[t > 0 ? 1 : 2] = m.to;
    // 캐슬링 권리
    var c = this.castle;
    if (Math.abs(m.piece) === K) c &= t > 0 ? ~3 : ~12;
    if (m.from === 0 || m.to === 0) c &= ~2; if (m.from === 7 || m.to === 7) c &= ~1;
    if (m.from === 56 || m.to === 56) c &= ~8; if (m.from === 63 || m.to === 63) c &= ~4;
    this.castle = c;
    this.ep = m.double ? m.from + t * 8 : -1;
    this.half = (Math.abs(m.piece) === P || m.captured) ? 0 : this.half + 1;
    if (t < 0) this.full++;
    this.turn = -t;
    this.stack.push(u);
  };
  Game.prototype.unmake = function () {
    var u = this.stack.pop(), m = u.m, b = this.board, t = -this.turn;
    this.turn = t;
    b[m.from] = m.piece;
    if (m.ep) { b[m.to] = 0; b[m.to - t * 8] = -t * P; } else b[m.to] = m.captured;
    if (m.castle) {
      var base = t > 0 ? 0 : 56;
      if (m.castle === 1) { b[base + 7] = b[base + 5]; b[base + 5] = 0; } else { b[base] = b[base + 3]; b[base + 3] = 0; }
    }
    this.castle = u.castle; this.ep = u.ep; this.half = u.half; this.full = u.full;
    this.kingSq[t > 0 ? 1 : 2] = u.king;
  };

  Game.prototype.moves = function () {
    var ps = this.pseudo(), out = [], t = this.turn, i, m;
    if (this.free) return ps; /* 배우기 모드: 킹 없이 말 하나의 움직임만 연습 */
    for (i = 0; i < ps.length; i++) {
      m = ps[i]; this.make(m);
      if (!this.attacked(this.kingSq[t > 0 ? 1 : 2], -t)) out.push(m);
      this.unmake();
    }
    return out;
  };
  Game.prototype.movesFrom = function (s) { return this.moves().filter(function (m) { return m.from === s; }); };

  /* 사람이 둔 수: 합법이면 적용하고 수 객체를 돌려줌. promo: 2~5 (기본 퀸) */
  Game.prototype.move = function (from, to, promo) {
    var list = this.moves(), i, m;
    for (i = 0; i < list.length; i++) {
      m = list[i];
      if (m.from === from && m.to === to && (!m.promo || Math.abs(m.promo) === (promo || Q))) {
        m.san = this.san(m, list);
        this.make(m); this.keys.push(this.key()); return m;
      }
    }
    return null;
  };
  Game.prototype.play = function (m) { m.san = m.san || this.san(m); this.make(m); this.keys.push(this.key()); return m; };
  Game.prototype.undo = function () {
    if (!this.stack.length) return null;
    this.keys.pop(); this.unmake(); return true;
  };
  Game.prototype.last = function () { return this.stack.length ? this.stack[this.stack.length - 1].m : null; };

  /* 대수 표기(SAN) */
  Game.prototype.san = function (m, list) {
    var a = Math.abs(m.piece), s = '', i, o, amb = false, sameF = false, sameR = false;
    if (m.castle) s = m.castle === 1 ? 'O-O' : 'O-O-O';
    else {
      if (a !== P) {
        s = 'PNBRQK'[a - 1];
        list = list || this.moves();
        for (i = 0; i < list.length; i++) {
          o = list[i];
          if (o !== m && o.to === m.to && o.piece === m.piece && o.from !== m.from) { amb = true; if (file(o.from) === file(m.from)) sameF = true; if (rank(o.from) === rank(m.from)) sameR = true; }
        }
        if (amb) { if (!sameF) s += FILES[file(m.from)]; else if (!sameR) s += rank(m.from) + 1; else s += sqName(m.from); }
      } else if (m.captured) s = FILES[file(m.from)];
      if (m.captured) s += 'x';
      s += sqName(m.to);
      if (m.promo) s += '=' + 'PNBRQK'[Math.abs(m.promo) - 1];
    }
    this.make(m);
    var inCheck = this.inCheck(), has = this.moves().length > 0;
    this.unmake();
    return s + (inCheck ? (has ? '+' : '#') : '');
  };

  Game.prototype.insufficient = function () {
    var b = this.board, minors = [], s, v, a;
    for (s = 0; s < 64; s++) {
      v = b[s]; if (!v) continue; a = Math.abs(v);
      if (a === P || a === R || a === Q) return false;
      if (a === N || a === B) minors.push({ a: a, v: v, sq: (file(s) + rank(s)) & 1 });
    }
    if (minors.length <= 1) return true;
    if (minors.every(function (x) { return x.a === B; }) && minors.every(function (x) { return x.sq === minors[0].sq; })) return true;
    return false;
  };
  Game.prototype.repetitions = function () {
    var k = this.keys[this.keys.length - 1], n = 0, i;
    for (i = 0; i < this.keys.length; i++) if (this.keys[i] === k) n++;
    return n;
  };
  /* 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw-50' | 'draw-repeat' | 'draw-material' */
  Game.prototype.status = function () {
    var has = this.moves().length > 0, chk = this.inCheck();
    if (!has) return chk ? 'checkmate' : 'stalemate';
    if (this.insufficient()) return 'draw-material';
    if (this.half >= 100) return 'draw-50';
    if (this.repetitions() >= 3) return 'draw-repeat';
    return chk ? 'check' : 'playing';
  };
  Game.prototype.perft = function (d) {
    if (d === 0) return 1;
    var list = this.moves(), n = 0, i;
    if (d === 1) return list.length;
    for (i = 0; i < list.length; i++) { this.make(list[i]); n += this.perft(d - 1); this.unmake(); }
    return n;
  };

  /* ---------- 컴퓨터 상대 ---------- */
  var VAL = [0, 100, 320, 330, 500, 900, 0];
  var PST = {
    1: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    3: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    4: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    5: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    6: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20]
  };
  /* 흰색 관점 점수 */
  function evaluate(g) {
    var b = g.board, s, v, a, sc = 0, f, r;
    for (s = 0; s < 64; s++) {
      v = b[s]; if (!v) continue; a = v > 0 ? v : -v; f = s & 7; r = s >> 3;
      if (v > 0) sc += VAL[a] + PST[a][(7 - r) * 8 + f]; else sc -= VAL[a] + PST[a][r * 8 + f];
    }
    return sc;
  }
  function order(list) {
    list.forEach(function (m) {
      m.score = (m.captured ? 10 * VAL[Math.abs(m.captured)] - VAL[Math.abs(m.piece)] / 10 : 0) + (m.promo ? 800 : 0);
    });
    list.sort(function (x, y) { return y.score - x.score; });
    return list;
  }
  var deadline = 0, nodes = 0, timedOut = false;
  function quiesce(g, alpha, beta, depth) {
    var t = g.turn, stand = evaluate(g) * t;
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    if (depth <= 0) return stand;
    var list = order(g.moves().filter(function (m) { return m.captured || m.promo; })), i, sc;
    for (i = 0; i < list.length; i++) {
      g.make(list[i]); sc = -quiesce(g, -beta, -alpha, depth - 1); g.unmake();
      if (sc >= beta) return sc;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }
  function negamax(g, depth, alpha, beta, ply, q) {
    if ((++nodes & 1023) === 0 && deadline && Date.now() > deadline) timedOut = true;
    if (timedOut) return 0;
    var list = g.moves();
    if (!list.length) return g.inCheck() ? -100000 + ply : 0;
    if (g.half >= 100) return 0;
    if (depth <= 0) return q ? quiesce(g, alpha, beta, q) : evaluate(g) * g.turn;
    order(list);
    var i, sc, best = -Infinity;
    for (i = 0; i < list.length; i++) {
      g.make(list[i]); sc = -negamax(g, depth - 1, -beta, -alpha, ply + 1, q); g.unmake();
      if (timedOut) return 0;
      if (sc > best) best = sc;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }
  /* 수준별 설정: depth=읽는 수, noise=일부러 허술하게(점수 범위), q=잡기 이어 읽기, ms=시간 제한 */
  var LEVELS = {
    1: { depth: 0, noise: 99999 },
    2: { depth: 1, noise: 200, q: 0 },
    3: { depth: 2, noise: 70, q: 0 },
    4: { depth: 3, noise: 20, q: 2, ms: 1800 },
    5: { depth: 4, noise: 0, q: 4, ms: 3000 }
  };
  function scoreMoves(g, list, depth, q, ms) {
    var res = [], i, sc, d, last;
    deadline = ms ? Date.now() + ms : 0; timedOut = false; nodes = 0;
    order(list);
    for (d = 1; d <= Math.max(1, depth); d++) {
      var cur = [], alpha = -Infinity;
      for (i = 0; i < list.length; i++) {
        g.make(list[i]); sc = -negamax(g, d - 1, -Infinity, Infinity, 1, q); g.unmake();
        if (timedOut) break;
        cur.push({ m: list[i], s: sc });
      }
      if (timedOut) break;
      res = cur;
      res.sort(function (x, y) { return y.s - x.s; });
      list = res.map(function (r) { return r.m; });
    }
    if (!res.length) res = list.map(function (m) { return { m: m, s: 0 }; });
    return res;
  }
  var ai = {
    levels: LEVELS,
    evaluate: evaluate,
    /* 컴퓨터가 둘 수를 고름(적용은 하지 않음) */
    choose: function (g, level) {
      var cfg = LEVELS[level] || LEVELS[3], list = g.moves(), i, pool;
      if (!list.length) return null;
      if (cfg.depth === 0) {
        /* 1단계: 거의 무작위. 잡을 수 있으면 가끔 잡기 */
        var caps = list.filter(function (m) { return m.captured; });
        if (caps.length && Math.random() < 0.3) return caps[(Math.random() * caps.length) | 0];
        return list[(Math.random() * list.length) | 0];
      }
      var scored = scoreMoves(g, list.slice(), cfg.depth, cfg.q, cfg.ms), top = scored[0].s;
      /* 외통수가 보이면 항상 둠 */
      if (top > 90000) return scored[0].m;
      pool = scored.filter(function (r) { return r.s >= top - cfg.noise; });
      return pool[(Math.random() * pool.length) | 0].m;
    },
    /* 도움말(힌트): 3수 정도 읽은 좋은 수 */
    hint: function (g) {
      var list = g.moves(); if (!list.length) return null;
      return scoreMoves(g, list.slice(), 3, 2, 1500)[0].m;
    }
  };

  root.OKS_CHESS = { Game: Game, ai: ai, START: START, NAME: NAME, sqName: sqName, sqFrom: sqFrom, P: P, N: N, B: B, R: R, Q: Q, K: K };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.OKS_CHESS;
})(typeof window !== 'undefined' ? window : globalThis);
