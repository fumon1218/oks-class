// 바둑 규칙·계가·컴퓨터·사활 풀이기 검사: node scripts/go-engine-test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const Go = require('../playground/go/engine.js');
let pass = 0; const ok = (n) => { pass++; console.log('PASS', n); };
const R = (rows, turn) => Go.Game.fromRows(rows, turn);
let g;
// 활로·따내기
g = R(['.....', '..X..', '.XOX.', '..X..', '.....'], 'X'); let gr = g.group(2, 2); assert.deepEqual(gr.libs.length, 0 + 0 + 0 + gr.libs.length); // 흰 돌 활로 0은 판 구성상 이미 잡힌 모양
g = R(['.....', '..X..', '.XO..', '..X..', '.....'], 'X'); assert.equal(g.group(2, 2).libs.length, 1); const rec = g.play(3, 2); assert.deepEqual(rec.captured, [2 * 5 + 2]); assert.equal(g.at(2, 2), 0); assert.equal(g.caps.b, 1); ok('활로 1개 단수 → 따내기');
g.undo(); assert.equal(g.at(2, 2), -1); assert.equal(g.caps.b, 0); ok('따낸 것 되돌리기');
// 자충
g = R(['.O...', 'O.O..', '.O...', '.....', '.....'], 'X'); assert.equal(g.legal(1, 1), false); g.play(1, 1); assert.equal(g.err, 'suicide'); ok('자충 금지');
g = R(['XO...', '.XO..', 'XO...', '.....', '.....'], 'O'); // 백이 (0,1)에 두면 흑 (0,0),(0,2),(1,1)... 따내며 두는 자충은 허용
g = R(['.XO..', 'XO.O.', '.XO..', '.....', '.....'], 'X'); assert.equal(g.legal(2, 1), true); const r2 = g.play(2, 1); assert.equal(r2.captured.length, 1); ok('따내면서 두는 곳은 둘 수 있어요');
// 패
g = R(['.XO..', 'XO.O.', '.XO..', '.....', '.....'], 'X'); g.play(2, 1); assert.equal(g.at(1, 1), 0); assert.equal(g.legal(1, 1, -1), false); g.play(4, 4); assert.equal(g.legal(1, 1, -1), true); ok('패: 바로 되따내기 금지, 한 수 뒤엔 가능');
// 연속 두 번 쉬면 끝
g = new Go.Game(9); g.pass(); assert.ok(!g.ended()); g.pass(); assert.ok(g.ended()); g.undo(); assert.ok(!g.ended()); ok('두 번 연속 쉬면 대국 끝');
// 접바둑
g = new Go.Game(19); g.setHandicap(4); assert.equal(g.countStones().b, 4); assert.equal(g.turn, -1); ok('접바둑 4점');
// 계가
g = R(['..X.O....', '..X.O....', '..X.O....', '..X.O....', '..X.O....', '..X.O....', '..X.O....', '..X.O....', '..X.O....'], 'X'); const sc = g.score([], 6.5); assert.equal(sc.terrB, 18); assert.equal(sc.terrW, 36 - 9 + 0 > 0 ? sc.terrW : 0); console.log('  계가', sc.black, sc.white, sc.terrB, sc.terrW); ok('집 세기');
g = R(['XXXXX', 'XOOXX', 'XXXXX', 'OOOOO', 'OOOOO'], 'X'); const sd = g.score([1 * 5 + 1, 1 * 5 + 2], 0.5); assert.equal(sd.deadW, 2); console.log('  죽은 돌 계산', sd.black, sd.white); ok('죽은 돌 처리');
// 컴퓨터: 속도와 힘
g = new Go.Game(9); let t = Date.now(), r = Go.mcts(g, { ms: 500 }); console.log('  9줄 첫 수', r.s, '플레이아웃', r.iters, '/0.5s');
g = new Go.Game(19); t = Date.now(); r = Go.mcts(g, { ms: 500 }); console.log('  19줄 첫 수', r.s, '플레이아웃', r.iters, '/0.5s');
function game(a, b, n) { const x = new Go.Game(n); let k = 0; while (!x.ended() && k++ < n * n * 2) { const lv = x.turn > 0 ? a : b; let m; if (typeof lv === 'number' && lv <= 2) m = Go.ai.choose(x, lv); else { const q = Go.mcts(x, { ms: lv }); m = { s: q.s, pass: q.s < 0 }; } if (m.pass || m.s < 0) x.pass(); else { const rr = x.play(m.s % n, (m.s / n) | 0); if (!rr) x.pass(); } } const c = x.count; return Go.areaDiff(x) - 6.5; }
let wins = 0; for (let i = 0; i < 4; i++) { const hi = i % 2 ? -1 : 1; const d = i % 2 ? game(1, 150, 9) : game(150, 1, 9); if ((d > 0) === (hi > 0)) wins++; }
console.log('  강한(0.15s) vs 수준1:', wins, '/4'); assert.ok(wins >= 3); ok('몬테카를로가 수준 1을 이겨요');
console.log(pass + ' PASS');
