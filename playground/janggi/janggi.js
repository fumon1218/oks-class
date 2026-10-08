/* 옥쌤의 즐거운 교실 — 3D 장기 (놀이별 · 전략놀이)
   three.js(vendor/three) + 규칙 엔진(engine.js). 말·판은 코드로 그립니다. 모드: 말 움직임 배우기 / 컴퓨터와 대국 / 둘이서 대국 */
import * as THREE from '../../vendor/three/three.module.js';
import { OrbitControls } from '../../vendor/three/addons/controls/OrbitControls.js';

const O = window.OKS, J = window.OKS_JANGGI;
const $ = (id) => document.getElementById(id);
const calm = () => { try { return !!O.settings().calm; } catch (e) { return false; } };
const LESSON = 'play-janggi', LEARN_LESSON = 'play-janggi-learn';
const NAMES = J.NAME;                                   // ['', '졸', '마', '상', '차', '포', '사', '궁']
const nameOf = (t, color) => (t === 1 && color < 0 ? '병' : NAMES[t]);
const HANJA = { 1: ['', '卒', '馬', '象', '車', '包', '士', '楚'], '-1': ['', '兵', '馬', '象', '車', '包', '士', '漢'] };
const FONT = "'Noto Serif KR','Noto Serif CJK KR','Noto Serif CJK SC','Nanum Myeongjo','AppleMyungjo','Songti SC','PMingLiU','serif'";
const HOW = ['', '앞이나 옆으로 한 칸 가요. 뒤로는 못 가요.', '앞으로 한 칸, 그다음 비스듬히 한 칸 가요. 앞이 막히면 못 가요.',
  '앞으로 한 칸, 그다음 비스듬히 두 칸 가요. 길이 막히면 못 가요.', '줄을 따라 쭉 가요. 궁성 안 대각선도 쓸 수 있어요.',
  '다른 말 하나를 넘어서 쭉 가요. 포는 포를 못 넘고 못 잡아요.', '궁성 안에서 줄을 따라 한 칸 가요.', '궁성 안에서 줄을 따라 한 칸 가요. 궁이 잡히면 져요.'];
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0 ? a : b; };
const IGA = (w) => josa(w, '이', '가'), EULREUL = (w) => josa(w, '을', '를'), EUNNEUN = (w) => josa(w, '은', '는');
const sideKo = (c) => (c > 0 ? '초' : '한');
const LEVEL_NAME = ['', '아주 쉬워요', '쉬워요', '보통', '어려워요', '아주 어려워요'];
const SETUP_KO = J.SETUP_KO, SETUP_KEYS = ['inner', 'outer', 'left', 'right'];
const SIDE_Y = 0.3, SP = 2;                            // 판 윗면 높이, 점 사이 간격
const sqX = (s) => ((s % 9) - 4) * SP, sqZ = (s) => (4.5 - ((s / 9) | 0)) * SP;
const sqVec = (s, y = SIDE_Y) => new THREE.Vector3(sqX(s), y, sqZ(s));
const sqName = (s) => (1 + (s % 9)) + '번째 칸, ' + (1 + ((s / 9) | 0)) + '번째 줄';

let keepUntil = 0;
const poke = (ms) => { keepUntil = Math.max(keepUntil, performance.now() + (ms || 400)); };
/* ---------- 장면 ---------- */
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
catch (e) { $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../">← 놀이별로</a></div>'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !calm(); renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x5b4a30); scene.fog = new THREE.Fog(0x5b4a30, 70, 130);
const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 220);
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.12;
controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.38; controls.rotateSpeed = 0.7; controls.target.set(0, 0.4, 0);
controls.addEventListener('change', () => poke(250));
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7550, 1.2));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.3); sun.position.set(10, 22, 12); sun.castShadow = !calm(); sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 4, far: 60 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun);
const fill = new THREE.DirectionalLight(0xffe2b8, 0.6); fill.position.set(-10, 8, -9); scene.add(fill);
const table = new THREE.Mesh(new THREE.CircleGeometry(70, 64), new THREE.MeshStandardMaterial({ color: 0x3b4f3f, roughness: 0.95 }));
table.rotation.x = -Math.PI / 2; table.position.y = -0.62; table.receiveShadow = true; scene.add(table);

