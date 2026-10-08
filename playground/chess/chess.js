/* 옥쌤의 즐거운 교실 — 3D 체스 (놀이별 · 전략놀이)
   three.js(vendor/three) + 규칙 엔진(engine.js). 모드: 말 움직임 배우기 / 컴퓨터와 대국 / 둘이서 대국 */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from '../../vendor/three/addons/controls/OrbitControls.js';

const O = window.OKS, C = window.OKS_CHESS;
const $ = (id) => document.getElementById(id);
const NAMES = C.NAME;                       // ['', '폰', '나이트', '비숍', '룩', '퀸', '킹']
const GLB = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const SYMBOL = { 1: ['', '♙', '♘', '♗', '♖', '♕', '♔'], '-1': ['', '♟', '♞', '♝', '♜', '♛', '♚'] };
const HOW = ['', '앞으로 한 칸 가요. 처음에는 두 칸도 갈 수 있어요. 대각선 앞에 있는 상대 말을 잡아요.',
  'ㄱ자로 뛰어요. 다른 말을 뛰어넘을 수 있어요.', '대각선으로 쭉 가요.', '앞뒤 옆으로 곧게 쭉 가요.',
  '곧게도 대각선으로도 쭉 가요. 가장 힘이 세요.', '어느 쪽이든 한 칸씩 가요. 킹이 잡히면 져요.'];
const IGA = (t) => (t === 2 ? '가' : '이'), EULREUL = (t) => (t === 2 ? '를' : '을');
const FILEKO = ['에이', '비', '씨', '디', '이', '에프', '지', '에이치'], NUMKO = ['일', '이', '삼', '사', '오', '육', '칠', '팔'];
const spoken = (s) => FILEKO[s & 7] + ' ' + NUMKO[s >> 3];
const colorKo = (c) => (c > 0 ? '흰' : '검은');
const LEVEL_NAME = ['', '아주 쉬워요', '쉬워요', '보통', '어려워요', '아주 어려워요'];
const SIDE_Y = 0.06, SQ = 2;
const calm = () => { try { return !!O.settings().calm; } catch (e) { return false; } };

let keepUntil = 0;
const poke = (ms) => { keepUntil = Math.max(keepUntil, performance.now() + (ms || 400)); };
/* ---------- 장면 ---------- */
const canvas = $('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../">← 놀이별로</a></div>';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !calm(); renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x35507a);
scene.fog = new THREE.Fog(0x35507a, 60, 120);
const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 200);
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.12;
controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.38; controls.rotateSpeed = 0.7;
controls.target.set(0, 0.4, 0);
controls.addEventListener('change', () => poke(250));

scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7b92, 1.15));
const sun = new THREE.DirectionalLight(0xfff3dd, 2.4); sun.position.set(9, 20, 11);
sun.castShadow = !calm(); sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 4, far: 50 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.7); fill.position.set(-10, 8, -9); scene.add(fill);

// 탁자(바닥)
const table = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0x2f5a4c, roughness: 0.95 }));
table.rotation.x = -Math.PI / 2; table.position.y = -1.17; table.receiveShadow = true; scene.add(table);

const matW = new THREE.MeshPhysicalMaterial({ color: 0xe9dcc0, roughness: 0.38, clearcoat: 0.9, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
const matB = new THREE.MeshPhysicalMaterial({ color: 0x2b2420, roughness: 0.38, clearcoat: 0.9, clearcoatRoughness: 0.15, side: THREE.DoubleSide });

/* ---------- 불러오기 ---------- */
const proto = {};
const boardGroup = new THREE.Group(); scene.add(boardGroup);
async function loadAssets() {
  const L = new GLTFLoader();
  const [pg, bg] = await Promise.all([L.loadAsync('assets/pieces.glb'), L.loadAsync('assets/board.glb')]);
  pg.scene.traverse((o) => { if (o.isMesh) proto[o.name] = o; });
  bg.scene.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = o.name === 'Object_9'; } });
  boardGroup.add(bg.scene);
}

/* ---------- 칸 ↔ 3D 좌표 ---------- */
const sqX = (s) => ((s & 7) - 3.5) * SQ, sqZ = (s) => (3.5 - (s >> 3)) * SQ;
const sqVec = (s, y = SIDE_Y) => new THREE.Vector3(sqX(s), y, sqZ(s));

/* ---------- 말 ---------- */
const pieces = new Map();   // 칸 → Group
const pieceLayer = new THREE.Group(); scene.add(pieceLayer);
function makePiece(type, color) {
  const g = new THREE.Group();
  const m = proto[GLB[type]].clone();
  m.material = color > 0 ? matW : matB; m.castShadow = true; m.receiveShadow = true;
  if (type === 2 && color < 0) m.rotation.y = Math.PI;
  g.add(m); g.userData = { type, color, sq: -1 };
  pieceLayer.add(g); return g;
}
function putPiece(g, s) { g.userData.sq = s; g.position.copy(sqVec(s)); g.scale.setScalar(1); g.rotation.set(0, 0, 0); pieces.set(s, g); }
function clearPieces() { pieces.forEach((g) => pieceLayer.remove(g)); pieces.clear(); }
function syncBoard(board) {
  poke();
  clearPieces();
  for (let s = 0; s < 64; s++) { const v = board[s]; if (v) putPiece(makePiece(Math.abs(v), v > 0 ? 1 : -1), s); }
}

