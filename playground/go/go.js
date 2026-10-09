/* 옥쌤의 즐거운 교실 — 3D 바둑 (놀이별 · 전략놀이)
   공통 3D 바탕(common3d.js) + 규칙·계가·컴퓨터(engine.js, 작업 스레드) + 입문→고급 단계별 배우기(lessons.js).
   바둑돌 모델은 올려 준 바둑판 GLB에서 돌만 뽑은 assets/stones.glb, 판은 코드로 그립니다.
   모드: 배우기(단계별 연습) / 컴퓨터와 대국(9·13·19줄, 접바둑, 수준 1~5) / 둘이서 */
import { createStage, THREE, woodCanvas, canvasTexture } from '../common3d.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';

const E = window.OKS_GO, L = window.OKS_GO_LESSONS, O = window.OKS;
const LESSON = 'play-go', LEARN_LESSON = 'play-go-learn';
const LEVEL_NAME = ['', '아주 쉬워요', '쉬워요', '보통', '어려워요', '아주 어려워요'];
const colName = (c) => (c > 0 ? '흑' : '백');
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0 ? a : b; };

const S = createStage({ extent: 17, bg: 0x4b3b27, tableColor: 0x33402f, tableY: -2.2, pol: 0.62, minDist: 25, targetY: 0, sunPos: [10, 22, 12] });
const { $, scene, say, note, sleep, tween, ease, poke } = S;

/* ---------- 판 (크기가 바뀌면 다시 그려요) ---------- */
let N = 9, SP = 2, HW = 8, EDGE = 2.4, HALF = 10.4, STONE_D = 1.9, REST = 0.3;
const boardGroup = new THREE.Group(); scene.add(boardGroup);
const stoneLayer = new THREE.Group(); scene.add(stoneLayer);
const markLayer = new THREE.Group(); scene.add(markLayer);
const sideMat = new THREE.MeshStandardMaterial({ map: canvasTexture(woodCanvas(256, 96, '#c58f42', 21)), roughness: 0.7 });
const topMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
let boardTex = null, boardMesh = null;
const wx = (s) => ((s % N) - (N - 1) / 2) * SP, wz = (s) => (((s / N) | 0) - (N - 1) / 2) * SP;
const STARS = { 19: [3, 9, 15], 13: [3, 6, 9] };
function layout(n) { N = n; SP = Math.min(2.4, 17 / (n - 1)); HW = (n - 1) * SP / 2; EDGE = SP * 0.95 + 0.5; HALF = HW + EDGE; STONE_D = SP * 0.96; REST = 0.2 * STONE_D * 0.9; }
function boardTexture(n) {
  const px = 1536, c = woodCanvas(px, px, '#e0ac5c', 33), g = c.getContext('2d'), k = px / (2 * HALF), P = (i) => ((i - (n - 1) / 2) * SP + HALF) * k;
  g.strokeStyle = '#3a2a14'; g.lineWidth = n >= 19 ? 2.4 : 3; g.beginPath();
  for (let i = 0; i < n; i++) { g.moveTo(P(i), P(0)); g.lineTo(P(i), P(n - 1)); g.moveTo(P(0), P(i)); g.lineTo(P(n - 1), P(i)); }
  g.stroke(); g.lineWidth = 5; g.strokeRect(P(0), P(0), P(n - 1) - P(0), P(n - 1) - P(0));
  g.fillStyle = '#2b1d0e'; const r = n >= 19 ? 6 : 8;
  let pts = []; if (STARS[n]) STARS[n].forEach((a) => STARS[n].forEach((b) => pts.push([a, b]))); else if (n === 9) pts = [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]]; else if (n === 7 || n === 5) pts = [[(n - 1) / 2, (n - 1) / 2]];
  pts.forEach(([a, b]) => { g.beginPath(); g.arc(P(a), P(b), r, 0, 7); g.fill(); });
  return canvasTexture(c, 8);
}
function buildBoard(n) {
  layout(n); while (boardGroup.children.length) { const m = boardGroup.children.pop(); if (m.geometry) m.geometry.dispose(); }
  if (boardTex) boardTex.dispose(); boardTex = boardTexture(n); topMat.map = boardTex; topMat.needsUpdate = true;
  boardMesh = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF, 1.6, 2 * HALF), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]); boardMesh.position.y = -0.8; boardMesh.receiveShadow = true; boardMesh.castShadow = true; boardGroup.add(boardMesh);
  const foot = new THREE.BoxGeometry(HALF * 0.34, 0.9, HALF * 0.34); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const f = new THREE.Mesh(foot, sideMat); f.position.set(a * HALF * 0.78, -2.0, b * HALF * 0.78); f.castShadow = true; boardGroup.add(f); });
  S.setExtent(1.66 * HALF); poke(400);
}

/* ---------- 바둑돌 (GLB) ---------- */
let stoneProto = {};
async function loadStones() {
  const gltf = await new GLTFLoader().loadAsync('assets/stones.glb');
  gltf.scene.traverse((o) => { if (o.isMesh) { const nm = o.name.toLowerCase(); if (nm.indexOf('white') >= 0) stoneProto[-1] = o; else if (nm.indexOf('black') >= 0) stoneProto[1] = o; } });
  if (!stoneProto[1] || !stoneProto[-1]) throw new Error('stones');
  [1, -1].forEach((c) => { const m = stoneProto[c].material = stoneProto[c].material.clone(); m.metalness = 0; m.roughness = c > 0 ? 0.3 : 0.38; m.color.set(c > 0 ? 0x18181c : 0xf4f1ea); if (m.map) m.map = null; if (m.emissive) m.emissive.set(c > 0 ? 0x000000 : 0x2a2a28); });
}
function makeStone(color) { const m = stoneProto[color].clone(); m.material = stoneProto[color].material; m.scale.set(STONE_D, STONE_D * 0.9, STONE_D); m.castShadow = true; m.receiveShadow = true; return m; }

