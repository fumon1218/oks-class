/* 옥쌤의 즐거운 교실 — 스피드 레이스 (놀이별 보드게임 · 아스팔트 풍 3D 자동차 경주)
   three.js(vendor/three). 차 모델 2대는 OUTPISTON 님의 작품(CC BY-NC-SA 4.0, 수정 없이 사용).
   길은 track.js 가 만든 외길. 차는 '길 위의 위치(s, d)'로 움직여요(아케이드 물리). 다치거나 지는 벌칙 없이 순위만 보여 줘요. */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';
import { makeTrack, makeLoopTrack, LOOP_SHAPES } from './track.js';
import { buildToyCar, TOY_COLORS } from './toycar.js';
import { SLOTS, ITEMS, ITEM } from './parts.js';

const O = window.OKS;
const $ = (id) => document.getElementById(id);
const LESSON = 'play-racing';
const W = 8;                       // 길 폭의 절반(m)
const SAVE_KEY = 'oks_race_v1';

const CARS = [
  { id: 'toy_sport', build: 'toy', style: 'sport', dc: 0, colors: true, name: '스프린트', sub: '카툰 · 레드 스프린트 · 날쌘 스포츠', title: '', src: '', front: 1, vmax: 62, acc: 23, lat: 11, nmul: 1.3, stats: [4, 4, 3, 4] },
  { id: 'toy_formula', build: 'toy', style: 'formula', dc: 6, colors: true, name: '썬볼트', sub: '카툰 · 포뮬러 · 번개처럼 빨라요', title: '', src: '', front: 1, vmax: 68, acc: 23, lat: 11, nmul: 1.3, stats: [5, 4, 3, 4] },
  { id: 'toy_wave', build: 'toy', style: 'wave', dc: 1, colors: true, name: '스플래시', sub: '카툰 · 파도 지느러미 · 핸들이 좋아요', title: '', src: '', front: 1, vmax: 62, acc: 20, lat: 13, nmul: 1.3, stats: [4, 3, 5, 4] },
  { id: 'toy_buggy', build: 'toy', style: 'buggy', dc: 2, colors: true, name: '버기', sub: '카툰 · 튼튼한 바퀴 · 숲길 친구', title: '', src: '', front: 1, vmax: 56, acc: 23, lat: 13, nmul: 1.3, stats: [3, 4, 5, 4] },
  { id: 'toy_flower', build: 'toy', style: 'flower', dc: 5, colors: true, name: '블로섬', sub: '카툰 · 꽃을 단 · 부드러운 핸들', title: '', src: '', front: 1, vmax: 56, acc: 27, lat: 13, nmul: 1.3, stats: [3, 5, 5, 4] },
  { id: 'toy_star', build: 'toy', style: 'star', dc: 4, colors: true, name: '스타', sub: '카툰 · 별이 반짝 · 균형형', title: '', src: '', front: 1, vmax: 62, acc: 23, lat: 12, nmul: 1.3, stats: [4, 4, 4, 4] },
  { id: 'toy_rocket', build: 'toy', style: 'rocket', dc: 3, colors: true, name: '로켓', sub: '카툰 · 로켓 꼬리 · 가장 빨라요', title: '', src: '', front: 1, vmax: 68, acc: 27, lat: 9.5, nmul: 1.3, stats: [5, 5, 2, 4] },
  { id: 'toy_cloud', build: 'toy', style: 'cloud', dc: 7, colors: true, name: '클라우드', sub: '카툰 · 구름 지붕 · 핸들이 좋아요', title: '', src: '', front: 1, vmax: 56, acc: 23, lat: 13, nmul: 1.3, stats: [3, 4, 5, 4] },
  { id: 'toy_knight', build: 'toy', style: 'knight', dc: 8, colors: true, name: '나이트', sub: '카툰 · 기사 투구 · 든든해요', title: '', src: '', front: 1, vmax: 62, acc: 20, lat: 11, nmul: 1.3, stats: [4, 3, 3, 4] },
  { id: 'toy_comet', build: 'toy', style: 'comet', dc: 9, colors: true, name: '코멧', sub: '카툰 · 혜성 꼬리 · 만능이에요', title: '', src: '', front: 1, vmax: 68, acc: 27, lat: 12, nmul: 1.3, stats: [5, 5, 4, 4] },
  { id: 'rx7', file: 'assets/rx7.glb', name: '마쓰다 RX-7', sub: '2002 · 일본 스포츠카', title: '2002 Mazda RX-7 Spirit-R', src: 'https://sketchfab.com/3d-models/2002-mazda-rx-7-spirit-r-277e2569280d4c9fa3bc3a85bbc627f1', front: 1, vmax: 56, acc: 24, lat: 12.5, nmul: 1.3, stats: [3, 4, 5, 3] },
  { id: 'm720', file: 'assets/mclaren720s.glb', name: '맥라렌 720S GT3', sub: '2019 · 영국 레이싱카', title: '2019 McLaren 720S GT3', src: 'https://sketchfab.com/3d-models/2019-mclaren-720s-gt3-cdf4ca67a56b497493931e8852e70b05', front: 1, vmax: 70, acc: 19, lat: 10.5, nmul: 1.26, stats: [5, 3, 3, 4] },
];
const STAT_NAMES = ['최고 속도', '가속', '핸들', '니트로'];
const COURSES = [
  { id: 'meadow', props: [['pine', 320, 9, 5, 45], ['bush', 220, 2.6, 2, 24], ['tires', 70, 1.7, 1.2, 2.5], ['cone', 50, 1.1, 1.2, 2.5], ['barrier', 40, 1.2, 1.2, 2.5]], name: '초록 숲길', emoji: '🌲', seed: 11, length: 1050, laps: 3, shape: 'meadow', bg: 'bg_forest', hz: 0.575, sky: ['#4aa8ff', '#bfe6ff'], fog: 0x93d36e, ground: 0x7cc43a, bank: 0x6ab32f, tree: 'round', leaf: 0x3ea94a },
  { id: 'sakura', props: [['sakura', 300, 9.5, 5, 45], ['bush', 160, 2.6, 2, 24], ['lamp', 60, 5.5, 1.4, 2.6], ['flag', 60, 4.5, 1.4, 2.6], ['tires', 30, 1.7, 1.2, 2.5]], name: '벚꽃 경기장', emoji: '🌸', seed: 47, length: 1150, laps: 3, shape: 'sakura', bg: 'bg_cherry', hz: 0.62, sky: ['#5db4ff', '#fce5e9'], fog: 0xfbe0e6, ground: 0xf4c8d6, bank: 0xeab4c6, tree: 'round', leaf: 0xff9fc6, trunk: 0x8a5a44 },
  { id: 'beach', props: [['palm', 280, 9.5, 4, 40], ['bush', 150, 2.6, 2, 30], ['tires', 70, 1.7, 1.2, 2.5], ['cone', 50, 1.1, 1.2, 2.5], ['flag', 30, 4.5, 1.4, 2.6]], name: '반짝 바닷길', emoji: '🏖️', seed: 23, length: 1200, laps: 3, shape: 'beach', bg: 'bg_beach', hz: 0.5, sky: ['#2f9bff', '#9fe4ff'], fog: 0x6fdcf5, ground: 0xf3d9a0, bank: 0xe6c88a, tree: 'palm', leaf: 0x35b45a, trunk: 0xb98a55 },
  { id: 'skyisle', props: [['sakura', 160, 9.5, 6, 50], ['lamp', 50, 5.5, 1.4, 2.6], ['flag', 30, 4.5, 1.4, 2.6], ['bush', 100, 2.6, 2, 26]], name: '노을 하늘 섬', emoji: '🏯', seed: 35, length: 1150, laps: 3, shape: 'skyisle', bg: 'bg_sky', hz: 0.6, sky: ['#8a7be0', '#ffc2a8'], fog: 0xf9b4b0, ground: 0xe9a2b6, bank: 0xdc8fa8, tree: 'puff', leaf: 0xffeef2 },
  { id: 'space', props: [['lamp', 70, 5.5, 1.4, 2.6], ['flag', 60, 4.5, 1.4, 2.6], ['cone', 50, 1.1, 1.2, 2.5], ['tires', 30, 1.7, 1.2, 2.5]], name: '별빛 우주길', emoji: '🌙', seed: 59, length: 1250, laps: 3, shape: 'space', bg: 'bg_space', hz: 0.56, sky: ['#150a52', '#6a3fd8'], fog: 0x7a52e0, ground: 0x4a34b0, bank: 0x3c2a96, tree: 'star', leaf: 0xffd84a },
  { id: 'canyon', props: [['crock', 200, 8, 6, 50], ['ctree', 240, 8, 5, 45], ['cstar', 14, 6, 3, 8], ['carch', 24, 13, 8, 40], ['cone', 40, 1.1, 1.2, 2.5], ['barrier', 30, 1.2, 1.2, 2.5]], name: '무지개 협곡', emoji: '🌈', seed: 71, length: 1150, laps: 3, shape: 'canyon', bg: 'bg_canyon', hz: 0.61, sky: ['#2f9bff', '#bfe6ff'], fog: 0xf0a47c, ground: 0xe8845a, bank: 0xd9704a, tree: 'round', leaf: 0x7cc43a },
  { id: 'snow', props: [['spine', 300, 9, 5, 45], ['icecry', 120, 5, 4, 40], ['snowflake', 26, 3.2, 3, 9], ['iarch', 22, 12, 8, 40], ['flag', 30, 4.5, 1.4, 2.6], ['lamp', 40, 5.5, 1.4, 2.6]], name: '눈꽃 설원', emoji: '❄️', seed: 83, length: 1100, laps: 3, shape: 'snow', bg: 'bg_snow', hz: 0.585, sky: ['#4aa8ff', '#e3f2ff'], fog: 0xd6e9fb, ground: 0xe3effa, bank: 0xcfe2f5, tree: 'round', leaf: 0xffffff },
  { id: 'volcano', props: [['lavatree', 240, 8.5, 5, 45], ['lrock', 160, 5, 4, 40], ['lavacry', 70, 5.5, 4, 36], ['larch', 22, 12, 8, 40], ['cone', 40, 1.1, 1.2, 2.5], ['tires', 30, 1.7, 1.2, 2.5]], name: '용암 화산', emoji: '🌋', seed: 97, length: 1200, laps: 3, shape: 'volcano', bg: 'bg_volcano', hz: 0.57, sky: ['#6a4aa0', '#ff9a5a'], fog: 0xe8702a, ground: 0xb8452f, bank: 0x9a3a28, tree: 'round', leaf: 0xff7a1a },
  { id: 'candy', props: [['candytree', 260, 9, 5, 45], ['candypile', 160, 4, 3, 36], ['candybox', 60, 4, 3, 30], ['cdarch', 22, 12, 8, 40], ['flag', 30, 4.5, 1.4, 2.6], ['lamp', 40, 5.5, 1.4, 2.6]], name: '사탕 축제', emoji: '🍭', seed: 109, length: 1100, laps: 3, shape: 'candy', bg: 'bg_candy', hz: 0.575, sky: ['#4aa8ff', '#ffd6ea'], fog: 0xfdc6dc, ground: 0xff9fc2, bank: 0xf58bb0, tree: 'round', leaf: 0xffa6d0 },
  { id: 'aurora', props: [['atree', 240, 9, 5, 45], ['acry', 140, 5, 4, 40], ['aorb', 50, 4, 3, 30], ['aarch', 22, 12, 8, 40], ['lamp', 40, 5.5, 1.4, 2.6], ['flag', 30, 4.5, 1.4, 2.6]], name: '오로라 별길', emoji: '🌌', seed: 127, length: 1250, laps: 3, shape: 'aurora', bg: 'bg_aurora', hz: 0.56, sky: ['#150a52', '#6a3fd8'], fog: 0x8a5fe8, ground: 0x6a46d8, bank: 0x5736b8, tree: 'round', leaf: 0xaef0ff },
];
const DIFFS = [{ id: 0, name: '여유롭게', pace: 0.8 }, { id: 1, name: '보통', pace: 0.9 }, { id: 2, name: '도전!', pace: 0.99 }];
const AI_COLORS = ['#ff7a2e', '#3d8bff', '#39c46a'];

