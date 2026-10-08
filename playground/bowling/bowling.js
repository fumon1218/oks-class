/* 옥쌤의 즐거운 교실 — 3D 볼링 (놀이별 · 보드게임)
   three.js(vendor/three) + 핀 GLB(CC BY 4.0, MSerdar Tekin). 레인·공은 코드로 만들고, 물리는 physics.js, 점수는 score.js.
   게임: 5프레임(짧게) / 10프레임, 혼자·둘이서, 자동 조준·직접 누르기, 수준 1~5(1~2는 범퍼) */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';
import { S, LANE, createWorld, setRack, launch, step, moving, downPins } from './physics.js';
import { parseFrames, score, total, standing, isDone, where, markText } from './score.js';

const O = window.OKS;
const $ = (id) => document.getElementById(id);
const calm = () => { try { return !!O.settings().calm; } catch (e) { return false; } };
const LESSON = 'play-bowling';
const LEVEL_NAME = ['', '범퍼 · 아주 쉬워요', '범퍼 · 쉬워요', '보통', '어려워요', '아주 어려워요'];
const AIM_SPEED = [0.8, 1.05, 1.4, 1.8, 2.3], AIM_AMP = [0.85, 0.95, 1.3, 1.4, 1.5], NOISE = [0, 0.003, 0.009, 0.017, 0.028], BALL_V = [5.5, 6.2, 7, 7.5, 8];
const STARS = [[55, 95], [50, 90], [42, 80], [36, 70], [30, 60]];     // 10프레임 기준 [별2, 별3]
const { L, halfW } = LANE;

/* ---------- 장면 ---------- */
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
catch (e) { $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x231c4d); scene.fog = new THREE.Fog(0x231c4d, 14, 30);
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x6a4f9a, 1.5));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.0); sun.position.set(-1.5, 5, 1); scene.add(sun);
const spot = new THREE.SpotLight(0xfff4dd, 60, 16, 0.6, 0.6, 1.2); spot.position.set(0, 3.4, -L + 2.2); spot.target.position.set(0, 0, -L - 0.4); scene.add(spot, spot.target);