/* ---------- 표시(초록 점, 빨간 동그라미 …) ---------- */
const mk = { dot: [], ring: [], tile: [], last: [], hint: [] };
const mkLayer = new THREE.Group(); scene.add(mkLayer);
function mkMat(color, op) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }); }
const dotGeo = new THREE.CircleGeometry(0.36, 32), ringGeo = new THREE.RingGeometry(0.62, 0.92, 40), tileGeo = new THREE.PlaneGeometry(1.94, 1.94);
const dotMat = mkMat(0x2fdc6a, 0.9), ringMat = mkMat(0xff4a3d, 0.95), selMat = mkMat(0xffd23c, 0.55), lastMat = mkMat(0x4fb4ff, 0.38), chkMat = mkMat(0xff3b30, 0.6), hintMat = mkMat(0xffe44d, 0.75);
for (let s = 0; s < 64; s++) {
  const flat = (geo, mat, y, order) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(sqX(s), SIDE_Y + y, sqZ(s)); m.visible = false; m.renderOrder = order; mkLayer.add(m); return m; };
  mk.tile[s] = flat(tileGeo, selMat, 0.012, 1); mk.last[s] = flat(tileGeo, lastMat, 0.008, 1);
  mk.dot[s] = flat(dotGeo, dotMat, 0.03, 3); mk.ring[s] = flat(ringGeo, ringMat, 0.03, 3); mk.hint[s] = flat(tileGeo, hintMat, 0.016, 2);
}
const mkState = { selected: -1, targets: [], captures: [], last: [], check: -1, hint: [] };
let assistOn = true;
function refreshMarkers() {
  poke();
  for (let s = 0; s < 64; s++) { mk.dot[s].visible = mk.ring[s].visible = mk.tile[s].visible = mk.last[s].visible = mk.hint[s].visible = false; }
  mkState.last.forEach((s) => { mk.last[s].visible = true; });
  if (mkState.check >= 0) { mk.tile[mkState.check].material = chkMat; mk.tile[mkState.check].visible = true; }
  if (mkState.selected >= 0) { mk.tile[mkState.selected].material = selMat; mk.tile[mkState.selected].visible = true; }
  if (assistOn || mode === 'learn') {
    mkState.targets.forEach((s) => { mk.dot[s].visible = true; });
    mkState.captures.forEach((s) => { mk.ring[s].visible = true; });
  }
  mkState.hint.forEach((s) => { mk.hint[s].visible = true; });
}

/* ---------- 움직임(트윈) ---------- */
const tweens = [];
const ease = { io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), out: (t) => 1 - Math.pow(1 - t, 3), back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
function tween(ms, fn, e) {
  if (calm()) ms = Math.min(ms, 120);
  return new Promise((res) => { tweens.push({ t: 0, dur: Math.max(1, ms) / 1000, fn, res, e: e || ease.io }); });
}
function stepTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t += dt; const p = Math.min(1, w.t / w.dur); w.fn(w.e(p), p);
    if (p >= 1) { tweens.splice(i, 1); w.res(); }
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, calm() ? Math.min(ms, 80) : ms));

function pathBlocked(from, to, type) {
  if (type === 2) return true;
  const df = Math.sign((to & 7) - (from & 7)), dr = Math.sign((to >> 3) - (from >> 3));
  let f = (from & 7) + df, r = (from >> 3) + dr, n = 0;
  while ((f !== (to & 7) || r !== (to >> 3)) && n++ < 8) { if (pieces.has(r * 8 + f)) return true; f += df; r += dr; }
  return false;
}
async function hop(g, to, hopH) {
  const a = g.position.clone(), b = sqVec(to), dist = a.distanceTo(b);
  g.userData.sq = to;
  await tween(Math.min(900, 320 + dist * 55), (p) => {
    g.position.set(a.x + (b.x - a.x) * p, SIDE_Y + Math.sin(Math.PI * p) * hopH + (b.y - SIDE_Y) * p, a.z + (b.z - a.z) * p);
  });
  g.position.copy(b);
}
async function popOut(g) {
  await tween(380, (p) => { g.scale.setScalar(1 - p); g.rotation.y = p * 4; g.position.y = SIDE_Y - p * 0.6; }, ease.io);
  pieceLayer.remove(g);
}
async function popIn(g) { g.scale.setScalar(0.01); await tween(420, (p) => g.scale.setScalar(Math.max(0.01, p)), ease.back); g.scale.setScalar(1); }

/* 규칙 엔진이 돌려준 수(rec)를 3D 로 보여 줌. 이 시점에 game 은 이미 수를 둔 상태 */
async function animateMove(rec, mover) {
  const g = pieces.get(rec.from); if (!g) { syncBoard(game.board); return; }
  pieces.delete(rec.from);
  let victim = null;
  if (rec.ep) { const vs = rec.to - mover * 8; victim = pieces.get(vs); pieces.delete(vs); }
  else if (rec.captured) { victim = pieces.get(rec.to); pieces.delete(rec.to); }
  const h = pathBlocked(rec.from, rec.to, Math.abs(rec.piece)) ? (Math.abs(rec.piece) === 2 ? 2.6 : 3.4) : 0.9;
  const jobs = [hop(g, rec.to, h)];
  if (rec.castle) {
    const base = mover > 0 ? 0 : 56, rf = rec.castle === 1 ? base + 7 : base, rt = rec.castle === 1 ? base + 5 : base + 3;
    const rg = pieces.get(rf); pieces.delete(rf); if (rg) { jobs.push(hop(rg, rt, 1.2)); pieces.set(rt, rg); }
  }
  pieces.set(rec.to, g);
  await Promise.all(jobs);
  if (victim) { OKS_PIECE.place(); await popOut(victim); } else OKS_PIECE.place();
  if (rec.promo) {
    pieceLayer.remove(g); pieces.delete(rec.to);
    const ng = makePiece(Math.abs(rec.promo), mover); putPiece(ng, rec.to); await popIn(ng); O.sfx('win');
  }
}

