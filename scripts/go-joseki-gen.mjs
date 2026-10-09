// 바둑 "정석 흐름" 만들기: 기보 라이브러리(playground/go/games.js)에서 귀마다 처음 나온 수들을 모아
// 자주 나온 진행(트리)을 세어 playground/go/lessons-joseki.js 로 저장해요.   node scripts/go-joseki-gen.mjs [dump]
// 정석 "정답"이 아니라 "프로 기보에서 실제로 많이 나온 진행"이에요(몇 판 중 몇 번인지 함께 보여 줘요).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
global.window = global; require(path.join(dir, 'games.js')); const games = global.OKS_GO_GAMES;
const R = 9, MAXLEN = 12, MAXIDX = 120;       // 귀 범위(변에서 0~9줄), 귀당 최대 수, 앞에서 120수 안에서만
const key = (m) => m.u + ',' + m.v;
const trie = { n: 0, kids: new Map() };
function add(seq) { let node = trie; node.n++; for (const m of seq) { const k = m.rel + ':' + key(m); if (!node.kids.has(k)) node.kids.set(k, { m, n: 0, kids: new Map() }); node = node.kids.get(k); node.n++; } }
let corners = 0;
games.forEach((g) => {
  const mv = []; for (let i = 0; i + 1 < g.mv.length; i += 2) { const a = g.mv.slice(i, i + 2); mv.push(a === '--' ? null : [a.charCodeAt(0) - 97, a.charCodeAt(1) - 97]); }
  const per = {}; // 귀 번호 -> 수
  mv.forEach((p, i) => { if (!p || i >= MAXIDX) return; const cx = p[0] < 9 ? 0 : 1, cy = p[1] < 9 ? 0 : 1, u = Math.min(p[0], 18 - p[0]), v = Math.min(p[1], 18 - p[1]); if (u > R || v > R) return;
    (per[cx + ',' + cy] = per[cx + ',' + cy] || []).push({ i, color: i % 2 === 0 ? 1 : -1, u, v }); });
  Object.values(per).forEach((list) => { const seq = list.slice(0, MAXLEN); if (seq.length < 2) return; corners++;
    const first = seq[0].color, mk = (sw) => seq.map((m) => ({ u: sw ? m.v : m.u, v: sw ? m.u : m.v, rel: m.color === first ? 'A' : 'B' }));
    const a = mk(false), b = mk(true), sa = a.map((m) => m.rel + key(m)).join('|'), sb = b.map((m) => m.rel + key(m)).join('|'); add(sa <= sb ? a : b); });
});
console.log('기보', games.length, '귀', corners);
const top = (node, depth, ind) => { [...node.kids.values()].sort((x, y) => y.n - x.n).slice(0, 4).forEach((k) => { if (k.n < 4) return; console.log(' '.repeat(ind) + k.m.rel + '(' + k.m.u + ',' + k.m.v + ') x' + k.n); if (depth > 1) top(k, depth - 1, ind + 2); }); };
if (process.argv[2] === 'dump') { top(trie, 7, 0); process.exit(0); }