/* ---------- 판과 말 그림 (코드로 그려요) ---------- */
function woodCanvas(w, h, base, grain) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 260; i++) { const y = rnd() * h, a = 0.025 + rnd() * 0.06; x.strokeStyle = (rnd() < 0.5 ? 'rgba(90,55,20,' : 'rgba(255,225,170,') + a + ')'; x.lineWidth = 1 + rnd() * 3; x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= w; px += 64) x.lineTo(px, y + Math.sin(px * 0.01 + i) * 6 * rnd()); x.stroke(); }
  return c;
}
function boardTexture() {
  const W = 1100, H = 1210, k = 55;                       // 1유닛 = 55px, 판 20×22
  const c = woodCanvas(W, H, '#d9a95f'), x = c.getContext('2d');
  const px = (f) => (f - 4) * SP * k + W / 2, py = (r) => (4.5 - r) * SP * k + H / 2;
  x.strokeStyle = '#4a2c10'; x.lineCap = 'round';
  x.lineWidth = 7; x.strokeRect(px(0) - 62, py(9) - 62, px(8) - px(0) + 124, py(0) - py(9) + 124);
  x.lineWidth = 3; x.strokeRect(px(0) - 44, py(9) - 44, px(8) - px(0) + 88, py(0) - py(9) + 88);
  x.lineWidth = 4;
  for (let r = 0; r < 10; r++) { x.beginPath(); x.moveTo(px(0), py(r)); x.lineTo(px(8), py(r)); x.stroke(); }
  for (let f = 0; f < 9; f++) { x.beginPath(); x.moveTo(px(f), py(0)); x.lineTo(px(f), py(9)); x.stroke(); }
  [[3, 0, 5, 2], [5, 0, 3, 2], [3, 7, 5, 9], [5, 7, 3, 9]].forEach((d) => { x.beginPath(); x.moveTo(px(d[0]), py(d[1])); x.lineTo(px(d[2]), py(d[3])); x.stroke(); });
  x.lineWidth = 3; const m = 13, g = 5;                    // 졸·포 자리 표시
  [[0, 3], [2, 3], [4, 3], [6, 3], [8, 3], [0, 6], [2, 6], [4, 6], [6, 6], [8, 6], [1, 2], [7, 2], [1, 7], [7, 7]].forEach(([f, r]) => {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      if ((f === 0 && sx < 0) || (f === 8 && sx > 0)) return;
      x.beginPath(); x.moveTo(px(f) + sx * g, py(r) + sy * (g + m)); x.lineTo(px(f) + sx * g, py(r) + sy * g); x.lineTo(px(f) + sx * (g + m), py(r) + sy * g); x.stroke();
    });
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const board = new THREE.Group(); scene.add(board);
{
  const top = new THREE.Mesh(new THREE.PlaneGeometry(20, 22), new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.55 }));
  top.rotation.x = -Math.PI / 2; top.position.y = SIDE_Y + 0.005; top.receiveShadow = true; board.add(top);
  const side = woodCanvas(256, 64, '#b98342'), st = new THREE.CanvasTexture(side); st.colorSpace = THREE.SRGBColorSpace;
  const box = new THREE.Mesh(new THREE.BoxGeometry(20, 0.9, 22), new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 }));
  box.position.y = SIDE_Y - 0.45; box.castShadow = true; box.receiveShadow = true; board.add(box);
  [[-8.7, -9.6], [8.7, -9.6], [-8.7, 9.6], [8.7, 9.6]].forEach(([fx, fz]) => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.7 })); leg.position.set(fx, -0.5, fz); board.add(leg); });
}
const RADIUS = [0, 0.56, 0.7, 0.7, 0.76, 0.72, 0.6, 0.9], HEIGHT = [0, 0.36, 0.42, 0.42, 0.46, 0.44, 0.38, 0.52];
const texCache = {}, TEX_ROT = Math.PI / 2;
function pieceTexture(t, color) {
  const key = t + ':' + color; if (texCache[key]) return texCache[key];
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const grad = x.createRadialGradient(S * 0.42, S * 0.38, 10, S / 2, S / 2, S * 0.62); grad.addColorStop(0, '#fbe6b8'); grad.addColorStop(1, '#e0b676');
  x.fillStyle = grad; x.fillRect(0, 0, S, S);
  const ink = color > 0 ? '#1d7a4a' : '#c4302b';
  x.strokeStyle = ink; x.lineWidth = 6; x.beginPath(); x.arc(S / 2, S / 2, S * 0.43, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 2; x.beginPath(); x.arc(S / 2, S / 2, S * 0.39, 0, Math.PI * 2); x.stroke();
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '900 ' + (t === 7 ? 150 : t === 1 || t === 6 ? 120 : 136) + 'px ' + FONT;
  x.fillText(HANJA[color > 0 ? 1 : '-1'][t], S / 2, S / 2 + 6);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; tx.center.set(0.5, 0.5); tx.rotation = TEX_ROT; texCache[key] = tx; return tx;
}
const sideMat = new THREE.MeshStandardMaterial({ color: 0xc89455, roughness: 0.5 }), botMat = new THREE.MeshStandardMaterial({ color: 0x8a5d2d });
const geoCache = {};
function pieceGeo(t) { return geoCache[t] || (geoCache[t] = new THREE.CylinderGeometry(RADIUS[t] * 0.94, RADIUS[t], HEIGHT[t], 8, 1, false, Math.PI / 8)); }
const pieces = new Map();                               // 칸 → Group
const pieceLayer = new THREE.Group(); scene.add(pieceLayer);
function makePiece(type, color) {
  const g = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ map: pieceTexture(type, color), roughness: 0.4 });
  const m = new THREE.Mesh(pieceGeo(type), [sideMat, topMat, botMat]); m.position.y = HEIGHT[type] / 2; m.castShadow = true; m.receiveShadow = true;
  g.add(m); if (color < 0) m.rotation.y = Math.PI;       // 한 말은 한 쪽 사람이 바로 읽도록 돌려 놓아요
  g.userData = { type, color, sq: -1 }; pieceLayer.add(g); return g;
}
function putPiece(g, s) { g.userData.sq = s; g.position.copy(sqVec(s)); g.scale.setScalar(1); g.rotation.set(0, 0, 0); pieces.set(s, g); }
function clearPieces() { pieces.forEach((g) => pieceLayer.remove(g)); pieces.clear(); }
function syncBoard(b) { poke(); clearPieces(); for (let s = 0; s < 90; s++) { const v = b[s]; if (v) putPiece(makePiece(Math.abs(v), v > 0 ? 1 : -1), s); } }

/* ---------- 표시(초록 점, 빨간 동그라미 …) ---------- */
const mk = { dot: [], ring: [], tile: [], last: [], hint: [] };
const mkLayer = new THREE.Group(); scene.add(mkLayer);
const mkMat = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
const dotGeo = new THREE.CircleGeometry(0.34, 32), ringGeo = new THREE.RingGeometry(0.86, 1.14, 40), discGeo = new THREE.CircleGeometry(1.0, 40);
const dotMat = mkMat(0x2fdc6a, 0.92), ringMat = mkMat(0xff4a3d, 0.95), selMat = mkMat(0xffd23c, 0.6), lastMat = mkMat(0x4fb4ff, 0.42), chkMat = mkMat(0xff3b30, 0.6), hintMat = mkMat(0xffe44d, 0.8);
for (let s = 0; s < 90; s++) {
  const flat = (geo, mat, y, order) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(sqX(s), SIDE_Y + y, sqZ(s)); m.visible = false; m.renderOrder = order; mkLayer.add(m); return m; };
  mk.tile[s] = flat(discGeo, selMat, 0.012, 1); mk.last[s] = flat(discGeo, lastMat, 0.008, 1); mk.dot[s] = flat(dotGeo, dotMat, 0.6, 4); mk.ring[s] = flat(ringGeo, ringMat, 0.6, 4); mk.hint[s] = flat(discGeo, hintMat, 0.016, 2);
  mk.dot[s].material = dotMat;
}
const mkState = { selected: -1, targets: [], captures: [], last: [], check: -1, hint: [] };
let assistOn = true;
function refreshMarkers() {
  poke();
  for (let s = 0; s < 90; s++) mk.dot[s].visible = mk.ring[s].visible = mk.tile[s].visible = mk.last[s].visible = mk.hint[s].visible = false;
  mkState.last.forEach((s) => { if (s >= 0) mk.last[s].visible = true; });
  if (mkState.check >= 0) { mk.tile[mkState.check].material = chkMat; mk.tile[mkState.check].visible = true; }
  if (mkState.selected >= 0) { mk.tile[mkState.selected].material = selMat; mk.tile[mkState.selected].visible = true; }
  if (assistOn || mode === 'learn') { mkState.targets.forEach((s) => { mk.dot[s].visible = true; }); mkState.captures.forEach((s) => { mk.ring[s].visible = true; }); }
  mkState.hint.forEach((s) => { mk.hint[s].visible = true; });
}

