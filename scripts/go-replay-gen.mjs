// 바둑 "복기 수업" 만들기.
//   node scripts/go-replay-gen.mjs selfplay <판수> <시작번호>   컴퓨터끼리 9줄 대국을 두게 해서 scripts/data/selfplay-<번호>.json 에 저장(몇 분 걸려요)
//   node scripts/go-replay-gen.mjs build                        scripts/data/ 의 컴퓨터 대국 + scripts/data/sgf/*.sgf 로 playground/go/lessons-replay.js 를 만들어요
// 해설은 모두 규칙 엔진이 확인한 사실(따냄·단수·도망·이음)만 써요. SGF 안의 해설(C[])이 있으면 그대로 덧붙여요.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), dir = path.join(root, 'playground', 'go'), data = path.join(root, 'scripts', 'data');
const Go = require(path.join(dir, 'engine.js')); const { Game } = Go;
const [, , mode, a1, a2] = process.argv;

/* ---------- 컴퓨터끼리 두기 ---------- */
if (mode === 'selfplay') {
  const games = +a1 || 2, start = +a2 || 1; const openings = [[4, 4], [2, 2], [6, 6], [2, 6], [6, 2], [4, 2], [2, 4]];
  for (let k = 0; k < games; k++) {
    const g = new Game(9), hist = []; const o = openings[(start + k) % openings.length]; g.play(o[0], o[1]); hist.push(o[1] * 9 + o[0]); let passes = 0;
    while (hist.length < 54 && passes < 2) { const r = Go.ai.choose(g, 4, 6.5); if (r.pass || r.s < 0) { g.pass(); hist.push(-1); passes++; if (passes >= 1) break; continue; } passes = 0; if (!g.play(r.s % 9, (r.s / 9) | 0)) { g.pass(); hist.push(-1); break; } hist.push(r.s); }
    const f = path.join(data, 'selfplay-' + (start + k) + '.json'); fs.writeFileSync(f, JSON.stringify({ n: 9, moves: hist, source: 'computer' })); console.log('저장', f, hist.length + '수');
  }
  process.exit(0);
}

/* ---------- SGF 읽기 ---------- */
// 한자·가나 이름은 한글로 바꿔 보여 줘요(필요한 선수만 여기에 더해요)
const KO_NAMES = { '王泽锦': '왕쩌진', '丁浩': '딩하오', '辜梓豪': '구쯔하오', '本木克弥': '모토키 가쓰야', '이다아츠시': '이다 아쓰시', '리친청': '리친청', '양딩신': '양딩신' };
function parseSgf(txt) {
  const n = +((txt.match(/SZ\[(\d+)\]/) || [])[1] || 19), prop = (k) => ((txt.match(new RegExp('(?:^|[^A-Z])' + k + '\\[([^\\]]*)\\]')) || [])[1] || '').trim();
  const pt = (s) => (s && s.length >= 2 ? [s.charCodeAt(0) - 97, s.charCodeAt(1) - 97] : null);
  
  const setup = { B: [], W: [] }; const am = txt.split(';')[1] || ''; for (const [key, c] of [['AB', 'B'], ['AW', 'W']]) { const m = am.match(new RegExp(key + '((?:\\[[a-z]{2}\\])+)')); if (m) (m[1].match(/\[([a-z]{2})\]/g) || []).forEach((q) => setup[c].push(pt(q.slice(1, 3)))); }
  const moves = [], comments = [];
  // 가지(변화도)가 있는 기보도 첫 줄기(본 기보)만 따라가요
  let i = txt.indexOf('(') + 1, first = true; const walk = (keep) => { let seenChild = false;
    while (i < txt.length && txt[i] !== ')') {
      if (txt[i] === ';') { i++; let props = ''; while (i < txt.length && /[A-Z]/.test(txt[i])) { let k = ''; while (/[A-Z]/.test(txt[i])) k += txt[i++]; let vals = []; while (txt[i] === '[') { let v = ''; i++; while (i < txt.length && txt[i] !== ']') { if (txt[i] === '\\') i++; v += txt[i++]; } i++; vals.push(v); while (/\s/.test(txt[i] || '')) i++; } props += k + '=' + vals[0] + '\u0001'; if ((k === 'B' || k === 'W') && keep && !first) { /* 아래에서 처리 */ } if (keep && (k === 'B' || k === 'W')) { const q = pt(vals[0]); if (!q || q[0] >= n) moves.push({ c: k, pass: true }); else moves.push({ c: k, x: q[0], y: q[1] }); comments.push(''); } else if (keep && k === 'C' && comments.length) comments[comments.length - 1] = vals[0]; } first = false; }
      else if (txt[i] === '(') { i++; const k = keep && !seenChild; seenChild = true; walk(k); }
      else i++; }
    i++; };
  walk(true);
  return { n, setup, moves, comments, meta: { PB: prop('PB'), PW: prop('PW'), GN: prop('GN'), DT: prop('DT'), EV: prop('EV'), RE: prop('RE') } };
}