/* ---------- 카메라 ---------- */
let viewColor = 1, camBusy = false;
let hudTop = 110, hudBot = 80;
function measureHud() {
  const h = window.innerHeight, m = $('msg').getBoundingClientRect(), b = document.querySelector('.ch-bottom').getBoundingClientRect();
  hudTop = Math.min(h * 0.4, Math.max(96, m.bottom + 6)); hudBot = Math.min(h * 0.3, Math.max(60, h - b.top + 4));
}
function applyViewOffset() {
  const w = window.innerWidth, h = window.innerHeight; measureHud();
  camera.setViewOffset(w, h, 0, -Math.round((hudTop - hudBot) / 2), w, h);
}
function fitDistance() {
  const w = window.innerWidth, h = window.innerHeight, avail = Math.max(200, h - hudTop - hudBot);
  return Math.max(23, 24 * (h / avail), 31 / (w / h)) + 2;
}
function applyCameraLimits() { const d = fitDistance(); controls.minDistance = d * 0.5; controls.maxDistance = d * 1.55; }
function camPos(az, pol, r) { return new THREE.Vector3(Math.sin(az) * Math.sin(pol) * r, Math.cos(pol) * r + controls.target.y, Math.cos(az) * Math.sin(pol) * r); }
async function setView(color, instant) {
  viewColor = color; const az = color > 0 ? 0 : Math.PI, pol = 0.78, r = fitDistance();
  if (instant || calm()) { camera.position.copy(camPos(az, pol, r)); controls.update(); return; }
  camBusy = true;
  let a0 = controls.getAzimuthalAngle(), p0 = controls.getPolarAngle(), r0 = controls.getDistance();
  let d = az - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  await tween(900, (p) => { camera.position.copy(camPos(a0 + d * p, p0 + (pol - p0) * p, r0 + (r - r0) * p)); camera.lookAt(controls.target); });
  controls.update(); camBusy = false;
}
function resize() {
  poke();
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; applyViewOffset(); camera.updateProjectionMatrix(); applyCameraLimits();
}
window.addEventListener('resize', resize);

/* ---------- 말풍선(안내 글) ---------- */
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) {
  msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : '');
  if (renderer) { const b0 = hudTop; measureHud(); if (Math.abs(b0 - hudTop) > 14) { applyViewOffset(); camera.updateProjectionMatrix(); poke(); } }
  if (speak !== false) O.say(typeof speak === 'string' ? speak : text);
}
function note(text, kind) { say(text, kind, false); }

/* ---------- 상태 ---------- */
let game = new C.Game(), mode = null, level = 3, myColor = 1, busy = false, over = false, stats = O.newStats();
let selected = -1, legal = [], lastHint = null, worker = null, workerId = 0;
const LESSON = 'play-chess', LEARN_LESSON = 'play-chess-learn';

function isHumanTurn() { return mode === 'two' || (mode === 'play' && game.turn === myColor); }
function missingPieces() {
  const start = [0, 8, 2, 2, 2, 1, 1], have = { 1: start.slice().fill(0), '-1': start.slice().fill(0) };
  for (let s = 0; s < 64; s++) { const v = game.board[s]; if (v) have[v > 0 ? 1 : -1][Math.abs(v)]++; }
  const out = { 1: [], '-1': [] };
  [1, -1].forEach((c) => { for (let t = 5; t >= 1; t--) { for (let i = have[c][t]; i < start[t]; i++) out[c].push(SYMBOL[c][t]); } });
  return out;
}
function updateTrays() {
  if (mode === 'learn') { $('capW').innerHTML = $('capB').innerHTML = ''; return; }
  const m = missingPieces();
  $('capW').innerHTML = m[1].map((x) => '<span>' + x + '</span>').join(''); $('capB').innerHTML = m[-1].map((x) => '<span>' + x + '</span>').join('');
}
function updateButtons() {
  const play = mode === 'play' || mode === 'two';
  $('btnUndo').disabled = busy || !(play && game.stack.length > (mode === 'play' && myColor < 0 ? 1 : 0)) || over;
  $('btnHint').disabled = busy || over || !(mode === 'learn' || isHumanTurn());
  $('btnUndo').hidden = mode === 'learn';
}

