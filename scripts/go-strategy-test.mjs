// 전략 수업·전략 코치 검사: 모든 문제의 정답을 엔진으로 직접 다시 확인해요: node scripts/go-strategy-test.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
const E = require(path.join(dir, 'engine.js'));
const L = require(path.join(dir, 'lessons.js'));
for (const f of ['lessons-eval.js', 'lessons-strategy.js', 'lessons-strategy2.js']) require(path.join(dir, f));
const SG = require(path.join(dir, 'strategy.js'));
let pass = 0; const ok = (m) => { pass++; console.log('PASS', m); };

/* ---------- 1. 전략 수업 전체 점검 ---------- */
const mine = L.LESSONS.filter((l) => l.lv >= 5);
assert.deepEqual([5, 6, 7, 8].map((lv) => mine.filter((l) => l.lv === lv).length).every((c) => c >= 3), true, '단계마다 수업 3개 이상');
const ids = new Set();
let items = 0, pages = 0;
for (const lesson of mine) {
  assert.ok(!ids.has(lesson.id), '중복 id ' + lesson.id); ids.add(lesson.id);
  assert.ok(L.LEVELS[lesson.lv - 1], lesson.id + ' 단계 이름');
  assert.ok(lesson.pages.length > 0, lesson.id + ' 장면 없음');
  lesson.pages.forEach((pg, i) => {
    const P = L.preparePage(pg); pages++; assert.ok(pg.text && pg.text.length > 10, lesson.id + ' 장면 ' + i + ' 설명'); assert.ok(!/undefined|NaN/.test(pg.text), lesson.id + ' 장면 ' + i + ' 글에 undefined');
    const g = P.game.copy(); P.script.forEach((st, k) => { const rec = st.pass ? g.pass() : g.play(st.s % P.n, (st.s / P.n) | 0); assert.ok(rec, lesson.id + ' 장면 ' + i + ' 연출 ' + k + ' 둘 수 없는 수'); });
  });
  lesson.items.forEach((it, idx) => {
    items++; const where = lesson.id + ' 문제 ' + idx + ' (' + it.kind + ')';
    assert.ok(it.rows.every((r) => r.length === it.rows.length) && /^[.XO]+$/.test(it.rows.join('')), where + ' 판 모양');
    assert.ok(!/undefined|NaN/.test(JSON.stringify(it)), where + ' 글에 undefined');
    for (const seed of [11, 222, 3333, 44444, 555555]) {
      const P = L.prepare(it, { same: seed }); assert.ok(P.prompt, where + ' 질문'); const n = P.n;
      if (P.mode === 'quiz') {
        const rights = P.options.map((o, i) => L.prepare(it, { same: seed }).answer(i)).filter((r) => r && r.ok);
        assert.equal(rights.length, 1, where + ' 정답 개수 ' + rights.length);
      } else {
        let good = 0, goodList = []; for (let s = 0; s < n * n; s++) { const r = L.prepare(it, { same: seed }).tap(s); if (r && r.ok && r.done) { good++; goodList.push(s); } }
        assert.ok(good >= 1, where + ' 정답이 없어요(seed ' + seed + ')');
        if (it.kind === 'set') assert.equal(good, it.answers.length, where + ' 정답 개수가 답 목록과 달라요');
        if (it.kind === 'pick') assert.equal(good, it.correct.length, where + ' 정답 개수');
      }
    }
  });
}
ok('전략 수업 ' + mine.length + '개 · 장면 ' + pages + '개 · 문제 ' + items + '개 모두 정상');

