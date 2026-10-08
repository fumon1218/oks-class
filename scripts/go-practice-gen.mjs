// 바둑 연습장(따내기·단수·양단수·축·사활) 문제를 규칙 엔진으로 만들고 검증해서 playground/go/lessons-prac.js 로 저장해요.
// 실행: node scripts/go-practice-gen.mjs   (그다음 node scripts/go-lessons-solve.mjs 로 사활 정답을 미리 계산)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
const Go = require(path.join(dir, 'engine.js')); const { Game } = Go, S = Go.solver;
const T0 = Date.now(); let sd = 20261009; const rnd = () => { sd ^= sd << 13; sd ^= sd >>> 17; sd ^= sd << 5; return (sd >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = (a) => a[Math.floor(rnd() * a.length)];
const sym = (k, x, y, n) => { const m = n - 1; return [[x, y], [m - x, y], [x, m - y], [m - x, m - y], [y, x], [m - y, x], [y, m - x], [m - y, m - x]][k]; };
const canon = (rows) => { const n = rows.length; let best = null; for (let k = 0; k < 8; k++) { const g = Array.from({ length: n }, () => Array(n).fill('.')); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rows[y][x] !== '.') { const p = sym(k, x, y, n); g[p[1]][p[0]] = rows[y][x]; } const s = g.map((r) => r.join('')).join('/'); if (best === null || s < best) best = s; } return best; };
const nb = (x, y, n) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter((q) => q[0] >= 0 && q[1] >= 0 && q[0] < n && q[1] < n);
const grid = (n) => Array.from({ length: n }, () => Array(n).fill('.'));
const toRows = (g) => g.map((r) => r.join(''));
function validBoard(rows, turn) { const n = rows.length, g = Game.fromRows(rows, turn, n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rows[y][x] !== '.') { const gr = g.group(x, y); if (!gr || !gr.libs.length) return false; } return g; }
const SHAPES = { 1: [[0, 0]], 2: [[0, 0], [1, 0]], 3: [[0, 0], [1, 0], [2, 0]], '3L': [[0, 0], [1, 0], [0, 1]], 4: [[0, 0], [1, 0], [2, 0], [3, 0]], '4T': [[0, 0], [1, 0], [2, 0], [1, 1]], '4L': [[0, 0], [0, 1], [0, 2], [1, 2]], '4S': [[0, 0], [1, 0], [1, 1], [2, 1]], '2x2': [[0, 0], [1, 0], [0, 1], [1, 1]] };
const strays = (g, n, cnt, avoid) => { let t = 0; while (cnt > 0 && t++ < 60) { const x = ri(0, n - 1), y = ri(0, n - 1); if (g[y][x] !== '.' || avoid(x, y)) continue; g[y][x] = rnd() < 0.5 ? 'X' : 'O'; cnt--; } };

/* ---------- 1) 따내기 · 단수 ---------- */
function genCapture(kind, shapeKeys, extra, n) {
  for (let tries = 0; tries < 4000; tries++) {
    const g = grid(n), key = pick(shapeKeys), pts = SHAPES[key], ox = ri(0, n - 1), oy = ri(0, n - 1), cells = pts.map((p) => [p[0] + ox, p[1] + oy]);
    if (cells.some((c) => c[0] >= n || c[1] >= n)) continue; cells.forEach((c) => { g[c[1]][c[0]] = 'O'; });
    const inS = new Set(cells.map((c) => c.join(','))), libs = new Map(); cells.forEach((c) => nb(c[0], c[1], n).forEach((q) => { if (!inS.has(q.join(','))) libs.set(q.join(','), q); }));
    const L = [...libs.values()], want = kind === 'capture' ? 1 : 2; if (L.length < want) continue;
    const keep = new Set(L.slice().sort(() => rnd() - 0.5).slice(0, want).map((q) => q.join(',')));
    L.forEach((q) => { if (!keep.has(q.join(','))) g[q[1]][q[0]] = 'X'; });
    // 방해하는 돌: 다른 백 덩어리(활로 2개) 와 흩어진 돌
    for (let e = 0; e < extra; e++) { const x = ri(0, n - 1), y = ri(0, n - 1); if (g[y][x] !== '.' || keep.has(x + ',' + y)) continue; const near = Math.abs(x - ox) + Math.abs(y - oy); if (near < 3) continue; g[y][x] = rnd() < 0.55 ? 'X' : 'O'; if (rnd() < 0.5) { const q = pick(nb(x, y, n)); if (g[q[1]][q[0]] === '.' && !keep.has(q.join(','))) g[q[1]][q[0]] = g[y][x]; } }
    const rows = toRows(g), game = validBoard(rows, 'X'); if (!game) continue;
    const tg = game.group(cells[0][0], cells[0][1]); if (!tg || tg.libs.length !== want || tg.stones.length !== cells.length) continue;
    // 검증: 정답 수가 정확히 있어야 해요
    let good = 0; for (let s = 0; s < n * n; s++) { const g2 = game.copy(); const rec = g2.play(s % n, (s / n) | 0); if (!rec) continue; const gr = g2.group(cells[0][0], cells[0][1]); if (kind === 'capture' ? !gr || g2.get(cells[0][1] * n + cells[0][0]) !== -1 : gr && gr.libs.length === 1) good++; }
    if (kind === 'capture' ? good !== 1 : good !== want) continue;
    return { rows, target: cells[0], size: cells.length, key };
  }
  return null;
}
function collect(count, make) { const seen = new Set(), out = []; let guard = 0; while (out.length < count && guard++ < 3000) { const it = make(out.length); if (!it) continue; const c = canon(it.rows); if (seen.has(c)) continue; seen.add(c); out.push(it); } return out; }
const EX_C = ['마지막 활로를 막아서 백 돌을 따냈어요.', '활로가 하나뿐이어서 거기에 두면 따낼 수 있어요.', '숨 쉴 곳이 한 곳 남았을 때 막으면 잡혀요.', '단수가 된 돌은 마지막 활로를 막으면 잡아요.'];
const cap1 = collect(10, (i) => { const r = genCapture('capture', i < 5 ? [1, 2] : [1, 2, '3L', 3], i < 3 ? 0 : 2, 7); return r && Object.assign(r, { kind: 'capture' }); });
const cap2 = collect(10, (i) => { const r = genCapture('capture', i < 4 ? ['3L', 3, '4T', '2x2'] : ['4L', '4S', 4, '4T', '2x2', '3L'], 4, 9); return r && Object.assign(r, { kind: 'capture' }); });
const atr = collect(10, (i) => { const r = genCapture('atari', i < 5 ? [1, 2] : [2, '3L', 3, '4T'], i < 3 ? 1 : 3, i < 5 ? 7 : 9); return r && Object.assign(r, { kind: 'atari' }); });
const capItem = (r, i) => ({ kind: r.kind, rows: r.rows, turn: 'X', target: r.target, sym: true, prompt: r.kind === 'capture' ? '흑 차례! 단수가 된 백 돌을 따내 보세요. (' + (r.size === 1 ? '돌 1개' : '이어진 돌 ' + r.size + '개') + ')' : '흑 차례! 백 돌의 활로를 하나 막아서 단수로 만들어 보세요.', explain: r.kind === 'capture' ? EX_C[i % EX_C.length] : '활로를 하나만 남겼어요. 이것이 단수예요!', hintText: r.kind === 'capture' ? '백 돌의 남은 활로를 찾아봐요.' : '백 돌 옆의 빈 점 중 하나를 막아요.' });

/* ---------- 2) 양단수 ---------- */
function genDouble(n, withStray) {
  for (let tries = 0; tries < 6000; tries++) {
    const g = grid(n), px = ri(1, n - 2), py = ri(1, n - 2), dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], d1 = pick(dirs); let d2 = pick(dirs); if (d1[0] === d2[0] && d1[1] === d2[1]) continue;
    const a = [px + d1[0], py + d1[1]], b = [px + d2[0], py + d2[1]]; if ([a, b].some((c) => c[0] < 0 || c[1] < 0 || c[0] >= n || c[1] >= n)) continue; g[a[1]][a[0]] = 'O'; g[b[1]][b[0]] = 'O';
    for (const c of [a, b]) { const others = nb(c[0], c[1], n).filter((q) => !(q[0] === px && q[1] === py)); if (!others.length) continue; const keep = pick(others); others.forEach((q) => { if (q !== keep && g[q[1]][q[0]] === '.') g[q[1]][q[0]] = 'X'; }); }
    if (withStray) strays(g, n, ri(2, 4), (x, y) => Math.abs(x - px) + Math.abs(y - py) < 3);
    const rows = toRows(g), game = validBoard(rows, 'X'); if (!game) continue;
    const ans = []; for (let s = 0; s < n * n; s++) { const g2 = game.copy(); if (!g2.play(s % n, (s / n) | 0)) continue; const me = g2.group(s % n, (s / n) | 0); if (!me || me.libs.length < 2) continue; const seen = new Set(); let atari = 0; nb(s % n, (s / n) | 0, n).forEach((q) => { if (g2.get(q[1] * n + q[0]) !== -1) return; const gr = g2.group(q[0], q[1]); const k = gr.stones.join(','); if (seen.has(k)) return; seen.add(k); if (gr.libs.length === 1) atari++; }); if (atari >= 2) ans.push([s % n, (s / n) | 0]); }
    if (ans.length < 1 || ans.length > 2) continue;
    // 백 돌이 이미 단수인 곳이 있으면(한 수로 바로 따내는 문제가 되므로) 제외
    let pre1 = 0; { const seen = new Set(); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rows[y][x] === 'O') { const gr = game.group(x, y), k = gr.stones.join(','); if (seen.has(k)) continue; seen.add(k); if (gr.libs.length === 1) pre1++; } } if (pre1) continue;
    return { rows, answers: ans, kind: 'set' };
  }
  return null;
}
console.log('따내기·단수 완료', Date.now() - T0, 'ms');
const dbl = collect(10, (i) => genDouble(i < 4 ? 7 : 9, i >= 2));
const dblItem = (r) => ({ kind: 'set', rows: r.rows, turn: 'X', sym: true, answers: r.answers, prompt: '흑 차례! 한 번에 백 두 곳을 단수로 만드는 점은 어디일까요?', explain: '한 수로 백 돌 두 곳이 단수가 됐어요! 상대가 한쪽만 지킬 수 있으니 다른 쪽을 잡아요.', hintText: '백 돌 두 개가 함께 가진 활로를 찾아봐요.', wrong: '그 점은 한 곳만 단수가 돼요. 백 두 곳이 함께 가진 활로를 찾아봐요.' });

