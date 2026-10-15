/* 3D 시계 보기(재사용 모듈) — 수학 · 시각과 시간
   아날로그 시계(시침·분침·초침)와 디지털 시계(알람시계 화면)를 한 장면에 놓고, 담아 둔 상자(container) 크기에 맞춰 그려요.
   쓰는 곳: 차시 게임 엔진(play/clock.js)
   const v = await createClockView(box, { view:'both' });
   v.setTime(t, s)  t=하루 0~1439분, s=초   v.getTime() → {t,s}
   v.setView('both'|'ana'|'dig')  v.setRun(0|1|60)  v.setSecHand(true)  v.setDigital({blank,sec,ampm})  v.setDigitalTime(t|null) 디지털 화면에만 따로 보여 줄 시각
   v.setDrag({kind:'auto'|'hour'|'minute', step:60|30|5|1} | null)  v.onChange(fn(t))  v.onDragEnd(fn(t))
   v.onHand(fn('hour'|'minute'|'second'))  v.pulse('hour'|'minute'|'second'|null)  v.destroy() */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';

const h12 = (t) => ((Math.floor(t / 60) + 11) % 12) + 1;
const mm = (t) => ((t % 60) + 60) % 60;
const pad = (n) => (n < 10 ? '0' : '') + n;
const norm = (t) => ((t % 1440) + 1440) % 1440;
const shortest = (a, b) => ((b - a + 540) % 360) - 180;

/* 7칸 숫자 */
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function seg(ctx, x, y, w, h, k, on) {
  const t = h * 0.1, L = w, H = h / 2; let r;
  if (k === 'a') r = [x + t, y, L - 2 * t, t]; else if (k === 'g') r = [x + t, y + H - t / 2, L - 2 * t, t]; else if (k === 'd') r = [x + t, y + h - t, L - 2 * t, t];
  else if (k === 'f') r = [x, y + t, t, H - t * 1.5]; else if (k === 'b') r = [x + L - t, y + t, t, H - t * 1.5]; else if (k === 'e') r = [x, y + H + t / 2, t, H - t * 1.5]; else r = [x + L - t, y + H + t / 2, t, H - t * 1.5];
  ctx.fillStyle = on ? '#8ffcff' : 'rgba(143,252,255,.07)'; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], t / 2); ctx.fill();
}
function digit(ctx, d, x, y, w, h) { const on = d === null ? '' : SEG[d]; 'abcdefg'.split('').forEach((k) => seg(ctx, x, y, w, h, k, on.indexOf(k) >= 0)); }