const { Game } = require(path.join(dir, 'engine.js'));
const nmPos = (m) => (m.u + 1) + '-' + (m.v + 1), toXY = (m) => [18 - m.u, m.v];
const alt = (node, last) => [...node.kids.values()].filter((k) => k.m.rel !== (last ? last.m.rel : 'B')).sort((a, b) => b.n - a.n);   // 번갈아 두는 수만
// 줄기: 첫 수(A)부터 번갈아, 자주 나온 수를 따라가기. pick(depth, node, cands) 로 갈림길 고르기
function line(root, pick) { const out = []; let node = root, last = null; while (out.length < 9) { const c = alt(node, last).filter((k) => k.n >= 3); if (!c.length) break; const k = pick ? pick(out.length, node, c) : c[0]; if (!k) break; out.push({ k, parent: node }); node = k; last = k; } return out; }
const rootA = (name) => [...trie.kids.values()].find((k) => k.m.rel === 'A' && nmPos(k.m) === name);
const fam = [['4-4', '화점(4-4)'], ['3-4', '소목(3-4)']], lessons = []; let no = 1;
for (const [pos, label] of fam) {
  const root = rootA(pos); if (!root) continue;
  const seconds = [...root.kids.values()].filter((k) => k.m.rel === 'B' && k.n >= 15).sort((a, b) => b.n - a.n);
  for (const sec of seconds) {
    const lines = [];
    const base = [{ k: root, parent: trie }].concat(line(root, (d, node, c) => (d === 0 ? sec : c[0])));
    lines.push(base);
    // 갈림길에서 두 번째·세 번째로 많은 수를 따라간 줄기
    for (let want = 1; want <= 2 && lines.length < 3; want++) {
      let found = null; for (let d = 1; d < base.length && !found; d++) { const node = base[d].k, last = d > 0 ? base[d].k : null; const c = alt(node, node).filter((k) => k.n >= 4); const prev = base[d + 1] && base[d + 1].k; const others = c.filter((k) => k !== prev); if (others[want - 1] && others[want - 1].n >= Math.max(4, node.n * 0.15)) found = { d, k: others[want - 1] }; }
      if (!found) break; const head = base.slice(0, found.d + 1), tail = line(found.k, null); lines.push(head.concat([{ k: found.k, parent: head[head.length - 1].k }]).concat(tail.map((t) => t)));
    }
    const pages = lines.map((ln, li) => ({ n: 19, turn: 'X', text: (li === 0 ? '프로 기보에서 가장 많이 나온 진행이에요.' : '이 갈림길에서 두 번째로 많이 나온 진행이에요.') + ' 먼저 둔 쪽을 흑으로 보여 줘요. ▶ 를 눌러 한 수씩 봐요.',
      script: ln.map((st, i) => { const xy = toXY(st.k.m), share = st.parent.n ? Math.round(st.k.n / st.parent.n * 100) : 100; return [xy[0], xy[1], (i + 1) + '수 · ' + (i % 2 === 0 ? '흑' : '백') + ' ' + nmPos(st.k.m) + (i === 0 ? ' — 귀에 처음 둔 수 (프로 기보 ' + st.k.n + '번)' : ' — 같은 모양에서 ' + st.parent.n + '번 중 ' + st.k.n + '번 (' + share + '%)'), 1100]; }) }));
    // 문제: 주 줄기에서 "다음 수 맞히기"
    const items = []; const mainLine = lines[0];
    for (let d = 1; d < mainLine.length && items.length < 5; d++) {
      const node = mainLine[d - 1].k, nextK = mainLine[d].k, cands = alt(node, node).filter((k) => k.n >= 3); if (node.n < 10 || nextK.n / node.n < 0.35 || d < 2) continue;
      const answers = cands.filter((k) => k.n >= node.n * 0.25).map((k) => toXY(k.m)); if (!answers.length) continue;
      const g = new Game(19); mainLine.slice(0, d).forEach((st) => { const xy = toXY(st.k.m); g.play(xy[0], xy[1]); });
      const rows = []; for (let y = 0; y < 19; y++) { let r = ''; for (let x = 0; x < 19; x++) { const v = g.get(y * 19 + x); r += v > 0 ? 'X' : v < 0 ? 'O' : '.'; } rows.push(r); }
      const me = d % 2 === 0 ? '흑' : '백';
      items.push({ kind: 'set', rows, turn: d % 2 === 0 ? 'X' : 'O', answers, sym: true, prompt: label + '으로 시작한 귀예요. ' + me + ' 차례! 프로 기보에서 이 모양 다음에 자주 나온 수는 어디일까요?', explain: '프로 기보에서 같은 모양 ' + node.n + '번 중 ' + nextK.n + '번이 ' + nmPos(nextK.m) + ' 자리였어요.', wrong: '프로 기보에서는 거의 두지 않은 자리예요. 귀 쪽에서 다시 생각해 봐요.', hintText: '귀 쪽, 이미 놓인 돌 가까이에서 찾아봐요.' });
    }
    if (!items.length || base.length < 5) continue;
    lessons.push({ id: 'j' + no, lv: 3, ord: 41 + no, icon: '🧭', title: '정석 흐름 ' + no + ' · ' + label + ' + ' + nmPos(sec.m), sub: '프로 기보 ' + sec.n + '번', play: null, replay: true, pages, items, done: '프로 ' + games.length + '판의 기보에서 자주 나온 진행이에요. 정답이 하나만 있는 건 아니에요!' }); no++;
  }
}
let js = '/* 바둑 배우기 — 정석 흐름(프로 기보에서 자주 나온 귀 진행). scripts/go-joseki-gen.mjs 가 만든 파일이에요(직접 고치지 마세요). */\n(function (root) {\n  \'use strict\';\n  var L = root.OKS_GO_LESSONS || require(\'./lessons.js\'), add = L.add;\n';
lessons.forEach((l) => { js += '  add(' + JSON.stringify(l) + ');\n'; }); js += '})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(dir, 'lessons-joseki.js'), js); console.log('정석 수업', lessons.length, '개 (문제 ' + lessons.reduce((a, l) => a + l.items.length, 0) + '개, 쪽 ' + lessons.reduce((a, l) => a + l.pages.length, 0) + ')');
lessons.forEach((l) => console.log(l.title, l.pages.map((p) => p.script.length).join('/'), l.items.length));