/* ---------- 3) 축 ---------- */
function genLadder(wantTrue, n) {
  for (let tries = 0; tries < 6000; tries++) {
    const g = grid(n), x = ri(1, n - 2), y = ri(1, n - 2); g[y][x] = 'O';
    const ns = nb(x, y, n); const libs = ns.slice().sort(() => rnd() - 0.5).slice(0, 2); ns.forEach((q) => { if (!libs.includes(q)) g[q[1]][q[0]] = 'X'; });
    // 도망 길목에 백 돌(축머리) 을 놓거나 놓지 않아요
    if (!wantTrue || rnd() < 0.15) { const m = ri(1, 2); for (let i = 0; i < m; i++) { const px = ri(0, n - 1), py = ri(0, n - 1); if (g[py][px] === '.' && Math.abs(px - x) + Math.abs(py - y) > 2) g[py][px] = 'O'; } }
    if (rnd() < 0.5) strays(g, n, 1, (px, py) => Math.abs(px - x) + Math.abs(py - y) < 3);
    const rows = toRows(g), game = validBoard(rows, 'X'); if (!game) continue;
    const gr = game.group(x, y); if (!gr || gr.libs.length !== 2) continue; let other = 0; for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) if (rows[yy][xx] === 'O' && game.group(xx, yy).stones.indexOf(y * n + x) < 0 && game.group(xx, yy).libs.length < 2) other++; if (other) continue;
    let ans; try { ans = S.ladder(game, y * n + x, 1, 1); } catch (e) { continue; } if (ans !== wantTrue) continue;
    return { rows, target: [x, y], ans, kind: 'yn' };
  }
  return null;
}
console.log('양단수 완료', Date.now() - T0, 'ms');
const lad = []; { const seen = new Set(); let guard = 0; while (lad.length < 10 && guard++ < 200) { const want = lad.length % 2 === 0; const r = genLadder(want, 9); if (!r) continue; const c = canon(r.rows); if (seen.has(c)) continue; seen.add(c); lad.push(r); } }
const ladItem = (r) => ({ kind: 'yn', calc: 'ladder', chaser: 'X', toMove: 'X', rows: r.rows, turn: 'X', target: r.target, sym: true, prompt: '흑이 도망가는 백 돌을 계속 단수로 몰아서(축) 잡을 수 있나요?', explain: r.ans ? '끝까지 몰아도 백이 못 빠져나가요. 잡혀요!' : '길목에 있는 백 돌 때문에 백이 빠져나가요. 축이 안 돼요!', why: r.ans ? { false: '길목에 방해가 되는 백 돌이 없어서 끝까지 잡혀요.' } : { true: '길목에 백 돌이 있어서 도망가던 백이 그 돌과 이어져 살아 나가요.' } });

