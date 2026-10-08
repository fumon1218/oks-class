/* 옥쌤의 즐거운 교실 — 주차장 탈출 (러시아워 · 놀이별 보드게임)
   three.js(vendor/three). 차는 코드로 만든 장난감 자동차. 규칙·풀이는 engine.js, 문제는 puzzles.js(풀이 프로그램이 최소 횟수를 확인한 것만).
   조작: 차를 끌어서 옮기기 / 차를 누르고 초록 동그라미 누르기. 모드: 퍼즐(별) · 횟수 도전. */
import * as THREE from '../../vendor/three/three.module.js';
import { SIZE, EXIT_ROW, range, solve, solved, posOf, grid } from './engine.js';
import { PUZZLES } from './puzzles.js';

const O = window.OKS;
const $ = (id) => document.getElementById(id);
const calm = () => { try { return !!O.settings().calm; } catch (e) { return false; } };
const LESSON = 'play-rushhour';
const LEVEL_NAME = ['', '아주 쉬워요', '쉬워요', '보통', '어려워요', '아주 어려워요'];
const MODES = { puzzle: ['🧩', '퍼즐', '적게 움직일수록 별이 많아요'], limit: ['⏱️', '횟수 도전', '정해진 횟수 안에 내보내요'] };
const PALETTE = [[0x3d8bff, '파란'], [0xffc93c, '노란'], [0x39c46a, '초록'], [0x9b5de5, '보라'], [0xff7eb6, '분홍'], [0xff8a3d, '주황'], [0x2ec4b6, '청록'], [0xf2f2f2, '흰'], [0x66d4ff, '하늘색'], [0xb08968, '갈색'], [0xc6e03c, '연두'], [0x7a86ff, '남색']];
const RED = 0xe5392d;
const CELL = 1, HALF = SIZE / 2;
const cx2w = (c) => c - HALF + 0.5;      // 칸 번호 → 월드 좌표

/* ---------- 장면 ---------- */
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
scene.add(new THREE.HemisphereLight(0xffffff, 0x9fc58a, 1.5));
const sun = new THREE.DirectionalLight(0xfff3dd, 2.2); sun.position.set(-3, 8, 4); scene.add(sun);

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function rbox(w, h, d, r, mat) {      // 길이(x) × 높이(y) × 폭(z) 둥근 상자. 바닥이 y=0
  const bev = Math.min(0.05, h / 3, w / 4, d / 4), W = w - 2 * bev, D = d - 2 * bev, x = -W / 2, y = -D / 2; r = Math.min(r, W / 2 - 0.001, D / 2 - 0.001);
  const s = new THREE.Shape(); s.moveTo(x + r, y); s.lineTo(x + W - r, y); s.quadraticCurveTo(x + W, y, x + W, y + r); s.lineTo(x + W, y + D - r); s.quadraticCurveTo(x + W, y + D, x + W - r, y + D); s.lineTo(x + r, y + D); s.quadraticCurveTo(x, y + D, x, y + D - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, h - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.translate(0, bev, 0); const m = new THREE.Mesh(g, mat); return m;
}
// 바닥: 풀밭 + 주차장
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0xbfe6a0, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; scene.add(ground);
const asphaltTex = canvasTex(720, 720, (g, w, h) => {
  g.fillStyle = '#6c7690'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},255,${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4; g.setLineDash([22, 16]); const c = w / SIZE;
  for (let i = 1; i < SIZE; i++) { g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c, h); g.stroke(); g.beginPath(); g.moveTo(0, i * c); g.lineTo(w, i * c); g.stroke(); }
});
const lot = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.85 })); lot.rotation.x = -Math.PI / 2; scene.add(lot);
// 출구 길
const roadTex = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#6c7690'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd34d'; g.lineWidth = 6; g.setLineDash([30, 22]); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '900 64px system-ui'; g.fillText('▶', 340, 82); });
const road = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 })); road.rotation.x = -Math.PI / 2; road.position.set(HALF + 2, 0.003, cx2w(EXIT_ROW)); scene.add(road);
// 가장자리 연석(파랑·흰·노랑 줄무늬)
const curbMats = [0x3d8bff, 0xffffff, 0xffd34d].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
function curb(x0, z0, x1, z1, k) {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.5)), dx = (x1 - x0) / n, dz = (z1 - z0) / n;
  for (let i = 0; i < n; i++) { const horiz = Math.abs(dx) > Math.abs(dz), m = rbox(horiz ? Math.abs(dx) + 0.02 : 0.24, 0.24, horiz ? 0.24 : Math.abs(dz) + 0.02, 0.08, curbMats[(i + k) % 3]); m.position.set(x0 + dx * (i + 0.5), 0, z0 + dz * (i + 0.5)); scene.add(m); }
}
{ const o = HALF + 0.12, er = cx2w(EXIT_ROW);
  curb(-o, -o, o, -o, 0); curb(-o, o, o, o, 1); curb(-o, -o + 0.1, -o, o - 0.1, 2);
  curb(o, -o + 0.1, o, er - 0.5 - 0.02, 0); curb(o, er + 0.5 + 0.02, o, o - 0.1, 1);
  curb(o, er - 0.62, o + 4, er - 0.62, 2); curb(o, er + 0.62, o + 4, er + 0.62, 0); }
