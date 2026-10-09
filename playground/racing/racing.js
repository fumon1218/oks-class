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
  { id: 'toy_red1', file: 'assets/toy_red1.glb', split: { fz: 0.327, rz: -0.31, y: 0.14, r: 0.17, ix: 0.215 }, scale: 4, wr: 0.56, name: '레드 원', sub: '3D 장난감 · 1번 레이서 · 반짝 광택', title: '', src: '', front: 1, vmax: 62, acc: 24, lat: 12, nmul: 1.3, stats: [4, 4, 4, 4] },
  { id: 'toy_red2', file: 'assets/toy_red2.glb', split: { fz: 0.285, rz: -0.335, y: 0.12, r: 0.135, ix: 0.2 }, scale: 4, wr: 0.5, name: '레드 포뮬러', sub: '3D 장난감 · 날렵한 오픈휠 · 가장 빨라요', title: '', src: '', front: 1, vmax: 68, acc: 24, lat: 10.5, nmul: 1.3, stats: [5, 4, 3, 4] },
  { id: 'rx7', heavy: true, file: 'assets/rx7.glb', name: '마쓰다 RX-7', sub: '2002 · 일본 스포츠카', title: '2002 Mazda RX-7 Spirit-R', src: 'https://sketchfab.com/3d-models/2002-mazda-rx-7-spirit-r-277e2569280d4c9fa3bc3a85bbc627f1', front: 1, vmax: 56, acc: 24, lat: 12.5, nmul: 1.3, stats: [3, 4, 5, 3] },
  { id: 'm720', heavy: true, file: 'assets/mclaren720s.glb', name: '맥라렌 720S GT3', sub: '2019 · 영국 레이싱카', title: '2019 McLaren 720S GT3', src: 'https://sketchfab.com/3d-models/2019-mclaren-720s-gt3-cdf4ca67a56b497493931e8852e70b05', front: 1, vmax: 70, acc: 19, lat: 10.5, nmul: 1.26, stats: [5, 3, 3, 4] },
  { id: 'carrera', heavy: true, file: 'assets/car_carrera.glb', paint: 'Material.001', colors: true, dc: 6, wr: 0.338, name: '카레라 쿠페', sub: '클래식 · 뒤쪽 꼬리날개 · 균형형', credit: ['CARRERA.MAX (Original Porker 2)', 'Geedtopia', 'https://sketchfab.com/3d-models/carreramax-original-porker-2-3a932ae988154bd480b0e8b38a7efd6c', 'CC BY-NC 4.0'], front: 1, vmax: 62, acc: 23, lat: 12.5, nmul: 1.3, stats: [4, 4, 4, 4] },
  { id: 'chevy57', heavy: true, file: 'assets/car_chevy.glb', paint: 'Material.001', colors: true, dc: 7, wr: 0.302, name: '클래식 쿠페 57', sub: '1957 · 꼬리 날개가 멋진 옛날 차 · 든든해요', credit: ['CHEVY.MAX (Unused)', 'Geedtopia', 'https://sketchfab.com/3d-models/chevymax-unused-6dacdbb7581e4858a1f16adad6861664', 'CC BY-NC 4.0'], front: 1, vmax: 56, acc: 21, lat: 11, nmul: 1.3, stats: [3, 3, 4, 4] },
  { id: 'niva', file: 'assets/car_niva.glb', kit: { R: 0.36, fz: 1.22, rz: -1.11, hx: 0.7, w: 0.62 }, paint: 'Scene_-_Root', colors: true, dc: 0, wr: 0.36, name: '니바 짱짱', sub: '네모 SUV · 휠을 골라 끼워요 · 숲길 친구', credit: ['caisse Niva', 'Configcars / maxipub', 'https://sketchfab.com/3d-models/caisse-niva-14a2140480a74d39b0446950ea56764f', 'CC BY 4.0'], front: 1, vmax: 54, acc: 24, lat: 13, nmul: 1.3, stats: [3, 4, 5, 3] },
  { id: 'pickup', file: 'assets/car_pickup.glb', kit: { R: 0.44, fz: 1.84, rz: -1.39, hx: 0.8, w: 0.62 }, paint: 'White', colors: true, dc: 3, wr: 0.44, name: '픽업 트럭', sub: '큰 바퀴 · 휠을 골라 끼워요 · 튼튼해요', credit: ['Generic American C/K \'72', 'Jorma Rysky', 'https://sketchfab.com/3d-models/generic-american-ck-72-ae3b6fe3863f4bb498cef95945584aaa', 'CC BY 4.0'], front: 1, vmax: 54, acc: 22, lat: 11.5, nmul: 1.3, stats: [3, 3, 4, 4] },
];
const RIMS = [
  { id: 'borbet', name: '보르베트', file: 'assets/wh_borbet.glb', credit: ['Borbet A Car Rim', 'st.Angelo', 'https://sketchfab.com/3d-models/borbet-a-car-rim-a1fda98175ab4f64a1fd6a98c4db78fa', 'CC BY 4.0'] },
  { id: 'f52', name: '터보맥', file: 'assets/wh_fifteen52.glb', credit: ['fifteen52 Turbomac', 'Wilbruh', 'https://sketchfab.com/3d-models/fifteen52-turbomac-2d3bbbfddba9411da26606646cfc9fec', 'CC BY-NC 4.0'] },
  { id: 'off', name: '오프로드', file: 'assets/wh_offroad.glb', credit: ['FREE - Wheel OffRoad1', 'Unity Fan youtube channel', 'https://sketchfab.com/3d-models/free-wheel-offroad1-614207108ccd4f8dbb9a30f11191176d', 'CC BY 4.0'] },
];
const rprotos = [];
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
const AI_COLORS = ['#ff7a2e', '#3d8bff', '#39c46a', '#ffd23c', '#b06cff', '#2fd4c4', '#ff6fa8'];
const N_AI = 7, HELD_MAX = 2;

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
function splitWheels(root, def) {
  let mesh = null; root.traverse((o) => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) return null;
  const g = mesh.geometry, idx = g.index.array, pos = g.attributes.position, sp = def.split, par = mesh.parent, tri = idx.length / 3;
  const cs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => ({ sx, cz: sz > 0 ? sp.fz : sp.rz, tris: [] })), body = [];
  for (let t = 0; t < tri; t++) {
    let x = 0, y = 0, z = 0; for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k]; x += pos.getX(v); y += pos.getY(v); z += pos.getZ(v); } x /= 3; y /= 3; z /= 3;
    let hit = null; if (Math.abs(x) > sp.ix) for (const c of cs) if (x * c.sx > 0 && Math.hypot(y - sp.y, z - c.cz) < sp.r) { hit = c; break; }
    if (hit) hit.tris.push(t); else body.push(t);
  }
  const sub = (list, ox, oy, oz) => { const ng = new THREE.BufferGeometry(), n = list.length * 3; for (const name of ['position', 'normal', 'uv']) { const a = g.attributes[name]; if (!a) continue; const sz = a.itemSize, arr = new Float32Array(n * sz); list.forEach((t, i) => { for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k]; for (let q = 0; q < sz; q++) arr[(i * 3 + k) * sz + q] = a.array[v * sz + q] - (name === 'position' ? [ox, oy, oz][q] : 0); } }); ng.setAttribute(name, new THREE.BufferAttribute(arr, sz)); } return ng; };
  const bm = new THREE.Mesh(sub(body, 0, 0, 0), mesh.material); bm.name = 'body'; par.add(bm); const wheels = [];
  cs.forEach((c, k) => {
    const cx = c.sx * (sp.ix + 0.085), steer = new THREE.Group(), spin = new THREE.Group(); steer.name = 'wh' + k + '_s'; spin.name = 'wh' + k + '_r'; steer.position.set(cx, sp.y, c.cz);
    const wm = new THREE.Mesh(sub(c.tris, cx, sp.y, c.cz), mesh.material); spin.add(wm); steer.add(spin); par.add(steer); wheels.push({ s: steer.name, r: spin.name, front: c.cz * def.front > 0 });
  });
  par.remove(mesh); return wheels;
}
function prepareModel(gltf, def) {
  if (def.scale) gltf.scene.scale.setScalar(def.scale); const sw = def.split ? splitWheels(gltf.scene, def) : null;
  const holder = new THREE.Group(); holder.add(gltf.scene); holder.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(holder), c = box.getCenter(new THREE.Vector3());
  gltf.scene.position.set(-c.x, def.kit ? 0 : -box.min.y, -c.z); holder.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(holder); const size = box.getSize(new THREE.Vector3());
  const meshes = []; holder.traverse((o) => { if (o.isMesh) { meshes.push(o); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.42; m.depthWrite = false; m.roughness = 0.08; } m.envMapIntensity = 1; }); } });
  const matName = (o) => ((Array.isArray(o.material) ? o.material[0] : o.material).name || '').toLowerCase();
  const info = meshes.map((m) => { const b = new THREE.Box3().setFromObject(m); return { m, b, c: b.getCenter(new THREE.Vector3()), s: b.getSize(new THREE.Vector3()), n: matName(m) }; });
  const named = []; holder.traverse((o) => { if (/^wh\d+_s$/.test(o.name)) named.push(o); });
  const tyres = named.length ? [] : info.filter((i) => i.n.includes('tyre')); const wheels = named.map((o) => ({ s: o.name, r: o.name.replace('_s', '_r'), front: o.position.z * def.front > 0 }));
  tyres.forEach((t, k) => {
    const steer = new THREE.Group(), spin = new THREE.Group(); steer.name = 'wh' + k + '_s'; spin.name = 'wh' + k + '_r'; steer.position.copy(t.c); holder.add(steer); steer.add(spin); steer.updateMatrixWorld(true);
    info.forEach((i) => { if (i.used) return; const near = i.c.distanceTo(t.c) < 0.45 && Math.max(i.s.x, i.s.y, i.s.z) < 0.75; const isW = i.n.includes('tyre') ? i === t : (i.n.includes('wheel') || i.n.includes('rotor') || i.n.includes('misc')); if (near && isW) { i.used = true; spin.attach(i.m); } });
    wheels.push({ s: steer.name, r: spin.name, front: t.c.z * def.front > 0 });
  });
  protos[def.id] = { holder, wheels: sw || wheels, len: size.z, wid: size.x, hgt: size.y };
}
function loadModels(onProg) {
  const loader = new GLTFLoader(); let done = 0; const list = CARS.filter((d) => d.file), tot = list.length + RIMS.length;
  const rims = RIMS.map((r, k) => new Promise((res, rej) => loader.load(new URL(r.file, import.meta.url).href, (g) => { rprotos[k] = g.scene; onProg(++done / tot); res(); }, undefined, rej)));
  return Promise.all(rims.concat(list.map((def) => new Promise((res, rej) => loader.load(new URL(def.file, import.meta.url).href, (g) => { prepareModel(g, def); onProg(++done / tot); res(); }, undefined, rej)))));
}
const blobTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }), flameMat2 = new THREE.MeshBasicMaterial({ color: 0x8fe6ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
const aiColor = (d, pc) => { const c = d.dc || 0; return c === pc ? (c + 5) % TOY_COLORS.length : c; };
const colOf = (def, c) => (c >= 0 ? c : (def.dc || 0));
const neonTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function animParts(o, now, dt) { if (!o) return; if (o.rb.length) { const h = (now / 2600) % 1; o.rb.forEach((x) => x.m.color.setHSL(h, x.s, x.l)); } o.spin.forEach((p) => { p.rotation.y += dt * 24; }); }
const rimIdx = (def, eq) => { const k = eq && eq.rim != null ? eq.rim : (prefs.rims || {})[def.id]; return k >= 0 && k < RIMS.length ? k : 0; };
function paintBody(model, def, ci) {
  const col = TOY_COLORS[((ci >= 0 ? ci : def.dc) || 0) % TOY_COLORS.length][0];
  model.traverse((o) => { if (!o.isMesh) return; const f = (m) => { if (m.name !== def.paint) return m; const n = m.clone(); n.color.setHex(col); n.roughness = Math.min(n.roughness, 0.32); n.metalness = Math.max(n.metalness, 0.2); return n; }; o.material = Array.isArray(o.material) ? o.material.map(f) : f(o.material); });
}
function addKitWheels(model, def, ri) {
  const k = def.kit, out = []; let n = 0;
  [[1, k.fz], [-1, k.fz], [1, k.rz], [-1, k.rz]].forEach(([sx, z]) => {
    const steer = new THREE.Group(), spin = new THREE.Group(), face = new THREE.Group(), w = rprotos[ri].clone(true);
    steer.name = 'wh' + n + '_s'; spin.name = 'wh' + n + '_r'; steer.position.set(sx * k.hx, k.R, z); face.rotation.y = sx > 0 ? 0 : Math.PI; w.scale.set(k.R * k.w, k.R, k.R);
    face.add(w); spin.add(face); steer.add(spin); model.add(steer); out.push({ s: steer.name, r: spin.name, front: z * def.front > 0 }); n++;
  });
  return out;
}
function makeCarObject(def, colorIdx, eq) {
  eq = eq || {}; let model, wl, len, wid;
  if (def.build) { const b = buildToyCar(THREE, TOY_COLORS[(colorIdx || 0) % TOY_COLORS.length][0], def.style, eq); model = b.group; wl = b.wheels; len = b.len; wid = b.wid; }
  else { const p = protos[def.id]; model = p.holder.clone(true); wl = p.wheels; len = p.len; wid = p.wid; if (def.paint) paintBody(model, def, colorIdx); if (def.kit) wl = wl.concat(addKitWheels(model, def, rimIdx(def, eq))); }
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
function animWheels(o, dist, steer) { const a = dist / (o.def.wr || 0.32) * o.def.front; o.wheels.forEach((w) => { w.r.rotation.x += a; if (w.front) w.s.rotation.y = -steer * 0.42; }); }

/* ---------- 차고 장면 ---------- */
const gScene = new THREE.Scene(); gScene.environment = envMap; gScene.environmentIntensity = 0.9;
gScene.add(new THREE.HemisphereLight(0xbfd4ff, 0x20243a, 0.9));
{ const k = new THREE.DirectionalLight(0xfff1dd, 2.4); k.position.set(-4, 7, 5); gScene.add(k); const r1 = new THREE.DirectionalLight(0x6ab0ff, 1.8); r1.position.set(6, 3, -5); gScene.add(r1); const r2 = new THREE.DirectionalLight(0xff9d6a, 1.2); r2.position.set(-6, 2, -4); gScene.add(r2); }
const turn = new THREE.Group(); gScene.add(turn);
{ const sh = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(10,14,30,.55)'); gr.addColorStop(0.6, 'rgba(10,14,30,.22)'); gr.addColorStop(1, 'rgba(10,14,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; gScene.add(sh); }
/* 받침대(포디움): 차 뒤쪽에 그림판을 세워 놓고, 차가 받침대 위에 서 있는 것처럼 보이게 해요 */
const podium = (() => { const t = new THREE.TextureLoader().load('assets/gar_podium.webp'); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); m.renderOrder = -1; gScene.add(m); return m; })();
function placePodium() {
  const o = new THREE.Vector3(0, 0, 0), cp = camera.position, d = cp.distanceTo(o), back = 3.2, dir = o.clone().sub(cp).normalize(), up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion), f = (d + back) / d, Wd = 7.6 * f, Hd = Wd * 295 / 1100;
  podium.scale.set(Wd, Hd, 1); podium.position.copy(o).addScaledVector(dir, back).addScaledVector(up, -0.17 * Hd + 0.12 * f);
}
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
function eqOf(def) { const e = Object.assign({}, save.gar.eq[def.id] || {}); if (def.kit) e.rim = rimIdx(def, null); if (tuneSel && tuneSel.carId === def.id) e[tuneSel.slot] = tuneSel.id; return e; }
function aiEq() { const e = { rim: Math.floor(Math.random() * RIMS.length) }; SLOTS.forEach((sl) => { if (Math.random() < 0.4) { const l = ITEMS.filter((i) => i.slot === sl.id); e[sl.id] = l[Math.floor(Math.random() * l.length)].id; } }); return e; }
let gCar = null, gYaw = 0.6, gSpin = 0.35, gPop = 1, gDrag = null, gIdx = 0;
function showGarageCar(i) {
  const ni = (i + CARS.length) % CARS.length; if (ni !== prefs.car) prefs.color = -1; gIdx = ni; prefs.car = gIdx; writeSave();
  if (gCar) { turn.remove(gCar.root); } gCar = makeCarObject(CARS[gIdx], colOf(CARS[gIdx], prefs.color), eqOf(CARS[gIdx])); turn.add(gCar.root); gPop = 0; renderGarageInfo();
}

/* ---------- 경기 장면 ---------- */
let lapNow = 1, rScene = null, track = null, course = null, orbs = [], ramps = [], feats = [], gates = [], groundM = null, sunL = null;
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

/* ---------- 점프대·지름길·명물 구간 ---------- */
const lapOf = () => (course && course.shape ? course.length : 1e9);
const wrapRel = (x, lp) => ((x % lp) + lp * 1.5) % lp - lp / 2;
const rampTex = canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#ffd34d'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2f3a'; for (let y = -w; y < h + w; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y - w); g.lineTo(w, y - w + 16); g.lineTo(0, y + 16); g.closePath(); g.fill(); } }, true);
const FEAT = {
  meadow: { t: 'tunnel', k: 'arch', name: '나무 터널' }, sakura: { t: 'tunnel', k: 'arch', name: '벚꽃 터널' }, beach: { t: 'jumps', name: '파도 점프' }, skyisle: { t: 'padline', name: '구름 발판 길' },
  space: { t: 'jumps', name: '별 점프' }, canyon: { t: 'tunnel', k: 'carch', name: '바위 터널' }, snow: { t: 'tunnel', k: 'iarch', name: '얼음 터널' }, volcano: { t: 'jumps', name: '화산 점프' },
  candy: { t: 'tunnel', k: 'cdarch', name: '사탕 터널' }, aurora: { t: 'tunnel', k: 'aarch', name: '오로라 터널' },
};
function signTex(text, col) { return canvasTex(256, 96, (g, w, h) => { g.fillStyle = col; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 28); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = '900 52px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 3); }); }
function rampMesh(rp) {
  const N = 6, pos = [], uv = [], idx = [], at0 = (t) => track.at(rp.s + t * rp.len);
  for (let i = 0; i <= N; i++) { const t = i / N, a = at0(t); for (const sx of [-1, 1]) { const lat = rp.d + sx * rp.hw; pos.push(a.x + a.nx * lat, a.y + rp.h * t + 0.06, a.z + a.nz * lat); uv.push(sx < 0 ? 0 : 1, t * 2); } }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const e = at0(1), base = pos.length / 3; for (const sx of [-1, 1]) { const lat = rp.d + sx * rp.hw; pos.push(e.x + e.nx * lat, e.y + 0.02, e.z + e.nz * lat); uv.push(sx < 0 ? 0 : 1, 0); }
  idx.push(N * 2, base, N * 2 + 1, N * 2 + 1, base, base + 1);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: rampTex, roughness: 0.6, side: THREE.DoubleSide, emissive: rp.kind === 'super' ? 0x335500 : 0x000000 })); m.frustumCulled = false; return m;
}
function buildRamps(sc, co, L) {
  ramps = []; feats = []; const R = rnd0(co.seed * 31 + 7), lap = L, fe = FEAT[co.id];
  const add = (s, d, kind, hw) => ramps.push({ s: ((s % lap) + lap) % lap, d, hw: hw || (kind === 'super' ? 2.5 : 3.3), len: kind === 'super' ? 14 : 10, h: kind === 'super' ? 3.2 : 1.5, kind });
  for (let s = 250 + R() * 70; s < (co.shape ? L - 30 : L - 160); s += 290 + R() * 130) add(s, [-4.3, 0, 4.3][Math.floor(R() * 3)], 'jump');
  const sS = L * (0.48 + R() * 0.1), sd = R() < 0.5 ? -4.4 : 4.4; add(sS, sd, 'super');
  // 명물 구간
  let f0 = L * (0.2 + R() * 0.08); if (ramps.some((r) => Math.abs(r.s - f0) < 90)) f0 = L * 0.78;
  if (fe) {
    if (fe.t === 'tunnel') { for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(spGeo(), spMat(fe.k)), a = track.at(f0 + i * 15), w = 2 * W + 8; m.scale.set(w, w / SP_ASP[fe.k === 'arch' ? 'arch' : fe.k], 1); m.position.set(a.x, a.y - 0.36, a.z); m.rotation.y = Math.atan2(a.tx, a.tz) + Math.PI; m.frustumCulled = false; sc.add(m); } addHz(sc, 'pad', f0 + 40, 0, true); feats.push({ s: f0, len: 100, name: fe.name }); }
    else if (fe.t === 'jumps') { for (let i = 0; i < 3; i++) add(f0 + i * 34, [-3.2, 3.2, 0][i], 'jump', 3.2); feats.push({ s: f0, len: 110, name: fe.name }); }
    else if (fe.t === 'padline') { for (let i = 0; i < 5; i++) addHz(sc, 'pad', f0 + i * 22, i % 2 ? 3.6 : -3.6, true); feats.push({ s: f0, len: 110, name: fe.name }); }
  }
  // 점프대 주변 장애물은 치워요
  const near = (u) => ramps.some((rp) => { const rel = wrapRel(u.s - rp.s, lap); return rel > -22 && rel < rp.len + 28; });
  hzs.slice().forEach((m) => { if (!m.userData.owner && near(m.userData) && m.userData.type !== 'pad') { sc.remove(m); hzs.splice(hzs.indexOf(m), 1); } });
  boxes.slice().forEach((m) => { if (near(m.userData)) { sc.remove(m); boxes.splice(boxes.indexOf(m), 1); } });
  ramps.forEach((rp) => { sc.add(rampMesh(rp)); if (rp.kind === 'super') { const a = track.at(rp.s - 14), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex('지름길 ➜', '#ff7a1a'), transparent: true })); sp.scale.set(8, 3, 1); sp.position.set(a.x + a.nx * rp.d, a.y + 5.2, a.z + a.nz * rp.d); sc.add(sp); } });
}
function rampAt(s, d) { const lp = lapOf(); for (const rp of ramps) { const rel = wrapRel(s - rp.s, lp); if (rel >= 0 && rel <= rp.len && Math.abs(d - rp.d) < rp.hw + 0.2) return { h: rp.h * rel / rp.len, sl: rp.h / rp.len }; } return null; }
function launch(r, rp) {
  const sup = rp.kind === 'super'; r.jv = (sup ? 4.5 + r.v * 0.165 : 3.6 + r.v * 0.1); r.jy = 0.06; r.airT = 0; r.sup = sup ? 1 : 0; if (r.dr) endDrift(r, true);
  if (r.isPlayer) { snd('wings', 0.5, 1, 'ok'); shake = 0.25; if (sup) note('지름길! 슝~ 날아가요'); }
}
function land(r) {
  const good = r.airT > 0.45; r.jy = 0; r.jv = 0; fxAt(r, 'dust', 3, 0.5, 0.6, 0.5); if (good) { r.boostT = Math.max(r.boostT, r.sup ? 1.6 : 1.0); fxAt(r, 'burst', 2.6, 0.4); if (r.isPlayer) { raceCoins++; snd('boost', 0.7, 1, 'ok'); note('멋진 착지! 슝~'); } if (r.isPlayer) shake = 0.35; } r.sup = 0; r.airT = 0;
}
function endDrift(r, cancel) {
  const lv = r.drLv; r.dr = 0; r.drT = 0; r.drLv = 0; if (cancel || lv < 1) return; r.boostT = Math.max(r.boostT, [0, 0.8, 1.3, 1.9][lv]); fxAt(r, 'burst', 2.4 + lv * 0.5, 0.45); if (r.isPlayer) { snd('boost', 0.6 + lv * 0.1, 1, 'ok'); note(['', '미니 터보!', '슈퍼 터보!', '울트라 터보!!'][lv]); shake = 0.2; }
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
  orbs = []; const Rr = rnd0(co.seed * 13 + 5), om = new THREE.MeshStandardMaterial({ color: 0x3dc0ff, emissive: 0x1a8cff, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.2 }), og = null, orbMat = new THREE.SpriteMaterial({ map: txc('orb_nitro'), transparent: true, depthWrite: false });
  for (let s = 140; s < L - (co.shape ? 60 : 120);) { const d0 = (Rr() * 2 - 1) * (W - 2.8), n = Rr() < 0.4 ? 3 : 1; for (let k = 0; k < n; k++) { const m = new THREE.Sprite(orbMat); m.scale.set(2.2, 2.2, 1); m.userData = { s: s + k * 11, d: d0, on: true, k: 1 }; sc.add(m); orbs.push(m); } s += 70 + Rr() * 110 + n * 11; }
  spawnHazards(sc, co, L); buildRamps(sc, co, L);
}