/* ---------- 표시(마커·글자) ---------- */
const MARK = { dot: [0x3a9bff, 0.95], ring: [0xffd23c, 0.95], safe: [0x2fe07a, 0.95], danger: [0xff4a3a, 0.95], last: [0xe0392b, 1], terrB: [0x111111, 0.5], terrW: [0xffffff, 0.55], atari: [0xff7a1a, 0.95], warn: [0xff9d2e, 0.95] };
const marks = {}; Object.keys(MARK).forEach((k) => { marks[k] = new Set(); });
const markPool = []; let markUsed = 0;
const ringGeo = () => new THREE.RingGeometry(1, 1.35, 28), dotGeo = new THREE.CircleGeometry(1, 20), sqGeo = new THREE.PlaneGeometry(1, 1);
let ringG = ringGeo();
function markMesh(kind) {
  let m = markPool[markUsed]; if (!m) { m = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ transparent: true, depthTest: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; markPool.push(m); markLayer.add(m); }
  markUsed++; m.visible = true; m.material.color.setHex(MARK[kind][0]); m.material.opacity = MARK[kind][1]; m.userData.kind = kind; return m;
}
const labels = []; const labelTex = {};
function labelTexture(text, color) {
  const key = text + '|' + color; if (labelTex[key]) return labelTex[key];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = '900 ' + (text.length > 2 ? 52 : 82) + 'px "Noto Sans KR","Noto Sans CJK KR",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 12; g.strokeStyle = 'rgba(255,255,255,.9)'; g.strokeText(text, 64, 68); g.fillStyle = color; g.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; labelTex[key] = t; return t;
}
const labelData = [];   // {s, t, color}
function refreshMarkers() {
  markUsed = 0; const sq = SP;
  ['terrB', 'terrW'].forEach((k) => marks[k].forEach((s) => { const m = markMesh(k); m.geometry = sqGeo; m.scale.setScalar(sq * 0.62); m.position.set(wx(s), 0.03, wz(s)); }));
  ['dot', 'safe', 'danger', 'atari', 'warn', 'ring'].forEach((k) => marks[k].forEach((s) => { const m = markMesh(k); m.geometry = (k === 'dot') ? dotGeo : ringG; m.scale.setScalar(k === 'dot' ? SP * 0.16 : SP * 0.3); m.position.set(wx(s), stones.has(s) ? REST * 2 + 0.02 : 0.05, wz(s)); if (k !== 'dot' && stones.has(s)) m.scale.setScalar(SP * 0.36); }));
  marks.last.forEach((s) => { const m = markMesh('last'); m.geometry = dotGeo; m.scale.setScalar(SP * 0.15); m.position.set(wx(s), REST * 2 + 0.04, wz(s)); });
  for (let i = 0; i < markUsed; i++) { const m = markPool[i], kd = m.userData.kind; m.userData.pulse = kd === 'ring' || kd === 'danger' || kd === 'safe' || kd === 'atari' || kd === 'warn'; m.userData.base = m.scale.x; }
  for (let i = markUsed; i < markPool.length; i++) markPool[i].visible = false;
  labels.forEach((m) => { markLayer.remove(m); m.material.dispose(); }); labels.length = 0;
  labelData.forEach((d) => { const m = new THREE.Mesh(sqGeo, new THREE.MeshBasicMaterial({ map: labelTexture(d.t, d.color || '#1b2a4a'), transparent: true, depthTest: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 6; m.scale.setScalar(SP * (d.big ? 1.15 : 0.95)); m.position.set(wx(d.s), stones.has(d.s) ? REST * 2 + 0.05 : 0.08, wz(d.s)); markLayer.add(m); labels.push(m); });
  poke(300);
}
function clearMarks(keepLast) { Object.keys(marks).forEach((k) => { if (k === 'last' && keepLast) return; marks[k].clear(); }); labelData.length = 0; refreshMarkers(); }
const setMarks = (kind, list) => { marks[kind].clear(); (list || []).forEach((s) => marks[kind].add(s)); };

/* ---------- 상태 ---------- */
let game = new E.Game(9), mode = null, cfg = { n: 9, level: 3, color: 1, handicap: 0, komi: 6.5 }, busy = false, over = false, scoring = false, stats = O.newStats(), runId = 0, assistOn = true, terrOn = false;
let lesson = null, P = null, stepPhase = '', reviewAt = -1, deadSet = new Set(), lastScore = null;
const stones = new Map();
const isHumanTurn = () => !over && !busy && !scoring && (mode === 'two' || (mode === 'play' && game.turn === cfg.color));

function clearStones() { stones.forEach((m) => stoneLayer.remove(m)); stones.clear(); }
function syncBoard() {
  clearStones(); for (let s = 0; s < N * N; s++) { const v = game.get(s); if (v) { const m = makeStone(v); m.position.set(wx(s), REST, wz(s)); stoneLayer.add(m); stones.set(s, m); } }
  updateScore(); refreshMarkers(); poke(500);
}
function newBoard(n, g) { game = g || new E.Game(n); if (n !== N || !boardMesh) buildBoard(n); syncBoard(); }
function updateScore() {
  $('scB').textContent = '⚫ ' + game.caps.b; $('scW').textContent = '⚪ ' + game.caps.w;
  $('scB').classList.toggle('turn', !over && game.turn > 0); $('scW').classList.toggle('turn', !over && game.turn < 0);
  $('score').hidden = !(mode === 'play' || mode === 'two' || mode === 'review');
}
async function dropStone(s, color) {
  const m = makeStone(color); m.position.set(wx(s), REST + 3.4, wz(s)); stoneLayer.add(m); stones.set(s, m); OKS_PIECE.place();
  await tween(300, (p) => { m.position.y = REST + (1 - p) * 3.4; }, ease.out); m.position.y = REST;
}
async function removeStones(list) {
  if (!list.length) return; O.sfx('coin');
  await Promise.all(list.map((s) => { const m = stones.get(s); stones.delete(s); if (!m) return Promise.resolve(); return tween(380, (p) => { m.scale.set(STONE_D * (1 - p), STONE_D * 0.9 * (1 - p), STONE_D * (1 - p)); m.position.y = REST + p * 0.8; }).then(() => stoneLayer.remove(m)); }));
}
async function animateRec(rec) {
  if (rec.pass) return; marks.last.clear(); marks.last.add(rec.s); await dropStone(rec.s, rec.color); await removeStones(rec.captured); updateScore(); refreshMarkers();
}

/* ---------- 컴퓨터(작업 스레드) ---------- */
let worker = null, workerId = 0;
function startWorker() { if (worker) return; try { worker = new Worker('ai-worker.js'); } catch (e) { worker = null; } }
function history() { return game.stack.map((r) => (r.pass ? -1 : r.s)); }
function ask(kind, extra) {
  return new Promise((resolve) => {
    const id = ++workerId, msg = Object.assign({ id, kind, n: N, hist: history(), handicap: game.handicap, level: cfg.level, komi: cfg.komi }, extra || {});
    const fallback = () => { resolve(runLocal(msg)); };
    if (!worker) return setTimeout(fallback, 30);
    const done = (e) => { if (e.data.id !== id) return; worker.removeEventListener('message', done); clearTimeout(to); resolve(e.data.result); };
    const to = setTimeout(() => { worker.removeEventListener('message', done); fallback(); }, 25000);
    worker.addEventListener('message', done); worker.postMessage(msg);
  });
}
function runLocal(m) {
  const g = new E.Game(m.n); if (m.handicap) g.setHandicap(m.handicap); m.hist.forEach((s) => { if (s < 0) g.pass(); else g.play(s % m.n, (s / m.n) | 0); });
  if (m.kind === 'est') return E.estimate(g, m.runs, m.komi); if (m.kind === 'hint') return E.ai.hint(g, m.komi); return E.ai.choose(g, m.level, m.komi);
}
const komiOf = (n, hc) => (hc > 0 ? 0.5 : 6.5);

/* ---------- 대국 ---------- */
function turnText() { if (mode === 'two') return colName(game.turn) + ' 차례예요. 놓을 곳을 눌러요.'; return game.turn === cfg.color ? '내 차례예요. 놓을 곳을 눌러요.' : '컴퓨터가 생각해요…'; }
function coachScan() {   // 단수 난 덩어리 찾기
  const mine = [], theirs = [], seen = new Set(); const me = mode === 'two' ? game.turn : cfg.color;
  for (let s = 0; s < N * N; s++) { const v = game.get(s); if (!v || seen.has(s)) continue; const gr = game.group(s % N, (s / N) | 0); gr.stones.forEach((q) => seen.add(q)); if (gr.libs.length === 1) (gr.color === me ? mine : theirs).push(gr); }
  return { mine, theirs, me };
}
function coach() {
  clearMarks(true); if (over || scoring || !assistOn) return; const c = coachScan();
  c.mine.forEach((g) => { marks.danger.add(g.libs[0]); g.stones.forEach((s) => marks.atari.add(s)); }); c.theirs.forEach((g) => { marks.safe.add(g.libs[0]); });
  refreshMarkers();
  if (c.mine.length) say('내 돌이 단수예요! 주황 돌을 살리거나(빨간 동그라미로 도망) 먼저 반격해 보세요.', 'warn', '내 돌이 단수예요!');
  else if (c.theirs.length) say('상대 돌이 단수예요! 초록 동그라미에 두면 따낼 수 있어요.', 'good', '상대 돌이 단수예요!');
  else note(turnText());
}
async function afterMove(rec, human) {
  const rid = runId;
  if (game.ended()) return startScoring();
  if (mode === 'play' && game.turn !== cfg.color) return aiTurn();
  coach(); if (rec && rec.captured.length && !document.querySelector('.ch-msg.warn')) note((rec.color === (mode === 'play' ? cfg.color : rec.color) ? '돌 ' : '돌 ') + rec.captured.length + '개를 따냈어요! ' + turnText());
  updateButtons(); if (terrOn) showTerritory();
}
async function humanTap(s) {
  if (scoring) return toggleDead(s);
  if (!isHumanTurn()) return; O.unlock(); const x = s % N, y = (s / N) | 0;
  if (game.get(s)) return;
  const rec = game.play(x, y);
  if (!rec) { stats.mistakes++; O.sfx('no'); say(game.err === 'ko' ? '패예요! 방금 따낸 곳은 바로 되따낼 수 없어요. 다른 곳에 한 수 두고 오세요.' : game.err === 'suicide' ? '거기는 둘 수 없어요(자충). 두자마자 활로가 없는 곳이에요.' : '거기는 둘 수 없어요.', 'warn', game.err === 'ko' ? '패예요. 바로 되따낼 수 없어요.' : '거기는 둘 수 없어요.'); return; }
  busy = true; updateButtons(); clearMarks(true); await animateRec(rec); busy = false; updateButtons(); await afterMove(rec, true);
}
async function doPass() {
  if (scoring || over || busy || !(mode === 'play' || mode === 'two') || !isHumanTurn()) return; O.unlock();
  const rec = game.pass(); clearMarks(true); say(colName(rec.color) + '이 한 수 쉬었어요.', null, '한 수 쉬었어요.'); updateScore(); await afterMove(rec, true);
}
async function aiTurn() {
  busy = true; updateButtons(); note('컴퓨터가 생각하고 있어요…'); const rid = runId; clearMarks(true);
  const t0 = Date.now(), r = await ask('move'); await sleep(Math.max(0, 600 - (Date.now() - t0))); if (rid !== runId || over) return;
  if (r.pass || r.s < 0) { const rec = game.pass(); busy = false; say('컴퓨터가 한 수 쉬었어요.' + (game.ended() ? '' : ' 나도 더 둘 곳이 없으면 "한 수 쉬기"를 눌러요.'), null, '컴퓨터가 한 수 쉬었어요.'); updateScore(); return afterMove(rec, false); }
  const rec = game.play(r.s % N, (r.s / N) | 0); if (!rec) { game.pass(); busy = false; return afterMove(null, false); }
  await animateRec(rec); if (rid !== runId) return; busy = false; updateButtons(); await afterMove(rec, false);
}
async function doHint() {
  if (busy || over) return; O.unlock(); stats.asked++;
  if (mode === 'learn') return lessonHint();
  if (scoring || !isHumanTurn()) return; busy = true; updateButtons(); note('좋은 곳을 찾고 있어요…'); const r = await ask('hint'); busy = false; updateButtons();
  clearMarks(true); if (r.s < 0) { say('더 둘 곳이 없어 보여요. "한 수 쉬기"를 눌러 볼까요?', 'good'); return; }
  marks.ring.add(r.s); (r.kids || []).slice(1, 3).forEach((k, i) => { if (k.s >= 0) labelData.push({ s: k.s, t: ['B', 'C'][i], color: '#7a4a00' }); }); labelData.push({ s: r.s, t: 'A', color: '#1b6a32' }); refreshMarkers();
  const wr = Math.round((game.turn > 0 ? r.win : r.win) * 100); say('A 자리를 추천해요! 이기는 확률은 약 ' + wr + '%예요.', 'good', 'A 자리를 추천해요.');
}
function doUndo() {
  if (busy || over || scoring || !(mode === 'play' || mode === 'two') || !game.stack.length) return;
  let n = 0; do { if (!game.undo()) break; n++; } while (mode === 'play' && game.turn !== cfg.color && game.stack.length); if (!n) return;
  syncBoard(); clearMarks(); const l = game.stack[game.stack.length - 1]; if (l && !l.pass) marks.last.add(l.s); coach(); updateButtons(); O.sfx('tick'); say('한 수 물렸어요.', null, '한 수 물렸어요.');
}
function updateButtons() {
  const play = mode === 'play' || mode === 'two', learn = mode === 'learn';
  $('btnUndo').hidden = !play; $('btnPass').hidden = !play; $('btnTerr').hidden = !play; $('btnAssist').hidden = !play;
  $('btnNext').hidden = !(learn && stepPhase === 'page' && !(lesson && lesson.kibo)); $('btnRetry').hidden = !(learn && stepPhase === 'item'); $('btnList').hidden = !learn; $('btnHint').hidden = !(play || (learn && stepPhase === 'item'));
  { const showBar = learn && stepPhase === 'page' && PL.total > 0; $('player').hidden = !showBar; if (!showBar && PL.playing) { PL.playing = false; PL.tok++; } }
  $('btnUndo').disabled = busy || over || scoring || !play || !game.stack.length;
  $('btnPass').disabled = busy || over || scoring || !isHumanTurn(); $('btnHint').disabled = over || busy || (play && (scoring || !isHumanTurn()));
  $('btnTerr').disabled = busy || over;
}

/* ---------- 집 미리보기 · 끝내기(계가) ---------- */
async function showTerritory() {
  if (busy) return; const runs = N <= 9 ? 220 : N <= 13 ? 120 : 60; const rid = runId; note('집을 어림하고 있어요…'); const r = await ask('est', { runs }); if (rid !== runId) return;
  marks.terrB.clear(); marks.terrW.clear(); for (let s = 0; s < N * N; s++) { if (r.own[s] > 0.45 && !game.get(s)) marks.terrB.add(s); else if (r.own[s] < -0.45 && !game.get(s)) marks.terrW.add(s); } refreshMarkers();
  const lead = r.diff; say(Math.abs(lead) < 1.5 ? '지금은 거의 비슷해요!' : (lead > 0 ? '흑' : '백') + '이 ' + Math.abs(lead).toFixed(0) + '집쯤 앞서요(덤 포함, 대략이에요).', null, false);
}
async function toggleTerr() {
  terrOn = !terrOn; $('btnTerr').setAttribute('aria-pressed', terrOn); $('btnTerr').textContent = terrOn ? '🧮 집 숨기기' : '🧮 집 보기';
  if (terrOn) await showTerritory(); else { marks.terrB.clear(); marks.terrW.clear(); refreshMarkers(); }
}
async function startScoring() {
  scoring = true; busy = true; updateButtons(); clearMarks(true); terrOn = false; $('btnTerr').textContent = '🧮 집 보기'; say('둘 다 쉬었어요! 죽은 돌을 찾는 중이에요…', null, '대국이 끝났어요. 죽은 돌을 찾고 있어요.');
  const rid = runId, r = await ask('est', { runs: N <= 9 ? 400 : N <= 13 ? 200 : 100 }); if (rid !== runId) return; busy = false;
  deadSet = new Set(r.dead); showDead(); showQuiz('scoring');
  say('죽은 돌에 빨간 ✕ 표시를 했어요. 틀렸다면 돌을 눌러서 바꿔요. 맞으면 아래 "계가하기"를 눌러요.', null, '죽은 돌에 표시를 했어요. 틀렸다면 돌을 눌러서 바꿔요.');
}
function showDead() {
  labelData.length = 0; const seen = new Set(); deadSet.forEach((s) => { labelData.push({ s, t: '✕', color: '#e0261b', big: true }); }); marks.terrB.clear(); marks.terrW.clear();
  const sc = game.score([...deadSet], cfg.komi); for (let s = 0; s < N * N; s++) { if (game.get(s) && !deadSet.has(s)) continue; if (sc.own[s] > 0) marks.terrB.add(s); else if (sc.own[s] < 0) marks.terrW.add(s); } refreshMarkers();
}
function toggleDead(s) {
  if (!scoring || busy) return; if (!game.get(s)) return; O.unlock(); const gr = game.group(s % N, (s / N) | 0), dead = deadSet.has(s); gr.stones.forEach((q) => { if (dead) deadSet.delete(q); else deadSet.add(q); });
  O.sfx('tick'); showDead(); note(dead ? '이 돌 덩어리를 산 돌로 바꿨어요.' : '이 돌 덩어리를 죽은 돌로 바꿨어요.');
}
function finishScoring() {
  const rid = runId, sc = game.score([...deadSet], cfg.komi); lastScore = sc; scoring = false; over = true; hideQuiz(); updateButtons(); showDead();
  const w = sc.winner, margin = Math.abs(sc.diff), human = mode === 'two' ? 0 : cfg.color, humanWon = mode === 'two' || w === human;
  const title = mode === 'two' ? colName(w) + ' ' + margin.toFixed(1).replace('.0', '') + '집 승!' : humanWon ? '이겼어요! ' + margin.toFixed(1).replace('.0', '') + '집 차이' : '아쉬워요. ' + margin.toFixed(1).replace('.0', '') + '집 차이로 졌어요';
  const text = '⚫ 흑 ' + sc.black + '집 (집 ' + sc.terrB + ' + 따낸 돌 ' + (sc.capsB + sc.deadW) + ') · ⚪ 백 ' + sc.white + '집 (집 ' + sc.terrW + ' + 따낸 돌 ' + (sc.capsW + sc.deadB) + ' + 덤 ' + sc.komi + ')';
  const stars = humanWon ? 3 : margin <= 10 ? 2 : 1, speak = humanWon ? '이겼어요! 정말 잘했어요!' : '아쉽지만 끝까지 잘했어요. 한 번 더 해 볼까요?';
  say(title, humanWon ? 'good' : null, false);
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(바둑)', school: 'elem', topic: '3D 바둑 ' + N + '줄', level: mode === 'play' ? cfg.level : 1, engine: 'go',
    rounds: game.stack.length, mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: () => startGame(cfg) }];
  btns.push({ label: '🔍 복기하기', color: 'orange', onClick: () => startReview() });
  if (mode === 'play' && humanWon && cfg.level < 5) btns.push({ label: '⬆ 다음 수준 (' + (cfg.level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, cfg.level + 1); startGame(Object.assign({}, cfg, { level: cfg.level + 1 })); } });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 1600);
}

