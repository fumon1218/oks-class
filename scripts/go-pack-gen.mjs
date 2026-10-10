// 공개 기보 모음(CWI "Database of Go Games", 퍼블릭 도메인 표기)에서 입문·중급·고급 기보를 골라 playground/go/games-pack.js 를 만들어요.
// 사용: node scripts/go-pack-gen.mjs <games 폴더> [시드]   (원본 SGF는 저장소에 넣지 않고, 고른 기보의 수순만 담아요)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url); globalThis.window = globalThis;
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
require(path.join(dir, 'sgf.js')); const E = require(path.join(dir, 'engine.js')); const SG = require(path.join(dir, 'strategy.js'));
const root = process.argv[2]; if (!root) { console.error('사용: node scripts/go-pack-gen.mjs <games 폴더>'); process.exit(1); }
let seed = +(process.argv[3] || 20261010); const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.sgf$/i.test(e.name)) files.push(p); } })(root);

/* 한 판 검사: 엔진으로 처음부터 끝까지 규칙대로 두어지는지 확인하고, 초반 모양 태그를 만들어요 */
function load(f) {
  let t; try { t = fs.readFileSync(f, 'utf8'); if (t.includes('�')) t = fs.readFileSync(f, 'latin1'); } catch (e) { return null; }
  if (/HA\[[1-9]|AB\[|AW\[/.test(t)) return null; const g = window.OKS_SGF.parse(t); if (!g || g.setup.B.length || g.setup.W.length || g.fc !== 'B') return null;
  const n = g.n, mv = g.mv, N = mv.length / 2; if (!/^[BW]\+/.test(g.re || '')) return null;
  const game = new E.Game(n); const kinds = []; let corners = [];
  for (let i = 0; i < N; i++) { const a = mv.slice(i * 2, i * 2 + 2); if (a === '--') { game.pass(); continue; } const x = a.charCodeAt(0) - 97, y = a.charCodeAt(1) - 97; if (x >= n || y >= n) return null;
    if (i < 24) { const d = SG.describeMove(game, { x, y }); if (!d) return null; kinds.push(d.kind); if (d.kind === 'corner' && corners.length < 4) { const ln = SG.lineOf(n, y * n + x); corners.push(ln[0] + '-' + ln[1]); } }
    if (!game.play(x, y)) return null; }
  return { n, moves: N, g, kinds, corners, re: g.re };
}
const NAME = { 'Dosaku': '도사쿠', 'Jowa': '조와', 'Shusaku': '슈사쿠', 'Shusai': '슈사이', 'Go Seigen': '고 세이겐', 'Cho Chikun': '조치훈', 'Takemiya Masaki': '다케미야 마사키', 'Kobayashi Koichi': '고바야시 고이치', 'Otake Hideo': '오타케 히데오', 'Ishida Yoshio': '이시다 요시오', 'Sakata Eio': '사카타 에이오', 'Fujisawa Hideyuki': '후지사와 슈코', 'Iyama Yuta': '이야마 유타', 'Lee Sedol': '이세돌', 'Lee Changho': '이창호', 'Cho Hunhyun': '조훈현', 'Ke Jie': '커제', 'Gu Li': '구리', 'Chang Hao': '창하오', 'Yi Ch’ang-ho': '이창호', 'AlphaGo': '알파고', 'Fan Hui': '판후이', 'Hane Naoki': '하네 나오키', 'Yamashita Keigo': '야마시타 게이고', 'Kono Rin': '고노 린', 'Cho U': '조우', 'Takao Shinji': '다카오 신지', 'Rin Kaiho': '린 하이펑', 'Ishii Kunio': '이시이 구니오', 'Kato Masao': '가토 마사오' };
const ko = (s) => NAME[s] || s;
const bucket = (n, mn, mx, pred) => files.map((f) => ({ f })).filter(() => true);
const sel = { 1: [], 2: [], 3: [] };
const pick = (list, want, ok, cap) => { const out = [], cnt = {}, seen = new Set(); for (const f of shuffle(list)) { if (out.length >= want) break; const L = load(f); if (!L || !ok(L)) continue; const top = path.relative(root, f).split(path.sep)[0]; if ((cnt[top] || 0) >= (cap || 99)) continue; const key = L.g.mv.slice(0, 40); if (seen.has(key)) continue; seen.add(key); cnt[top] = (cnt[top] || 0) + 1; out.push({ f, L, top }); } return out; };
const by = (names) => files.filter((f) => names.includes(path.relative(root, f).split(path.sep)[0]));
const decisive = (L) => !/^[BW]\+(0|0\.5)?$/.test(L.re);
// 입문: 9줄 대국(36판) — 짧고 규칙대로 두는 판
sel[1] = pick(files.filter((f) => /other_sizes/.test(f)), 36, (L) => L.n === 9 && L.moves >= 30 && L.moves <= 100);
// 중급: 13줄 대국 14판 + 19줄 짧은 대국(60~150수) 30판
sel[2] = pick(files.filter((f) => /other_sizes/.test(f)), 14, (L) => L.n === 13 && L.moves >= 40 && L.moves <= 160).concat(
  pick(by(['Honinbo', 'Meijin', 'Kisei', 'Judan', 'Gosei', 'Tengen', 'Oza', 'Ryusei', 'LG', 'Samsung', 'Agon', 'Fujitsu', 'NHK', 'Shinjin-O']), 30, (L) => L.n === 19 && L.moves >= 60 && L.moves <= 150 && /\+R/.test(L.re), 3));
// 고급: 19줄 정상 대국(200수 이상, 큰 대회·옛 명인·알파고) 60판
sel[3] = pick(by(['Honinbo', 'Meijin', 'Kisei', 'Judan', 'Gosei', 'Tengen', 'Oza', 'Ryusei', 'LG', 'Samsung', 'Agon', 'Fujitsu', 'Go_Seigen', 'Shusaku', 'Shusai', 'AlphaGo', 'Cho_Chikun', 'ancient']), 60, (L) => L.n === 19 && L.moves >= 200 && L.moves <= 330, 6);
const LV = { 1: '입문', 2: '중급', 3: '고급' }; const games = []; let k = 0;
for (const lv of [1, 2, 3]) for (const s of sel[lv]) {
  const { L, top } = s, g = L.g; const kk = L.kinds, parts = [];
  if (L.n >= 13 && L.corners.length) parts.push('귀 ' + [...new Set(L.corners.map((c) => ({ '3-3': '삼삼', '3-4': '소목', '4-4': '화점', '3-5': '외목' }[c] || c)))].join('·'));
  if (kk.includes('kakari')) parts.push('걸침'); if (kk.includes('extend')) parts.push('벌림'); if (kk.includes('fold')) parts.push('굳힘');
  games.push({ id: 'c' + (++k), lv, b: ko(g.b), w: ko(g.w), dt: (g.dt || '').slice(0, 10), re: g.re, n: L.n, op: parts.join(' · '), sr: top, mv: g.mv });
}
const out = '/* 공개 기보 팩 — scripts/go-pack-gen.mjs 가 만든 파일이에요(직접 고치지 마세요).\n   출처: CWI "Database of Go Games"(https://homepages.cwi.nl/~aeb/go/games/) — 제작자가 퍼블릭 도메인이라고 밝힌 모음에서 골랐어요. */\n(function () { var base = window.OKS_GO_GAMES || []; base.forEach(function (g) { if (!g.lv) g.lv = 3; });\n  window.OKS_GO_GAMES = base.concat(' + JSON.stringify(games) + '); })();\n';
fs.writeFileSync(path.join(dir, 'games-pack.js'), out);
console.log('입문', sel[1].length, '중급', sel[2].length, '고급', sel[3].length, '· 파일', (out.length / 1024).toFixed(0) + 'KB');
console.log(games.filter((g) => g.lv === 3).slice(0, 8).map((g) => [g.b, g.w, g.dt, g.re, g.op, g.sr].join(' / ')).join('\n'));