/* ---------- 달리는 차들 ---------- */
let racers = [], player = null, mode = 'boot', raceT = 0, cdT = 0, cdShown = -1, finishOrder = [], camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camFov = 60, shake = 0, runId = 0, bumps = 0, nOrbs = 0, resultTimer = 0, finishS = 0;
const keys = { L: false, R: false, B: false, N: false };
const hud = { dr: 0, rank: -1, speed: -1, time: '', nitro: -1, coins: -1 };
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) { msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : ''); if (speak !== false) O.say(typeof speak === 'string' ? speak : text); }
const note = (t) => say(t, null, false);

function newRacer(def, isPlayer, slot, idx, colorIdx, eq) {
  const o = makeCarObject(def, colorIdx, eq); rScene.add(o.root);
  const r = Object.assign(o, { isPlayer, s: slot.s, d: slot.d, v: 0, dd: 0, u: 0, yaw: 0, nitro: isPlayer ? 0.35 : 0, nOn: false, brake: false, finished: false, fT: 0, wallCd: 0, hitCd: 0, slowT: 0, slowF: 1, spinT: 0, spinDur: 1, boostT: 0, magT: 0, flyT: 0, bigT: 0, fy: 0, jy: 0, jv: 0, airT: 0, sup: 0, dr: 0, drT: 0, drLv: 0, drA: 0, drFx: 0, bs: 1, shield: 0, hzCd: 0, tgtD: slot.d, tgtT: 2 + Math.random() * 2, wob: Math.random() * 6, idx, aiV: 0, travel: 0 });
  return r;
}
function startRace() {
  O.unlock(); loadSfx(); runId++; $('tune').hidden = true; tuneSel = null; $('garage').hidden = true; $('hud').hidden = false; $('pad').hidden = false; $('count').hidden = false;
  const co = effCourse(); buildRace(co);
  racers = []; const slots = [{ s: 16, d: 2.6 }, { s: 24, d: 2.6 }, { s: 24, d: -2.6 }, { s: 16, d: -2.6 }, { s: 8, d: 2.6 }, { s: 8, d: -2.6 }, { s: 0, d: 2.6 }, { s: 0, d: -2.6 }];
  const pdef = CARS[prefs.car]; player = newRacer(pdef, true, slots[0], 0, colOf(pdef, prefs.color), eqOf(pdef)); racers.push(player);
  const pool = CARS.filter((d) => d !== pdef).sort(() => Math.random() - 0.5), pick = []; let heavy = 0;
  pool.forEach((d) => { if (pick.length >= N_AI) return; if (d.heavy && heavy >= 2) return; if (d.heavy) heavy++; pick.push(d); });
  pick.forEach((d, i) => { let ci = Math.floor(Math.random() * TOY_COLORS.length); if (ci === colOf(pdef, prefs.color)) ci = (ci + 3) % TOY_COLORS.length; const r = newRacer(d, false, slots[i + 1], i + 1, ci, aiEq()); r.pace = DIFFS[prefs.diff].pace * (0.93 + i * 0.016); r.name = AI_COLORS[i]; racers.push(r); });
  // 진행 막대 점
  const pr = $('hudProg'); pr.querySelectorAll('u').forEach((u) => u.remove()); racers.slice(1).forEach((r, i) => { const u = document.createElement('u'); u.style.background = AI_COLORS[i]; r.dot = u; pr.appendChild(u); });
  finishOrder = []; raceT = 0; bumps = 0; nOrbs = 0; raceCoins = 0; held = []; rolling = false; fxs.length = 0; projs.length = 0; hud.coins = -1; updateItemUI(); finishS = co.shape ? 32 + co.laps * co.length : co.length - 40; lapNow = 1; mode = 'count'; cdT = 3.6; cdShown = -1; hud.rank = hud.speed = hud.nitro = -1; hud.time = '';
  buildMini(); racers.forEach((r) => placeCar(r, 0.016, true)); camPos.set(0, 0, 0); snapCamera(); $('btnMenu').textContent = '🚗 차고';
  say('준비! 방향 버튼으로 달려요.', null, '준비하세요!'); startEngine(); simulate(0); updateHud(true);
}
function stepRacer(r, dt) {
  const a = track.at(r.s), def = r.def; let inp = 0;
  if (r.isPlayer) { inp = (keys.R ? 1 : 0) - (keys.L ? 1 : 0); r.brake = keys.B; const wasN = r.nOn; r.nOn = keys.N && r.nitro > 0.02 && !r.finished; if (r.nOn && !wasN && mode === 'race') snd('nitro', 0.6); if (r.nOn) { r.nitro = Math.max(0, r.nitro - dt * 0.36); } }
  else {
    r.tgtT -= dt; if (r.tgtT <= 0) { r.tgtT = 2.5 + Math.random() * 3.5; r.tgtD = (Math.random() * 2 - 1) * (W - 3); }
    racers.forEach((o) => { if (o !== r && o.s > r.s && o.s - r.s < 24 && Math.abs(o.d - r.d) < 2.8) r.tgtD = Math.max(-W + 2.6, Math.min(W - 2.6, r.d + (r.d >= o.d ? 3.4 : -3.4))); });
    inp = Math.max(-1, Math.min(1, (r.d - r.tgtD) * 0.32)); r.brake = false;
    r.wob += dt * 0.4; let rb = 1; const gap = player.s - r.s; if (gap > 220) rb = 1.1; else if (gap < -260) rb = 0.88; r.aiV = player.def.vmax * r.pace * rb * (1 + Math.sin(r.wob) * 0.035);
  }
  r.slowT -= dt; r.boostT -= dt; r.spinT -= dt; r.magT -= dt; r.flyT -= dt; r.bigT -= dt; if (r.spinT > 0) inp *= 0.3;
  const prevS = r.s, air = r.jy > 0.03;
  if (r.isPlayer) { // 드리프트: 🛑을 누른 채 방향을 돌리면 미끄러져요
    const inpRaw = inp, canD = keys.B && r.v > def.vmax * 0.42 && !air && r.spinT <= 0 && !r.finished && mode === 'race';
    if (!r.dr && canD && Math.abs(inpRaw) > 0.5) { r.dr = Math.sign(inpRaw); r.drT = 0; r.drLv = 0; O.sfx('tick'); }
    else if (r.dr) {
      if (keys.B && r.v > def.vmax * 0.3 && !air && r.spinT <= 0 && !r.finished) {
        r.drT += dt; r.nitro = Math.min(1, r.nitro + dt * 0.12); inp = Math.max(-1, Math.min(1, r.dr * 0.62 + inpRaw * 0.5)); r.brake = false;
        const lv = r.drT > 2.0 ? 3 : r.drT > 1.2 ? 2 : r.drT > 0.6 ? 1 : 0; if (lv > r.drLv) { r.drLv = lv; fxAt(r, 'burst', 2 + lv * 0.4, 0.3, 0, 0.8); O.sfx('tick'); }
        r.drFx -= dt; if (r.drFx <= 0) { r.drFx = 0.07; fx('dust', r.root.position.x - a.tx * 1.6 + a.nx * (r.dr > 0 ? 1.1 : -1.1), r.root.position.y + 0.3, r.root.position.z - a.tz * 1.6 + a.nz * (r.dr > 0 ? 1.1 : -1.1), 1.5 + r.drLv * 0.5, 0.4, 0.6); }
      } else endDrift(r);
    }
  }
  if (air) inp *= 0.4;
  const base = r.isPlayer ? def.vmax : r.aiV, boost = r.nOn ? 1 : 0, top = base * Math.max(0.9, Math.min(1.1, 1 - a.slope * 0.9)) * (1 + (def.nmul - 1) * boost) * (r.slowT > 0 ? r.slowF : 1) * (r.boostT > 0 ? 1.3 : 1) * (r.flyT > 0 ? 1.12 : 1) * (r.bigT > 0 ? 1.08 : 1); let tgt = r.brake ? base * 0.42 : top; if (r.finished) tgt = 0;
  if (r.v < tgt) r.v += def.acc * (boost || r.boostT > 0 ? 2.2 : 1) * Math.max(0.05, 1 - r.v / (top * 1.12)) * dt; else r.v = Math.max(tgt, r.v - (r.brake || r.finished ? 28 : 10) * dt);
  r.u += (inp - r.u) * Math.min(1, dt * 10);
  const grip = def.lat * (0.4 + 0.6 * Math.min(1, r.v / 22)) * (r.dr ? 1.3 : 1), assist = r.isPlayer ? (prefs.assist ? 0.4 : 1) : 0.4;
  let ddT = -r.u * grip + a.k * r.v * r.v * 0.045 * assist; if (r.isPlayer && prefs.assist && Math.abs(inp) < 0.1) ddT += -r.d * 0.7;
  r.dd += (ddT - r.dd) * Math.min(1, dt * 7); r.d += r.dd * dt; r.s += r.v * dt; r.travel += r.v * dt;
  if (air) { r.airT += dt; r.jv -= 22 * dt; r.jy += r.jv * dt; if (r.sup) r.s += r.v * 0.55 * dt; if (r.jy <= 0 && r.jv < 0) land(r); }
  else if (ramps.length) { const lp = lapOf(); for (const rp of ramps) { const e0 = wrapRel(prevS - rp.s, lp), e1 = wrapRel(r.s - rp.s, lp); if (e0 <= rp.len && e1 > rp.len && e1 < rp.len + 14 && Math.abs(r.d - rp.d) < rp.hw + 0.3) { launch(r, rp); break; } } }
  if (r.isPlayer && feats.length) { const lp = lapOf(); const f = feats.find((q) => { const e = wrapRel(r.s - q.s, lp); return e >= 0 && e < q.len; }); if (f && f !== r.featIn) note('✨ ' + f.name + '!'); r.featIn = f || null; }
  r.wallCd -= dt; r.hitCd -= dt; const lim = W - 1.15;
  if (Math.abs(r.d) > lim) { const sg = Math.sign(r.d); r.d = sg * lim; if (sg * r.dd > 0) { r.dd = -sg * Math.abs(r.dd) * 0.3 - sg * 1.2; if (r.wallCd <= 0) { r.wallCd = 0.45; r.v *= 0.9; if (r.isPlayer) { bumps++; shake = 0.5; O.sfx('pop'); } } } }
  if (r.s >= finishS && !r.finished) { r.finished = true; r.fT = raceT; finishOrder.push(r); if (r.isPlayer) onPlayerFinish(); }
  { const endC = course.shape ? finishS + 90 : course.length - 3; if (r.s > endC) { r.s = endC; r.v = Math.min(r.v, 3); } }
}
function placeCar(r, dt, snap) {
  const a = track.at(r.s), x = a.x + a.nx * r.d, z = a.z + a.nz * r.d;
  const fx = a.tx * Math.max(r.v, 1) + a.nx * r.dd, fz = a.tz * Math.max(r.v, 1) + a.nz * r.dd, want = Math.atan2(fx, fz);
  let df = want - r.yaw; df = Math.atan2(Math.sin(df), Math.cos(df)); r.yaw = snap ? want : r.yaw + df * Math.min(1, dt * 12);
  const fyT = r.flyT > 0 ? 3.2 : 0; r.fy += (fyT - r.fy) * Math.min(1, dt * 6); const bsT = r.bigT > 0 ? 1.6 : 1; r.bs += (bsT - r.bs) * Math.min(1, dt * 6); r.root.scale.setScalar(r.bs); const rp = r.jy > 0.03 ? null : rampAt(r.s, r.d); r.drA += ((r.dr ? -r.dr * 0.42 : 0) - r.drA) * Math.min(1, dt * 9); r.root.position.set(x, a.y + r.fy + r.jy + (rp ? rp.h : 0), z); r.root.rotation.y = r.yaw + r.drA + (r.spinT > 0 ? (1 - r.spinT / r.spinDur) * Math.PI * 2 : 0);
  const pitchT = -Math.atan(a.slope + (rp ? rp.sl : 0)) - (r.jy > 0.03 ? Math.atan(r.jv / Math.max(10, r.v)) : 0); r.tilt.rotation.x += (pitchT - r.tilt.rotation.x) * Math.min(1, dt * 8);
  r.tilt.rotation.z += (-r.u * 0.045 * Math.min(1, r.v / r.def.vmax) - r.tilt.rotation.z) * Math.min(1, dt * 6);
  animWheels(r, r.v * dt, r.u); const fl = r.nOn || r.boostT > 0 || r.flyT > 0; r.flame.visible = fl; if (fl) r.flame.scale.set(1, 1, 0.8 + Math.random() * 0.5);
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
    if (n !== lastCd) { lastCd = n; if (n >= 1 && n <= 3) { el.textContent = n; el.hidden = false; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); O.sfx('tick'); } else if (n <= 0 && cdT > 0) { el.textContent = '출발!'; el.hidden = false; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); snd('go', 0.8, 1, 'coin'); mode = 'race'; raceT = 0; note('달려요! ◀ ▶ 로 방향을 바꿔요.'); setTimeout(() => { if (mode === 'race') el.hidden = true; }, 900); } }
    if (cdT <= 0 && mode === 'count') { mode = 'race'; }
  } else if (mode === 'race' || mode === 'finish') {
    if (mode === 'race') raceT += dt;
    racers.forEach((r) => stepRacer(r, dt)); collide(); hitCheck(dt); updateProjs(dt);
    if (player) orbs.forEach((m) => { const u = m.userData; const lp = course.shape ? course.length : 1e9, rel = ((player.s - u.s) % lp + lp * 1.5) % lp - lp / 2; if (!u.on && Math.abs(rel) > 40 && course.shape) { u.on = true; m.visible = true; } if (u.on && Math.abs(rel) < 2.6 + (player.magT > 0 ? 14 : 0) && Math.abs(u.d - player.d) < 2.1 + (player.magT > 0 ? W : 0)) { u.on = false; m.visible = false; player.nitro = Math.min(1, player.nitro + 0.26); nOrbs++; fxAt(player, 'orb', 3.4, 0.45, 1.2, 1.2); snd('orb', 0.45, 1, 'coin'); } });
  }
  racers.forEach((r) => placeCar(r, dt));
  shake = Math.max(0, shake - dt * 2);
}
function onPlayerFinish() {
  const place = finishOrder.indexOf(player) + 1, rid = runId, time = player.fT; mode = 'finish'; player.nOn = false;
  const key = course.key + ':' + player.def.id, old = save.best[key], newBest = !old || time < old; if (newBest) save.best[key] = time; if (place === 1) save.done[course.id] = 1; writeSave();
  const stars = place === 1 ? 3 : place === 2 ? 2 : 1, ord = ['', '1등', '2등', '3등', '4등'][place];
  snd(place <= 2 ? 'win' : 'bonus', 0.9, 1, place === 1 ? 'win' : 'ok'); say(ord + '으로 들어왔어요!', 'good', false);
  const title = place === 1 ? '1등! 최고예요!' : place === 2 ? '2등! 멋져요!' : '결승선 통과!', text = ord + ' · 기록 ' + fmtT(time) + (newBest ? ' (내 최고 기록!)' : '') + ' · 구슬 ' + nOrbs + '개' + (raceCoins ? ' · 주운 코인 ' + raceCoins + '개' : ''),
    speak = place === 1 ? '와! 일 등이에요! 정말 잘 달렸어요!' : place === 2 ? '이 등이에요! 멋지게 달렸어요!' : '결승선을 통과했어요! 끝까지 잘 달렸어요!';
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(스피드 레이스)', school: 'elem', topic: '스피드 레이스', level: prefs.diff + 1, engine: 'racing', rounds: 1, mistakes: 0, glow: 0, hand: 0, asked: 0, sec: Math.round(time) };
  const btns = [{ label: '🔁 다시 달리기', color: 'green', onClick: () => startRace() }, { label: '🚗 차를 바꾸기', color: 'orange', onClick: () => openGarage() }];
  if (place === 1 && prefs.course < COURSES.length - 1) btns.splice(1, 0, { label: '➡ 다음 코스 (' + COURSES[prefs.course + 1].name + ')', color: 'blue', onClick: () => { prefs.course++; writeSave(); startRace(); } });
  setTimeout(() => { if (rid === runId) O.finish({ stats: O.newStats(), entry, stars, title, text, speak, coins: 4 + (5 - place) * 3 + (course.laps ? (course.laps - 1) * 2 : 0) + raceCoins, mission: { lesson: 1 }, buttons: btns }); }, 1800);
}