/* ---------- 복기 ---------- */
function startReview() {
  const hist = game.stack.map((r) => ({ s: r.s, color: r.color, pass: r.pass })); const full = game; mode = 'review'; reviewAt = hist.length; scoring = false; over = true;
  const render = () => {
    const g = new E.Game(N); if (full.handicap) g.setHandicap(full.handicap); for (let i = 0; i < reviewAt; i++) { const h = hist[i]; if (h.pass) g.pass(); else g.play(h.s % N, (h.s / N) | 0); }
    game = g; syncBoard(); clearMarks(); const l = hist[reviewAt - 1]; if (l && !l.pass) marks.last.add(l.s); refreshMarkers(); $('modeLabel').textContent = '복기 · ' + reviewAt + ' / ' + hist.length + '수';
  };
  const el = $('quiz'); el.hidden = false; el.innerHTML = '<button class="ch-btn" data-d="-10">⏮ 10수 앞</button><button class="ch-btn" data-d="-1">◀ 한 수 앞</button><button class="ch-btn" data-d="1">한 수 뒤 ▶</button><button class="ch-btn" data-d="10">10수 뒤 ⏭</button><button class="ch-btn" data-d="0">☰ 그만 보기</button>';
  el.querySelectorAll('button').forEach((b) => { b.onclick = () => { const d = +b.dataset.d; if (!d) { hideQuiz(); openMenu(true); return; } reviewAt = Math.max(0, Math.min(hist.length, reviewAt + d)); O.sfx('tick'); render(); }; });
  updateButtons(); say('복기해요. 단추로 앞뒤 수를 살펴봐요.', null, false); render();
}