/* ---------- 선택 · 이동 ---------- */
function clearSelection() { selected = -1; legal = []; mkState.selected = -1; mkState.targets = []; mkState.captures = []; mkState.hint = []; refreshMarkers(); }
let liftTween = null;
function select(sq) {
  selected = sq; legal = game.movesFrom(sq);
  mkState.selected = sq; mkState.hint = [];
  mkState.targets = []; mkState.captures = [];
  legal.forEach((m) => { if (m.captured) { if (mkState.captures.indexOf(m.to) < 0) mkState.captures.push(m.to); } else if (mkState.targets.indexOf(m.to) < 0) mkState.targets.push(m.to); });
  refreshMarkers(); O.sfx('tick');
  const t = Math.abs(game.board[sq]);
  if (!legal.length) note(NAMES[t] + '은 지금 갈 곳이 없어요. 다른 말을 눌러 보세요.', 'warn');
  else note(colorKo(game.turn) + ' ' + NAMES[t] + ' · ' + HOW[t].split('.')[0] + '.');
  if (O.settings().explain !== false && level <= 3) O.say(NAMES[t] + IGA(t) + '에요. ' + HOW[t]);
}
function tapSquare(sq) {
  if (busy || over || !mode) return;
  O.unlock();
  if (mode === 'learn') return learnTap(sq);
  if (!isHumanTurn()) return;
  const v = game.board[sq];
  if (v && v * game.turn > 0) { if (sq === selected) { clearSelection(); note('말을 눌러 보세요.'); } else select(sq); return; }
  if (selected < 0) { if (!v) note('움직일 내 말을 눌러 보세요.'); return; }
  const cand = legal.filter((m) => m.to === sq);
  if (!cand.length) { stats.mistakes++; O.sfx('no'); say('거기로는 갈 수 없어요. 초록 점이나 빨간 동그라미로 가 보세요.', 'warn', false); return; }
  if (cand.length > 1) return askPromotion(cand);
  humanMove(cand[0]);
}
function askPromotion(cand) {
  const box = $('promoBtns'); box.innerHTML = '';
  const col = game.turn;
  [5, 4, 3, 2].forEach((t) => {
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i>' + SYMBOL[col > 0 ? 1 : '-1'][t] + '</i>' + NAMES[t];
    b.onclick = () => { $('promo').hidden = true; humanMove(cand.filter((m) => Math.abs(m.promo) === t)[0]); };
    box.appendChild(b);
  });
  $('promo').hidden = false; O.say('폰이 끝까지 왔어요! 어떤 말로 바꿀까요?');
}
async function humanMove(m) {
  const mover = game.turn, rec = game.move(m.from, m.to, Math.abs(m.promo || 0) || undefined);
  if (!rec) return;
  clearSelection(); await playRec(rec, mover, true);
}
async function playRec(rec, mover, human) {
  busy = true; updateButtons();
  await animateMove(rec, mover);
  mkState.last = [rec.from, rec.to]; busy = false;
  afterMove(rec, mover, human);
}
function describe(rec, mover) {
  const t = Math.abs(rec.piece);
  let s = colorKo(mover) + ' ' + NAMES[t] + IGA(t) + ' ' + C.sqName(rec.to) + '(으)로 갔어요.';
  if (rec.castle) s = colorKo(mover) + ' 킹이 룩과 함께 자리를 바꿨어요. (캐슬링)';
  else if (rec.captured) s = colorKo(mover) + ' ' + NAMES[t] + IGA(t) + ' ' + NAMES[Math.abs(rec.captured)] + EULREUL(Math.abs(rec.captured)) + ' 잡았어요!';
  if (rec.promo) s += ' ' + NAMES[Math.abs(rec.promo)] + '으로 바뀌었어요!';
  return s;
}
function afterMove(rec, mover, human) {
  updateTrays();
  const st = game.status(); mkState.check = -1;
  if (st === 'check' || st === 'checkmate') { mkState.check = game.kingSq[game.turn > 0 ? 1 : 2]; }
  refreshMarkers(); updateButtons();
  const spoken = describe(rec, mover);
  if (st === 'checkmate') { say(spoken + ' 체크메이트!', 'good', false); return endGame('checkmate', mover); }
  if (st.indexOf('draw') === 0 || st === 'stalemate') { say(spoken, null, false); return endGame(st, 0); }
  if (st === 'check') say(spoken + ' 체크예요! ' + (game.turn === myColor || mode === 'two' ? '킹을 지켜요.' : '상대 킹이 위험해요.'), 'warn', spoken + ' 체크예요!');
  else if (human || mode === 'two') say(spoken + (mode === 'play' ? ' 컴퓨터 차례예요.' : ' ' + colorKo(game.turn) + ' 말 차례예요.'), null, rec.captured || rec.castle || rec.promo ? spoken : false);
  else say(spoken + ' 이제 내 차례예요.', null, spoken);
  if (mode === 'play' && game.turn !== myColor && !over) aiTurn();
}

/* ---------- 컴퓨터 ---------- */
function startWorker() {
  if (worker) return;
  try { worker = new Worker('ai-worker.js'); } catch (e) { worker = null; }
}
function askAI(kind) {
  return new Promise((resolve) => {
    const id = ++workerId, fen = game.fen();
    const fallback = () => { const g = new C.Game(fen); const m = kind === 'hint' ? C.ai.hint(g) : C.ai.choose(g, level); resolve(m ? { from: m.from, to: m.to, promo: Math.abs(m.promo || 0) } : null); };
    if (!worker) return setTimeout(fallback, 40);
    const done = (e) => { if (e.data.id !== id) return; worker.removeEventListener('message', done); clearTimeout(to); resolve(e.data.move); };
    const to = setTimeout(() => { worker.removeEventListener('message', done); fallback(); }, 9000);
    worker.addEventListener('message', done); worker.postMessage({ id, fen, level, kind });
  });
}
async function aiTurn() {
  busy = true; updateButtons(); note('컴퓨터가 생각하고 있어요…');
  const t0 = Date.now(), pick = await askAI('move');
  await sleep(Math.max(0, 700 - (Date.now() - t0)));
  if (over || mode !== 'play') { busy = false; return; }
  if (!pick) { busy = false; return; }
  const mover = game.turn, rec = game.move(pick.from, pick.to, pick.promo || undefined);
  busy = false; if (rec) await playRec(rec, mover, false);
}