/* ---------- 움직임(트윈) ---------- */
const tweens = [];
const ease = { io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
function tween(ms, fn, e) { if (calm()) ms = Math.min(ms, 120); return new Promise((res) => { tweens.push({ t: 0, dur: Math.max(1, ms) / 1000, fn, res, e: e || ease.io }); }); }
function stepTweens(dt) { for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const p = Math.min(1, w.t / w.dur); w.fn(w.e(p), p); if (p >= 1) { tweens.splice(i, 1); w.res(); } } }
const sleep = (ms) => new Promise((r) => setTimeout(r, calm() ? Math.min(ms, 80) : ms));
async function hop(g, to, hopH) {
  const a = g.position.clone(), b = sqVec(to), dist = a.distanceTo(b); g.userData.sq = to;
  await tween(Math.min(900, 300 + dist * 45), (p) => { g.position.set(a.x + (b.x - a.x) * p, SIDE_Y + Math.sin(Math.PI * p) * hopH, a.z + (b.z - a.z) * p); });
  g.position.copy(b);
}
async function popOut(g) { await tween(380, (p) => { g.scale.setScalar(1 - p); g.rotation.y = p * 4; g.position.y = SIDE_Y - p * 0.5; }, ease.io); pieceLayer.remove(g); }
async function animateMove(rec) {
  const g = pieces.get(rec.from); if (!g) { syncBoard(game.board); return; }
  pieces.delete(rec.from); let victim = null;
  if (rec.captured) { victim = pieces.get(rec.to); pieces.delete(rec.to); }
  const t = Math.abs(rec.piece); pieces.set(rec.to, g);
  await hop(g, rec.to, t === 2 || t === 3 || t === 5 ? 1.7 : 0.8);
  if (victim) { O.sfx('pop'); await popOut(victim); } else O.sfx('tick');
}

/* ---------- 카메라 ---------- */
let viewColor = 1, camBusy = false, hudTop = 110, hudBot = 80;
function measureHud() { const h = window.innerHeight, m = $('msg').getBoundingClientRect(), b = document.querySelector('.ch-bottom').getBoundingClientRect(); hudTop = Math.min(h * 0.4, Math.max(96, m.bottom + 6)); hudBot = Math.min(h * 0.3, Math.max(60, h - b.top + 4)); }
function applyViewOffset() { const w = window.innerWidth, h = window.innerHeight; measureHud(); camera.setViewOffset(w, h, 0, -Math.round((hudTop - hudBot) / 2), w, h); }
function fitDistance() { const w = window.innerWidth, h = window.innerHeight, avail = Math.max(200, h - hudTop - hudBot); return Math.max(26, 27 * (h / avail), 33 / (w / h)) + 2; }
function applyCameraLimits() { const d = fitDistance(); controls.minDistance = d * 0.5; controls.maxDistance = d * 1.55; }
function camPos(az, pol, r) { return new THREE.Vector3(Math.sin(az) * Math.sin(pol) * r, Math.cos(pol) * r + controls.target.y, Math.cos(az) * Math.sin(pol) * r); }
async function setView(color, instant) {
  viewColor = color; const az = color > 0 ? 0 : Math.PI, pol = 0.78, r = fitDistance();
  if (instant || calm()) { camera.position.copy(camPos(az, pol, r)); controls.update(); return; }
  camBusy = true; let a0 = controls.getAzimuthalAngle(), p0 = controls.getPolarAngle(), r0 = controls.getDistance();
  let d = az - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  await tween(900, (p) => { camera.position.copy(camPos(a0 + d * p, p0 + (pol - p0) * p, r0 + (r - r0) * p)); camera.lookAt(controls.target); });
  controls.update(); camBusy = false;
}
function resize() { poke(); const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; applyViewOffset(); camera.updateProjectionMatrix(); applyCameraLimits(); }
window.addEventListener('resize', resize);

/* ---------- 말풍선 ---------- */
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) {
  msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : '');
  if (renderer) { const b0 = hudTop; measureHud(); if (Math.abs(b0 - hudTop) > 14) { applyViewOffset(); camera.updateProjectionMatrix(); poke(); } }
  if (speak !== false) O.say(typeof speak === 'string' ? speak : text);
}
const note = (t, k) => say(t, k, false);

/* ---------- 상태 ---------- */
let game = new J.Game(), mode = null, level = 3, myColor = 1, busy = false, over = false, stats = O.newStats(), runId = 0;
let selected = -1, legal = [], lastHint = null, worker = null, workerId = 0, setupCfg = { cho: 'inner', han: 'inner' };
const isHumanTurn = () => mode === 'two' || (mode === 'play' && game.turn === myColor);
const START_COUNT = [0, 5, 2, 2, 2, 2, 2, 1];
function updateTrays() {
  if (mode === 'learn') { $('capW').innerHTML = $('capB').innerHTML = ''; return; }
  const have = { 1: START_COUNT.map(() => 0), '-1': START_COUNT.map(() => 0) };
  for (let s = 0; s < 90; s++) { const v = game.board[s]; if (v) have[v > 0 ? 1 : -1][Math.abs(v)]++; }
  const out = { 1: '', '-1': '' };
  [1, -1].forEach((c) => { for (let t = 5 + 2; t >= 1; t--) { if (t === 7) continue; for (let i = have[c][t]; i < START_COUNT[t]; i++) out[c] += '<span class="' + (c > 0 ? 'c' : 'h') + '">' + HANJA[c > 0 ? 1 : '-1'][t] + '</span>'; } });
  $('capW').innerHTML = out[1]; $('capB').innerHTML = out[-1];
}
function updateButtons() {
  const play = mode === 'play' || mode === 'two';
  $('btnUndo').disabled = busy || !(play && game.stack.length > (mode === 'play' && myColor < 0 ? 1 : 0)) || over;
  $('btnHint').disabled = busy || over || !(mode === 'learn' || isHumanTurn());
  $('btnPass').disabled = busy || over || !play || !isHumanTurn() || game.inCheck();
  $('btnUndo').hidden = mode === 'learn'; $('btnPass').hidden = !play;
}

