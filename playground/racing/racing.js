/* 옥쌤의 즐거운 교실 — 스피드 레이스 (놀이별 보드게임 · 아스팔트 풍 3D 자동차 경주)
   three.js(vendor/three). 차 모델 2대는 OUTPISTON 님의 작품(CC BY-NC-SA 4.0, 수정 없이 사용).
   길은 track.js 가 만든 외길. 차는 '길 위의 위치(s, d)'로 움직여요(아케이드 물리). 다치거나 지는 벌칙 없이 순위만 보여 줘요. */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';
import { makeTrack } from './track.js';
import { buildToyCar, TOY_COLORS } from './toycar.js';

const O = window.OKS;
const $ = (id) => document.getElementById(id);
const LESSON = 'play-racing';
const W = 8;                       // 길 폭의 절반(m)
const SAVE_KEY = 'oks_race_v1';

const CARS = [
  { id: 'toy', build: true, colors: true, name: '꼬마 스포츠카', sub: '카툰 · 웃는 얼굴 친구', title: '', src: '', front: 1, vmax: 60, acc: 26, lat: 12, nmul: 1.3, stats: [3, 5, 4, 4] },
  { id: 'rx7', file: 'assets/rx7.glb', name: '마쓰다 RX-7', sub: '2002 · 일본 스포츠카', title: '2002 Mazda RX-7 Spirit-R', src: 'https://sketchfab.com/3d-models/2002-mazda-rx-7-spirit-r-277e2569280d4c9fa3bc3a85bbc627f1', front: 1, vmax: 56, acc: 24, lat: 12.5, nmul: 1.3, stats: [3, 4, 5, 3] },
  { id: 'm720', file: 'assets/mclaren720s.glb', name: '맥라렌 720S GT3', sub: '2019 · 영국 레이싱카', title: '2019 McLaren 720S GT3', src: 'https://sketchfab.com/3d-models/2019-mclaren-720s-gt3-cdf4ca67a56b497493931e8852e70b05', front: 1, vmax: 70, acc: 19, lat: 10.5, nmul: 1.26, stats: [5, 3, 3, 4] },
];
const STAT_NAMES = ['최고 속도', '가속', '핸들', '니트로'];
const COURSES = [
  { id: 'meadow', name: '초록 숲길', emoji: '🌲', seed: 11, length: 3200, sky: ['#4aa8ff', '#d9f0ff'], fog: 0xd5ecff, ground: 0x6fbf5a, bank: 0x5aa84a, tree: 'pine', leaf: 0x2f8f4a },
  { id: 'desert', name: '노을 사막길', emoji: '🌵', seed: 23, length: 3600, sky: ['#ff8f5a', '#ffe6b8'], fog: 0xffdcaa, ground: 0xe6bb78, bank: 0xd2a35f, tree: 'cactus', leaf: 0x4b9a4a },
  { id: 'snow', name: '눈 덮인 길', emoji: '⛄', seed: 35, length: 3400, sky: ['#8fbbe6', '#f0f7ff'], fog: 0xe8f2fb, ground: 0xf3f8fc, bank: 0xdfe9f3, tree: 'pine', leaf: 0x3d7a68, snow: true },
];
const DIFFS = [{ id: 0, name: '여유롭게', pace: 0.8 }, { id: 1, name: '보통', pace: 0.9 }, { id: 2, name: '도전!', pace: 0.99 }];
const AI_COLORS = ['#ff7a2e', '#3d8bff', '#39c46a'];

/* ---------- 저장 ---------- */
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); return { best: s.best || {}, done: s.done || {}, prefs: Object.assign({ car: 0, course: 0, diff: 1, assist: 1, color: 0 }, s.prefs || {}) }; } catch (e) { return { best: {}, done: {}, prefs: { car: 0, course: 0, diff: 1, assist: 1, color: 0 } }; } }
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
const save = loadSave();
const prefs = save.prefs;
const fmtT = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };

/* ---------- 렌더러·공통 ---------- */
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const camera = new THREE.PerspectiveCamera(40, 1, 0.2, 900);
const rnd0 = (sd) => () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);

function canvasTex(w, h, draw, repeat) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; }
function gradTex(a, b) { const t = canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }
// 반사용 하늘(스튜디오 조명 느낌): 직접 그려서 PMREM 으로 변환
const envMap = (() => {
  const t = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fb6ff'); gr.addColorStop(0.5, '#eaf4ff'); gr.addColorStop(0.52, '#8a8f98'); gr.addColorStop(1, '#4b4f57'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.95)'; [[40, 30, 90, 26], [200, 22, 110, 20], [360, 34, 80, 24], [450, 20, 50, 40]].forEach((r) => g.fillRect(r[0], r[1], r[2], r[3]));
  });
  t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer), rt = pm.fromEquirectangular(t); pm.dispose(); return rt.texture;
})();