function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const ZF0 = 6;     // 레인은 z=+6(앞) ~ 핀 뒤까지
const laneLen = ZF0 + L + LANE.deckEnd;
function laneTexture() {
  return canvasTex(512, 2048, (g, w, h) => {
    const planks = 20, pw = w / planks;
    for (let i = 0; i < planks; i++) { const l = 60 + Math.random() * 8; g.fillStyle = `hsl(${32 + Math.random() * 6},${62 + Math.random() * 6}%,${l}%)`; g.fillRect(i * pw, 0, pw, h); g.fillStyle = 'rgba(120,70,20,.35)'; g.fillRect(i * pw, 0, 2, h); }
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(150,90,30,.08)'; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 40 + Math.random() * 200); }
    const zToY = (z) => ((z - ZF0) / -laneLen) * h, xToX = (x) => (x / (2 * halfW) + 0.5) * w;
    g.fillStyle = 'rgba(40,20,10,.8)'; for (let k = -3; k <= 3; k++) for (const z of [-0.0 + 0.5 * 0, -0.9 + 0 * k]) { /* 겨냥 점 */ }
    g.fillStyle = '#4a2410'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(xToX((k - 3) * halfW / 3.4), zToY(-0.35), 6, 0, 7); g.fill(); }   // 점
    for (let k = -3; k <= 3; k++) { const z = -1.2 - Math.abs(3 - Math.abs(k)) * 0.0 - (3 - Math.abs(k)) * 0.35; const x = xToX(k * halfW / 3.4), y = zToY(z); g.beginPath(); g.moveTo(x, y - 26); g.lineTo(x - 10, y + 12); g.lineTo(x + 10, y + 12); g.closePath(); g.fillStyle = '#7a3c18'; g.fill(); }   // 화살표
    g.fillStyle = '#e03a3a'; g.fillRect(0, zToY(0), w, 10);                                                  // 파울 라인
  });
}
const laneMat = new THREE.MeshPhysicalMaterial({ map: laneTexture(), roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.2 });
const lane = new THREE.Mesh(new THREE.PlaneGeometry(2 * halfW, laneLen), laneMat); lane.rotation.x = -Math.PI / 2; lane.position.set(0, 0, ZF0 - laneLen / 2); scene.add(lane);
const darkMat = new THREE.MeshStandardMaterial({ color: 0x120d2a, roughness: 0.6 });
const gutMat = new THREE.MeshStandardMaterial({ color: 0x1b1536, roughness: 0.4, metalness: 0.2 });
for (const sd of [-1, 1]) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(LANE.gutter, 0.04, laneLen), gutMat); g.position.set(sd * (halfW + LANE.gutter / 2), -0.03, ZF0 - laneLen / 2); scene.add(g);
  const wl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, laneLen), new THREE.MeshStandardMaterial({ color: 0x3a2f78, roughness: 0.5 })); wl.position.set(sd * (halfW + LANE.gutter + 0.7), 0.05, ZF0 - laneLen / 2); scene.add(wl);
  const neon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, laneLen), new THREE.MeshBasicMaterial({ color: sd < 0 ? 0xff5ac8 : 0x45d6ff })); neon.position.set(sd * (halfW + LANE.gutter + 0.02), 0.18, ZF0 - laneLen / 2); scene.add(neon);
  const bump = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, L + LANE.deckEnd + 1.2), new THREE.MeshStandardMaterial({ color: sd < 0 ? 0xff7ab0 : 0x5ac8ff, roughness: 0.4, emissive: sd < 0 ? 0x550a30 : 0x0a3a55 }));
  bump.position.set(sd * (halfW + 0.07), 0.07, 0.6 - (L + LANE.deckEnd + 1.2) / 2); bump.userData.bumper = true; scene.add(bump);
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: 0x2a2060, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.06, -10); scene.add(floor);
// 구덩이와 뒷벽
const pitZ = -L - LANE.deckEnd;
const pit = new THREE.Mesh(new THREE.BoxGeometry(2 * halfW + 2 * LANE.gutter, 0.8, 1.6), darkMat); pit.position.set(0, -0.4, pitZ - 0.8); scene.add(pit);
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), new THREE.MeshStandardMaterial({ map: canvasTex(1024, 480, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3b2b8a'); gr.addColorStop(1, '#1a1245'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h * 0.8, Math.random() * 2.4 + 0.6, 0, 7); g.fill(); }
  g.textAlign = 'center'; g.font = '900 150px system-ui,sans-serif'; g.lineWidth = 12; g.strokeStyle = '#ff5ac8'; g.fillStyle = '#fff6c8'; g.strokeText('BOWLING', w / 2, 220); g.fillText('BOWLING', w / 2, 220);
  g.font = '110px system-ui'; g.fillText('🎳  ⭐  🎳', w / 2, 360);
}), roughness: 0.8, emissive: 0x201860, emissiveMap: null }), ); backWall.position.set(0, 2.1, pitZ - 1.6); scene.add(backWall);
const curtain = new THREE.Mesh(new THREE.BoxGeometry(2 * halfW + 2 * LANE.gutter + 0.2, 0.5, 0.2), new THREE.MeshStandardMaterial({ color: 0x5a3fc0, roughness: 0.5 })); curtain.position.set(0, 1.15, pitZ - 0.1); scene.add(curtain);
const hood = new THREE.Mesh(new THREE.BoxGeometry(2 * halfW + 2 * LANE.gutter + 0.2, 0.1, 1.7), new THREE.MeshStandardMaterial({ color: 0x4a35a8, roughness: 0.5 })); hood.position.set(0, 1.42, pitZ - 0.7); scene.add(hood);
function bumpers(on) { scene.traverse((o) => { if (o.userData.bumper) o.visible = on; }); }

/* ---------- 그림자 점 ---------- */
const blobTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
function blob(size) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), blobMat); m.rotation.x = -Math.PI / 2; m.position.y = 0.006; m.renderOrder = 2; return m; }

