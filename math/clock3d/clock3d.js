/* 3D 시계 — 수학 · 시각과 시간
   아날로그 시계(시침·분침·초침이 따로 움직이는 3D 모델)와 디지털 시계(알람시계 모델의 화면 그림을 바꿔 그림)를 한 장면에 놓아요.
   - 함께 보기: 바늘을 끌어서 돌리면 디지털 시계가 같이 바뀌어요. ▶로 시계를 가게 해서 초침도 볼 수 있어요.
   - 시각 만들기: 디지털 시계에 나온 시각을 아날로그 시계 바늘로 만들어요.
   - 시각 읽기: 아날로그 시계를 읽고 알맞은 디지털 시각을 골라요. */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1.5));
scene.add(new THREE.HemisphereLight(0xdfeeff, 0x6b5a4a, 1.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(2, 4, 6); scene.add(sun);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

/* ---------- 상태 ---------- */
const S = { t: 15 * 60 + 30, s: 0, mode: 'free', speed: 0, view: 'both', voice: true, level: 3, q: null, answered: false, stars: 0 };
try { S.stars = +localStorage.getItem('oks_clock3d_stars') || 0; } catch (e) {}
const h12 = (t) => ((Math.floor(t / 60) + 11) % 12) + 1;
const mm = (t) => ((t % 60) + 60) % 60;
const pad = (n) => (n < 10 ? '0' : '') + n;
const norm = (t) => ((t % 1440) + 1440) % 1440;
const step = () => [60, 30, 5, 1][S.level - 1];
function say(t, m) { return t === undefined ? '' : (h12(t) + '시' + (mm(t) ? ' ' + mm(t) + '분' : '')); }

/* ---------- 모델 ---------- */
const anaRoot = new THREE.Group(), digRoot = new THREE.Group(); scene.add(anaRoot, digRoot);
let hourP, minP, secP, ANA_R = 3, dispMat = null, digTex = null, digCtx = null;
const ang = { h: 0, m: 0, s: 0 };
const loader = new GLTFLoader();

async function loadAll() {
  const [a, d] = await Promise.all([loader.loadAsync('assets/clock-analog.glb'), loader.loadAsync('assets/clock-digital.glb')]);
  /* 아날로그: 누워 있는 모델을 세워서(앞면 +Z, 12시가 위쪽) 놓아요 */
  const am = a.scene; const wrap = new THREE.Group(); wrap.rotation.x = Math.PI / 2; wrap.add(am); anaRoot.add(wrap);
  const paint = (o, col, rough, metal) => { o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(col); m.material.roughness = rough; m.material.metalness = metal || 0; } }); };
  am.traverse((o) => { if (o.isMesh && o.material) { const n = o.material.name; if (n === 'dial') { o.material = o.material.clone(); o.material.color.set('#fffdf6'); o.material.roughness = .8; } else if (n === 'clock_metal') { o.material = o.material.clone(); o.material.color.set('#e7b34a'); o.material.metalness = .55; o.material.roughness = .35; } else if (n === 'Numbers') { o.material = o.material.clone(); o.material.color.set('#2b3f5c'); o.material.roughness = .6; } } });
  hourP = am.getObjectByName('hour_empty'); minP = am.getObjectByName('minute_empty'); secP = am.getObjectByName('second_empty');
  paint(hourP, '#e53935', .45); paint(minP, '#1e88e5', .45); paint(secP, '#2e9d4f', .45);
  am.getObjectByName('middle').traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set('#f4b73f'); } });
  const bb = new THREE.Box3().setFromObject(wrap), c = bb.getCenter(new THREE.Vector3()); wrap.position.sub(c); ANA_R = (bb.max.x - bb.min.x) / 2;
  /* 디지털: 화면(Cube_1)의 그림을 직접 그린 7칸 숫자판으로 바꿔요 */
  const dm = d.scene; digRoot.add(dm);
  dm.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'clock_digits') dispMat = o.material; });
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; digCtx = cv.getContext('2d');
  digTex = new THREE.CanvasTexture(cv); digTex.flipY = true; digTex.colorSpace = THREE.SRGBColorSpace; digTex.anisotropy = 4;
  if (dispMat) { dispMat.map = digTex; dispMat.emissiveMap = digTex; dispMat.emissive = new THREE.Color(1, 1, 1); dispMat.transparent = true; dispMat.needsUpdate = true; }
  const b2 = new THREE.Box3().setFromObject(dm), c2 = b2.getCenter(new THREE.Vector3()); dm.position.sub(c2); dm.userData.w = b2.max.x - b2.min.x;
  digRoot.userData.w = dm.userData.w;
}