/* ---------- 설명 만들기 ---------- */
const nm = (c) => (c > 0 ? '흑' : '백'), josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0 ? a : b; };
const toRows = (g) => { const n = g.n, out = []; for (let y = 0; y < n; y++) { let r = ''; for (let x = 0; x < n; x++) { const v = g.get(y * n + x); r += v > 0 ? 'X' : v < 0 ? 'O' : '.'; } out.push(r); } return out; };
const nbs = (x, y, n) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter((q) => q[0] >= 0 && q[1] >= 0 && q[0] < n && q[1] < n);
function region(x, y, n) { const ex = Math.min(x, n - 1 - x), ey = Math.min(y, n - 1 - y); const big = n >= 13 ? 3 : 0; if (ex <= 2 + big && ey <= 2 + big) return '귀'; if (Math.min(ex, ey) <= 1 + (n >= 13 ? 2 : 0)) return '변'; return '중앙'; }
function analyze(g0, mv, idx) {   // g0: 두기 전 판. 반환: { text, tags }
  const n = g0.n, c = mv.c === 'B' ? 1 : -1, g = g0.copy(); const adjOwnBefore = [], seen = new Set();
  nbs(mv.x, mv.y, n).forEach((q) => { const v = g0.get(q[1] * n + q[0]); if (v === c) { const gr = g0.group(q[0], q[1]), k = gr.stones.join(','); if (!seen.has(k)) { seen.add(k); adjOwnBefore.push(gr); } } });
  const rec = g.play(mv.x, mv.y); if (!rec) return null; const tags = [], me = nm(c), op = nm(-c); let text = '';
  const capN = rec.captured.length;
  const atariGroups = []; const seen2 = new Set(); nbs(mv.x, mv.y, n).forEach((q) => { if (g.get(q[1] * n + q[0]) === -c) { const gr = g.group(q[0], q[1]), k = gr.stones.join(','); if (!seen2.has(k)) { seen2.add(k); if (gr.libs.length === 1) atariGroups.push(gr); } } });
  const mine = g.group(mv.x, mv.y);
  if (capN > 0) { tags.push('capture'); text = me + josa(me, '이', '가') + ' ' + op + ' 돌 ' + capN + '개를 따냈어요!'; }
  else if (atariGroups.length >= 2) { tags.push('atari'); text = me + josa(me, '이', '가') + ' ' + op + ' 돌 두 곳을 한꺼번에 단수로 몰았어요! (양단수)'; }
  else if (atariGroups.length === 1) { tags.push('atari'); text = me + josa(me, '이', '가') + ' 단수를 쳤어요. ' + op + ' 돌의 활로가 하나뿐이에요.'; }
  else if (adjOwnBefore.some((gr) => gr.libs.length === 1) && mine.libs.length >= 2) { tags.push('escape'); text = me + josa(me, '이', '가') + ' 단수가 된 돌을 이어서 도망쳤어요.'; }
  else if (mine.libs.length === 1) { text = me + '의 돌이 단수가 됐어요. 위험해요!'; }
  else if (adjOwnBefore.length >= 2) { text = me + josa(me, '이', '가') + ' 떨어져 있던 돌을 이어서 튼튼하게 만들었어요.'; }
  else if (idx < 6) { text = me + josa(me, '이', '가') + ' ' + region(mv.x, mv.y, n) + '에 자리를 잡았어요.'; }
  return { text, tags };
}
function legalCapture(g, n, c) { const out = []; for (let s = 0; s < n * n; s++) { if (g.get(s)) continue; const t = g.copy(); t.turn = c; const r = t.play(s % n, (s / n) | 0); if (r && r.captured.length > 0) out.push([s % n, (s / n) | 0]); } return out; }
function legalAtari(g, n, c) { const out = []; for (let s = 0; s < n * n; s++) { if (g.get(s)) continue; const t = g.copy(); t.turn = c; const r = t.play(s % n, (s / n) | 0); if (!r || r.captured.length) continue; const me = t.group(s % n, (s / n) | 0); if (me.libs.length < 2) continue; let ok = false; nbs(s % n, (s / n) | 0, n).forEach((q) => { if (t.get(q[1] * n + q[0]) === -c && t.group(q[0], q[1]).libs.length === 1) ok = true; }); if (ok) out.push([s % n, (s / n) | 0]); } return out; }
function legalEscape(g, n, c, stones) { const out = []; for (let s = 0; s < n * n; s++) { if (g.get(s)) continue; const t = g.copy(); t.turn = c; const r = t.play(s % n, (s / n) | 0); if (!r) continue; const gr = t.group(stones[0] % n, (stones[0] / n) | 0); if (gr && gr.libs.length >= 2) out.push([s % n, (s / n) | 0]); } return out; }