/* ---------- 선택 · 이동 ---------- */
function clearSelection() { selected = -1; legal = []; mkState.selected = -1; mkState.targets = []; mkState.captures = []; mkState.hint = []; refreshMarkers(); }
function select(sq) {
  selected = sq; legal = game.movesFrom(sq); mkState.selected = sq; mkState.hint = []; mkState.targets = []; mkState.captures = [];
  legal.forEach((m) => { if (m.captured) mkState.captures.push(m.to); else mkState.targets.push(m.to); });
  refreshMarkers(); O.sfx('tick');
  const t = Math.abs(game.board[sq]), nm = nameOf(t, game.turn);
  if (!legal.length) note(nm + EUNNEUN(nm) + ' 지금 갈 곳이 없어요. 다른 말을 눌러 보세요.', 'warn');
  else note(sideKo(game.turn) + ' ' + nm + ' · ' + HOW[t].split('.')[0] + '.');
  if (O.settings().explain !== false && level <= 3) O.say(nm + IGA(nm) + '에요. ' + HOW[t]);
}
function tapSquare(sq) {
  if (busy || over || !mode) return; O.unlock();
  if (mode === 'learn') return learnTap(sq);
  if (!isHumanTurn()) return;
  const v = game.board[sq];
  if (v && v * game.turn > 0) { if (sq === selected) { clearSelection(); note('말을 눌러 보세요.'); } else select(sq); return; }
  if (selected < 0) { if (!v) note('움직일 내 말을 눌러 보세요.'); return; }
  const m = legal.filter((x) => x.to === sq)[0];
  if (!m) { stats.mistakes++; O.sfx('no'); say('거기로는 갈 수 없어요. 초록 점이나 빨간 동그라미로 가 보세요.', 'warn', false); return; }
  humanMove(m);
}
async function humanMove(m) { const mover = game.turn, rec = game.move(m.from, m.to); if (!rec) return; clearSelection(); await playRec(rec, mover, true); }
async function playRec(rec, mover, human) {
  busy = true; updateButtons();
  if (!rec.pass) await animateMove(rec);
  mkState.last = rec.pass ? [] : [rec.from, rec.to]; busy = false; afterMove(rec, mover, human);
}
function describe(rec, mover) {
  if (rec.pass) return sideKo(mover) + '이 한 수 쉬었어요.';
  const t = Math.abs(rec.piece), nm = nameOf(t, mover);
  if (rec.captured) { const ct = Math.abs(rec.captured), cn = nameOf(ct, -mover); return sideKo(mover) + ' ' + nm + IGA(nm) + ' ' + sideKo(-mover) + ' ' + cn + EULREUL(cn) + ' 잡았어요!'; }
  return sideKo(mover) + ' ' + nm + IGA(nm) + ' 움직였어요.';
}
function afterMove(rec, mover, human) {
  updateTrays();
  const st = game.status(); mkState.check = (st === 'check' || st === 'checkmate') ? game.kingSq(game.turn) : -1;
  refreshMarkers(); updateButtons();
  const spoken = describe(rec, mover);
  if (st === 'checkmate') { say(spoken + ' 장군! 피할 곳이 없어요!', 'good', false); return endGame('checkmate', mover); }
  if (st === 'draw-repeat' || st === 'score') { say(spoken, null, false); return endGame(st, 0); }
  if (st === 'nomove') {
    say(spoken + ' ' + sideKo(game.turn) + '은 움직일 수 있는 말이 없어서 한 수 쉬어요.', null, '움직일 수 있는 말이 없어서 한 수 쉬어요.');
    const rid = runId; busy = true; updateButtons();
    return setTimeout(() => { if (rid !== runId || over) return; busy = false; const m2 = game.turn, r2 = game.pass(); if (r2) playRec(r2, m2, false); }, calm() ? 100 : 1400);
  }
  if (st === 'check') say(spoken + ' 장군이에요! ' + (game.turn === myColor || mode === 'two' ? '궁을 지켜요(멍군).' : '상대 궁이 위험해요.'), 'warn', spoken + ' 장군이에요!');
  else if (human || mode === 'two') say(spoken + (mode === 'play' ? ' 컴퓨터 차례예요.' : ' ' + sideKo(game.turn) + ' 차례예요.'), null, rec.captured ? spoken : false);
  else say(spoken + ' 이제 내 차례예요.', null, spoken);
  if (mode === 'play' && game.turn !== myColor && !over) aiTurn();
}

/* ---------- 컴퓨터 ---------- */
function startWorker() { if (worker) return; try { worker = new Worker('ai-worker.js'); } catch (e) { worker = null; } }
function askAI(kind) {
  return new Promise((resolve) => {
    const id = ++workerId, fen = game.fen(), keys = game.keys.slice(-30);
    const fallback = () => { const g = new J.Game(fen); g.keys = keys; const m = kind === 'hint' ? J.ai.hint(g) : J.ai.choose(g, level); resolve(m ? { from: m.from, to: m.to } : null); };
    if (!worker) return setTimeout(fallback, 40);
    const done = (e) => { if (e.data.id !== id) return; worker.removeEventListener('message', done); clearTimeout(to); resolve(e.data.move); };
    const to = setTimeout(() => { worker.removeEventListener('message', done); fallback(); }, 12000);
    worker.addEventListener('message', done); worker.postMessage({ id, fen, keys, level, kind });
  });
}
async function aiTurn() {
  busy = true; updateButtons(); note('컴퓨터가 생각하고 있어요…');
  const t0 = Date.now(), pick = await askAI('move'); await sleep(Math.max(0, 700 - (Date.now() - t0)));
  if (over || mode !== 'play') { busy = false; return; } if (!pick) { busy = false; return; }
  const mover = game.turn, rec = game.move(pick.from, pick.to); busy = false; if (rec) await playRec(rec, mover, false);
}