/* ---------- 대국 시작 ---------- */
function resetState() { over = false; busy = false; scoring = false; runId++; terrOn = false; $('btnTerr').textContent = '🧮 집 보기'; deadSet = new Set(); clearMarks(); stats = O.newStats(); lesson = null; P = null; stepPhase = ''; hideQuiz(); }
function startGame(c) {
  resetState(); startWorker(); mode = c.mode || (c.two ? 'two' : 'play'); cfg = Object.assign({ n: 9, level: 3, color: 1, handicap: 0 }, c, { mode }); cfg.komi = komiOf(cfg.n, cfg.handicap);
  if (mode === 'play') O.rememberLevel(LESSON, cfg.level);
  const g = new E.Game(cfg.n); const hs = cfg.handicap ? g.setHandicap(cfg.handicap) : []; newBoard(cfg.n, g); $('menu').hidden = true;
  $('modeLabel').textContent = mode === 'play' ? cfg.n + '줄 · 컴퓨터 수준 ' + cfg.level + (cfg.handicap ? ' · ' + cfg.handicap + '점 접바둑' : '') : cfg.n + '줄 · 둘이서';
  S.setView(mode === 'play' && cfg.color < 0 ? Math.PI : 0, false, 0.62); updateButtons();
  if (mode === 'play' && game.turn !== cfg.color) { say('컴퓨터가 먼저 시작해요.'); aiTurn(); } else say(mode === 'two' ? '흑부터 시작해요. 줄이 만나는 점을 눌러요.' : (cfg.handicap ? '접바둑이에요. 백이 먼저 두어요.' : '내가 흑이에요. 줄이 만나는 점을 눌러 시작해요!'));
  if (mode === 'play' && cfg.handicap && cfg.color > 0) {}
}

/* ---------- 배우기: 교육과정 지도 ---------- */
const PROG_KEY = 'oks_go_prog_v1';
const progress = (() => { try { return JSON.parse(localStorage.getItem(PROG_KEY) || '{}'); } catch (e) { return {}; } })();
const saveProg = () => { try { localStorage.setItem(PROG_KEY, JSON.stringify(progress)); } catch (e) {} };
/* ---------- 오답노트: 틀린 문제를 모아 두었다가 1일 → 3일 → 7일 뒤에 다시 풀어요(3번 연속 깨끗이 풀면 졸업) ---------- */
const WR_KEY = 'oks_go_wrong_v1', DAY = 864e5, WR_GAP = [0, DAY, 3 * DAY, 7 * DAY];
const loadWrong = () => { try { return JSON.parse(localStorage.getItem(WR_KEY) || '{}'); } catch (e) { return {}; } };
const saveWrong = (w) => { try { localStorage.setItem(WR_KEY, JSON.stringify(w)); } catch (e) {} };
const srcOf = () => (lesson.srcs ? lesson.srcs[lessonStep.item] : { lid: lesson.id, idx: lessonStep.item });
function wrongMark() { if (!lesson || lesson.kibo) return; const k = srcOf(), key = k.lid + ':' + k.idx, w = loadWrong(), e = w[key] || { n: 0, box: 0 }; e.n++; e.box = 0; e.due = Date.now(); w[key] = e; saveWrong(w); }
function wrongClean() { const k = srcOf(), key = k.lid + ':' + k.idx, w = loadWrong(), e = w[key]; if (!e) return; e.box++; if (e.box >= 3) delete w[key]; else e.due = Date.now() + WR_GAP[e.box]; saveWrong(w); }
function wrongPool(onlyDue) { const w = loadWrong(), out = []; Object.keys(w).forEach((key) => { if (onlyDue && w[key].due > Date.now()) return; const [lid, idx] = key.split(':'), l = L.LESSONS.find((q) => q.id === lid); if (l && l.items[+idx]) out.push({ lid, idx: +idx, it: l.items[+idx], n: w[key].n }); }); return out.sort((a, b) => b.n - a.n); }
function startWrong() {
  let pool = wrongPool(true); if (!pool.length) pool = wrongPool(false); pool = pool.slice(0, 10); if (!pool.length) { openCurriculum(); return; }
  startLesson('wrong', { id: 'wrong', lv: 1, title: '오답노트', pages: [], items: pool.map((q) => q.it), srcs: pool.map((q) => ({ lid: q.lid, idx: q.idx })), done: '틀렸던 문제를 다시 풀었어요. 깨끗이 풀면 노트에서 점점 사라져요.' });
}
function openCurriculum() {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  let nextId = null; L.LESSONS.some((l) => { if (!progress[l.id]) { nextId = l.id; return true; } return false; });
  const lv = L.LEVELS.map((lv, i) => {
    const list = L.LESSONS.filter((l) => l.lv === i + 1), done = list.filter((l) => progress[l.id]).length;
    return '<section class="go-lv"><h3><i>' + lv.icon + '</i> ' + lv.name + ' <small>' + lv.sub + ' · ' + done + '/' + list.length + '</small></h3><div class="go-lessons">' +
      list.map((l) => '<button type="button" class="go-lesson' + (progress[l.id] ? ' done' : '') + (l.id === nextId ? ' next' : '') + '" data-id="' + l.id + '"><i>' + l.icon + '</i><b>' + l.title + '</b><span>' + (progress[l.id] ? '⭐'.repeat(progress[l.id].stars) : (l.id === nextId ? '다음 차례' : l.sub || '')) + '</span></button>').join('') + '</div></section>';
  }).join('');
  const wn = Object.keys(loadWrong()).length, wd = wrongPool(true).length;
  el.innerHTML = '<div class="ch-card go-map"><h2>🎓 바둑 배우기</h2><p>처음이라면 <b>입문</b>부터 차례대로! 이미 아는 부분은 건너뛰어도 돼요.</p>' + (wn ? '<button type="button" class="ch-btn big go" id="wrongBtn">📕 오답노트 · 틀린 문제 ' + wn + '개' + (wd ? ' (복습할 때: ' + wd + '개)' : '') + '</button>' : '') + lv + '<div class="ch-row"><button type="button" class="ch-chip" id="mapBack">← 처음 화면</button></div></div>';
  el.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => { O.unlock(); startLesson(b.dataset.id); }; });
  if ($('wrongBtn')) $('wrongBtn').onclick = () => { O.unlock(); startWrong(); };
  $('mapBack').onclick = () => openMenu(false); const nx = el.querySelector('.next'); if (nx && nx.scrollIntoView) setTimeout(() => nx.scrollIntoView({ block: 'center' }), 50);
}

