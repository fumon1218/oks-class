// 컴퓨터 대국에서 뽑은 9줄 장면으로 "형세 판단"과 "최선의 한 수" 문제를 만들어 playground/go/lessons-eval.js 로 저장해요.
// 사용: node scripts/go-lessons-eval.mjs   (몇 분 걸려요. 결과 파일은 저장소에 들어 있으니 평소엔 안 돌려도 돼요)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
const Go = require(path.join(dir, 'engine.js'));
const N = 9, KOMI = 6.5;
const calm = (g) => { for (let s = 0; s < N * N; s++) if (g.get(s)) { const q = g.group(s % N, (s / N) | 0); if (q.libs.length < 2) return false; } return true; };
const stonesOf = (g) => { let c = 0; for (let s = 0; s < N * N; s++) if (g.get(s)) c++; return c; };
const pool = [];
const t0 = Date.now();
const cache = process.env.GO_POOL_CACHE;
if (cache && fs.existsSync(cache)) pool.push(...JSON.parse(fs.readFileSync(cache, 'utf8')));
const fromCache = pool.length > 0;
for (let game = 0; !fromCache && game < 40 && Date.now() - t0 < 150000; game++) {
  const g = new Go.Game(N);
  for (let ply = 0; ply < 40 && !g.ended(); ply++) {
    const r = Go.ai.choose(g, game % 2 ? 3 : 2, KOMI); if (r.pass || r.s < 0) g.pass(); else g.play(r.s % N, (r.s / N) | 0);
    if (ply >= 11 && ply % 3 === 0 && calm(g) && stonesOf(g) >= 12) {
      const a = Go.estimate(g, 500, KOMI), b = Go.estimate(g, 500, KOMI);
      if (Math.sign(a.diff) !== Math.sign(b.diff) && Math.abs(a.diff) > 3) continue;
      const d = (a.diff + b.diff) / 2; if (Math.abs(a.diff - b.diff) > 4) continue;
      pool.push({ rows: g.rows(), turn: g.turn > 0 ? 'X' : 'O', diff: d, ply });
    }
  }
}
if (cache && pool.length) fs.writeFileSync(cache, JSON.stringify(pool));
console.log('후보 장면', pool.length, ((Date.now() - t0) / 1000).toFixed(0) + 's');
const cls = (d) => (d >= 8 ? 'B' : d <= -8 ? 'W' : Math.abs(d) <= 2.5 ? 'E' : null);
const take = (want, test, used) => { const out = []; for (const w of want) { const i = pool.findIndex((p, k) => !used.has(k) && test(p) === w); if (i >= 0) { used.add(i); out.push(pool[i]); } } return out; };
const used = new Set();
const mk = (p) => { const c = p.diff > 0 ? '흑' : '백', m = Math.abs(p.diff).toFixed(0); return { kind: 'eval3', rows: p.rows, turn: p.turn, answer: p.diff >= 3 ? 'B' : p.diff <= -3 ? 'W' : 'E', prompt: '지금 판세는 누가 유리할까요? (덤 6집 반 포함, 컴퓨터가 계산한 결과와 비교해 봐요)', explain: Math.abs(p.diff) <= 3 ? '컴퓨터는 거의 비슷하다고 계산했어요(차이 ' + m + '집 안쪽).' : '컴퓨터는 ' + c + '이 약 ' + m + '집 앞선다고 계산했어요.', why: {} }; };
const itemsA = take(['B', 'W', 'E', 'B', 'W', 'E'], (p) => cls(p.diff), used).map(mk);
const mid = (p) => (Math.abs(p.diff) > 3.5 && Math.abs(p.diff) < 8 ? (p.diff > 0 ? 'B' : 'W') : null);
const itemsB = take(['B', 'W', 'B', 'W'], mid, used).concat(take(['E', 'E'], (p) => (Math.abs(p.diff) <= 2.5 ? 'E' : null), used)).map(mk);
// 최선의 한 수
const picks = [];
for (let i = 0; i < pool.length && picks.length < 6; i++) {
  if (used.has(i)) continue; const p = pool[i]; if (p.ply > 30) continue;
  const g = Go.Game.fromRows(p.rows, p.turn, N); const r = Go.mcts(g, { ms: 3000, komi: KOMI });
  const kids = r.kids.filter((k) => k.s >= 0 && k.v >= 100); if (kids.length < 3 || r.s < 0) continue;
  const best = kids[0], others = kids.slice(1).filter((k) => best.win - k.win >= 0.03 && best.v >= k.v * 3); if (others.length < 2) continue;
  used.add(i); const o = others.slice(-2).reverse();
  const cs = [{ s: best.s, ok: true }, { s: o[0].s }, { s: o[1].s }].map((c, k) => ({ s: c.s, ok: c.ok, w: [best, o[0], o[1]][k].win }));
  // 보기 순서 섞기(고정된 순서)
  const order = [(picks.length + 1) % 3, (picks.length + 2) % 3, picks.length % 3]; const sh = order.map((j) => cs[j]);
  const letters = ['A', 'B', 'C'], why = {}; let correct = null;
  sh.forEach((c, k) => { if (c.ok) correct = letters[k]; why[letters[k]] = c.ok ? '컴퓨터가 가장 깊이 읽고 가장 많이 고른 자리예요(예상 승률 약 ' + Math.round(c.w * 100) + '%).' : '컴퓨터의 예상 승률은 약 ' + Math.round(c.w * 100) + '%로 더 낮아요. 다른 자리가 더 컸어요.'; });
  picks.push({ kind: 'pick', rows: p.rows, turn: p.turn, sym: true, choices: sh.map((c, k) => ({ p: [c.s % N, (c.s / N) | 0], t: letters[k] })), correct: [correct], prompt: '지금 ' + (p.turn === 'X' ? '흑' : '백') + ' 차례예요. 컴퓨터는 어디가 가장 좋은 수라고 볼까요?', explain: '컴퓨터와 같은 생각이에요!', why });
}
console.log('형세', itemsA.length, itemsB.length, '한 수', picks.length);
const head = '/* go-lessons-eval.mjs 가 만든 파일이에요(직접 고치지 마세요). 컴퓨터 대국에서 뽑은 장면으로 만든 형세 판단·최선의 수 문제 */\n(function (root) {\n  var L = root.OKS_GO_LESSONS || require(\'./lessons.js\');\n';
const lesson = (id, lv, ord, icon, title, sub, pages, items) => '  L.add(' + JSON.stringify({ id, lv, ord, icon, title, sub, play: null, pages, items }) + ');\n';
let body = '';
body += lesson('m3', 3, 30, '⚖️', '형세 판단 입문', '누가 유리할까?', [
  { n: 9, text: '바둑은 대국 도중에도 "지금 누가 유리한가"를 판단하는 게 중요해요. 이것을 형세 판단이라고 해요. 유리하면 안전하게, 불리하면 승부를 걸어야 하니까요.' },
  { n: 9, text: '형세 판단 방법: ① 양쪽의 확실한 집을 세어요. ② 죽은 돌과 살아 있는 돌을 구분해요. ③ 아직 정해지지 않은 경계선은 크기를 어림해요. ④ 덤(백에게 주는 점수)을 더해서 비교해요.' },
  { n: 9, text: '이제 컴퓨터 대국에서 뽑은 장면으로 연습해요. 컴퓨터가 수만 번 끝까지 두어 보고 낸 결과와 비교해 보세요. 정확히 맞히지 못해도 괜찮아요. 눈이 좋아지는 과정이에요!' }
], itemsA);
body += lesson('a2', 4, 20, '⚖️', '형세 판단 심화', '미세한 차이 읽기', [
  { n: 9, text: '고수는 "몇 집 차이인가"까지 읽어요. 집으로 나타나지 않는 요소도 함께 봐요: 아직 약한 돌, 상대가 노릴 침입 자리, 끝내기에서 남은 큰 곳(선수 끝내기).' },
  { n: 9, text: '지금 유리하다고 해서 방심은 금물이에요. 반대로 불리해도 포기하지 말고 역전할 자리를 찾아요. 이번 문제는 차이가 작거나 비슷한 장면도 있어요.' }
], itemsB);
body += lesson('a3', 4, 30, '🧠', 'AI와 함께 생각하기', '최선의 한 수 찾기', [
  { n: 9, text: '이번에는 컴퓨터와 같은 눈으로 장면을 보는 연습이에요. 후보 세 곳 중에서 컴퓨터가 수천 번 시뮬레이션해서 가장 좋다고 본 자리를 골라요.' },
  { n: 9, text: '정답을 못 맞혀도 괜찮아요. 왜 그 자리가 더 큰지(약점을 보강하는지, 상대 돌을 위협하는지, 집이 크게 늘어나는지) 생각해 보는 게 중요해요.' }
], picks);
fs.writeFileSync(path.join(dir, 'lessons-eval.js'), head + body + '})(typeof window !== \'undefined\' ? window : globalThis);\n');
console.log('저장 완료');
