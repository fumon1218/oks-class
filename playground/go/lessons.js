/* 옥쌤의 즐거운 교실 — 바둑 배우기: 단계별 수업 내용과 문제 판정
   수업(LESSONS)은 설명 장면(pages)과 문제(items)로 이루어져요. 문제의 정답은 규칙 엔진과 사활 풀이기로 직접 확인하고,
   풀이가 오래 걸리는 사활 문제는 미리 계산한 답(lessons-solved.js)을 써요. 문제를 낼 때마다 판을 돌리고 뒤집어서 모양이 달라 보이게 해요. */
(function (root) {
  'use strict';
  var E = root.OKS_GO || (typeof require !== 'undefined' ? require('./engine.js') : null);
  var Game = E.Game, S = E.solver;
  var LEVELS = [{ name: '입문', sub: '처음 만나는 바둑', icon: '🌱' }, { name: '초급', sub: '기본 기술', icon: '🌿' }, { name: '중급', sub: '사활과 수읽기', icon: '🌳' }, { name: '고급', sub: '전략과 형세 판단', icon: '🏔️' }];

  /* ---------- 도구 ---------- */
  function mkRng(seed) { var a = seed | 0 || 1; return function () { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) / 4294967296; }; }
  function sym(k, x, y, n) { var m = n - 1; switch (k) { case 0: return [x, y]; case 1: return [m - x, y]; case 2: return [x, m - y]; case 3: return [m - x, m - y]; case 4: return [y, x]; case 5: return [m - y, x]; case 6: return [y, m - x]; default: return [m - y, m - x]; } }
  function rowsT(rows, k, n) { var out = []; for (var y = 0; y < n; y++) { var r = ''; out.push(r); } var grid = []; for (y = 0; y < n; y++) { grid.push([]); for (var x = 0; x < n; x++) grid[y].push('.'); }
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) { var ch = rows[y][x]; if (ch === 'X' || ch === 'O') { var p = sym(k, x, y, n); grid[p[1]][p[0]] = ch; } }
    return grid.map(function (r) { return r.join(''); }); }
  var jong = function (w) { var c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0; };
  function errText(g) { return g.err === 'ko' ? '패라서 바로 되따낼 수 없어요.' : g.err === 'suicide' ? '거기는 둘 수 없어요(두자마자 활로가 없어요).' : g.err === 'occupied' ? '이미 돌이 있어요.' : '거기는 둘 수 없어요.'; }

  /* 설명 장면 */
  function preparePage(pg) {
    var n = pg.n || (pg.rows ? pg.rows.length : 9), rows = pg.rows || [], blank = []; for (var y = 0; y < n; y++) blank.push(new Array(n + 1).join('.'));
    var g = Game.fromRows(pg.rows || blank, pg.turn || 'X', n), S2 = function (p) { return p[1] * n + p[0]; };
    var show = { rings: (pg.rings || []).map(S2), dots: (pg.dots || []).map(S2), safe: (pg.safe || []).map(S2), danger: (pg.danger || []).map(S2), atari: (pg.atari || []).map(S2), labels: (pg.labels || []).map(function (d) { return { s: S2(d), t: d[2], color: d[3] }; }) };
    if (pg.libsOf) { var gr = g.group(pg.libsOf[0], pg.libsOf[1]); if (gr) show.dots = show.dots.concat(gr.libs); }
    if (pg.terr) { var t = g.territory([]); show.terrB = []; show.terrW = []; for (var s = 0; s < n * n; s++) { if (g.get(s)) continue; if (t.own[s] > 0) show.terrB.push(s); else if (t.own[s] < 0) show.terrW.push(s); } }
    var script = (pg.script || []).map(function (st) { if (st.pass || st[0] === 'pass') return { pass: true, text: st.text || st[1], wait: st.wait }; var o = Array.isArray(st) ? { x: st[0], y: st[1], text: st[2], wait: st[3] } : st; var r = { s: o.y * n + o.x, text: o.text, wait: o.wait };
      if (o.libs) { r.show = { dots: [] }; r.libsAfter = o.libs; } if (o.show) r.show = o.show; return r; });
    return { n: n, game: g, text: pg.text, speak: pg.speak, show: show, script: script };
  }

  /* 문제 */
  function prepare(item, opts) {
    opts = opts || {}; var seed = opts.same != null ? opts.same : ((Math.random() * 1e9) | 0) + 1, rnd = mkRng(seed), n = item.rows.length, k = item.sym === false ? 0 : ((rnd() * 8) | 0);
    var T = function (p) { var q = sym(k, p[0], p[1], n); return q[1] * n + q[0]; }, Ts = function (list) { return (list || []).map(T); };
    var rows = rowsT(item.rows, k, n), g = Game.fromRows(rows, item.turn || 'X', n), tS = item.target ? T(item.target) : -1, me = g.turn;
    var P = { n: n, game: g, kind: item.kind, prompt: item.prompt, seed: seed, mode: 'tap', show: {}, mist: 0, finished: false, item: item };
    var explain = item.explain || '잘했어요!';
    var libsOfT = function (gg) { var gr = gg.group(tS % n, (tS / n) | 0); return gr ? gr.libs : []; };
    var okR = function (msg, extra) { return Object.assign({ ok: true, done: true, msg: msg, play: true }, extra || {}); };
    var badR = function (msg, extra) { return Object.assign({ ok: false, msg: msg }, extra || {}); };

    if (item.kind === 'libs') {
      var need = libsOfT(g), found = {}; P.show = { rings: [tS] }; P.need = need.length;
      P.tap = function (s) { if (g.get(s)) return badR('돌 말고, 돌 바로 옆의 빈 점을 눌러요.'); if (need.indexOf(s) < 0) return badR('거기는 활로가 아니에요. 돌 바로 위·아래·왼쪽·오른쪽의 빈 점이에요.'); if (found[s]) return null; found[s] = 1; var c = Object.keys(found).length;
        P.show = { rings: [tS], dots: Object.keys(found).map(Number) }; if (c === need.length) return { ok: true, done: true, msg: '맞아요! 활로는 모두 ' + need.length + '개예요. ' + explain, show: P.show }; return { ok: true, done: false, msg: '맞아요! (' + c + '/' + need.length + ') 더 찾아봐요.', show: P.show }; };
      P.hint = function () { var rest = need.filter(function (q) { return !found[q]; }); return rest.length ? { s: rest[0], text: '이 점도 활로예요.' } : null; };
    } else if (item.kind === 'place') {
      var cnt = 0; P.mode = 'tap'; P.tap = function (s) { var g2 = g.copy(); if (!g2.play(s % n, (s / n) | 0)) return badR(errText(g2)); cnt++; if (cnt >= item.count) return okR('잘했어요! ' + explain); return { ok: true, done: false, play: true, msg: cnt + '개 놓았어요. 더 놓아 봐요! (' + cnt + '/' + item.count + ')' }; };
      P.hint = function () { return null; };
    } else if (item.kind === 'capture' || item.kind === 'atari') {
      P.show = { rings: [] }; P.hint = function () { var ls = libsOfT(g), best = ls[0]; return { s: best, text: item.kind === 'capture' ? '활로가 남은 곳에 두어 봐요.' : '활로를 하나 막아서 1개만 남겨요.' }; };
      P.tap = function (s) {
        var g2 = g.copy(), rec = g2.play(s % n, (s / n) | 0); if (!rec) return badR(errText(g2));
        var gr = g2.group(tS % n, (tS / n) | 0), gone = !gr || g2.get(tS) !== -me;
        if (item.kind === 'capture') { if (gone) return okR('따냈어요! 돌 ' + rec.captured.length + '개를 잡았어요. ' + explain); var c = gr.libs.length; var before = libsOfT(g).length; return badR(c === 1 ? (before === 1 ? '이미 단수예요. 남은 마지막 활로를 막아야 잡혀요.' : '단수까지는 좋아요! 하지만 아직 안 잡혔어요. 마지막 활로까지 막아야 해요.') : '아직 활로가 ' + c + '개 남았어요. 활로를 모두 막아야 따낼 수 있어요.'); }
        if (gone) return okR('이미 잡았어요! ' + explain); if (gr.libs.length === 1) return okR('단수예요! 활로가 1개만 남았어요. ' + explain); return badR('활로가 ' + gr.libs.length + '개 남았어요. 1개만 남기면 단수예요.');
      };
    } else if (item.kind === 'kill' || item.kind === 'live') {
      var attacker = item.kind === 'kill' ? me : -me, depth = item.depth || 15, key = item.id, pre = (root.OKS_GO_SOLVED || {})[key];
      var gp = function (arr) { return (arr || []).map(function (q) { return T(q); }); };
      var goodS = pre ? gp(pre.good) : S.firstMoves(g, tS, attacker, me, depth, { maxNodes: 3e6 }).good;
      P.show = { rings: [] }; P.hint = function () { return goodS.length ? { s: goodS[0], text: item.hintText || '급소를 생각해 봐요. 노란 동그라미 자리예요.' } : null; };
      P.tap = function (s) {
        var g2 = g.copy(), rec = g2.play(s % n, (s / n) | 0); if (!rec) return badR(errText(g2), { noAutoHint: true });
        var isGood = goodS.indexOf(s) >= 0; var followSeq = function (m) { var line = S.line(g2, tS, attacker, -me, depth, { maxNodes: 4e5 }), seq = [], c = -me; for (var i = 0; i < line.length && i < 9; i++) { if (line[i] < 0) break; seq.push({ s: line[i], color: c }); c = -c; } return seq; };
        if (isGood) { var after = []; try { after = followSeq(); } catch (e) {} return okR(item.kind === 'kill' ? '맞아요! 이렇게 두면 잡을 수 있어요. ' + explain : '맞아요! 이렇게 두면 살아요. ' + explain, { after: after.slice(0, 6) }); }
        var seq = [{ s: s, color: me }]; var key2 = (item.id || '') + ':' + s, refs = pre && pre.ref && pre.ref[key2]; try { followSeq().forEach(function (q) { seq.push(q); }); } catch (e) {}
        var m = item.kind === 'kill' ? '그렇게 두면 상대가 이렇게 받아서 못 잡아요. (번호 순서를 봐요)' : '그렇게 두면 상대가 이렇게 공격해서 잡혀요. (번호 순서를 봐요)';
        return badR(item.wrong || m, { seq: seq.slice(0, 7), reset: true, resetDelay: 2600, noAutoHint: true });
      };
    } else if (item.kind === 'set') {
      var answers = Ts(item.answers), wrongAt = {}; (item.wrongAt || []).forEach(function (w) { wrongAt[T(w[0])] = w[1]; }); P.show = { rings: [] };
      P.hint = function () { return { s: answers[0], text: item.hintText || '노란 동그라미 자리를 봐요.' }; };
      P.tap = function (s) { var g2 = g.copy(); if (!g2.play(s % n, (s / n) | 0)) return badR(errText(g2)); if (answers.indexOf(s) >= 0) return okR(explain); return badR(wrongAt[s] || item.wrong || '다시 생각해 봐요.'); };
    } else if (item.kind === 'pick' || item.kind === 'legalpick') {
      var ch = item.choices.map(function (c) { return { s: T(c.p || c), t: c.t }; }); ch.forEach(function (c, i) { if (!c.t) c.t = 'ABCDE'[i]; });
      var correct = [];
      if (item.kind === 'legalpick') ch.forEach(function (c) { var g2 = g.copy(), ok = !!g2.play(c.s % n, (c.s / n) | 0); if ((item.want === 'legal') === ok) correct.push(c.s); }); else correct = item.correct.map(function (t) { return ch.filter(function (c) { return c.t === t; })[0].s; });
      P.show = { labels: ch.map(function (c) { return { s: c.s, t: c.t, color: '#1b2a4a' }; }) }; P.hint = function () { return { s: correct[0], text: '이 자리를 잘 살펴봐요.' }; };
      P.tap = function (s) { var c = ch.filter(function (q) { return q.s === s; })[0]; if (!c) return { ok: null, msg: '글자가 쓰여 있는 점을 눌러요.' };
        if (correct.indexOf(s) >= 0) return { ok: true, done: true, msg: (item.why && item.why[c.t]) || explain };
        var why = item.why && item.why[c.t]; if (!why && item.kind === 'legalpick') { var g2 = g.copy(), r = g2.play(s % n, (s / n) | 0); why = item.want === 'illegal' ? '거기는 둘 수 있어요. ' + (r && r.captured.length ? '상대 돌을 따낼 수 있기 때문이에요.' : '활로가 남아 있어요.') : '거기는 둘 수 없어요. ' + errText(g2); }
        return badR(why || '다시 생각해 봐요.'); };
    } else if (item.kind === 'yn' || item.kind === 'count' || item.kind === 'eval3') {
      P.mode = 'quiz'; P.show = { rings: item.target ? [tS] : [] }; var ans, opts2;
      if (item.kind === 'yn') {
        P.options = [{ t: '예 ⭕', v: true }, { t: '아니오 ❌', v: false }];
        if (item.calc === 'legalAfter') { var g3 = g.copy(); (item.moves || []).forEach(function (m) { g3.play.apply(g3, sym(k, m[0], m[1], n)); }); var rc = item.retake, who = item.by === 'O' ? -1 : 1, q = sym(k, rc[0], rc[1], n); ans = g3.legal(q[0], q[1], who); }
        else if (item.calc === 'ladder') { ans = S.ladder(g, tS, item.chaser === 'O' ? -1 : 1, item.toMove === 'O' ? -1 : item.toMove === 'X' ? 1 : undefined); }
        else if (item.calc === 'kill') { var pk = (root.OKS_GO_SOLVED || {})[item.id]; ans = pk && pk.kill != null ? pk.kill : S.canKill(g, tS, me, item.depth || 15, { maxNodes: 3e6 }, me); }
        else ans = !!item.answer;
      } else if (item.kind === 'count') {
        var t = g.territory([]); var val = item.calc === 'terrW' ? t.terrW : item.calc === 'libs' ? libsOfT(g).length : item.calc === 'diff' ? Math.abs(t.terrB - t.terrW) : t.terrB; ans = val;
        var cand = [val - 2, val - 1, val + 1, val + 2, val + 3].filter(function (v) { return v >= 0 && v !== val; }); cand = cand.sort(function (a, b) { return Math.abs(a - val) - Math.abs(b - val); }).slice(0, 2).concat([val]).sort(function (a, b) { return a - b; });
        P.options = cand.map(function (v) { return { t: v + (item.unit || '집'), v: v }; });
      } else { ans = item.answer; P.options = [{ t: '⚫ 흑이 유리', v: 'B' }, { t: '🤝 비슷해요', v: 'E' }, { t: '⚪ 백이 유리', v: 'W' }]; }
      P.answer = function (i) { var o = P.options[i]; if (!o) return null; var right = o.v === ans; var show = item.showAfter ? { terrB: [], terrW: [] } : null; var showOf = function () { if (!item.showTerr) return null; var tt = g.territory([]), a = [], b = []; for (var s = 0; s < n * n; s++) { if (g.get(s)) continue; if (tt.own[s] > 0) a.push(s); else if (tt.own[s] < 0) b.push(s); } return { terrB: a, terrW: b }; };
        if (right) return { ok: true, done: true, msg: (item.why && item.why[String(o.v)]) || explain, show: showOf() }; return { ok: false, msg: (item.why && item.why[String(o.v)]) || (item.wrong || '다시 생각해 봐요.') }; };
      P.hint = function () { return item.target ? { s: tS, text: item.hintText || '표시된 돌을 잘 살펴봐요.' } : null; };
    }
    return P;
  }

  /* 눈 모양(빈 공간)만 주면, 백 돌이 둘러싸고 그 바깥을 흑 돌이 막은 판을 만들어요. 백의 활로는 눈 모양 안에만 남아요. */
  function shape(n, pts, ox, oy, wallEdge) {
    var g = []; for (var y = 0; y < n; y++) { g.push([]); for (var x = 0; x < n; x++) g[y].push('.'); }
    var inSp = {}; pts.forEach(function (p) { inSp[(p[0] + ox) + ',' + (p[1] + oy)] = 1; });
    var nb = function (x, y) { return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(function (q) { return q[0] >= 0 && q[1] >= 0 && q[0] < n && q[1] < n; }); };
    var wh = {}; pts.forEach(function (p) { nb(p[0] + ox, p[1] + oy).forEach(function (q) { var k = q[0] + ',' + q[1]; if (!inSp[k]) wh[k] = q; }); });
    // 백 돌이 서로 이어지도록 대각선 모서리도 백으로 채워요
    pts.forEach(function (p) { [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) { var x = p[0] + ox + d[0], y = p[1] + oy + d[1], k = x + ',' + y; if (x < 0 || y < 0 || x >= n || y >= n || inSp[k] || wh[k]) return; var c = 0; [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(function (q) { var kk = q[0] + ',' + q[1]; if (inSp[kk] || wh[kk]) c++; }); if (c >= 2) wh[k] = [x, y]; }); });
    Object.keys(wh).forEach(function (k) { g[wh[k][1]][wh[k][0]] = 'O'; });
    Object.keys(wh).forEach(function (k) { nb(wh[k][0], wh[k][1]).forEach(function (q) { var kk = q[0] + ',' + q[1]; if (!inSp[kk] && !wh[kk]) g[q[1]][q[0]] = 'X'; }); });
    // 흑 돌 벽이 끊어지지 않도록, 흑 돌 두 개 이상에 닿은 빈 점도 흑으로 채워요
    var fill = []; for (y = 0; y < n; y++) for (x = 0; x < n; x++) { if (g[y][x] !== '.' || inSp[x + ',' + y]) continue; var c = 0; nb(x, y).forEach(function (q) { if (g[q[1]][q[0]] === 'X') c++; }); if (c >= 2) fill.push([x, y]); }
    fill.forEach(function (q) { g[q[1]][q[0]] = 'X'; });
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) { if (g[y][x] !== 'X') continue; var free = 0; nb(x, y).forEach(function (q) { if (g[q[1]][q[0]] !== 'O') free++; }); if (!free) g[y][x] = 'O'; }
    return g.map(function (r) { return r.join(''); });
  }

  /* ---------- 수업 목록 ---------- */
  var LESSONS = [];
  var add = function (l) { (l.items || (l.items = [])).forEach(function (it, i) { if (!it.id) it.id = l.id + '#' + i; }); if (l.ord == null) l.ord = 50; var at = LESSONS.length; while (at > 0 && (LESSONS[at - 1].lv > l.lv || (LESSONS[at - 1].lv === l.lv && LESSONS[at - 1].ord > l.ord))) at--; LESSONS.splice(at, 0, l); return l; };
  var W = function (rows, o) { return Object.assign({ rows: rows }, o || {}); };
  var E7 = ['.......', '.......', '.......', '.......', '.......', '.......', '.......'];
  var P1 = function (item, id) { item.id = id; return item; };

  /* ===== 입문 ===== */
  add({ id: 'i1', lv: 1, ord: 10, icon: '⚫', title: '바둑판과 돌', sub: '처음 시작', play: null,
    pages: [
      { n: 9, text: '바둑은 검은 돌(흑)과 흰 돌(백)이 번갈아 한 수씩 두는 놀이예요. 검은 돌이 먼저 시작해요!' },
      { n: 9, rings: [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]], text: '돌은 칸 안이 아니라 줄과 줄이 만나는 점에 놓아요. 점에 있는 동그란 표시는 "화점"이에요. (정식 19줄 판에는 점이 361개나 있어요!)' },
      { n: 9, script: [[4, 4, '흑이 가운데에 두었어요.'], [2, 4, '이번엔 백 차례! 번갈아 두어요.'], [4, 2, '한 번 놓은 돌은 움직이지 않아요.'], [6, 4, '이렇게 흑·백이 번갈아 두며 땅을 넓혀 가요.']], text: '한 번 놓은 돌은 움직이지 않아요. 흑, 백 번갈아 한 수씩 두어요.' },
      { n: 9, text: '둘 곳이 없다고 생각하면 "한 수 쉬기(패스)"를 해요. 두 사람이 연달아 쉬면 대국이 끝나요. 바둑의 목표는 돌로 더 넓은 땅(집)을 차지하는 거예요!' }
    ],
    items: [ P1({ kind: 'place', rows: ['.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........'], count: 6, sym: false, prompt: '점을 눌러 흑·백을 번갈아 6개 놓아 봐요!', explain: '돌 놓는 법을 알았어요.' }, 'i1#0') ] });

  add({ id: 'i2', lv: 1, ord: 20, icon: '💨', title: '활로(숨구멍)', sub: '돌의 숨', play: null,
    pages: [
      { n: 9, rows: ['.........', '.........', '.........', '.........', '....X....', '.........', '.........', '.........', '.........'], libsOf: [4, 4], text: '돌에는 숨 쉬는 구멍이 있어요. 돌 바로 위·아래·왼쪽·오른쪽 점인데, 이걸 "활로"라고 해요. 한가운데 있는 돌은 활로가 4개예요!' },
      { n: 9, rows: ['.........', '.........', '.........', '.........', 'X........', '.........', '.........', '.........', '.........'], libsOf: [0, 4], text: '가장자리에 있는 돌은 활로가 3개예요. 판 밖에는 둘 수 없으니까요.' },
      { n: 9, rows: ['X........', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........'], libsOf: [0, 0], text: '구석에 있는 돌은 활로가 2개뿐이에요. 그래서 구석의 돌은 위험해지기 쉬워요.' },
      { n: 9, rows: ['.........', '.........', '.........', '...XX....', '.........', '.........', '.........', '.........', '.........'], libsOf: [3, 3], text: '같은 색 돌이 붙어 있으면 한 덩어리가 돼요. 활로는 덩어리 전체의 숫자를 세요. 이 두 돌은 활로가 6개예요.' },
      { n: 9, rows: ['.........', '.........', '....O....', '....X....', '.........', '.........', '.........', '.........', '.........'], libsOf: [4, 3], text: '상대 돌이 옆에 붙으면 활로가 줄어들어요. 이제 이 흑 돌의 활로는 3개예요.' }
    ],
    items: [
      P1({ kind: 'libs', rows: ['.......', '.......', '...O...', '...X...', '.......', '.......', '.......'], target: [3, 3], prompt: '흑 돌의 활로를 모두 눌러 봐요.', explain: '위에 백 돌이 있어서 3개예요.' }, 'i2#0'),
      P1({ kind: 'libs', rows: ['.......', '.......', '.......', 'XX.....', '.......', '.......', '.......'], target: [0, 3], prompt: '붙어 있는 두 흑 돌의 활로를 모두 눌러 봐요.', explain: '가장자리의 두 돌이라 활로가 5개예요.' }, 'i2#1'),
      P1({ kind: 'libs', rows: ['XO.....', '.......', '.......', '.......', '.......', '.......', '.......'], target: [0, 0], prompt: '구석 흑 돌의 활로를 눌러 봐요.', explain: '활로가 1개뿐이에요. 위험한 돌이에요!' }, 'i2#2'),
      P1({ kind: 'libs', rows: ['.......', '..XX...', '..OO...', '..X....', '.......', '.......', '.......'], target: [2, 2], prompt: '백 돌 두 개의 활로를 모두 눌러 봐요.', explain: '흑 돌이 위·아래에 있어서 활로가 줄었어요.' }, 'i2#3')
    ] });

  add({ id: 'i3', lv: 1, ord: 30, icon: '🎯', title: '단수와 따내기', sub: '돌 잡기', play: null,
    pages: [
      { n: 7, rows: ['.......', '.......', '..XOX..', '...X...', '.......', '.......', '.......'], turn: 'X', libsOf: [3, 2], text: '흰 돌의 활로를 세어 봐요. 위·왼쪽·오른쪽이 막혀서 활로가 1개만 남았어요. 이런 상태를 "단수"라고 해요. 곧 잡힌다는 뜻이에요!' },
      { n: 7, rows: ['...X...', '..XOX..', '.......', '.......', '.......', '.......', '.......'], turn: 'X', script: [[3, 2, '마지막 활로를 막았어요!']], text: '마지막 활로를 막으면 어떻게 될까요? 흑이 흰 돌 아래에 두어 볼게요.' },
      { n: 7, rows: ['.......', '.......', '.......', '.......', '.......', '.......', '.......'], text: '활로가 모두 막힌 돌은 잡혀서 판에서 사라져요. 이걸 "따내기"라고 해요. 따낸 돌은 점수가 되고, 그 자리는 다시 빈 점이 돼요!' },
      { n: 7, rows: ['.......', '..XX...', '.XOOX..', '..XX...', '.......', '.......', '.......'], turn: 'X', libsOf: [2, 2], text: '붙어 있는 돌 덩어리도 한꺼번에 잡을 수 있어요. 이 두 백 돌도 활로가 하나뿐이에요. (오른쪽이 비어 있어요)' },
      { n: 7, rows: ['.......', '...X...', '..OOX..', '..XX...', '.......', '.......', '.......'], turn: 'X', text: '활로가 2개 이상인 돌은 한 번에 못 잡아요. 한 곳을 막아서 "단수"로 만들면, 그다음에 잡을 수 있어요. 단수는 "곧 잡는다!"는 신호예요.' }
    ],
    items: [
      P1({ kind: 'capture', rows: ['.......', '.......', '...X...', '..XOX..', '.......', '.......', '.......'], turn: 'X', target: [3, 3], prompt: '단수예요! 흰 돌을 따내 봐요.', explain: '활로가 하나뿐일 땐 마지막 활로를 막으면 잡혀요.' }, 'i3#0'),
      P1({ kind: 'capture', rows: ['.......', '.......', '.......', 'OX.....', 'X......', '.......', '.......'], turn: 'X', target: [0, 3], prompt: '가장자리의 흰 돌도 단수예요. 따내 봐요.', explain: '가장자리 돌은 활로가 적어서 잡기 쉬워요.' }, 'i3#1'),
      P1({ kind: 'capture', rows: ['OX.....', '.......', '.......', '.......', '.......', '.......', '.......'], turn: 'X', target: [0, 0], prompt: '구석의 흰 돌을 따내 봐요.', explain: '구석 돌은 활로가 2개뿐이라 특히 위험해요.' }, 'i3#2'),
      P1({ kind: 'capture', rows: ['.......', '...X...', '..XOX..', '..XOX..', '.......', '.......', '.......'], turn: 'X', target: [3, 2], prompt: '붙어 있는 흰 돌 두 개를 한 번에 따내 봐요.', explain: '한 덩어리의 활로가 0이 되면 모두 잡혀요.' }, 'i3#3'),
      P1({ kind: 'capture', rows: ['.......', '...XX..', '..XOOX.', '..XXO..', '..X.X..', '...X...', '.......'], turn: 'X', target: [3, 2], prompt: '흰 돌 세 개가 단수예요. 따내 봐요.', explain: '활로가 한 곳뿐이면 덩어리가 커도 한 번에 잡혀요.' }, 'i3#4'),
      P1({ kind: 'atari', rows: ['.......', '.......', '..X....', '..OX...', '.......', '.......', '.......'], turn: 'X', target: [2, 3], prompt: '흰 돌에 활로가 2개 있어요. 한 곳을 막아서 "단수"로 만들어 봐요.', explain: '활로를 하나 막으면 상대 돌을 위협할 수 있어요.' }, 'i3#5'),
      P1({ kind: 'atari', rows: ['.......', '.......', 'X......', 'O......', '.......', '.......', '.......'], turn: 'X', target: [0, 3], prompt: '가장자리 흰 돌을 단수로 만들어 봐요.', explain: '활로가 2개 → 1개로 줄였어요.' }, 'i3#6')
    ] });

  root.OKS_GO_LESSONS = { LEVELS: LEVELS, LESSONS: LESSONS, prepare: prepare, preparePage: preparePage, add: add, W: W, P1: P1, shape: shape, mkRng: mkRng };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.OKS_GO_LESSONS;
})(typeof window !== 'undefined' ? window : globalThis);