/* ---------- 배우기: 수업 진행 ---------- */
let lessonStep = { page: 0, item: 0, mistakes: 0, asked: 0, phase: 'page' }, scriptRun = 0;
function startLesson(id, obj) {
  resetState(); startWorker(); mode = 'learn'; lesson = obj || L.LESSONS.find((l) => l.id === id); if (!lesson) return; $('menu').hidden = true; $('modeLabel').textContent = L.LEVELS[lesson.lv - 1].name + ' · ' + lesson.title;
  lessonStep = { page: 0, item: 0, mistakes: 0, asked: 0, phase: 'page' }; stats = O.newStats(); S.setView(0, false, 0.62); planLesson(); showPage();
}
function loadPosition(n, g) { game = g; newBoard(n, g); clearMarks(); }
function applyShow(show) {
  clearMarks(); if (!show) return; (show.rings || []).forEach((s) => marks.ring.add(s)); (show.dots || []).forEach((s) => marks.dot.add(s)); (show.safe || []).forEach((s) => marks.safe.add(s)); (show.danger || []).forEach((s) => marks.danger.add(s)); (show.atari || []).forEach((s) => marks.atari.add(s));
  (show.terrB || []).forEach((s) => marks.terrB.add(s)); (show.terrW || []).forEach((s) => marks.terrW.add(s));
  (show.labels || []).forEach((d) => labelData.push(d)); refreshMarkers();
}
async function showPage() {
  const pg = lesson.pages[lessonStep.page]; if (!pg) return startItems(); stepPhase = 'page'; P = null; const rid = ++scriptRun; hideQuiz();
  const pp = L.preparePage(pg); loadPosition(pp.n, pp.game); applyShow(pp.show); updateButtons();
  say(pp.text, null, pp.speak || pp.text); $('btnNext').textContent = nextLabel();
  PL.tok++; PL.playing = false; PL.pp = pp; PL.k = 0; PL.rid = rid; plUpdate();
  if (pp.script && pp.script.length && !isReplayLesson()) plPlay(true);
}
/* ---------- 재생 막대(복기·시범 수업): 재생·일시정지·정지·한 수 되돌리기·빠르게 감기 ---------- */
const PL = { playing: false, speed: 1, k: 0, pp: null, plan: [], total: 0, tok: 0, anim: null, rid: 0 };
const PL_SPEEDS = [0.5, 1, 2, 4];
const isReplayLesson = () => !!lesson && (lesson.kibo || lesson.replay || /^r\d+$/.test(lesson.id));
function planLesson() { PL.plan = lesson.pages.map((pg) => (L.preparePage(pg).script || []).length); PL.total = PL.plan.reduce((a, b) => a + b, 0); PL.playing = false; PL.tok++; PL.pp = null; PL.k = 0; }
const plBase = (p) => PL.plan.slice(0, p).reduce((a, b) => a + b, 0);
const plPos = () => plBase(lessonStep.page) + PL.k;
function nextLabel() { return lessonStep.page + 1 >= lesson.pages.length ? (lesson.items.length ? '▶ 문제 풀기' : '▶ 마치기') : '▶ 다음'; }
function plUpdate() {
  const g = plPos(); $('plPlay').disabled = PL.playing; $('plPause').disabled = !PL.playing; $('plSeek').style.setProperty('--p', (PL.total ? g / PL.total * 100 : 0) + '%'); $('plSeek').max = PL.total; $('plSeek').value = g;
  $('plPos').textContent = g + ' / ' + PL.total + '수 · ' + (lessonStep.page + 1) + '/' + lesson.pages.length + '쪽'; $('plSpeedTx').textContent = '×' + PL.speed; $('plSpeed').setAttribute('aria-label', '속도 ' + PL.speed + '배');
  $('plBack').disabled = $('plBack10').disabled = $('plStop').disabled = g <= 0; $('plFwd').disabled = $('plFwd10').disabled = g >= PL.total;
}
async function plHalt() { PL.tok++; PL.playing = false; plUpdate(); try { O.hush && O.hush(); } catch (e) {} if (PL.anim) { try { await PL.anim; } catch (e) {} } }
function plLoad(p, k) { // p쪽의 k번째 수까지(애니메이션 없이) 보여 줘요
  const rid = ++scriptRun; lessonStep.page = p; const pp = L.preparePage(lesson.pages[p]), sc = pp.script || [];
  for (let i = 0; i < k; i++) { const st = sc[i]; if (st.pass) pp.game.pass(); else pp.game.play(st.s % pp.n, (st.s / pp.n) | 0); }
  loadPosition(pp.n, pp.game); let show = pp.show, text = pp.text; for (let i = 0; i < k; i++) { if (sc[i].show) show = sc[i].show; if (sc[i].text) text = sc[i].text; }
  applyShow(show); if (k && !sc[k - 1].pass) { marks.last.clear(); marks.last.add(sc[k - 1].s); refreshMarkers(); } if (lesson.kibo) kiboLabels(pp, k);
  say(text, null, false); $('btnNext').textContent = nextLabel(); PL.pp = pp; PL.k = k; PL.rid = rid; plUpdate();
}
async function plStepOnce(tok) { // 한 수 두기(애니메이션)
  const pp = PL.pp, st = pp.script[PL.k]; PL.anim = (async () => { const rec = st.pass ? pp.game.pass() : pp.game.play(st.s % pp.n, (st.s / pp.n) | 0); if (rec && !rec.pass) await animateRec(rec); if (tok !== PL.tok && tok !== -1) return; if (st.show) applyShow(st.show); if (lesson.kibo) kiboLabels(pp, PL.k + 1); if (st.text) say(st.text, null, !lesson.kibo && PL.speed <= 1 ? st.text : false); })();
  await PL.anim; PL.k++; plUpdate(); return st;
}
async function plPlay(first) {
  if (PL.playing) return; if (PL.total <= 0) return; if (plPos() >= PL.total) plLoad(0, 0);
  PL.playing = true; const tok = ++PL.tok; plUpdate(); if (first || PL.k === 0) { await sleep(900 / PL.speed); if (tok !== PL.tok) return; }
  while (PL.playing && tok === PL.tok) {
    const sc = PL.pp.script || [];
    if (PL.k >= sc.length) {
      if (!isReplayLesson() || lessonStep.page + 1 >= lesson.pages.length) break;
      await sleep(700 / PL.speed); if (tok !== PL.tok) return; plLoad(lessonStep.page + 1, 0); await sleep(700 / PL.speed); if (tok !== PL.tok) return; continue;
    }
    const st = await plStepOnce(tok); if (tok !== PL.tok) return; await sleep(Math.max(250, (st.wait || 1500) * (isReplayLesson() ? 0.6 : 1)) / PL.speed); if (tok !== PL.tok) return;
  }
  if (tok === PL.tok) { PL.playing = false; plUpdate(); }
}
async function plToggle() { O.unlock(); if (PL.playing) { await plHalt(); plUpdate(); } else plPlay(); }
async function plSeek(g) { // 전체 g번째 수까지
  await plHalt(); g = Math.max(0, Math.min(PL.total, g)); let p = 0; while (p < PL.plan.length - 1 && g > plBase(p) + PL.plan[p]) p++; plLoad(p, g - plBase(p));
}
async function plFwd1() {
  await plHalt(); if (plPos() >= PL.total) return; const sc = PL.pp.script || []; if (PL.k >= sc.length) { let p = lessonStep.page + 1; plLoad(p, 0); if (!(PL.pp.script || []).length) return; }
  const tok = PL.tok; await plStepOnce(tok);
}
{ const ft = document.querySelector('.ch-bottom'), setBot = () => document.documentElement.style.setProperty('--bot', (ft.offsetHeight + 4) + 'px'); setBot(); if (window.ResizeObserver) new ResizeObserver(setBot).observe(ft); window.addEventListener('resize', setBot); }
$('plPlay').onclick = () => { O.unlock(); plPlay(); }; $('plPause').onclick = async () => { await plHalt(); plUpdate(); }; $('plRestart').onclick = async () => { await plSeek(0); O.unlock(); plPlay(true); }; $('plStop').onclick = () => plSeek(0); $('plBack').onclick = () => plSeek(plPos() - 1); $('plBack10').onclick = () => plSeek(plPos() - 10); $('plFwd').onclick = plFwd1; $('plFwd10').onclick = () => plSeek(plPos() + 10);
$('plSpeed').onclick = () => { PL.speed = PL_SPEEDS[(PL_SPEEDS.indexOf(PL.speed) + 1) % PL_SPEEDS.length]; plUpdate(); };
$('plSeek').oninput = (e) => { plSeek(+e.target.value); };
document.addEventListener('keydown', (e) => { if ($('player').hidden || e.target.tagName === 'INPUT' && e.target.type !== 'range') return; if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); plToggle(); } else if (e.key === 'ArrowRight') { e.preventDefault(); plFwd1(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); plSeek(plPos() - 1); } });
function nextPage() {
  if (stepPhase !== 'page' || busy) return; O.unlock(); lessonStep.page++; if (lessonStep.page >= lesson.pages.length) return startItems(); showPage();
}
function startItems() { PL.tok++; PL.playing = false; lessonStep.phase = 'item'; lessonStep.item = 0; scriptRun++; busy = false; if (!lesson.items.length) return lessonDone(); showItem(); }
function showItem() {
  const it = lesson.items[lessonStep.item]; stepPhase = 'item'; hideQuiz(); scriptRun++; busy = false; P = L.prepare(it); P.mist = 0; loadPosition(P.n, P.game); applyShow(P.show);
  $('modeLabel').textContent = L.LEVELS[lesson.lv - 1].name + ' · ' + lesson.title + ' (' + (lessonStep.item + 1) + '/' + lesson.items.length + ')'; updateButtons();
  say(P.prompt, null, P.prompt); if (P.mode === 'quiz') showQuiz('item');
}
function retryItem() { if (stepPhase !== 'item' || !P || busy) return; O.unlock(); const it = lesson.items[lessonStep.item]; const keep = P.mist; P = L.prepare(it, { same: P.seed }); P.mist = keep; loadPosition(P.n, P.game); applyShow(P.show); say(P.prompt, null, false); if (P.mode === 'quiz') showQuiz('item'); }
function lessonHint() {
  if (!P || stepPhase !== 'item' || busy) return; const h = P.hint && P.hint(); lessonStep.asked++; if (!h) { say('문제를 다시 읽어 봐요.', null, false); return; }
  clearMarks(); applyShow(P.show); marks.ring.add(h.s); refreshMarkers(); say(h.text || '노란 동그라미 자리를 생각해 봐요.', 'good', h.text);
}
async function lessonTap(s) {
  if (!P || stepPhase !== 'item' || busy || P.finished) return; O.unlock();
  if (P.mode === 'quiz') return;
  const r = P.tap(s); if (!r) return;
  if (r.play) { busy = true; updateButtons(); clearMarks(true); const x = s % N, y = (s / N) | 0; const rec = game.play(x, y); if (rec) await animateRec(rec); busy = false; updateButtons(); }
  if (r.show) applyShow(r.show);
  if (r.seq && r.seq.length) await playSeq(r.seq, P);
  if (r.ok === false) { P.mist++; lessonStep.mistakes++; stats.mistakes++; wrongMark(); O.sfx('no'); say(r.msg, 'warn', r.msg); if (r.reset) { await sleep(r.resetDelay || 2200); if (stepPhase === 'item') retryKeep(); } if (P.mist >= 2 && P.hint && !r.noAutoHint) { const h = P.hint(); if (h && !r.reset) { marks.ring.add(h.s); refreshMarkers(); } } }
  else if (r.ok === true) { O.sfx(r.done ? 'ok' : 'tick'); say(r.msg, 'good', r.msg); if (r.done) itemDone(r); }
  if (r.ok === null && r.msg) note(r.msg);
}
async function playSeq(seq, Pr) {   // 풀이 그림: 번호 붙은 수를 차례로 놓아 보여 줘요
  busy = true; updateButtons(); labelData.length = 0; let i = 1;
  for (const st of seq) { const x = st.s % N, y = (st.s / N) | 0; let rec = null; if (st.color && game.turn !== st.color) game.turn = st.color; rec = game.play(x, y); if (!rec) break; await animateRec(rec); labelData.push({ s: st.s, t: String(i++), color: st.color > 0 ? '#ffffff' : '#111111', big: true }); refreshMarkers(); if (st.say) say(st.say, null, false); await sleep(650); }
  busy = false; updateButtons();
}
function retryKeep() { if (!P) return; const keep = P.mist; P = L.prepare(lesson.items[lessonStep.item], { same: P.seed }); P.mist = keep; loadPosition(P.n, P.game); applyShow(P.show); updateButtons(); }
async function lessonAnswer(v) {
  if (!P || P.finished || busy) return; O.unlock(); const r = P.answer(v); if (!r) return;
  if (r.ok === false) { P.mist++; lessonStep.mistakes++; stats.mistakes++; wrongMark(); O.sfx('no'); say(r.msg, 'warn', r.msg); if (r.show) applyShow(r.show); const el = $('quiz'); el.querySelectorAll('button').forEach((b) => { if (b.dataset.v === String(v)) { b.disabled = true; b.classList.add('bad'); } }); }
  else { if (r.show) applyShow(r.show); O.sfx('ok'); say(r.msg, 'good', r.msg); itemDone(r); }
}
async function itemDone(r) {
  P.finished = true; if (!P.mist) wrongClean(); const rid = runId, it = lessonStep.item; stepPhase = 'wait'; updateButtons(); busy = true; if (P.mode === 'quiz') { $('quiz').querySelectorAll('button').forEach((b) => { b.disabled = true; }); }
  if (r.after && r.after.length) await playSeq(r.after, P);
  await sleep(r.after && r.after.length ? 1800 : 2300); busy = false; if (rid !== runId) return; lessonStep.item++; if (lessonStep.item >= lesson.items.length) return lessonDone(); showItem();
}
function lessonDone() {
  const rid = runId, m = lessonStep.mistakes, n = Math.max(1, lesson.items.length), stars = m <= Math.max(1, n * 0.15) ? 3 : m <= n * 0.6 ? 2 : 1; over = true; stepPhase = 'done'; updateButtons(); hideQuiz();
  const prev = progress[lesson.id]; if (lesson.id !== 'wrong' && (!prev || prev.stars < stars)) progress[lesson.id] = { stars, at: Date.now() }; saveProg(); O.rememberLevel(LEARN_LESSON, lesson.lv);
  const entry = { at: new Date().toISOString(), lesson: LEARN_LESSON, subject: 'play', subjectName: '놀이(바둑)', school: 'elem', topic: '3D 바둑 배우기 · ' + lesson.title, level: lesson.lv, engine: 'go-learn', rounds: n, mistakes: m, glow: 0, hand: 0, asked: lessonStep.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const idx = L.LESSONS.indexOf(lesson), nxt = lesson.srcs ? null : L.LESSONS[idx + 1], me = lesson;
  const btns = []; if (nxt) btns.push({ label: '▶ 다음 수업: ' + nxt.title, color: 'green', onClick: () => startLesson(nxt.id) });
  if (me.play) btns.push({ label: '⚫ 바로 대국해 보기', color: 'orange', onClick: () => startGame(Object.assign({ mode: 'play', n: 9, level: 1, color: 1, handicap: 0 }, me.play)) });
  btns.push({ label: '🔁 다시 하기', color: 'blue', onClick: () => (me.srcs ? startWrong() : startLesson(me.id)) }); btns.push({ label: '☰ 수업 목록', color: 'blue', onClick: () => openCurriculum() });
  say(lesson.title + ' 수업을 마쳤어요!', 'good', false);
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title: lesson.title + ' 수업 끝!', text: lesson.done || '문제 ' + n + '개 · 틀린 횟수 ' + m + '번', speak: '수업을 마쳤어요! 정말 잘했어요!', mission: { lesson: 1 }, buttons: btns }); }, 500);
}

