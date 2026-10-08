/* 옥쌤의 즐거운 교실 — 3D 다트 (놀이별 · 보드게임)
   three.js(vendor/three) + 다트판 GLB. 게임: 숫자 맞히기 / 점수 모으기 / 301 줄이기. 혼자·둘이서, 자동 조준·직접 누르기 */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';

const O = window.OKS;
const $ = (id) => document.getElementById(id);
const calm = () => { try { return !!O.settings().calm; } catch (e) { return false; } };
const LESSON = 'play-darts';
const SEG = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]; // 맨 위부터 시계 방향
const BR = 0.857;                      // 모델에서 더블 바깥 가장자리 반지름
const ZF = 0.0822;                     // 다트판 앞면 z
const R_BULL = 0.041, R_OUTER_BULL = 0.1, R_T0 = 0.445, R_T1 = 0.48, R_D0 = 0.82; // 모델을 직접 재서 얻은 반지름
const LEVEL_NAME = ['', '아주 쉬워요', '쉬워요', '보통', '어려워요', '아주 어려워요'];
const GAMES = { target: ['🔢', '숫자 맞히기', '노란 칸을 맞혀요'], sum: ['➕', '점수 모으기', '많이 모을수록 좋아요'], x01: ['🎯', '301 줄이기', '정확히 0을 만들어요'] };
const AUTO_SPEED = [0.5, 0.75, 1.05, 1.4, 1.8], AUTO_AMP = [0.75, 0.9, 1.0, 1.08, 1.15], JITTER = [0, 0.012, 0.03, 0.05, 0.075];
const X01_START = [51, 101, 151, 201, 301];
const ROUNDS = 5, MAX_X01_ROUNDS = 12;

/* ---------- 장면 ---------- */
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
catch (e) { $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../">← 놀이별로</a></div>'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !calm(); renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x4a3866);
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7aa0, 1.3));
const sun = new THREE.DirectionalLight(0xfff3dd, 2.3); sun.position.set(-2.5, 3.5, 5); sun.castShadow = !calm();
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 1, far: 14 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.01; scene.add(sun);
// 벽
const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0x6b5a85, roughness: 0.95 }));
wall.position.z = -0.002; wall.receiveShadow = true; scene.add(wall);
const boardRoot = new THREE.Group(); scene.add(boardRoot);

async function loadAssets() {
  const g = await new GLTFLoader().loadAsync('assets/dartboard.glb');
  g.scene.traverse((o) => {
    if (o.name === 'Darts_Red_1' || o.name === 'Darts_Blue_2') o.visible = false;      // 준비된 다트는 쓰지 않고 직접 만든 다트를 던져요
    if (o.isMesh) { o.receiveShadow = true; }
  });
  boardRoot.add(g.scene);
}

/* ---------- 다트 모양 ---------- */
const matSteel = new THREE.MeshStandardMaterial({ color: 0xd0d6dd, metalness: 0.8, roughness: 0.25 });
const matBrass = new THREE.MeshStandardMaterial({ color: 0xcc9b4b, metalness: 0.55, roughness: 0.35 });
const flightMats = [0xe5483d, 0x2f7de1].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.6, side: THREE.DoubleSide }));
function makeDart(team) {
  const g = new THREE.Group();            // 끝(뾰족한 곳)이 원점, 몸통은 -z 쪽. lookAt이면 끝이 앞으로 가요
  const add = (geo, mat, z, rx) => { const m = new THREE.Mesh(geo, mat); if (rx) m.rotation.x = Math.PI / 2; m.position.z = z; m.castShadow = true; g.add(m); return m; };
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.1, 10), matSteel); tip.rotation.x = Math.PI / 2; tip.position.z = -0.05; tip.castShadow = true; g.add(tip);
  add(new THREE.CylinderGeometry(0.026, 0.026, 0.2, 14), matBrass, -0.2, true);
  add(new THREE.CylinderGeometry(0.011, 0.011, 0.14, 8), matSteel, -0.37, true);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.12), flightMats[team]); f.rotation.set(0, Math.PI / 2, 0);
    const holder = new THREE.Group(); holder.rotation.z = (i * Math.PI) / 2; f.position.set(0, 0.05, -0.47); f.castShadow = true; holder.add(f); g.add(holder);
  }
  g.scale.setScalar(1.45); return g;
}