/* ---------- 장애물 · 아이템 상자 · 아이템 ---------- */
let hzs = [], boxes = [], fxs = [], projs = [], raceCoins = 0, held = [], rolling = false;
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
  pad: { asp: 1.3, w: 6, flat: 1, say: '' },
};
const HZ_W = { puddle: 2, oil: 1.2, mud: 1.2, banana: 1.5, rock: 1.5, blocks: 1.2, ball: 1.2, cone: 1.5 }, HZ_SKIP = { snow: ['mud'], volcano: ['puddle'], candy: ['rock'], space: ['mud', 'puddle'] };
const FX_ASP = { orb: 1.02, burst: 0.95, dust: 1.22, splash: 0.88, dizzy: 1.19, bubble: 1, coins: 1.0 };
const ITM = {
  shield: { n: '거품 방패', say: '거품 방패! 한 번은 막아 줘요' }, rocket: { n: '로켓 부스트', say: '로켓! 슝~' }, magnet: { n: '자석', say: '자석! 구슬이 달려와요' },
  oil: { n: '기름병', say: '기름병! 뒤에 뿌려요' }, bomb: { n: '비눗방울 폭탄', say: '비눗방울! 앞 차를 맞혀요' }, coinrain: { n: '코인 비', say: '코인 비! 와르르' },
  wings: { n: '날개', say: '날개! 훨훨 날아요' }, giant: { n: '거대 물약', say: '거대 물약! 쿵쿵 부숴요' }, rainbow: { n: '무지개 발판', say: '무지개 발판! 앞에 깔아요' }, mystery: { n: '깜짝 선물', say: '깜짝 선물! 뭐가 나올까?' },
};
const ITM_W = [{ shield: 3, magnet: 2, oil: 3, coinrain: 2, rocket: 0.5, bomb: 0.3, wings: 0.6, giant: 0.3, rainbow: 2, mystery: 2 }, { shield: 2, magnet: 2, oil: 2, coinrain: 2, rocket: 2, bomb: 2, wings: 1.5, giant: 1.2, rainbow: 1.5, mystery: 2 }, { shield: 1.5, magnet: 1.5, oil: 0.5, coinrain: 1.5, rocket: 4, bomb: 3, wings: 3, giant: 2.5, rainbow: 1, mystery: 2 }];
function pickW(w) { const ks = Object.keys(w), tot = ks.reduce((a, k) => a + w[k], 0); let x = Math.random() * tot; for (const k of ks) { x -= w[k]; if (x <= 0) return k; } return ks[0]; }
function padTex() { if (padTex.t) return padTex.t; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const cols = ['#ff4d6d', '#ff9f1c', '#ffd60a', '#4cd964', '#3aa6ff', '#9b6bff']; g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 6; i++) { g.fillStyle = cols[i]; g.fillRect(i * 42.6, 0, 43, 256); } g.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 3; k++) { const y = 30 + k * 80; g.beginPath(); g.moveTo(128, y); g.lineTo(220, y + 56); g.lineTo(190, y + 56); g.lineTo(128, y + 20); g.lineTo(66, y + 56); g.lineTo(36, y + 56); g.closePath(); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; padTex.t = t; return t; }
function addHz(sc, type, s, d, perm, extra) {
  const H = HZ[type], a = track.at(s); let m;
  if (H.flat) { const w = H.w, dep = w / H.asp; m = new THREE.Mesh(new THREE.PlaneGeometry(w, dep), new THREE.MeshBasicMaterial({ map: type === 'pad' ? padTex() : txc('hz_' + type), transparent: true, alphaTest: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.geometry.userData.keep = false; m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2; m.rotation.y = Math.atan2(a.tx, a.tz); m.position.set(a.x + a.nx * d, a.y + 0.07, a.z + a.nz * d); m.userData = { type, s, d, on: true, rs: dep * 0.38, rd: w * 0.42, flat: 1 }; }
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
  if (u.type === 'pad') { if (r.hzCd > 0) return; r.hzCd = 1.2; r.boostT = Math.max(r.boostT, 2.2); fxAt(r, 'burst', 3, 0.5); if (r.isPlayer) { note('무지개 발판! 슝~'); snd('boost', 0.9, 1, 'ok'); shake = 0.3; } return; }
  if (r.flyT > 0 || r.jy > 0.4) return;
  const pw = r.boostT > 0 || r.bigT > 0, p = m.position;
  if (H.flat) {
    if (r.hzCd > 0) return; r.hzCd = 0.8;
    if (r.shield) { r.shield = 0; fxAt(r, 'burst', 3, 0.5); if (r.isPlayer) { note('방패가 막아 줬어요!'); snd('use', 0.9, 0.8, 'ok'); } return; }
    if (pw) return;
    if (H.slow) { r.slowT = H.slow[1]; r.slowF = H.slow[0]; r.v *= Math.min(1, H.slow[0] + 0.12); }
    if (H.spin) { setSpin(r, H.spin); fxAt(r, 'dizzy', 2.6, H.spin, 0, 2.6); if (r.isPlayer) snd('funny', 0.7); }
    fxAt(r, u.type === 'puddle' ? 'splash' : 'dust', 3, 0.6, 1, 0.9); hitMsg(r, H.say); return;
  }
  u.on = false; m.visible = false;
  if (r.shield) { r.shield = 0; fx('burst', p.x, p.y + 1.2, p.z, 3.4, 0.5); if (r.isPlayer) { note('방패가 막아 줬어요!'); snd('use', 0.9, 0.8, 'ok'); } }
  else if (!pw) { r.v *= H.vf; if (H.spin) { setSpin(r, H.spin); fxAt(r, 'dizzy', 2.6, H.spin, 0, 2.6); if (r.isPlayer) snd('funny', 0.7); } else { r.slowT = 0.7; r.slowF = 0.72; } hitMsg(r, H.say); }
  else if (r.isPlayer) { note('와! 쾅! 부쉈어요!'); snd('boom', 0.55, 1.1, 'coin'); }
  fx('dust', p.x, p.y + 1, p.z, 3.2, 0.6, 1.2); fx('burst', p.x, p.y + 1.4, p.z, 2.6, 0.5, 1);
  if (r.isPlayer && !H.spin) { raceCoins++; if (held.length < HELD_MAX && !rolling && Math.random() < 0.35) giveItem(); }
  if (u.owner) { hzs.splice(hzs.indexOf(m), 1); rScene.remove(m); }
}
function boxHit(r, m, u) {
  u.on = false; m.visible = false; const p = m.position; fx('burst', p.x, p.y, p.z, 5, 0.7, 1); fx('burst', p.x, p.y, p.z, 3.2, 0.5, 0.4);
  if (r.isPlayer) { snd('box', 0.9, 1, 'coin'); giveItem(); } else r.boostT = Math.max(r.boostT, 1.6);
}
function hitCheck(dt) {
  const lp = course.shape ? course.length : 1e9, ph = (list, fn) => list.slice().forEach((m) => { const u = m.userData; if (!u.on) return; if (u.life && raceT - u.born > u.life) { hzs.splice(hzs.indexOf(m), 1); rScene.remove(m); return; } racers.forEach((r) => { if (r.finished || !u.on) return; const rel = ((r.s - u.s) % lp + lp * 1.5) % lp - lp / 2; if (Math.abs(rel) < u.rs && Math.abs(r.d - u.d) < u.rd) fn(r, m, u); }); });
  racers.forEach((r) => { r.hzCd -= dt; }); ph(hzs, hzHit); ph(boxes, boxHit);
  if (course.shape && player) [...hzs, ...boxes].forEach((m) => { const u = m.userData; if (!u.on && !u.owner) { const rel = ((player.s - u.s) % lp + lp * 1.5) % lp - lp / 2; if (Math.abs(rel) > 70) { u.on = true; m.visible = true; } } });
}
function giveItem() {
  if (!player) return; if (held.length >= HELD_MAX || rolling) { raceCoins += 2; player.nitro = Math.min(1, player.nitro + 0.12); note('코인 +2'); return; }
  const place = Math.min(3, ranks().indexOf(player) + 1) - 1, pick = pickW(ITM_W[Math.max(0, place)]), rid = runId; rolling = true; let n = 0; const names = Object.keys(ITM);
  const tick = () => { if (rid !== runId || mode === 'garage') { rolling = false; updateItemUI(); return; } n++; if (n < 9) { setItemUi(names[n % names.length]); O.sfx('tick'); setTimeout(tick, 70 + n * 12); } else { rolling = false; held.push(pick); updateItemUI(); snd('got', 0.8, 1, 'ok'); say(ITM[pick].say, 'good', ITM[pick].n + '!'); } };
  tick();
}
function paintSlot(b, name, spin, n) { b.innerHTML = name ? '<img src="assets/it_' + name + '.webp" alt="" draggable="false">' : ''; b.classList.toggle('has', !!name && !spin); b.classList.toggle('roll', !!spin); b.disabled = !name || !!spin; b.setAttribute('aria-label', name && !spin ? ITM[name].n + ' 쓰기' : '아이템 칸 ' + n); }
function setItemUi(spin) { const sp = (k) => !!spin && held.length === k; paintSlot($('btnI'), held[0] || (sp(0) ? spin : ''), sp(0), 1); paintSlot($('btnI2'), held[1] || (sp(1) ? spin : ''), sp(1), 2); }
function updateItemUI() { setItemUi(); }
function useItem(k) {
  k = k || 0; if (mode !== 'race' || !held[k] || !player) return; let it = held[k]; held.splice(k, 1); updateItemUI(); snd('use', 0.9, 1, 'ok');
  if (it === 'mystery') { snd('funny', 0.7); it = ['rocket', 'wings', 'giant', 'coinrain', 'shield', 'magnet', 'rainbow'][Math.floor(Math.random() * 7)]; say('나온 건… ' + ITM[it].n + '!', 'good', ITM[it].n + '!'); }
  if (it === 'shield') { player.shield = 1; note('방패를 썼어요!'); }
  else if (it === 'rocket') { player.boostT = 2.8; snd('boost', 0.9); fxAt(player, 'burst', 3, 0.5); note('로켓 부스트!'); shake = 0.5; }
  else if (it === 'magnet') { player.magT = 7; note('자석! 구슬이 달려와요'); }
  else if (it === 'wings') { player.flyT = 4; snd('wings', 0.9); fxAt(player, 'burst', 3, 0.5); note('날개! 장애물을 넘어요'); }
  else if (it === 'giant') { player.bigT = 6; snd('giant', 0.9); fxAt(player, 'burst', 4, 0.6); note('거대화! 다 부숴요'); shake = 0.5; }
  else if (it === 'rainbow') { addHz(rScene, 'pad', player.s + 30, player.d, false, { owner: player, born: raceT, life: 25 }); note('무지개 발판을 깔았어요!'); }
  else if (it === 'oil') { addHz(rScene, 'oil', player.s - 9, player.d, false, { owner: player, born: raceT, life: 14 }); note('기름을 뿌렸어요!'); }
  else if (it === 'coinrain') { raceCoins += 6; fxAt(player, 'coins', 5, 1.2, 1.5, 3); snd('bonus', 0.9, 1, 'coin'); note('코인 +6!'); }
  else if (it === 'bomb') {
    const t = racers.filter((o) => o !== player && !o.finished && o.s > player.s && o.s - player.s < 320).sort((a, b) => a.s - b.s)[0];
    if (!t) { player.nitro = Math.min(1, player.nitro + 0.3); note('앞에 차가 없어서 니트로로 바뀌었어요'); return; }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('it_bomb'), transparent: true, depthWrite: false })); sp.scale.set(1.9 * 0.656, 1.9, 1); rScene.add(sp); projs.push({ sp, from: player, to: t, t: 0, dur: Math.max(0.5, Math.min(1.2, (t.s - player.s) / 70)) }); note('비눗방울 발사!');
  }
}
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) { const q = projs[i]; q.t += dt; const k = Math.min(1, q.t / q.dur), a = q.from.root.position, b = q.to.root.position; q.sp.position.set(a.x + (b.x - a.x) * k, a.y + 1.5 + Math.sin(k * Math.PI) * 2.2 + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
    if (k >= 1) { rScene.remove(q.sp); projs.splice(i, 1); const t = q.to; if (t.shield) { t.shield = 0; fxAt(t, 'burst', 3, 0.5); } else { t.slowT = 2.4; t.slowF = 0.55; t.v *= 0.6; fxAt(t, 'splash', 3.6, 0.7, 1, 1.2); } if (t.isPlayer) { note('비눗방울에 맞았어요!'); snd('boom', 0.7, 1.15, 'pop'); shake = 0.4; } } }
}
function animWorld(now, dt) {
  const bs = 1 + Math.sin(now / 260) * 0.06; boxes.forEach((m) => { if (!m.visible) return; const u = m.userData; m.position.y = u.base + Math.sin(now / 340 + u.ph) * 0.28; m.material.rotation = Math.sin(now / 420 + u.ph) * 0.14; m.scale.set(3.1 * bs, 3.1 * bs, 1); });
  for (let i = fxs.length - 1; i >= 0; i--) { const s = fxs[i], u = s.userData; u.t += dt; const p = u.t / u.life; if (p >= 1) { rScene.remove(s); s.material.dispose(); fxs.splice(i, 1); continue; } const e = 1 - Math.pow(1 - p, 3), sz = u.size * (0.55 + 0.75 * e); s.scale.set(sz * u.asp, sz, 1); s.position.y += u.rise * dt; s.material.opacity = Math.max(0, 1 - p * p * p); }
  racers.forEach((r) => { if (r.flyT > 0 || r.fy > 0.2) { if (!r.wgSp) { r.wgSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('it_wings'), transparent: true, depthWrite: false })); r.wgSp.position.set(0, 1.5, 0); r.root.add(r.wgSp); } const f = 1 + Math.sin(now / 70) * 0.12; r.wgSp.scale.set(5.4 * f, 5.4 * 0.925 / f * 1.0, 1); r.wgSp.visible = true; } else if (r.wgSp) r.wgSp.visible = false; });
  racers.forEach((r) => { if (r.shield) { if (!r.shSp) { r.shSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: txc('fx_bubble'), transparent: true, depthWrite: false, opacity: 0.7 })); r.shSp.position.set(0, 1.2, 0); r.root.add(r.shSp); } const q = 5 + Math.sin(now / 200) * 0.25; r.shSp.scale.set(q, q, 1); r.shSp.visible = true; } else if (r.shSp) r.shSp.visible = false; });
}