/* ---------- 힌트 · 되돌리기 ---------- */
async function doHint() {
  if (busy || over) return; O.unlock(); stats.asked++;
  if (mode === 'learn') return learnHint();
  busy = true; updateButtons(); note('좋은 수를 찾는 중이에요…');
  const m = await askAI('hint'); busy = false; updateButtons();
  if (!m) return;
  clearSelection(); mkState.hint = [m.from, m.to]; refreshMarkers();
  const t = Math.abs(game.board[m.from]);
  say(NAMES[t] + EULREUL(t) + ' ' + C.sqName(m.to) + '(으)로 옮겨 볼까요? 노란 칸을 보세요.', 'good', NAMES[t] + EULREUL(t) + ' 노란 칸으로 옮겨 볼까요?');
  clearTimeout(lastHint); lastHint = setTimeout(() => { mkState.hint = []; refreshMarkers(); }, 6000);
}
async function doUndo() {
  if (busy || over || !(mode === 'play' || mode === 'two')) return;
  let n = 0;
  do { if (!game.undo()) break; n++; } while (mode === 'play' && game.turn !== myColor && game.stack.length);
  if (!n) return;
  clearSelection(); syncBoard(game.board); const l = game.last();
  mkState.last = l ? [l.from, l.to] : []; mkState.check = game.inCheck() ? game.kingSq[game.turn > 0 ? 1 : 2] : -1;
  refreshMarkers(); updateTrays(); updateButtons(); O.sfx('tick'); say('한 수 물렸어요. 다시 해 보세요!', null, '한 수 물렸어요.');
}

/* ---------- 끝났을 때 ---------- */
let runId = 0;
function endGame(kind, winner) {
  const rid = runId; over = true; updateButtons();
  let title, text, stars, speak;
  if (kind === 'checkmate') {
    const humanWon = mode === 'two' || winner === myColor;
    title = mode === 'two' ? colorKo(winner) + ' 말이 이겼어요!' : humanWon ? '체크메이트! 이겼어요!' : '아쉬워요. 다음엔 이길 수 있어요!';
    text = '상대 킹이 도망갈 곳이 없어요.'; stars = humanWon ? 3 : 1; speak = humanWon ? '체크메이트! 정말 잘했어요!' : '아쉽지만 끝까지 잘했어요. 한 번 더 해 볼까요?';
  } else {
    const why = { stalemate: '움직일 수 있는 수가 없어서 비겼어요.', 'draw-50': '오랫동안 변화가 없어서 비겼어요.', 'draw-repeat': '같은 모양이 세 번 나와서 비겼어요.', 'draw-material': '말이 모자라서 비겼어요.' };
    title = '비겼어요!'; text = why[kind] || '비겼어요.'; stars = 2; speak = title + ' ' + text;
  }
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(체스)', school: 'elem', topic: '3D 체스', level: mode === 'play' ? level : 1, engine: 'chess',
    rounds: Math.ceil(game.stack.length / 2), mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: () => startGame({ mode, level, color: mode === 'play' ? myColor : 1 }) }];
  if (mode === 'play' && stars === 3 && level < 5) btns.push({ label: '⬆ 다음 수준 (' + (level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, level + 1); startGame({ mode, level: level + 1, color: myColor }); } });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 900);
}

/* ---------- 새 대국 ---------- */
function resetState() {
  over = false; busy = false; selected = -1; legal = []; clearTimeout(lastHint);
  Object.assign(mkState, { selected: -1, targets: [], captures: [], last: [], check: -1, hint: [] });
  clearLearn(); stats = O.newStats(); tweens.length = 0;
}
function startGame(cfg) {
  runId++;
  resetState(); mode = cfg.mode; level = cfg.level || 3; myColor = cfg.color || 1;
  if (mode === 'play') O.rememberLevel(LESSON, level);
  game = new C.Game(); syncBoard(game.board); refreshMarkers(); updateTrays();
  $('menu').hidden = true; $('modeLabel').textContent = mode === 'play' ? '컴퓨터와 대국 · 수준 ' + level : '둘이서 대국';
  setView(mode === 'play' ? myColor : 1, true); updateButtons(); startWorker();
  if (mode === 'play') {
    if (myColor > 0) say('내가 흰 말이에요. 먼저 시작해요! 말을 눌러 보세요.', null, '내가 흰 말이에요. 먼저 시작해요. 말을 눌러 보세요.');
    else { say('내가 검은 말이에요. 컴퓨터가 먼저 시작해요.'); aiTurn(); }
  } else say('흰 말부터 시작해요. 번갈아 한 번씩 움직여요.');
}