/* ---------- 표시(조준점·강조 칸) ---------- */
const aim = new THREE.Group(); aim.visible = false; scene.add(aim);
{
  const m = new THREE.MeshBasicMaterial({ color: 0xff3b3b, depthTest: false, transparent: true });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.052, 0.068, 40), m); ring.renderOrder = 20; aim.add(ring);
  [[0, 0.1, 0.012, 0.07], [0, -0.1, 0.012, 0.07], [0.1, 0, 0.07, 0.012], [-0.1, 0, 0.07, 0.012]].forEach((a) => { const t = new THREE.Mesh(new THREE.PlaneGeometry(a[2], a[3]), m); t.position.set(a[0], a[1], 0); t.renderOrder = 20; aim.add(t); });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.01, 12), m); dot.renderOrder = 20; aim.add(dot);
  aim.position.z = ZF + 0.05;
}
const wedge = new THREE.Group(); scene.add(wedge);
const wedgeMat = new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
function showWedge(num) {
  wedge.clear(); if (!num) return;
  const k = SEG.indexOf(num), center = Math.PI / 2 - (k * Math.PI) / 10;
  const m = new THREE.Mesh(new THREE.RingGeometry(R_OUTER_BULL, BR, 16, 1, center - Math.PI / 20, Math.PI / 10), wedgeMat); m.position.z = ZF + 0.006; wedge.add(m);
  const b = new THREE.Mesh(new THREE.RingGeometry(R_BULL, R_OUTER_BULL, 24), wedgeMat); b.position.z = ZF + 0.006; wedge.add(b);
}

/* ---------- 점수 계산 ---------- */
function scoreAt(x, y) {
  const r = Math.hypot(x, y);
  if (r <= R_BULL) return { num: 25, mult: 2, score: 50, kind: 'bull', label: '불스아이! 50점' };
  if (r <= R_OUTER_BULL) return { num: 25, mult: 1, score: 25, kind: 'obull', label: '바깥 불! 25점' };
  if (r > BR) return { num: 0, mult: 0, score: 0, kind: 'miss', label: '아쉬워요! 0점' };
  const ang = (Math.atan2(x, y) + Math.PI * 2 + Math.PI / 20) % (Math.PI * 2);
  const num = SEG[Math.floor(ang / (Math.PI / 10)) % 20];
  const mult = r >= R_D0 ? 2 : r >= R_T0 && r <= R_T1 ? 3 : 1;
  const word = mult === 3 ? '트리플 ' : mult === 2 ? '더블 ' : '';
  return { num, mult, score: num * mult, kind: mult === 3 ? 'triple' : mult === 2 ? 'double' : 'single', label: word + num + '! ' + num * mult + '점' };
}

/* ---------- 상태 ---------- */
let cfg = null, G = null, busy = true, over = false, stats = O.newStats(), runId = 0, aimMode = 'auto', aimT = 0, aimPos = { x: 0, y: 0 }, ptr = null;
const darts = [];                        // 판에 꽂힌 다트
const flights = [];                       // 날아가는 중
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) { msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : ''); if (speak !== false) O.say(typeof speak === 'string' ? speak : text); }
const note = (t, k) => say(t, k, false);
const pName = (i) => (cfg.players === 1 ? '나' : (i + 1) + '번 친구');
const sleep = (ms) => new Promise((r) => setTimeout(r, calm() ? Math.min(ms, 80) : ms));