/* ---------- 저장 ---------- */
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); return { best: s.best || {}, done: s.done || {}, gar: { owned: (s.gar && s.gar.owned) || {}, eq: (s.gar && s.gar.eq) || {} }, prefs: Object.assign({ car: 0, course: 0, diff: 1, assist: 1, color: -1, laps: 3, len: 1 }, s.prefs || {}) }; } catch (e) { return { best: {}, done: {}, gar: { owned: {}, eq: {} }, prefs: { car: 0, course: 0, diff: 1, assist: 1, color: -1, laps: 3, len: 1 } }; } }
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
const save = loadSave();
const prefs = save.prefs;
const fmtT = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };

/* ---------- 렌더러·공통 ---------- */
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
const aiColor = (d, pc) => { const c = d.dc || 0; return c === pc ? (c + 5) % TOY_COLORS.length : c; };
const colOf = (def, c) => (c >= 0 ? c : (def.dc || 0));
const neonTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function animParts(o, now, dt) { if (!o) return; if (o.rb.length) { const h = (now / 2600) % 1; o.rb.forEach((x) => x.m.color.setHSL(h, x.s, x.l)); } o.spin.forEach((p) => { p.rotation.y += dt * 24; }); }
function makeCarObject(def, colorIdx, eq) {
  eq = eq || {}; let model, wl, len, wid;
  if (def.build) { const b = buildToyCar(THREE, TOY_COLORS[(colorIdx || 0) % TOY_COLORS.length][0], def.style, eq); model = b.group; wl = b.wheels; len = b.len; wid = b.wid; }
  else { const p = protos[def.id]; model = p.holder.clone(true); wl = p.wheels; len = p.len; wid = p.wid; }
  model.rotation.y = def.front < 0 ? Math.PI : 0;
  const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt); tilt.add(model);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(wid * 1.9, len * 1.35), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; tilt.add(blob);
  const rb = (model.userData.rb || []).slice(), spin = model.userData.spin || [], fi = ITEM[eq.flame], fm1 = flameMat.clone(), fm2 = flameMat2.clone();
  if (fi) { if (fi.color < 0) { rb.push({ m: fm1, s: 1, l: 0.55 }, { m: fm2, s: 1, l: 0.8 }); } else { fm1.color.set(fi.color); fm2.color.set(fi.color).lerp(new THREE.Color(0xffffff), 0.6); } }
  const ni = ITEM[eq.neon]; if (ni) { const nm = new THREE.MeshBasicMaterial({ map: neonTex, color: ni.color < 0 ? 0xffffff : ni.color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }); if (ni.color < 0) rb.push({ m: nm, s: 1, l: 0.55 }); const np = new THREE.Mesh(new THREE.PlaneGeometry(wid * 1.9, len * 1.25), nm); np.rotation.x = -Math.PI / 2; np.position.y = 0.06; tilt.add(np); }
  const flame = new THREE.Group(); for (const sx of [-0.4, 0.4]) { const g = new THREE.ConeGeometry(0.16, 1.5, 10); g.rotateX(def.front > 0 ? -Math.PI / 2 : Math.PI / 2); const m = new THREE.Mesh(g, fm1); m.position.set(sx, 0.5, -def.front * (len / 2 + 0.7)); flame.add(m); const g2 = new THREE.ConeGeometry(0.08, 0.9, 8); g2.rotateX(def.front > 0 ? -Math.PI / 2 : Math.PI / 2); const m2 = new THREE.Mesh(g2, fm2); m2.position.set(sx, 0.5, -def.front * (len / 2 + 0.45)); flame.add(m2); } flame.visible = false; tilt.add(flame);
  const wheels = wl.map((w) => ({ s: model.getObjectByName(w.s), r: model.getObjectByName(w.r), front: w.front }));
  return { root, tilt, model, wheels, flame, def, len, rb, spin };
}
function animWheels(o, dist, steer) { const a = dist / 0.32 * o.def.front; o.wheels.forEach((w) => { w.r.rotation.x += a; if (w.front) w.s.rotation.y = -steer * 0.42; }); }