/* ---------- 카메라 ---------- */
function camTargets(sCam, dCam, lift) {
  lift = lift || 0;
  const a = track.at(Math.max(0, sCam - 9.5)), l = track.at(sCam + 12), k = 0.85;
  const dl = dCam * k; return { px: a.x + a.nx * dl, py: a.y + 3.1 + lift * 0.55, pz: a.z + a.nz * dl, lx: l.x + l.nx * dl * 0.9, ly: l.y + 2.3 + lift * 0.85, lz: l.z + l.nz * dl * 0.9 };
}
function snapCamera() {
  const p = player || racers[0]; const t = camTargets(p.s - (mode === 'count' ? 3 : 0), p.d); camPos.set(t.px, t.py, t.pz); camLook.set(t.lx, t.ly, t.lz); camFov = 60;
}
function updateCamera(dt) {
  if (!player) return; const p = player, k = 1 - Math.exp(-dt * 7);
  const t = camTargets(p.s + (mode === 'count' ? -4 + Math.min(1, (3.6 - cdT) / 3.6) * 4 : 0), p.d, p.root.position.y - track.at(p.s).y);
  camPos.x += (t.px - camPos.x) * k; camPos.y += (t.py - camPos.y) * k; camPos.z += (t.pz - camPos.z) * k;
  camLook.x += (t.lx - camLook.x) * k; camLook.y += (t.ly - camLook.y) * k; camLook.z += (t.lz - camLook.z) * k;
  const sp = Math.min(1, p.v / (p.def.vmax * 1.1)), fovT = 58 + sp * 12 + (p.nOn || p.boostT > 0 ? 9 : 0); camFov += (fovT - camFov) * Math.min(1, dt * 4);
  camera.fov = camFov; camera.updateProjectionMatrix();
  const sh = shake * 0.25 + (p.nOn ? 0.05 : 0); camera.position.set(camPos.x + (Math.random() - 0.5) * sh, camPos.y + (Math.random() - 0.5) * sh, camPos.z + (Math.random() - 0.5) * sh); camera.lookAt(camLook); if (backdrop) { backdrop.position.x = camera.position.x; backdrop.position.z = camera.position.z; }
  groundM.position.x = p.root.position.x; groundM.position.z = p.root.position.z;
}