/* ---------- 힌트 · 되돌리기 · 쉬기 ---------- */
async function doHint() {
  if (busy || over) return; O.unlock(); stats.asked++;
  if (mode === 'learn') return learnHint();
  busy = true; updateButtons(); note('좋은 수를 찾는 중이에요…');
  const m = await askAI('hint'); busy = false; updateButtons(); if (!m) return;
  clearSelection(); mkState.hint = [m.from, m.to]; refreshMarkers();
  const t = Math.abs(game.board[m.from]), nm = nameOf(t, game.turn);
  say(nm + EULREUL(nm) + ' 노란 곳으로 옮겨 볼까요?', 'good'); clearTimeout(lastHint); lastHint = setTimeout(() => { mkState.hint = []; refreshMarkers(); }, 6000);
}
function doUndo() {
  if (busy || over || !(mode === 'play' || mode === 'two')) return;
  let n = 0; do { if (!game.undo()) break; n++; } while (mode === 'play' && game.turn !== myColor && game.stack.length);
  if (!n) return;
  clearSelection(); syncBoard(game.board); const l = game.last(); mkState.last = l && !l.pass ? [l.from, l.to] : []; mkState.check = game.inCheck() ? game.kingSq(game.turn) : -1;
  refreshMarkers(); updateTrays(); updateButtons(); O.sfx('tick'); say('한 수 물렸어요. 다시 해 보세요!', null, '한 수 물렸어요.');
}
function doPass() {
  if (busy || over || !isHumanTurn()) return; O.unlock();
  if (game.inCheck()) { say('장군일 때는 쉴 수 없어요. 궁을 지켜요!', 'warn'); return; }
  const mover = game.turn, rec = game.pass(); if (rec) { clearSelection(); playRec(rec, mover, true); }
}

/* ---------- 끝났을 때 ---------- */
function endGame(kind, winner) {
  const rid = runId; over = true; updateButtons();
  let title, text, stars, speak, win = winner;
  if (kind === 'score') { const sc = game.score(); win = sc.cho > sc.han ? 1 : -1; text = '오래 두어서 점수로 가렸어요. 초 ' + sc.cho + '점, 한 ' + sc.han + '점(한은 1.5점 덤).'; kind = 'checkmate-score'; }
  if (kind === 'checkmate' || kind === 'checkmate-score') {
    const humanWon = mode === 'two' || win === myColor; const cm = kind === 'checkmate';
    title = mode === 'two' ? sideKo(win) + ' 쪽이 이겼어요!' : humanWon ? (cm ? '외통! 이겼어요!' : '점수로 이겼어요!') : '아쉬워요. 다음엔 이길 수 있어요!';
    if (cm) text = '상대 궁이 도망갈 곳이 없어요.';
    stars = humanWon ? 3 : 1; speak = humanWon ? (cm ? '외통! 정말 잘했어요!' : '점수로 이겼어요! 잘했어요!') : '아쉽지만 끝까지 잘했어요. 한 번 더 해 볼까요?';
  } else { title = '비겼어요!'; text = '같은 모양이 세 번 나와서 비겼어요.'; stars = 2; speak = title + ' ' + text; }
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(장기)', school: 'elem', topic: '3D 장기', level: mode === 'play' ? level : 1, engine: 'janggi',
    rounds: Math.ceil(game.stack.length / 2), mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const again = () => startGame({ mode, level, color: mode === 'play' ? myColor : 1, cho: setupCfg.cho, han: setupCfg.han });
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: again }];
  if (mode === 'play' && stars === 3 && level < 5) btns.push({ label: '⬆ 다음 수준 (' + (level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, level + 1); startGame({ mode, level: level + 1, color: myColor, cho: setupCfg.cho, han: setupCfg.han }); } });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 900);
}

/* ---------- 새 대국 ---------- */
function resetState() { over = false; busy = false; selected = -1; legal = []; clearTimeout(lastHint); Object.assign(mkState, { selected: -1, targets: [], captures: [], last: [], check: -1, hint: [] }); clearLearn(); stats = O.newStats(); tweens.length = 0; }
function startGame(cfg) {
  runId++; resetState(); mode = cfg.mode; level = cfg.level || 3; myColor = cfg.color || 1;
  if (mode === 'play') O.rememberLevel(LESSON, level);
  const pickRand = () => SETUP_KEYS[(Math.random() * 4) | 0];
  setupCfg = { cho: cfg.cho || 'inner', han: cfg.han || 'inner' };
  if (mode === 'play') { if (myColor > 0) setupCfg.han = pickRand(); else setupCfg.cho = pickRand(); }
  game = new J.Game(setupCfg.cho, setupCfg.han); syncBoard(game.board); refreshMarkers(); updateTrays();
  $('menu').hidden = true; $('modeLabel').textContent = mode === 'play' ? '컴퓨터와 대국 · 수준 ' + level : '둘이서 대국';
  setView(mode === 'play' ? myColor : 1, true); updateButtons(); startWorker();
  if (mode === 'play') {
    if (myColor > 0) say('내가 초(초록)예요. 먼저 시작해요! 말을 눌러 보세요.', null, '내가 초예요. 먼저 시작해요. 말을 눌러 보세요.');
    else { say('내가 한(빨강)이에요. 컴퓨터가 먼저 시작해요.'); aiTurn(); }
  } else say('초(초록)부터 시작해요. 번갈아 한 번씩 움직여요.');
}