/* ---------- 차고 장면 ---------- */
const gScene = new THREE.Scene(); gScene.environment = envMap; gScene.environmentIntensity = 0.9;
gScene.add(new THREE.HemisphereLight(0xbfd4ff, 0x20243a, 0.9));
{ const k = new THREE.DirectionalLight(0xfff1dd, 2.4); k.position.set(-4, 7, 5); gScene.add(k); const r1 = new THREE.DirectionalLight(0x6ab0ff, 1.8); r1.position.set(6, 3, -5); gScene.add(r1); const r2 = new THREE.DirectionalLight(0xff9d6a, 1.2); r2.position.set(-6, 2, -4); gScene.add(r2); }
const turn = new THREE.Group(); gScene.add(turn);
{ const sh = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(10,14,30,.55)'); gr.addColorStop(0.6, 'rgba(10,14,30,.22)'); gr.addColorStop(1, 'rgba(10,14,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; gScene.add(sh); }
const SLOT_IMG = { paint: 'spray', decal: 'stickers', wheel: 'wheel', wing: 'wings', top: 'crown', eyes: 'eyes', neon: 'ring', flame: 'rocket' };
const ITEM_IMG = { p_pearl: 'drop_b', p_matte: 'drop_k', p_chrome: 'drop_s', p_gold: 'bucket_y', p_rainbow: 'rainbow', d_star: 'st_star', d_bolt: 'st_bolt', d_flame: 'st_flame', d_checker: 'st_stripe' };
const uiImg = (n, cls) => '<img class="ui' + (cls ? ' ' + cls : '') + '" src="assets/ui_' + n + '.webp" alt="" draggable="false">';
const COIN = uiImg('coin', 'coin');
function hueOf(c) { const r = (c >> 16 & 255) / 255, g = (c >> 8 & 255) / 255, b = (c & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; }
function itemThumb(i, slot) {
  if (!i.id) return '<b class="rc-th"><u>✖</u></b>';
  const own = ITEM_IMG[i.id], name = own || SLOT_IMG[slot]; let st = '', cl = '';
  if (!own && (slot === 'neon' || slot === 'flame')) { if (i.color === -1 || i.id.endsWith('rainbow')) cl = 'rb'; else if (i.color) st = ' style="filter:hue-rotate(' + Math.round(hueOf(i.color) - (slot === 'neon' ? 215 : 28)) + 'deg) saturate(1.2)"'; }
  if (!own && i.id.endsWith('rainbow')) cl = 'rb';
  return '<b class="rc-th">' + uiImg(name, cl).replace('<img ', '<img' + st + ' ') + (own ? '' : '<s>' + i.icon + '</s>') + '</b>';
}
let tuneSel = null, tuneSlot = 'paint';
function eqOf(def) { const e = Object.assign({}, save.gar.eq[def.id] || {}); if (tuneSel && tuneSel.carId === def.id) e[tuneSel.slot] = tuneSel.id; return e; }
function aiEq() { const e = {}; SLOTS.forEach((sl) => { if (Math.random() < 0.4) { const l = ITEMS.filter((i) => i.slot === sl.id); e[sl.id] = l[Math.floor(Math.random() * l.length)].id; } }); return e; }
let gCar = null, gYaw = 0.6, gSpin = 0.35, gPop = 1, gDrag = null, gIdx = 0;
function showGarageCar(i) {
  const ni = (i + CARS.length) % CARS.length; if (ni !== prefs.car) prefs.color = -1; gIdx = ni; prefs.car = gIdx; writeSave();
  if (gCar) { turn.remove(gCar.root); } gCar = makeCarObject(CARS[gIdx], colOf(CARS[gIdx], prefs.color), eqOf(CARS[gIdx])); turn.add(gCar.root); gPop = 0; renderGarageInfo();
}

/* ---------- 경기 장면 ---------- */
let lapNow = 1, rScene = null, track = null, course = null, orbs = [], gates = [], groundM = null, sunL = null;
function disposeScene(sc) { if (!sc) return; sc.traverse((o) => { if (o.geometry && !o.userData.keep) o.geometry.dispose(); }); }
function ribbon(tr, s0, s1, step, secFn, mat, vscale) {
  const pos = [], uv = [], idx = [], nR = Math.ceil((s1 - s0) / step) + 1, stp = (s1 - s0) / (nR - 1); let cols = 0;
  for (let r = 0; r < nR; r++) { const s = s0 + r * stp, a = tr.at(s), sec = secFn(a); cols = sec.length; sec.forEach((q) => { pos.push(a.x + a.nx * q[0], a.y + q[1], a.z + a.nz * q[0]); uv.push(q[2] === undefined ? 0 : q[2], s / vscale); }); }
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
const SP_ASP = { trophy: 1.04, sakura: 1.03, lamp: 0.37, flag: 1.0, bush: 1.16, barrier: 2.09, pine: 0.78, cone: 0.8, palm: 0.94, tires: 0.65, arch: 1.18, lavatree: 0.9, icecry: 1.06, spine: 0.71, crock: 1.23, ctree: 0.99, larch: 1.01, snowflake: 1.17, iarch: 1.01, cstar: 0.78, carch: 1.11, acry: 0.81, atree: 1.02, candypile: 1.17, candytree: 0.95, lrock: 1.09, aorb: 0.9, aarch: 0.98, candybox: 1.44, cdarch: 1.01, lavacry: 0.8 };
const spCache = {};
function spTex(k) { if (!spCache[k]) { const t = new THREE.TextureLoader().load('assets/sp_' + k + '.webp'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; spCache[k] = t; } return spCache[k]; }
function spMat(k) { return new THREE.MeshBasicMaterial({ map: spTex(k), alphaTest: 0.5, side: THREE.DoubleSide }); }
function spGeo() { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); return g; }
function makeArch(tr, s) {
  const a = tr.at(s), w = 2 * W + 8, m = new THREE.Mesh(spGeo(), spMat('arch')); m.scale.set(w, w / SP_ASP.arch, 1); m.position.set(a.x, -0.36, a.z); m.rotation.y = Math.atan2(a.tx, a.tz) + Math.PI; m.frustumCulled = false; return m;
}
function addProps(sc, co, R, ext) {
  const L = co.length, pts = track.P, geo = spGeo(), tm = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const clear = (x, z) => { let m = 1e9; for (let j = 0; j < pts.length; j++) { const dx = pts[j][0] - x, dz = pts[j][1] - z, d2 = dx * dx + dz * dz; if (d2 < m) m = d2; } return Math.sqrt(m) >= W + 2.2; };
  for (const [k, n, h, o0, o1] of co.props || []) {
    const list = []; for (let i = 0; i < n * 4 && list.length < n; i++) { const sPos = co.shape ? R() * L : 30 + R() * (L - 50), a = track.at(sPos), side = R() < 0.5 ? -1 : 1, lat = side * (W + 1.3 + ext(a) + o0 + R() * (o1 - o0)), x = a.x + a.nx * lat, z = a.z + a.nz * lat; if (!clear(x, z)) continue; list.push({ x, z, yaw: Math.atan2(a.tx, a.tz) + Math.PI, sc: 0.8 + R() * 0.45 }); }
    const im = new THREE.InstancedMesh(geo, spMat(k), list.length); list.forEach((it, i) => { q.setFromAxisAngle(up, it.yaw); sv.set(h * it.sc * SP_ASP[k], h * it.sc, 1); pv.set(it.x, -0.36, it.z); tm.compose(pv, q, sv); im.setMatrixAt(i, tm); }); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; sc.add(im);
  }
  for (const sx of [-1, 1]) { const a = track.at(co.shape ? 32 : L - 40), lat = sx * (W + 6), t = new THREE.Mesh(geo, spMat('trophy')); t.scale.set(4 * SP_ASP.trophy, 4, 1); t.position.set(a.x + a.nx * lat, -0.36, a.z + a.nz * lat); t.rotation.y = Math.atan2(a.tx, a.tz) + Math.PI; sc.add(t); }
}
let backdrop = null;
const bgCache = {};
function makeBackdrop(co) {
  const ARC = 2.2, RAD = 800, w = RAD * ARC, h = w * 9 / 16, tex = bgCache[co.bg] || (bgCache[co.bg] = new THREE.TextureLoader().load('assets/' + co.bg + '.webp'));
  tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.MirroredRepeatWrapping; tex.repeat.set(Math.PI * 2 / ARC, 1); tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(RAD, RAD, h, 48, 1, true), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.position.y = (co.hz - 0.5) * h - 0.36; m.renderOrder = -10; m.frustumCulled = false; m.userData.keep = false; return m;
}
function buildRace(co) {
  disposeScene(rScene); const sc = new THREE.Scene(); rScene = sc; course = co; sc.background = gradTex(co.sky[0], co.sky[1]); sc.fog = new THREE.Fog(co.fog, 90, 560); backdrop = makeBackdrop(co); sc.add(backdrop); sc.environment = envMap; sc.environmentIntensity = 0.75;
  sc.add(new THREE.HemisphereLight(0xffffff, co.ground, 1.25)); sunL = new THREE.DirectionalLight(0xfff3dd, 2.1); sunL.position.set(-40, 80, 30); sc.add(sunL);
  track = co.shape ? makeLoopTrack(co.seed, LOOP_SHAPES[co.shape], co.length) : makeTrack(co.seed, co.length); const L = co.length, endS = co.shape ? L : L - 0.5;
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9, side: THREE.DoubleSide }); roadTex.repeat.set(1, 1);
  const road = ribbon(track, 0, endS, 3, () => [[-W, 0.0, 0], [W, 0.0, 1]], roadMat, 16); sc.add(road);
  const cm = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.7, side: THREE.DoubleSide });
  sc.add(ribbon(track, 0, endS, 3, () => [[W, 0.04, 0], [W + 1.3, 0.04, 1]], cm, 3), ribbon(track, 0, endS, 3, () => [[-W - 1.3, 0.04, 0], [-W, 0.04, 1]], cm, 3));
  const bm = new THREE.MeshStandardMaterial({ color: co.bank, roughness: 1, side: THREE.DoubleSide });
  const ext = (a) => Math.max(2, (a.y + 0.35) * 1.8);
  sc.add(ribbon(track, 0, endS, 3, (a) => [[W + 1.3, 0.02, 0], [W + 1.3 + ext(a), -a.y - 0.35, 1]], bm, 8), ribbon(track, 0, endS, 3, (a) => [[-W - 1.3 - ext(a), -a.y - 0.35, 0], [-W - 1.3, 0.02, 1]], bm, 8));
  groundM = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: co.ground, roughness: 1 })); groundM.rotation.x = -Math.PI / 2; groundM.position.y = -0.36; sc.add(groundM);
  // 나무·선인장 (길에서 떨어진 곳에만)
  const R = rnd0(co.seed * 7 + 1), pts = track.P;
  const items = []; for (let i = 0; i < 1500 && items.length < 650; i++) { const s = R() * L, a = track.at(s), side = R() < 0.5 ? -1 : 1, lat = side * (W + 3.5 + ext(a) + (R() < 0.5 ? R() * 12 : R() * 70)); const x = a.x + a.nx * lat, z = a.z + a.nz * lat; const dmin = (() => { let m = 1e9; for (let j = 0; j < pts.length; j++) { const dx = pts[j][0] - x, dz = pts[j][1] - z, d2 = dx * dx + dz * dz; if (d2 < m) m = d2; } return Math.sqrt(m); })(); if (dmin < W + 4.5) continue; items.push({ x, z, sc: 0.8 + R() * 1.1, ry: R() * 6.28 }); }
  const sph = (r, sx, sy, sz) => { const g = new THREE.SphereGeometry(r, 12, 9); g.scale(sx, sy, sz); return g; };
  if (co.tree === 'round' || co.tree === 'palm') items.length = 0;
  const parts = co.tree === 'round'
    ? [{ g: new THREE.CylinderGeometry(0.35, 0.5, 2.6, 7), c: co.trunk || 0x7a5232, y: 1.3 }, { g: sph(2.1, 1, 0.9, 1), c: co.leaf, y: 4.0 }, { g: sph(1.5, 1, 0.9, 1), c: co.leaf, y: 5.3, x: 0.5 }]
    : co.tree === 'palm'
      ? [{ g: new THREE.CylinderGeometry(0.22, 0.4, 5.5, 7), c: co.trunk, y: 2.75 }, { g: sph(2.6, 1, 0.22, 1), c: co.leaf, y: 5.6 }, { g: sph(1.7, 1, 0.3, 1), c: 0x2c9a4a, y: 5.9 }]
      : co.tree === 'puff'
        ? [{ g: sph(1.7, 1, 0.8, 1), c: co.leaf, y: 1.1 }, { g: sph(1.2, 1, 0.8, 1), c: co.leaf, y: 1.0, x: 1.6 }, { g: sph(1.2, 1, 0.8, 1), c: co.leaf, y: 0.9, x: -1.6 }, { g: sph(1.1, 1, 0.9, 1), c: co.leaf, y: 2.1 }]
        : co.tree === 'star'
          ? [{ g: new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), c: 0xb9a8ff, y: 1.2 }, { g: new THREE.OctahedronGeometry(1.1), c: co.leaf, y: 3.0, e: 0xffb800 }]
          : [{ g: new THREE.CylinderGeometry(0.3, 0.4, 1.8, 7), c: 0x7a5232, y: 0.9 }, { g: new THREE.ConeGeometry(1.9, 3.6, 8), c: co.leaf, y: 3.2 }, { g: new THREE.ConeGeometry(1.4, 3, 8), c: co.leaf, y: 5 }];
  const tm = new THREE.Matrix4(), pm2 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  parts.forEach((pt) => { const im = new THREE.InstancedMesh(pt.g, new THREE.MeshStandardMaterial({ color: pt.c, roughness: 0.9, emissive: pt.e || 0, emissiveIntensity: pt.e ? 0.7 : 0 }), items.length); im.userData.keep = false;
    items.forEach((it, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.ry); sv.setScalar(it.sc); pv.set(it.x, -0.36, it.z); tm.compose(pv, q, sv); pm2.makeTranslation(pt.x || 0, pt.y, 0); tm.multiply(pm2); im.setMatrixAt(i, tm); }); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; sc.add(im); });
  addProps(sc, co, rnd0(co.seed * 5 + 3), ext); gates = co.shape ? [makeArch(track, 32)] : [makeArch(track, 32), makeArch(track, L - 40)]; gates.forEach((g) => sc.add(g));
  // 파란 구슬(니트로)
  orbs = []; const Rr = rnd0(co.seed * 13 + 5), om = new THREE.MeshStandardMaterial({ color: 0x3dc0ff, emissive: 0x1a8cff, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.2 }), og = new THREE.IcosahedronGeometry(0.7, 1);
  for (let s = 140; s < L - (co.shape ? 60 : 120);) { const d0 = (Rr() * 2 - 1) * (W - 2.8), n = Rr() < 0.4 ? 3 : 1; for (let k = 0; k < n; k++) { const m = new THREE.Mesh(og, om); m.userData = { s: s + k * 11, d: d0, on: true, k: 1 }; sc.add(m); orbs.push(m); } s += 70 + Rr() * 110 + n * 11; }
  spawnHazards(sc, co, L);
}