/* ---------- 공 ---------- */
const ballG = new THREE.Group(); scene.add(ballG);
const BALL_COLORS = [0x7a3fe0, 0x2f7de1, 0xe5483d, 0x27b86f];
const ballMat = new THREE.MeshPhysicalMaterial({ roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, color: 0x7a3fe0, map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 14; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 24 + 10); g.bezierCurveTo(w / 3, i * 24 - 20, w * 2 / 3, i * 24 + 40, w, i * 24 + 5); g.stroke(); } }) });
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), ballMat); ballMesh.castShadow = false; ballG.add(ballMesh);
{ const hm = new THREE.MeshStandardMaterial({ color: 0x120d2a, roughness: 0.6 });
  [[0.18, 0.46], [-0.06, 0.52], [0.04, 0.34]].forEach((p) => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), hm); const v = new THREE.Vector3(p[0], 0.6 + p[1] * 0.4, 1).normalize(); h.position.copy(v).multiplyScalar(1.003); h.lookAt(v.clone().multiplyScalar(2)); ballMesh.add(h); }); }
ballMesh.scale.setScalar(LANE.ballR);
const ballBlob = blob(LANE.ballR * 3.2); scene.add(ballBlob);

/* ---------- 핀 ---------- */
const pinViews = [];     // {g, inner, blob, ring}
let pinTemplate = null;
async function loadAssets() {
  const gl = await new GLTFLoader().loadAsync('assets/bowling_pin.glb'); pinTemplate = gl.scene;
}
const ringMat = new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
function buildPins() {
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group(), inner = new THREE.Group(), m = pinTemplate.clone(true); m.scale.setScalar(S); inner.add(m); g.add(inner);
    const b = blob(LANE.pinR * 3.4); scene.add(b);
    const ring = new THREE.Mesh(new THREE.RingGeometry(LANE.pinR * 1.5, LANE.pinR * 2.0, 28), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; ring.visible = false; g.add(ring);
    scene.add(g); pinViews.push({ g, inner, blob: b, ring, pop: 1, sweep: 0 });
  }
}

/* ---------- 조준 표시 ---------- */
const aimG = new THREE.Group(); aimG.visible = false; scene.add(aimG);
const aimMat = new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.55, depthWrite: false, depthTest: false });
const aimLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), aimMat); aimLine.rotation.x = -Math.PI / 2; aimLine.renderOrder = 20; aimG.add(aimLine);
const aimRing = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.15, 32), new THREE.MeshBasicMaterial({ color: 0xff4b4b, depthTest: false, transparent: true })); aimRing.rotation.x = -Math.PI / 2; aimRing.renderOrder = 21; aimG.add(aimRing);
const aimDot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ color: 0xff4b4b, depthTest: false })); aimDot.rotation.x = -Math.PI / 2; aimDot.renderOrder = 21; aimG.add(aimDot);
function placeAim(sx, tx) {
  const z0 = 0.0, z1 = -L + 0.1, dx = tx - sx, dz = z1 - z0, len = Math.hypot(dx, dz);
  aimLine.position.set((sx + tx) / 2, 0.015, (z0 + z1) / 2); aimLine.scale.set(0.07, len, 1);
  aimLine.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); aimLine.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(dx, -dz)));
  aimRing.position.set(tx, 0.02, z1); aimDot.position.set(tx, 0.022, z1);
}

/* ---------- 상태 ---------- */
let cfg = null, G = null, busy = true, over = false, stats = O.newStats(), runId = 0, aimMode = 'auto', aimT = 0, ptr = null;
let tx = 0, sx = 0, world = null, phase = 'idle', camT = 0;
const msgEl = $('msg'), msgText = $('msgText');
function say(text, kind, speak) { msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : ''); if (speak !== false) O.say(typeof speak === 'string' ? speak : text); }
const note = (t, k) => say(t, k, false);
const pName = (i) => (cfg.players === 1 ? '나' : (i + 1) + '번 친구');
const sleep = (ms) => new Promise((r) => setTimeout(r, calm() ? Math.min(ms, 80) : ms));
const clampT = (x) => Math.max(-halfW * 1.7, Math.min(halfW * 1.7, x));

