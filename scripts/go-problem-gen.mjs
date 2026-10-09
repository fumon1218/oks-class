// 바둑 "실전 문제" 만들기: 프로 기보(scripts/data/sgf)에서 실제로 나온 단수·따내기 장면을 뽑아 playground/go/lessons-problems.js 를 만들어요.
//   node scripts/go-problem-gen.mjs
// 정답은 엔진이 확인해요(따내기: 표시한 돌이 실제로 사라지는 수 / 단수: 표시한 돌의 활로가 1개 남는 수).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), dir = path.join(root, 'playground', 'go');
const { Game } = require(path.join(dir, 'engine.js'));
const games = (() => { global.window = global; require(path.join(dir, 'games.js')); return global.OKS_GO_GAMES; })();
const toRows = (g, n) => { const o = []; for (let y = 0; y < n; y++) { let r = ''; for (let x = 0; x < n; x++) { const v = g.get(y * n + x); r += v > 0 ? 'X' : v < 0 ? 'O' : '.'; } o.push(r); } return o; };
const cap = [], atr = [];
games.forEach((gm, gi) => {
  const n = 19, g = new Game(n); const mv = []; for (let i = 0; i + 1 < gm.mv.length; i += 2) { const a = gm.mv.slice(i, i + 2); mv.push(a === '--' ? null : [a.charCodeAt(0) - 97, a.charCodeAt(1) - 97]); }
  let seenCap = 0, seenAtr = 0;
  for (let i = 0; i < mv.length && i < 170; i++) {
    const m = mv[i]; if (!m) { g.pass(); continue; }
    const before = g.copy(), me = g.turn, rec = g.play(m[0], m[1]); if (!rec) break;
    if (i < 14) continue;
    const stones = before.stack ? 0 : 0;
    if (rec.captured.length >= 1 && rec.captured.length <= 6 && seenCap < 2 && !(rec.ko)) {
      const t = rec.captured[0], ok = [...Array(n * n).keys()].filter((s) => !before.get(s)).some((s) => { const t2 = before.copy(); const r = t2.play(s % n, (s / n) | 0); return r && t2.get(t) === 0; });
      const solutions = []; for (let s = 0; s < n * n; s++) { if (before.get(s)) continue; const t2 = before.copy(); const r = t2.play(s % n, (s / n) | 0); if (r && t2.get(t) === 0) solutions.push(s); }
      if (ok && solutions.length <= 2) { cap.push({ gi, i, rows: toRows(before, n), turn: me > 0 ? 'X' : 'O', target: [t % n, (t / n) | 0], size: rec.captured.length, ans: solutions }); seenCap++; }
    } else if (!rec.captured.length && seenAtr < 2) {
      const gr = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [m[0] + dx, m[1] + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < n && y < n && g.get(y * n + x) === -me).map(([x, y]) => g.group(x, y)).filter((q) => q && q.libs.length === 1);
      const bg = gr.find((q) => before.group(q.stones[0] % n, (q.stones[0] / n) | 0).libs.length === 2); const mine = g.group(m[0], m[1]);
      if (bg && mine && mine.libs.length >= 3 && bg.stones.length >= 1 && bg.stones.length <= 4) { const t = bg.stones[0]; atr.push({ gi, i, rows: toRows(before, n), turn: me > 0 ? 'X' : 'O', target: [t % n, (t / n) | 0], size: bg.stones.length }); seenAtr++; }
    }
  }
});
const nm = (t) => (t === 'X' ? '흑' : '백'), other = (t) => (t === 'X' ? '백' : '흑');
const mkItem = (p, kind, k) => ({ ring: true, kind, rows: p.rows, turn: p.turn, target: p.target, prompt: kind === 'capture' ? '프로 대국의 한 장면이에요. 노란 동그라미의 ' + other(p.turn) + '돌을 따낼 수 있어요! ' + nm(p.turn) + ' 차례, 어디에 둘까요?' : '프로 대국의 한 장면이에요. 노란 동그라미의 ' + other(p.turn) + '돌을 단수로 만들어 봐요! ' + nm(p.turn) + ' 차례예요.', explain: kind === 'capture' ? '마지막 활로를 막으면 돌을 따낼 수 있어요.' : '활로를 하나만 남기면 단수예요. 내 돌의 활로도 꼭 확인해요.' });
const order = (a) => a.sort((x, y) => (x.i + x.size * 6) - (y.i + y.size * 6));
const C = order(cap), A = order(atr), per = 8, lessons = [];
const chunk = (arr, title, id, ord, icon, kind, sub) => { for (let k = 0; k * per < arr.length && k < 3; k++) { const part = arr.slice(k * per, k * per + per); if (part.length < 4) break; lessons.push({ id: id + (k + 1), lv: 2, ord: ord + k, icon, title: title + ' ' + (k + 1), sub, play: null, pages: [], items: part.map((p) => mkItem(p, kind)), done: '프로 대국에서 실제로 나온 장면이에요. 눈이 조금씩 좋아져요!' }); } };
chunk(A, '실전 단수 치기', 'q-a', 90, '🎯', 'atari', '프로 대국 속 단수'); chunk(C, '실전 따내기', 'q-c', 93, '🪢', 'capture', '프로 대국 속 따내기');
let js = '/* 바둑 배우기 — 실전 문제(프로 기보에서 뽑은 단수·따내기). scripts/go-problem-gen.mjs 가 만든 파일이에요(직접 고치지 마세요). */\n(function (root) {\n  \'use strict\';\n  var L = root.OKS_GO_LESSONS || require(\'./lessons.js\'), add = L.add;\n';
lessons.forEach((l) => { js += '  add(' + JSON.stringify(l) + ');\n'; }); js += '})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(dir, 'lessons-problems.js'), js); console.log('후보 따내기', cap.length, '단수', atr.length, '→ 수업', lessons.length, '개, 문제', lessons.reduce((s, l) => s + l.items.length, 0));