export async function createClockView(container, opts = {}) {
  const base = opts.base || new URL('assets/', import.meta.url).href;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', '3D 아날로그 시계와 디지털 시계');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
  container.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(new THREE.HemisphereLight(0xdfeeff, 0x6b5a4a, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(2, 4, 6); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  const S = { t: 15 * 60, s: 0, speed: 0, view: opts.view || 'both', secHand: false, dig: { blank: false, sec: true, ampm: true }, digT: null, dragCfg: null, pulse: null };
  const ang = { h: 0, m: 0, s: 0 };
  const cb = { change: null, end: null, hand: null };
  const anaRoot = new THREE.Group(), digRoot = new THREE.Group(); scene.add(anaRoot, digRoot);
  let hourP, minP, secP, ANA_R = 3, digTex, digCtx, dispMat = null, alive = true, raf = 0;
  const handMats = { hour: [], minute: [], second: [] };

  const loader = new GLTFLoader();
  const [a, d] = await Promise.all([loader.loadAsync(base + 'clock-analog.glb'), loader.loadAsync(base + 'clock-digital.glb')]);
  const am = a.scene; const wrap = new THREE.Group(); wrap.rotation.x = Math.PI / 2; wrap.add(am); anaRoot.add(wrap);
  const paint = (o, col, rough, list) => { o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(col); m.material.roughness = rough; m.material.emissive = new THREE.Color(0, 0, 0); list.push(m.material); } }); };
  am.traverse((o) => { if (o.isMesh && o.material) { const n = o.material.name; if (n === 'dial') { o.material = o.material.clone(); o.material.color.set('#fffdf6'); o.material.roughness = .8; } else if (n === 'clock_metal') { o.material = o.material.clone(); o.material.color.set('#e7b34a'); o.material.metalness = .55; o.material.roughness = .35; } else if (n === 'Numbers') { o.material = o.material.clone(); o.material.color.set('#2b3f5c'); o.material.roughness = .6; } } });
  hourP = am.getObjectByName('hour_empty'); minP = am.getObjectByName('minute_empty'); secP = am.getObjectByName('second_empty');
  paint(hourP, '#e53935', .45, handMats.hour); paint(minP, '#1e88e5', .45, handMats.minute); paint(secP, '#2e9d4f', .45, handMats.second);
  am.getObjectByName('middle').traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set('#f4b73f'); } });
  const bb = new THREE.Box3().setFromObject(wrap), c = bb.getCenter(new THREE.Vector3()); wrap.position.sub(c); ANA_R = (bb.max.x - bb.min.x) / 2;
  const dm = d.scene; digRoot.add(dm);
  dm.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'clock_digits') dispMat = o.material; });
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; digCtx = cv.getContext('2d');
  digTex = new THREE.CanvasTexture(cv); digTex.flipY = true; digTex.colorSpace = THREE.SRGBColorSpace; digTex.anisotropy = 4;
  if (dispMat) { dispMat.map = digTex; dispMat.emissiveMap = digTex; dispMat.emissive = new THREE.Color(1, 1, 1); dispMat.transparent = true; dispMat.needsUpdate = true; }
  const b2 = new THREE.Box3().setFromObject(dm), c2 = b2.getCenter(new THREE.Vector3()); dm.position.sub(c2);

  function drawDigital() {
    const c = digCtx, t = S.digT == null ? S.t : S.digT, H = h12(t), M = mm(t), pm = Math.floor(t / 60) % 24 >= 12, blank = S.dig.blank;
    c.clearRect(0, 0, 512, 256);
    c.save(); c.shadowColor = '#44e8ff'; c.shadowBlur = blank ? 0 : 14;
    const dw = 74, dh = 132, y = 62, xs = [40, 122, 270, 352];
    if (blank) { [0, 1, 2, 3].forEach((i) => { c.fillStyle = '#8ffcff'; c.globalAlpha = .5; c.fillRect(xs[i] + 12, y + dh / 2 - 6, dw - 24, 12); }); c.globalAlpha = 1; }
    else { digit(c, H >= 10 ? 1 : null, xs[0], y, dw, dh); digit(c, H % 10, xs[1], y, dw, dh); digit(c, Math.floor(M / 10), xs[2], y, dw, dh); digit(c, M % 10, xs[3], y, dw, dh); }
    const colonOn = S.speed === 0 || Math.floor(S.s) % 2 === 0 || S.speed > 1;
    c.fillStyle = colonOn ? '#8ffcff' : 'rgba(143,252,255,.1)'; c.beginPath(); c.arc(236, y + dh * 0.34, 8, 0, 7); c.arc(236, y + dh * 0.68, 8, 0, 7); c.fill();
    c.restore();
    c.font = '700 30px "Jua","Nanum Gothic",sans-serif'; c.fillStyle = '#8ffcff'; c.textBaseline = 'alphabetic';
    if (!blank) {
      if (S.dig.ampm) c.fillText(pm ? '오후' : '오전', 40, 44);
      if (S.dig.sec) { c.globalAlpha = (S.speed || S.s) ? 1 : .35; c.fillText(pad(Math.floor(S.s)) + '초', 392, 228); c.globalAlpha = 1; }
    }
    digTex.needsUpdate = true;
  }

  /* ---------- 배치 ---------- */
  let key = '';
  function layout() {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    const k = [w, h, S.view].join(','); if (k === key) return; key = k;
    renderer.setSize(w, h, false);
    const asp = w / h; camera.aspect = asp;
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
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { key = ''; layout(); }) : null; if (ro) ro.observe(container);

  /* ---------- 바늘 ---------- */
  function targets() {
    const t = S.t, m = mm(t), run = S.speed > 0 || S.s > 0;
    return { h: ((t / 60) % 12) * 30, m: m * 6 + (run ? S.s * 0.1 : 0), s: run || S.secHand ? S.s * 6 : 0 };
  }
  function animate(dt, now) {
    const T = targets(), k = 1 - Math.pow(0.0004, dt);
    ang.h += shortest(ang.h, T.h) * k; ang.m += shortest(ang.m, T.m) * k;
    ang.s = S.speed ? T.s : ang.s + shortest(ang.s, T.s) * k;
    const D = THREE.MathUtils.degToRad;
    hourP.rotation.z = -D(ang.h); minP.rotation.z = -D(ang.m); secP.rotation.z = -D(ang.s);
    secP.visible = S.speed > 0 || S.secHand || S.s > 0 || Math.abs(shortest(ang.s, 0)) > 1;
    const glow = S.pulse ? 0.35 + 0.35 * Math.sin(now / 160) : 0;
    ['hour', 'minute', 'second'].forEach((n) => handMats[n].forEach((m) => { const on = S.pulse === n; m.emissive.setRGB(on ? 1 : 0, on ? 1 : 0, on ? .6 : 0); m.emissiveIntensity = on ? glow + .2 : 0; }));
  }

  /* ---------- 끌기 · 누르기 ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pointerAngle(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const o = ray.ray.origin, dd = ray.ray.direction, kk = -o.z / dd.z, px = o.x + dd.x * kk, py = o.y + dd.y * kk;
    const cc = anaRoot.position, dx = px - cc.x, dy = py - cc.y, R = ANA_R * anaRoot.scale.x;
    return { deg: (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360, r: Math.hypot(dx, dy) / R };
  }
  let drag = null, down = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (!anaRoot.visible) return;
    const a = pointerAngle(e); if (a.r > 1.2) return;
    if (!S.dragCfg) {
      if (cb.hand) { /* 바늘 누르기: 가까운 바늘 찾기 */
        const dh = Math.abs(shortest(a.deg, ang.h)), dmn = Math.abs(shortest(a.deg, ang.m)), ds = Math.abs(shortest(a.deg, ang.s));
        let best = null;
        if (a.r < 0.62 && dh < 22) best = 'hour';
        if (a.r < 0.95 && dmn < 14 && (!best || dmn < dh)) best = 'minute';
        if (secP.visible && a.r < 0.95 && ds < 10 && (!best || ds < Math.min(dh, dmn))) best = 'second';
        if (best) cb.hand(best);
      }
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    const cfg = S.dragCfg;
    drag = { kind: cfg.kind === 'auto' ? (a.r < 0.5 ? 'h' : 'm') : cfg.kind === 'hour' ? 'h' : 'm', prev: mm(S.t), step: cfg.step || 1 };
    S.speed = 0; onDrag(e);
  });
  canvas.addEventListener('pointermove', (e) => { if (drag) onDrag(e); });
  const end = () => { if (!drag) return; drag = null; if (cb.end) cb.end(S.t); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  function onDrag(e) {
    const a = pointerAngle(e), pm = Math.floor(S.t / 60) % 24 >= 12 ? 12 : 0;
    if (drag.kind === 'h') { const hh = Math.round(a.deg / 30) % 12; S.t = norm(pm * 60 + hh * 60 + mm(S.t)); }
    else {
      const st = drag.step; let m = Math.round(a.deg / 6 / st) * st; m %= 60; let H = Math.floor(S.t / 60);
      if (drag.prev >= 40 && m <= 20) H += 1; else if (drag.prev <= 20 && m >= 40) H -= 1;
      drag.prev = m; S.t = norm(H * 60 + m);
    }
    S.s = 0; drawDigital(); if (cb.change) cb.change(S.t);
  }

  /* ---------- 돌리기 ---------- */
  let last = performance.now(), acc = 0;
  function loop(now) {
    if (!alive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (S.speed) {
      S.s += dt * S.speed; if (S.s >= 60) { const add = Math.floor(S.s / 60); S.s -= add * 60; S.t = norm(S.t + add); if (cb.change) cb.change(S.t); }
      acc += dt; if (acc > 0.2) { acc = 0; drawDigital(); }
    }
    animate(dt, now);
    const tt = now / 1000; digRoot.rotation.y = Math.sin(tt * .6) * .1; digRoot.rotation.x = Math.sin(tt * .45) * .03; anaRoot.rotation.y = Math.sin(tt * .5 + 1) * .05;
    layout(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
  }

  const api = {
    THREE, S, ang, canvas,
    setTime(t, s = 0, o = {}) { S.t = norm(Math.round(t)); S.s = s; drawDigital(); if (o.jump) { const T = targets(); ang.h = T.h; ang.m = T.m; ang.s = T.s; } },
    getTime() { return { t: S.t, s: S.s }; },
    setView(v) { S.view = v; key = ''; layout(); },
    setRun(sp) { S.speed = sp; if (!sp) S.s = 0; drawDigital(); },
    setSecHand(b) { S.secHand = !!b; },
    setDigitalTime(t) { S.digT = t == null ? null : norm(t); drawDigital(); },
    setDigital(o) { Object.assign(S.dig, o); drawDigital(); },
    setDrag(cfg) { S.dragCfg = cfg; canvas.style.cursor = cfg ? 'grab' : 'default'; },
    onChange(fn) { cb.change = fn; }, onDragEnd(fn) { cb.end = fn; }, onHand(fn) { cb.hand = fn; },
    pulse(n) { S.pulse = n || null; },
    resize() { key = ''; layout(); },
    destroy() { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); renderer.dispose(); canvas.remove(); }
  };
  drawDigital(); layout(); { const T = targets(); ang.h = T.h; ang.m = T.m; ang.s = T.s; }
  raf = requestAnimationFrame(loop);
  return api;
}