// 출구 표지
{ const er = cx2w(EXIT_ROW), sx = HALF + 1.4, sz = er - 1.3;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), new THREE.MeshBasicMaterial({ map: canvasTex(340, 170, (g, w, h) => { g.fillStyle = '#2f8f5a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#fff'; g.font = '900 78px system-ui'; g.textAlign = 'center'; g.fillText('출구 ▶', w / 2, 112); }) }));
  panel.position.set(sx, 1.45, sz); scene.add(panel);
  [-0.7, 0.7].forEach((d) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 10), new THREE.MeshStandardMaterial({ color: 0xdddddd })); p.position.set(sx + d, 0.75, sz - 0.02); scene.add(p); }); }
// 둘레 장식(덤불·나무)
function bush(x, z, s) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0x4fbf5a, roughness: 0.8 }); [[0, 0, 0, 1], [0.35, 0, 0.1, 0.75], [-0.3, 0, -0.1, 0.7]].forEach((p) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.4 * p[3], 14, 10), m); b.position.set(p[0] * s, 0.3 * p[3], p[2] * s); b.scale.setScalar(s); g.add(b); }); g.position.set(x, 0, z); scene.add(g); }
function tree(x, z, s) { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x9a6a3c })); t.position.y = 0.3; g.add(t); const m = new THREE.MeshStandardMaterial({ color: 0x6fd36a, roughness: 0.8 }); [[0, 0.9, 0.55], [0.18, 1.2, 0.4], [-0.15, 1.35, 0.3]].forEach((p) => { const b = new THREE.Mesh(new THREE.SphereGeometry(p[2], 14, 10), m); b.position.set(p[0] * 0.4, p[1] - 0.15, 0); g.add(b); }); g.scale.setScalar(s); g.position.set(x, 0, z); scene.add(g); }
[[-4.1, -3.6, 1.2], [-4.1, 3.6, 1], [3.9, -4.0, 1.1], [4.2, 4.2, 1.2], [0, -4.3, 1], [-1.8, 4.4, 1.1], [2.2, 4.7, 1], [6.2, -2.6, 1.2], [6.4, 1.8, 1]].forEach((p, i) => (i % 2 ? bush : tree)(p[0], p[2] > 1.15 ? p[1] : p[1], 1));
tree(-4.4, -1, 1.5); tree(-4.3, 2, 1.3); tree(7.2, -0.3, 1.4); tree(5.9, 3.8, 1.2); tree(5.8, -4.0, 1.3); bush(-4.2, 0.6, 1.2); bush(5.0, 2.6, 1.1); bush(-4, -4.1, 1.1);