/* ---------- 디지털 숫자판 그리기 ---------- */
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function seg(ctx, x, y, w, h, k, on) {
  const t = h * 0.1, L = w, H = h / 2; let r;
  if (k === 'a') r = [x + t, y, L - 2 * t, t]; else if (k === 'g') r = [x + t, y + H - t / 2, L - 2 * t, t]; else if (k === 'd') r = [x + t, y + h - t, L - 2 * t, t];
  else if (k === 'f') r = [x, y + t, t, H - t * 1.5]; else if (k === 'b') r = [x + L - t, y + t, t, H - t * 1.5]; else if (k === 'e') r = [x, y + H + t / 2, t, H - t * 1.5]; else r = [x + L - t, y + H + t / 2, t, H - t * 1.5];
  ctx.fillStyle = on ? '#8ffcff' : 'rgba(143,252,255,.07)'; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], t / 2); ctx.fill();
}
function digit(ctx, d, x, y, w, h) { const on = d === null ? '' : SEG[d]; 'abcdefg'.split('').forEach((k) => seg(ctx, x, y, w, h, k, on.indexOf(k) >= 0)); }
function drawDigital(blank) {
  if (!digCtx) return;
  const c = digCtx; c.clearRect(0, 0, 512, 256);
  const t = S.t, H = h12(t), M = mm(t), pm = Math.floor(t / 60) % 24 >= 12;
  c.save(); c.shadowColor = '#44e8ff'; c.shadowBlur = blank ? 0 : 14;
  const dw = 74, dh = 132, y = 62, xs = [40, 122, 270, 352];
  if (blank) { [0, 1, 2, 3].forEach((i) => { c.fillStyle = '#8ffcff'; c.globalAlpha = .5; c.fillRect(xs[i] + 12, y + dh / 2 - 6, dw - 24, 12); }); c.globalAlpha = 1; }
  else { digit(c, H >= 10 ? 1 : null, xs[0], y, dw, dh); digit(c, H % 10, xs[1], y, dw, dh); digit(c, Math.floor(M / 10), xs[2], y, dw, dh); digit(c, M % 10, xs[3], y, dw, dh); }
  const colonOn = S.speed === 0 || Math.floor(S.s) % 2 === 0 || S.speed > 1;
  c.fillStyle = colonOn ? '#8ffcff' : 'rgba(143,252,255,.1)'; c.beginPath(); c.arc(236, y + dh * 0.34, 8, 0, 7); c.arc(236, y + dh * 0.68, 8, 0, 7); c.fill();
  c.restore();
  c.font = '700 30px "Jua","Nanum Gothic",sans-serif'; c.fillStyle = '#8ffcff'; c.textBaseline = 'alphabetic';
  if (!blank) { c.fillText(pm ? '오후' : '오전', 40, 44); c.globalAlpha = S.speed ? 1 : .35; c.fillText(pad(Math.floor(S.s)) + '초', 392, 228); c.globalAlpha = 1; }
  digTex.needsUpdate = true;
}

