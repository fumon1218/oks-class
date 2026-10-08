// 바둑 수업의 사활 문제 정답을 미리 계산해 playground/go/lessons-solved.js 로 저장해요: node scripts/go-lessons-solve.mjs
// (문제 모양이 바뀐 것만 다시 계산해요. 시간이 걸리는 문제는 몇 분 걸릴 수 있어요.)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
const Go = require(path.join(dir, 'engine.js'));
const out = path.join(dir, 'lessons-solved.js');
globalThis.OKS_GO_SOLVED = undefined;
const L = require(path.join(dir, 'lessons.js'));
for (const f of fs.readdirSync(dir).filter((x) => /^lessons-(l\d|eval|prac)\.js$/.test(x)).sort()) require(path.join(dir, f));
let old = {};
if (fs.existsSync(out)) { try { const m = fs.readFileSync(out, 'utf8').match(/OKS_GO_SOLVED\s*=\s*(\{[\s\S]*?\});\s*\n/); if (m) old = JSON.parse(m[1]); } catch (e) { old = {}; } }
const res = {}; let ran = 0, kept = 0;
for (const lesson of L.LESSONS) for (const it of lesson.items) {
  const isKL = it.kind === 'kill' || it.kind === 'live', isYK = it.kind === 'yn' && it.calc === 'kill';
  if (!isKL && !isYK) continue;
  const sig = crypto.createHash('md5').update(JSON.stringify([it.rows, it.turn, it.target, it.depth, it.kind, 3])).digest('hex').slice(0, 10);
  if (old[it.id] && old[it.id].h === sig) { res[it.id] = old[it.id]; kept++; continue; }
  const n = it.rows.length, g = Go.Game.fromRows(it.rows, it.turn || 'X', n), me = g.turn, t0 = Date.now(), tS = it.target[1] * n + it.target[0];
  const depth = it.depth || 15; let r;
  if (isYK) r = { h: sig, kill: Go.solver.canKill(g, tS, me, depth, { maxNodes: 6e6 }, me) };
  else {
    const attacker = it.kind === 'kill' ? me : -me;
    const f = Go.solver.firstMoves(g, tS, attacker, me, depth, { maxNodes: 6e6 });
    r = { h: sig, good: f.good.map((s) => [s % n, (s / n) | 0]) };
  }
  res[it.id] = r; ran++; console.log(it.id, JSON.stringify(r).slice(0, 80), ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
fs.writeFileSync(out, '/* go-lessons-solve.mjs 가 만든 파일이에요(직접 고치지 마세요) */\nwindow.OKS_GO_SOLVED = ' + JSON.stringify(res) + ';\n');
console.log('계산', ran, '재사용', kept, '→', out);