/* ---------- 자동차 모델 ---------- */
const protos = {};
function prepareModel(gltf, def) {
  const holder = new THREE.Group(); holder.add(gltf.scene); holder.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(holder), c = box.getCenter(new THREE.Vector3());
  gltf.scene.position.set(-c.x, -box.min.y, -c.z); holder.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(holder); const size = box.getSize(new THREE.Vector3());
  const meshes = []; holder.traverse((o) => { if (o.isMesh) { meshes.push(o); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.42; m.depthWrite = false; m.roughness = 0.08; } m.envMapIntensity = 1; }); } });
  const matName = (o) => ((Array.isArray(o.material) ? o.material[0] : o.material).name || '').toLowerCase();
  const info = meshes.map((m) => { const b = new THREE.Box3().setFromObject(m); return { m, b, c: b.getCenter(new THREE.Vector3()), s: b.getSize(new THREE.Vector3()), n: matName(m) }; });
  const tyres = info.filter((i) => i.n.includes('tyre')); const wheels = [];
  tyres.forEach((t, k) => {
    const steer = new THREE.Group(), spin = new THREE.Group(); steer.name = 'wh' + k + '_s'; spin.name = 'wh' + k + '_r'; steer.position.copy(t.c); holder.add(steer); steer.add(spin); steer.updateMatrixWorld(true);
    info.forEach((i) => { if (i.used) return; const near = i.c.distanceTo(t.c) < 0.45 && Math.max(i.s.x, i.s.y, i.s.z) < 0.75; const isW = i.n.includes('tyre') ? i === t : (i.n.includes('wheel') || i.n.includes('rotor') || i.n.includes('misc')); if (near && isW) { i.used = true; spin.attach(i.m); } });
    wheels.push({ s: steer.name, r: spin.name, front: t.c.z * def.front > 0 });
  });
  protos[def.id] = { holder, wheels, len: size.z, wid: size.x, hgt: size.y };
}
function loadModels(onProg) {
  const loader = new GLTFLoader(); let done = 0; const list = CARS.filter((d) => d.file);
  return Promise.all(list.map((def) => new Promise((res, rej) => loader.load(new URL(def.file, import.meta.url).href, (g) => { prepareModel(g, def); onProg(++done / list.length); res(); }, undefined, rej))));
}
const blobTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }), flameMat2 = new THREE.MeshBasicMaterial({ color: 0x8fe6ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
function makeCarObject(def, colorIdx) {
  let model, wl, len, wid;
  if (def.build) { const b = buildToyCar(THREE, TOY_COLORS[(colorIdx || 0) % TOY_COLORS.length][0]); model = b.group; wl = b.wheels; len = b.len; wid = b.wid; }
  else { const p = protos[def.id]; model = p.holder.clone(true); wl = p.wheels; len = p.len; wid = p.wid; }
  model.rotation.y = def.front < 0 ? Math.PI : 0;
  const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt); tilt.add(model);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(wid * 1.9, len * 1.35), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; tilt.add(blob);
  const flame = new THREE.Group(); for (const sx of [-0.4, 0.4]) { const g = new THREE.ConeGeometry(0.16, 1.5, 10); g.rotateX(def.front > 0 ? -Math.PI / 2 : Math.PI / 2); const m = new THREE.Mesh(g, flameMat); m.position.set(sx, 0.5, -def.front * (len / 2 + 0.7)); flame.add(m); const g2 = new THREE.ConeGeometry(0.08, 0.9, 8); g2.rotateX(def.front > 0 ? -Math.PI / 2 : Math.PI / 2); const m2 = new THREE.Mesh(g2, flameMat2); m2.position.set(sx, 0.5, -def.front * (len / 2 + 0.45)); flame.add(m2); } flame.visible = false; tilt.add(flame);
  const wheels = wl.map((w) => ({ s: model.getObjectByName(w.s), r: model.getObjectByName(w.r), front: w.front }));
  return { root, tilt, model, wheels, flame, def, len };
}
function animWheels(o, dist, steer) { const a = dist / 0.32 * o.def.front; o.wheels.forEach((w) => { w.r.rotation.x += a; if (w.front) w.s.rotation.y = -steer * 0.42; }); }

/* ---------- 차고 장면 ---------- */
const gScene = new THREE.Scene(); gScene.background = gradTex('#2c3f7a', '#121a33'); gScene.environment = envMap; gScene.environmentIntensity = 0.9;
gScene.add(new THREE.HemisphereLight(0xbfd4ff, 0x20243a, 0.9));
{ const k = new THREE.DirectionalLight(0xfff1dd, 2.4); k.position.set(-4, 7, 5); gScene.add(k); const r1 = new THREE.DirectionalLight(0x6ab0ff, 1.8); r1.position.set(6, 3, -5); gScene.add(r1); const r2 = new THREE.DirectionalLight(0xff9d6a, 1.2); r2.position.set(-6, 2, -4); gScene.add(r2); }
const turn = new THREE.Group(); gScene.add(turn);
{ const base = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.22, 64), new THREE.MeshStandardMaterial({ color: 0x2a3252, roughness: 0.55, metalness: 0.3 })); base.position.y = -0.11; gScene.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.06, 12, 96), new THREE.MeshBasicMaterial({ color: 0xffb347 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.01; gScene.add(ring);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(120,170,255,.45)'); gr.addColorStop(1, 'rgba(120,170,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = -0.24; gScene.add(glow);
  const stage = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0x1a2038, roughness: 0.9 })); stage.rotation.x = -Math.PI / 2; stage.position.y = -0.25; gScene.add(stage); }
let gCar = null, gYaw = 0.6, gSpin = 0.35, gPop = 1, gDrag = null, gIdx = 0;
function showGarageCar(i) {
  gIdx = (i + CARS.length) % CARS.length; prefs.car = gIdx; writeSave();
  if (gCar) { turn.remove(gCar.root); } gCar = makeCarObject(CARS[gIdx], prefs.color); turn.add(gCar.root); gPop = 0; renderGarageInfo();
}