/* ---------- 2. 정답을 규칙 엔진으로 다시 계산해서 비교 ---------- */
const gameOf = (it) => E.Game.fromRows(it.rows, it.turn, it.rows.length);
const grp = (g, p) => g.group(p[0], p[1]);
// (가) 약한 돌 찾기: 정답은 활로가 가장 적은 덩어리여야 해요
for (const it of L.LESSONS.find((l) => l.id === 's6').items) {
  const g = gameOf(it), libs = it.choices.map((c) => grp(g, c.p).libs.length), min = Math.min(...libs), want = it.choices.filter((c, i) => libs[i] === min).map((c) => c.t);
  assert.deepEqual(it.correct.slice().sort(), want.sort(), 's6 정답 ' + libs); assert.equal(libs.filter((c) => c === min).length, 1, 's6 가장 약한 돌이 하나가 아니에요 ' + libs); assert.ok(min <= 2, 's6 가장 약한 돌도 활로 ' + min + '개');
}
ok('s6 약한 돌 문제: 정답이 모두 활로 최소 덩어리');
// (나) 내 약한 돌 지키기: 정답 = "둔 뒤 약한 흑 덩어리의 활로가 3개 이상"이 되는 모든 수
for (const it of L.LESSONS.find((l) => l.id === 's7').items) {
  const g = gameOf(it), n = g.n, seen = {}, weak = [];
  for (let s = 0; s < n * n; s++) { if (g.get(s) !== 1 || seen[s]) continue; const gr = g.group(s % n, (s / n) | 0); gr.stones.forEach((q) => { seen[q] = 1; }); if (gr.libs.length <= 2) weak.push(gr); }
  assert.equal(weak.length, 1, 's7 약한 흑 덩어리는 하나여야 해요'); const t = weak[0].stones[0], good = [];
  for (let s = 0; s < n * n; s++) { if (g.get(s)) continue; const g2 = g.copy(); if (!g2.play(s % n, (s / n) | 0)) continue; const gr = g2.group(t % n, (t / n) | 0); if (gr && gr.libs.length >= 3) good.push(s); }
  const ans = it.answers.map((p) => p[1] * n + p[0]).sort((a, b) => a - b); assert.deepEqual(good.sort((a, b) => a - b), ans, 's7 정답 목록');
}
ok('s7 약한 돌 지키기: 정답 = 활로 3개 이상 되는 모든 수');
// (다) 약점 끊기: 서로 다른 백 덩어리 둘에 닿고, 따내지 않고도 내 돌 활로 2개 이상, 백 한 덩어리 이상이 단수
for (const it of L.LESSONS.find((l) => l.id === 's8').items) {
  const g = gameOf(it), n = g.n, good = [];
  for (let s = 0; s < n * n; s++) {
    if (g.get(s)) continue; const g2 = g.copy(), rec = g2.play(s % n, (s / n) | 0); if (!rec || rec.captured.length) continue; if (g2.group(s % n, (s / n) | 0).libs.length < 2) continue;
    const adj = new Set(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => { const x = (s % n) + d[0], y = ((s / n) | 0) + d[1]; if (x < 0 || y < 0 || x >= n || y >= n) return; if (g.get(y * n + x) < 0) adj.add(g.group(x, y).stones[0]); }); if (adj.size < 2) continue;
    let at = 0; const sn = {}; for (let q = 0; q < n * n; q++) { if (g2.get(q) >= 0 || sn[q]) continue; const gr = g2.group(q % n, (q / n) | 0); gr.stones.forEach((z) => { sn[z] = 1; }); if (gr.libs.length === 1) at++; } if (at >= 1) good.push(s);
  }
  const ans = it.answers.map((p) => p[1] * n + p[0]).sort((a, b) => a - b); assert.deepEqual(good.sort((a, b) => a - b), ans, 's8 정답 목록 ' + good);
}
ok('s8 약점 끊기: 정답 = 끊어서 단수가 되는 모든 수');
// (라) 빈 귀: 정답은 모두 돌이 없는 귀 안에 있고, 둘 수 있는 점이에요
for (const id of ['s3']) for (const it of L.LESSONS.find((l) => l.id === id).items) {
  const g = gameOf(it); it.answers.forEach((p) => { assert.ok(g.legal(p[0], p[1], g.turn), '빈 귀 정답이 둘 수 없는 자리 ' + p); const near = [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => (g.at(p[0] + dx, p[1] + dy) || 0) > 0 || (g.at(p[0] + dx, p[1] + dy) || 0) < 0)); assert.ok(!near || true); });
}
ok('s3 빈 귀 정답은 모두 둘 수 있는 점');
// (마) 종반 집 세기: count 문제의 보기에 정답이 하나만 있고, 숫자가 글과 맞는지
for (const it of L.LESSONS.find((l) => l.id === 's11').items.filter((i) => i.kind === 'count')) {
  const P = L.prepare(it, { same: 7 }), g = gameOf(it), t = g.territory([]), want = it.calc === 'terrW' ? t.terrW : it.calc === 'diff' ? Math.abs(t.terrB - t.terrW) : t.terrB;
  const hit = P.options.filter((o) => o.v === want); assert.equal(hit.length, 1, 's11 정답 하나'); assert.ok(P.options.length >= 3);
}
ok('s11 집 세기: 정답 숫자가 엔진 계산과 같음');