/* ---------- 효과음 파일(assets/sfx) — 없거나 못 불러오면 합성음으로 대신해요 ---------- */
const SFX = {}; let sfxLoading = false;
const SFX_NAMES = ['box', 'orb', 'got', 'use', 'boost', 'wings', 'giant', 'bonus', 'win', 'boom', 'funny', 'go', 'nitro', 'engine'];
function soundOn() { try { return O.settings().sound !== false; } catch (e) { return true; } }
function loadSfx() {
  if (sfxLoading) return; sfxLoading = true; let ac = null; try { ac = O.unlock(); } catch (e) {} if (!ac || !ac.decodeAudioData) { sfxLoading = false; return; }
  SFX_NAMES.forEach((n) => { fetch(new URL('assets/sfx/' + n + '.mp3', import.meta.url).href).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ac.decodeAudioData(a, ok, no))).then((b) => { SFX[n] = b; if (n === 'engine' && (mode === 'count' || mode === 'race')) startEngine(); }).catch(() => {}); });
}
const sfxLast = {};
function snd(name, vol, rate, fb) {
  if (!soundOn()) return; const b = SFX[name], ac = b && (() => { try { return O.unlock(); } catch (e) { return null; } })();
  if (!b || !ac) { if (fb) O.sfx(fb); return; }
  const t = ac.currentTime; if (sfxLast[name] > t - 0.06) return; sfxLast[name] = t;
  const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; s.playbackRate.value = rate || 1; g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(ac.destination); s.start();
}