/* ---------- 경기 장면 ---------- */
let rScene = null, track = null, course = null, orbs = [], gates = [], groundM = null, sunL = null;
function disposeScene(sc) { if (!sc) return; sc.traverse((o) => { if (o.geometry && !o.userData.keep) o.geometry.dispose(); }); }
function ribbon(tr, s0, s1, step, secFn, mat, vscale) {
  const pos = [], uv = [], idx = [], nR = Math.floor((s1 - s0) / step) + 1; let cols = 0;
  for (let r = 0; r < nR; r++) { const s = s0 + r * step, a = tr.at(s), sec = secFn(a); cols = sec.length; sec.forEach((q) => { pos.push(a.x + a.nx * q[0], a.y + q[1], a.z + a.nz * q[0]); uv.push(q[2] === undefined ? 0 : q[2], s / vscale); }); }
  for (let r = 0; r < nR - 1; r++) for (let i = 0; i < cols - 1; i++) { const a = r * cols + i, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const roadTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4b5060'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3500; i++) { const v = 60 + Math.random() * 60; g.fillStyle = `rgba(${v},${v},${v + 8},${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.fillStyle = '#f4f4f4'; g.fillRect(w * 0.03, 0, 7, h); g.fillRect(w * 0.97 - 7, 0, 7, h);
  g.fillStyle = '#ffd34d'; g.fillRect(w * 0.5 - 4, 0, 8, h * 0.5);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(w * 0.25 - 3, 0, 6, h * 0.45); g.fillRect(w * 0.75 - 3, 0, 6, h * 0.45);
}, true);
const curbTex = canvasTex(32, 64, (g, w, h) => { g.fillStyle = '#e5392d'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#fff'; g.fillRect(0, h / 2, w, h / 2); }, true);
function makeGate(tr, s, text) {
  const a = tr.at(s), g = new THREE.Group(); g.position.set(a.x, a.y, a.z); g.rotation.y = Math.atan2(a.tx, a.tz);
  const postM = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 });
  for (const sx of [-W - 1.2, W + 1.2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.5, 0.7), postM); p.position.set(sx, 3.75, 0); g.add(p); }
  const banner = new THREE.Mesh(new THREE.BoxGeometry(2 * W + 3, 2.1, 0.5), [postM, postM, postM, postM, new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (c, w, h) => { const q = 24; for (let y = 0; y < 4; y++) for (let x = 0; x < w / q; x++) { c.fillStyle = (x + y) % 2 ? '#222' : '#fff'; c.fillRect(x * q, y * q, q, q); } c.fillStyle = '#e5392d'; c.fillRect(0, 0, 0, 0); }) }), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#e5392d'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '900 64px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 4); }) })]);
  banner.position.set(0, 7.2, 0); g.add(banner); return g;
}
function buildRace(co) {
  disposeScene(rScene); const sc = new THREE.Scene(); rScene = sc; course = co; sc.background = gradTex(co.sky[0], co.sky[1]); sc.fog = new THREE.Fog(co.fog, 90, 560); sc.environment = envMap; sc.environmentIntensity = 0.75;
  sc.add(new THREE.HemisphereLight(0xffffff, co.ground, 1.25)); sunL = new THREE.DirectionalLight(0xfff3dd, 2.1); sunL.position.set(-40, 80, 30); sc.add(sunL);
  track = makeTrack(co.seed, co.length); const L = co.length;
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9, side: THREE.DoubleSide }); roadTex.repeat.set(1, 1);
  const road = ribbon(track, 0, L - 0.5, 3, () => [[-W, 0.0, 0], [W, 0.0, 1]], roadMat, 16); sc.add(road);
  const cm = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.7, side: THREE.DoubleSide });
  sc.add(ribbon(track, 0, L - 0.5, 3, () => [[W, 0.04, 0], [W + 1.3, 0.04, 1]], cm, 3), ribbon(track, 0, L - 0.5, 3, () => [[-W - 1.3, 0.04, 0], [-W, 0.04, 1]], cm, 3));
  const bm = new THREE.MeshStandardMaterial({ color: co.bank, roughness: 1, side: THREE.DoubleSide });
  const ext = (a) => Math.max(2, (a.y + 0.35) * 1.8);
  sc.add(ribbon(track, 0, L - 0.5, 3, (a) => [[W + 1.3, 0.02, 0], [W + 1.3 + ext(a), -a.y - 0.35, 1]], bm, 8), ribbon(track, 0, L - 0.5, 3, (a) => [[-W - 1.3 - ext(a), -a.y - 0.35, 0], [-W - 1.3, 0.02, 1]], bm, 8));
  groundM = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: co.ground, roughness: 1 })); groundM.rotation.x = -Math.PI / 2; groundM.position.y = -0.36; sc.add(groundM);
  // 나무·선인장 (길에서 떨어진 곳에만)
  const R = rnd0(co.seed * 7 + 1), pts = track.P;
  const items = []; for (let i = 0; i < 1500 && items.length < 650; i++) { const s = R() * L, a = track.at(s), side = R() < 0.5 ? -1 : 1, lat = side * (W + 3.5 + ext(a) + (R() < 0.5 ? R() * 12 : R() * 70)); const x = a.x + a.nx * lat, z = a.z + a.nz * lat; const dmin = (() => { let m = 1e9; for (let j = 0; j < pts.length; j++) { const dx = pts[j][0] - x, dz = pts[j][1] - z, d2 = dx * dx + dz * dz; if (d2 < m) m = d2; } return Math.sqrt(m); })(); if (dmin < W + 4.5) continue; items.push({ x, z, sc: 0.8 + R() * 1.1, ry: R() * 6.28 }); }
  const parts = co.tree === 'cactus'
    ? [{ g: new THREE.CylinderGeometry(0.35, 0.42, 4, 8), c: co.leaf, y: 2 }, { g: new THREE.CylinderGeometry(0.22, 0.22, 1.4, 8), c: co.leaf, y: 2.4, x: 0.7 }, { g: new THREE.CylinderGeometry(0.22, 0.22, 1.2, 8), c: co.leaf, y: 1.8, x: -0.7 }]
    : [{ g: new THREE.CylinderGeometry(0.3, 0.4, 1.8, 7), c: 0x7a5232, y: 0.9 }, { g: new THREE.ConeGeometry(1.9, 3.6, 8), c: co.leaf, y: 3.2 }, { g: new THREE.ConeGeometry(1.4, 3, 8), c: co.leaf, y: 5 }].concat(co.snow ? [{ g: new THREE.ConeGeometry(0.8, 1.4, 8), c: 0xffffff, y: 6.2 }] : []);
  const tm = new THREE.Matrix4(), pm2 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  parts.forEach((pt) => { const im = new THREE.InstancedMesh(pt.g, new THREE.MeshStandardMaterial({ color: pt.c, roughness: 0.9 }), items.length); im.userData.keep = false;
    items.forEach((it, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.ry); sv.setScalar(it.sc); pv.set(it.x, -0.36, it.z); tm.compose(pv, q, sv); pm2.makeTranslation(pt.x || 0, pt.y, 0); tm.multiply(pm2); im.setMatrixAt(i, tm); }); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; sc.add(im); });
  gates = [makeGate(track, 14, '출발!'), makeGate(track, L - 40, '결승!')]; gates.forEach((g) => sc.add(g));
  // 파란 구슬(니트로)
  orbs = []; const Rr = rnd0(co.seed * 13 + 5), om = new THREE.MeshStandardMaterial({ color: 0x3dc0ff, emissive: 0x1a8cff, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.2 }), og = new THREE.IcosahedronGeometry(0.7, 1);
  for (let s = 140; s < L - 120;) { const d0 = (Rr() * 2 - 1) * (W - 2.8), n = Rr() < 0.4 ? 3 : 1; for (let k = 0; k < n; k++) { const m = new THREE.Mesh(og, om); m.userData = { s: s + k * 11, d: d0, on: true, k: 1 }; sc.add(m); orbs.push(m); } s += 70 + Rr() * 110 + n * 11; }
}

