/* 볼링 물리 (평면 x–z). 단위: 미터×1.6. 공은 -z 쪽으로 굴러가요. three.js 없이도 돌아가서 시험할 수 있어요. */
export const S = 1.6;
export const LANE = { L: 6.5, halfW: 0.527 * S, gutter: 0.235 * S, deckEnd: 0.9 * S, ballR: 0.109 * S * 1.12, pinR: 0.06 * S, pinH: 0.333 * S };
const DX = 0.305 * S, DZ = 0.264 * S;
export function pinSpots() { const o = []; for (let k = 0; k < 4; k++) for (let j = 0; j <= k; j++) o.push({ x: (j - k / 2) * DX, z: -LANE.L - k * DZ }); return o; }
export function createWorld(opt) {
  const w = { t: 0, bumpers: !!(opt && opt.bumpers), pins: [], ball: null, ev: [], rolling: false };
  pinSpots().forEach((p, i) => w.pins.push({ id: i + 1, x: p.x, z: p.z, hx: p.x, hz: p.z, vx: 0, vz: 0, r: LANE.pinR, m: 1.6, st: 'up', fall: 0, fdx: 0, fdz: -1, gone: false, wob: 0, spin: 0 }));
  return w;
}
/* 남길 핀(ids)만 세우고 나머지는 치워요. ids가 null이면 모두 새로 세워요 */
export function setRack(w, keepIds) {
  w.pins.forEach((p) => { const keep = !keepIds || keepIds.includes(p.id); p.x = p.hx; p.z = p.hz; p.vx = p.vz = 0; p.st = 'up'; p.fall = 0; p.wob = 0; p.gone = false; p.out = !keep; p.pit = false; p.gut = 0; p.spin = 0; });
}
export function launch(w, sx, tx, speed, noise) {
  const dx = (tx - sx), dz = -LANE.L - 0.0; const a = Math.atan2(dx, -dz) + (noise || 0), sp = speed;
  w.ball = { x: sx, z: 0.0, vx: Math.sin(a) * sp, vz: -Math.cos(a) * sp, r: LANE.ballR, m: 9, gutter: 0, gx: 0, y: LANE.ballR, spin: 0, off: false };
  w.rolling = true; w.settle = 0; w.ev.length = 0;
}
const T_FALL = 0.45;
function hitPair(a, b, e) {
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = a.r + b.r; if (d >= min || d < 1e-6) return 0;
  const nx = dx / d, nz = dz / d, ov = min - d, wa = b.m / (a.m + b.m), wb = a.m / (a.m + b.m);
  a.x -= nx * ov * wa; a.z -= nz * ov * wa; b.x += nx * ov * wb; b.z += nz * ov * wb;
  const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz; if (rv >= 0) return 0;
  const j = -(1 + e) * rv / (1 / a.m + 1 / b.m);
  a.vx -= j * nx / a.m; a.vz -= j * nz / a.m; b.vx += j * nx / b.m; b.vz += j * nz / b.m;
  return -rv;
}
function tip(p) {
  if (p.st !== 'up') return;
  const sp = Math.hypot(p.vx, p.vz); if (sp < T_FALL) { p.wob = Math.max(p.wob, Math.min(1, sp / T_FALL)); return; }
  p.st = 'fall'; p.fall = 0; p.fdx = p.vx / sp; p.fdz = p.vz / sp; p.spin = (Math.random() - 0.5) * 8;
}
export function step(w, dt) {
  w.t += dt; const B = w.ball, ev = w.ev;
  if (B && !B.off) {
    B.x += B.vx * dt; B.z += B.vz * dt;
    const lim = LANE.halfW - B.r * 0.25;
    if (w.bumpers) { const l = LANE.halfW - B.r * 0.4; if (B.x > l) { B.x = l; B.vx = -Math.abs(B.vx) * 0.55; ev.push('bump'); } if (B.x < -l) { B.x = -l; B.vx = Math.abs(B.vx) * 0.55; ev.push('bump'); } }
    else if (!B.gutter && Math.abs(B.x) > lim + B.r * 0.55 && B.z < 0) { B.gutter = Math.sign(B.x); ev.push('gutter'); }
    if (B.gutter) { const gx = B.gutter * (LANE.halfW + LANE.gutter * 0.5); B.x += (gx - B.x) * Math.min(1, dt * 9); B.y += (0.02 - B.y) * Math.min(1, dt * 9); B.vx = 0; }
    B.spin += B.vz * dt / B.r;
    if (B.z < -LANE.L - LANE.deckEnd - 0.9) { B.off = true; B.z = -LANE.L - LANE.deckEnd - 1.4; }
  }
  const live = w.pins.filter((p) => !p.gone && !p.out);
  for (const p of live) {
    p.x += p.vx * dt; p.z += p.vz * dt;
    const damp = Math.exp(-(p.st === "up" ? 3 : 1.0) * dt); p.vx *= damp; p.vz *= damp;
    if (p.st === 'fall') { p.fall += dt; }
    if (p.wob > 0) p.wob = Math.max(0, p.wob - dt * 0.8);
  }
  if (B && !B.off && !B.gutter) for (const p of live) { const imp = hitPair(B, p, 0.6); if (imp) { if (imp > 0.3) ev.push('hit'); tip(p); } }
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const a = live[i], b = live[j]; const imp = hitPair(a, b, 0.75); if (imp) { if (imp > 0.4) ev.push('clack'); if (a.st === 'fall' || imp > 0.3) tip(b); if (b.st === 'fall' || imp > 0.3) tip(a); tip(a); tip(b); } }
  for (const p of live) {
    if (p.z < -LANE.L - LANE.deckEnd - 0.05) { p.gone = true; p.pit = true; }          // 구덩이로
    else if (Math.abs(p.x) > LANE.halfW + 0.05) { p.gone = true; p.gut = Math.sign(p.x); } // 도랑으로
  }
}
/* 아직 움직이는 중인가? */
export function moving(w) {
  const B = w.ball; if (B && !B.off) return true;
  return w.pins.some((p) => !p.gone && !p.out && (Math.hypot(p.vx, p.vz) > 0.04 || (p.st === 'fall' && p.fall < 0.7)));
}
export function downPins(w) { return w.pins.filter((p) => !p.out && (p.gone || p.st === 'fall')); }