/* ---------- 소리(엔진) ---------- */
let eng = null;
function startEngine() {
  stopEngine(); let on = true; try { on = O.settings().sound !== false; } catch (e) {} if (!on) return;
  try {
    const ac = O.unlock(); if (!ac || !ac.createOscillator) return;
    if (SFX.engine) { const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = SFX.engine; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(ac.destination); src.start(0, Math.random() * 3); eng = { ac, src, g, file: 1 }; return; }
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.0; o1.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination); o1.start(); o2.start(); eng = { ac, o1, o2, f, g };
  } catch (e) { eng = null; }
}
function stopEngine() { if (!eng) return; try { eng.g.gain.setTargetAtTime(0, eng.ac.currentTime, 0.05); if (eng.file) { eng.src.stop(eng.ac.currentTime + 0.2); eng = null; return; } eng.o1.stop(eng.ac.currentTime + 0.2); eng.o2.stop(eng.ac.currentTime + 0.2); } catch (e) {} eng = null; }
function engineUpdate() {
  if (!eng || !player) return; const sp = Math.min(1.3, player.v / player.def.vmax), t = eng.ac.currentTime;
  if (eng.file) { eng.src.playbackRate.setTargetAtTime(0.62 + sp * 0.7 + (player.nOn ? 0.15 : 0), t, 0.1); eng.g.gain.setTargetAtTime(mode === 'race' || mode === 'finish' ? 0.55 + sp * 0.35 : 0.15, t, 0.1); return; }
  eng.o1.frequency.setTargetAtTime(48 + sp * 120 + (player.nOn ? 30 : 0), t, 0.08); eng.o2.frequency.setTargetAtTime(24 + sp * 60, t, 0.08); eng.f.frequency.setTargetAtTime(380 + sp * 900, t, 0.1);
  eng.g.gain.setTargetAtTime(mode === 'race' || mode === 'finish' ? 0.035 + sp * 0.03 : 0.012, t, 0.1);
}