/* ---------- 말 움직임 배우기 ---------- */
const LEARN_ORDER = [4, 3, 5, 2, 6, 1];
const learn = { type: 4, g: null, stars: new Map(), enemies: 0, total: 0, got: 0, pos: -1 };
function clearLearn() { learn.stars.forEach((m) => scene.remove(m)); learn.stars.clear(); learn.g = null; learn.got = 0; }
let starGeo = null;
function makeStar() {
  if (!starGeo) {
    const sh = new THREE.Shape(), R = 0.62, r = 0.28;
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * rr, Math.sin(a) * rr); }
    starGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
    starGeo.center();
  }
  const m = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffd23c, emissive: 0xffa800, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2 }));
  m.castShadow = true; return m;
}
function buildLearn(type, lv) {
  const total = [0, 3, 4, 5, 6, 7][lv], g = new C.Game('8/8/8/8/8/8/8/8 w - - 0 1'); g.free = true;
  const rnd = (n) => (Math.random() * n) | 0;
  let start = type === 1 ? 8 + rnd(8) : (2 + rnd(4)) * 8 + 2 + rnd(4);
  if (type === 6) start = (2 + rnd(4)) * 8 + 2 + rnd(4);
  const sim = new C.Game('8/8/8/8/8/8/8/8 w - - 0 1'); sim.free = true;
  const targets = [], enemies = [];
  let cur = start;
  for (let i = 0; i < total; i++) {
    sim.board.fill(0); sim.board[cur] = type; sim.ep = -1;
    let moves = sim.moves(); if (!moves.length) break;
    let pickSq;
    if (type === 1) {
      const r = cur >> 3; if (r >= 6) break;
      if (r <= 4 && Math.random() < 0.45) {                       // 대각선 앞의 상대 말을 잡는 연습
        const f = cur & 7, opts = [f - 1, f + 1].filter((x) => x >= 0 && x < 8); const ef = opts[rnd(opts.length)];
        pickSq = (r + 1) * 8 + ef; enemies.push(pickSq);
      } else pickSq = moves.filter((m) => !m.captured).map((m) => m.to).sort((a, b) => a - b)[Math.random() < 0.3 ? 1 : 0] ?? moves[0].to;
    } else {
      let cand = moves.map((m) => m.to).filter((s) => targets.indexOf(s) < 0 && s !== start);
      if (lv >= 4 && cand.length) {                               // 높은 수준: 두 번에 가야 하는 곳
        const far = []; cand.forEach((s) => { sim.board.fill(0); sim.board[s] = type; sim.moves().forEach((m) => { if (cand.indexOf(m.to) < 0 && m.to !== cur && targets.indexOf(m.to) < 0) far.push(m.to); }); });
        if (far.length) cand = far;
      }
      if (!cand.length) break; pickSq = cand[rnd(cand.length)];
    }
    if (type === 1 && pickSq === undefined) break;
    targets.push(pickSq); cur = pickSq;
  }
  return { start, targets, enemies };
}
function startLearn(cfg) {
  runId++;
  resetState(); mode = 'learn'; level = cfg.level || 2; learn.type = cfg.piece || 4;
  $('menu').hidden = true; $('modeLabel').textContent = '말 움직임 배우기 · ' + NAMES[learn.type];
  O.rememberLevel(LEARN_LESSON, level);
  let sc; do { sc = buildLearn(learn.type, level); } while (sc.targets.length < 2);
  const g = new C.Game('8/8/8/8/8/8/8/8 w - - 0 1'); g.free = true; g.board[sc.start] = learn.type; learn.g = g;
  sc.enemies.forEach((s) => { g.board[s] = -1; });
  syncBoard(g.board); game = g;                                    // 화면 규칙 엔진을 연습판으로 교체
  const targetsStar = sc.targets.filter((s) => sc.enemies.indexOf(s) < 0);
  targetsStar.forEach((s) => { const st = makeStar(); st.position.copy(sqVec(s, 1.0)); st.userData.sq = s; scene.add(st); learn.stars.set(s, st); });
  learn.total = sc.targets.length; learn.got = 0; learn.pos = sc.start;
  setView(1, true); refreshMarkers(); updateTrays(); updateButtons(); $('capW').innerHTML = $('capB').innerHTML = '';
  const t = learn.type;
  say(NAMES[t] + IGA(t) + '에요. ' + HOW[t] + (sc.enemies.length ? ' 별과 상대 폰을 모두 모아요!' : ' 별을 모두 모아 보세요!'), null, NAMES[t] + IGA(t) + '에요. ' + HOW[t] + ' 별을 모아 보세요!');
}
function learnTap(sq) {
  const v = game.board[sq];
  if (v > 0) { if (sq === selected) return clearSelection(); selected = sq; legal = game.movesFrom(sq); mkState.selected = sq; mkState.hint = []; mkState.targets = legal.filter((m) => !m.captured).map((m) => m.to); mkState.captures = legal.filter((m) => m.captured).map((m) => m.to); refreshMarkers(); O.sfx('tick'); return; }
  if (selected < 0) { note('먼저 ' + NAMES[learn.type] + EULREUL(learn.type) + ' 눌러 보세요.'); return; }
  const m = legal.filter((x) => x.to === sq)[0];
  if (!m) { stats.mistakes++; O.sfx('no'); say(NAMES[learn.type] + IGA(learn.type) + ' 갈 수 있는 곳은 초록 점이에요.', 'warn', NAMES[learn.type] + IGA(learn.type) + ' 갈 수 있는 곳은 초록 점이에요.'); return; }
  learnMove(m);
}
async function learnMove(m) {
  busy = true; updateButtons(); const from = m.from; clearSelection();
  const g = pieces.get(from); pieces.delete(from); let victim = null;
  if (m.captured) { victim = pieces.get(m.to); pieces.delete(m.to); }
  game.board[from] = 0; game.board[m.to] = m.piece; learn.pos = m.to; pieces.set(m.to, g);
  await hop(g, m.to, pathBlocked(from, m.to, Math.abs(m.piece)) ? 2.6 : 0.9);
  if (victim) { OKS_PIECE.place(); await popOut(victim); learn.got++; } else OKS_PIECE.place();
  const star = learn.stars.get(m.to);
  if (star) { learn.stars.delete(m.to); learn.got++; O.sfx('coin'); await tween(300, (p) => { star.scale.setScalar(1 + p * 0.6); star.position.y = 1 + p * 1.6; star.rotation.y += 0.4; }); scene.remove(star); }
  busy = false; updateButtons();
  const left = learn.total - learn.got;
  if (left <= 0) return learnDone();
  say('잘했어요! 남은 별은 ' + left + '개예요.', 'good', '잘했어요! 남은 별은 ' + left + '개예요.');
}
function learnDone() {
  const rid = runId; over = true; const t = learn.type, idx = LEARN_ORDER.indexOf(t), next = LEARN_ORDER[(idx + 1) % LEARN_ORDER.length];
  const stars = stats.mistakes <= 1 ? 3 : stats.mistakes <= 4 ? 2 : 1;
  const entry = { at: new Date().toISOString(), lesson: LEARN_LESSON, subject: 'play', subjectName: '놀이(체스)', school: 'elem', topic: '체스 말 움직임: ' + NAMES[t], level, engine: 'chess-learn',
    rounds: learn.total, mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: () => startLearn({ piece: t, level }) },
    { label: '➡ ' + NAMES[next] + ' 배우기', color: 'orange', onClick: () => startLearn({ piece: next, level }) }];
  if (level < 5) btns.push({ label: '⬆ 더 어렵게', color: 'purple', onClick: () => startLearn({ piece: t, level: level + 1 }) });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title: NAMES[t] + ' 움직임을 잘 알아요!', text: '별 ' + learn.total + '개를 모았어요 · ' + LEVEL_NAME[level], speak: '별을 다 모았어요! ' + NAMES[t] + IGA(t) + ' 움직이는 법을 알았어요!', mission: { lesson: 1 }, buttons: btns }); }, 500);
}
function learnHint() {
  const startSq = learn.pos, goals = [...learn.stars.keys()];
  game.board.forEach((v, s) => { if (v < 0) goals.push(s); });
  if (!goals.length) return;
  const tmp = new C.Game('8/8/8/8/8/8/8/8 w - - 0 1'); tmp.free = true;
  const movesFrom = (sq) => { tmp.board.set(game.board); tmp.board[learn.pos] = 0; tmp.board[sq] = learn.type; return tmp.movesFrom(sq).map((m) => m.to); };
  const prev = new Map([[startSq, -1]]), q = [startSq]; let hit = -1;
  while (q.length && hit < 0) { const s = q.shift(); for (const t of movesFrom(s)) { if (prev.has(t)) continue; prev.set(t, s); if (goals.indexOf(t) >= 0) { hit = t; break; } q.push(t); } }
  if (hit < 0) return note('이 말로는 더 갈 수 있는 별이 없어요.');
  let step = hit; while (prev.get(step) !== startSq && prev.get(step) !== -1) step = prev.get(step);
  clearSelection(); mkState.hint = [startSq, step]; refreshMarkers();
  say('노란 칸으로 옮겨 보세요!', 'good', '노란 칸으로 옮겨 보세요!');
  clearTimeout(lastHint); lastHint = setTimeout(() => { mkState.hint = []; refreshMarkers(); }, 6000);
}