console.log('축 완료', Date.now() - T0, 'ms');
/* ---------- 4) 사활 (눈 모양) ---------- */
function polys(maxN) { const out = new Map(); let cur = [[[0, 0]]]; for (let size = 1; size <= maxN; size++) { const next = new Map(); for (const p of cur) { if (size >= 3) { const key = JSON.stringify(p.slice().sort()); out.set(key, p); } if (size === maxN) continue; const have = new Set(p.map((c) => c.join(','))); for (const c of p) for (const q of nb(c[0], c[1], 99)) { if (q[0] < 0 || q[1] < 0 || q[0] > 3 || q[1] > 3 || have.has(q.join(','))) continue; const np = p.concat([q]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); next.set(JSON.stringify(np), np); } } cur = [...next.values()]; } return [...out.values()]; }
const SHAPE_FN = fs.readFileSync(path.join(dir, 'lessons.js'), 'utf8');
globalThis.OKS_GO_SOLVED = undefined; const L = require(path.join(dir, 'lessons.js')); const shape = L.shape;
const seenEye = new Set(), cands = [];
for (const p of polys(6)) { const norm = (() => { const minx = Math.min(...p.map((c) => c[0])), miny = Math.min(...p.map((c) => c[1])); return p.map((c) => [c[0] - minx, c[1] - miny]); })(); const rows = shape(7, norm, 0, 0); const c = canon(rows); if (seenEye.has(c)) continue; seenEye.add(c); cands.push({ pts: norm, rows, size: norm.length }); }
cands.sort((a, b) => a.size - b.size || rnd() - 0.5);
const killList = [], liveList = [], ynList = [];
for (const c of cands) {
  if ((killList.length >= 9 && liveList.length >= 5 && ynList.length >= 4) || Date.now() - T0 > 240000) break;
  const n = 7, g = Game.fromRows(c.rows, 'X', n); let tS = -1; for (let i = 0; i < n * n && tS < 0; i++) if (g.get(i) === -1) tS = i; if (tS < 0) continue; const tgt = [tS % n, (tS / n) | 0];
  console.error('eye', c.size, Date.now() - T0, killList.length, liveList.length, ynList.length);
  const opt = { maxNodes: 6e5 }; const kx = S.canKill(g, tS, 1, 13, opt, 1), ko = S.canKill(g, tS, 1, 13, opt, -1); if (kx === null || ko === null) continue;
  if (kx && killList.length < 9) { const f = S.firstMoves(g, tS, 1, 1, 13, opt); if (f.good.length >= 1 && f.good.length <= 2) { killList.push(Object.assign({ kind: 'kill', target: tgt, turn: 'X' }, c)); continue; } }
  if (!ko && liveList.length < 5) { const f = S.firstMoves(g, tS, 1, -1, 13, opt); if (f.good.length >= 1 && f.good.length <= 3) { liveList.push(Object.assign({ kind: 'live', target: tgt, turn: 'O' }, c)); continue; } }
  if (!kx && ynList.length < 4) ynList.push(Object.assign({ kind: 'yn', target: tgt, turn: 'X', ans: kx }, c));
}
// 풀이가 느린 문제(틀린 수를 눌렀을 때 1초 넘게 걸림)는 뺐어요
killList.splice(5, 1); killList.splice(3, 1);
const nameOf = (c) => c.size + '칸 눈 모양';
const killItem = (c) => ({ kind: 'kill', rows: c.rows, turn: 'X', target: c.target, sym: true, prompt: '흑 차례! ' + nameOf(c) + '의 백을 잡는 급소는?', explain: '급소를 먼저 두어서 백이 두 눈을 못 만들게 했어요.', hintText: '눈 모양의 중심이 되는 점을 찾아봐요.' });
const liveItem = (c) => ({ kind: 'live', rows: c.rows, turn: 'O', target: c.target, sym: true, prompt: '백 차례! ' + nameOf(c) + '에서 사는 수는?', explain: '급소에 먼저 두어서 두 눈을 만들었어요.', hintText: '눈이 둘로 나뉘는 점을 찾아봐요.' });
const ynItem = (c) => ({ kind: 'yn', calc: 'kill', rows: c.rows, turn: 'X', target: c.target, sym: true, prompt: '흑 차례예요. ' + nameOf(c) + '의 백을 잡을 수 있나요?', explain: '어떻게 두어도 백이 두 눈을 만들어서 살아 있는 모양이에요.', why: { true: '이 모양은 백이 두 눈을 만들 수 있어서 잡을 수 없어요.' } });