/* ---------- 달리는 차들 ---------- */
let racers = [], player = null, mode = 'boot', raceT = 0, cdT = 0, cdShown = -1, finishOrder = [], camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camFov = 60, shake = 0, runId = 0, bumps = 0, nOrbs = 0, resultTimer = 0, finishS = 0;
const keys = { L: false, R: false, B: false, N: false };
const hud = { rank: -1, speed: -1, time: '', nitro: -1, coins: -1 };
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) { msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : ''); if (speak !== false) O.say(typeof speak === 'string' ? speak : text); }
const note = (t) => say(t, null, false);

function newRacer(def, isPlayer, slot, idx, colorIdx, eq) {
  const o = makeCarObject(def, colorIdx, eq); rScene.add(o.root);
  const r = Object.assign(o, { isPlayer, s: slot.s, d: slot.d, v: 0, dd: 0, u: 0, yaw: 0, nitro: isPlayer ? 0.35 : 0, nOn: false, brake: false, finished: false, fT: 0, wallCd: 0, hitCd: 0, slowT: 0, slowF: 1, spinT: 0, spinDur: 1, boostT: 0, magT: 0, shield: 0, hzCd: 0, tgtD: slot.d, tgtT: 2 + Math.random() * 2, wob: Math.random() * 6, idx, aiV: 0, travel: 0 });
  return r;
}
function startRace() {
  O.unlock(); runId++; $('tune').hidden = true; tuneSel = null; $('garage').hidden = true; $('hud').hidden = false; $('pad').hidden = false; $('count').hidden = false;
  const co = effCourse(); buildRace(co);
  racers = []; const slots = [{ s: 8, d: 2.6 }, { s: 8, d: -2.6 }, { s: 0, d: 2.6 }, { s: 0, d: -2.6 }];
  const pdef = CARS[prefs.car]; player = newRacer(pdef, true, slots[0], 0, colOf(pdef, prefs.color), eqOf(pdef)); racers.push(player);
  for (let i = 0; i < 3; i++) { const r = newRacer(CARS[(i + (prefs.car + 1)) % CARS.length], false, slots[i + 1], i + 1, aiColor(CARS[(i + (prefs.car + 1)) % CARS.length], colOf(pdef, prefs.color)), aiEq()); r.pace = DIFFS[prefs.diff].pace * (0.95 + i * 0.035); r.name = AI_COLORS[i]; racers.push(r); }
  // 진행 막대 점
  const pr = $('hudProg'); pr.querySelectorAll('u').forEach((u) => u.remove()); racers.slice(1).forEach((r, i) => { const u = document.createElement('u'); u.style.background = AI_COLORS[i]; r.dot = u; pr.appendChild(u); });
  finishOrder = []; raceT = 0; bumps = 0; nOrbs = 0; raceCoins = 0; heldItem = ''; rolling = false; fxs.length = 0; projs.length = 0; hud.coins = -1; updateItemUI(); finishS = co.shape ? 32 + co.laps * co.length : co.length - 40; lapNow = 1; mode = 'count'; cdT = 3.6; cdShown = -1; hud.rank = hud.speed = hud.nitro = -1; hud.time = '';
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
  r.slowT -= dt; r.boostT -= dt; r.spinT -= dt; r.magT -= dt; if (r.spinT > 0) inp *= 0.3;
  const base = r.isPlayer ? def.vmax : r.aiV, boost = r.nOn ? 1 : 0, top = base * (1 + (def.nmul - 1) * boost) * (r.slowT > 0 ? r.slowF : 1) * (r.boostT > 0 ? 1.3 : 1); let tgt = r.brake ? base * 0.42 : top; if (r.finished) tgt = 0;
  if (r.v < tgt) r.v += def.acc * (boost || r.boostT > 0 ? 2.2 : 1) * Math.max(0.05, 1 - r.v / (top * 1.12)) * dt; else r.v = Math.max(tgt, r.v - (r.brake || r.finished ? 28 : 10) * dt);
  r.u += (inp - r.u) * Math.min(1, dt * 10);
  const grip = def.lat * (0.4 + 0.6 * Math.min(1, r.v / 22)), assist = r.isPlayer ? (prefs.assist ? 0.4 : 1) : 0.4;
  let ddT = -r.u * grip + a.k * r.v * r.v * 0.045 * assist; if (r.isPlayer && prefs.assist && Math.abs(inp) < 0.1) ddT += -r.d * 0.7;
  r.dd += (ddT - r.dd) * Math.min(1, dt * 7); r.d += r.dd * dt; r.s += r.v * dt; r.travel += r.v * dt;
  r.wallCd -= dt; r.hitCd -= dt; const lim = W - 1.15;
  if (Math.abs(r.d) > lim) { const sg = Math.sign(r.d); r.d = sg * lim; if (sg * r.dd > 0) { r.dd = -sg * Math.abs(r.dd) * 0.3 - sg * 1.2; if (r.wallCd <= 0) { r.wallCd = 0.45; r.v *= 0.9; if (r.isPlayer) { bumps++; shake = 0.5; O.sfx('pop'); } } } }
  if (r.s >= finishS && !r.finished) { r.finished = true; r.fT = raceT; finishOrder.push(r); if (r.isPlayer) onPlayerFinish(); }
  { const endC = course.shape ? finishS + 90 : course.length - 3; if (r.s > endC) { r.s = endC; r.v = Math.min(r.v, 3); } }
}
function placeCar(r, dt, snap) {
  const a = track.at(r.s), x = a.x + a.nx * r.d, z = a.z + a.nz * r.d;
  const fx = a.tx * Math.max(r.v, 1) + a.nx * r.dd, fz = a.tz * Math.max(r.v, 1) + a.nz * r.dd, want = Math.atan2(fx, fz);
  let df = want - r.yaw; df = Math.atan2(Math.sin(df), Math.cos(df)); r.yaw = snap ? want : r.yaw + df * Math.min(1, dt * 12);
  r.root.position.set(x, a.y, z); r.root.rotation.y = r.yaw + (r.spinT > 0 ? (1 - r.spinT / r.spinDur) * Math.PI * 2 : 0);
  const pitchT = -Math.atan(a.slope); r.tilt.rotation.x += (pitchT - r.tilt.rotation.x) * Math.min(1, dt * 8);
  r.tilt.rotation.z += (-r.u * 0.045 * Math.min(1, r.v / r.def.vmax) - r.tilt.rotation.z) * Math.min(1, dt * 6);
  animWheels(r, r.v * dt, r.u); const fl = r.nOn || r.boostT > 0; r.flame.visible = fl; if (fl) r.flame.scale.set(1, 1, 0.8 + Math.random() * 0.5);
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
    racers.forEach((r) => stepRacer(r, dt)); collide(); hitCheck(dt); updateProjs(dt);
    if (player) orbs.forEach((m) => { const u = m.userData; const lp = course.shape ? course.length : 1e9, rel = ((player.s - u.s) % lp + lp * 1.5) % lp - lp / 2; if (!u.on && Math.abs(rel) > 40 && course.shape) { u.on = true; m.visible = true; } if (u.on && Math.abs(rel) < 2.6 + (player.magT > 0 ? 14 : 0) && Math.abs(u.d - player.d) < 2.1 + (player.magT > 0 ? W : 0)) { u.on = false; m.visible = false; player.nitro = Math.min(1, player.nitro + 0.26); nOrbs++; O.sfx('coin'); } });
  }
  racers.forEach((r) => placeCar(r, dt));
  shake = Math.max(0, shake - dt * 2);
}
function onPlayerFinish() {
  const place = finishOrder.indexOf(player) + 1, rid = runId, time = player.fT; mode = 'finish'; player.nOn = false;
  const key = course.key + ':' + player.def.id, old = save.best[key], newBest = !old || time < old; if (newBest) save.best[key] = time; if (place === 1) save.done[course.id] = 1; writeSave();
  const stars = place === 1 ? 3 : place === 2 ? 2 : 1, ord = ['', '1등', '2등', '3등', '4등'][place];
  O.sfx(place === 1 ? 'win' : 'ok'); say(ord + '으로 들어왔어요!', 'good', false);
  const title = place === 1 ? '1등! 최고예요!' : place === 2 ? '2등! 멋져요!' : '결승선 통과!', text = ord + ' · 기록 ' + fmtT(time) + (newBest ? ' (내 최고 기록!)' : '') + ' · 구슬 ' + nOrbs + '개' + (raceCoins ? ' · 주운 코인 ' + raceCoins + '개' : ''),
    speak = place === 1 ? '와! 일 등이에요! 정말 잘 달렸어요!' : place === 2 ? '이 등이에요! 멋지게 달렸어요!' : '결승선을 통과했어요! 끝까지 잘 달렸어요!';
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(스피드 레이스)', school: 'elem', topic: '스피드 레이스', level: prefs.diff + 1, engine: 'racing', rounds: 1, mistakes: 0, glow: 0, hand: 0, asked: 0, sec: Math.round(time) };
  const btns = [{ label: '🔁 다시 달리기', color: 'green', onClick: () => startRace() }, { label: '🚗 차를 바꾸기', color: 'orange', onClick: () => openGarage() }];
  if (place === 1 && prefs.course < COURSES.length - 1) btns.splice(1, 0, { label: '➡ 다음 코스 (' + COURSES[prefs.course + 1].name + ')', color: 'blue', onClick: () => { prefs.course++; writeSave(); startRace(); } });
  setTimeout(() => { if (rid === runId) O.finish({ stats: O.newStats(), entry, stars, title, text, speak, coins: 4 + (5 - place) * 3 + (course.laps ? (course.laps - 1) * 2 : 0) + raceCoins, mission: { lesson: 1 }, buttons: btns }); }, 1800);
}