function newGame(c) {
  runId++; $('menu').hidden = true; cfg = Object.assign({}, c); over = false; busy = true; stats = O.newStats();
  darts.splice(0).forEach((d) => scene.remove(d)); flights.splice(0).forEach((f) => scene.remove(f.obj));
  aimMode = cfg.aim; document.body.classList.toggle('dt-direct', aimMode === 'direct'); aimT = 0;
  G = { cur: 0, round: 1, left: 3, roundPts: 0, target: 0, lastTarget: 0, players: [] };
  for (let i = 0; i < cfg.players; i++) G.players.push({ total: 0, hits: 0, rem: X01_START[cfg.level - 1], bestRound: 0, rounds: 0, done: false, log: [] });
  $('modeLabel').textContent = GAMES[cfg.game][1] + ' · ' + (cfg.players === 1 ? '혼자' : '둘이서');
  beginRound(true); busy = false; renderScore(); updateButtons();
}
function pickTarget() { let t; do { t = 1 + Math.floor(Math.random() * 20); } while (t === G.lastTarget); G.lastTarget = t; return t; }
function beginRound(first) {
  G.left = 3; G.roundPts = 0; G.roundHits = 0; G.startRem = G.players[G.cur].rem;
  showWedge(0);
  if (cfg.game === 'target') { G.target = pickTarget(); showWedge(G.target); }
  const who = cfg.players > 1 ? pName(G.cur) + ' 차례예요. ' : '';
  if (cfg.game === 'target') say(who + G.target + '번 칸을 맞혀요! 노란 칸이에요.', null, who + G.target + '번 칸을 맞혀 봐요.');
  else if (cfg.game === 'sum') say(who + '다트 3개를 던져요. ' + (first ? '점수를 많이 모아 봐요!' : ''), null, who + '다트를 던져 봐요.');
  else say(who + '남은 점수 ' + G.players[G.cur].rem + '점. 정확히 0을 만들어요!', null, who + '남은 점수는 ' + G.players[G.cur].rem + '점이에요.');
  renderScore();
}
function renderScore() {
  const html = G.players.map((p, i) => {
    const main = cfg.game === 'x01' ? p.rem : cfg.game === 'target' ? p.hits : p.total;
    const sub = cfg.game === 'x01' ? '남은 점수' : cfg.game === 'target' ? '맞힌 수' : '모은 점수';
    return '<div class="dt-pl' + (i === G.cur && !over ? ' on' : '') + '"><small>' + pName(i) + ' · ' + sub + '</small><b>' + main + '</b>' + (i === G.cur && !over ? '<br><i>' + '🎯'.repeat(G.left) + '▫️'.repeat(3 - G.left) + '</i>' : '') + '</div>';
  }).join('');
  $('score').innerHTML = html + (cfg.game !== 'x01' ? '<div class="dt-pl"><small>라운드</small><b>' + Math.min(G.round, ROUNDS) + ' / ' + ROUNDS + '</b></div>' : '<div class="dt-pl"><small>라운드</small><b>' + Math.min(G.round, MAX_X01_ROUNDS) + '</b></div>');
}
function updateButtons() { $('btnThrow').disabled = busy || over; $('btnHint').disabled = over; }

