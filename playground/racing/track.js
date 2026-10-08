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