/* ---------- 장애물 · 아이템 상자 · 아이템 ---------- */
let hzs = [], boxes = [], fxs = [], projs = [], raceCoins = 0, heldItem = '', rolling = false;
const txCache = {};
function txc(n) { if (!txCache[n]) { const t = new THREE.TextureLoader().load('assets/' + n + '.webp'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; txCache[n] = t; } return txCache[n]; }
const HZ = {
  puddle: { asp: 1.046, w: 6, flat: 1, slow: [0.72, 1.4], say: '물웅덩이! 미끌미끌' },
  oil: { asp: 1.135, w: 5.6, flat: 1, spin: 1.1, slow: [0.8, 0.8], say: '기름이에요! 빙글빙글' },
  mud: { asp: 0.875, w: 5, flat: 1, slow: [0.6, 1.7], say: '진흙이에요! 느려져요' },
  banana: { asp: 0.925, h: 2.1, spin: 1.0, vf: 0.85, say: '바나나 껍질! 빙글' },
  rock: { asp: 0.947, h: 2.7, vf: 0.55, say: '쿵! 바위를 부쉈어요' },
  blocks: { asp: 0.747, h: 3.3, vf: 0.55, say: '와르르! 블록을 부쉈어요' },
  ball: { asp: 0.909, h: 2.7, vf: 0.6, say: '통통! 공을 쳤어요' },
  cone: { asp: 0.909, h: 2.2, vf: 0.7, say: '콩! 고깔을 쳤어요' },
};
const HZ_W = { puddle: 2, oil: 1.2, mud: 1.2, banana: 1.5, rock: 1.5, blocks: 1.2, ball: 1.2, cone: 1.5 }, HZ_SKIP = { snow: ['mud'], volcano: ['puddle'], candy: ['rock'], space: ['mud', 'puddle'] };
const FX_ASP = { burst: 0.95, dust: 1.22, splash: 0.88, dizzy: 1.19, bubble: 1, coins: 1.0 };
const ITM = {
  shield: { n: '거품 방패', say: '거품 방패! 한 번은 막아 줘요' }, rocket: { n: '로켓 부스트', say: '로켓! 슝~' }, magnet: { n: '자석', say: '자석! 구슬이 달려와요' },
  oil: { n: '기름병', say: '기름병! 뒤에 뿌려요' }, bomb: { n: '비눗방울 폭탄', say: '비눗방울! 앞 차를 맞혀요' }, coinrain: { n: '코인 비', say: '코인 비! 와르르' },
};
const ITM_W = [{ shield: 3, magnet: 2, oil: 3, coinrain: 2, rocket: 0.5, bomb: 0.3 }, { shield: 2, magnet: 2, oil: 2, coinrain: 2, rocket: 2, bomb: 2 }, { shield: 1.5, magnet: 1.5, oil: 0.5, coinrain: 1.5, rocket: 4, bomb: 3 }];
function pickW(w) { const ks = Object.keys(w), tot = ks.reduce((a, k) => a + w[k], 0); let x = Math.random() * tot; for (const k of ks) { x -= w[k]; if (x <= 0) return k; } return ks[0]; }
function addHz(sc, type, s, d, perm, extra) {
  const H = HZ[type], a = track.at(s); let m;
  if (H.flat) { const w = H.w, dep = w / H.asp; m = new THREE.Mesh(new THREE.PlaneGeometry(w, dep), new THREE.MeshBasicMaterial({ map: txc('hz_' + type), transparent: true, alphaTest: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.geometry.userData.keep = false; m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2; m.rotation.y = Math.atan2(a.tx, a.tz); m.position.set(a.x + a.nx * d, a.y + 0.07, a.z + a.nz * d); m.userData = { type, s, d, on: true, rs: dep * 0.38, rd: w * 0.42, flat: 1 }; }
  else { m = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('hz_' + type), transparent: true, alphaTest: 0.3 })); m.center.set(0.5, 0.02); m.scale.set(H.h * H.asp, H.h, 1); m.position.set(a.x + a.nx * d, a.y, a.z + a.nz * d); m.userData = { type, s, d, on: true, rs: 1.6, rd: 1.7 }; }
  Object.assign(m.userData, extra || {}); m.userData.perm = !!perm; sc.add(m); hzs.push(m); return m;
}
function spawnHazards(sc, co, L) {
  hzs = []; boxes = []; const Rh = rnd0(co.seed * 17 + 9), skip = HZ_SKIP[co.id] || [], w = {}; Object.keys(HZ_W).forEach((k) => { if (!skip.includes(k)) w[k] = HZ_W[k]; });
  const rows = []; for (let s = 210; s < L - 90; s += 185 + Rh() * 70) rows.push(s);
  rows.forEach((s) => { for (const dd of [-4.6, 0, 4.6]) { const a = track.at(s), m = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('bx_box'), transparent: true, alphaTest: 0.3 })); m.scale.set(3.1, 3.1, 1); m.userData = { s, d: dd, on: true, rs: 2.4, rd: 2.3, base: a.y + 1.9, ph: Rh() * 6 }; m.position.set(a.x + a.nx * dd, m.userData.base, a.z + a.nz * dd); sc.add(m); boxes.push(m); } });
  for (let s = 150 + Rh() * 60; s < L - 80; s += 70 + Rh() * 90) {
    if (rows.some((r) => Math.abs(r - s) < 22)) { s += 26; }
    let k = pickW(Object.fromEntries(Object.keys(w).map((q) => [q, w[q] * (0.6 + Rh())]))), d = (Rh() * 2 - 1) * (W - 2.8), n = (!HZ[k].flat && Rh() < 0.3) ? 2 : 1;
    for (let i = 0; i < n; i++) addHz(sc, k, s + i * 8, Math.max(-W + 2.4, Math.min(W - 2.4, d + (i ? (Rh() < 0.5 ? -3.6 : 3.6) : 0))), true);
  }
}
function fx(kind, x, y, z, size, life, rise) {
  if (!rScene) return; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('fx_' + kind), transparent: true, depthWrite: false })); sp.position.set(x, y, z); sp.scale.set(size * FX_ASP[kind], size, 1); sp.userData = { t: 0, life, size, rise: rise || 0, asp: FX_ASP[kind] }; rScene.add(sp); fxs.push(sp);
}
const fxAt = (r, kind, size, life, rise, dy) => fx(kind, r.root.position.x, r.root.position.y + (dy === undefined ? 1.4 : dy), r.root.position.z, size, life, rise);
function setSpin(r, dur) { r.spinT = dur; r.spinDur = dur; }
function hitMsg(r, t) { if (r.isPlayer) { note(t); O.sfx('pop'); shake = Math.max(shake, 0.4); } }
function hzHit(r, m, u) {
  const H = HZ[u.type]; if (u.owner === r && raceT - u.born < 1.4) return;
  const pw = r.boostT > 0, p = m.position;
  if (H.flat) {
    if (r.hzCd > 0) return; r.hzCd = 0.8;
    if (r.shield) { r.shield = 0; fxAt(r, 'burst', 3, 0.5); if (r.isPlayer) { note('방패가 막아 줬어요!'); O.sfx('ok'); } return; }
    if (pw) return;
    if (H.slow) { r.slowT = H.slow[1]; r.slowF = H.slow[0]; r.v *= Math.min(1, H.slow[0] + 0.12); }
    if (H.spin) { setSpin(r, H.spin); fxAt(r, 'dizzy', 2.6, H.spin, 0, 2.6); }
    fxAt(r, u.type === 'puddle' ? 'splash' : 'dust', 3, 0.6, 1, 0.9); hitMsg(r, H.say); return;
  }
  u.on = false; m.visible = false;
  if (r.shield) { r.shield = 0; fx('burst', p.x, p.y + 1.2, p.z, 3.4, 0.5); if (r.isPlayer) { note('방패가 막아 줬어요!'); O.sfx('ok'); } }
  else if (!pw) { r.v *= H.vf; if (H.spin) { setSpin(r, H.spin); fxAt(r, 'dizzy', 2.6, H.spin, 0, 2.6); } else { r.slowT = 0.7; r.slowF = 0.72; } hitMsg(r, H.say); }
  else if (r.isPlayer) { note('와! 쾅! 부쉈어요!'); O.sfx('coin'); }
  fx('dust', p.x, p.y + 1, p.z, 3.2, 0.6, 1.2); fx('burst', p.x, p.y + 1.4, p.z, 2.6, 0.5, 1);
  if (r.isPlayer && !H.spin) { raceCoins++; if (!heldItem && !rolling && Math.random() < 0.35) giveItem(); }
  if (u.owner) { hzs.splice(hzs.indexOf(m), 1); rScene.remove(m); }
}
function boxHit(r, m, u) {
  u.on = false; m.visible = false; const p = m.position; fx('burst', p.x, p.y, p.z, 5, 0.7, 1); fx('burst', p.x, p.y, p.z, 3.2, 0.5, 0.4);
  if (r.isPlayer) { O.sfx('coin'); giveItem(); } else r.boostT = Math.max(r.boostT, 1.6);
}
function hitCheck(dt) {
  const lp = course.shape ? course.length : 1e9, ph = (list, fn) => list.slice().forEach((m) => { const u = m.userData; if (!u.on) return; if (u.life && raceT - u.born > u.life) { hzs.splice(hzs.indexOf(m), 1); rScene.remove(m); return; } racers.forEach((r) => { if (r.finished || !u.on) return; const rel = ((r.s - u.s) % lp + lp * 1.5) % lp - lp / 2; if (Math.abs(rel) < u.rs && Math.abs(r.d - u.d) < u.rd) fn(r, m, u); }); });
  racers.forEach((r) => { r.hzCd -= dt; }); ph(hzs, hzHit); ph(boxes, boxHit);
  if (course.shape && player) [...hzs, ...boxes].forEach((m) => { const u = m.userData; if (!u.on && !u.owner) { const rel = ((player.s - u.s) % lp + lp * 1.5) % lp - lp / 2; if (Math.abs(rel) > 70) { u.on = true; m.visible = true; } } });
}
function giveItem() {
  if (!player) return; if (heldItem || rolling) { raceCoins += 2; player.nitro = Math.min(1, player.nitro + 0.12); note('코인 +2'); return; }
  const place = Math.min(3, ranks().indexOf(player) + 1) - 1, pick = pickW(ITM_W[Math.max(0, place)]), rid = runId; rolling = true; let n = 0; const names = Object.keys(ITM);
  const tick = () => { if (rid !== runId || mode === 'garage') { rolling = false; return; } n++; if (n < 9) { setItemUi(names[n % names.length], true); O.sfx('tick'); setTimeout(tick, 70 + n * 12); } else { rolling = false; heldItem = pick; setItemUi(pick); O.sfx('ok'); say(ITM[pick].say, 'good', ITM[pick].n + '!'); } };
  tick();
}
function setItemUi(name, spin) { const b = $('btnI'); b.innerHTML = name ? '<img src="assets/it_' + name + '.webp" alt="" draggable="false">' : ''; b.classList.toggle('has', !!name && !spin); b.classList.toggle('roll', !!spin); b.disabled = !name || !!spin; b.setAttribute('aria-label', name && !spin ? ITM[name].n + ' 쓰기' : '아이템 칸'); }
function updateItemUI() { setItemUi(heldItem); }
function useItem() {
  if (mode !== 'race' || !heldItem || rolling || !player) return; const it = heldItem; heldItem = ''; updateItemUI(); O.sfx('ok');
  if (it === 'shield') { player.shield = 1; note('방패를 썼어요!'); }
  else if (it === 'rocket') { player.boostT = 2.8; fxAt(player, 'burst', 3, 0.5); note('로켓 부스트!'); shake = 0.5; }
  else if (it === 'magnet') { player.magT = 7; note('자석! 구슬이 달려와요'); }
  else if (it === 'oil') { addHz(rScene, 'oil', player.s - 9, player.d, false, { owner: player, born: raceT, life: 14 }); note('기름을 뿌렸어요!'); }
  else if (it === 'coinrain') { raceCoins += 6; fxAt(player, 'coins', 5, 1.2, 1.5, 3); O.sfx('coin'); note('코인 +6!'); }
  else if (it === 'bomb') {
    const t = racers.filter((o) => o !== player && !o.finished && o.s > player.s && o.s - player.s < 320).sort((a, b) => a.s - b.s)[0];
    if (!t) { player.nitro = Math.min(1, player.nitro + 0.3); note('앞에 차가 없어서 니트로로 바뀌었어요'); return; }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('it_bomb'), transparent: true, depthWrite: false })); sp.scale.set(1.9 * 0.656, 1.9, 1); rScene.add(sp); projs.push({ sp, from: player, to: t, t: 0, dur: Math.max(0.5, Math.min(1.2, (t.s - player.s) / 70)) }); note('비눗방울 발사!');
  }
}
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) { const q = projs[i]; q.t += dt; const k = Math.min(1, q.t / q.dur), a = q.from.root.position, b = q.to.root.position; q.sp.position.set(a.x + (b.x - a.x) * k, a.y + 1.5 + Math.sin(k * Math.PI) * 2.2 + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
    if (k >= 1) { rScene.remove(q.sp); projs.splice(i, 1); const t = q.to; if (t.shield) { t.shield = 0; fxAt(t, 'burst', 3, 0.5); } else { t.slowT = 2.4; t.slowF = 0.55; t.v *= 0.6; fxAt(t, 'splash', 3.6, 0.7, 1, 1.2); } if (t.isPlayer) { note('비눗방울에 맞았어요!'); O.sfx('pop'); shake = 0.4; } } }
}
function animWorld(now, dt) {
  const bs = 1 + Math.sin(now / 260) * 0.06; boxes.forEach((m) => { if (!m.visible) return; const u = m.userData; m.position.y = u.base + Math.sin(now / 340 + u.ph) * 0.28; m.material.rotation = Math.sin(now / 420 + u.ph) * 0.14; m.scale.set(3.1 * bs, 3.1 * bs, 1); });
  for (let i = fxs.length - 1; i >= 0; i--) { const s = fxs[i], u = s.userData; u.t += dt; const p = u.t / u.life; if (p >= 1) { rScene.remove(s); s.material.dispose(); fxs.splice(i, 1); continue; } const e = 1 - Math.pow(1 - p, 3), sz = u.size * (0.55 + 0.75 * e); s.scale.set(sz * u.asp, sz, 1); s.position.y += u.rise * dt; s.material.opacity = Math.max(0, 1 - p * p * p); }
  racers.forEach((r) => { if (r.shield) { if (!r.shSp) { r.shSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('fx_bubble'), transparent: true, depthWrite: false, opacity: 0.7 })); r.shSp.position.set(0, 1.2, 0); r.root.add(r.shSp); } const q = 5 + Math.sin(now / 200) * 0.25; r.shSp.scale.set(q, q, 1); r.shSp.visible = true; } else if (r.shSp) r.shSp.visible = false; });
}