/* ---------- 화면 배치 ---------- */
/* 위쪽 안내와 아래쪽 단추를 뺀 가운데 영역에만 시계를 그려요 */
const VP = { x: 0, y: 0, w: 1, h: 1, key: '' };
function freeRect() {
  const w = innerWidth, h = innerHeight;
  const top = Math.max($('#say').getBoundingClientRect().bottom + 6, 120);
  const ctl = $('#ctl').getBoundingClientRect(), ch = $('#choices').hidden ? h : $('#choices').getBoundingClientRect().top;
  const bot = Math.min(ctl.top, ch) - 6;
  return { x: 0, y: top, w, h: Math.max(160, bot - top) };
}
function layout() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  const r = freeRect(), key = [w, h, Math.round(r.y), Math.round(r.h), S.view].join(',');
  if (key === VP.key) return; VP.key = key; VP.x = r.x; VP.w = r.w; VP.h = r.h; VP.top = r.y;
  const asp = r.w / r.h; camera.aspect = asp;
  let halfW, halfH;
  anaRoot.visible = S.view !== 'dig'; digRoot.visible = S.view !== 'ana';
  if (S.view === 'ana') { anaRoot.position.set(0, 0, 0); anaRoot.scale.setScalar(1); halfW = 3.5; halfH = 3.5; }
  else if (S.view === 'dig') { digRoot.position.set(0, 0, 0); digRoot.scale.setScalar(2.3); halfW = 4.5; halfH = 3.0; }
  else if (asp >= 1.5) { anaRoot.position.set(-3.6, 0, 0); anaRoot.scale.setScalar(.85); digRoot.position.set(3.9, -0.2, 0); digRoot.scale.setScalar(1.5); halfW = 7.3; halfH = 3.2; }
  else { anaRoot.position.set(0, 2.6, 0); anaRoot.scale.setScalar(.9); digRoot.position.set(0, -2.6, 0); digRoot.scale.setScalar(1.55); halfW = 3.6; halfH = 5.6; }
  const tf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(halfH / tf, halfW / (tf * asp));
  camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
}
addEventListener('resize', () => { VP.key = ''; layout(); });

/* ---------- 바늘 각도 ---------- */
function targets() {
  const t = S.t, m = mm(t);
  return { h: ((t / 60) % 12) * 30, m: m * 6 + (S.speed ? S.s * 0.1 : 0), s: S.speed ? S.s * 6 : 0 };
}
function shortest(a, b) { return ((b - a + 540) % 360) - 180; }
function animate(dt) {
  const T = targets(), k = 1 - Math.pow(0.0004, dt);
  ang.h += shortest(ang.h, T.h) * k; ang.m += shortest(ang.m, T.m) * k;
  ang.s = S.speed ? T.s : ang.s + shortest(ang.s, 0) * k;
  if (hourP) { hourP.rotation.z = -THREE.MathUtils.degToRad(ang.h); minP.rotation.z = -THREE.MathUtils.degToRad(ang.m); secP.rotation.z = -THREE.MathUtils.degToRad(ang.s); secP.visible = S.speed > 0 || Math.abs(ang.s % 360) > 1; }
}