/* ---------- 말 움직임 배우기 ---------- */
const LEARN_ORDER = [4, 1, 2, 3, 5, 7];
const learn = { type: 4, stars: new Map(), total: 0, got: 0, pos: -1, queue: [] };
function addStar(sq) { const st = makeStar(); st.position.copy(sqVec(sq, 1.0)); st.userData.sq = sq; scene.add(st); learn.stars.set(sq, st); }
function clearLearn() { learn.stars.forEach((m) => scene.remove(m)); learn.stars.clear(); learn.got = 0; }
let starGeo = null;
function makeStar() {
  if (!starGeo) { const sh = new THREE.Shape(), R = 0.62, r = 0.28; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * rr, Math.sin(a) * rr); } starGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }); starGeo.center(); }
  const m = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffd23c, emissive: 0xffa800, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2 })); m.castShadow = true; return m;
}
function emptyGame() { const g = new J.Game('inner', 'inner'); g.board.fill(0); g.free = true; g.stack = []; g.keys = []; g.ks = [-1, -1]; return g; }
function buildLearn(type, lv) {
  const total = [0, 3, 4, 5, 6, 7][lv], rnd = (n) => (Math.random() * n) | 0, g = emptyGame();
  const spot = () => type === 7 ? (3 + rnd(3)) + (rnd(3)) * 9 : type === 1 ? (rnd(9)) + (3 + rnd(2)) * 9 : (1 + rnd(7)) + (1 + rnd(7)) * 9;
  const start = type === 1 ? rnd(9) + 2 * 9 : spot(), obstacles = [];
  g.board[start] = type;
  const nObs = type === 5 ? 2 + (lv >= 4 ? 1 : 0) : (type === 2 || type === 3) && lv >= 3 ? 1 : 0;
  for (let i = 0; i < 12 && obstacles.length < nObs; i++) {
    let o;
    if (type === 5) o = (rnd(9)) + (rnd(10)) * 9;
    else { const f0 = start % 9, r0 = (start / 9) | 0, d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)]; if (f0 + d[0] < 0 || f0 + d[0] > 8 || r0 + d[1] < 0 || r0 + d[1] > 9) continue; o = (r0 + d[1]) * 9 + f0 + d[0]; }
    if (o === start || g.board[o] || obstacles.indexOf(o) >= 0) continue; obstacles.push(o); g.board[o] = 1;
  }
  const targets = []; let cur = start;
  if (type === 1) {                                           // 졸은 뒤로 못 가니까 줄마다 별 하나씩 (어느 쪽으로 가도 다 모을 수 있어요)
    for (let i = 0; i < total; i++) targets.push((3 + i) * 9 + rnd(9));
    return { start, targets, obstacles };
  }
  for (let i = 0; i < total; i++) {
    const mv = g.movesFrom(cur).map((m) => m.to).filter((s) => !g.board[s] && targets.indexOf(s) < 0 && s !== start);
    if (!mv.length) break; const pick = mv[rnd(mv.length)]; targets.push(pick);
    g.board[cur] = 0; g.board[pick] = type; cur = pick;
  }
  return { start, targets, obstacles };
}
function learnSolvable(sc, type) {   // 어디에서 시작해도 별을 모두 모을 수 있는 판인가
  if (type === 1) return true;
  const g = emptyGame(); sc.obstacles.forEach((o) => { g.board[o] = 1; });
  const reach = (from) => { const seen = new Set([from]), q = [from]; while (q.length) { const c = q.shift(); g.board[c] = type; const ns = g.movesFrom(c).map((m) => m.to); g.board[c] = 0; ns.forEach((n) => { if (!seen.has(n)) { seen.add(n); q.push(n); } }); } return seen; };
  return [sc.start, ...sc.targets].every((p) => { const r = reach(p); return sc.targets.every((t) => r.has(t)); });
}
function startLearn(cfg) {
  runId++; resetState(); mode = 'learn'; level = cfg.level || 2; learn.type = cfg.piece || 4;
  $('menu').hidden = true; const nm0 = nameOf(learn.type, 1); $('modeLabel').textContent = '말 움직임 배우기 · ' + (learn.type === 7 ? '궁·사' : nm0);
  O.rememberLevel(LEARN_LESSON, level);
  let sc, tries = 0; do { sc = buildLearn(learn.type, level); } while ((sc.targets.length < 2 || !learnSolvable(sc, learn.type)) && ++tries < 60);
  const g = emptyGame(); g.board[sc.start] = learn.type; sc.obstacles.forEach((s) => { g.board[s] = 1; }); game = g;
  syncBoard(g.board);
  learn.queue = learn.type === 1 ? sc.targets.slice(1) : [];       // 졸은 별이 하나씩 나타나요
  (learn.type === 1 ? sc.targets.slice(0, 1) : sc.targets).forEach(addStar);
  learn.total = sc.targets.length; learn.got = 0; learn.pos = sc.start; learn.start = sc.start;
  setView(1, true); refreshMarkers(); updateTrays(); updateButtons();
  const t = learn.type, nm = t === 7 ? '궁' : nameOf(t, 1), extra = sc.obstacles.length ? (t === 5 ? ' 초록 졸을 넘어 보세요.' : ' 막은 말을 조심해요.') : '';
  say(nm + IGA(nm) + '에요. ' + HOW[t].split('.')[0] + '.' + extra + ' 별을 모아요!', null, nm + IGA(nm) + '에요. ' + HOW[t] + ' 별을 모아 보세요!');
}
function learnTap(sq) {
  const v = game.board[sq];
  if (v === learn.type && sq === learn.pos) { if (sq === selected) return clearSelection(); selected = sq; legal = game.movesFrom(sq); mkState.selected = sq; mkState.hint = []; mkState.targets = legal.filter((m) => !m.captured).map((m) => m.to); mkState.captures = legal.filter((m) => m.captured).map((m) => m.to); refreshMarkers(); O.sfx('tick'); return; }
  const nm = learn.type === 7 ? '궁' : nameOf(learn.type, 1);
  if (selected < 0) { note('먼저 ' + nm + EULREUL(nm) + ' 눌러 보세요.'); return; }
  const m = legal.filter((x) => x.to === sq)[0];
  if (!m) { stats.mistakes++; O.sfx('no'); say(nm + IGA(nm) + ' 갈 수 있는 곳은 초록 점이에요.', 'warn'); return; }
  if (learn.type === 1 && learn.stars.size) { const sr = ((learn.stars.keys().next().value / 9) | 0); if (((m.to / 9) | 0) > sr) { stats.mistakes++; O.sfx('no'); say('별을 먼저 모아요! 더 앞으로 가면 졸은 돌아올 수 없어요.', 'warn'); return; } }
  learnMove(m);
}
async function learnMove(m) {
  busy = true; updateButtons(); const from = m.from; clearSelection();
  const g = pieces.get(from); pieces.delete(from); let victim = null;
  if (m.captured) { victim = pieces.get(m.to); pieces.delete(m.to); }
  game.board[from] = 0; game.board[m.to] = m.piece; learn.pos = m.to; pieces.set(m.to, g);
  await hop(g, m.to, learn.type === 5 || learn.type === 2 || learn.type === 3 ? 1.7 : 0.8);
  if (victim) { O.sfx('pop'); await popOut(victim); }
  const star = learn.stars.get(m.to);
  if (star) { learn.stars.delete(m.to); learn.got++; O.sfx('coin'); await tween(300, (p) => { star.scale.setScalar(1 + p * 0.6); star.position.y = 1 + p * 1.6; star.rotation.y += 0.4; }); scene.remove(star); if (learn.queue.length) addStar(learn.queue.shift()); }
  busy = false; updateButtons();
  const left = learn.total - learn.got; if (left <= 0) return learnDone();
  say('잘했어요! 남은 별은 ' + left + '개예요.', 'good');
}
function learnDone() {
  const rid = runId; over = true; const t = learn.type, idx = LEARN_ORDER.indexOf(t), next = LEARN_ORDER[(idx + 1) % LEARN_ORDER.length];
  const nm = t === 7 ? '궁·사' : nameOf(t, 1), nn = next === 7 ? '궁·사' : nameOf(next, 1);
  const stars = stats.mistakes <= 1 ? 3 : stats.mistakes <= 4 ? 2 : 1;
  const entry = { at: new Date().toISOString(), lesson: LEARN_LESSON, subject: 'play', subjectName: '놀이(장기)', school: 'elem', topic: '장기 말 움직임: ' + nm, level, engine: 'janggi-learn',
    rounds: learn.total, mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: () => startLearn({ piece: t, level }) }, { label: '➡ ' + nn + ' 배우기', color: 'orange', onClick: () => startLearn({ piece: next, level }) }];
  if (level < 5) btns.push({ label: '⬆ 더 어렵게', color: 'purple', onClick: () => startLearn({ piece: t, level: level + 1 }) });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title: nm + ' 움직임을 잘 알아요!', text: '별 ' + learn.total + '개를 모았어요 · ' + LEVEL_NAME[level], speak: '별을 다 모았어요! ' + nm + ' 움직이는 법을 알았어요!', mission: { lesson: 1 }, buttons: btns }); }, 500);
}
function learnHint() {
  const goals = [...learn.stars.keys()]; if (!goals.length) return;
  const tmp = emptyGame(), movesFrom = (sq) => { tmp.board.set(game.board); tmp.board[learn.pos] = 0; tmp.board[sq] = learn.type; return tmp.movesFrom(sq).map((m) => m.to); };
  const prev = new Map([[learn.pos, -1]]), q = [learn.pos]; let hit = -1;
  while (q.length && hit < 0) { const s = q.shift(); for (const t of movesFrom(s)) { if (prev.has(t)) continue; prev.set(t, s); if (goals.indexOf(t) >= 0) { hit = t; break; } q.push(t); } }
  if (hit < 0) return note('이 말로는 더 갈 수 있는 별이 없어요.');
  let step = hit; while (prev.get(step) !== learn.pos && prev.get(step) !== -1) step = prev.get(step);
  clearSelection(); mkState.hint = [learn.pos, step]; refreshMarkers(); say('노란 곳으로 옮겨 보세요!', 'good');
  clearTimeout(lastHint); lastHint = setTimeout(() => { mkState.hint = []; refreshMarkers(); }, 6000);
}