/* ---------- 던지기 ---------- */
const FACE_DIR = new THREE.Vector3(0.05, -0.2, -1).normalize();
function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 0.75; }
function throwAt(nx, ny, exact) {
  if (busy || over) return false;
  busy = true; updateButtons(); aim.visible = false;
  const rid = runId, sig = exact ? 0 : JITTER[cfg.level - 1] * BR;
  const x = nx + gauss() * sig, y = ny + gauss() * sig;
  const res = scoreAt(x, y), team = G.cur % 2;
  const obj = makeDart(team); scene.add(obj);
  const dir = FACE_DIR.clone(); dir.x += (Math.random() - 0.5) * 0.08; dir.y += (Math.random() - 0.5) * 0.08; dir.normalize();
  const end = new THREE.Vector3(x, y, ZF - 0.022);
  const start = new THREE.Vector3(x * 0.4 + (team ? -0.5 : 0.5), -1.6, 3.0);
  const dur = calm() ? 0.15 : 0.5;
  stats.asked++; O.sfx('tick');
  flights.push({ obj, start, end, dir, t: 0, dur, res, rid });
  return true;
}
function stepFlights(dt) {
  for (let i = flights.length - 1; i >= 0; i--) {
    const f = flights[i]; f.t = Math.min(1, f.t + dt / f.dur); const k = f.t, e = k * k * (3 - 2 * k) * 0.35 + k * 0.65;
    const p = new THREE.Vector3().lerpVectors(f.start, f.end, e); p.y += Math.sin(Math.PI * k) * 0.35 * (1 - k * 0.3);
    f.obj.position.copy(p);
    const ahead = new THREE.Vector3().lerpVectors(f.start, f.end, Math.min(1, e + 0.03)); ahead.y += Math.sin(Math.PI * Math.min(1, k + 0.03)) * 0.35 * (1 - k * 0.3);
    const dirNow = ahead.sub(p); if (dirNow.lengthSq() < 1e-8) dirNow.copy(f.dir);
    dirNow.lerp(f.dir, k * k).normalize();
    f.obj.lookAt(p.clone().add(dirNow));
    if (f.t >= 1) { flights.splice(i, 1); if (f.rid === runId) landed(f); }
  }
}
function popText(res, world) {
  const v = world.clone().project(camera), r = canvas.getBoundingClientRect();
  const s = document.createElement('span'); s.textContent = res.label; if (res.kind === 'miss') s.className = 'miss';
  s.style.left = r.left + (v.x + 1) / 2 * r.width + 'px'; s.style.top = r.top + (1 - v.y) / 2 * r.height - 54 + 'px';
  $('pop').appendChild(s); setTimeout(() => s.remove(), 1600);
}
async function landed(f) {
  const rid = runId, res = f.res; darts.push(f.obj);
  popText(res, new THREE.Vector3(f.end.x, f.end.y, ZF));
  O.sfx(res.kind === 'miss' ? 'no' : res.kind === 'single' ? 'pop' : 'coin');
  const P = G.players[G.cur]; G.left--;
  let bust = false, win = false, gain = 0, spoken = res.label;
  if (cfg.game === 'target') { gain = res.num === G.target ? res.mult : 0; P.hits += gain; G.roundPts += gain; if (gain) spoken = res.label + ' 잘했어요!'; else if (res.kind !== 'miss') { stats.mistakes++; spoken = res.num + '번이에요. 노란 칸을 봐요!'; } else stats.mistakes++; }
  else if (cfg.game === 'sum') { gain = res.score; P.total += gain; G.roundPts += gain; if (!res.score) stats.mistakes++; }
  else { const nr = P.rem - res.score; if (nr < 0) { bust = true; } else { P.rem = nr; G.roundPts += res.score; if (nr === 0) win = true; } if (!res.score) stats.mistakes++; }
  if (bust) spoken = res.label + ' 점수가 넘쳤어요. 원래대로!';
  say(spoken, res.kind === 'miss' || bust ? 'warn' : res.kind === 'single' ? null : 'good', res.kind === 'miss' ? '아쉬워요!' : res.kind === 'bull' ? '불스아이!' : res.label.replace('!', ''));
  renderScore();
  await sleep(900); if (rid !== runId) return;
  if (win) { P.done = true; return endRound(true); }
  if (bust) { P.rem = G.startRem; renderScore(); return endRound(false, true); }
  if (G.left > 0) { busy = false; updateButtons(); return; }
  endRound(false);
}
async function endRound(win, bust) {
  const rid = runId, P = G.players[G.cur]; busy = true; updateButtons(); aim.visible = false;
  P.rounds++; P.bestRound = Math.max(P.bestRound, G.roundPts); P.log.push(G.roundPts);
  if (!win) {
    const t = cfg.game === 'target' ? '이번에 ' + G.roundPts + '개 맞혔어요.' : bust ? '이번 라운드는 점수가 그대로예요.' : '이번 라운드 ' + G.roundPts + '점!';
    say(t, null); await sleep(1500); if (rid !== runId) return;
  }
  // 다트 뽑기
  const old = darts.splice(0); old.forEach((d) => { d.userData.fall = 0; fading.push(d); });
  await sleep(500); if (rid !== runId) return;
  // 다음 차례
  let next = G.cur, finished = win;
  if (!win) {
    if (cfg.players === 2 && G.cur === 0) next = 1;
    else { next = 0; G.round++; }
    if (cfg.game === 'x01') { if (G.round > MAX_X01_ROUNDS) finished = true; }
    else if (G.round > ROUNDS) finished = true;
  }
  if (finished) return endGame();
  G.cur = next; beginRound(false); busy = false; updateButtons();
}
const fading = [];
function stepFading(dt) {
  for (let i = fading.length - 1; i >= 0; i--) { const d = fading[i]; d.userData.fall += dt; d.position.y -= dt * 1.4; d.position.z += dt * 0.6; d.scale.multiplyScalar(1 - dt * 2.2); if (d.userData.fall > 0.45) { scene.remove(d); fading.splice(i, 1); } }
}