/* ---------- 파일 쓰기 ---------- */
const J = (o) => JSON.stringify(o);
const lessons = [
  { id: 'i10', lv: 1, ord: 81, icon: '🎯', title: '따내기 연습 ①', sub: '단수 돌 따내기 · 쉬움', items: cap1.map(capItem), page: { n: 7, rows: ['.......', '.......', '..XO...', '..XOX..', '..XO...'.replace('..XO...', '...X...'), '.......', '.......'], rings: [], text: '활로가 하나만 남은 돌(단수)은 마지막 활로를 막으면 따낼 수 있어요. 흑이 되어 백 돌을 따내 보세요. 문제마다 판이 돌아가거나 뒤집혀서 나와요.' } },
  { id: 'i11', lv: 1, ord: 82, icon: '🎯', title: '따내기 연습 ②', sub: '이어진 돌 따내기 · 보통', items: cap2.map(capItem), page: { text: '이번에는 돌이 이어져 있거나 다른 돌이 많아요. 헷갈리는 돌에 속지 말고, 단수가 된 백 돌의 마지막 활로를 찾아요.' } },
  { id: 'i12', lv: 1, ord: 83, icon: '☝️', title: '단수 연습', sub: '활로 하나 남기기', items: atr.map(capItem), page: { text: '활로가 둘 남은 백 돌에서 하나를 막으면 "단수"가 돼요. 단수를 만들어 백을 위협해 보세요. 활로를 막을 수 있는 자리는 여러 곳이에요.' } },
  { id: 'c6', lv: 2, ord: 41, icon: '✌️', title: '양단수 연습', sub: '한 수로 두 곳 위협', items: dbl.map(dblItem), page: { text: '백 돌 두 곳이 함께 가진 활로에 두면 양쪽이 동시에 단수가 돼요. 상대는 한쪽밖에 못 지키니 다른 쪽을 잡을 수 있어요. 그 자리를 찾아보세요.' } },
  { id: 'c7', lv: 2, ord: 42, icon: '🪜', title: '축 연습', sub: '끝까지 몰 수 있을까?', items: lad.map(ladItem), page: { text: '도망가는 백 돌을 계속 단수로 몰면(축) 계단 모양으로 달려가요. 길목에 백 돌이 있으면 빠져나가요. 흑이 잡을 수 있는지 판단해 보세요.' } },
  { id: 'm6', lv: 3, ord: 31, icon: '🧩', title: '사활 연습', sub: '급소 찾기 · 살았나? 죽었나?', items: [...killList.map(killItem), ...liveList.map(liveItem), ...ynList.map(ynItem)], page: { text: '눈 모양의 급소는 공격하는 쪽에게는 눈을 없애는 점이고, 지키는 쪽에게는 두 눈을 만드는 점이에요. 어떤 모양은 먼저 두어도 못 잡아요. 정답은 규칙 엔진이 직접 계산했어요.' } }
];
let js = '/* 바둑 배우기 — 연습장 (따내기·단수·양단수·축·사활). scripts/go-practice-gen.mjs 가 규칙 엔진으로 만들고 검증한 문제예요(직접 고치지 마세요). */\n(function (root) {\n  \'use strict\';\n  var L = root.OKS_GO_LESSONS || require(\'./lessons.js\'), add = L.add;\n';
for (const l of lessons) {
  const pg = Object.assign({ n: 7 }, l.page); if (!pg.rows) { const it = l.items[0]; pg.rows = it.rows; pg.n = it.rows.length; pg.turn = it.turn; }
  js += '  add(' + J({ id: l.id, lv: l.lv, ord: l.ord, icon: l.icon, title: l.title, sub: l.sub, play: null, pages: [{ n: pg.n, rows: pg.rows, turn: pg.turn || 'X', text: pg.text }], items: l.items }) + ');\n';
}
js += '})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(dir, 'lessons-prac.js'), js);
console.log('따내기', cap1.length, cap2.length, '단수', atr.length, '양단수', dbl.length, '축', lad.length, 'T/F', lad.filter((x) => x.ans).length, '사활 kill', killList.length, 'live', liveList.length, 'yn', ynList.length, '후보', cands.length);
