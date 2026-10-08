/* 옥쌤의 즐거운 교실 — 놀이별 3D 보드게임 공통 바탕 (오목·오셀로·바둑)
   장면·카메라·움직임(트윈)·안내 글·음성/화면 고정 단추를 한곳에 모았어요. 게임 규칙은 각 게임 폴더에 있어요. */
import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/addons/controls/OrbitControls.js';
export { THREE };

export function createStage(opt) {
  opt = Object.assign({ extent: 16, bg: 0x35507a, tableColor: 0x2f5a4c, tableY: -1, pol: 0.78, minDist: 22, targetY: 0.2, sunPos: [9, 20, 11], exposure: 1.05 }, opt || {});
  const O = window.OKS, $ = (id) => document.getElementById(id);
  const calm = () => { try { return !!O.settings().calm; } catch (e) { return false; } };
  const canvas = $('gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { $('loading').innerHTML = '<div><p>이 기기에서는 3D 화면을 켤 수 없어요.<br>다른 기기에서 열어 주세요.</p><a class="ch-btn" href="../">← 놀이별로</a></div>'; throw e; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opt.exposure;
  renderer.shadowMap.enabled = !calm(); renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(opt.bg); scene.fog = new THREE.Fog(opt.bg, opt.extent * 4, opt.extent * 8);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, opt.extent * 14);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.38; controls.rotateSpeed = 0.7; controls.target.set(0, opt.targetY, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a90, 1.2));
  const sun = new THREE.DirectionalLight(0xfff3dd, 2.3); sun.position.set(...opt.sunPos); sun.castShadow = !calm(); sun.shadow.mapSize.set(2048, 2048);
  const e = opt.extent * 0.9; Object.assign(sun.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 4, far: opt.extent * 5 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe4ecff, 0.6); fill.position.set(-10, 8, -9); scene.add(fill);
  if (opt.tableColor != null) { const t = new THREE.Mesh(new THREE.CircleGeometry(opt.extent * 4, 64), new THREE.MeshStandardMaterial({ color: opt.tableColor, roughness: 0.95 })); t.rotation.x = -Math.PI / 2; t.position.y = opt.tableY; t.receiveShadow = true; scene.add(t); }

  let keepUntil = 0; const frameHooks = []; let alive = () => false;
  const poke = (ms) => { keepUntil = Math.max(keepUntil, performance.now() + (ms || 400)); };
  controls.addEventListener('change', () => poke(250));

  /* 움직임(트윈) */
  const tweens = [];
  const ease = { io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), out: (t) => 1 - Math.pow(1 - t, 3), back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
  function tween(ms, fn, ez) { if (calm()) ms = Math.min(ms, 120); return new Promise((res) => { tweens.push({ t: 0, dur: Math.max(1, ms) / 1000, fn, res, e: ez || ease.io }); }); }
  const sleep = (ms) => new Promise((r) => setTimeout(r, calm() ? Math.min(ms, 80) : ms));

  /* 안내 글 */
  const msgEl = $('msg'), msgText = $('msgText');
  let hudTop = 110, hudBot = 80;
  function measureHud() { const h = window.innerHeight, m = msgEl.getBoundingClientRect(), b = document.querySelector('.ch-bottom').getBoundingClientRect(); hudTop = Math.min(h * 0.4, Math.max(96, m.bottom + 6)); hudBot = Math.min(h * 0.3, Math.max(60, h - b.top + 4)); }
  function applyViewOffset() { const w = window.innerWidth, h = window.innerHeight; measureHud(); camera.setViewOffset(w, h, 0, -Math.round((hudTop - hudBot) / 2), w, h); }
  function say(text, kind, speak) {
    msgText.textContent = text; msgEl.className = 'ch-msg' + (kind ? ' ' + kind : '');
    const b0 = hudTop; measureHud(); if (Math.abs(b0 - hudTop) > 14) { applyViewOffset(); camera.updateProjectionMatrix(); poke(); }
    if (speak !== false) O.say(typeof speak === 'string' ? speak : text);
  }
  const note = (t, k) => say(t, k, false);

  /* 카메라 */
  let viewAz = 0, camBusy = false;
  function fitDistance() { const w = window.innerWidth, h = window.innerHeight, avail = Math.max(200, h - hudTop - hudBot), k = opt.extent / 16; return Math.max(opt.minDist, 24 * k * (h / avail), 31 * k / (w / h)) + 2; }
  function applyCameraLimits() { const d = fitDistance(); controls.minDistance = d * 0.5; controls.maxDistance = d * 1.55; }
  function camPos(az, pol, r) { return new THREE.Vector3(Math.sin(az) * Math.sin(pol) * r, Math.cos(pol) * r + controls.target.y, Math.cos(az) * Math.sin(pol) * r); }
  async function setView(az, instant, pol) {
    viewAz = az; const p1 = pol == null ? opt.pol : pol, r = fitDistance();
    if (instant || calm()) { camera.position.copy(camPos(az, p1, r)); controls.update(); return; }
    camBusy = true; let a0 = controls.getAzimuthalAngle(), p0 = controls.getPolarAngle(), r0 = controls.getDistance();
    let d = az - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    await tween(900, (p) => { camera.position.copy(camPos(a0 + d * p, p0 + (p1 - p0) * p, r0 + (r - r0) * p)); camera.lookAt(controls.target); });
    controls.update(); camBusy = false;
  }
  function resize() { poke(); const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; applyViewOffset(); camera.updateProjectionMatrix(); applyCameraLimits(); }
  window.addEventListener('resize', resize);

  /* 평면 위 점 찾기(눈금 칸 찾기용) */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), planeCache = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function rayAt(cx, cy) { const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray; }
  function planePoint(cx, cy, y) { planeCache.constant = -y; const p = new THREE.Vector3(); return rayAt(cx, cy).ray.intersectPlane(planeCache, p) ? p : null; }
  function screenOf(v3) { const v = v3.clone().project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }

  /* 탭(드래그와 구분) */
  function onTap(fn) {
    let down = null;
    canvas.addEventListener('pointerdown', (ev) => { down = { x: ev.clientX, y: ev.clientY, t: performance.now(), id: ev.pointerId }; });
    canvas.addEventListener('pointerup', (ev) => { if (!down || ev.pointerId !== down.id) return; const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y), dt = performance.now() - down.t; down = null; if (moved > 10 || dt > 700) return; fn(ev.clientX, ev.clientY, ev); });
    canvas.addEventListener('pointercancel', () => { down = null; });
  }

  /* 위쪽 단추 */
  function wireButtons(h) {
    h = h || {};
    if ($('btnHelp')) $('btnHelp').onclick = () => { O.unlock(); const d = $('helpDialog'); if (d && d.showModal) d.showModal(); };
    if ($('btnMenu')) $('btnMenu').onclick = () => { O.unlock(); if (h.menu) h.menu(); };
    if ($('btnView')) $('btnView').onclick = () => { O.unlock(); if (!camBusy) setView(viewAz > 1 ? 0 : Math.PI); };
    if ($('btnLock')) $('btnLock').onclick = (ev) => { const lock = controls.enableRotate; controls.enableRotate = !lock; controls.enableZoom = !lock; const b = ev.currentTarget; b.setAttribute('aria-pressed', lock); b.textContent = lock ? '🔒 화면 고정됨' : '🔓 화면 돌리기'; note(lock ? '화면을 고정했어요. 손가락으로 돌아가지 않아요.' : '화면을 돌려 볼 수 있어요.'); };
    const b = $('btnVoice');
    if (b) { const show = () => { const on = O.settings().voice; b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on); };
      b.onclick = () => { const on = !O.settings().voice; O.saveSetting('voice', on); O.saveSetting('explain', on); if (!on) O.hush(); show(); O.unlock(); if (on) O.say('안내 음성을 켰어요.'); else O.sfx('tick'); }; show(); }
  }

  /* 그리기 */
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000), t = now / 1000; lastT = now;
    for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const p = Math.min(1, w.t / w.dur); w.fn(w.e(p), p); if (p >= 1) { tweens.splice(i, 1); w.res(); } }
    controls.update();
    if (!(tweens.length || now < keepUntil || alive())) return requestAnimationFrame(frame);
    for (let i = 0; i < frameHooks.length; i++) frameHooks[i](dt, t, now);
    renderer.render(scene, camera); requestAnimationFrame(frame);
  }
  function hideLoading() { $('loading').classList.add('off'); setTimeout(() => { $('loading').hidden = true; }, 500); }
  function failLoading(txt) { $('loading').innerHTML = '<div><p>' + txt + '<br>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="ch-btn" href="../">← 놀이별로</a></div>'; }

  return { THREE, O, $, canvas, renderer, scene, camera, controls, sun, calm, poke, tween, sleep, ease, say, note, setView, resize, fitDistance, rayAt, planePoint, screenOf, onTap, wireButtons, hideLoading, failLoading,
    onFrame: (fn) => frameHooks.push(fn), setAlive: (fn) => { alive = fn; }, start: () => { resize(); requestAnimationFrame(frame); }, get tweenCount() { return tweens.length; } };
}

/* 나무 질감 그림(코드로 그려요) */
export function woodCanvas(w, h, base, seed0) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  let seed = seed0 || 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 300; i++) { const y = rnd() * h, a = 0.025 + rnd() * 0.06; x.strokeStyle = (rnd() < 0.5 ? 'rgba(90,55,20,' : 'rgba(255,225,170,') + a + ')'; x.lineWidth = 1 + rnd() * 3; x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= w; px += 64) x.lineTo(px, y + Math.sin(px * 0.01 + i) * 6 * rnd()); x.stroke(); }
  return c;
}
export function canvasTexture(c, aniso) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso || 8; return t; }

/* 별 모양 (게임 안 보상 표시) */
let starGeo = null;
export function makeStar() {
  if (!starGeo) { const sh = new THREE.Shape(), R = 0.62, r = 0.28; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * rr, Math.sin(a) * rr); } starGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }); starGeo.center(); }
  const m = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffd23c, emissive: 0xffa800, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2 })); m.castShadow = true; return m;
}
