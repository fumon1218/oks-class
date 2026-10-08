// 오셀로 규칙 엔진 검사: node scripts/othello-engine-test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const T = require('../playground/othello/engine.js');
let pass = 0; const ok = (n) => { pass++; console.log('PASS', n); };
let g = new T.Game();
assert.deepEqual(g.moves().sort((a, b) => a - b), [19, 26, 37, 44]); ok('시작 합법 수 4곳');
const perft = [1, 4, 12, 56, 244, 1396, 8200, 55092]; for (let d = 1; d <= 7; d++) assert.equal(g.perft(d), perft[d]); ok('perft 1~7 (4,12,56,244,1396,8200,55092)');
g = new T.Game(); const r = g.play(19); assert.deepEqual(r.flips, [27]); assert.equal(g.board[27], 1); assert.equal(g.turn, -1); g.undo(); assert.equal(g.board[27], -1); assert.equal(g.turn, 1); ok('두기·되돌리기');
// 자동 넘김: 흰 돌이 둘 곳이 없는 판
g = new T.Game(); g.board.fill(0); g.board[0] = 1; g.board[1] = -1; g.board[2] = 1; g.board[9] = -1; g.turn = 1; g.board[63] = -1; g.board[62] = 1;
let ms = g.moves(1); console.log('  moves black', ms);
// 무작위 끝까지: 불법 없음, 돌 수 합 일치
let games = 0, pas = 0;
for (let n = 0; n < 200; n++) { g = new T.Game(); let i = 0; while (!g.over() && i++ < 130) { const m = g.moves(); const rec = g.play(m[(Math.random() * m.length) | 0]); if (rec.passed) pas++; } const c = g.count(); assert.equal(c.b + c.w + c.empty, 64); assert.ok(g.over()); games++;
  for (let k = g.stack.length; k--;) g.undo(); assert.equal(g.count().b, 2); }
ok('무작위 ' + games + '판(넘김 ' + pas + '번): 끝까지·되돌리기 왕복');
let t = Date.now(); for (const lv of [1, 2, 3, 4, 5]) { g = new T.Game(); let mx = 0; while (!g.over()) { const t0 = Date.now(); const m = T.ai.choose(g, lv); mx = Math.max(mx, Date.now() - t0); assert.ok(g.play(m.s)); } console.log('  수준', lv, '대 자신', JSON.stringify(g.count()), '최대', mx, 'ms'); }
ok('컴퓨터 수준 1~5 합법 진행');
const score = (a, b) => { let w = 0; for (let i = 0; i < 6; i++) { g = new T.Game(); const hi = i % 2 ? -1 : 1; while (!g.over()) { const m = T.ai.choose(g, g.turn === hi ? a : b); g.play(m.s); } if (g.winner() === hi) w++; } return w; };
const w5 = score(5, 2), w4 = score(4, 1), w3 = score(3, 1); console.log('  5v2', w5, '/6  4v1', w4, '/6  3v1', w3, '/6'); assert.ok(w5 >= 5 && w4 >= 5 && w3 >= 4); ok('높은 수준이 낮은 수준을 이겨요');
for (let ty = 1; ty <= 5; ty++) { let ms0 = Date.now(), tot = 0;
  for (let i = 0; i < 100; i++) { const p = T.puzzle(ty); assert.ok(p, '문제 ' + ty); const h = new T.Game(); h.board.set(p.board); h.turn = p.turn; const leg = h.moves(); assert.ok(p.sol.every((m) => leg.includes(m))); assert.deepEqual([...T.judge(h, ty)].sort(), [...p.sol].sort()); tot += p.sol.length; }
  console.log('  문제 종류', ty, ': 100개, 평균 정답', (tot / 100).toFixed(1), '개,', Date.now() - ms0, 'ms'); }
ok('연습 문제 500개 생성·정답 검증');
console.log(pass + ' PASS');
