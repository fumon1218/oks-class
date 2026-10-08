/* 카툰 장난감 스포츠카(코드로 만든 3D 모델). 앞은 +z, 바닥은 y=0. 색(bodyColor)만 바꿔서 여러 대를 만들 수 있어요.
   바퀴는 wh0~3 (_s: 방향 돌리기, _r: 구르기) 이름의 묶음이라 게임에서 돌아가요. */
const STY = {   // 차 종류별: 포인트 색(acc)·줄무늬 여부
  sport: { acc: 0xffc928, stripe: 1 }, formula: { acc: 0xff8a1f, stripe: 1 }, wave: { acc: 0x8fe3ff }, buggy: { acc: 0x2f7d46 }, flower: { acc: 0xff5d96 },
  star: { acc: 0xffd23f }, rocket: { acc: 0xffd23f }, cloud: { acc: 0xffffff }, knight: { acc: 0xc9d3e0 }, comet: { acc: 0xa56bff, stripe: 1 },
};
export function buildToyCar(THREE, bodyColor, style) {
  style = STY[style] ? style : 'sport'; const ST = STY[style];
  const g = new THREE.Group();
  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.3, metalness: 0.1 }, o || {}));
  const body = M(bodyColor, { roughness: 0.2, metalness: 0.15 }), white = M(0xffffff, { roughness: 0.35 }), yellow = M(ST.acc, { roughness: 0.3 }), black = M(0x14161b, { roughness: 0.7 }),
    glass = M(0x1b2a3c, { roughness: 0.05, metalness: 0.5 }), silver = M(0xe3e8ee, { metalness: 0.85, roughness: 0.25 }), tail = M(0xd01a2c, { emissive: 0x6a0010, roughness: 0.3 });
  const sph = new THREE.SphereGeometry(1, 28, 20);
  const put = (geo, mat, x, y, z, sx, sy, sz, rx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (sx !== undefined) m.scale.set(sx, sy, sz); if (rx) m.rotation.x = rx; g.add(m); return m; };
  function rbox(w, h, l, r, bev) {          // 폭(x)·높이(y)·길이(z) 둥근 상자, 가운데 기준
    const hw = w / 2 - bev, hh = h / 2 - bev, s = new THREE.Shape(); r = Math.min(r, hw, hh);
    s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r); s.lineTo(hw, hh - r); s.quadraticCurveTo(hw, hh, hw - r, hh); s.lineTo(-hw + r, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - r); s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    const geo = new THREE.ExtrudeGeometry(s, { depth: l - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 10 }); geo.center(); return geo;
  }
  // 몸통
  put(rbox(1.8, 0.78, 3.9, 0.34, 0.2), body, 0, 0.73, 0);
  put(rbox(1.72, 0.1, 3.7, 0.04, 0.03), black, 0, 0.36, 0);
  // 유리창 띠 + 지붕
  put(sph, glass, 0, 1.12, -0.25, 0.78, 0.46, 1.0);
  put(sph, body, 0, 1.34, -0.25, 0.7, 0.3, 0.9);
  // 지붕 줄무늬(흰색 + 노랑 테두리)
  const wedge = (a0, a1, mat) => { const geo = new THREE.SphereGeometry(1, 20, 14, a0, a1 - a0); geo.rotateX(Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.position.set(0, 1.34, -0.25); m.scale.set(0.706, 0.304, 0.91); g.add(m); };
  const up = Math.PI * 1.5; if (ST.stripe) { wedge(up - 0.21, up + 0.21, white); wedge(up - 0.3, up - 0.21, yellow); wedge(up + 0.21, up + 0.3, yellow); }
  // 보닛·트렁크 줄무늬
  if (ST.stripe) for (const [z0, z1] of [[0.72, 1.82], [-1.82, -1.3]]) { const L = z1 - z0, zc = (z0 + z1) / 2; put(new THREE.BoxGeometry(0.46, 0.012, L), white, 0, 1.126, zc); put(new THREE.BoxGeometry(0.07, 0.012, L), yellow, 0.265, 1.126, zc); put(new THREE.BoxGeometry(0.07, 0.012, L), yellow, -0.265, 1.126, zc); }
  // 얼굴: 눈(헤드라이트) · 웃는 입 · 노란 안개등
  for (const sx of [-1, 1]) {
    put(sph, white, sx * 0.52, 1.08, 1.66, 0.29, 0.31, 0.22, -0.25);
    put(sph, black, sx * 0.52, 1.1, 1.84, 0.14, 0.15, 0.07, -0.25); put(sph, white, sx * 0.55, 1.15, 1.9, 0.045, 0.045, 0.03);
    put(sph, yellow, sx * 0.72, 0.56, 1.86, 0.24, 0.11, 0.09);
    put(sph, yellow, sx * 1.0, 1.2, 0.55, 0.12, 0.15, 0.2); put(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8), black, sx * 0.93, 1.13, 0.55, 1, 1, 1, Math.PI / 2).rotation.z = Math.PI / 2;
    put(sph, tail, sx * 0.62, 0.86, -1.9, 0.22, 0.13, 0.07);
    put(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 14), silver, sx * 0.3, 0.46, -1.93, 1, 1, 1, Math.PI / 2);
  }
  const smile = new THREE.TorusGeometry(0.4, 0.045, 8, 28, Math.PI); smile.rotateZ(Math.PI); put(smile, black, 0, 0.74, 1.955);
  const mouth = new THREE.CircleGeometry(0.4, 28, Math.PI, Math.PI); put(mouth, black, 0, 0.74, 1.945);
  // 종류별 꾸미기
  const wing = (mat, w, y, z) => { put(rbox(w, 0.08, 0.55, 0.03, 0.03), mat, 0, y, z, 1, 1, 1, 0.12); for (const sx of [-1, 1]) put(new THREE.CylinderGeometry(0.04, 0.04, y - 1.1, 8), black, sx * w * 0.32, (y + 1.1) / 2 - 0.05, z + 0.02); };
  const cone = (r, h, mat, x, y, z, rx, rz) => { const m = put(new THREE.ConeGeometry(r, h, 18), mat, x, y, z); m.rotation.x = rx || 0; m.rotation.z = rz || 0; return m; };
  const cylx = (r, l, mat, x, y, z, ax) => { const m = put(new THREE.CylinderGeometry(r, r, l, 10), mat, x, y, z); if (ax === 'x') m.rotation.z = Math.PI / 2; if (ax === 'z') m.rotation.x = Math.PI / 2; return m; };
  const flower = (x, y, z, k) => { const pet = M(0xffffff, { roughness: 0.5 }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; put(sph, pet, x + Math.cos(a) * 0.2 * k, y, z + Math.sin(a) * 0.2 * k, 0.15 * k, 0.07 * k, 0.15 * k); } put(sph, M(0xffc928), x, y + 0.04 * k, z, 0.12 * k, 0.09 * k, 0.12 * k); };
  let hgt = 1.65, wid = 2.3;
  if (style === 'sport') { wing(yellow, 1.8, 1.56, -1.8); }
  else if (style === 'formula') {
    wing(yellow, 2.1, 1.78, -1.82); put(rbox(2.3, 0.06, 0.6, 0.02, 0.02), yellow, 0, 0.42, 2.02); for (const sx of [-1, 1]) put(new THREE.BoxGeometry(0.05, 0.24, 0.6), black, sx * 1.15, 0.5, 2.02);
    put(sph, white, 0, 1.58, 0.0, 0.05, 0.3, 0.55);
  } else if (style === 'wave') {
    put(sph, yellow, 0, 1.75, -0.65, 0.05, 0.42, 0.72).rotation.x = -0.45;
    for (const sx of [-1, 1]) { put(sph, yellow, sx * 0.9, 0.8, -0.1, 0.04, 0.12, 1.3); put(sph, yellow, sx * 0.9, 0.62, 0.4, 0.04, 0.08, 0.8); }
  } else if (style === 'buggy') {
    const gr = M(0x9aa6b3, { metalness: 0.7, roughness: 0.3 }); hgt = 2.2; wid = 2.6;
    for (const sx of [-1, 1]) for (const z of [0.45, -1.15]) cylx(0.045, 1.0, gr, sx * 0.8, 1.55, z);
    for (const sx of [-1, 1]) cylx(0.045, 1.6, gr, sx * 0.8, 2.05, -0.35, 'z');
    for (const z of [0.45, -1.15]) cylx(0.045, 1.6, gr, 0, 2.05, z, 'x');
    put(rbox(1.85, 0.1, 1.9, 0.04, 0.03), yellow, 0, 2.12, -0.35);
    cylx(0.07, 1.9, gr, 0, 0.58, 2.1, 'x'); for (const sx of [-1, 1]) cylx(0.05, 0.4, gr, sx * 0.7, 0.58, 2.0, 'z');
  } else if (style === 'flower') {
    flower(0, 1.66, -0.25, 1.3); flower(0.6, 1.16, 0.95, 0.8); flower(-0.6, 1.16, 0.95, 0.8); put(sph, yellow, -0.9, 1.1, -1.0, 0.16, 0.16, 0.16); put(sph, yellow, 0.9, 1.1, -1.0, 0.16, 0.16, 0.16);
  } else if (style === 'star') {
    const star = (k, y, z) => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.22 : 0.5; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2); put(geo, yellow, 0, y, z, k, k, k); };
    star(1.0, 1.62, -0.25); star(0.6, 1.14, 1.1); star(0.55, 1.14, -1.2);
  } else if (style === 'rocket') {
    cone(0.2, 0.55, yellow, 0, 1.92, -0.25); put(new THREE.BoxGeometry(0.06, 0.7, 0.9), yellow, 0, 1.55, -1.45).rotation.x = 0.3;
    for (const sx of [-1, 1]) { const f = put(new THREE.BoxGeometry(0.55, 0.06, 0.85), yellow, sx * 1.05, 0.85, -1.5); f.rotation.z = sx * 0.5; cylx(0.2, 0.5, silver, sx * 0.45, 0.88, -2.1, 'z'); cone(0.26, 0.3, M(0xff5a1f, { emissive: 0xff3a00, emissiveIntensity: 0.6 }), sx * 0.45, 0.88, -2.4, Math.PI / 2); }
  } else if (style === 'cloud') {
    const pf = M(0xffffff, { roughness: 0.85 });
    for (const [x, y, z, r] of [[0, 1.66, -0.25, 0.36], [0.4, 1.6, -0.05, 0.28], [-0.4, 1.6, -0.1, 0.28], [0.22, 1.6, -0.62, 0.26], [-0.22, 1.6, -0.62, 0.26]]) put(sph, pf, x, y, z, r, r * 0.85, r);
    for (const sx of [-1, 1]) { put(sph, pf, sx * 0.95, 0.95, 0.9, 0.2, 0.17, 0.2); put(sph, pf, sx * 0.95, 0.9, -0.9, 0.22, 0.18, 0.22); }
  } else if (style === 'knight') {
    cone(0.13, 0.5, yellow, 0, 2.0, -0.25); put(sph, yellow, 0, 1.68, -0.25, 0.3, 0.1, 0.5);
    wing(yellow, 1.6, 1.5, -1.8); for (const sx of [-1, 1]) { put(sph, yellow, sx * 0.98, 0.98, 1.25, 0.2, 0.17, 0.3); put(sph, yellow, sx * 0.98, 0.98, -1.25, 0.2, 0.17, 0.3); }
    for (let i = -1; i <= 1; i++) put(new THREE.BoxGeometry(0.06, 0.2, 0.05), yellow, i * 0.14, 0.52, 1.97);
  } else if (style === 'comet') {
    const t1 = cone(0.34, 1.9, yellow, 0, 1.7, -1.45, -Math.PI / 2 - 0.2); const t2 = cone(0.2, 1.5, M(0x6fe3ff), 0, 1.62, -1.55, -Math.PI / 2 - 0.2);
    put(sph, white, 0.35, 1.5, -2.55, 0.1, 0.1, 0.1); put(sph, M(0xff7eb6), -0.3, 1.65, -2.75, 0.1, 0.1, 0.1);
    wing(M(0xff7eb6), 1.7, 1.45, -1.78);
  }
  // 바퀴
  const wheels = [], WX = style === 'buggy' ? 1.14 : 1.0, WZ = 1.2, R = style === 'buggy' ? 0.52 : 0.42;
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], k) => {
    const steer = new THREE.Group(), spin = new THREE.Group(); steer.name = 'wh' + k + '_s'; spin.name = 'wh' + k + '_r'; steer.position.set(sx * WX, R, sz * WZ); steer.add(spin); g.add(steer);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.34, 28), black); tyre.rotation.z = Math.PI / 2; spin.add(tyre);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.05, 8, 28), black); edge.rotation.y = Math.PI / 2; edge.position.x = sx * 0.17; spin.add(edge);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 24), M(0x2b303a, { metalness: 0.6 })); disc.rotation.z = Math.PI / 2; disc.position.x = sx * 0.175; spin.add(disc);
    for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.27, 0.075), silver); sp.position.x = sx * 0.185; const a = (i / 5) * Math.PI * 2; const h = new THREE.Group(); h.rotation.x = a; sp.position.y = 0.135; h.add(sp); h.position.x = sx * 0.185; sp.position.x = 0; spin.add(h); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), silver); cap.position.x = sx * 0.19; spin.add(cap);
    wheels.push({ s: steer.name, r: spin.name, front: sz > 0 });
  });
  return { group: g, wheels, len: 3.95, wid, hgt };
}
export const TOY_COLORS = [[0xe5392d, '빨강'], [0x3d8bff, '파랑'], [0x39c46a, '초록'], [0xff8a3d, '주황'], [0x9b5de5, '보라'], [0xff7eb6, '분홍'], [0xf2c100, '노랑'], [0x5fd3b3, '민트'], [0x2b4a8c, '남색'], [0xf0b98d, '살구']];