/* ---------- 말 · 표시 ---------- */
const timeText = $('#timeText'), subText = $('#subText');
function showFree() {
  const t = S.t, m = mm(t), pm = Math.floor(t / 60) % 24 >= 12;
  timeText.className = 'c3-time'; timeText.textContent = (pm ? '오후 ' : '오전 ') + say(t);
  subText.textContent = (m >= 40 ? (h12(t) % 12 + 1) + '시 ' + (60 - m) + '분 전 · ' : '') + (m === 0 ? '긴바늘이 12 · 짧은바늘이 ' + h12(t) : m === 30 ? '긴바늘이 6 · 짧은바늘은 ' + h12(t) + '와 ' + (h12(t) % 12 + 1) + ' 사이' : '긴바늘이 ' + (m / 5 === Math.round(m / 5) ? (m / 5 || 12) : '약 ' + Math.round(m / 5 || 12)) + '을 가리켜요 (' + m + '분)');
}
let voiceTimer = 0;
function speak(txt) {
  if (!S.voice || !('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'ko-KR'; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) {}
}
function sayLater(txt) { clearTimeout(voiceTimer); voiceTimer = setTimeout(() => speak(txt), 500); }
function setStars(n) { S.stars = n; $('#stars').textContent = '⭐ ' + n; try { localStorage.setItem('oks_clock3d_stars', String(n)); } catch (e) {} }
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function randMin() { return S.level === 1 ? 0 : S.level === 2 ? 30 * ri(0, 1) : S.level === 3 ? 5 * ri(0, 11) : ri(0, 59); }
function randTime(avoid) { let t; do { t = ri(1, 12) * 60 + randMin(); } while (avoid !== undefined && t % 720 === avoid % 720); return norm(t); }

/* ---------- 놀이 모드 ---------- */
function setView(v) {
  S.view = v; document.querySelectorAll('#rowView button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); VP.key = ''; layout();
}
function setMode(m) {
  S.mode = m;
  if (m === 'read' && S.view !== 'both') setView('both');
  document.querySelectorAll('#rowView button').forEach((b) => (b.disabled = m === 'read')); S.answered = false; S.q = null; clearTimeout(voiceTimer);
  document.querySelectorAll('#modes button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
  $('#btnCheck').hidden = m !== 'make'; $('#btnNext').hidden = m === 'free'; $('#choices').hidden = m !== 'read'; $('#btnRun').hidden = m !== 'free'; $('#btnNow').hidden = m !== 'free'; $('#btnSay').hidden = m !== 'free';
  $('#rowAdj').style.display = m === 'read' ? 'none' : '';
  if (m !== 'free') S.speed = 0, updRun();
  if (m === 'free') { S.t = norm(S.t); showFree(); drawDigital(false); }
  else nextQ();
}
function nextQ() {
  S.answered = false; $('#btnNext').hidden = true;
  if (S.mode === 'make') {
    const target = randTime(); S.q = { target }; S.t = randTime(target); S.s = 0;
    timeText.className = 'c3-time'; timeText.textContent = '🎯 ' + say(target) + ' 만들기';
    subText.textContent = '디지털 시계를 보고, 아날로그 시계 바늘을 끌어서 맞춰요';
    drawDigitalAt(target); $('#btnCheck').hidden = false;
  } else if (S.mode === 'read') {
    const target = randTime(); S.q = { target }; S.t = target; S.s = 0;
    timeText.className = 'c3-time'; timeText.textContent = '🔍 몇 시 몇 분일까요?'; subText.textContent = '아날로그 시계를 읽고 같은 디지털 시각을 골라요';
    const fmt = (t) => h12(t) + ':' + pad(mm(t)); const ok = fmt(target), set = new Set([ok]);
    const H = h12(target), M = mm(target), st = S.level === 1 ? 60 : S.level === 2 ? 30 : 5;
    const cand = [H % 12 + 1 + ':' + pad(M), ((H + 10) % 12) + 1 + ':' + pad(M), H + ':' + pad((M + st * ri(1, 3)) % 60), H + ':' + pad(((M - st * ri(1, 3)) % 60 + 60) % 60), M && M % 5 === 0 && M < 12 * 5 ? M / 5 + ':' + pad(H * 5 % 60) : ''];
    cand.forEach((c) => { if (c && set.size < 3 && c !== ok) set.add(c); });
    while (set.size < 3) set.add(ri(1, 12) + ':' + pad(randMin()));
    const box = $('#choices'); box.innerHTML = '';
    [...set].sort(() => Math.random() - .5).forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => pickRead(b, c === ok); box.appendChild(b); });
    drawDigital(true);
  }
}
function drawDigitalAt(t) { const keep = S.t; S.t = t; drawDigital(false); S.t = keep; }
function reward(msg) {
  S.answered = true; setStars(S.stars + 1); timeText.className = 'c3-time good'; timeText.textContent = '⭐ 맞았어요!'; subText.textContent = msg; speak('맞았어요! ' + msg); $('#btnNext').hidden = false; $('#btnCheck').hidden = true;
}
function pickRead(btn, ok) {
  if (S.answered) return;
  if (ok) { btn.classList.add('ok'); drawDigital(false); reward(say(S.q.target) + '이에요'); document.querySelectorAll('#choices button').forEach((b) => (b.disabled = true)); }
  else { btn.classList.add('no'); btn.disabled = true; timeText.className = 'c3-time warn'; timeText.textContent = '다시 읽어 봐요'; subText.textContent = '짧은바늘은 몇 시, 긴바늘은 몇 분인지 살펴봐요'; speak('다시 읽어 봐요'); }
}
function checkMake() {
  if (S.answered) return; const q = S.q;
  if (h12(S.t) === h12(q.target) && mm(S.t) === mm(q.target)) reward(say(q.target) + '을 만들었어요');
  else {
    timeText.className = 'c3-time warn'; timeText.textContent = '조금만 더!';
    const hOk = h12(S.t) === h12(q.target), mOk = mm(S.t) === mm(q.target);
    subText.textContent = !hOk && !mOk ? '짧은바늘과 긴바늘을 다시 살펴봐요' : !hOk ? '짧은바늘이 ' + h12(q.target) + ' 근처에 있어야 해요' : '긴바늘이 ' + (mm(q.target) / 5) + ' 에 있어야 해요 (' + mm(q.target) + '분)'; speak('조금만 더');
  }
}

/* ---------- 끌기 ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let drag = null;
function worldPoint(e) {
  ndc.set(((e.clientX - VP.x) / VP.w) * 2 - 1, -((e.clientY - VP.top) / VP.h) * 2 + 1); ray.setFromCamera(ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction, k = -o.z / d.z; return new THREE.Vector3(o.x + d.x * k, o.y + d.y * k, 0);
}
function pointerAngle(e) {
  const p = worldPoint(e), c = anaRoot.position, sc = anaRoot.scale.x, dx = p.x - c.x, dy = p.y - c.y, R = ANA_R * sc;
  return { deg: (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360, r: Math.hypot(dx, dy) / R };
}
canvas.addEventListener('pointerdown', (e) => {
  if (S.mode === 'read' || S.answered && S.mode === 'make' || !anaRoot.visible) return;
  const a = pointerAngle(e); if (a.r > 1.2) return;
  canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); S.speed = 0; updRun();
  drag = { kind: S.level === 1 || a.r < 0.5 ? 'h' : 'm', prev: mm(S.t) };
  onDrag(e);
});
canvas.addEventListener('pointermove', (e) => { if (drag) onDrag(e); });
const end = () => { if (!drag) return; drag = null; canvas.classList.remove('drag'); if (S.mode === 'free') sayLater(say(S.t)); };
canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
function onDrag(e) {
  const a = pointerAngle(e), pm = Math.floor(S.t / 60) % 24 >= 12 ? 12 : 0;
  if (drag.kind === 'h') {
    const hh = Math.round(a.deg / 30) % 12; S.t = norm(pm * 60 + hh * 60 + mm(S.t));
  } else {
    const st = step(); let m = Math.round(a.deg / 6 / st) * st; m %= 60; let H = Math.floor(S.t / 60);
    if (drag.prev >= 40 && m <= 20) H += 1; else if (drag.prev <= 20 && m >= 40) H -= 1;
    drag.prev = m; S.t = norm(H * 60 + m);
  }
  S.s = 0; if (S.mode === 'free') showFree(); drawDigital(S.mode === 'read');
}

/* ---------- 단추 ---------- */
document.querySelectorAll('#rowView button').forEach((b) => (b.onclick = () => { if (S.mode !== 'read') setView(b.dataset.v); }));
document.querySelectorAll('#modes button').forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
document.querySelectorAll('#rowAdj button').forEach((b) => (b.onclick = () => {
  if (S.answered && S.mode === 'make') return; S.speed = 0; updRun(); S.t = norm(S.t + (+b.dataset.d)); S.s = 0; if (S.mode === 'free') { showFree(); sayLater(say(S.t)); } drawDigital(false);
}));
const RUN = [['시계: 멈춤', 0], ['시계: 진짜 속도 ⏱', 1], ['시계: 60배 빨리 ⏩', 60]];
function updRun() { const i = S.speed === 0 ? 0 : S.speed === 1 ? 1 : 2; $('#btnRun').textContent = RUN[i][0]; $('#btnRun').classList.toggle('on', i > 0); }
$('#btnRun').onclick = () => { const i = (RUN.findIndex((r) => r[1] === S.speed) + 1) % 3; S.speed = RUN[i][1]; if (!S.speed) S.s = 0; updRun(); if (S.speed === 1) subText.textContent = '초침이 한 바퀴(60초) 돌면 긴바늘이 한 칸(1분) 가요'; };
$('#btnSay').onclick = () => speak(say(S.t));
$('#btnNow').onclick = () => { const d = new Date(); S.t = d.getHours() * 60 + d.getMinutes(); S.s = d.getSeconds(); S.speed = 1; updRun(); showFree(); };
$('#btnCheck').onclick = checkMake; $('#btnNext').onclick = nextQ;
$('#lv').onchange = (e) => { S.level = +e.target.value; if (S.mode === 'free') { if (S.level === 1) S.t = norm(Math.floor(S.t / 60) * 60); else if (S.level === 2) S.t = norm(Math.floor(S.t / 60) * 60 + (mm(S.t) >= 15 && mm(S.t) < 45 ? 30 : 0)); showFree(); drawDigital(false); } else nextQ(); };
$('#btnVoice').onclick = (e) => { S.voice = !S.voice; e.currentTarget.setAttribute('aria-pressed', String(S.voice)); e.currentTarget.textContent = S.voice ? '🔊' : '🔇'; if (!S.voice) try { speechSynthesis.cancel(); } catch (x) {} };

/* ---------- 시작 ---------- */
let last = performance.now(), digAcc = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (S.speed) {
    S.s += dt * S.speed; if (S.s >= 60) { const add = Math.floor(S.s / 60); S.s -= add * 60; S.t = norm(S.t + add); if (S.mode === 'free') showFree(); }
    digAcc += dt; if (digAcc > 0.2) { digAcc = 0; drawDigital(false); }
  }
  animate(dt);
  const tt = now / 1000; digRoot.rotation.y = Math.sin(tt * .6) * .1; digRoot.rotation.x = Math.sin(tt * .45) * .03; anaRoot.rotation.y = Math.sin(tt * .5 + 1) * .05;
  layout(); const H = innerHeight, bottomPx = H - VP.top - VP.h;
  renderer.setScissorTest(true); renderer.setViewport(VP.x, bottomPx, VP.w, VP.h); renderer.setScissor(VP.x, bottomPx, VP.w, VP.h); renderer.render(scene, camera); requestAnimationFrame(loop);
}
(async () => {
  layout(); setStars(S.stars); updRun();
  try { await loadAll(); } catch (e) { $('#loading p').textContent = '시계를 불러오지 못했어요. 다시 열어 주세요.'; console.error(e); return; }
  const T = targets(); ang.h = T.h; ang.m = T.m;
  setMode('free'); VP.key = ''; layout(); $('#loading').classList.add('off'); requestAnimationFrame(loop);
  window.__clock3d = { S, ang, setMode, setView, drawDigital, VP, camera, anaRoot, ANA_R: () => ANA_R, THREE };
})();