/* ---------- HUD ---------- */
/* ---------- 미니맵 (마리오 카트처럼 길 모양 위에 차 위치를 보여 줘요) ---------- */
const mini = { base: null, b: null };
function miniXY(x, z) { const b = mini.b; return [b.ox + (x - b.x0) * b.k, b.oy + (z - b.z0) * b.k]; }
function buildMini() {
  const cv = $('miniMap'), W2 = cv.width, pad = 26, P = track.P, pts = P.map((q) => q);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; pts.forEach((q) => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); });
  const k = (W2 - pad * 2) / Math.max(x1 - x0, z1 - z0, 1); mini.b = { x0, z0, k, ox: (W2 - (x1 - x0) * k) / 2, oy: (W2 - (z1 - z0) * k) / 2 };
  const c = document.createElement('canvas'); c.width = c.height = W2; const g = c.getContext('2d'); g.lineCap = g.lineJoin = 'round';
  const path = () => { g.beginPath(); pts.forEach((q, i) => { const [a, b] = miniXY(q[0], q[1]); i ? g.lineTo(a, b) : g.moveTo(a, b); }); if (track.loop) g.closePath(); };
  path(); g.strokeStyle = 'rgba(10,20,40,.9)'; g.lineWidth = 27; g.stroke();
  path(); g.strokeStyle = '#ffffff'; g.lineWidth = 21; g.stroke();
  path(); g.strokeStyle = '#8f9bb0'; g.lineWidth = 15; g.stroke();
  [32, finishS && !course.shape ? finishS : -1].forEach((s2, i) => { if (s2 < 0) return; const a = track.at(s2), [mx, my] = miniXY(a.x, a.z), ang = Math.atan2(a.tz, a.tx); g.save(); g.translate(mx, my); g.rotate(ang); for (let q = 0; q < 4; q++) { g.fillStyle = q % 2 ? '#fff' : '#111'; g.fillRect(-3, -10 + q * 5, 6, 5); } g.restore(); });
  mini.base = c;
}
function drawMini() {
  const cv = $('miniMap'); if (!mini.base || !player) return; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(mini.base, 0, 0);
  const dot = (r, col, big) => { const a = track.at(r.s), pos = r.root.position, [mx, my] = miniXY(pos.x, pos.z); g.save(); g.translate(mx, my); g.lineWidth = big ? 4 : 3; g.strokeStyle = '#fff'; g.fillStyle = col;
    if (big) { g.rotate(Math.atan2(a.tz, a.tx)); g.beginPath(); g.moveTo(15, 0); g.lineTo(-10, -11); g.lineTo(-5, 0); g.lineTo(-10, 11); g.closePath(); g.stroke(); g.fill(); } else { g.beginPath(); g.arc(0, 0, 8, 0, 7); g.stroke(); g.fill(); } g.restore(); };
  racers.forEach((r) => { if (!r.isPlayer) dot(r, r.name || '#999', false); }); dot(player, '#ffd23c', true);
}
function updateHud(force) {
  if (!player) return; const rk = ranks(), place = rk.indexOf(player) + 1;
  if (place !== hud.rank || force) { hud.rank = place; $('hudRank').innerHTML = '<small>순위</small><b>' + place + '</b><span>/ ' + racers.length + '</span>'; }
  const sp = Math.round(player.v * 3.6); if (sp !== hud.speed || force) { hud.speed = sp; $('hudSpeed').innerHTML = '<b>' + sp + '</b><small>km/h</small>'; }
  const lapC = course.shape ? Math.max(1, Math.min(course.laps, Math.floor((player.s - 32) / course.length) + 1)) : 0, tt = fmtT(mode === 'finish' ? player.fT : raceT) + (lapC ? '  🏁 ' + lapC + '/' + course.laps : ''); if (tt !== hud.time) { hud.time = tt; $('hudTime').textContent = tt; }
  if (lapC && lapC !== lapNow && mode === 'race') { lapNow = lapC; say(lapC === course.laps ? '마지막 바퀴예요! 힘내요!' : lapC + '바퀴째! 잘 달려요!', 'good', lapC === course.laps ? '마지막 바퀴예요! 힘내요!' : lapC + '바퀴째예요!'); }
  { const dl = player.dr ? 1 + player.drLv : 0; if (dl !== hud.dr || force) { hud.dr = dl; const el = $('hudDrift'); el.hidden = !dl; el.dataset.lv = dl ? dl - 1 : 0; el.innerHTML = dl ? '🌀 드리프트 ' + ['●○○', '●●○', '●●●', '🌈'][dl - 1] : ''; } }
  if (hud.coins !== raceCoins) { hud.coins = raceCoins; $('hudCoins').innerHTML = '<img class="ui coin" src="assets/ui_coin.webp" alt="">' + raceCoins; }
  const nv = Math.round(player.nitro * 100); if (nv !== hud.nitro) { hud.nitro = nv; $('nitroFill').style.width = nv + '%'; $('hudNitro').classList.toggle('full', nv >= 99); $('btnN').disabled = nv < 2; }
  const pw = $('hudProg').clientWidth, f = (r) => Math.min(1, r.s / finishS) * 100 + '%';
  drawMini();
  $('progFill').style.width = f(player); $('progMe').style.left = f(player); racers.forEach((r) => { if (r.dot) r.dot.style.left = f(r); });
}