/* ---------- 차 ---------- */
const matBlack = new THREE.MeshStandardMaterial({ color: 0x20222c, roughness: 0.7 }), matHub = new THREE.MeshStandardMaterial({ color: 0xc8cdd8, metalness: 0.6, roughness: 0.3 });
const matGlass = new THREE.MeshPhysicalMaterial({ color: 0x24407a, roughness: 0.08, metalness: 0.1, clearcoat: 1, emissive: 0x0a1a40, emissiveIntensity: 0.4 });
const matLamp = new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xffe066, emissiveIntensity: 0.9 }), matTail = new THREE.MeshStandardMaterial({ color: 0xff4a4a, emissive: 0xaa1010, emissiveIntensity: 0.6 });
const matSmile = new THREE.MeshStandardMaterial({ color: 0x2b1d1d, roughness: 0.6 });
function wheel(x, z) { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 18), matBlack); t.rotation.x = Math.PI / 2; g.add(t); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.108, 12), matHub); h.rotation.x = Math.PI / 2; g.add(h); g.position.set(x, 0.15, z); return g; }
function makeCar(n, color, isRed) {
  const g = new THREE.Group(), L = n - 0.16, W = 0.74;
  const body = new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, emissive: 0x000000 });
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  if (n === 2) {
    add(rbox(L, 0.3, W, 0.2, body), 0, 0.1, 0);
    const cl = L * 0.56; add(rbox(cl, 0.27, W * 0.86, 0.14, body), -0.05, 0.38, 0);
    add(rbox(cl * 0.97, 0.15, W * 0.9, 0.08, matGlass), -0.05, 0.46, 0); add(rbox(cl * 1.03, 0.15, W * 0.8, 0.08, matGlass), -0.05, 0.46, 0);
  } else {
    add(rbox(L, 0.26, W, 0.14, body), 0, 0.1, 0);
    const cab = 0.82; add(rbox(cab, 0.3, W * 0.92, 0.12, body), L / 2 - cab / 2, 0.34, 0);
    add(rbox(cab * 0.5, 0.15, W * 0.96, 0.07, matGlass), L / 2 - cab * 0.35, 0.44, 0); add(rbox(cab * 0.98, 0.14, W * 0.84, 0.06, matGlass), L / 2 - cab / 2, 0.44, 0);
    const cargo = new THREE.MeshPhysicalMaterial({ color: isRed ? color : 0xf4f1e8, roughness: 0.45, clearcoat: 0.4 });
    add(rbox(L - cab - 0.04, 0.52, W, 0.08, cargo), -L / 2 + (L - cab - 0.04) / 2, 0.3, 0);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(L - cab - 0.02, 0.1, W + 0.012), new THREE.MeshStandardMaterial({ color, roughness: 0.4 })); add(stripe, -L / 2 + (L - cab) / 2, 0.55, 0);
  }
  const wx = n === 2 ? [L / 2 - 0.3, -L / 2 + 0.3] : [L / 2 - 0.28, -L / 2 + 0.3, -L / 2 + 0.78];
  wx.forEach((x) => { add(wheel(0, 0), x, 0, W / 2 - 0.01); add(wheel(0, 0), x, 0, -W / 2 + 0.01); });
  [-0.22, 0.22].forEach((z) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), matLamp); s.scale.set(0.6, 1, 1); add(s, L / 2 - 0.01, 0.22, z); const t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.12), matTail); add(t, -L / 2 + 0.005, 0.24, z); });
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 14, Math.PI), matSmile); sm.rotation.set(0, Math.PI / 2, Math.PI); add(sm, L / 2 + 0.002, 0.2, 0); sm.scale.set(1, 0.8, 1);
  if (isRed) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 5), new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0xffa000, emissiveIntensity: 0.5 })); add(st, -0.05, 0.655, 0); }
  g.userData.body = body; return g;
}
const blobTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 4, 32, 32, 30); r.addColorStop(0, 'rgba(0,0,0,.4)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });

/* ---------- 상태 ---------- */
let cars = [], pos = [], views = [], hist = [], moves = 0, cfg = null, P = null, busy = true, over = false, stats = O.newStats(), runId = 0, sel = -1, drag = null, hintCar = -1, hintT = 0;
const carsG = new THREE.Group(), markG = new THREE.Group(); scene.add(carsG, markG);
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) { msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : ''); if (speak !== false) O.say(typeof speak === 'string' ? speak : text); }
const note = (t, k) => say(t, k, false);
const sleep = (ms) => new Promise((r) => setTimeout(r, calm() ? Math.min(ms, 80) : ms));
const tween = (ms, fn) => new Promise((res) => { const t0 = performance.now(), d = calm() ? Math.min(ms, 60) : ms; (function f(now) { const k = Math.min(1, (now - t0) / d); fn(k * k * (3 - 2 * k)); if (k < 1) requestAnimationFrame(f); else res(); })(t0); });