/* ---------- 끝내기 ---------- */
function endGame() {
  const rid = runId; over = true; busy = true; updateButtons(); aim.visible = false; showWedge(0); renderScore();
  const P = G.players;
  const key = (p) => (cfg.game === 'x01' ? -p.rem : cfg.game === 'target' ? p.hits : p.total);
  let title, text, stars, speak;
  if (cfg.players === 2) {
    const a = key(P[0]), b = key(P[1]);
    if (cfg.game === 'x01' && (P[0].done || P[1].done)) { const w = P[0].done ? 0 : 1; title = (w + 1) + '번 친구가 0점을 만들었어요!'; text = '정확히 0을 만든 사람이 이겨요.'; }
    else if (a === b) { title = '비겼어요!'; text = '둘 다 똑같이 잘했어요.'; }
    else { const w = a > b ? 0 : 1; title = (w + 1) + '번 친구가 이겼어요!'; text = cfg.game === 'x01' ? '남은 점수가 더 적어요.' : '더 많이 모았어요.'; }
    stars = a === b ? 2 : 3; speak = title + ' 둘 다 잘했어요.';
  } else {
    const p = P[0], L = cfg.level - 1;
    if (cfg.game === 'x01') {
      if (p.done) { stars = p.rounds <= 6 ? 3 : 2; title = '정확히 0! 성공했어요!'; text = p.rounds + '라운드 만에 해냈어요.'; speak = '정확히 영점! 정말 잘했어요!'; }
      else { stars = 1; title = '아쉬워요. 남은 점수 ' + p.rem + '점'; text = '다음에는 더 줄여 봐요.'; speak = '아쉽지만 끝까지 잘했어요. 한 번 더 해 볼까요?'; }
    } else if (cfg.game === 'sum') {
      const T = [[40, 80], [50, 100], [60, 110], [70, 120], [80, 130]][L]; stars = p.total >= T[1] ? 3 : p.total >= T[0] ? 2 : 1;
      title = p.total + '점을 모았어요!'; text = '가장 높은 라운드는 ' + p.bestRound + '점이에요.'; speak = title + (stars === 3 ? ' 대단해요!' : ' 잘했어요!');
    } else {
      const T = [[3, 6], [3, 6], [3, 6], [2, 5], [2, 4]][L]; stars = p.hits >= T[1] ? 3 : p.hits >= T[0] ? 2 : 1;
      title = '숫자를 ' + p.hits + '번 맞혔어요!'; text = '노란 칸을 잘 찾았어요.'; speak = title + ' 잘했어요!';
    }
  }
  const total = G.players.reduce((s, p) => s + p.rounds, 0);
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(다트)', school: 'elem', topic: '3D 다트', level: cfg.level, engine: 'darts',
    rounds: total, mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const again = () => newGame(cfg);
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: again }];
  if (cfg.players === 1 && stars === 3 && cfg.level < 5) btns.push({ label: '⬆ 다음 수준 (' + (cfg.level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, cfg.level + 1); newGame(Object.assign({}, cfg, { level: cfg.level + 1 })); } });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 700);
}