function newGame(c) {
  runId++; $('menu').hidden = true; cfg = Object.assign({}, c); over = false; busy = true; stats = O.newStats(); phase = 'idle';
  aimMode = cfg.aim; document.body.classList.toggle('bw-direct', aimMode === 'direct'); aimT = 0;
  bumpers(cfg.level <= 2);
  G = { cur: 0, players: [] };
  for (let i = 0; i < cfg.players; i++) G.players.push({ rolls: [], strikes: 0, spares: 0, gutters: 0 });
  world = createWorld({ bumpers: cfg.level <= 2 }); setRack(world, null); rackPop(true);
  $('modeLabel').textContent = cfg.frames + '프레임 · ' + (cfg.players === 1 ? '혼자' : '둘이서');
  ballMat.color.setHex(BALL_COLORS[0]); world.ball = null; ballG.visible = true; placeBall(0);
  intro(); renderSheet(); updateButtons();
}
function intro() {
  const P = G.players[G.cur], w = where(P.rolls, cfg.frames), who = cfg.players > 1 ? pName(G.cur) + ' 차례예요. ' : '';
  const left = standing(P.rolls, cfg.frames);
  say(who + (left === 10 ? '가운데에서 눌러 봐요!' : '남은 핀 ' + left + '개를 쓰러뜨려요!'), null, who + (left === 10 ? '공을 굴려 봐요.' : '남은 핀 ' + left + '개를 쓰러뜨려 봐요.'));
  phase = 'aim'; busy = false; updateButtons();
}
function updateButtons() { $('btnRoll').disabled = busy || over; $('btnHint').disabled = over; }
function placeBall(x) { sx = x; ballG.position.set(x, LANE.ballR, 0.0); ballBlob.position.set(x, 0.007, 0.0); ballG.quaternion.identity(); }

/* ---------- 핀 그리기 ---------- */
function rackPop(all) { pinViews.forEach((v) => { v.pop = all ? 0 : v.pop; }); }
function syncPins(dt) {
  const T = world.t;
  world.pins.forEach((p, i) => {
    const v = pinViews[i]; if (v.pop < 1) v.pop = Math.min(1, v.pop + dt * 2.6);
    let vis = !p.out, sc = 1;
    v.g.position.set(p.x, 0, p.z); v.inner.rotation.set(0, 0, 0); v.inner.quaternion.identity(); v.g.quaternion.identity();
    let lift = 0;
    if (p.st === 'fall') {
      const k = Math.min(1, p.fall / 0.5), th = k * k * (Math.PI / 2 + 0.05);
      v.g.quaternion.setFromAxisAngle(new THREE.Vector3(p.fdz, 0, -p.fdx), th); lift = LANE.pinR * 0.9 * Math.sin(th);
      v.inner.rotation.y = p.spin * Math.min(1, p.fall);
    } else if (p.wob > 0) {
      v.g.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(T * 38) * p.wob * 0.16);
    }
    if (p.gone && !p.out) {   // 구덩이·도랑으로 떨어지는 핀
      p.sink = (p.sink || 0) + dt; lift -= p.sink * 2.2; vis = p.sink < 0.5;
      if (p.gut) v.g.position.x += p.gut * Math.min(1, p.sink * 6) * 0.15;
    } else p.sink = 0;
    if (v.sweep > 0) { v.sweep = Math.min(1, v.sweep + dt * 3); sc = 1 - v.sweep; lift += v.sweep * 0.4; if (v.sweep >= 1) vis = false; }
    v.g.position.y = lift; v.g.scale.setScalar(Math.max(0.001, sc * (0.2 + 0.8 * easeBack(v.pop))));
    v.g.visible = vis && v.sweep < 1 && (v.pop > 0.02); v.blob.visible = v.g.visible && p.st === 'up' && !p.gone;
    v.blob.position.set(p.x, 0.006, p.z); v.blob.scale.setScalar(v.g.scale.x);
    v.ring.visible = v.hint && p.st === 'up' && !p.gone && !p.out;
  });
}
const easeBack = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/* ---------- 굴리기 ---------- */
function rollBall(target, exact) {
  if (busy || over || !cfg) return false;
  busy = true; updateButtons(); aimG.visible = false; phase = 'roll'; camT = 0;
  const L0 = cfg.level - 1, noise = exact ? 0 : (Math.random() + Math.random() + Math.random() - 1.5) / 0.75 * NOISE[L0];
  world.bumpers = cfg.level <= 2; launch(world, sx, target, BALL_V[L0], noise);
  stats.asked++; O.sfx('tick'); world.settleT = 0; world.rid = runId; return true;
}
function wait(ms) { return sleep(ms); }
async function afterRoll() {
  const rid = runId, P = G.players[G.cur], N = cfg.frames;
  const down = downPins(world).length;
  const wasFirst = standing(P.rolls, N) === 10, was = where(P.rolls, N).frame;
  P.rolls.push(down);
  const gutter = !!(world.ball && world.ball.gutter) || false;
  const left = standing(P.rolls.slice(0, -1), N);
  const clear = down === left;
  let pop = down + '개!', kind = '', speak;
  if (clear && wasFirst) { P.strikes++; pop = '스트라이크!'; kind = 'big'; speak = '스트라이크! 정말 잘했어요!'; O.sfx('win'); }
  else if (clear) { P.spares++; pop = '스페어!'; kind = 'big'; speak = '스페어! 대단해요!'; O.sfx('coin'); }
  else if (down === 0) { P.gutters++; stats.mistakes++; pop = gutter ? '거터…' : '0개'; speak = gutter ? '앗, 도랑에 빠졌어요. 괜찮아요!' : '아쉬워요. 다시 해 봐요!'; O.sfx('no'); }
  else { pop = down + '개 쓰러졌어요!'; speak = down + '개 쓰러뜨렸어요!'; O.sfx('pop'); }
  say(speak, down === 0 ? 'warn' : clear ? 'good' : null, speak);
  popBanner(pop, kind); renderSheet();
  await wait(1400); if (rid !== runId) return;
  // 다음으로
  const done = isDone(P.rolls, N), nf = where(P.rolls, N).frame, turnOver = done || nf > was;
  const survivors = world.pins.filter((p) => !p.out && !p.gone && p.st === 'up').map((p) => p.id);
  let nextCur = G.cur;
  if (turnOver && cfg.players === 2) nextCur = 1 - G.cur;
  const allDone = G.players.every((p) => isDone(p.rolls, N));
  if (allDone) { sweep(true); await wait(500); if (rid !== runId) return; return endGame(); }
  const sameP = nextCur === G.cur, stNext = standing(G.players[nextCur].rolls, N);
  // 청소·새로 세우기
  sweep(false); await wait(600); if (rid !== runId) return;
  if (sameP && stNext < 10) { setRack(world, survivors); world.pins.forEach((p) => { if (!p.out) { p.x = p.hx; p.z = p.hz; } }); }
  else { setRack(world, null); rackPop(true); }
  pinViews.forEach((v) => { v.sweep = 0; v.hint = false; });
  world.ball = null; G.cur = nextCur; ballG.visible = true; placeBall(0); phase = 'aim'; camT = 0;
  renderSheet(); await wait(250); if (rid !== runId) return; intro();
}
function sweep(all) { world.pins.forEach((p, i) => { if (!p.out && (all || p.st === 'fall' || p.gone)) pinViews[i].sweep = 0.001; }); if (all) pinViews.forEach((v) => { if (v.sweep === 0) v.sweep = 0.001; }); }
function popBanner(t, kind) { const s = document.createElement('span'); s.textContent = t; if (kind === 'big') s.className = 'big'; $('pop').appendChild(s); setTimeout(() => s.remove(), 1900); }