/* ---------- 수업으로 만들기 ---------- */
function buildLesson(game, id, ord, label, title, sub, firstText) {
  const n = game.n, g = new Game(n); (game.setup.B || []).forEach((p) => { g.b[g.p(p[0], p[1])] = 1; }); (game.setup.W || []).forEach((p) => { g.b[g.p(p[0], p[1])] = -1; });
  g.turn = game.setup.B.length && !game.setup.W.length ? -1 : 1; const startTurn = game.moves.length && game.moves[0].c === 'W' ? -1 : g.turn; g.turn = startTurn;
  const SEG = 8, MAXM = Math.min(game.moves.length, 48), pages = [], quizPool = [];
  pages.push({ n, rows: toRows(g), turn: g.turn > 0 ? 'X' : 'O', text: firstText });
  for (let a = 0; a < MAXM; a += SEG) {
    const b = Math.min(MAXM, a + SEG), rows0 = toRows(g), turn0 = g.turn > 0 ? 'X' : 'O', script = []; let notable = 0;
    for (let i = a; i < b; i++) {
      const mv = game.moves[i]; if (mv.pass) break; const an = analyze(g, mv, i); if (!an) break; const c = mv.c === 'B' ? 1 : -1;
      if (an.tags.length && i >= 4) quizPool.push({ i, rows: toRows(g), turn: c > 0 ? 'X' : 'O', c, tag: an.tags[0], mv });
      const cm = game.comments[i], text = [an.text, cm].filter(Boolean).join(' '); if (text) notable++;
      script.push(text ? [mv.x, mv.y, text, 2300] : [mv.x, mv.y, null, 750]); g.turn = c; g.play(mv.x, mv.y);
    }
    if (!script.length) break;
    pages.push({ n, rows: rows0, turn: turn0, script, text: (a + 1) + '~' + (a + script.length) + '수를 따라 둬요. 돌이 놓이는 순서를 눈여겨봐요.' + (notable ? ' 중요한 장면은 설명이 나와요.' : '') });
  }
  pages.push({ n, rows: toRows(g), turn: g.turn > 0 ? 'O' : 'X', text: '여기까지 ' + label + ' 따라 두어 봤어요. 이제 같은 대국의 장면에서 문제를 풀어 봐요!' });
  // 문제: 따내기·단수·도망 장면에서 고르게
  const items = [], used = new Set(); const order = quizPool.slice().sort((x, y) => x.i - y.i);
  for (const q of order) {
    if (items.length >= 6) break; if (items.length && q.i - items[items.length - 1]._i < 4) continue;
    const g1 = Game.fromRows(q.rows, q.turn, n); let ans, prompt, explain, hint;
    if (q.tag === 'capture') { ans = legalCapture(g1, n, q.c); prompt = nm(q.c) + ' 차례! 상대 돌을 따낼 수 있는 곳은?'; explain = '단수가 된 돌의 마지막 활로를 막아 따냈어요.'; hint = '활로가 하나 남은 상대 돌을 찾아봐요.'; }
    else if (q.tag === 'atari') { ans = legalAtari(g1, n, q.c); prompt = nm(q.c) + ' 차례! 상대 돌을 단수로 몰 수 있는 곳은?'; explain = '활로를 하나만 남겨서 단수로 몰았어요.'; hint = '활로가 둘 남은 상대 돌을 찾아봐요.'; }
    else { const stones = []; nbs(q.mv.x, q.mv.y, n).forEach((p) => { if (g1.get(p[1] * n + p[0]) === q.c && g1.group(p[0], p[1]).libs.length === 1) stones.push(p[1] * n + p[0]); }); if (!stones.length) continue; ans = legalEscape(g1, n, q.c, stones); prompt = nm(q.c) + ' 차례! 단수가 된 내 돌이 살아나갈 곳은?'; explain = '활로를 늘려서 단수에서 벗어났어요.'; hint = '단수가 된 내 돌 옆의 빈 점을 봐요.'; }
    if (ans.length < 1 || ans.length > 5) continue; const key = q.rows.join('') + q.tag; if (used.has(key)) continue; used.add(key);
    items.push({ kind: 'set', rows: q.rows, turn: q.turn, answers: ans, sym: true, prompt, explain, hintText: hint, wrong: '그곳은 아니에요. 다시 한 번 살펴봐요.', _i: q.i });
  }
  items.forEach((it) => { delete it._i; });
  return { id, lv: 3, ord, icon: '🎞️', title, sub, play: null, pages, items };
}