/* ---------- 카메라 ---------- */
function camTargets(sCam, dCam) {
  const a = track.at(Math.max(0, sCam - 9.5)), l = track.at(sCam + 12), k = 0.85;
  const dl = dCam * k; return { px: a.x + a.nx * dl, py: a.y + 3.1, pz: a.z + a.nz * dl, lx: l.x + l.nx * dl * 0.9, ly: l.y + 2.3, lz: l.z + l.nz * dl * 0.9 };
}
function snapCamera() {
  const p = player || racers[0]; const t = camTargets(p.s - (mode === 'count' ? 3 : 0), p.d); camPos.set(t.px, t.py, t.pz); camLook.set(t.lx, t.ly, t.lz); camFov = 60;
}
function updateCamera(dt) {
  if (!player) return; const p = player, k = 1 - Math.exp(-dt * 7);
  const t = camTargets(p.s + (mode === 'count' ? -4 + Math.min(1, (3.6 - cdT) / 3.6) * 4 : 0), p.d);
  camPos.x += (t.px - camPos.x) * k; camPos.y += (t.py - camPos.y) * k; camPos.z += (t.pz - camPos.z) * k;
  camLook.x += (t.lx - camLook.x) * k; camLook.y += (t.ly - camLook.y) * k; camLook.z += (t.lz - camLook.z) * k;
  const sp = Math.min(1, p.v / (p.def.vmax * 1.1)), fovT = 58 + sp * 12 + (p.nOn || p.boostT > 0 ? 9 : 0); camFov += (fovT - camFov) * Math.min(1, dt * 4);
  camera.fov = camFov; camera.updateProjectionMatrix();
  const sh = shake * 0.25 + (p.nOn ? 0.05 : 0); camera.position.set(camPos.x + (Math.random() - 0.5) * sh, camPos.y + (Math.random() - 0.5) * sh, camPos.z + (Math.random() - 0.5) * sh); camera.lookAt(camLook); if (backdrop) { backdrop.position.x = camera.position.x; backdrop.position.z = camera.position.z; }
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
  const lapC = course.shape ? Math.max(1, Math.min(course.laps, Math.floor((player.s - 32) / course.length) + 1)) : 0, tt = fmtT(mode === 'finish' ? player.fT : raceT) + (lapC ? '  🏁 ' + lapC + '/' + course.laps : ''); if (tt !== hud.time) { hud.time = tt; $('hudTime').textContent = tt; }
  if (lapC && lapC !== lapNow && mode === 'race') { lapNow = lapC; say(lapC === course.laps ? '마지막 바퀴예요! 힘내요!' : lapC + '바퀴째! 잘 달려요!', 'good', lapC === course.laps ? '마지막 바퀴예요! 힘내요!' : lapC + '바퀴째예요!'); }
  if (hud.coins !== raceCoins) { hud.coins = raceCoins; $('hudCoins').innerHTML = '<img class="ui coin" src="assets/ui_coin.webp" alt="">' + raceCoins; }
  const nv = Math.round(player.nitro * 100); if (nv !== hud.nitro) { hud.nitro = nv; $('nitroFill').style.width = nv + '%'; $('hudNitro').classList.toggle('full', nv >= 99); $('btnN').disabled = nv < 2; }
  const pw = $('hudProg').clientWidth, f = (r) => Math.min(1, r.s / finishS) * 100 + '%';
  $('progFill').style.width = f(player); $('progMe').style.left = f(player); racers.forEach((r) => { if (r.dot) r.dot.style.left = f(r); });
}