/* ---------- 메뉴 ---------- */
const DEFAULT_PREFS = { mode: 'learn', color: 1, piece: 4, cho: 'inner', han: 'inner' };
const prefs = (() => { try { return Object.assign({}, DEFAULT_PREFS, JSON.parse(localStorage.getItem('oks_janggi_prefs_v1') || '{}')); } catch (e) { return Object.assign({}, DEFAULT_PREFS); } })();
function savePrefs() { try { localStorage.setItem('oks_janggi_prefs_v1', JSON.stringify(prefs)); } catch (e) {} }
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  const sel = { mode: prefs.mode, color: prefs.color, piece: prefs.piece, cho: prefs.cho, han: prefs.han, playLv: O.levelFor(LESSON), learnLv: O.levelFor(LEARN_LESSON) };
  const chip = (cls, val, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + cls + '="' + val + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    const modes = [['learn', '🎓', '말 움직임 배우기', '별을 모으며 익혀요'], ['play', '🤖', '컴퓨터와 대국', '수준을 골라요'], ['two', '👫', '둘이서 대국', '친구와 번갈아']];
    let opt = '';
    const setupRow = (label, key, cls) => '<div class="ch-row"><label>' + label + '</label>' + SETUP_KEYS.map((k) => chip(cls, k, SETUP_KO[k], '', sel[key] === k)).join('') + '</div>';
    if (sel.mode === 'learn') {
      opt = '<div class="ch-row"><label>배울 말</label>' + LEARN_ORDER.map((t) => chip('piece', t, '<i>' + HANJA[1][t] + '</i> ' + (t === 7 ? '궁·사' : NAMES[t]), '', sel.piece === t)).join('') + '</div>' +
        '<div class="ch-row"><label>별 개수</label>' + [1, 2, 3, 4, 5].map((l) => chip('llv', l, l, ['3개', '4개', '5개', '6개', '7개'][l - 1], sel.learnLv === l)).join('') + '</div>';
    } else if (sel.mode === 'play') {
      opt = '<div class="ch-row"><label>컴퓨터 수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('plv', l, l, LEVEL_NAME[l], sel.playLv === l)).join('') + '</div>' +
        '<div class="ch-row"><label>내 편</label>' + chip('color', 1, '🟢 초(楚)', '먼저 시작', sel.color === 1) + chip('color', -1, '🔴 한(漢)', '나중에', sel.color === -1) + '</div>' + setupRow('내 상차림', sel.color > 0 ? 'cho' : 'han', 'setup');
    } else opt = setupRow('초 상차림', 'cho', 'setupc') + setupRow('한 상차림', 'han', 'setuph');
    el.innerHTML = '<div class="ch-card"><h1>♟️ 3D 장기</h1><p>장기말을 눌러 움직이는 한국 장기예요.</p><div class="ch-modes">' +
      modes.map((m) => '<button type="button" class="ch-mode' + (sel.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '"><i>' + m[1] + '</i><b>' + m[2] + '</b><span>' + m[3] + '</span></button>').join('') + '</div>' + opt +
      '<button type="button" class="ch-go" id="goBtn">시작!</button>' + (game && mode && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { sel.mode = b.dataset.mode; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-piece]').forEach((b) => { b.onclick = () => { sel.piece = +b.dataset.piece; render(); }; });
    el.querySelectorAll('[data-llv]').forEach((b) => { b.onclick = () => { sel.learnLv = +b.dataset.llv; render(); }; });
    el.querySelectorAll('[data-plv]').forEach((b) => { b.onclick = () => { sel.playLv = +b.dataset.plv; render(); }; });
    el.querySelectorAll('[data-color]').forEach((b) => { b.onclick = () => { sel.color = +b.dataset.color; render(); }; });
    el.querySelectorAll('[data-setup]').forEach((b) => { b.onclick = () => { sel[sel.color > 0 ? 'cho' : 'han'] = b.dataset.setup; render(); }; });
    el.querySelectorAll('[data-setupc]').forEach((b) => { b.onclick = () => { sel.cho = b.dataset.setupc; render(); }; });
    el.querySelectorAll('[data-setuph]').forEach((b) => { b.onclick = () => { sel.han = b.dataset.setuph; render(); }; });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => {
      O.unlock(); Object.assign(prefs, { mode: sel.mode, color: sel.color, piece: sel.piece, cho: sel.cho, han: sel.han }); savePrefs(); el.hidden = true;
      if (sel.mode === 'learn') startLearn({ piece: sel.piece, level: sel.learnLv });
      else startGame({ mode: sel.mode, level: sel.playLv, color: sel.color, cho: sel.cho, han: sel.han });
    };
  }
  render(); O.say('3D 장기예요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 입력(탭으로 말·점 고르기) ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SIDE_Y);
function pickSquare(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const sh = ray.intersectObjects([...learn.stars.values()], false);
  if (sh.length && !ray.intersectObjects(pieceLayer.children, true).length) return sh[0].object.userData.sq;
  const hits = ray.intersectObjects(pieceLayer.children, true);
  if (hits.length) { let o = hits[0].object; while (o && !(o.userData && o.userData.sq >= 0 && o.parent === pieceLayer)) o = o.parent; if (o) return o.userData.sq; }
  const p = new THREE.Vector3();
  if (ray.ray.intersectPlane(floor, p)) {
    const f = Math.round(p.x / SP + 4), rk = Math.round(4.5 - p.z / SP);
    if (f >= 0 && f < 9 && rk >= 0 && rk < 10 && Math.hypot(p.x - (f - 4) * SP, p.z - (4.5 - rk) * SP) < 1.15) return rk * 9 + f;
  }
  return -1;
}
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || e.pointerId !== down.id) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
  if (moved > 10 || dt > 700) return; const sq = pickSquare(e.clientX, e.clientY); if (sq >= 0) tapSquare(sq);
});
canvas.addEventListener('pointercancel', () => { down = null; });