/* ---------- 점수판 ---------- */
function renderSheet() {
  const N = cfg ? cfg.frames : 10; if (!G) { $('sheet').innerHTML = ''; return; }
  $('sheet').innerHTML = G.players.map((P, i) => {
    const sc = score(P.rolls, N), fr = parseFrames(P.rolls, N), cur = !over && i === G.cur ? where(P.rolls, N).frame : -1;
    let cells = '';
    for (let f = 0; f < N; f++) {
      const F = fr[f] || { r: [] }, last = f === N - 1, marks = markText(F, f, N);
      const n = last ? 3 : 2; let m = '';
      for (let k = 0; k < n; k++) { const t = marks[k] === undefined ? '' : marks[k]; m += '<i' + (t === 'X' ? ' class="x"' : '') + '>' + t + '</i>'; }
      cells += '<div class="bw-f' + (last ? ' last' : '') + (f === cur ? ' cur' : '') + '"><div class="bw-m">' + m + '</div><b>' + (sc[f] && sc[f].cum != null ? sc[f].cum : '') + '</b></div>';
    }
    return '<div class="bw-row' + (i === G.cur && !over ? ' on' : '') + '"><div class="bw-nm"><span>' + (cfg.players === 1 ? '점수' : pName(i)) + '</span><b>' + total(P.rolls, N) + '</b></div>' + cells + '</div>';
  }).join('');
}

