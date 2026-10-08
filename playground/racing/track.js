/* 스피드 레이스 길 만들기 (three.js 없이도 돌아가요). 앞으로 -z 쪽으로 달리는 외길.
   κ(곡률) > 0 이 오른쪽 커브. 방향각이 너무 많이 꺾이지 않게 눌러서 길이 서로 겹치지 않게 해요. */
export function makeTrack(seed, length, opt) {
  opt = opt || {}; let sd = seed >>> 0; const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const DS = 4, n = Math.round(length / DS), maxK = opt.maxK || 1 / 140, maxPhi = opt.maxPhi || 1.25;
  // 구간마다 목표 곡률을 골라 부드럽게 따라가요 (직선·커브가 섞여요)
  const P = [], T = [], K = [], Y = []; let x = 0, z = 0, phi = 0, k = 0, tgt = 0, hold = 0;
  for (let i = 0; i <= n; i++) {
    if (hold <= 0) { const r = rnd(); hold = 20 + Math.floor(rnd() * 40); tgt = i < 25 ? 0 : r < 0.3 ? 0 : (rnd() < 0.5 ? -1 : 1) * maxK * (0.35 + rnd() * 0.65); if (Math.abs(phi) > maxPhi * 0.45) tgt = -Math.sign(phi) * maxK * (0.5 + rnd() * 0.5); }
    hold--; if (Math.abs(phi) > maxPhi * 0.8) tgt = -Math.sign(phi) * maxK; k += (tgt - k) * 0.08; if (i > n - 25) k *= 0.85; phi += k * DS;
    P.push([x, z]); T.push([Math.sin(phi), -Math.cos(phi)]); K.push(k);
    x += Math.sin(phi) * DS; z -= Math.cos(phi) * DS;
  }
  // 오르막·내리막(완만하게)
  const a1 = 1.2 + rnd() * 1.2, a2 = 2.2 + rnd() * 1.6, f1 = 0.0045 + rnd() * 0.002, f2 = 0.0113 + rnd() * 0.004, p1 = rnd() * 6, p2 = rnd() * 6;
  for (let i = 0; i <= n; i++) { const s = i * DS, fade = Math.min(1, s / 120) * Math.min(1, (length - s) / 120); Y.push(((Math.sin(s * f1 + p1) + 1) * a2 + (Math.sin(s * f2 + p2) + 1) * a1) * fade); }
  const at = (s) => { s = Math.max(0, Math.min(length - 0.001, s)); const f = s / DS, i = Math.floor(f), t = f - i, A = P[i], B = P[i + 1], tA = T[i], tB = T[i + 1];
    let tx = tA[0] + (tB[0] - tA[0]) * t, tz = tA[1] + (tB[1] - tA[1]) * t; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    return { x: A[0] + (B[0] - A[0]) * t, z: A[1] + (B[1] - A[1]) * t, y: Y[i] + (Y[i + 1] - Y[i]) * t, tx, tz, nx: tz, nz: -tx, k: K[i] + (K[i + 1] - K[i]) * t, slope: (Y[i + 1] - Y[i]) / DS }; };
  return { length, DS, n, P, T, K, Y, at };
}