/* ---------- 달리는 차들 ---------- */
let racers = [], player = null, mode = 'boot', raceT = 0, cdT = 0, cdShown = -1, finishOrder = [], camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camFov = 60, shake = 0, runId = 0, bumps = 0, nOrbs = 0, resultTimer = 0, finishS = 0;
const keys = { L: false, R: false, B: false, N: false };
const hud = { rank: -1, speed: -1, time: '', nitro: -1 };
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) { msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : ''); if (speak !== false) O.say(typeof speak === 'string' ? speak : text); }
const note = (t) => say(t, null, false);

function newRacer(def, isPlayer, slot, idx, colorIdx) {
  const o = makeCarObject(def, colorIdx); rScene.add(o.root);
  const r = Object.assign(o, { isPlayer, s: slot.s, d: slot.d, v: 0, dd: 0, u: 0, yaw: 0, nitro: isPlayer ? 0.35 : 0, nOn: false, brake: false, finished: false, fT: 0, wallCd: 0, hitCd: 0, tgtD: slot.d, tgtT: 2 + Math.random() * 2, wob: Math.random() * 6, idx, aiV: 0, travel: 0 });
  return r;
}
function startRace() {
  O.unlock(); runId++; $('garage').hidden = true; $('hud').hidden = false; $('pad').hidden = false; $('count').hidden = false;
  const co = COURSES[prefs.course]; buildRace(co);
  racers = []; const slots = [{ s: 8, d: 2.6 }, { s: 8, d: -2.6 }, { s: 0, d: 2.6 }, { s: 0, d: -2.6 }];
  const pdef = CARS[prefs.car]; player = newRacer(pdef, true, slots[0], 0, prefs.color); racers.push(player);
  for (let i = 0; i < 3; i++) { const r = newRacer(CARS[(i + (prefs.car + 1)) % CARS.length], false, slots[i + 1], i + 1, (prefs.color + 1 + i * 2) % TOY_COLORS.length); r.pace = DIFFS[prefs.diff].pace * (0.95 + i * 0.035); r.name = AI_COLORS[i]; racers.push(r); }
  // 진행 막대 점
  const pr = $('hudProg'); pr.querySelectorAll('u').forEach((u) => u.remove()); racers.slice(1).forEach((r, i) => { const u = document.createElement('u'); u.style.background = AI_COLORS[i]; r.dot = u; pr.appendChild(u); });
  finishOrder = []; raceT = 0; bumps = 0; nOrbs = 0; finishS = co.length - 40; mode = 'count'; cdT = 3.6; cdShown = -1; hud.rank = hud.speed = hud.nitro = -1; hud.time = '';
  racers.forEach((r) => placeCar(r, 0.016, true)); camPos.set(0, 0, 0); snapCamera(); $('btnMenu').textContent = '🚗 차고';
  say('준비! 방향 버튼으로 달려요.', null, '준비하세요!'); startEngine(); simulate(0); updateHud(true);
}
function stepRacer(r, dt) {
  const a = track.at(r.s), def = r.def; let inp = 0;
  if (r.isPlayer) { inp = (keys.R ? 1 : 0) - (keys.L ? 1 : 0); r.brake = keys.B; r.nOn = keys.N && r.nitro > 0.02 && !r.finished; if (r.nOn) { r.nitro = Math.max(0, r.nitro - dt * 0.36); } }
  else {
    r.tgtT -= dt; if (r.tgtT <= 0) { r.tgtT = 2.5 + Math.random() * 3.5; r.tgtD = (Math.random() * 2 - 1) * (W - 3); }
    racers.forEach((o) => { if (o !== r && o.s > r.s && o.s - r.s < 24 && Math.abs(o.d - r.d) < 2.8) r.tgtD = Math.max(-W + 2.6, Math.min(W - 2.6, r.d + (r.d >= o.d ? 3.4 : -3.4))); });
    inp = Math.max(-1, Math.min(1, (r.d - r.tgtD) * 0.32)); r.brake = false;
    r.wob += dt * 0.4; let rb = 1; const gap = player.s - r.s; if (gap > 220) rb = 1.1; else if (gap < -260) rb = 0.88; r.aiV = player.def.vmax * r.pace * rb * (1 + Math.sin(r.wob) * 0.035);
  }
  const base = r.isPlayer ? def.vmax : r.aiV, boost = r.nOn ? 1 : 0, top = base * (1 + (def.nmul - 1) * boost); let tgt = r.brake ? base * 0.42 : top; if (r.finished) tgt = 0;
  if (r.v < tgt) r.v += def.acc * (boost ? 2.2 : 1) * Math.max(0.05, 1 - r.v / (top * 1.12)) * dt; else r.v = Math.max(tgt, r.v - (r.brake || r.finished ? 28 : 10) * dt);
  r.u += (inp - r.u) * Math.min(1, dt * 10);
  const grip = def.lat * (0.4 + 0.6 * Math.min(1, r.v / 22)), assist = r.isPlayer ? (prefs.assist ? 0.4 : 1) : 0.4;
  let ddT = -r.u * grip + a.k * r.v * r.v * 0.045 * assist; if (r.isPlayer && prefs.assist && Math.abs(inp) < 0.1) ddT += -r.d * 0.7;
  r.dd += (ddT - r.dd) * Math.min(1, dt * 7); r.d += r.dd * dt; r.s += r.v * dt; r.travel += r.v * dt;
  r.wallCd -= dt; r.hitCd -= dt; const lim = W - 1.15;
  if (Math.abs(r.d) > lim) { const sg = Math.sign(r.d); r.d = sg * lim; if (sg * r.dd > 0) { r.dd = -sg * Math.abs(r.dd) * 0.3 - sg * 1.2; if (r.wallCd <= 0) { r.wallCd = 0.45; r.v *= 0.9; if (r.isPlayer) { bumps++; shake = 0.5; O.sfx('pop'); } } } }
  if (r.s >= finishS && !r.finished) { r.finished = true; r.fT = raceT; finishOrder.push(r); if (r.isPlayer) onPlayerFinish(); }
  if (r.s > course.length - 3) { r.s = course.length - 3; r.v = Math.min(r.v, 3); }
}
function placeCar(r, dt, snap) {
  const a = track.at(r.s), x = a.x + a.nx * r.d, z = a.z + a.nz * r.d;
  const fx = a.tx * Math.max(r.v, 1) + a.nx * r.dd, fz = a.tz * Math.max(r.v, 1) + a.nz * r.dd, want = Math.atan2(fx, fz);
  let df = want - r.yaw; df = Math.atan2(Math.sin(df), Math.cos(df)); r.yaw = snap ? want : r.yaw + df * Math.min(1, dt * 12);
  r.root.position.set(x, a.y, z); r.root.rotation.y = r.yaw;
  const pitchT = -Math.atan(a.slope); r.tilt.rotation.x += (pitchT - r.tilt.rotation.x) * Math.min(1, dt * 8);
  r.tilt.rotation.z += (-r.u * 0.045 * Math.min(1, r.v / r.def.vmax) - r.tilt.rotation.z) * Math.min(1, dt * 6);
  animWheels(r, r.v * dt, r.u); r.flame.visible = r.nOn; if (r.nOn) r.flame.scale.set(1, 1, 0.8 + Math.random() * 0.5);
}
function collide() {
  for (let i = 0; i < racers.length; i++) for (let j = i + 1; j < racers.length; j++) {
    const a = racers[i], b = racers[j], ds = Math.abs(a.s - b.s), dd = Math.abs(a.d - b.d); if (ds > 4.5 || dd > 2.1) continue;
    const rear = a.s < b.s ? a : b, front = rear === a ? b : a, push = (2.1 - dd), sg = a.d >= b.d ? 1 : -1;
    a.d += sg * push * 0.5; b.d -= sg * push * 0.5; a.dd += sg * push * 2; b.dd -= sg * push * 2;
    if (ds > 1.5 && rear.v > front.v) rear.v = Math.max(front.v * 0.96, rear.v - 14 * 0.016);
    if ((a.isPlayer || b.isPlayer) && player.hitCd <= 0) { player.hitCd = 0.6; bumps++; shake = 0.35; O.sfx('pop'); }
  }
}
function ranks() { const sc = (r) => (r.finished ? 1e9 - r.fT : r.s); return racers.slice().sort((x, y) => sc(y) - sc(x)); }
let lastCd = -1;
function simulate(dt) {
  if (!track) return;
  if (mode === 'count') {
    cdT -= dt; const n = Math.ceil(cdT - 0.6); const el = $('count');
    if (n !== lastCd) { lastCd = n; if (n >= 1 && n <= 3) { el.textContent = n; el.hidden = false; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); O.sfx('tick'); } else if (n <= 0 && cdT > 0) { el.textContent = '출발!'; el.hidden = false; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); O.sfx('coin'); mode = 'race'; raceT = 0; note('달려요! ◀ ▶ 로 방향을 바꿔요.'); setTimeout(() => { if (mode === 'race') el.hidden = true; }, 900); } }
    if (cdT <= 0 && mode === 'count') { mode = 'race'; }
  } else if (mode === 'race' || mode === 'finish') {
    if (mode === 'race') raceT += dt;
    racers.forEach((r) => stepRacer(r, dt)); collide();
    if (player) orbs.forEach((m) => { const u = m.userData; if (u.on && Math.abs(u.s - player.s) < 2.6 && Math.abs(u.d - player.d) < 2.1) { u.on = false; m.visible = false; player.nitro = Math.min(1, player.nitro + 0.26); nOrbs++; O.sfx('coin'); } });
  }
  racers.forEach((r) => placeCar(r, dt));
  shake = Math.max(0, shake - dt * 2);
}
function onPlayerFinish() {
  const place = finishOrder.indexOf(player) + 1, rid = runId, time = player.fT; mode = 'finish'; player.nOn = false;
  const key = course.id + ':' + player.def.id, old = save.best[key], newBest = !old || time < old; if (newBest) save.best[key] = time; if (place === 1) save.done[course.id] = 1; writeSave();
  const stars = place === 1 ? 3 : place === 2 ? 2 : 1, ord = ['', '1등', '2등', '3등', '4등'][place];
  O.sfx(place === 1 ? 'win' : 'ok'); say(ord + '으로 들어왔어요!', 'good', false);
  const title = place === 1 ? '1등! 최고예요!' : place === 2 ? '2등! 멋져요!' : '결승선 통과!', text = ord + ' · 기록 ' + fmtT(time) + (newBest ? ' (내 최고 기록!)' : '') + ' · 구슬 ' + nOrbs + '개',
    speak = place === 1 ? '와! 일 등이에요! 정말 잘 달렸어요!' : place === 2 ? '이 등이에요! 멋지게 달렸어요!' : '결승선을 통과했어요! 끝까지 잘 달렸어요!';
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(스피드 레이스)', school: 'elem', topic: '스피드 레이스', level: prefs.diff + 1, engine: 'racing', rounds: 1, mistakes: 0, glow: 0, hand: 0, asked: 0, sec: Math.round(time) };
  const btns = [{ label: '🔁 다시 달리기', color: 'green', onClick: () => startRace() }, { label: '🚗 차를 바꾸기', color: 'orange', onClick: () => openGarage() }];
  if (place === 1 && prefs.course < COURSES.length - 1) btns.splice(1, 0, { label: '➡ 다음 코스 (' + COURSES[prefs.course + 1].name + ')', color: 'blue', onClick: () => { prefs.course++; writeSave(); startRace(); } });
  setTimeout(() => { if (rid === runId) O.finish({ stats: O.newStats(), entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 1800);
}

/* ---------- 카메라 ---------- */
function camTargets(sCam, dCam) {
  const a = track.at(Math.max(0, sCam - 9.5)), l = track.at(sCam + 12), k = 0.85;
  const dl = dCam * k; return { px: a.x + a.nx * dl, py: a.y + 3.7, pz: a.z + a.nz * dl, lx: l.x + l.nx * dl * 0.9, ly: l.y + 1.1, lz: l.z + l.nz * dl * 0.9 };
}
function snapCamera() {
  const p = player || racers[0]; const t = camTargets(p.s - (mode === 'count' ? 3 : 0), p.d); camPos.set(t.px, t.py, t.pz); camLook.set(t.lx, t.ly, t.lz); camFov = 60;
}
function updateCamera(dt) {
  if (!player) return; const p = player, k = 1 - Math.exp(-dt * 7);
  const t = camTargets(p.s + (mode === 'count' ? -4 + Math.min(1, (3.6 - cdT) / 3.6) * 4 : 0), p.d);
  camPos.x += (t.px - camPos.x) * k; camPos.y += (t.py - camPos.y) * k; camPos.z += (t.pz - camPos.z) * k;
  camLook.x += (t.lx - camLook.x) * k; camLook.y += (t.ly - camLook.y) * k; camLook.z += (t.lz - camLook.z) * k;
  const sp = Math.min(1, p.v / (p.def.vmax * 1.1)), fovT = 58 + sp * 12 + (p.nOn ? 9 : 0); camFov += (fovT - camFov) * Math.min(1, dt * 4);
  camera.fov = camFov; camera.updateProjectionMatrix();
  const sh = shake * 0.25 + (p.nOn ? 0.05 : 0); camera.position.set(camPos.x + (Math.random() - 0.5) * sh, camPos.y + (Math.random() - 0.5) * sh, camPos.z + (Math.random() - 0.5) * sh); camera.lookAt(camLook);
  groundM.position.x = p.root.position.x; groundM.position.z = p.root.position.z;
}

/* ---------- 소리(엔진) ---------- */
let eng = null;
function startEngine() {
  stopEngine(); let on = true; try { on = O.settings().sound !== false; } catch (e) {} if (!on) return;
  try {
    const ac = O.unlock(); if (!ac || !ac.createOscillator) return; const o1 = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.0; o1.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination); o1.start(); o2.start(); eng = { ac, o1, o2, f, g };
  } catch (e) { eng = null; }
}
function stopEngine() { if (!eng) return; try { eng.g.gain.setTargetAtTime(0, eng.ac.currentTime, 0.05); eng.o1.stop(eng.ac.currentTime + 0.2); eng.o2.stop(eng.ac.currentTime + 0.2); } catch (e) {} eng = null; }
function engineUpdate() {
  if (!eng || !player) return; const sp = Math.min(1.3, player.v / player.def.vmax), t = eng.ac.currentTime;
  eng.o1.frequency.setTargetAtTime(48 + sp * 120 + (player.nOn ? 30 : 0), t, 0.08); eng.o2.frequency.setTargetAtTime(24 + sp * 60, t, 0.08); eng.f.frequency.setTargetAtTime(380 + sp * 900, t, 0.1);
  eng.g.gain.setTargetAtTime(mode === 'race' || mode === 'finish' ? 0.035 + sp * 0.03 : 0.012, t, 0.1);
}

/* ---------- HUD ---------- */
function updateHud(force) {
  if (!player) return; const rk = ranks(), place = rk.indexOf(player) + 1;
  if (place !== hud.rank || force) { hud.rank = place; $('hudRank').innerHTML = '<small>순위</small><b>' + place + '</b><span>/ ' + racers.length + '</span>'; }
  const sp = Math.round(player.v * 3.6); if (sp !== hud.speed || force) { hud.speed = sp; $('hudSpeed').innerHTML = '<b>' + sp + '</b><small>km/h</small>'; }
  const tt = fmtT(mode === 'finish' ? player.fT : raceT); if (tt !== hud.time) { hud.time = tt; $('hudTime').textContent = tt; }
  const nv = Math.round(player.nitro * 100); if (nv !== hud.nitro) { hud.nitro = nv; $('nitroFill').style.width = nv + '%'; $('hudNitro').classList.toggle('full', nv >= 99); $('btnN').disabled = nv < 2; }
  const pw = $('hudProg').clientWidth, f = (r) => Math.min(1, r.s / finishS) * 100 + '%';
  $('progFill').style.width = f(player); $('progMe').style.left = f(player); racers.forEach((r) => { if (r.dot) r.dot.style.left = f(r); });
}

/* ---------- 차고 ---------- */
function bestOf(courseId, carId) { return save.best[courseId + ':' + carId]; }
function renderGarageInfo() {
  const d = CARS[gIdx]; $('carSub').textContent = d.sub; $('carName').textContent = d.name;
  const b = bestOf(COURSES[prefs.course].id, d.id); $('carBest').textContent = b ? '🏆 이 코스 최고 기록 ' + fmtT(b) : '아직 달린 기록이 없어요';
  $('carStats').innerHTML = d.stats.map((v, i) => '<span>' + STAT_NAMES[i] + '</span><span class="bar">' + [1, 2, 3, 4, 5].map((k) => '<i class="' + (k <= v ? 'on' : '') + '"></i>').join('') + '</span>').join('');
  $('credit').innerHTML = !d.src ? '카툰 자동차: 옥쌤의 즐거운 교실에서 코드로 만든 모델이에요.' : '차 모델: “' + d.title + '” — <a href="https://sketchfab.com/outpiston" target="_blank" rel="noopener">OUTPISTON</a> · <a href="' + d.src + '" target="_blank" rel="noopener">Sketchfab</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>';
  const chip = (k, v, label, on, extra) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + (extra ? ' ' + extra : '') + '" data-' + k + '="' + v + '">' + label + '</button>';
  const colorRow = d.colors ? '<div class="g"><label>색깔</label>' + TOY_COLORS.map((c, i) => '<button type="button" class="rc-sw' + (prefs.color === i ? ' on' : '') + '" data-cl="' + i + '" style="background:#' + c[0].toString(16).padStart(6, '0') + '" aria-label="' + c[1] + '"></button>').join('') + '</div>' : '';
  $('opts').innerHTML = colorRow + '<div class="g"><label>코스</label>' + COURSES.map((c, i) => chip('co', i, c.emoji + ' ' + c.name, prefs.course === i, save.done[c.id] ? 'done' : '')).join('') + '</div>' +
    '<div class="g"><label>상대</label>' + DIFFS.map((x) => chip('df', x.id, x.name, prefs.diff === x.id)).join('') + '</div>' +
    '<div class="g"><label>핸들 도움</label>' + chip('as', 1, '켜기', !!prefs.assist) + chip('as', 0, '끄기', !prefs.assist) + '</div>';
  $('opts').querySelectorAll('[data-cl]').forEach((b) => { b.onclick = () => { prefs.color = +b.dataset.cl; writeSave(); O.sfx('tick'); showGarageCar(gIdx); say(TOY_COLORS[prefs.color][1] + ' 차예요!', null, TOY_COLORS[prefs.color][1] + ' 차예요!'); }; });
  $('opts').querySelectorAll('[data-co]').forEach((b) => { b.onclick = () => { prefs.course = +b.dataset.co; writeSave(); O.sfx('tick'); renderGarageInfo(); }; });
  $('opts').querySelectorAll('[data-df]').forEach((b) => { b.onclick = () => { prefs.diff = +b.dataset.df; writeSave(); O.sfx('tick'); renderGarageInfo(); }; });
  $('opts').querySelectorAll('[data-as]').forEach((b) => { b.onclick = () => { prefs.assist = +b.dataset.as; writeSave(); O.sfx('tick'); renderGarageInfo(); }; });
}
function openGarage() {
  runId++; mode = 'garage'; stopEngine(); O.hush && O.hush(); $('hud').hidden = true; $('pad').hidden = true; $('count').hidden = true; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  $('garage').hidden = false; $('btnMenu').textContent = '🏁 달리기'; showGarageCar(prefs.car); resize(); say('타고 싶은 차를 골라요.', null, '타고 싶은 차를 골라요. 화살표를 눌러 바꿀 수 있어요.');
}
$('carPrev').onclick = () => { O.unlock(); O.sfx('tick'); showGarageCar(gIdx - 1); };
$('carNext').onclick = () => { O.unlock(); O.sfx('tick'); showGarageCar(gIdx + 1); };
$('goBtn').onclick = () => startRace();
$('btnMenu').onclick = () => { O.unlock(); if (mode === 'garage') startRace(); else openGarage(); };
$('btnHelp').onclick = () => { O.unlock(); const d = $('helpDialog'); if (d.showModal) d.showModal(); };
{ const b = $('btnVoice'); const show = () => { const on = O.settings().voice; b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on); };
  b.onclick = () => { const on = !O.settings().voice; O.saveSetting('voice', on); O.saveSetting('explain', on); if (!on) O.hush(); show(); O.unlock(); if (on) O.say('안내 음성을 켰어요.'); else O.sfx('tick'); }; show(); }
canvas.addEventListener('pointerdown', (e) => { if (mode !== 'garage') return; gDrag = { x: e.clientX, yaw: gYaw }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (gDrag) { gYaw = gDrag.yaw + (e.clientX - gDrag.x) * 0.012; gSpin = 0; } });
const endDrag = () => { if (gDrag) { gDrag = null; gSpin = 0.35; } };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

/* ---------- 조작 ---------- */
function bindBtn(id, key) {
  const b = $(id); const set = (v) => { keys[key] = v; b.classList.toggle('on', v); };
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); O.unlock(); try { b.setPointerCapture(e.pointerId); } catch (x) {} set(true); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => b.addEventListener(ev, () => set(false)));
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  return set;
}
const setL = bindBtn('btnL', 'L'), setR = bindBtn('btnR', 'R'), setB = bindBtn('btnB', 'B'), setN = bindBtn('btnN', 'N');
const KEYMAP = { ArrowLeft: setL, a: setL, A: setL, ArrowRight: setR, d: setR, D: setR, ArrowDown: setB, s: setB, S: setB, ' ': setN, ArrowUp: setN, w: setN, W: setN, Shift: setN };
window.addEventListener('keydown', (e) => { if (e.repeat) return; if (mode === 'garage') { if (e.key === 'ArrowLeft') $('carPrev').click(); else if (e.key === 'ArrowRight') $('carNext').click(); else if (e.key === 'Enter') startRace(); return; } const f = KEYMAP[e.key]; if (f) { e.preventDefault(); f(true); } });
window.addEventListener('keyup', (e) => { const f = KEYMAP[e.key]; if (f) f(false); });
window.addEventListener('blur', () => { setL(false); setR(false); setB(false); setN(false); });