/* ---------- 끝내기 ---------- */
function endGame() {
  const rid = runId; over = true; busy = true; updateButtons(); aimG.visible = false; renderSheet();
  const N = cfg.frames, T = G.players.map((p) => total(p.rolls, N));
  let title, text, stars, speak;
  if (cfg.players === 2) {
    if (T[0] === T[1]) { title = '비겼어요!'; text = '둘 다 ' + T[0] + '점이에요.'; stars = 2; }
    else { const w = T[0] > T[1] ? 0 : 1; title = (w + 1) + '번 친구가 이겼어요!'; text = T[w] + '점 대 ' + T[1 - w] + '점이에요.'; stars = 3; }
    speak = title + ' 둘 다 잘했어요.';
  } else {
    const k = N / 10, th = STARS[cfg.level - 1], p = G.players[0]; stars = T[0] >= th[1] * k ? 3 : T[0] >= th[0] * k ? 2 : 1;
    title = T[0] + '점을 얻었어요!'; text = '스트라이크 ' + p.strikes + '번, 스페어 ' + p.spares + '번이에요.'; speak = title + (stars === 3 ? ' 대단해요!' : ' 잘했어요!');
  }
  const rolls = G.players.reduce((s, p) => s + p.rolls.length, 0);
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(볼링)', school: 'elem', topic: '3D 볼링', level: cfg.level, engine: 'bowling',
    rounds: rolls, mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const again = () => newGame(cfg);
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: again }];
  if (cfg.players === 1 && stars === 3 && cfg.level < 5) btns.push({ label: '⬆ 다음 수준 (' + (cfg.level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, cfg.level + 1); newGame(Object.assign({}, cfg, { level: cfg.level + 1 })); } });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 700);
}

/* ---------- 힌트 ---------- */
function hint() {
  if (over || !G) return; O.unlock();
  const P = G.players[G.cur], st = standing(P.rolls, cfg.frames);
  if (st === 10) { say('가운데 1번 핀 바로 옆을 겨냥하면 많이 쓰러져요!'); aimHint = 0.1; }
  else {
    const up = world.pins.filter((p) => !p.out && !p.gone && p.st === 'up'); const cx = up.reduce((s, p) => s + p.x, 0) / (up.length || 1);
    pinViews.forEach((v, i) => { const p = world.pins[i]; v.hint = !p.out && !p.gone && p.st === 'up'; }); setTimeout(() => pinViews.forEach((v) => { v.hint = false; }), 5000);
    say('노란 동그라미 핀을 겨냥해요!'); aimHint = cx;
  }
  aimHintT = performance.now() + 4500; if (aimMode === 'direct') { tx = clampT(aimHint); }
}
let aimHint = null, aimHintT = 0;