/* ---------- 차고 ---------- */
const LENS = [{ name: '짧은 길', f: 0.7 }, { name: '긴 길', f: 1 }];
function effCourse() { const c = COURSES[prefs.course], lp = Math.max(1, Math.min(5, prefs.laps | 0 || 3)), ln = prefs.len === 0 ? 0 : 1; return Object.assign({}, c, { length: Math.round(c.length * LENS[ln].f / 4) * 4, laps: lp, key: c.id + (lp === 3 && ln === 1 ? '' : '_' + lp + 'x' + ln) }); }
function bestOf(courseKey, carId) { return save.best[courseKey + ':' + carId]; }
function renderGarageInfo() {
  const d = CARS[gIdx]; $('carSub').textContent = d.sub; $('carName').textContent = d.name;
  const b = bestOf(effCourse().key, d.id); $('carBest').textContent = b ? '🏆 이 코스 최고 기록 ' + fmtT(b) : '아직 달린 기록이 없어요';
  const SI = ['speed', 'accel', 'steer', 'nitro'];
  $('carStats').innerHTML = d.stats.map((v, i) => '<div class="gp-st"><img class="ui" src="assets/ui_c_' + SI[i] + '.webp" alt=""><span>' + STAT_NAMES[i] + '</span><span class="bar">' + [1, 2, 3, 4, 5].map((k) => '<i class="' + (k <= v ? 'on' : '') + '"></i>').join('') + '</span></div>').join('');
  $('credit').innerHTML = !d.src ? '카툰 자동차: 옥쌤의 즐거운 교실에서 코드로 만든 모델이에요.' : '차 모델: “' + d.title + '” — <a href="https://sketchfab.com/outpiston" target="_blank" rel="noopener">OUTPISTON</a> · <a href="' + d.src + '" target="_blank" rel="noopener">Sketchfab</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>';
  const chip = (k, v, label, on) => '<button type="button" class="gp-chip' + (on ? ' on' : '') + '" data-' + k + '="' + v + '">' + label + '</button>';
  $('colorRow').innerHTML = d.colors ? TOY_COLORS.map((c, i) => '<button type="button" class="rc-sw' + (colOf(d, prefs.color) === i ? ' on' : '') + '" data-cl="' + i + '" style="background:#' + c[0].toString(16).padStart(6, '0') + '" aria-label="' + c[1] + '"></button>').join('') : '<p class="gp-note">이 차는 원래 색 그대로예요.</p>';
  document.querySelectorAll('.gp-qb button').forEach((q) => { q.disabled = !d.build; });
  $('courseRow').innerHTML = COURSES.map((c, i) => '<button type="button" class="gp-cc' + (prefs.course === i ? ' on' : '') + (save.done[c.id] ? ' done' : '') + '" data-co="' + i + '"><img src="assets/th_' + c.bg.slice(3) + '.webp" alt="" draggable="false"><span>' + c.emoji + ' ' + c.name + '</span></button>').join('');
  const grp = (icon, label, inner) => '<div class="gp-g"><label><img class="ui" src="assets/ui_' + icon + '.webp" alt="">' + label + '</label><div>' + inner + '</div></div>';
  $('opts').innerHTML = grp('flag', '바퀴 수', [1, 2, 3, 4, 5].map((n) => chip('lp', n, n, prefs.laps === n)).join('')) + grp('c_road', '길이', LENS.map((x, i) => chip('ln', i, x.name, prefs.len === i)).join('')) + grp('c_people', '상대', DIFFS.map((x) => chip('df', x.id, x.name, prefs.diff === x.id)).join('')) + grp('c_steer', '핸들 도움', chip('as', 1, '켜기', !!prefs.assist) + chip('as', 0, '끄기', !prefs.assist));
  const on = (sel, fn) => document.querySelectorAll(sel).forEach((b) => { b.onclick = () => fn(b); });
  on('#colorRow [data-cl]', (b) => { prefs.color = +b.dataset.cl; writeSave(); O.sfx('tick'); showGarageCar(gIdx); say(TOY_COLORS[prefs.color][1] + ' 차예요!', null, TOY_COLORS[prefs.color][1] + ' 차예요!'); });
  on('#courseRow [data-co]', (b) => { prefs.course = +b.dataset.co; writeSave(); O.sfx('tick'); renderGarageInfo(); });
  on('#opts [data-lp]', (b) => { prefs.laps = +b.dataset.lp; writeSave(); O.sfx('tick'); renderGarageInfo(); });
  on('#opts [data-ln]', (b) => { prefs.len = +b.dataset.ln; writeSave(); O.sfx('tick'); renderGarageInfo(); });
  on('#opts [data-df]', (b) => { prefs.diff = +b.dataset.df; writeSave(); O.sfx('tick'); renderGarageInfo(); });
  on('#opts [data-as]', (b) => { prefs.assist = +b.dataset.as; writeSave(); O.sfx('tick'); renderGarageInfo(); });
  on('.gp-qb [data-q]', (b) => openTune(b.dataset.q));
  const sel = $('courseRow').querySelector('.on'); if (sel && $('courseRow').scrollTo) { const row = $('courseRow'); row.scrollTo({ left: sel.offsetLeft - (row.clientWidth - sel.offsetWidth) / 2, behavior: 'auto' }); }
}
/* ---------- 내 차고 꾸미기 (코인으로 사서 달아요) ---------- */
const coinsNow = () => { try { return O.eco.info().coins; } catch (e) { return 0; } };
function rebuildGarageCar() { if (gCar) turn.remove(gCar.root); gCar = makeCarObject(CARS[gIdx], colOf(CARS[gIdx], prefs.color), eqOf(CARS[gIdx])); turn.add(gCar.root); gPop = 1; }
function openTune(slot) {
  if (typeof slot === 'string' && SLOTS.some((x) => x.id === slot)) tuneSlot = slot; O.unlock(); O.sfx('tick'); tuneSel = null; $('garage').hidden = true; $('tune').hidden = false; renderTune(); resize(); say('코인으로 차를 꾸며요!', null, '코인으로 내 차를 꾸며요! 마음에 드는 걸 눌러 보세요.');
}
function closeTune() { O.sfx('tick'); tuneSel = null; rebuildGarageCar(); $('tune').hidden = true; $('garage').hidden = false; renderGarageInfo(); resize(); say('타고 싶은 차를 골라요.', null, false); }
function renderTune() {
  const d = CARS[gIdx], slots = SLOTS.filter((x) => d.build || !x.toy); if (!slots.some((x) => x.id === tuneSlot)) tuneSlot = slots[0].id;
  const eq = save.gar.eq[d.id] || {};
  $('tuneTitle').innerHTML = uiImg('tools') + ' ' + d.name + ' 꾸미기';
  $('tuneTabs').innerHTML = slots.map((x) => '<button type="button" class="rc-tab' + (x.id === tuneSlot ? ' on' : '') + '" data-sl="' + x.id + '">' + uiImg(SLOT_IMG[x.id]) + '<span>' + x.name + '</span>' + (eq[x.id] ? '<i>✓</i>' : '') + '</button>').join('');
  const list = [{ id: '', icon: '✖️', name: '기본', price: 0 }].concat(ITEMS.filter((i) => i.slot === tuneSlot)), cur = (tuneSel && tuneSel.slot === tuneSlot) ? tuneSel.id : (eq[tuneSlot] || '');
  $('tuneItems').innerHTML = list.map((i) => { const own = !i.id || save.gar.owned[i.id], on = cur === i.id; return '<button type="button" class="rc-item' + (on ? ' on' : '') + (own ? ' own' : '') + '" data-it="' + i.id + '">' + itemThumb(i, tuneSlot) + '<span>' + i.name + '</span><em>' + (!i.id ? (eq[tuneSlot] ? '벗기' : '지금 모습') : (eq[tuneSlot] === i.id ? '달았어요 ✓' : own ? '내 것' : COIN + i.price)) + '</em></button>'; }).join('');
  const sel = tuneSel && tuneSel.slot === tuneSlot && tuneSel.id && !save.gar.owned[tuneSel.id] ? ITEM[tuneSel.id] : null, buy = $('tuneBuy');
  if (sel) { const ok = coinsNow() >= sel.price; buy.hidden = false; buy.disabled = !ok; buy.innerHTML = ok ? COIN + ' ' + sel.price + ' 코인으로 사기' : uiImg('lock', 'lk') + ' 코인이 모자라요 (' + coinsNow() + ' / ' + sel.price + ')'; } else buy.hidden = true;
  $('tuneTabs').querySelectorAll('[data-sl]').forEach((b) => { b.onclick = () => { O.sfx('tick'); tuneSlot = b.dataset.sl; tuneSel = null; rebuildGarageCar(); renderTune(); }; });
  $('tuneItems').querySelectorAll('[data-it]').forEach((b) => { b.onclick = () => {
    const id = b.dataset.it, it = ITEM[id], own = !id || save.gar.owned[id];
    if (own) { save.gar.eq[d.id] = Object.assign({}, save.gar.eq[d.id] || {}); if (id) save.gar.eq[d.id][tuneSlot] = id; else delete save.gar.eq[d.id][tuneSlot]; tuneSel = null; writeSave(); O.sfx('ok'); rebuildGarageCar(); renderTune(); if (it) say(it.name + ' 달았어요!', null, it.name + ' 달았어요!'); }
    else { tuneSel = { carId: d.id, slot: tuneSlot, id }; O.sfx('tick'); rebuildGarageCar(); renderTune(); say(it.name + ' · 🪙 ' + it.price, null, it.name + '! 마음에 들면 사요.'); }
  }; });
}
$('tuneBuy').onclick = () => {
  const sel = tuneSel && ITEM[tuneSel.id]; if (!sel || save.gar.owned[sel.id]) return; if (!O.eco || !O.eco.spend(sel.price)) { O.sfx('no'); O.toast && O.toast('코인이 조금 모자라요. 공부하고 경기하면 모여요!'); return; }
  save.gar.owned[sel.id] = 1; save.gar.eq[tuneSel.carId] = Object.assign({}, save.gar.eq[tuneSel.carId] || {}, { [sel.slot]: sel.id }); tuneSel = null; writeSave(); O.sfx('win'); rebuildGarageCar(); renderTune(); say(sel.name + ' 샀어요! 멋져요!', 'good', sel.name + ' 샀어요! 멋져요!');
};
$('tuneBtn').onclick = openTune; $('tuneBack').onclick = closeTune;
try { O.eco.hud($('tuneHud')); } catch (e) {}
function openGarage() {
  runId++; mode = 'garage'; stopEngine(); O.hush && O.hush(); $('hud').hidden = true; $('pad').hidden = true; $('count').hidden = true; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  $('tune').hidden = true; tuneSel = null; $('garage').hidden = false; $('btnMenu').textContent = '🏁 달리기'; showGarageCar(prefs.car); resize(); say('타고 싶은 차를 골라요.', null, '타고 싶은 차를 골라요. 화살표를 눌러 바꿀 수 있어요.');
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
$('btnI').onclick = () => useItem();
const setL = bindBtn('btnL', 'L'), setR = bindBtn('btnR', 'R'), setB = bindBtn('btnB', 'B'), setN = bindBtn('btnN', 'N');
const KEYMAP = { ArrowLeft: setL, a: setL, A: setL, ArrowRight: setR, d: setR, D: setR, ArrowDown: setB, s: setB, S: setB, ' ': setN, ArrowUp: setN, w: setN, W: setN, Shift: setN };
window.addEventListener('keydown', (e) => { if (e.repeat) return; if (mode === 'garage') { if (e.key === 'ArrowLeft') $('carPrev').click(); else if (e.key === 'ArrowRight') $('carNext').click(); else if (e.key === 'Enter') startRace(); return; } if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === 'x' || e.key === 'X') { e.preventDefault(); useItem(); return; } const f = KEYMAP[e.key]; if (f) { e.preventDefault(); f(true); } });
window.addEventListener('keyup', (e) => { const f = KEYMAP[e.key]; if (f) f(false); });
window.addEventListener('blur', () => { setL(false); setR(false); setB(false); setN(false); });