function carTransform(i, p, lift) {
  const c = cars[i], v = views[i], mid = p + c.len / 2 - HALF;
  if (c.dir === 'h') { v.g.position.set(mid, lift || 0, cx2w(c.y)); v.g.rotation.y = 0; } else { v.g.position.set(cx2w(c.x), lift || 0, mid); v.g.rotation.y = -Math.PI / 2; }
  v.blob.position.set(v.g.position.x, 0.01, v.g.position.z); v.blob.rotation.set(-Math.PI / 2, 0, c.dir === 'h' ? 0 : Math.PI / 2);
}
function loadPuzzle(level, idx) {
  carsG.clear(); markG.clear(); views = []; sel = -1; hintCar = -1;
  P = PUZZLES[level][idx]; cars = P.cars.map(([x, y, len, v]) => ({ x, y, len, dir: v ? 'v' : 'h' })); pos = cars.map(posOf); hist = []; moves = 0;
  let ci = 0;
  cars.forEach((c, i) => {
    const isRed = i === 0, col = isRed ? RED : PALETTE[(ci++ + level * 3 + idx) % PALETTE.length][0], nm = isRed ? '빨간' : PALETTE.find((p) => p[0] === col)[1];
    const g = makeCar(c.len, col, isRed), blob = new THREE.Mesh(new THREE.PlaneGeometry(c.len * 0.95, 0.95), blobMat);
    g.userData.car = i; scene.add(blob); carsG.add(g); views.push({ g, blob, name: nm + (c.len === 3 ? ' 트럭' : ' 차'), tr: c.len === 3, colorName: nm }); carTransform(i, pos[i]);
  });
}
function limitOf() { return cfg.mode === 'limit' ? P.min + Math.max(2, Math.ceil(P.min * 0.4)) : 0; }