/* ---------- 입력 ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function lanePoint(cx, cy, lift) {
  const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - lift - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const p = new THREE.Vector3(); return ray.ray.intersectPlane(gplane, p) ? p : null;
}
canvas.addEventListener('pointerdown', (e) => {
  O.unlock(); if (busy || over || !cfg || phase !== 'aim') return;
  if (aimMode === 'auto') { rollBall(tx); return; }
  ptr = { id: e.pointerId, lift: e.pointerType === 'touch' ? 60 : 0 }; try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
  movePtr(e);
});
function movePtr(e) {
  const p = lanePoint(e.clientX, e.clientY, ptr.lift); if (!p) return;
  // 손가락 위치를 핀 쪽 목표로: 화면 위쪽을 누른 거리와 상관없이 가로 위치로 방향을 정해요
  const k = Math.max(0.15, Math.min(1, (0.4 - p.z) / (L + 0.4))); tx = clampT(p.x / k * 1.0); aimG.visible = true;
}
canvas.addEventListener('pointermove', (e) => { if (ptr && e.pointerId === ptr.id) movePtr(e); });
canvas.addEventListener('pointerup', (e) => { if (!ptr || e.pointerId !== ptr.id) return; ptr = null; rollBall(tx); });
canvas.addEventListener('pointercancel', () => { ptr = null; });
$('btnRoll').onclick = () => { O.unlock(); rollBall(tx); };
$('btnHint').onclick = hint;
$('btnAim').onclick = () => { aimMode = aimMode === 'auto' ? 'direct' : 'auto'; cfg.aim = aimMode; prefs.aim = aimMode; savePrefs(); document.body.classList.toggle('bw-direct', aimMode === 'direct'); note(aimMode === 'auto' ? '자동 조준이에요. 길잡이가 핀 쪽 가운데에 오면 눌러요.' : '레인을 누른 채 방향을 잡고 손을 떼면 굴러가요.'); };
$('btnMenu').onclick = () => { O.unlock(); openMenu(false); };
$('btnHelp').onclick = () => { O.unlock(); const d = $('helpDialog'); if (d.showModal) d.showModal(); };
(function voice() {
  const b = $('btnVoice'); const show = () => { const on = O.settings().voice; b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on); };
  b.onclick = () => { const on = !O.settings().voice; O.saveSetting('voice', on); O.saveSetting('explain', on); if (!on) O.hush(); show(); O.unlock(); if (on) O.say('안내 음성을 켰어요.'); else O.sfx('tick'); };
  show();
})();

/* ---------- 메뉴 ---------- */
const prefs = (() => { const d = { frames: 5, players: 1, aim: 'auto' }; try { return Object.assign(d, JSON.parse(localStorage.getItem('oks_bowling_prefs_v1') || '{}')); } catch (e) { return d; } })();
function savePrefs() { try { localStorage.setItem('oks_bowling_prefs_v1', JSON.stringify(prefs)); } catch (e) {} }
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  const sel = { frames: prefs.frames, players: prefs.players, aim: prefs.aim, level: O.levelFor(LESSON) };
  const chip = (k, v, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + k + '="' + v + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    el.innerHTML = '<div class="ch-card"><h1>🎳 3D 볼링</h1><p>공을 굴려 핀을 쓰러뜨려요.</p>' +
      '<div class="ch-row"><label>몇 판 놀까요</label>' + chip('fr', 5, '5프레임', '짧게', sel.frames === 5) + chip('fr', 10, '10프레임', '진짜 볼링', sel.frames === 10) + '</div>' +
      '<div class="ch-row"><label>몇 명이 놀까요</label>' + chip('pl', 1, '👤 혼자', '', sel.players === 1) + chip('pl', 2, '👫 둘이서', '번갈아', sel.players === 2) + '</div>' +
      '<div class="ch-row"><label>조준 방식</label>' + chip('aim', 'auto', '🟡 자동 조준', '움직일 때 눌러요', sel.aim === 'auto') + chip('aim', 'direct', '👆 직접 누르기', '눌러서 겨냥해요', sel.aim === 'direct') + '</div>' +
      '<div class="ch-row"><label>수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('lv', l, l, LEVEL_NAME[l], sel.level === l)).join('') + '</div>' +
      '<button type="button" class="ch-go" id="goBtn">시작!</button>' + (G && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-fr]').forEach((b) => { b.onclick = () => { sel.frames = +b.dataset.fr; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-pl]').forEach((b) => { b.onclick = () => { sel.players = +b.dataset.pl; render(); }; });
    el.querySelectorAll('[data-aim]').forEach((b) => { b.onclick = () => { sel.aim = b.dataset.aim; render(); }; });
    el.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => { sel.level = +b.dataset.lv; render(); }; });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => { O.unlock(); Object.assign(prefs, { frames: sel.frames, players: sel.players, aim: sel.aim }); savePrefs(); el.hidden = true; newGame({ frames: sel.frames, players: sel.players, aim: sel.aim, level: sel.level }); };
  }
  render(); O.say('3D 볼링이에요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 카메라·그리기 ---------- */
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let camInit = false;
const vAspect = () => camera.aspect;
function resize() {
  const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = camera.aspect < 0.9 ? Math.min(64, 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(17)) / camera.aspect) * 180 / Math.PI) : 34; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
