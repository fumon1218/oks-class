import { PUZZLES } from '../playground/rushhour/puzzles.js';
import { solve, validLayout, posOf, solved, moves, apply } from '../playground/rushhour/engine.js';
let ok = 0, bad = 0; const eq = (a, b, m) => { if (a === b) ok++; else { bad++; console.log('FAIL', m, a, '!=', b); } };
let total = 0;
for (const lv of Object.keys(PUZZLES)) PUZZLES[lv].forEach((p, i) => {
  total++; const cars = p.cars.map(([x, y, len, v]) => ({ x, y, len, dir: v ? 'v' : 'h' }));
  eq(validLayout(cars), true, `배치 ${lv}-${i}`); eq(cars[0].dir === 'h' && cars[0].y === 2 && cars[0].len === 2, true, `빨간 차 ${lv}-${i}`);
  const pos = cars.map(posOf); eq(solved(pos), false, `이미 풀림 ${lv}-${i}`);
  const sol = solve(cars, pos); eq(sol ? sol.length : -1, p.min, `최소 횟수 ${lv}-${i}`);
  let q = pos; for (const m of sol) { const legal = moves(cars, q).some((a) => a[0] === m[0] && a[1] === m[1]); eq(legal, true, `풀이 규칙 ${lv}-${i}`); q = apply(q, m); } eq(solved(q), true, `풀이 끝 ${lv}-${i}`);
});
eq(Object.keys(PUZZLES).length, 5, '수준 5개'); for (let l = 1; l <= 5; l++) eq(PUZZLES[l].length >= 5, true, `수준 ${l} 문제 수 ${PUZZLES[l].length}`);
console.log(`${ok} OK, ${bad} FAIL · 문제 ${total}개`); process.exit(bad ? 1 : 0);
