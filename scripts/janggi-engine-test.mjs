// 장기 규칙 엔진 검사: node scripts/janggi-engine-test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const J = require('../playground/janggi/engine.js');
let pass = 0; const ok = (name) => { pass++; console.log('PASS', name); };
const LET = { p: 1, h: 2, e: 3, r: 4, c: 5, a: 6, k: 7 };
const sq = (f, r) => r * 9 + f;
/* 판 만들기: 목록 [글자, 칸, 줄]. 대문자=초, 소문자=한. 궁이 없으면 멀리 둠 */
function mk(list, turn) {
  const g = new J.Game('inner', 'inner'); g.board.fill(0);
  list.forEach(([ch, f, r]) => { const v = LET[ch.toLowerCase()]; g.board[sq(f, r)] = ch === ch.toLowerCase() ? -v : v; });
  g.turn = turn === 'h' ? -1 : 1; g.stack = []; g.keys = []; g.findKings(); g.keys.push(g.fen()); return g;
}
const base = () => [['K', 3, 0], ['k', 5, 9]];                // 서로 다른 칸에 있는 두 궁
const to = (g, f, r) => g.movesFrom(sq(f, r)).map((m) => m.to).sort((a, b) => a - b);
const T = (g, f, r, list) => assert.deepEqual(to(g, f, r), list.map(([a, b]) => sq(a, b)).sort((x, y) => x - y));
let g;

g = new J.Game('inner', 'inner');
assert.equal(g.board.filter((v) => v > 0).length, 16); assert.equal(g.board.filter((v) => v < 0).length, 16);
assert.equal(g.board[sq(4, 1)], J.K); assert.equal(g.board[sq(4, 8)], -J.K); ok('시작 말 16개씩, 궁 자리');
['left', 'right', 'inner', 'outer'].forEach((s) => { const x = new J.Game(s, s); assert.equal(x.board.filter(Boolean).length, 32); assert.ok(x.moves().length > 20); });
ok('상차림 4가지');