/* ---------- 화면 맞춤·반복 ---------- */
const GBG = { gar1: { w: 1672, h: 941, cx: 0.5, cy: 0.742, pw: 0.7 }, gar2: { w: 1672, h: 941, cx: 0.5, cy: 0.64, pw: 0.66 } };
function garageBg(w, h) {
  if (mode !== 'garage' && mode !== 'boot') { canvas.style.backgroundImage = ''; return; }
  const k = !$('tune').hidden ? 'gar2' : 'gar1', g = GBG[k], v = new THREE.Vector3(0, 0, 0).project(camera), v2 = new THREE.Vector3(3.6, 0, 0).project(camera);
  const px = (v.x + 1) / 2 * w, py = (1 - v.y) / 2 * h, pr = Math.abs(v2.x - v.x) / 2 * w;
  let s = Math.max(w / g.w, h / g.h); s = Math.max(s, Math.min(pr * 2 / (g.pw * g.w), s * 1.6));
  const iw = g.w * s, ih = g.h * s; let ox = px - g.cx * iw, oy = py - g.cy * ih; ox = Math.min(0, Math.max(w - iw, ox)); oy = Math.min(0, Math.max(h - ih, oy));
  canvas.style.backgroundImage = 'url(assets/' + k + '.webp)'; canvas.style.backgroundRepeat = 'no-repeat'; canvas.style.backgroundSize = iw + 'px ' + ih + 'px'; canvas.style.backgroundPosition = ox + 'px ' + oy + 'px';
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  if (mode === 'garage' || mode === 'boot') {
    camera.fov = 34; const vf = THREE.MathUtils.degToRad(camera.fov) / 2, dist = Math.max(8.6, 4.8 / (Math.tan(vf) * camera.aspect)) * ($('tune').hidden ? (w >= 900 && h > 620 ? 1.45 : 1.2) : 1);
    camera.position.set(0, 1.7 + dist * 0.06, dist); camera.lookAt(0, 0.85, 0);
    let panel = 0, top = h < 720 ? 100 : 120;
    if (!$('tune').hidden) panel = $('tune').offsetHeight + 12;
    else if (!$('garage').hidden) { const bt = $('garage').querySelector('.gp-bot'), md = $('garage').querySelector('.gp-mid'), tp = $('garage').querySelector('.gp-top'), stacked = getComputedStyle(md).position !== 'absolute' && getComputedStyle(md).display !== 'none'; panel = bt.offsetHeight + (stacked ? md.offsetHeight : 0) + 8; top = 56 + tp.offsetHeight; }
    camera.setViewOffset(w, h, 0, (panel - top) / 2, w, h);
  } else camera.clearViewOffset();
  camera.updateProjectionMatrix(); garageBg(w, h);
}
window.addEventListener('resize', resize);
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'garage') {
    if (gCar) { gYaw += gSpin * dt; gCar.root.rotation.y = gYaw; gPop = Math.min(1, gPop + dt * 3.2); const e = 1 - Math.pow(1 - gPop, 3); gCar.root.scale.setScalar(0.7 + 0.3 * e); gCar.root.position.y = (1 - e) * 0.4; animWheels(gCar, 0, 0); animParts(gCar, now, dt); }
    renderer.render(gScene, camera);
  } else if (rScene) {
    simulate(dt); updateCamera(dt); updateHud(); engineUpdate(); racers.forEach((r) => animParts(r, now, dt)); animWorld(now, dt);
    orbs.forEach((m) => { if (!m.visible) return; const u = m.userData, a = track.at(u.s); m.position.set(a.x + a.nx * u.d, a.y + 1.3 + Math.sin(now / 300 + u.s) * 0.2, a.z + a.nz * u.d); m.rotation.y = now / 400; });
    renderer.render(rScene, camera);
  }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopEngine(); } else if (mode === 'race' || mode === 'count') startEngine(); });

window.__race = { get mode() { return mode; }, get item() { return heldItem; }, get coins() { return raceCoins; }, get hzs() { return hzs; }, get boxes() { return boxes; }, give(n) { heldItem = n; updateItemUI(); }, use: () => useItem(), get racers() { return racers; }, get player() { return player; }, get track() { return track; }, keys, step(n, dt) { for (let i = 0; i < n; i++) simulate(dt || 0.033); updateHud(); }, snap: () => { snapCamera(); updateCamera(1); }, start: startRace, garage: openGarage, prefs, protos, W };

(async function boot() {
  resize(); requestAnimationFrame(frame);
  try { await loadModels((p) => { $('loadText').textContent = '차를 가져오는 중… ' + Math.round(p * 100) + '%'; }); }
  catch (e) { $('loading').innerHTML = '<div><p>차 모델을 불러오지 못했어요.<br>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
  openGarage(); $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
})();