function cameraGoal() {
  const B = world && world.ball; const portrait = camera.aspect < 0.9;
  if (phase === 'roll' || phase === 'watch') {
    const bz = B ? B.z : -L, cz = Math.max(bz + 2.6, -L + 3.0);
    return { p: new THREE.Vector3((B ? B.x : 0) * 0.35, portrait ? 1.5 : 1.15, cz), l: new THREE.Vector3(0, 0.3, Math.min(bz - 2.6, -L - 0.2)) };
  }
  return { p: new THREE.Vector3(0, portrait ? 1.9 : 1.45, portrait ? 4.6 : 4.0), l: new THREE.Vector3(0, portrait ? 0.1 : 0.3, -L * 0.6) };
}
let lastT = performance.now(), acc = 0;
function stepSim(dt) { const H = 1 / 240, k = window.__bowlTurbo || 1; acc += dt * k; let n = 0; const cap = k > 1 ? 400 : 20; while (acc >= H && n < cap) { step(world, H); acc -= H; n++; } if (n >= cap) acc = 0; }
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (world) {
    if (phase === 'roll') {
      stepSim(dt);
      const B = world.ball;
      if (B) { ballG.visible = !B.off || B.z > -L - 3; ballG.position.set(B.x, B.y, B.z); ballG.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), B.spin); ballBlob.position.set(B.x, 0.007, B.z); ballBlob.visible = !B.gutter && !B.off; }
      if (B && B.z < -L + 2.4) phase = 'watch';
      world.ev.splice(0).forEach((e) => { if (e === 'hit') O.sfx('pop'); else if (e === 'clack' && Math.random() < 0.35) O.sfx('tick'); else if (e === 'gutter') O.sfx('water'); });
      world.settleT = moving(world) ? 0 : (world.settleT || 0) + dt;
      if ((phase !== 'roll') && world.settleT > 0.6 || (B && B.off && world.settleT > 0.6)) { phase = 'after'; afterRoll(); }
      if (phase === 'roll' && !moving(world)) { phase = 'after'; afterRoll(); }
    } else if (phase === 'watch') {
      stepSim(dt);
      const B = world.ball; if (B) { ballG.visible = !B.off; ballG.position.set(B.x, B.y, B.z); ballG.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), B.spin); ballBlob.position.set(B.x, 0.007, B.z); ballBlob.visible = !B.gutter && !B.off; }
      world.ev.splice(0).forEach((e) => { if (e === 'hit') O.sfx('pop'); else if (e === 'clack' && Math.random() < 0.35) O.sfx('tick'); else if (e === 'gutter') O.sfx('water'); });
      world.settleT = moving(world) ? 0 : (world.settleT || 0) + dt;
      if (world.settleT > 0.6) { phase = 'after'; afterRoll(); }
    } else if (phase === 'after') stepSim(dt);
    syncPins(dt);
  }
  if (cfg && !over && phase === 'aim') {
    if (aimMode === 'auto') {
      if (aimHint !== null && performance.now() < aimHintT) tx += (aimHint - tx) * Math.min(1, dt * 6);
      else { aimHint = null; aimT += dt * AIM_SPEED[cfg.level - 1] * (calm() ? 0.6 : 1); tx = Math.sin(aimT + 0.6) * AIM_AMP[cfg.level - 1] * halfW; }
      aimG.visible = true;
    }
    const nsx = Math.max(-halfW * 0.6, Math.min(halfW * 0.6, tx * 0.3)); placeBall(nsx); placeAim(nsx, tx);
    const s = 1 + Math.sin(now / 160) * 0.08; aimRing.scale.setScalar(s);
  }
  const g = cameraGoal();
  if (!camInit) { camPos.copy(g.p); camLook.copy(g.l); camInit = true; }
  const k = 1 - Math.exp(-dt * (phase === 'aim' ? 3.5 : 5)); camPos.lerp(g.p, k); camLook.lerp(g.l, k); camera.position.copy(camPos); camera.lookAt(camLook);
  ringMat.opacity = 0.55 + Math.sin(now / 200) * 0.25;
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
(async function boot() {
  resize();
  try { await loadAssets(); } catch (e) { $('loading').innerHTML = '<div><p>3D 볼링 파일을 불러오지 못했어요.<br>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="ch-btn" href="../?zone=board">← 놀이별로</a></div>'; throw e; }
  buildPins(); world = createWorld({}); setRack(world, null); bumpers(true); placeBall(0); phase = 'idle';
  requestAnimationFrame(frame);
  $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500);
  say('놀이를 골라 주세요.', null, false); openMenu(true);
})();

/* 시험용 손잡이 */
window.__bowl = {
  state: () => ({ G, cfg, busy, over, phase, tx }), over: () => over, busy: () => busy, phase: () => phase, start: newGame, roll: (x) => rollBall(x, true), openMenu,
  world: () => world, rolls: () => G && G.players.map((p) => p.rolls.slice()), cam: () => camera.position.toArray()
};