/* ---------- 차고 ---------- */
const LENS = [{ name: '짧은 길', f: 0.7 }, { name: '긴 길', f: 1 }];
function effCourse() { const c = COURSES[prefs.course], lp = Math.max(1, Math.min(5, prefs.laps | 0 || 3)), ln = prefs.len === 0 ? 0 : 1; return Object.assign({}, c, { length: Math.round(c.length * LENS[ln].f / 4) * 4, laps: lp, key: c.id + (lp === 3 && ln === 1 ? '' : '_' + lp + 'x' + ln) }); }
function bestOf(courseKey, carId) { return save.best[courseKey + ':' + carId]; }
function renderGarageInfo() {
  const d = CARS[gIdx]; { const sp = d.sub.split(' · '); $('carSub').textContent = sp[0]; $('carDesc').textContent = sp.slice(1).join(' · '); } $('carName').textContent = d.name;
  const b = bestOf(effCourse().key, d.id); $('carBest').textContent = b ? '🏆 최고 ' + fmtT(b) : '아직 기록이 없어요';
  const SI = ['speed', 'accel', 'steer', 'nitro'];
  $('carStats').innerHTML = d.stats.map((v, i) => '<div class="gp-st"><img class="ui" src="assets/ui_c_' + SI[i] + '.webp" alt=""><span>' + STAT_NAMES[i] + '</span><span class="bar">' + [1, 2, 3, 4, 5].map((k) => '<i class="' + (k <= v ? 'on' : '') + '"></i>').join('') + '</span></div>').join('');
  const cr = (c) => '“' + c[0] + '” — ' + c[1] + ' · <a href="' + c[2] + '" target="_blank" rel="noopener">Sketchfab</a> · ' + c[3];
  $('credit').innerHTML = d.credit ? '차 모델: ' + cr(d.credit) + ' (색칠·바퀴 분리·크기 맞춤 등 손질)' + (d.kit ? '<br>휠: ' + cr(RIMS[rimIdx(d, null)].credit) + ' (타이어 추가·크기 맞춤)' : '') : !d.src ? (d.file ? '3D 장난감 자동차: 옥쌤의 즐거운 교실에서 AI로 만든 모델이에요.' : '카툰 자동차: 옥쌤의 즐거운 교실에서 코드로 만든 모델이에요.') : '차 모델: “' + d.title + '” — <a href="https://sketchfab.com/outpiston" target="_blank" rel="noopener">OUTPISTON</a> · <a href="' + d.src + '" target="_blank" rel="noopener">Sketchfab</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>';
  const chip = (k, v, label, on) => '<button type="button" class="gp-chip' + (on ? ' on' : '') + '" data-' + k + '="' + v + '">' + label + '</button>';
  $('colorRow').innerHTML = d.colors ? TOY_COLORS.map((c, i) => '<button type="button" class="rc-sw' + (colOf(d, prefs.color) === i ? ' on' : '') + '" data-cl="' + i + '" style="background:#' + c[0].toString(16).padStart(6, '0') + '" aria-label="' + c[1] + '"></button>').join('') : '<p class="gp-note">이 차는 원래 색 그대로예요.</p>';
  if (d.kit) $('colorRow').insertAdjacentHTML('beforeend', '<div class="gp-rims">' + RIMS.map((r, i) => '<button type="button" class="gp-chip' + (rimIdx(d, null) === i ? ' on' : '') + '" data-rim="' + i + '">🛞 ' + r.name + '</button>').join('') + '</div>');
  document.querySelectorAll('.gp-qb button').forEach((q) => { q.disabled = !d.build; });
  $('courseRow').innerHTML = COURSES.map((c, i) => '<button type="button" class="gp-cc' + (prefs.course === i ? ' on' : '') + (save.done[c.id] ? ' done' : '') + '" data-co="' + i + '"><img src="assets/th_' + c.bg.slice(3) + '.webp" alt="" draggable="false"><span>' + c.emoji + ' ' + c.name + '</span></button>').join('');
  const grp = (icon, label, inner) => '<div class="gp-g"><label><img class="ui" src="assets/ui_' + icon + '.webp" alt="">' + label + '</label><div>' + inner + '</div></div>';
  $('opts').innerHTML = grp('flag', '바퀴 수', [1, 2, 3, 4, 5].map((n) => chip('lp', n, n, prefs.laps === n)).join('')) + grp('c_road', '길이', LENS.map((x, i) => chip('ln', i, x.name, prefs.len === i)).join('')) + grp('c_people', '상대', DIFFS.map((x) => chip('df', x.id, x.name, prefs.diff === x.id)).join('')) + grp('c_steer', '핸들 도움', chip('as', 1, '켜기', !!prefs.assist) + chip('as', 0, '끄기', !prefs.assist));
  const on = (sel, fn) => document.querySelectorAll(sel).forEach((b) => { b.onclick = () => fn(b); });
  on('#colorRow [data-rim]', (b) => { prefs.rims = prefs.rims || {}; prefs.rims[d.id] = +b.dataset.rim; writeSave(); O.sfx('tick'); rebuildGarageCar(); renderGarageInfo(); say(RIMS[+b.dataset.rim].name + ' 휠이에요!', null, RIMS[+b.dataset.rim].name + ' 휠을 끼웠어요!'); });
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
$('btnI').onclick = () => useItem(0); $('btnI2').onclick = () => useItem(1);
const setL = bindBtn('btnL', 'L'), setR = bindBtn('btnR', 'R'), setB = bindBtn('btnB', 'B'), setN = bindBtn('btnN', 'N');
const KEYMAP = { ArrowLeft: setL, a: setL, A: setL, ArrowRight: setR, d: setR, D: setR, ArrowDown: setB, s: setB, S: setB, ' ': setN, ArrowUp: setN, w: setN, W: setN, Shift: setN };
window.addEventListener('keydown', (e) => { if (e.repeat) return; if (mode === 'garage') { if (e.key === 'ArrowLeft') $('carPrev').click(); else if (e.key === 'ArrowRight') $('carNext').click(); else if (e.key === 'Enter') startRace(); return; } if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === 'x' || e.key === 'X') { e.preventDefault(); useItem(0); return; } if (e.key === 'q' || e.key === 'Q' || e.key === '2') { e.preventDefault(); useItem(1); return; } const f = KEYMAP[e.key]; if (f) { e.preventDefault(); f(true); } });
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
  camera.updateProjectionMatrix(); garageBg(w, h); if (mode === 'garage' || mode === 'boot') { camera.updateMatrixWorld(true); placePodium(); }
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

window.__race = { get ramps() { return ramps; }, get feats() { return feats; }, SFX, get mode() { return mode; }, get item() { return held[0] || ''; }, get held() { return held; }, get coins() { return raceCoins; }, get hzs() { return hzs; }, get boxes() { return boxes; }, give(n) { if (held.length < HELD_MAX) held.push(n); updateItemUI(); }, use: () => useItem(), get racers() { return racers; }, get player() { return player; }, get track() { return track; }, keys, step(n, dt) { for (let i = 0; i < n; i++) simulate(dt || 0.033); updateHud(); }, snap: () => { snapCamera(); updateCamera(1); }, start: startRace, garage: openGarage, prefs, protos, W };

(async function boot() {
  resize(); requestAnimationFrame(frame);
  try { await loadModels((p) => { $('loadText').textContent = '차를 가져오는 중… ' + Math.round(p * 100) + '%'; }); }
  catch (e) { $('loading').innerHTML = '<div><p>차 모델을 불러오지 못했어요.<br>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
  openGarage(); $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
})();
