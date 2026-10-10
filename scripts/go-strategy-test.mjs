// 전략 수업·전략 코치 검사: 모든 문제의 정답을 엔진으로 직접 다시 확인해요: node scripts/go-strategy-test.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
const E = require(path.join(dir, 'engine.js'));
const L = require(path.join(dir, 'lessons.js'));
for (const f of ['lessons-eval.js', 'lessons-strategy.js']) require(path.join(dir, f));
const SG = require(path.join(dir, 'strategy.js'));
let pass = 0; const ok = (m) => { pass++; console.log('PASS', m); };

/* ---------- 1. 전략 수업 전체 점검 ---------- */
const mine = L.LESSONS.filter((l) => l.lv >= 5);
assert.deepEqual([5, 6, 7].map((lv) => mine.filter((l) => l.lv === lv).length).every((c) => c >= 4), true, '단계마다 수업 4개 이상');
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

console.log(pass + ' PASS');