if (mode === 'build') {
  const lessons = []; let no = 1;
  const files = fs.existsSync(data) ? fs.readdirSync(data).filter((f) => /^selfplay-\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(9)) - parseInt(b.slice(9))) : [];
  for (const f of files) { const j = JSON.parse(fs.readFileSync(path.join(data, f), 'utf8')); const moves = j.moves.filter((s) => s >= 0).map((s, i) => ({ c: i % 2 === 0 ? 'B' : 'W', x: s % j.n, y: (s / j.n) | 0 })); if (moves.length < 24) continue;
    lessons.push(buildLesson({ n: j.n, setup: { B: [], W: [] }, moves, comments: [] }, 'r' + no, 100 + no, '컴퓨터끼리 둔 9줄 대국을', '복기 ' + no + ' · 컴퓨터 대국', '9줄 대국 따라 두기', '컴퓨터(4단계)끼리 둔 9줄 대국이에요. 한 수씩 따라 둬 보고, 따내기·단수가 나오는 장면을 눈여겨봐요.')); no++; }
  const sd = path.join(data, 'sgf'); if (fs.existsSync(sd)) for (const f of fs.readdirSync(sd).filter((x) => /\.sgf$/i.test(x)).sort()) {
    const sg = parseSgf(fs.readFileSync(path.join(sd, f), 'utf8')); if (sg.moves.length < 12) continue; const ko = (t) => Object.keys(KO_NAMES).reduce((q, k) => q.split(k).join(KO_NAMES[k]), t), who = sg.meta.PB && sg.meta.PW ? ko(sg.meta.PB) + ' 대 ' + ko(sg.meta.PW) : (sg.meta.GN || f.replace(/\.sgf$/i, ''));
    lessons.push(buildLesson(sg, 'r' + no, 100 + no, '기보를', '복기 ' + no + ' · ' + who.slice(0, 18), (sg.meta.DT || sg.meta.EV || 'SGF 기보 따라 두기').slice(0, 24), '기보를 한 수씩 따라 둬 보는 수업이에요. ' + (sg.meta.RE ? '결과: ' + sg.meta.RE + '. ' : '') + '설명은 판의 변화(따냄·단수 등)를 엔진이 확인해서 붙였어요.')); no++; }
  let js = '/* 바둑 배우기 — 복기 수업(기보 따라 두기). scripts/go-replay-gen.mjs 가 만든 파일이에요(직접 고치지 마세요). */\n(function (root) {\n  \'use strict\';\n  var L = root.OKS_GO_LESSONS || require(\'./lessons.js\'), add = L.add;\n';
  lessons.forEach((l) => { js += '  add(' + JSON.stringify(l) + ');\n'; }); js += '})(typeof window !== \'undefined\' ? window : globalThis);\n';
  fs.writeFileSync(path.join(dir, 'lessons-replay.js'), js); console.log('복기 수업', lessons.length, '개 (문제 ' + lessons.reduce((s, l) => s + l.items.length, 0) + '개)');
}