/* ---------- 화면 맞춤·반복 ---------- */
function resize() {
  const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  if (mode === 'garage' || mode === 'boot') {
    camera.fov = 34; const vf = THREE.MathUtils.degToRad(camera.fov) / 2, dist = Math.max(7.4, 4.2 / (Math.tan(vf) * camera.aspect));
    camera.position.set(0, 1.7 + dist * 0.06, dist); camera.lookAt(0, 0.6, 0);
    const g = $('garage'), panel = g.hidden ? 0 : g.offsetHeight + 12, top = h < 720 ? 100 : 120; camera.setViewOffset(w, h, 0, (panel - top) / 2, w, h);
  } else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'garage') {
    if (gCar) { gYaw += gSpin * dt; gCar.root.rotation.y = gYaw; gPop = Math.min(1, gPop + dt * 3.2); const e = 1 - Math.pow(1 - gPop, 3); gCar.root.scale.setScalar(0.7 + 0.3 * e); gCar.root.position.y = (1 - e) * 0.4; animWheels(gCar, 0, 0); }
    renderer.render(gScene, camera);
  } else if (rScene) {
    simulate(dt); updateCamera(dt); updateHud(); engineUpdate();
    orbs.forEach((m) => { if (!m.visible) return; const u = m.userData, a = track.at(u.s); m.position.set(a.x + a.nx * u.d, a.y + 1.3 + Math.sin(now / 300 + u.s) * 0.2, a.z + a.nz * u.d); m.rotation.y = now / 400; });
    renderer.render(rScene, camera);
  }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopEngine(); } else if (mode === 'race' || mode === 'count') startEngine(); });

window.__race = { get mode() { return mode; }, get racers() { return racers; }, get player() { return player; }, get track() { return track; }, keys, step(n, dt) { for (let i = 0; i < n; i++) simulate(dt || 0.033); updateHud(); }, snap: () => { snapCamera(); updateCamera(1); }, start: startRace, garage: openGarage, prefs, protos, W };

(async function boot() {
  resize(); requestAnimationFrame(frame);
  try { await loadModels((p) => { $('loadText').textContent = '차를 가져오는 중… ' + Math.round(p * 100) + '%'; }); }
  catch (e) { $('loading').innerHTML = '<div><p>차 모델을 불러오지 못했어요.<br>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
  openGarage(); $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
})();