/* ---------- 메뉴 ---------- */
const prefs = (() => { try { return Object.assign({ mode: 'learn', color: 1, piece: 4 }, JSON.parse(localStorage.getItem('oks_chess_prefs_v1') || '{}')); } catch (e) { return { mode: 'learn', color: 1, piece: 4 }; } })();
function savePrefs() { try { localStorage.setItem('oks_chess_prefs_v1', JSON.stringify(prefs)); } catch (e) {} }
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  const sel = { mode: prefs.mode, color: prefs.color, piece: prefs.piece, playLv: O.levelFor(LESSON), learnLv: O.levelFor(LEARN_LESSON) };
  const chip = (cls, val, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + cls + '="' + val + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    const modes = [['learn', '🎓', '말 움직임 배우기', '별을 모으며 익혀요'], ['play', '🤖', '컴퓨터와 대국', '수준을 골라요'], ['two', '👫', '둘이서 대국', '친구와 번갈아']];
    let opt = '';
    if (sel.mode === 'learn') {
      opt = '<div class="ch-row"><label>배울 말</label>' + LEARN_ORDER.map((t) => chip('piece', t, SYMBOL[1][t] + ' ' + NAMES[t], '', sel.piece === t)).join('') + '</div>' +
        '<div class="ch-row"><label>별 개수</label>' + [1, 2, 3, 4, 5].map((l) => chip('llv', l, l, ['3개', '4개', '5개', '6개', '7개'][l - 1], sel.learnLv === l)).join('') + '</div>';
    } else if (sel.mode === 'play') {
      opt = '<div class="ch-row"><label>컴퓨터 수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('plv', l, l, LEVEL_NAME[l], sel.playLv === l)).join('') + '</div>' +
        '<div class="ch-row"><label>내 말</label>' + chip('color', 1, '⚪ 흰 말', '먼저 시작', sel.color === 1) + chip('color', -1, '⚫ 검은 말', '나중에', sel.color === -1) + '</div>';
    }
    el.innerHTML = '<div class="ch-card"><h1>♟️ 3D 체스</h1><p>말을 눌러 움직이는 체스예요.</p><div class="ch-modes">' +
      modes.map((m) => '<button type="button" class="ch-mode' + (sel.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '"><i>' + m[1] + '</i><b>' + m[2] + '</b><span>' + m[3] + '</span></button>').join('') + '</div>' + opt +
      '<button type="button" class="ch-go" id="goBtn">시작!</button>' + (game && mode && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { sel.mode = b.dataset.mode; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-piece]').forEach((b) => { b.onclick = () => { sel.piece = +b.dataset.piece; render(); }; });
    el.querySelectorAll('[data-llv]').forEach((b) => { b.onclick = () => { sel.learnLv = +b.dataset.llv; render(); }; });
    el.querySelectorAll('[data-plv]').forEach((b) => { b.onclick = () => { sel.playLv = +b.dataset.plv; render(); }; });
    el.querySelectorAll('[data-color]').forEach((b) => { b.onclick = () => { sel.color = +b.dataset.color; render(); }; });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => {
      O.unlock(); prefs.mode = sel.mode; prefs.color = sel.color; prefs.piece = sel.piece; savePrefs(); el.hidden = true;
      if (sel.mode === 'learn') startLearn({ piece: sel.piece, level: sel.learnLv });
      else startGame({ mode: sel.mode, level: sel.playLv, color: sel.color });
    };
  }
  render(); O.say('3D 체스예요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 입력(탭으로 말·칸 고르기) ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SIDE_Y);
function pickSquare(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const sh = ray.intersectObjects([...learn.stars.values()], false);
  if (sh.length && !ray.intersectObjects(pieceLayer.children, true).length) return sh[0].object.userData.sq;
  const hits = ray.intersectObjects(pieceLayer.children, true);
  if (hits.length) { let o = hits[0].object; while (o && !(o.userData && o.userData.sq >= 0 && o.parent === pieceLayer)) o = o.parent; if (o) return o.userData.sq; }
  const p = new THREE.Vector3();
  if (ray.ray.intersectPlane(floor, p)) {
    const f = Math.floor(p.x / SQ + 4), rk = Math.floor(4 - p.z / SQ);
    if (f >= 0 && f < 8 && rk >= 0 && rk < 8) return rk * 8 + f;
  }
  return -1;
}
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || e.pointerId !== down.id) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
  if (moved > 10 || dt > 700) return;
  const sq = pickSquare(e.clientX, e.clientY); if (sq >= 0) tapSquare(sq);
});
canvas.addEventListener('pointercancel', () => { down = null; });