/* ---------- 아래쪽 질문 단추 ---------- */
function hideQuiz() { const q = $('quiz'); q.hidden = true; q.innerHTML = ''; }
function showQuiz(kind) {
  const q = $('quiz'); q.hidden = false; q.style.bottom = (document.querySelector('.ch-bottom').getBoundingClientRect().height + 10) + 'px';
  if (kind === 'scoring') { q.innerHTML = '<button class="ch-btn big go" id="qzDone">🧮 계가하기</button><button class="ch-btn big" id="qzMore">▶ 더 두기</button>'; $('qzDone').onclick = () => { O.unlock(); finishScoring(); };
    $('qzMore').onclick = () => { O.unlock(); scoring = false; hideQuiz(); game.passes = 0; deadSet.clear(); clearMarks(true); updateButtons(); say('이어서 두어요. ' + turnText(), null, false); if (mode === 'play' && game.turn !== cfg.color) aiTurn(); }; return; }
  if (kind === 'item' && P && P.mode === 'quiz') {
    q.innerHTML = P.options.map((o, i) => '<button class="ch-btn big" data-v="' + i + '">' + o.t + '</button>').join(''); q.querySelectorAll('button').forEach((b) => { b.onclick = () => lessonAnswer(+b.dataset.v); });
  }
}