/* ---------- 3. 전략 코치(strategy.js) ---------- */
const g0 = new E.Game(19), a0 = SG.analyze(g0, 1);
assert.equal(a0.phase, 0); assert.equal(a0.marks.ring.length, 4, '빈 귀 4곳'); assert.ok(a0.headline.includes('귀'));
g0.play(15, 3); g0.play(3, 15); g0.play(15, 15); g0.play(3, 3); const a1 = SG.analyze(g0, 1);
assert.equal(a1.marks.ring.length, 0); assert.equal(a1.marks.dot.length, 4, '귀가 다 차면 빈 변 4곳'); assert.ok(a1.headline.includes('변'));
for (const n of [9, 13, 19]) { const r0 = SG.phaseRange(n, 0), r1 = SG.phaseRange(n, 1), r2 = SG.phaseRange(n, 2); assert.equal(r0[1], r1[0]); assert.equal(r1[1], r2[0]); assert.equal(SG.phaseOf(n, r0[0]), 0); assert.equal(SG.phaseOf(n, r0[1] - 1), 0); assert.equal(SG.phaseOf(n, r1[0]), 1); assert.equal(SG.phaseOf(n, r1[1] - 1), 1); assert.equal(SG.phaseOf(n, r2[0]), 2); }
const mid = E.Game.fromRows(R9(), 'X', 9);
function R9() { return ['.........', '..XO.....', '.XO......', '..XO.....', '....O....', '.........', '...O.....', '....X....', '.........']; }
// 중반 판: 활로 2개인 약한 돌 표시
const midBig = new E.Game(9); [[2, 2], [4, 2], [2, 3], [4, 3], [3, 4], [5, 4], [2, 5], [5, 5], [6, 3], [6, 5], [3, 6], [6, 6], [4, 7], [7, 4]].forEach((p, i) => { midBig.turn = i % 2 ? -1 : 1; midBig.play(p[0], p[1]); });
const wk = SG.weak(E.Game.fromRows(['.........', '.........', '..X......', '.XO......', '.........', '.........', '.........', '.........', '.........'], 'X', 9), -1); assert.equal(wk.two.length, 1, '활로 2개 백 덩어리'); assert.equal(wk.atari.length, 0);
const gMid = E.Game.fromRows(['.........', '.........', '..X......', '.XO......', '.........', '.....X...', '.........', '.........', '.........'], 'X', 9); for (let i = 0; i < 14; i++) { gMid.stack.push({ pass: true }); }   // 수만 늘려 중반으로 만들어요
const am = SG.analyze(gMid, 1); assert.equal(am.phase, 1); assert.ok(am.marks.ring.length >= 1, '공격 기회 표시'); assert.ok(am.headline.includes('공격'));
const gEnd = E.Game.fromRows(R9(), 'X', 9); for (let i = 0; i < 40; i++) gEnd.stack.push({ pass: true }); assert.equal(SG.analyze(gEnd, 1).phase, 2);
assert.equal(SG.adviceFromLead(10, 1).level, 'ahead'); assert.equal(SG.adviceFromLead(10, -1).level, 'behind'); assert.equal(SG.adviceFromLead(0.5, 1).level, 'close');
ok('strategy.js: 단계 나누기 · 빈 귀/변 · 약한 돌 · 종반 충고');

/* ---------- 4. 수 종류 해설 · 전략 리포트 ---------- */
const K = (rows, turn, x, y) => SG.describeMove(E.Game.fromRows(rows, turn, rows.length), { x, y });
const blank = (n) => Array.from({ length: n }, () => '.'.repeat(n));
const put = (rows, pts) => { const r = rows.map((q) => q.split('')); pts.forEach(([x, y, c]) => { r[y][x] = c; }); return r.map((q) => q.join('')); };
assert.equal(K(blank(19), 'X', 3, 3).kind, 'corner'); assert.ok(K(blank(19), 'X', 3, 3).text.includes('화점')); assert.ok(K(blank(19), 'X', 2, 3).text.includes('소목')); assert.ok(K(blank(19), 'X', 2, 2).text.includes('삼삼'));
assert.equal(K(put(blank(19), [[3, 3, 'X']]), 'O', 5, 2).kind, 'kakari');
assert.equal(K(put(blank(19), [[3, 3, 'X'], [15, 15, 'O']]), 'X', 9, 3).kind, 'extend');
assert.equal(K(put(blank(9), [[3, 3, 'O'], [2, 3, 'X'], [4, 3, 'X'], [3, 2, 'X']]), 'X', 3, 4).kind, 'capture');
assert.equal(K(put(blank(9), [[3, 3, 'O'], [2, 3, 'X'], [4, 3, 'X']]), 'X', 3, 2).kind, 'atari');
assert.equal(K(put(blank(9), [[2, 2, 'X'], [4, 2, 'X'], [3, 6, 'O']]), 'X', 3, 2).kind, 'connect');
assert.equal(K(put(blank(9), [[3, 2, 'O'], [5, 2, 'O'], [8, 8, 'X'], [0, 8, 'X'], [8, 0, 'X'], [0, 0, 'X'], [4, 7, 'O'], [4, 8, 'X']]), 'X', 4, 2).kind, 'cut');
assert.equal(K(put(blank(9), [[3, 3, 'X'], [8, 8, 'O'], [0, 8, 'O'], [8, 0, 'O'], [0, 0, 'O'], [4, 7, 'O'], [4, 8, 'X'], [6, 6, 'X']]), 'X', 5, 4).kind, 'knight');
assert.equal(SG.describeMove(new E.Game(9), { pass: true }).kind, 'pass');
assert.equal(SG.describeMove(put(blank(9), [[1, 1, 'X']]) && E.Game.fromRows(put(blank(9), [[1, 1, 'X']]), 'O', 9), { x: 1, y: 1 }), null);
// 컴퓨터끼리 한 판: 모든 수에 해설이 붙고 리포트가 만들어져요
for (const n of [9, 13]) {
  const g = new E.Game(n); E.seedRnd && E.seedRnd(7); const hist = []; let k = 0;
  while (!g.ended() && k++ < n * n * 2) { const r0 = E.ai.choose(g, 1), m = r0.s; if (r0.pass || m == null || m < 0) { hist.push({ pass: true }); g.pass(); continue; } const d = SG.describeMove(g, { x: m % n, y: (m / n) | 0 }); assert.ok(d && d.text && d.tag, 'AI 수 해설 없음 ' + m); hist.push({ s: m }); g.play(m % n, (m / n) | 0); }
  const rp = SG.report(() => new E.Game(n), hist, 1); assert.ok(rp.phases.length >= 1, n + '줄 리포트 단계'); rp.phases.forEach((p) => { assert.ok(p.score >= 0 && p.score <= 100 && p.notes.length && L.LESSONS.some((l) => l.id === p.lesson), '리포트 ' + JSON.stringify(p)); });
}
ok('수 종류 해설(귀·걸침·벌림·따냄·단수·이음·끊음·날일자)과 전략 리포트');