/* ---------- 힌트 ---------- */
function hint() {
  if (over || !G) return; O.unlock();
  const P = G.players[G.cur]; let n;
  if (cfg.game === 'target') { n = G.target; say(n + '번 노란 칸을 겨냥해요!'); }
  else if (cfg.game === 'sum') { n = 20; say('20번 안쪽 띠를 맞히면 60점이에요!'); }
  else { n = P.rem <= 20 ? P.rem : P.rem <= 40 && P.rem % 2 === 0 ? P.rem / 2 : 20; say(P.rem <= 20 ? n + '번 칸을 맞혀요!' : P.rem <= 40 && P.rem % 2 === 0 ? n + '번 바깥 띠(두 배)예요!' : '20번 칸으로 점수를 줄여요!'); }
  showWedge(n); setTimeout(() => { if (cfg.game !== 'target') showWedge(0); }, 5000);
}

/* ---------- 입력 ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -ZF);
function planePoint(cx, cy, lift) {
  const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - lift - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const p = new THREE.Vector3(); return ray.ray.intersectPlane(plane, p) ? p : null;
}
canvas.addEventListener('pointerdown', (e) => {
  O.unlock(); if (busy || over || !cfg) return;
  if (aimMode === 'auto') { throwAt(aimPos.x, aimPos.y); return; }
  ptr = { id: e.pointerId, lift: e.pointerType === 'touch' ? 70 : 0 }; try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
  movePtr(e);
});
function movePtr(e) { const p = planePoint(e.clientX, e.clientY, ptr.lift); if (p) { aimPos.x = p.x; aimPos.y = p.y; aim.position.x = p.x; aim.position.y = p.y; aim.visible = true; } }
canvas.addEventListener('pointermove', (e) => { if (ptr && e.pointerId === ptr.id) movePtr(e); });
canvas.addEventListener('pointerup', (e) => { if (!ptr || e.pointerId !== ptr.id) return; ptr = null; throwAt(aimPos.x, aimPos.y); });
canvas.addEventListener('pointercancel', () => { ptr = null; aim.visible = false; });
$('btnThrow').onclick = () => { O.unlock(); throwAt(aimPos.x, aimPos.y); };
$('btnHint').onclick = hint;
$('btnAim').onclick = () => { aimMode = aimMode === 'auto' ? 'direct' : 'auto'; cfg.aim = aimMode; prefs.aim = aimMode; savePrefs(); document.body.classList.toggle('dt-direct', aimMode === 'direct'); aim.visible = false; note(aimMode === 'auto' ? '자동 조준이에요. 빨간 동그라미가 원하는 곳에 오면 눌러요.' : '다트판을 눌러 조준하고 손을 떼면 던져요.'); };
$('btnMenu').onclick = () => { O.unlock(); openMenu(false); };
$('btnHelp').onclick = () => { O.unlock(); const d = $('helpDialog'); if (d.showModal) d.showModal(); };
(function voice() {
  const b = $('btnVoice'); const show = () => { const on = O.settings().voice; b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on); };
  b.onclick = () => { const on = !O.settings().voice; O.saveSetting('voice', on); O.saveSetting('explain', on); if (!on) O.hush(); show(); O.unlock(); if (on) O.say('안내 음성을 켰어요.'); else O.sfx('tick'); };
  show();
})();

/* ---------- 메뉴 ---------- */
const prefs = (() => { const d = { game: 'target', players: 1, aim: 'auto' }; try { return Object.assign(d, JSON.parse(localStorage.getItem('oks_darts_prefs_v1') || '{}')); } catch (e) { return d; } })();
function savePrefs() { try { localStorage.setItem('oks_darts_prefs_v1', JSON.stringify(prefs)); } catch (e) {} }
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  const sel = { game: prefs.game, players: prefs.players, aim: prefs.aim, level: O.levelFor(LESSON) };
  const chip = (k, v, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + k + '="' + v + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    el.innerHTML = '<div class="ch-card"><h1>🎯 3D 다트</h1><p>다트를 던져 점수를 모아요.</p><div class="ch-modes dt-games">' +
      Object.keys(GAMES).map((k) => '<button type="button" class="ch-mode' + (sel.game === k ? ' on' : '') + '" data-game="' + k + '"><i>' + GAMES[k][0] + '</i><b>' + GAMES[k][1] + '</b><span>' + GAMES[k][2] + '</span></button>').join('') + '</div>' +
      '<div class="ch-row"><label>몇 명이 놀까요</label>' + chip('pl', 1, '👤 혼자', '', sel.players === 1) + chip('pl', 2, '👫 둘이서', '번갈아', sel.players === 2) + '</div>' +
      '<div class="ch-row"><label>조준 방식</label>' + chip('aim', 'auto', '🔴 자동 조준', '움직일 때 눌러요', sel.aim === 'auto') + chip('aim', 'direct', '👆 직접 누르기', '눌러서 겨냥해요', sel.aim === 'direct') + '</div>' +
      '<div class="ch-row"><label>수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('lv', l, l, LEVEL_NAME[l], sel.level === l)).join('') + '</div>' +
      '<button type="button" class="ch-go" id="goBtn">시작!</button>' + (G && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-game]').forEach((b) => { b.onclick = () => { sel.game = b.dataset.game; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-pl]').forEach((b) => { b.onclick = () => { sel.players = +b.dataset.pl; render(); }; });
    el.querySelectorAll('[data-aim]').forEach((b) => { b.onclick = () => { sel.aim = b.dataset.aim; render(); }; });
    el.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => { sel.level = +b.dataset.lv; render(); }; });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => { O.unlock(); Object.assign(prefs, { game: sel.game, players: sel.players, aim: sel.aim }); savePrefs(); el.hidden = true; newGame({ game: sel.game, players: sel.players, aim: sel.aim, level: sel.level }); };
  }
  render(); O.say('3D 다트예요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 그리기 ---------- */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  const hudTop = h < 720 ? 190 : 220, hudBot = 80, avail = Math.max(240, h - hudTop - hudBot);
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, need = 1.12;                  // 판 반지름 ≈ 1 + 여백
  let dist = (need / Math.tan(vf)) * (h / avail); dist = Math.max(dist, need / (Math.tan(vf) * Math.min(1, camera.aspect)));
  const shift = ((hudTop - hudBot) / 2 / h) * 2 * Math.tan(vf) * dist;            // 판을 HUD가 없는 가운데로
  camera.position.set(0, -shift * 0 + 0, dist); camera.lookAt(0, shift, 0); camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  stepFlights(dt); stepFading(dt);
  if (cfg && !over && !busy && aimMode === 'auto') {
    aimT += dt * AUTO_SPEED[cfg.level - 1] * (calm() ? 0.6 : 1); const A = AUTO_AMP[cfg.level - 1] * BR;
    aimPos.x = Math.sin(aimT * 1.0 + 0.6) * A * 0.92; aimPos.y = Math.sin(aimT * 1.37) * A * 0.92;
    aim.position.x = aimPos.x; aim.position.y = aimPos.y; aim.visible = true;
  }
  if (aim.visible) { const s = 1 + Math.sin(now / 160) * 0.06; aim.scale.setScalar(s); }
  wedgeMat.opacity = 0.45 + Math.sin(now / 260) * 0.15;
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
(async function boot() {
  resize();
  try { await loadAssets(); } catch (e) { $('loading').innerHTML = '<div><p>3D 다트판 파일을 불러오지 못했어요.<br>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="ch-btn" href="../">← 놀이별로</a></div>'; throw e; }
  requestAnimationFrame(frame);
  $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
  say('놀이를 골라 주세요.', null, false); openMenu(true);
})();

/* 시험용 손잡이 */
window.__darts = {
  state: () => ({ G, cfg, busy, over }), over: () => over, busy: () => busy, scoreAt, start: newGame, throwAt: (x, y) => throwAt(x, y, true),
  darts: () => darts.length, aim: () => ({ ...aimPos }), wedge: () => wedge.children.length, openMenu,
  screen(x, y) { const v = new THREE.Vector3(x, y, ZF).project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }
};
