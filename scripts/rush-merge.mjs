/* rush-gen이 만든 json들과 지금 puzzles.js를 합쳐 수준마다 최대 N개(기본 30)로 정리해 puzzles.js를 다시 써요. node scripts/rush-merge.mjs a.json b.json */
import fs from 'node:fs';
import { PUZZLES } from '../playground/rushhour/puzzles.js';
const N = +(process.env.N || 30), files = process.argv.slice(2), out = [[], [], [], [], []], seen = new Set();
const sig = (cars) => cars.map((c) => c.join('.')).sort().join('|');
const add = (t, p) => { const k = sig(p.cars); if (seen.has(k)) return; seen.add(k); out[t].push(p); };
for (let t = 0; t < 5; t++) (PUZZLES[t + 1] || []).forEach((p) => add(t, p));
for (const f of files) JSON.parse(fs.readFileSync(f, 'utf8')).forEach((arr, t) => arr.forEach((p) => add(t, p)));
// 너무 많으면 최소 횟수가 골고루 퍼지도록 줄여요
out.forEach((a, t) => { a.sort((x, y) => x.min - y.min || x.cars.length - y.cars.length); if (a.length > N) { const keep = []; for (let i = 0; i < N; i++) keep.push(a[Math.round((i * (a.length - 1)) / (N - 1))]); out[t] = keep; } });
const lines = out.map((a, t) => `  ${t + 1}: [\n${a.map((p) => `    { min: ${p.min}, cars: ${JSON.stringify(p.cars)} }`).join(',\n')}\n  ]`);
fs.writeFileSync(new URL('../playground/rushhour/puzzles.js', import.meta.url), `/* 만들어진 문제 (scripts/rush-gen.mjs + rush-merge.mjs). cars: [x, y, 길이, 세로(1)/가로(0)] — 첫 번째가 빨간 차, min = 가장 적은 움직임 */\nexport const PUZZLES = {\n${lines.join(',\n')}\n};\n`);
console.log('수준별', out.map((a) => a.length), out.map((a) => a.map((p) => p.min).join(' ')));
