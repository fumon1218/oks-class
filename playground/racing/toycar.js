/* 카툰 장난감 스포츠카(코드로 만든 3D 모델). 앞은 +z, 바닥은 y=0. 색(bodyColor)만 바꿔서 여러 대를 만들 수 있어요.
   바퀴는 wh0~3 (_s: 방향 돌리기, _r: 구르기) 이름의 묶음이라 게임에서 돌아가요. */
export function buildToyCar(THREE, bodyColor) {
  const g = new THREE.Group();
  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.3, metalness: 0.1 }, o || {}));
  const body = M(bodyColor, { roughness: 0.2, metalness: 0.15 }), white = M(0xffffff, { roughness: 0.35 }), yellow = M(0xffc928, { roughness: 0.3 }), black = M(0x14161b, { roughness: 0.7 }),
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
  const up = Math.PI * 1.5; wedge(up - 0.21, up + 0.21, white); wedge(up - 0.3, up - 0.21, yellow); wedge(up + 0.21, up + 0.3, yellow);
  // 보닛·트렁크 줄무늬
  for (const [z0, z1] of [[0.72, 1.82], [-1.82, -1.3]]) { const L = z1 - z0, zc = (z0 + z1) / 2; put(new THREE.BoxGeometry(0.46, 0.012, L), white, 0, 1.126, zc); put(new THREE.BoxGeometry(0.07, 0.012, L), yellow, 0.265, 1.126, zc); put(new THREE.BoxGeometry(0.07, 0.012, L), yellow, -0.265, 1.126, zc); }
  // 얼굴: 눈(헤드라이트) · 웃는 입 · 노란 안개등
  for (const sx of [-1, 1]) {
    put(sph, white, sx * 0.52, 1.08, 1.66, 0.29, 0.31, 0.22, -0.25);
    put(sph, black, sx * 0.52, 1.1, 1.84, 0.14, 0.15, 0.07, -0.25); put(sph, white, sx * 0.55, 1.15, 1.9, 0.045, 0.045, 0.03);
    put(sph, yellow, sx * 0.72, 0.56, 1.86, 0.24, 0.11, 0.09);
    put(sph, yellow, sx * 1.0, 1.2, 0.55, 0.12, 0.15, 0.2); put(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8), black, sx * 0.93, 1.13, 0.55, 1, 1, 1, Math.PI / 2).rotation.z = Math.PI / 2;
    put(sph, tail, sx * 0.62, 0.86, -1.9, 0.22, 0.13, 0.07);
    put(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 14), silver, sx * 0.3, 0.46, -1.93, 1, 1, 1, Math.PI / 2);
    put(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), yellow, sx * 0.62, 1.33, -1.78);
  }
  const smile = new THREE.TorusGeometry(0.4, 0.045, 8, 28, Math.PI); smile.rotateZ(Math.PI); put(smile, black, 0, 0.74, 1.955);
  const mouth = new THREE.CircleGeometry(0.4, 28, Math.PI, Math.PI); put(mouth, black, 0, 0.74, 1.945);
  // 뒷날개
  put(rbox(1.8, 0.08, 0.55, 0.03, 0.03), yellow, 0, 1.56, -1.8, 1, 1, 1, 0.12);
  put(rbox(0.1, 0.34, 0.1, 0.03, 0.02), yellow, -0.9, 1.56, -1.78).scale.set(1, 1, 1);
  // 바퀴
  const wheels = [], WX = 1.0, WZ = 1.2, R = 0.42;
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], k) => {
    const steer = new THREE.Group(), spin = new THREE.Group(); steer.name = 'wh' + k + '_s'; spin.name = 'wh' + k + '_r'; steer.position.set(sx * WX, R, sz * WZ); steer.add(spin); g.add(steer);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.34, 28), black); tyre.rotation.z = Math.PI / 2; spin.add(tyre);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.05, 8, 28), black); edge.rotation.y = Math.PI / 2; edge.position.x = sx * 0.17; spin.add(edge);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 24), M(0x2b303a, { metalness: 0.6 })); disc.rotation.z = Math.PI / 2; disc.position.x = sx * 0.175; spin.add(disc);
    for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.27, 0.075), silver); sp.position.x = sx * 0.185; const a = (i / 5) * Math.PI * 2; const h = new THREE.Group(); h.rotation.x = a; sp.position.y = 0.135; h.add(sp); h.position.x = sx * 0.185; sp.position.x = 0; spin.add(h); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), silver); cap.position.x = sx * 0.19; spin.add(cap);
    wheels.push({ s: steer.name, r: spin.name, front: sz > 0 });
  });
  return { group: g, wheels, len: 3.95, wid: 2.3, hgt: 1.65 };
}
export const TOY_COLORS = [[0xe5392d, '빨강'], [0x3d8bff, '파랑'], [0x39c46a, '초록'], [0xff8a3d, '주황'], [0x9b5de5, '보라'], [0xff7eb6, '분홍']];