/* ---------- 게임 흐름 ---------- */
function newGame(c) {
  runId++; $('menu').hidden = true; cfg = Object.assign({}, c); over = false; busy = true; stats = O.newStats();
  loadPuzzle(cfg.level, cfg.idx); $('modeLabel').textContent = '수준 ' + cfg.level + ' · ' + (cfg.idx + 1) + '번 문제' + (cfg.mode === 'limit' ? ' · 횟수 도전' : '');
  busy = false; renderInfo(); updateButtons();
  say(cfg.mode === 'limit' ? '빨간 차를 ' + limitOf() + '번 안에 내보내요!' : '빨간 차를 오른쪽 출구로 내보내요!', null, cfg.mode === 'limit' ? '빨간 차를 ' + limitOf() + '번 안에 출구로 내보내요.' : '빨간 차를 출구로 내보내요.');
}
function renderInfo() {
  const lim = limitOf(), left = lim ? lim - moves : 0;
  $('info').innerHTML = '<div class="rh-chip' + (lim && left <= 1 ? ' warn' : '') + '"><small>움직임</small><b>' + moves + (lim ? ' / ' + lim : '') + '</b></div><div class="rh-chip"><small>가장 적게</small><b>' + P.min + '번</b></div>';
}
function updateButtons() { $('btnUndo').disabled = busy || over || !hist.length; $('btnHint').disabled = busy || over; $('btnReset').disabled = busy; }
function clearSel() { sel = -1; markG.clear(); }
const markMat = new THREE.MeshBasicMaterial({ color: 0x35d072, transparent: true, opacity: 0.85, depthTest: false });
function showTargets(i) {
  markG.clear(); const c = cars[i], [lo, hi] = range(cars, pos, i);
  for (let q = lo; q <= hi; q++) { if (q === pos[i]) continue; const head = q > pos[i] ? q + c.len - 1 : q; const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.34, 28), markMat); m.rotation.x = -Math.PI / 2; m.renderOrder = 10; m.userData = { car: i, to: q };
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), markMat); dot.rotation.x = -Math.PI / 2; dot.renderOrder = 10; dot.userData = m.userData; dot.position.set(0, 0.002, 0); m.add(dot);
    if (c.dir === 'h') m.position.set(cx2w(head), 0.06, cx2w(c.y)); else m.position.set(cx2w(c.x), 0.06, cx2w(head)); markG.add(m); }
}
function select(i) { if (sel === i) { clearSel(); return; } sel = i; showTargets(i); O.sfx('tick'); const [lo, hi] = range(cars, pos, i); note(lo === hi ? '이 차는 지금 움직일 수 없어요. 다른 차를 먼저 비켜 줘요.' : views[i].name + ' 가 갈 수 있는 곳은 초록 동그라미예요.'); }
async function commitMove(i, to, animate) {
  if (to === pos[i]) { carTransform(i, pos[i]); return; }
  busy = true; clearSel(); hintCar = -1; updateButtons();
  const rid = runId, from = pos[i], cur = views[i].cp !== undefined ? views[i].cp : from;
  hist.push(pos.slice()); pos[i] = to; moves++; stats.asked++; O.sfx('pop'); renderInfo();
  if (animate !== false) await tween(Math.min(380, 120 + Math.abs(to - cur) * 70), (k) => { const p = cur + (to - cur) * k; views[i].cp = p; carTransform(i, p); });
  views[i].cp = undefined; carTransform(i, to); if (rid !== runId) return;
  await afterMove();
}
async function afterMove() {
  const rid = runId;
  if (solved(pos)) return win();
  const lim = limitOf();
  if (lim && moves >= lim) return lose();
  if (lim && lim - moves <= 2) note('남은 횟수 ' + (lim - moves) + '번!', 'warn');
  busy = false; updateButtons();
}
function undo() {
  if (busy || over || !hist.length) return; O.unlock(); pos = hist.pop(); moves = Math.max(0, moves - 1); clearSel(); hintCar = -1; O.sfx('tick');
  cars.forEach((c, j) => { views[j].cp = undefined; carTransform(j, pos[j]); }); renderInfo(); updateButtons(); note('한 수 물렸어요.');
}
async function win() {
  const rid = runId; over = true; busy = true; updateButtons(); O.sfx('win');
  const red = views[0]; const p0 = pos[0];
  say('출구로 나가요!', 'good', '빨간 차가 출구로 나가요!');
  await tween(900, (k) => { carTransform(0, p0 + k * 5); });
  views[0].g.visible = false; views[0].blob.visible = false; if (rid !== runId) return;
  const min = P.min, stars = moves <= min ? 3 : moves <= Math.ceil(min * 1.5) + 1 ? 2 : 1, st = stars;
  const save = loadSave(); const key = cfg.level + ':' + cfg.idx; const old = save.best[key]; save.best[key] = old ? Math.min(old, moves) : moves; save.stars[key] = Math.max(save.stars[key] || 0, stars); save.done[key] = 1; writeSave(save);
  const title = moves <= min ? '가장 적게 내보냈어요!' : '탈출 성공!', text = moves + '번 움직였어요. 가장 적은 횟수는 ' + min + '번이에요.';
  const speak = moves <= min ? '와! 가장 적게 움직였어요. 대단해요!' : '탈출 성공! ' + moves + '번 움직였어요. 잘했어요!';
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(주차장 탈출)', school: 'elem', topic: '주차장 탈출', level: cfg.level, engine: 'rushhour',
    rounds: moves, mistakes: Math.max(0, moves - min), glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const n = PUZZLES[cfg.level].length, again = () => newGame(cfg), btns = [];
  if (cfg.idx + 1 < n) btns.push({ label: '➡ 다음 문제', color: 'green', onClick: () => newGame(Object.assign({}, cfg, { idx: cfg.idx + 1 })) });
  else if (cfg.level < 5) btns.push({ label: '⬆ 다음 수준 (' + (cfg.level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, cfg.level + 1); newGame(Object.assign({}, cfg, { level: cfg.level + 1, idx: 0 })); } });
  btns.push({ label: '🔁 다시 해 보기', color: 'blue', onClick: again }, { label: '☰ 문제 고르기', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 400);
}
function lose() {
  const rid = runId; over = true; busy = true; updateButtons(); O.sfx('no');
  say('횟수를 다 썼어요. 다시 해 볼까요?', 'warn', '횟수를 다 썼어요. 괜찮아요. 다시 해 봐요!'); stats.mistakes++;
  setTimeout(() => { if (rid !== runId) return; O.finish({ stats, entry: { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(주차장 탈출)', school: 'elem', topic: '주차장 탈출', level: cfg.level, engine: 'rushhour', rounds: moves, mistakes: 1, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) }, stars: 1, title: '아쉬워요, 다시 해 봐요!', text: '가장 적게는 ' + P.min + '번에 내보낼 수 있어요.', speak: '아쉬워요. 다시 해 봐요!', mission: { lesson: 1 }, buttons: [{ label: '🔁 다시 해 보기', color: 'green', onClick: () => newGame(cfg) }, { label: '🧩 퍼즐로 해 보기', color: 'orange', onClick: () => newGame(Object.assign({}, cfg, { mode: 'puzzle' })) }, { label: '☰ 문제 고르기', color: 'blue', onClick: () => openMenu(true) }] }); }, 700);
}

/* ---------- 힌트 ---------- */
function hint() {
  if (busy || over) return; O.unlock(); clearSel();
  const sol = solve(cars, pos); if (!sol || !sol.length) { say('힌트를 찾지 못했어요. 다시 해 봐요.'); return; }
  const [i, to] = sol[0], c = cars[i], d = to - pos[i], n = Math.abs(d), dirWord = c.dir === 'h' ? (d > 0 ? '오른쪽으로' : '왼쪽으로') : (d > 0 ? '아래로' : '위로');
  const fix = views[i].name + '를 ' + dirWord + ' ' + n + '칸 옮겨요!';
  say(fix, null, fix); hintCar = i; hintT = performance.now() + 5000; stats.asked++;
  showTargets(i); markG.children.forEach((m) => { if (m.userData.to !== to) m.visible = false; });
}

/* ---------- 입력 ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
function setRay(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
function pickCar(e) { setRay(e); const hits = ray.intersectObjects(carsG.children, true); for (const h of hits) { let o = h.object; while (o && o.userData.car === undefined) o = o.parent; if (o) return o.userData.car; } return -1; }
function pickMark(e) { setRay(e); const hits = ray.intersectObjects(markG.children, true); for (const h of hits) { let o = h.object; while (o && !o.userData.to && o.userData.to !== 0) o = o.parent; if (o && o.userData.car !== undefined) return o.userData; } return null; }
canvas.addEventListener('pointerdown', (e) => {
  O.unlock(); if (busy || over || !cfg) return;
  const mk = pickMark(e); if (mk) { commitMove(mk.car, mk.to); return; }
  const i = pickCar(e); if (i < 0) { clearSel(); return; }
  setRay(e); const pt = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, pt)) return;
  const c = cars[i], u = c.dir === 'h' ? pt.x + HALF : pt.z + HALF; const [lo, hi] = range(cars, pos, i);
  drag = { id: e.pointerId, i, sx: e.clientX, sy: e.clientY, moved: false, off: u - (pos[i] + c.len / 2), lo, hi, p: pos[i] }; try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 9) { drag.moved = true; clearSel(); }
  if (!drag.moved) return;
  setRay(e); const pt = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, pt)) return;
  const c = cars[drag.i], u = c.dir === 'h' ? pt.x + HALF : pt.z + HALF; let p = u - drag.off - c.len / 2; p = Math.max(drag.lo, Math.min(drag.hi, p)); drag.p = p; views[drag.i].cp = p; carTransform(drag.i, p, 0.06);
});
function endDrag(e, cancel) {
  if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null;
  if (cancel) { views[d.i].cp = undefined; carTransform(d.i, pos[d.i]); return; }
  if (!d.moved) { select(d.i); return; }
  const to = Math.round(d.p); views[d.i].cp = d.p;
  if (to === pos[d.i]) { tween(120, (k) => carTransform(d.i, d.p + (pos[d.i] - d.p) * k)).then(() => { views[d.i].cp = undefined; carTransform(d.i, pos[d.i]); }); return; }
  commitMove(d.i, to);
}
canvas.addEventListener('pointerup', (e) => endDrag(e, false));
canvas.addEventListener('pointercancel', (e) => endDrag(e, true));
$('btnUndo').onclick = undo; $('btnHint').onclick = hint;
$('btnReset').onclick = () => { O.unlock(); if (cfg) newGame(cfg); };
$('btnMenu').onclick = () => { O.unlock(); openMenu(false); };
$('btnHelp').onclick = () => { O.unlock(); const d = $('helpDialog'); if (d.showModal) d.showModal(); };
(function voice() {
  const b = $('btnVoice'); const show = () => { const on = O.settings().voice; b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on); };
  b.onclick = () => { const on = !O.settings().voice; O.saveSetting('voice', on); O.saveSetting('explain', on); if (!on) O.hush(); show(); O.unlock(); if (on) O.say('안내 음성을 켰어요.'); else O.sfx('tick'); };
  show();
})();

/* ---------- 저장·메뉴 ---------- */
function loadSave() { try { const s = JSON.parse(localStorage.getItem('oks_rush_v1') || '{}'); return { done: s.done || {}, best: s.best || {}, stars: s.stars || {} }; } catch (e) { return { done: {}, best: {}, stars: {} }; } }
function writeSave(s) { try { localStorage.setItem('oks_rush_v1', JSON.stringify(s)); } catch (e) {} }
const prefs = (() => { const d = { mode: 'puzzle' }; try { return Object.assign(d, JSON.parse(localStorage.getItem('oks_rush_prefs_v1') || '{}')); } catch (e) { return d; } })();
function savePrefs() { try { localStorage.setItem('oks_rush_prefs_v1', JSON.stringify(prefs)); } catch (e) {} }
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  const sv = loadSave(), sel2 = { mode: prefs.mode, level: Math.min(5, Math.max(1, O.levelFor(LESSON))) };
  const chip = (k, v, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + k + '="' + v + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    const arr = PUZZLES[sel2.level], doneN = arr.filter((_, i) => sv.done[sel2.level + ':' + i]).length, nextIdx = Math.max(0, arr.findIndex((_, i) => !sv.done[sel2.level + ':' + i]));
    el.innerHTML = '<div class="ch-card"><h1>🚗 주차장 탈출</h1><p>빨간 차를 출구로 내보내요.</p><div class="ch-modes rh-modes">' +
      Object.keys(MODES).map((k) => '<button type="button" class="ch-mode' + (sel2.mode === k ? ' on' : '') + '" data-mode="' + k + '"><i>' + MODES[k][0] + '</i><b>' + MODES[k][1] + '</b><span>' + MODES[k][2] + '</span></button>').join('') + '</div>' +
      '<div class="ch-row"><label>수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('lv', l, l, LEVEL_NAME[l], sel2.level === l)).join('') + '</div>' +
      '<div class="ch-row"><label>문제 고르기 (' + doneN + '/' + arr.length + ' 해결)</label></div><div class="rh-nums">' + arr.map((p, i) => { const k = sel2.level + ':' + i, d = sv.done[k]; return '<button type="button" data-idx="' + i + '" class="' + (d ? 'done' : '') + '">' + (i + 1) + '<span class="st">' + (d ? '⭐'.repeat(sv.stars[k] || 1) : '') + '</span></button>'; }).join('') + '</div>' +
      '<button type="button" class="ch-go" id="goBtn">' + (doneN ? '이어서 하기 (' + (nextIdx + 1) + '번)' : '시작!') + '</button>' + (cfg && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { sel2.mode = b.dataset.mode; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => { sel2.level = +b.dataset.lv; render(); }; });
    el.querySelectorAll('[data-idx]').forEach((b) => { b.onclick = () => start(+b.dataset.idx); });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => start(nextIdx);
  }
  function start(idx) { O.unlock(); prefs.mode = sel2.mode; savePrefs(); O.rememberLevel(LESSON, sel2.level); el.hidden = true; newGame({ mode: sel2.mode, level: sel2.level, idx }); }
  render(); O.say('주차장 탈출이에요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 카메라·그리기 ---------- */
function resize() {
  const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const hudTop = h < 720 ? 190 : 215, hudBot = 80, avail = Math.max(260, h - hudTop - hudBot);
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, pitch = THREE.MathUtils.degToRad(h > w ? 56 : 47);
  const needW = h > w ? 9.4 : 10.6, needH = 7.2;                         // 보여야 할 가로(출구 길 포함)·세로
  const distW = needW / 2 / (Math.tan(vf) * camera.aspect), distH = (needH / 2) * Math.sin(pitch) / Math.tan(vf) / (avail / h) + 0.5;
  const dist = Math.max(distW, distH * 1.0, 9);
  const cxw = h > w ? 1.15 : 1.0;
  camera.position.set(cxw, Math.sin(pitch) * dist, Math.cos(pitch) * dist + 0.2); camera.lookAt(cxw, 0, 0.2);
  camera.setViewOffset(w, h, 0, -(hudTop - hudBot) / 2, w, h); camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
let lastT = performance.now();
function frame(now) {
  lastT = now;
  if (hintCar >= 0 && views[hintCar]) { const k = 0.5 + Math.sin(now / 160) * 0.5; views[hintCar].g.userData.body.emissive.setRGB(0.55 * k, 0.45 * k, 0.05 * k); if (now > hintT) { views[hintCar].g.userData.body.emissive.setRGB(0, 0, 0); hintCar = -1; markG.children.forEach((m) => { m.visible = true; }); if (sel < 0) markG.clear(); } }
  else views.forEach((v, i) => { const e = v.g.userData.body.emissive; if (i === sel) e.setRGB(0.25, 0.22, 0.02); else if (e.r > 0) e.setRGB(0, 0, 0); });
  markG.children.forEach((m) => { const s = 1 + Math.sin(now / 200) * 0.1; m.scale.setScalar(s); });
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
(function boot() {
  resize(); requestAnimationFrame(frame); $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
  say('놀이를 골라 주세요.', null, false); openMenu(true);
})();

/* 시험용 손잡이 */
window.__rush = {
  state: () => ({ cfg, pos: pos.slice(), moves, busy, over, sel, min: P && P.min, n: cars.length }), start: newGame, solve: () => solve(cars, pos), cars: () => cars,
  move: (i, to) => commitMove(i, to), over: () => over, busy: () => busy, openMenu, hint, undo
};