/* ---------- 버튼 ---------- */
$('btnUndo').onclick = doUndo; $('btnHint').onclick = doHint;
$('btnView').onclick = () => { O.unlock(); if (!camBusy) setView(-viewColor); };
$('btnMenu').onclick = () => openMenu(false);
$('btnHelp').onclick = () => { O.unlock(); const d = $('helpDialog'); if (d.showModal) d.showModal(); };
$('btnLock').onclick = (e) => { const lock = controls.enableRotate; controls.enableRotate = !lock; controls.enableZoom = !lock; const b = e.currentTarget; b.setAttribute('aria-pressed', lock); b.textContent = lock ? '🔒 화면 고정됨' : '🔓 화면 돌리기'; note(lock ? '화면을 고정했어요. 손가락으로 돌아가지 않아요.' : '화면을 돌려 볼 수 있어요.'); };
$('btnAssist').onclick = (e) => { assistOn = !assistOn; e.currentTarget.setAttribute('aria-pressed', assistOn); e.currentTarget.textContent = assistOn ? '✅ 갈 수 있는 칸 보기' : '⬜ 갈 수 있는 칸 숨김'; refreshMarkers(); };
(function voice() {
  const b = $('btnVoice'); const show = () => { const on = O.settings().voice; b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on); };
  b.onclick = () => { const on = !O.settings().voice; O.saveSetting('voice', on); O.saveSetting('explain', on); if (!on) O.hush(); show(); O.unlock(); if (on) O.say('안내 음성을 켰어요.'); else O.sfx('tick'); };
  show();
})();

/* ---------- 그리기 ---------- */
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000), t = now / 1000; lastT = now;
  stepTweens(dt); controls.update();
  const active = tweens.length || selected >= 0 || mkState.hint.length || mkState.targets.length || mkState.captures.length || learn.stars.size || now < keepUntil;
  if (!active) return requestAnimationFrame(frame);
  const pulse = 1 + Math.sin(t * 5) * 0.12;
  for (let s = 0; s < 64; s++) { if (mk.dot[s].visible) mk.dot[s].scale.setScalar(pulse); if (mk.ring[s].visible) mk.ring[s].scale.setScalar(1 + Math.sin(t * 5) * 0.07); if (mk.hint[s].visible) mk.hint[s].material.opacity = 0.45 + Math.sin(t * 6) * 0.3; }
  learn.stars.forEach((m) => { m.rotation.y = t * 1.6; m.position.y = 1.0 + Math.sin(t * 2.4 + m.userData.sq) * 0.14; });
  if (!busy) pieces.forEach((g, s) => { g.position.y = s === selected ? SIDE_Y + 0.22 + Math.sin(t * 4) * 0.05 : SIDE_Y; });
  renderer.render(scene, camera); requestAnimationFrame(frame);
}

/* ---------- 시작 ---------- */
(async function boot() {
  resize();
  try { await loadAssets(); } catch (e) { $('loading').innerHTML = '<div><p>3D 체스 파일을 불러오지 못했어요.<br>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="ch-btn" href="../">← 놀이별로</a></div>'; throw e; }
  syncBoard(game.board); setView(1, true); requestAnimationFrame(frame);
  $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
  say('놀이를 골라 주세요.', null, false); updateButtons(); openMenu(true);
})();

/* 시험용 손잡이: 브라우저 시험이 실제 탭처럼 칸을 누를 수 있게 함 */
window.__chess = {
  game: () => game, mode: () => mode, over: () => over, busy: () => busy, learn,
  tap: tapSquare, start: startGame, startLearn,
  load(fen) { game.load(fen); syncBoard(game.board); clearSelection(); updateTrays(); updateButtons(); },
  screen(sq, y) { const v = sqVec(sq, y == null ? 0.8 : y).project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
  hintSq: () => mkState.hint.slice(), pieceCount: () => pieces.size, starCount: () => learn.stars.size
};