/* ---------- 처음 메뉴 ---------- */
const DEFAULT_PREFS = { mode: 'learn', n: 9, color: 1, handicap: 0 };
const prefs = (() => { try { return Object.assign({}, DEFAULT_PREFS, JSON.parse(localStorage.getItem('oks_go_prefs_v1') || '{}')); } catch (e) { return Object.assign({}, DEFAULT_PREFS); } })();
const savePrefs = () => { try { localStorage.setItem('oks_go_prefs_v1', JSON.stringify(prefs)); } catch (e) {} };
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove()); hideQuiz();
  const sel = { mode: prefs.mode === 'learn' ? 'learn' : prefs.mode, n: prefs.n, color: prefs.color, handicap: prefs.handicap, playLv: O.levelFor(LESSON) };
  const chip = (cls, val, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + cls + '="' + val + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    const modes = [['learn', '🎓', '바둑 배우기', '입문부터 고급까지'], ['play', '🤖', '컴퓨터와 대국', '9·13·19줄'], ['two', '👫', '둘이서 대국', '친구와 번갈아'], ['kibo', '📜', '기보·맞히기', '프로 대국 보기']];
    const doneN = L.LESSONS.filter((l) => progress[l.id]).length; let opt = '';
    if (sel.mode === 'learn') opt = '<p class="why">입문 → 초급 → 중급 → 고급, 전체 ' + L.LESSONS.length + '개 수업 중 <b>' + doneN + '개</b>를 마쳤어요. 규칙, 단수·따내기, 사활, 축·장문, 포석, 끝내기, 형세 판단까지 하나씩 풀면서 익혀요.</p>';
    else if (sel.mode === 'kibo') opt = '<p class="why">프로 대국을 처음부터 끝까지 보거나, <b>다음 수를 맞혀</b> 보면서 눈을 길러요. 내가 가진 SGF 파일도 불러올 수 있어요.</p>';
    else {
      const mh = E.maxHandicap(sel.n); if (sel.handicap > mh) sel.handicap = mh;
      opt = '<div class="ch-row"><label>판 크기</label>' + [9, 13, 19].map((n) => chip('n', n, n + '줄', n === 9 ? '처음이라면' : n === 13 ? '중간' : '정식', sel.n === n)).join('') + '</div>';
      if (sel.mode === 'play') opt += '<div class="ch-row"><label>컴퓨터 수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('plv', l, l, LEVEL_NAME[l], sel.playLv === l)).join('') + '</div><div class="ch-row"><label>내 돌</label>' + chip('color', 1, '⚫ 흑', '먼저 시작', sel.color === 1) + chip('color', -1, '⚪ 백', '나중에', sel.color === -1) + '</div>' +
        '<div class="ch-row"><label>접바둑(흑 돌 미리 놓기)</label>' + [0, 2, 3, 4, 5, 6, 7, 8, 9].filter((h) => h <= mh).map((h) => chip('hc', h, h ? h + '점' : '없음', '', sel.handicap === h)).join('') + '</div>';
      if (sel.mode === 'play' && sel.handicap && sel.color < 0) opt += '<p class="why">접바둑은 약한 쪽이 흑을 잡아요. 내가 흑일 때 돌을 미리 놓고 시작해요.</p>';
    }
    el.innerHTML = '<div class="ch-card"><h1>⚫⚪ 3D 바둑</h1><p>집을 더 많이 차지하면 이기는 바둑이에요.</p><div class="ch-modes">' +
      modes.map((m) => '<button type="button" class="ch-mode' + (sel.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '"><i>' + m[1] + '</i><b>' + m[2] + '</b><span>' + m[3] + '</span></button>').join('') + '</div>' + opt +
      '<button type="button" class="ch-go" id="goBtn">' + (sel.mode === 'learn' ? '수업 고르기' : sel.mode === 'kibo' ? '기보 고르기' : '시작!') + '</button>' + (mode && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { sel.mode = b.dataset.mode; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-n]').forEach((b) => { b.onclick = () => { sel.n = +b.dataset.n; render(); }; });
    el.querySelectorAll('[data-plv]').forEach((b) => { b.onclick = () => { sel.playLv = +b.dataset.plv; render(); }; });
    el.querySelectorAll('[data-color]').forEach((b) => { b.onclick = () => { sel.color = +b.dataset.color; render(); }; });
    el.querySelectorAll('[data-hc]').forEach((b) => { b.onclick = () => { sel.handicap = +b.dataset.hc; render(); }; });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => { O.unlock(); Object.assign(prefs, { mode: sel.mode, n: sel.n, color: sel.color, handicap: sel.handicap }); savePrefs();
      if (sel.mode === 'learn') openCurriculum();
      else if (sel.mode === 'kibo') openKibo();
      else { el.hidden = true; const hc = sel.mode === 'play' ? sel.handicap : 0; startGame({ mode: sel.mode, n: sel.n, level: sel.playLv, color: sel.mode === 'play' ? (hc && sel.color < 0 ? -1 : sel.color) : 1, handicap: hc }); } };
  }
  render(); O.say('3D 바둑이에요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 기보 보기 · 다음 수 맞히기 ---------- */
const KG_KEY = 'oks_go_sgf_v1', KG_SCORE = 'oks_go_guess_v1';
const loadUserGames = () => { try { return JSON.parse(localStorage.getItem(KG_KEY) || '[]'); } catch (e) { return []; } };
const saveUserGames = (a) => { try { localStorage.setItem(KG_KEY, JSON.stringify(a)); } catch (e) { note('저장 공간이 부족해요.'); } };
const guessScore = () => { try { return Object.assign({ asked: 0, right: 0 }, JSON.parse(localStorage.getItem(KG_SCORE) || '{}')); } catch (e) { return { asked: 0, right: 0 }; } };
const allGames = () => (window.OKS_GO_GAMES || []).concat(loadUserGames());
const reText = (re) => { if (!re) return ''; const m = /^([BW])\+(.*)$/i.exec(re); if (!m) return re; const w = m[1].toUpperCase() === 'B' ? '흑' : '백', r = m[2]; return w + (/^R/i.test(r) ? ' 불계승' : /^T/i.test(r) ? ' 시간승' : /^[\d.]+$/.test(r) ? ' ' + r + '집 승' : ' 승'); };
const gTitle = (g) => g.b + ' 대 ' + g.w;
const decodeMv = (g) => { const out = []; for (let i = 0; i + 1 < g.mv.length; i += 2) { const a = g.mv.slice(i, i + 2); out.push(a === '--' ? { pass: true } : { x: a.charCodeAt(0) - 97, y: a.charCodeAt(1) - 97 }); } return out; };
const hasSetup = (g) => !!(g.setup && (g.setup.B.length || g.setup.W.length));
function kiboLabels(pp, k) {
  labelData.length = 0;
  for (let i = Math.max(0, k - 6); i < k; i++) { const st = pp.script[i]; if (!st || st.pass) continue; const c = pp.game.get(st.s); if (!c) continue; labelData.push({ s: st.s, t: String(i + 1), color: c > 0 ? '#ffffff' : '#111111', big: i === k - 1 }); }
  refreshMarkers();
}
function openKibo() {
  scriptRun++; PL.tok++; PL.playing = false; const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove()); hideQuiz(); $('player').hidden = true;
  const gs = allGames(), sc = guessScore();
  el.innerHTML = '<div class="ch-card"><h1>📜 기보 · 맞히기</h1><p class="why">프로 대국을 한 수씩 보거나, 다음 수를 맞혀 봐요. 입문이라면 <b>🎯 맞히기</b>로 앞부분 60수부터 해 봐요.' + (sc.asked ? '<br>지금까지 <b>' + sc.asked + '번 중 ' + sc.right + '번</b> 맞혔어요.' : '') + '</p><div class="kibo-list">' +
    gs.map((g) => '<div class="kibo-item"><div><b>' + gTitle(g) + '</b><small>' + [g.dt, reText(g.re), decodeMv(g).length + '수', g.n && g.n !== 19 ? g.n + '줄' : '', g.id[0] === 'u' ? '내 기보' : ''].filter(Boolean).join(' · ') + '</small></div><span><button type="button" class="ch-chip" data-v="' + g.id + '">▶ 보기</button>' +
      (hasSetup(g) ? '' : '<button type="button" class="ch-chip" data-g="' + g.id + '">🎯 맞히기</button>') + (g.id[0] === 'u' ? '<button type="button" class="ch-chip" data-d="' + g.id + '" aria-label="지우기">🗑</button>' : '') + '</span></div>').join('') +
    '</div><div class="ch-row"><button type="button" class="ch-chip" id="kiboImp">📂 내 SGF 불러오기</button><input type="file" id="kiboFile" accept=".sgf,.SGF,text/plain" multiple hidden><button type="button" class="ch-chip" id="kiboBack">← 처음으로</button></div></div>';
  const byId = (id) => allGames().find((g) => g.id === id);
  el.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { O.unlock(); startKibo(byId(b.dataset.v)); }; });
  el.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => { O.unlock(); startGuess(byId(b.dataset.g)); }; });
  el.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => { saveUserGames(loadUserGames().filter((g) => g.id !== b.dataset.d)); openKibo(); }; });
  $('kiboBack').onclick = () => openMenu(!mode); $('kiboImp').onclick = () => $('kiboFile').click();
  $('kiboFile').onchange = async (e) => {
    const fs = [...e.target.files]; if (!fs.length) return; const cur = loadUserGames(); let ok = 0;
    for (const f of fs) { try { const g = window.OKS_SGF.parse(await f.text()); if (!g) continue; const key = g.mv + g.b + g.w; if (allGames().some((q) => q.mv === g.mv && q.b === g.b && q.w === g.w) || cur.some((q) => q.mv + q.b + q.w === key)) continue; g.id = 'u' + Date.now().toString(36) + ok; cur.push(g); ok++; } catch (er) {} }
    if (ok) saveUserGames(cur); openKibo(); note(ok ? ok + '개를 불러왔어요.' : 'SGF 기보를 읽지 못했어요(이미 있거나 형식이 달라요).');
  };
  O.say('보고 싶은 기보를 골라요.');
}
function startKibo(g) {
  const n = g.n || 19, mv = decodeMv(g), fc = g.fc === 'W' ? 1 : 0, nm = (i) => ((i + fc) % 2 === 0 ? '흑' : '백');
  const grid = []; for (let y = 0; y < n; y++) grid.push(new Array(n).fill('.')); if (g.setup) { g.setup.B.forEach((p) => { grid[p[1]][p[0]] = 'X'; }); g.setup.W.forEach((p) => { grid[p[1]][p[0]] = 'O'; }); }
  const script = mv.map((m, i) => (m.pass ? { pass: true, text: (i + 1) + '수 · ' + nm(i) + ' 패스', wait: 700 } : [m.x, m.y, (i + 1) + '수 · ' + nm(i), 900]));
  const page = { n, rows: grid.map((r) => r.join('')), turn: fc ? 'O' : 'X', text: gTitle(g) + (g.dt ? ' (' + g.dt + ')' : '') + (g.re ? ' · ' + reText(g.re) : '') + '. ▶ 를 눌러 처음부터 보거나, 아래 막대를 끌어서 원하는 수로 가요.', script };
  startLesson('kibo', { id: 'kibo', kibo: true, lv: 3, title: gTitle(g), pages: [page], items: [] });
}
let G = null;
function startGuess(g) {
  resetState(); startWorker(); mode = 'guess'; $('menu').hidden = true; $('modeLabel').textContent = '다음 수 맞히기 · ' + gTitle(g); const mv = decodeMv(g), n = g.n || 19;
  newBoard(n); S.setView(0, false, 0.62); G = { g, mv, i: 0, tries: 0, pts: 0, right: 0, asked: 0, max: Math.min(60, mv.length), busy: true, from: 2 };
  updateButtons(); guessNext(true);
}
function guessPanel(buttons) {
  const q = $('quiz'); q.hidden = false; q.style.bottom = (document.querySelector('.ch-bottom').getBoundingClientRect().height + 10) + 'px'; q.innerHTML = buttons.map((b, i) => '<button type="button" class="ch-btn big' + (b.cls ? ' ' + b.cls : '') + '" data-i="' + i + '">' + b.t + '</button>').join('');
  q.querySelectorAll('button').forEach((el) => { el.onclick = () => { O.unlock(); buttons[+el.dataset.i].f(); }; });
}
async function guessNext(first) {
  if (!G) return; const rid = runId;
  while (G.i < G.from && G.i < G.mv.length) { const m = G.mv[G.i]; const rec = m.pass ? game.pass() : game.play(m.x, m.y); if (rec && !rec.pass) await animateRec(rec); if (rid !== runId) return; G.i++; }
  if (G.i >= G.max) return guessEnd();
  G.tries = 0; G.busy = false; clearMarks(); const m = G.mv[G.i]; if (m.pass) { game.pass(); G.i++; return guessNext(); }
  const c = game.turn; say(G.i + 1 + '수째 · ' + colName(c) + ' 차례. 프로는 어디에 뒀을까요? 판을 눌러 봐요.', null, first ? '프로는 어디에 뒀을까요? 판을 눌러 봐요.' : false);
  guessPanel([{ t: '🤔 모르겠어요', f: () => guessReveal(false) }, { t: '✋ 그만하기', f: guessEnd }]);
}
async function guessTap(s) {
  if (!G || G.busy || game.get(s)) return; const m = G.mv[G.i]; if (!m || m.pass) return; const a = m.y * N + m.x, d = Math.max(Math.abs((s % N) - m.x), Math.abs(((s / N) | 0) - m.y));
  O.unlock(); G.busy = true; const sc = guessScore();
  if (s === a) { sc.asked++; sc.right++; G.asked++; G.right++; G.pts += G.tries ? 1 : 2; try { localStorage.setItem(KG_SCORE, JSON.stringify(sc)); } catch (e) {} O.sfx('coin'); say(G.tries ? '맞았어요! 프로와 같은 수예요.' : '정답! 프로와 똑같은 수예요! 🎉', 'good', false); return guessPlay(); }
  if (G.tries === 0) { G.tries = 1; clearMarks(); marks.dot.add(s); refreshMarkers(); say(d <= 2 ? '아깝다! 아주 가까워요. 한 번만 더 생각해 봐요.' : '음, 다른 곳이에요. 한 번 더 생각해 봐요.', null, false); await sleep(900); marks.dot.clear(); refreshMarkers(); G.busy = false; return; }
  guessReveal(true, d);
}
async function guessReveal(tried) {
  if (!G) return; const rid = runId, m = G.mv[G.i], sc = guessScore(); G.busy = true; sc.asked++; G.asked++; try { localStorage.setItem(KG_SCORE, JSON.stringify(sc)); } catch (e) {}
  clearMarks(); marks.ring.add(m.y * N + m.x); refreshMarkers(); say('프로는 여기에 뒀어요. ' + (tried ? '다음엔 꼭 맞혀요!' : '잘 봐 두어요.'), null, false); hideQuiz(); await sleep(1600); if (rid !== runId) return; guessPlay();
}
async function guessPlay() {
  const rid = runId; hideQuiz(); await sleep(500); if (rid !== runId || !G) return; const m = G.mv[G.i], rec = game.play(m.x, m.y); if (rec) await animateRec(rec); if (rid !== runId) return;
  clearMarks(); if (rec) { marks.last.add(m.y * N + m.x); refreshMarkers(); } G.i++; guessNext();
}
function guessEnd() {
  if (!G) return; const g = G.g, a = G.asked, r = G.right; hideQuiz(); clearMarks(); const pct = a ? Math.round(r / a * 100) : 0;
  say(a ? a + '번 중 ' + r + '번 맞혔어요! (' + pct + '%, ' + G.pts + '점) ' + (pct >= 40 ? '눈이 좋아요!' : '프로의 수를 많이 봤으니 곧 늘어요.') : '다음에 또 해 봐요.', pct >= 40 ? 'good' : null, false); G.busy = true;
  guessPanel([{ t: '🔁 한 번 더', f: () => startGuess(g) }, { t: '📜 기보 목록', cls: 'go', f: () => { G = null; openKibo(); } }]);
}