// 졸
g = mk([...base(), ['P', 4, 4]]); T(g, 4, 4, [[4, 5], [3, 4], [5, 4]]); ok('졸: 앞·옆');
g = mk([['K', 3, 0], ['k', 4, 9], ['P', 3, 7]]); T(g, 3, 7, [[3, 8], [2, 7], [4, 7], [4, 8]]); ok('졸: 적 궁성 대각선 앞');
g = mk([['K', 3, 0], ['k', 5, 9], ['p', 4, 6]], 'h'); T(g, 4, 6, [[4, 5], [3, 6], [5, 6]]); ok('병: 한은 아래로');
// 마
g = mk([...base(), ['H', 4, 4]]); T(g, 4, 4, [[3, 6], [5, 6], [2, 5], [6, 5], [2, 3], [6, 3], [3, 2], [5, 2]]); ok('마: 8방향');
g = mk([...base(), ['H', 4, 4], ['P', 4, 5]]); assert.equal(to(g, 4, 4).includes(sq(3, 6)), false); assert.equal(to(g, 4, 4).includes(sq(5, 6)), false); ok('마: 앞이 막히면 못 가요');
// 상
g = mk([...base(), ['E', 4, 4]]); T(g, 4, 4, [[2, 7], [6, 7], [1, 6], [7, 6], [1, 2], [7, 2], [2, 1], [6, 1]]); ok('상: 8방향');
g = mk([...base(), ['E', 4, 4], ['P', 4, 5]]); assert.equal(to(g, 4, 4).includes(sq(2, 7)), false); ok('상: 첫 길이 막히면 못 가요');
g = mk([...base(), ['E', 4, 4], ['P', 3, 6]]); assert.equal(to(g, 4, 4).includes(sq(2, 7)), false); assert.equal(to(g, 4, 4).includes(sq(6, 7)), true); ok('상: 가운데 길이 막히면 못 가요');
// 차
g = mk([...base(), ['R', 4, 4], ['p', 4, 7], ['P', 7, 4]]);
assert.ok(to(g, 4, 4).includes(sq(4, 7))); assert.equal(to(g, 4, 4).includes(sq(4, 8)), false); assert.equal(to(g, 4, 4).includes(sq(7, 4)), false); assert.ok(to(g, 4, 4).includes(sq(6, 4))); ok('차: 직선, 상대는 잡고 내 말 앞에서 멈춰요');
g = mk([['K', 3, 0], ['k', 4, 9], ['R', 3, 7]]);   // 한 궁성 모서리에서 대각선으로 가운데·반대 모서리
assert.ok(to(g, 3, 7).includes(sq(4, 8))); assert.ok(to(g, 3, 7).includes(sq(5, 9))); ok('차: 궁성 대각선');
g = mk([['K', 3, 0], ['k', 5, 9], ['R', 4, 8]]); assert.ok(to(g, 4, 8).includes(sq(3, 7))); assert.ok(to(g, 4, 8).includes(sq(3, 9))); ok('차: 궁성 가운데에서 모서리로');
// 포
g = mk([...base(), ['C', 4, 3], ['p', 4, 5], ['p', 4, 7], ['p', 4, 8]]);
assert.equal(to(g, 4, 3).includes(sq(4, 4)), false); assert.equal(to(g, 4, 3).includes(sq(4, 5)), false);
assert.ok(to(g, 4, 3).includes(sq(4, 6))); assert.ok(to(g, 4, 3).includes(sq(4, 7))); assert.equal(to(g, 4, 3).includes(sq(4, 8)), false); ok('포: 하나를 넘어서 가요 (두 번째 말은 못 넘어요)');
g = mk([...base(), ['C', 4, 3], ['c', 4, 5], ['p', 4, 7]]); assert.equal(to(g, 4, 3).includes(sq(4, 7)), false); assert.equal(to(g, 4, 3).includes(sq(4, 6)), false); ok('포: 포는 넘을 수 없어요');
g = mk([...base(), ['C', 4, 3], ['p', 4, 5], ['c', 4, 7]]); assert.equal(to(g, 4, 3).includes(sq(4, 7)), false); ok('포: 포는 잡을 수 없어요');
g = mk([['K', 5, 2], ['k', 4, 9], ['C', 3, 7], ['p', 4, 8], ['p', 5, 9]]); // 포가 궁성 모서리에서 가운데 말을 넘어 반대 모서리
assert.ok(to(g, 3, 7).includes(sq(5, 9))); ok('포: 궁성 대각선');
// 사·궁
g = mk([['K', 3, 0], ['k', 5, 9], ['A', 4, 1]]); T(g, 4, 1, [[4, 0], [5, 0], [3, 1], [5, 1], [4, 2], [3, 2], [5, 2]]); ok('사: 궁성 안 한 칸 (궁 자리는 못 가요)');
g = mk([['K', 3, 0], ['k', 5, 9]]); T(g, 3, 0, [[4, 0], [3, 1], [4, 1]]); ok('궁: 궁성 안에서만');
// 궁끼리 마주 보기 · 장군 · 외통
g = mk([['K', 4, 0], ['k', 4, 9], ['R', 4, 5]]);
assert.deepEqual(to(g, 4, 5).filter((t) => t % 9 !== 4), []); ok('두 궁 사이 차는 길 밖으로 못 나가요 (마주 보기 금지)');
g = mk([['K', 3, 0], ['k', 5, 9], ['R', 3, 5]]); assert.equal(g.inCheck(-1), false); g.turn = -1; assert.equal(g.inCheck(), false);
g = mk([['K', 3, 0], ['k', 5, 9], ['R', 5, 4]], 'h'); assert.equal(g.inCheck(), true); assert.equal(g.status(), 'check'); ok('장군');
g = mk([['K', 3, 0], ['k', 4, 9], ['R', 4, 3], ['R', 3, 7], ['R', 5, 7]], 'h'); // 한 궁이 세 차에게 막힘 → 외통
assert.equal(g.inCheck(), true); assert.equal(g.moves().length, 0); assert.equal(g.status(), 'checkmate'); ok('외통');
// 한 수 쉬기와 되돌리기
g = mk([['K', 3, 0], ['k', 5, 9], ['R', 4, 5]], 'h'); const f0 = g.fen(); const r = g.pass(); assert.ok(r && r.pass); assert.equal(g.turn, 1); g.undo(); assert.equal(g.fen(), f0);
g = mk([['K', 3, 0], ['k', 5, 9], ['R', 5, 4]], 'h'); assert.equal(g.pass(), null); ok('한 수 쉬기: 장군일 땐 못 쉬어요 / 되돌리기');
// 두기·되돌리기가 판을 그대로 돌려놓는가
g = new J.Game('left', 'outer'); const start = g.fen();
for (let i = 0; i < 40; i++) { const ms = g.moves(); const m = ms[(i * 7 + 3) % ms.length]; assert.ok(g.move(m.from, m.to)); }
for (let i = 0; i < 40; i++) assert.ok(g.undo()); assert.equal(g.fen(), start); ok('두기·되돌리기 40수 왕복');
// 무작위 대국 20판: 불법한 수 없음, 궁이 잡히거나 마주 보지 않음
let games = 0, plies = 0;
for (let n = 0; n < 20; n++) {
  const sets = ['left', 'right', 'inner', 'outer']; g = new J.Game(sets[n % 4], sets[(n + 1) % 4]);
  for (let i = 0; i < 160; i++) {
    const st = g.status(); if (st === 'checkmate' || st === 'draw-repeat' || st === 'score') break;
    if (st === 'nomove') { assert.ok(g.pass()); continue; }
    const ms = g.moves(); assert.ok(ms.length > 0); const m = ms[(Math.random() * ms.length) | 0]; g.move(m.from, m.to); plies++;
    assert.ok(g.ks[0] >= 0 && g.ks[1] >= 0 && !g.facing(), '궁이 사라졌거나 마주 봄');
  } games++;
}
ok('무작위 대국 ' + games + '판 (' + plies + '수): 불법 수 없음');
// 컴퓨터: 한 수 앞 외통을 찾는가, 공짜로 잡을 수 있는 차를 잡는가
g = mk([['K', 3, 0], ['k', 4, 9], ['R', 3, 6], ['R', 5, 5]]);   // 한 궁 위쪽을 두 차로 조임
let t0 = Date.now(); let mv = J.ai.choose(g, 4); console.log('  수준4 선택', mv && [mv.from, mv.to], Date.now() - t0, 'ms');
g = mk([['K', 4, 0], ['k', 3, 9], ['R', 5, 4], ['r', 5, 8]]); // 초 차가 한 차를 공짜로 잡을 수 있음
mv = J.ai.choose(g, 3); assert.equal(mv.to, sq(5, 8)); ok('컴퓨터(3): 공짜로 잡을 수 있는 차를 잡아요');
g = mk([['K', 3, 0], ['k', 4, 9], ['R', 0, 8], ['R', 8, 7]]);
mv = J.ai.choose(g, 4); g.move(mv.from, mv.to); console.log('  mate-in-1 status', g.status());
// 시간 재기
g = new J.Game('inner', 'inner'); t0 = Date.now(); J.ai.choose(g, 5); console.log('  수준5 첫 수', Date.now() - t0, 'ms');
for (let i = 0; i < 6; i++) { const m = J.ai.choose(g, 3); g.move(m.from, m.to); }
t0 = Date.now(); J.ai.choose(g, 5); console.log('  수준5 중반', Date.now() - t0, 'ms');
// 컴퓨터끼리 대국이 끝까지 가는가 (수준 2 대 3)
g = new J.Game('left', 'right'); let n = 0;
while (n++ < 400) { const st = g.status(); if (st === 'checkmate' || st === 'draw-repeat' || st === 'score') break; if (st === 'nomove') { g.pass(); continue; } const m = J.ai.choose(g, g.turn > 0 ? 2 : 3); assert.ok(m); g.move(m.from, m.to); }
console.log('  AI 대국 결과', g.status(), 'plies', g.stack.length, JSON.stringify(g.score())); ok('컴퓨터 수준2 대 3 대국이 끝까지 진행');
console.log(pass + ' PASS');