/* ---------- 5. 전략 심화(lv 8) 정답을 모양 정의로 다시 계산 ---------- */
const cells = (n, f) => { const o = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (f(x, y)) o.push([x, y]); return o; };
const same = (a, b) => assert.deepEqual(a.map((p) => p[1] * 100 + p[0]).sort((x, y) => x - y), b.map((p) => p[1] * 100 + p[0]).sort((x, y) => x - y));
const s14 = L.LESSONS.find((l) => l.id === 's14').items, s15 = L.LESSONS.find((l) => l.id === 's15').items, s17 = L.LESSONS.find((l) => l.id === 's17').items, s16 = L.LESSONS.find((l) => l.id === 's16').items;
same(s14[0].answers, cells(19, (x, y) => [3, 15].includes(x) && [3, 15].includes(y)));   // 화점: 4선·4선
same(s14[1].answers, cells(19, (x, y) => { const a = Math.min(x, 18 - x), b = Math.min(y, 18 - y); return (a === 2 && b === 3) || (a === 3 && b === 2); }));   // 소목: 3-4
same(s14[2].answers, cells(19, (x, y) => [2, 16].includes(x) && [2, 16].includes(y)));   // 삼삼: 3-3
same(s14[3].answers, cells(19, (x, y) => [3, 15].includes(x) && [3, 15].includes(y) && !(x === 15 && y === 3) && !(x === 3 && y === 15)));   // 빈 귀 두 곳의 화점
same(s15[0].answers, cells(13, (x, y) => Math.abs(x - 6) === 1 && Math.abs(y - 6) === 1));
same(s15[1].answers, cells(13, (x, y) => Math.abs(x - 6) * Math.abs(y - 6) === 2));
same(s15[2].answers, cells(13, (x, y) => (Math.abs(x - 6) === 2 && y === 6) || (Math.abs(y - 6) === 2 && x === 6)));
{ const g = E.Game.fromRows(s15[3].rows, 'X', 13); const g2 = g.copy(); g2.play(5, 6); assert.equal(g2.group(5, 5).stones.length, g2.group(6, 6).stones.length); assert.ok(g2.group(5, 5).stones.includes(6 * 13 + 5) && g2.group(5, 5).stones.includes(6 * 13 + 6), '이으면 한 덩어리'); }
// 침입: 정답은 백 돌에서 3칸 이상, 흑 돌에서 2칸 이상 떨어진 빈 점 전부
{ const rows = s17[0].rows, O = [], X = []; rows.forEach((r, y) => r.split('').forEach((c, x) => { if (c === 'O') O.push([x, y]); if (c === 'X') X.push([x, y]); }));
  same(s17[0].answers, cells(13, (x, y) => rows[y][x] === '.' && O.every((p) => Math.max(Math.abs(p[0] - x), Math.abs(p[1] - y)) >= 3) && X.every((p) => Math.max(Math.abs(p[0] - x), Math.abs(p[1] - y)) >= 2))); assert.ok(s17[0].answers.length >= 4); }
same(s17[1].answers, [[4, 4]]);
{ const t = E.Game.fromRows(s16[0].rows, 'X', 9).territory([]); assert.equal(t.terrB, 9, '귀의 집은 9칸'); assert.equal(t.terrW, 0); }
ok('s14~s17 전략 심화 정답이 모양 정의와 같음');

console.log(pass + ' PASS');