/* ---------- 입력 ---------- */
function cellAt(clientX, clientY) {
  const p = S.planePoint(clientX, clientY, REST); if (!p) return -1; const gx = Math.round(p.x / SP + (N - 1) / 2), gy = Math.round(p.z / SP + (N - 1) / 2); if (gx < 0 || gy < 0 || gx >= N || gy >= N) return -1;
  if (Math.hypot(p.x - (gx - (N - 1) / 2) * SP, p.z - (gy - (N - 1) / 2) * SP) > SP * 0.7) return -1; return gy * N + gx;
}
S.onTap((x, y) => { const s = cellAt(x, y); if (s < 0) return; if (mode === 'learn') lessonTap(s); else if (mode === 'guess') guessTap(s); else if (mode === 'play' || mode === 'two') humanTap(s); });
S.wireButtons({ menu: () => openMenu(false) });
$('btnUndo').onclick = doUndo; $('btnHint').onclick = doHint; $('btnPass').onclick = doPass; $('btnTerr').onclick = toggleTerr; $('btnNext').onclick = nextPage; $('btnRetry').onclick = retryItem; $('btnList').onclick = () => { scriptRun++; if (lesson && lesson.kibo) openKibo(); else openCurriculum(); };
$('btnAssist').onclick = (e) => { assistOn = !assistOn; e.currentTarget.setAttribute('aria-pressed', assistOn); e.currentTarget.textContent = assistOn ? '🧭 알려주기' : '⬜ 알려주기 끔'; if (mode === 'play' || mode === 'two') coach(); };
S.setAlive(() => marks.ring.size || marks.danger.size || marks.safe.size || marks.atari.size || marks.warn.size);
S.onFrame((dt, t) => { const k = 1 + Math.sin(t * 5) * 0.1; markPool.forEach((m) => { if (m.visible && m.userData.pulse) m.scale.setScalar(m.userData.base * k); }); });

(async function boot() {
  try { await loadStones(); } catch (e) { S.failLoading('바둑돌 모델을 불러오지 못했어요.'); return; }
  buildBoard(9); newBoard(9); S.start(); S.setView(0, true, 0.62); S.hideLoading(); say('놀이를 골라 주세요.', null, false); updateButtons(); startWorker(); openMenu(true);
})();

/* 시험용 손잡이 */
window.__go = {
  game: () => game, mode: () => mode, over: () => over, busy: () => busy, scoring: () => scoring, prep: () => P, lesson: () => lesson, step: () => lessonStep, stoneCount: () => stones.size, n: () => N, dead: () => [...deadSet],
  tap: (s) => (mode === 'learn' ? lessonTap(s) : mode === 'guess' ? guessTap(s) : humanTap(s)), guessState: () => G, wrong: () => loadWrong(), answer: lessonAnswer, start: startGame, startLesson, openMenu, openCurriculum, nextPage, marks, finishScoring, progress,
  screen(s) { return S.screenOf(new THREE.Vector3(wx(s), REST, wz(s))); }
};
