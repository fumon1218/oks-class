// 바둑 "사활 기초" 문제 만들기: 눈 모양(3~6칸)을 모두 만들어 보고, 엔진 풀이기로 "잡는 급소"와 "사는 급소"가
// 각각 1~2곳뿐인 모양만 골라 playground/go/lessons-life.js 로 저장해요.   node scripts/go-life-gen.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
const Go = require(path.join(dir, 'engine.js'));
globalThis.OKS_GO_SOLVED = undefined;
const L = require(path.join(dir, 'lessons.js'));
const norm = (c) => { const mx = Math.min(...c.map((p) => p[0])), my = Math.min(...c.map((p) => p[1])); return c.map((p) => [p[0] - mx, p[1] - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
const variants = (c) => { const out = []; let cur = c; for (let r = 0; r < 4; r++) { cur = cur.map((p) => [p[1], -p[0]]); out.push(norm(cur)); out.push(norm(cur.map((p) => [-p[0], p[1]]))); } return out; };
const key = (c) => c.map((p) => p.join(',')).join(';'), canon = (c) => variants(c).map(key).sort()[0];
let level = [norm([[0, 0]])]; const bySize = { 1: level };
for (let sz = 2; sz <= 6; sz++) { const seen = new Map(); for (const c of level) for (const p of c) for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = [p[0] + d[0], p[1] + d[1]]; if (c.some((r) => r[0] === q[0] && r[1] === q[1])) continue; const nc = norm(c.concat([q])); const k = canon(nc); if (!seen.has(k)) seen.set(k, nc); } level = [...seen.values()]; bySize[sz] = level; }
const only = process.argv[2] ? +process.argv[2] : 0;
const good = [];
for (let sz = 3; sz <= 6; sz++) for (const c of bySize[sz]) for (const ox of [0, 1]) {
  const w = Math.max(...c.map((p) => p[0])) + 1, h = Math.max(...c.map((p) => p[1])) + 1; if (w + ox > 4 || h > 4) continue;
  const n = 7, rows = L.shape(n, c, ox, 0);
  let tS = -1; for (let s = 0; s < n * n; s++) if (rows[(s / n) | 0][s % n] === 'O') { tS = s; break; } if (tS < 0) continue;
  const gk = Go.Game.fromRows(rows, 'X', n), gl = Go.Game.fromRows(rows, 'O', n), t0 = Date.now();
  const k = Go.solver.firstMoves(gk, tS, 1, 1, 15, { maxNodes: 2e6 }), l = Go.solver.firstMoves(gl, tS, 1, -1, 15, { maxNodes: 2e6 });
  const ok = k.good.length >= 1 && k.good.length <= 2 && l.good.length >= 1 && l.good.length <= 2;
  console.log(sz, ox, key(c), 'kill', k.good.length, 'live', l.good.length, ok ? 'OK' : '-', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  if (ok) good.push({ sz, rows, target: [tS % n, (tS / n) | 0] });
}
const lessons = []; const per = 6;
const mk = (kind, list, base, ord, icon, title, sub) => { for (let i = 0; i * per < list.length && i < 5; i++) { const part = list.slice(i * per, i * per + per); if (part.length < 3) break; lessons.push({ id: base + (i + 1), lv: 3, ord: ord + i, icon, title: title + ' ' + (i + 1), sub, play: null, pages: [], items: part.map((g) => ({ kind, rows: g.rows, turn: kind === 'kill' ? 'X' : 'O', target: g.target, sym: true, ring: true,
  prompt: kind === 'kill' ? '흑 차례! 백의 눈 모양이에요. 백이 두 눈을 못 만들게 하는 급소는 어디일까요?' : '백 차례! 눈 모양 안에서 두 눈을 만들어 사는 급소는 어디일까요?',
  explain: kind === 'kill' ? '급소를 먼저 차지하면 상대는 눈을 하나밖에 못 만들어요.' : '급소를 먼저 차지하면 눈이 두 개 생겨서 살아요.', hintText: '눈 모양의 중심이 되는 곳을 찾아봐요. 노란 동그라미가 힌트예요.' })), done: '눈 모양마다 급소가 달라요. 모양을 보고 중심을 찾는 눈이 자라요!' }); } };
good.sort((a, b) => a.sz - b.sz);
mk('kill', good, 'life-k', 31, '🔪', '기초 사활 · 잡는 급소', '눈 모양의 급소'); mk('live', good, 'life-l', 36, '🌱', '기초 사활 · 사는 급소', '눈 모양의 급소');
let js = '/* 바둑 배우기 — 기초 사활(눈 모양 급소). scripts/go-life-gen.mjs 가 만든 파일이에요(직접 고치지 마세요). */\n(function (root) {\n  \'use strict\';\n  var L = root.OKS_GO_LESSONS || require(\'./lessons.js\'), add = L.add;\n';
lessons.forEach((l) => { js += '  add(' + JSON.stringify(l) + ');\n'; }); js += '})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(dir, 'lessons-life.js'), js); console.log('통과 모양', good.length, '→ 수업', lessons.length, '개, 문제', lessons.reduce((s, l) => s + l.items.length, 0));
