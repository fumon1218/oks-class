// 체스 규칙 엔진 검증: node scripts/chess-engine-test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const C = require('../playground/chess/engine.js');
let n = 0; const ok = (m) => { n++; console.log('PASS', m); };

// 1) perft(표준 검증 위치) — 합법 수 생성이 맞는지
const PERFT = [
  ['시작 위치', C.START, [20, 400, 8902, 197281]],
  ['Kiwipete(캐슬링·앙파상 많음)', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862]],
  ['위치3(앙파상 체크)', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238]],
  ['위치4(프로모션)', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
  ['위치5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379]]
];
for (const [name, fen, exp] of PERFT) {
  const g = new C.Game(fen);
  exp.forEach((v, i) => assert.equal(g.perft(i + 1), v, name + ' 깊이' + (i + 1)));
  assert.equal(g.fen(), fen.split(' ').slice(0, 4).join(' ') + ' ' + fen.split(' ')[4] + ' ' + fen.split(' ')[5], name + ' FEN 되돌리기');
  ok('perft ' + name + ' 깊이 ' + exp.length);
}

// 2) 게임 흐름: 스칼라 외통, 스테일메이트, 되돌리기
let g = new C.Game();
for (const [a, b] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) assert.ok(g.move(C.sqFrom(a), C.sqFrom(b)), a + b);
assert.equal(g.status(), 'checkmate'); assert.equal(g.last().san, 'Qh4#');
g.undo(); assert.equal(g.status(), 'playing'); assert.equal(g.turn, -1);
ok('바보 외통(Fool\'s mate) 판정과 되돌리기');
g = new C.Game('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'); assert.equal(g.status(), 'stalemate'); ok('스테일메이트');
g = new C.Game('8/8/8/4k3/8/8/8/4K3 w - - 0 1'); assert.equal(g.status(), 'draw-material'); ok('기물 부족 무승부');

// 3) 특수 규칙
g = new C.Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
assert.equal(g.moves().filter(m => m.castle).length, 2);
g.move(4, 6); assert.equal(g.board[5], C.R); assert.equal(g.board[7], 0); assert.equal(g.last().san, 'O-O'); ok('캐슬링(킹사이드)');
g = new C.Game('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'); const ep = g.move(C.sqFrom('e5'), C.sqFrom('d6'));
assert.ok(ep && ep.ep); assert.equal(g.board[C.sqFrom('d5')], 0); ok('앙파상');
g = new C.Game('8/P6k/8/8/8/8/8/K7 w - - 0 1'); const pr = g.move(C.sqFrom('a7'), C.sqFrom('a8'), C.N);
assert.equal(pr.promo, C.N); assert.equal(g.board[C.sqFrom('a8')], C.N); ok('프로모션(나이트로 승급)');
g = new C.Game('4k3/8/8/8/8/8/3r4/4K3 w - - 0 1'); assert.equal(g.move(C.sqFrom('e1'), C.sqFrom('d2')) !== null, true); ok('킹이 공격받지 않는 칸으로 이동');
g = new C.Game('4k3/8/8/8/4r3/8/8/4K3 w - - 0 1'); assert.equal(g.move(C.sqFrom('e1'), C.sqFrom('e2')), null); ok('체크 선상으로 킹 이동 금지');
const rep = new C.Game();
['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8'].forEach(s => rep.move(C.sqFrom(s.slice(0, 2)), C.sqFrom(s.slice(2))));
assert.equal(rep.status(), 'draw-repeat'); ok('같은 모양 3번 반복 무승부');

// 4) 컴퓨터 상대
g = new C.Game('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1');
for (const lv of [3, 4, 5]) { const m = C.ai.choose(g, lv); assert.equal(m.from, 0); assert.equal(m.to, C.sqFrom('a8'), '레벨' + lv + ' 외통수 찾기'); }
ok('수준 3~5: 한 수 외통수 찾기');
const hint = C.ai.hint(new C.Game('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1')); assert.equal(C.sqName(hint.to), 'f7'); ok('힌트가 f7 외통수를 찾음');
// 모든 수준 자체 대국: 불법 수 없이 끝까지(최대 160수)
for (const lv of [1, 2, 3]) {
  const gg = new C.Game(); let plies = 0;
  while (gg.status().indexOf('check') >= 0 || gg.status() === 'playing' || gg.status() === 'check') {
    if (gg.status() === 'checkmate') break;
    const m = C.ai.choose(gg, lv); if (!m) break;
    const ok2 = gg.move(m.from, m.to, Math.abs(m.promo) || undefined); assert.ok(ok2, '수준' + lv + ' 불법 수'); if (++plies > 160) break;
  }
}
ok('수준 1~3 자체 대국: 불법 수 없음');
console.log(n + ' PASS');