/* ---------- 버튼 ---------- */
$('btnUndo').onclick = doUndo; $('btnHint').onclick = doHint; $('btnPass').onclick = doPass;
$('btnView').onclick = () => { O.unlock(); if (!camBusy) setView(-viewColor); };
$('btnMenu').onclick = () => openMenu(false);
$('btnHelp').onclick = () => { O.unlock(); const d = $('helpDialog'); if (d.showModal) d.showModal(); };
$('btnLock').onclick = (e) => { const lock = controls.enableRotate; controls.enableRotate = !lock; controls.enableZoom = !lock; const b = e.currentTarget; b.setAttribute('aria-pressed', lock); b.textContent = lock ? '🔒 화면 고정됨' : '🔓 화면 돌리기'; note(lock ? '화면을 고정했어요. 손가락으로 돌아가지 않아요.' : '화면을 돌려 볼 수 있어요.'); };
$('btnAssist').onclick = (e) => { assistOn = !assistOn; e.currentTarget.setAttribute('aria-pressed', assistOn); e.currentTarget.textContent = assistOn ? '✅ 갈 수 있는 곳 보기' : '⬜ 갈 수 있는 곳 숨김'; refreshMarkers(); };
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
  for (let s = 0; s < 90; s++) { if (mk.dot[s].visible) mk.dot[s].scale.setScalar(pulse); if (mk.ring[s].visible) mk.ring[s].scale.setScalar(1 + Math.sin(t * 5) * 0.07); if (mk.hint[s].visible) mk.hint[s].material.opacity = 0.55 + Math.sin(t * 6) * 0.25; }
  learn.stars.forEach((m) => { m.rotation.y = t * 1.6; m.position.y = 1.0 + Math.sin(t * 2.4 + m.userData.sq) * 0.14; });
  if (!busy) pieces.forEach((g, s) => { g.position.y = s === selected ? SIDE_Y + 0.25 + Math.sin(t * 4) * 0.05 : SIDE_Y; });
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
(async function boot() {
  resize(); try { if (document.fonts && document.fonts.load) await Promise.race([document.fonts.load('900 64px ' + FONT, '楚漢卒兵馬象車包士'), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  syncBoard(game.board); setView(1, true); requestAnimationFrame(frame);
  $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
  say('놀이를 골라 주세요.', null, false); updateButtons(); openMenu(true);
})();

/* 시험용 손잡이 */
window.__janggi = {
  game: () => game, mode: () => mode, over: () => over, busy: () => busy, learn, tap: tapSquare, start: startGame, startLearn,
  load(fen) { game.load(fen); syncBoard(game.board); clearSelection(); updateTrays(); updateButtons(); },
  screen(sq, y) { const v = sqVec(sq, y == null ? 0.8 : y).project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
  pieceCount: () => pieces.size, starCount: () => learn.stars.size, hintSq: () => mkState.hint.slice(), openMenu
};