/* 닫힌 순환 도로(여러 바퀴 도는 코스). ctrl = 제어점들, lap = 한 바퀴 길이(m). at(s)는 s가 커져도 계속 빙글 돌아요. */
export const LOOP_SHAPES = {
  sakura: [[34, 0], [27, 17], [0, 23], [-28, 18], [-36, 0], [-27, -18], [0, -23], [27, -18]],
  skyisle: [[38, 0], [28, 22], [9, 19], [-12, 29], [-36, 12], [-34, -14], [-12, -25], [17, -17]],
  beach: [[39, 0], [30, 22], [10, 29], [-18, 20], [-39, 0], [-25, -17], [-2, -28], [25, -15]],
  meadow: [[33, 0], [23, 19], [8, 13], [-7, 27], [-34, 10], [-29, -19], [0, -24], [30, -16]],
  space: [[41, 0], [31, 22], [10, 18], [-5, 28], [-34, 19], [-43, -6], [-16, -25], [25, -20]],
  canyon: [[36, 0], [30, 14], [12, 26], [-10, 16], [-30, 24], [-38, 0], [-24, -20], [4, -26], [28, -18]],
  snow: [[40, 0], [22, 10], [8, 28], [-14, 22], [-24, 6], [-38, -6], [-20, -26], [10, -20], [30, -24]],
  volcano: [[34, 0], [34, 18], [10, 14], [-8, 28], [-34, 18], [-36, -8], [-14, -14], [6, -28], [30, -20]],
  candy: [[30, 0], [40, 16], [18, 28], [-6, 20], [-30, 26], [-40, 2], [-22, -14], [-2, -26], [26, -22]],
  aurora: [[44, 0], [26, 24], [0, 16], [-24, 26], [-44, 4], [-26, -14], [-8, -28], [16, -12], [34, -24]],
};
export function makeLoopTrack(seed, ctrl, lap, smooth) {
  if (smooth === undefined) smooth = 70;
  let sd = seed >>> 0; const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const m = ctrl.length, cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  const dense = [], per = 400; for (let i = 0; i < m; i++) { const a = ctrl[(i + m - 1) % m], b = ctrl[i], c = ctrl[(i + 1) % m], d = ctrl[(i + 2) % m]; for (let j = 0; j < per; j++) { const t = j / per; dense.push([cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t)]); } }
  { // 모서리를 둥글게: 일정한 간격으로 다시 찍은 뒤 부드럽게 섞어요
    const c0 = [0]; for (let i = 1; i <= dense.length; i++) { const p = dense[i - 1], q = dense[i % dense.length]; c0.push(c0[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
    const M = 1200, U = []; for (let i = 0, k = 0; i < M; i++) { const tg = (i / M) * c0[dense.length]; while (c0[k + 1] < tg) k++; const f = (tg - c0[k]) / (c0[k + 1] - c0[k] || 1), p = dense[k], q = dense[(k + 1) % dense.length]; U.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); }
    const sig = Math.max(0, smooth), R = Math.ceil(sig * 3), W = []; let ws = 0; for (let j = -R; j <= R; j++) { const w = Math.exp(-(j * j) / (2 * sig * sig + 1e-9)); W.push(w); ws += w; }
    if (sig > 0) { const B = U.map((_, i) => { let x = 0, z = 0; for (let j = -R; j <= R; j++) { const q = U[(i + j + M * 4) % M]; x += q[0] * W[j + R]; z += q[1] * W[j + R]; } return [x / ws, z / ws]; }); dense.length = 0; B.forEach((p) => dense.push(p)); } else { dense.length = 0; U.forEach((p) => dense.push(p)); }
  }
  const cum = [0]; for (let i = 1; i <= dense.length; i++) { const p = dense[i - 1], q = dense[i % dense.length]; cum.push(cum[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
  const raw = cum[dense.length], sc = lap / raw, n = Math.round(lap / 4), DS = lap / n, P = [];
  for (let i = 0, k = 0; i < n; i++) { const target = (i * DS) / sc; while (cum[k + 1] < target) k++; const f = (target - cum[k]) / (cum[k + 1] - cum[k] || 1), p = dense[k], q = dense[(k + 1) % dense.length]; P.push([(p[0] + (q[0] - p[0]) * f) * sc, (p[1] + (q[1] - p[1]) * f) * sc]); }
  P.push(P[0].slice());
  const T = [], K = [], ph = []; for (let i = 0; i < n; i++) { const a = P[(i + n - 1) % n], b = P[i + 1]; const tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz); T.push([tx / l, tz / l]); ph.push(Math.atan2(tx, -tz)); }
  T.push(T[0].slice()); for (let i = 0; i < n; i++) { let d = ph[(i + 1) % n] - ph[i]; d = Math.atan2(Math.sin(d), Math.cos(d)); K.push(d / DS); } K.push(K[0]);
  // 오르막·내리막: 한 바퀴에 정확히 맞아떨어지는 물결이라 이어지는 곳이 매끈해요
  const Y = [], m1 = 2 + Math.floor(rnd() * 2), m2 = 5 + Math.floor(rnd() * 3), a1 = 1.1 + rnd() * 1.1, a2 = 2 + rnd() * 1.4, p1 = rnd() * 6, p2 = rnd() * 6;
  for (let i = 0; i <= n; i++) { const u = (i / n) * Math.PI * 2; Y.push((Math.sin(u * m1 + p1) + 1) * a2 + (Math.sin(u * m2 + p2) + 1) * a1); }
  const at = (s) => { s = ((s % lap) + lap) % lap; const f = s / DS; let i = Math.floor(f); if (i >= n) i = n - 1; const t = f - i, A = P[i], B = P[i + 1], tA = T[i], tB = T[i + 1];
    let tx = tA[0] + (tB[0] - tA[0]) * t, tz = tA[1] + (tB[1] - tA[1]) * t; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    return { x: A[0] + (B[0] - A[0]) * t, z: A[1] + (B[1] - A[1]) * t, y: Y[i] + (Y[i + 1] - Y[i]) * t, tx, tz, nx: tz, nz: -tx, k: K[i] + (K[i + 1] - K[i]) * t, slope: (Y[i + 1] - Y[i]) / DS }; };
  return { length: lap, DS, n, P, T, K, Y, at, loop: true };
}
