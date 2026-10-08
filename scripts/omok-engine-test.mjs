// 오목 규칙 엔진 검사: node scripts/omok-engine-test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const O = require('../playground/omok/engine.js');
let pass = 0; const ok = (n) => { pass++; console.log('PASS', n); };
const mk = (blacks, whites, turn) => { const g = new O.Game(); blacks.forEach(([x, y]) => { g.board[y * 15 + x] = 1; g.stack.push({ x, y, color: 1, s: y * 15 + x }); }); whites.forEach(([x, y]) => { g.board[y * 15 + x] = -1; g.stack.push({ x, y, color: -1, s: y * 15 + x }); }); g.turn = turn || 1; return g; };
let g = new O.Game();
for (const [x, y] of [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1],[3,0],[3,1],[4,0]]) g.place(x, y);
assert.equal(g.win.color, 1); assert.equal(g.status(), 'win'); ok('가로 5 승리');
g = mk([[3,3],[4,4],[5,5],[6,6]], [[0,0],[0,2],[0,4],[0,6]]); g.place(7, 7); assert.ok(g.win); ok('대각선 5');
g = mk([[3,3],[4,4],[5,5],[6,6],[8,8]], []); g.place(7, 7); assert.equal(g.win.cells.length, 6); ok('6목도 승리(자유 오목)');
g = mk([[5,5],[6,5],[7,5]], []); let s = g.shapes(8, 5, 1); assert.equal(s.open3 + s.three + s.four + s.open4, 1); ok('모양 감지(4개째)');
g = mk([[5,5],[6,5],[7,5]], [], 1); s = g.shapes(8, 5, 1); assert.equal(s.open4, 1); ok('열린 3 → 열린 4');
g = mk([[5,5],[6,5]], []); s = g.shapes(7, 5, 1); assert.equal(s.open3, 1); ok('열린 3 만들기');
g = mk([[5,5],[6,5],[7,5]], [[4,5]]); s = g.shapes(8, 5, 1); assert.equal(s.four, 1); assert.equal(s.open4, 0); ok('막힌 4');
g = mk([[5,5],[6,5],[8,5],[9,5]], []); s = g.shapes(7, 5, 1); assert.equal(s.five, 1); ok('가운데 채워 5');
g = mk([[5,5],[6,5],[7,5],[8,5]], [[4,5]], 1); assert.deepEqual(g.winCells(1), [5*15+9]); ok('winCells');
// AI: 이길 수 있으면 이기고, 4가 되면 막아요
for (let lv = 3; lv <= 5; lv++) {
  g = mk([[5,5],[6,5],[7,5],[8,5]], [[4,5],[5,6],[6,6]], 1); let m = O.ai.choose(g, lv); assert.equal(m.s, 5*15+9);
  g = mk([[1,1],[2,1]], [[5,5],[6,5],[7,5],[8,5]], 1); m = O.ai.choose(g, lv); assert.ok(m.s === 5*15+4 || m.s === 5*15+9);
}
ok('컴퓨터: 이기기·막기(수준 3~5)');
g = mk([[7,7],[8,7]], [[7,8],[9,9]], 1); let t = Date.now(); const m = O.ai.hint(g); console.log('  hint', m.x, m.y, m.why, Date.now() - t, 'ms');
// 대국 시간·합법성
for (const lv of [1,2,3,4,5]) { g = new O.Game(); let mx = 0, n = 0; while (!g.win && n++ < 225) { t = Date.now(); const q = O.ai.choose(g, lv); mx = Math.max(mx, Date.now() - t); assert.ok(g.place(q.x, q.y)); } console.log('  수준', lv, '자기대국', g.stack.length, '수, 최대', mx, 'ms'); }
ok('컴퓨터끼리 수준 1~5 합법 진행');
// 수준 차이: 5 vs 2
let w5 = 0; for (let i = 0; i < 4; i++) { g = new O.Game(); const hi = i % 2 ? -1 : 1; let n = 0; while (!g.win && n++ < 225) { const q = O.ai.choose(g, g.turn === hi ? 5 : 2); g.place(q.x, q.y); } if (g.win && g.win.color === hi) w5++; }
console.log('  5 vs 2:', w5, '/4'); assert.ok(w5 >= 3); ok('수준 5가 수준 2를 이겨요');
// 연습 문제: 종류마다 200개 만들어 정답을 확인
for (let ty = 1; ty <= 5; ty++) {
  let cnt = 0, sols = 0; const ms = Date.now();
  for (let i = 0; i < 200; i++) {
    const p = O.puzzle(ty); assert.ok(p, '문제 ' + ty + ' 생성 실패'); cnt++; sols += p.sol.length;
    const g = new O.Game(); p.black.forEach((s) => { g.board[s] = 1; g.stack.push({ x: s % 15, y: (s / 15) | 0, color: 1, s }); }); p.white.forEach((s) => { g.board[s] = -1; g.stack.push({ x: s % 15, y: (s / 15) | 0, color: -1, s }); }); g.turn = 1;
    const re = O.solvePuzzle(g, ty); assert.deepEqual([...re].sort(), [...p.sol].sort());
    if (ty === 1) p.sol.forEach((s) => { const h = g.copy(); h.place(s % 15, (s / 15) | 0); assert.ok(h.win); });
    if (ty === 2) { const h = g.copy(); h.place(p.sol[0] % 15, (p.sol[0] / 15) | 0); assert.equal(h.winCells(-1).length, 0); }
    if (ty === 3) p.sol.forEach((s) => { const h = g.copy(); h.place(s % 15, (s / 15) | 0); assert.ok(h.winCells(1).length >= 2); });
  }
  console.log('  문제 종류', ty, ':', cnt, '개, 평균 정답', (sols / cnt).toFixed(1), '개,', Date.now() - ms, 'ms');
}
ok('연습 문제 1000개 생성·정답 검증');
console.log(pass + ' PASS');
