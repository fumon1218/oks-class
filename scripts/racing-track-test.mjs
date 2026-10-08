import { makeTrack } from '../playground/racing/track.js';
let ok = 0, bad = 0; const t = (c, m) => { if (c) ok++; else { bad++; console.log('FAIL', m); } };
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
  const tr = makeTrack(seed, 3600); let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9, maxPhi = 0;
  tr.P.forEach((p, i) => { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); minz = Math.min(minz, p[1]); maxz = Math.max(maxz, p[1]); maxPhi = Math.max(maxPhi, Math.abs(Math.atan2(tr.T[i][0], -tr.T[i][1]))); });
  t(maxPhi < 1.6, `seed ${seed} 방향각 ${maxPhi.toFixed(2)}`); t(minz < -2000, `seed ${seed} 앞으로 나아감 ${minz | 0}`);
  // 길이 서로 겹치지 않는지: 30m 이상 떨어진 길 조각끼리 25m 안으로 오면 안 돼요
  let close = 0; for (let i = 0; i < tr.P.length; i += 2) for (let j = i + 40; j < tr.P.length; j += 2) if (Math.hypot(tr.P[i][0] - tr.P[j][0], tr.P[i][1] - tr.P[j][1]) < 28) close++;
  t(close === 0, `seed ${seed} 겹침 ${close}`);
  const a = tr.at(1800); t(Math.abs(Math.hypot(a.tx, a.tz) - 1) < 1e-6, 'unit tangent');
}
console.log(`${ok} OK, ${bad} FAIL`); process.exit(bad ? 1 : 0);
