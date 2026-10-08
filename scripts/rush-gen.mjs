/* 러시아워 문제 만들기: 무작위 배치 → 도달 가능한 모든 상태를 따라가 → 출구까지 최소 횟수(d)를 구해 수준별로 뽑아요.
   node scripts/rush-gen.mjs  →  playground/rushhour/puzzles.js */
import fs from 'node:fs';
import { SIZE, EXIT_ROW, validLayout, posOf, moves, apply, solved, solve } from '../playground/rushhour/engine.js';
const TIER = [[2, 6], [7, 11], [12, 16], [17, 22], [23, 60]], WANT = [12, 12, 12, 12, 6];
let seed = 20261008; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
function randomLayout() {
  const n = ri(5, 12), cars = [{ x: ri(0, 3), y: EXIT_ROW, len: 2, dir: 'h' }]; let trucks = 0, tries = 0;
  while (cars.length < n && tries++ < 200) {
    const len = rnd() < 0.25 && trucks < 4 ? 3 : 2, dir = rnd() < 0.5 ? 'h' : 'v';
    const c = dir === 'h' ? { x: ri(0, SIZE - len), y: ri(0, SIZE - 1), len, dir } : { x: ri(0, SIZE - 1), y: ri(0, SIZE - len), len, dir };
    if (dir === 'h' && c.y === EXIT_ROW) continue;           // 가운데 줄은 빨간 차 전용
    if (validLayout([...cars, c])) { cars.push(c); if (len === 3) trucks++; }
  }
  return cars.length >= 5 ? cars : null;
}
/* 이 배치에서 도달 가능한 모든 상태 + 출구 상태에서의 거리 */
function analyze(cars) {
  const p0 = cars.map(posOf), K = (p) => p.join(','), id = new Map([[K(p0), 0]]), states = [p0], adj = [];
  for (let i = 0; i < states.length; i++) { if (states.length > 300000) return null; const nb = []; for (const m of moves(cars, states[i])) { const np = apply(states[i], m), k = K(np); let j = id.get(k); if (j === undefined) { j = states.length; id.set(k, j); states.push(np); } nb.push(j); } adj.push(nb); }
  const d = new Int16Array(states.length).fill(-1), q = []; states.forEach((s, i) => { if (solved(s)) { d[i] = 0; q.push(i); } });
  if (!q.length) return null;
  for (let h = 0; h < q.length; h++) for (const j of adj[q[h]]) if (d[j] < 0) { d[j] = d[q[h]] + 1; q.push(j); }
  return { states, d };
}
const out = [[], [], [], [], []], seen = new Set(); const t0 = Date.now(); let comps = 0;
while (out.slice(0, 4).some((a, i) => a.length < WANT[i]) && Date.now() - t0 < 200000) {
  const cars = randomLayout(); if (!cars) continue; const an = analyze(cars); if (!an) continue; comps++;
  const used = new Set();
  for (let t = 4; t >= 0; t--) {
    if (out[t].length >= WANT[t]) continue;
    const cand = []; an.states.forEach((s, i) => { const d = an.d[i]; if (d >= TIER[t][0] && d <= TIER[t][1] && !solved(s)) cand.push(i); });
    if (!cand.length || (t === 0 && cars.length < 4)) continue;
    const tgt = ri(TIER[t][0], Math.min(TIER[t][1], t >= 3 ? 60 : TIER[t][1])); const best = t >= 3 ? cand.reduce((a, b) => (an.d[b] > an.d[a] ? b : a)) : cand.reduce((a, b) => (Math.abs(an.d[b] - tgt) < Math.abs(an.d[a] - tgt) ? b : a));
    if (used.size >= 2) break;
    const s = an.states[best], sig = cars.map((c, i) => `${c.dir}${c.dir === 'h' ? s[i] : c.x}${c.dir === 'h' ? c.y : s[i]}${c.len}`).sort().join('|'); if (seen.has(sig)) continue;
    seen.add(sig); used.add(t);
    const cs = cars.map((c, i) => (c.dir === 'h' ? [s[i], c.y, c.len, 0] : [c.x, s[i], c.len, 1]));
    out[t].push({ min: an.d[best], cars: cs });
  }
}
function climb() {
  let cars = null, an = null; while (!an) { cars = randomLayout(); if (cars) an = analyze(cars); }
  const maxd = (a) => a.d.reduce((m, v) => (v > m ? v : m), 0); let cur = maxd(an);
  for (let it = 0; it < 500 && cur < 24; it++) {
    const nc = cars.map((c) => ({ ...c })), k = ri(1, nc.length - 1), len = rnd() < 0.3 ? 3 : 2, dir = rnd() < 0.5 ? 'h' : 'v';
    const c = dir === 'h' ? { x: ri(0, SIZE - len), y: ri(0, SIZE - 1), len, dir } : { x: ri(0, SIZE - 1), y: ri(0, SIZE - len), len, dir };
    if (rnd() < 0.15 && nc.length < 13) nc.push(c); else nc[k] = c;
    if ((dir === 'h' && c.y === EXIT_ROW) || nc.filter((q) => q.len === 3).length > 4 || !validLayout(nc)) continue;
    const a2 = analyze(nc); if (!a2) continue; const m = maxd(a2); if (m >= cur) { cars = nc; an = a2; cur = m; }
  }
  return { cars, an, cur };
}
const T2 = Date.now(); while ((out[4].length < WANT[4] || out[3].length < WANT[3]) && Date.now() - T2 < 330000) {
  const { cars, an, cur } = climb(); const t = cur >= 23 ? 4 : cur >= 17 ? 3 : -1; if (t < 0 || out[t].length >= WANT[t]) continue;
  const best = an.d.reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0), s = an.states[best];
  const sig = cars.map((c, i) => `${c.dir}${c.dir === 'h' ? s[i] : c.x}${c.dir === 'h' ? c.y : s[i]}${c.len}`).sort().join('|'); if (seen.has(sig)) continue; seen.add(sig);
  out[t].push({ min: an.d[best], cars: cars.map((c, i) => (c.dir === 'h' ? [s[i], c.y, c.len, 0] : [c.x, s[i], c.len, 1])) });
  console.log('climb', t + 1, an.d[best], cars.length, ((Date.now() - t0) / 1000) | 0);
}
out.forEach((a) => a.sort((x, y) => x.min - y.min || x.cars.length - y.cars.length));
// 검증: 풀이 프로그램으로 다시 확인
let bad = 0; out.forEach((a, t) => a.forEach((p) => { const cars = p.cars.map(([x, y, len, v]) => ({ x, y, len, dir: v ? 'v' : 'h' })); const sol = solve(cars, cars.map(posOf)); if (!sol || sol.length !== p.min) { bad++; console.log('불일치', t, p.min, sol && sol.length); } }));
console.log('배치', comps, '수준별', out.map((a) => a.length), '최소횟수', out.map((a) => a.map((p) => p.min).join(' ')), '불일치', bad, (Date.now() - t0) / 1000 + '초');
const lines = out.map((a, t) => `  ${t + 1}: [\n${a.map((p) => `    { min: ${p.min}, cars: ${JSON.stringify(p.cars)} }`).join(',\n')}\n  ]`);
fs.writeFileSync(new URL('../playground/rushhour/puzzles.js', import.meta.url), `/* 만들어진 문제 (scripts/rush-gen.mjs). cars: [x, y, 길이, 세로(1)/가로(0)] — 첫 번째가 빨간 차, min = 가장 적은 움직임 */\nexport const PUZZLES = {\n${lines.join(',\n')}\n};\n`);
process.exit(bad ? 1 : 0);
