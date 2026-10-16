/* 자동차 색칠 도안: 도안 만들기(3D 모델 → 윤곽선 A4) + 색칠한 사진 읽기(표식 4개로 바로잡기) + 차체에 입히기.
   레이싱 게임(racing.js)과 미술 도안 학습지(art/cartemplate)가 같은 약속(레이아웃)을 쓰기 때문에,
   학습지에서 받은 도안을 색칠해 게임에 올리면 똑같은 자리에 그림이 입혀져요. */

/* ---- 용지 약속: A4(210×297mm). 표식 4개의 가운데를 이은 사각형(186×273mm)이 "도안 판"이에요 ---- */
export const SHEET = {
  pageW: 210, pageH: 297, px: 1240 / 210,          // 용지 그림 크기 1240×1754 (150dpi)
  m0: 12, m1x: 198, m1y: 285,                       // 표식 가운데 좌표(mm)
  areaW: 186, areaH: 273,                           // 도안 판 크기(mm)
  atlasW: 960,                                      // 업로드 후 보정 이미지 가로(px)
  mark: 7, markBig: 10,                             // 표식 한 변(mm). 왼쪽 위만 크게 → 사진을 돌려 찍어도 알아봐요
};
SHEET.atlasH = Math.round(SHEET.atlasW * SHEET.areaH / SHEET.areaW);
/* 도안 판 안에서의 칸(mm, 판의 왼쪽 위가 0,0) */
export const RECTS = { side: [6, 34, 174, 80], top: [6, 123, 174, 72], front: [14, 205, 84, 60] };

/* ---- 차 상자(bbox) 기준으로 각 방향 그림의 위치·배율 계산 ---- */
function fit(rect, bw, bh) { const s = Math.min(rect[2] / bw, rect[3] / bh) * 0.94; return { s, cx: rect[0] + rect[2] / 2, cy: rect[1] + rect[3] / 2 }; }
export function layout(box) {   // box: {min:[x,y,z], max:[x,y,z]}
  const W = box.max[0] - box.min[0], H = box.max[1] - box.min[1], L = box.max[2] - box.min[2];
  return {
    c: [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2], W, H, L,
    side: fit(RECTS.side, L, H), top: fit(RECTS.top, L, W), front: fit(RECTS.front, W, H),
  };
}
/* 점(x,y,z) → 도안 판 위 위치(mm). 옆: 앞이 오른쪽 / 위: 앞이 오른쪽(차의 왼쪽이 위) / 앞: 마주 본 모습 */
export function toSide(lo, x, y, z) { return [lo.side.cx + (z - lo.c[2]) * lo.side.s, lo.side.cy - (y - lo.c[1]) * lo.side.s]; }
export function toTop(lo, x, y, z) { return [lo.top.cx + (z - lo.c[2]) * lo.top.s, lo.top.cy - (x - lo.c[0]) * lo.top.s]; }
export function toFront(lo, x, y, z) { return [lo.front.cx + (x - lo.c[0]) * lo.front.s, lo.front.cy - (y - lo.c[1]) * lo.front.s]; }

export function boxOf(THREE, model) {
  model.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(model);
  return { min: b.min.toArray().map((v) => +v.toFixed(4)), max: b.max.toArray().map((v) => +v.toFixed(4)) };
}

/* ---- 도안 그리기: 3D 모델을 위·옆·앞에서 찍어 윤곽선만 남겨요 ---- */
let _rr = null;
function renderer(THREE, w, h) {
  if (!_rr) { _rr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); _rr.setClearColor(0xffffff, 0); }
  _rr.setPixelRatio(1); _rr.setSize(w, h, false); return _rr;
}
function lineArt(THREE, model, view, lo, rect) {
  const S = 2, mm = SHEET.px, w = Math.round(rect[2] * mm * S), h = Math.round(rect[3] * mm * S);
  const sc = lo[view].s;                                   // 1m = sc mm
  const halfW = rect[2] / sc / 2, halfH = rect[3] / sc / 2;
  const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.01, 200);
  const c = lo.c, D = 40;
  if (view === 'side') { cam.position.set(c[0] - D, c[1], c[2]); cam.up.set(0, 1, 0); }
  else if (view === 'top') { cam.position.set(c[0], c[1] + D, c[2]); cam.up.set(1, 0, 0); }
  else { cam.position.set(c[0], c[1], c[2] + D); cam.up.set(0, 1, 0); }
  cam.lookAt(c[0], c[1], c[2]); cam.updateMatrixWorld(true);
  // 법선(면의 방향) 색으로 찍고, 색이 확 바뀌는 곳을 선으로 따요 → 매끈한 공 모양도, 접힌 곳도 이어진 선이 돼요
  const scene = new THREE.Scene(), nm = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  model.updateMatrixWorld(true);
  model.traverse((o) => { if (!o.isMesh || !o.geometry) return; const m = new THREE.Mesh(o.geometry, nm); m.matrixAutoUpdate = false; m.matrix.copy(o.matrixWorld); scene.add(m); });
  const r = renderer(THREE, w, h); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam);
  const rc = document.createElement('canvas'); rc.width = w; rc.height = h; const rg = rc.getContext('2d', { willReadFrequently: true }); rg.drawImage(r.domElement, 0, 0, w, h);
  const d = rg.getImageData(0, 0, w, h).data, n = w * h, ln = new Uint8Array(n), sil = new Uint8Array(n);
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const i = y * w + x, o = i * 4, ar = d[o + 3] > 100;
    const rt = o + 4, dn = o + w * 4;
    if (ar !== (d[rt + 3] > 100)) { sil[i] = 1; sil[i + 1] = 1; } if (ar !== (d[dn + 3] > 100)) { sil[i] = 1; sil[i + w] = 1; }
    if (ar && d[rt + 3] > 100 && Math.abs(d[o] - d[rt]) + Math.abs(d[o + 1] - d[rt + 1]) + Math.abs(d[o + 2] - d[rt + 2]) > 70) ln[i] = 1;
    if (ar && d[dn + 3] > 100 && Math.abs(d[o] - d[dn]) + Math.abs(d[o + 1] - d[dn + 1]) + Math.abs(d[o + 2] - d[dn + 2]) > 70) ln[i] = 1;
  }
  const out = document.createElement('canvas'); out.width = w; out.height = h; const og = out.getContext('2d'), od = og.createImageData(w, h), q = od.data;
  const grow = (src, rad) => { const dst = new Uint8Array(src); for (let y = rad; y < h - rad; y++) for (let x = rad; x < w - rad; x++) { const i = y * w + x; if (src[i]) { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) dst[i + dy * w + dx] = 1; } } return dst; };
  const L1 = grow(ln, 1), S1 = grow(sil, 3);
  for (let i = 0; i < n; i++) if (L1[i] || S1[i]) { q[i * 4] = 17; q[i * 4 + 1] = 17; q[i * 4 + 2] = 17; q[i * 4 + 3] = 255; }
  og.putImageData(od, 0, 0);
  return out;
}
/* 큰 선 그림을 용지 크기로 줄이고, 흐릿한 가장자리를 또렷하게 */
function inkify(src, outW, outH) {
  const cv = document.createElement('canvas'); cv.width = outW; cv.height = outH; const g = cv.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, outW, outH);
  const im = g.getImageData(0, 0, outW, outH), d = im.data, n = outW * outH;
  for (let i = 0; i < n; i++) { const o = i * 4, a = d[o + 3]; if (a > 80) { d[o] = d[o + 1] = d[o + 2] = 17; d[o + 3] = 255; } else { d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = 255; } }
  g.putImageData(im, 0, 0);
  return cv;
}

function markPath(g, cx, cy, size, s) { const h = size * s / 2; g.fillRect(cx * s - h, cy * s - h, h * 2, h * 2); }
/* A4 도안 한 장 (그림: 1240×1754). opt: { title, sub, name } */
export function renderSheet(THREE, model, box, opt) {
  opt = opt || {};
  const S = SHEET, s = S.px, lo = layout(box);
  const cv = document.createElement('canvas'); cv.width = Math.round(S.pageW * s); cv.height = Math.round(S.pageH * s);
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  const ox = S.m0, oy = S.m0;     // 도안 판 왼쪽 위(mm, 용지 기준)
  // 표식
  g.fillStyle = '#000';
  markPath(g, ox, oy, S.markBig, s); markPath(g, S.m1x, oy, S.mark, s); markPath(g, S.m1x, S.m1y, S.mark, s); markPath(g, ox, S.m1y, S.mark, s);
  // 머리글
  g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = '800 ' + Math.round(8.2 * s) + 'px "Jua","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
  g.fillText((opt.title || '내가 만드는 자동차'), (ox + S.areaW / 2) * s, (oy + 13) * s);
  g.font = '500 ' + Math.round(3.6 * s) + 'px "Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif'; g.fillStyle = '#444';
  g.fillText(opt.sub || '색연필·사인펜으로 곱게 칠해 보세요. 칠한 도안은 사진을 찍어 게임에 올려요.', (ox + S.areaW / 2) * s, (oy + 20.5) * s);
  // 그림 3장
  const place = (view, label, extra) => {
    const rect = RECTS[view], raw = lineArt(THREE, model, view, lo, rect), w = Math.round(rect[2] * s), h = Math.round(rect[3] * s), ink = inkify(raw, w, h);
    g.drawImage(ink, (ox + rect[0]) * s, (oy + rect[1]) * s);
    g.fillStyle = '#6b6b6b'; g.textAlign = 'left'; g.font = '700 ' + Math.round(3.4 * s) + 'px "Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
    g.fillText(label, (ox + rect[0] + 1) * s, (oy + rect[1] - 1.5) * s);
  };
  place('side', '① 옆모습 (양쪽 옆이 똑같이 칠해져요)'); place('top', '② 위에서 본 모습 (앞이 오른쪽 · 지붕·보닛·트렁크)'); place('front', '③ 앞모습 (뒤쪽도 같이 칠해져요)');
  // 안내 글(오른쪽 아래 칸)
  const tx = ox + 104, ty = oy + 206; g.fillStyle = '#222'; g.textAlign = 'left';
  g.font = '800 ' + Math.round(4.2 * s) + 'px "Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif'; g.fillText('칠하는 약속', tx * s, ty * s);
  g.font = '500 ' + Math.round(3.5 * s) + 'px "Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
  ['• 하얀 곳은 게임에서 차 색깔이 돼요.', '• 바퀴·유리창은 그대로 두고 칠하지 않아요.', '• 선 밖으로 나가도 괜찮아요!', '• 세 그림을 서로 어울리게 칠해요.', '• 네 모서리 까만 네모는 가리지 마세요.'].forEach((t, i) => g.fillText(t, tx * s, (ty + 6.6 + i * 5.4) * s));
  // 이름·날짜
  g.font = '700 ' + Math.round(3.8 * s) + 'px "Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif'; g.fillStyle = '#222';
  g.fillText('내 차 이름', tx * s, (ty + 40) * s); g.fillText('이름', (tx + 40) * s, (ty + 40) * s);
  g.strokeStyle = '#999'; g.lineWidth = 1.5; g.beginPath(); g.moveTo((tx + 21) * s, (ty + 40.5) * s); g.lineTo((tx + 38) * s, (ty + 40.5) * s); g.moveTo((tx + 49) * s, (ty + 40.5) * s); g.lineTo((tx + 70) * s, (ty + 40.5) * s); g.stroke();
  return cv;
}

/* ---- 칠한 사진 읽기 ---- */
function gray(d, n) { const a = new Uint8ClampedArray(n); for (let i = 0; i < n; i++) a[i] = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8; return a; }
function findMarks(img) {
  const maxD = 900, k = Math.min(1, maxD / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, n = w * h, gr = gray(d, n);
  // 종이 밝기에 맞춰 문턱을 정해요(그늘진 사진도 괜찮게)
  const hist = new Uint32Array(256); for (let i = 0; i < n; i += 7) hist[gr[i]]++; let acc = 0, paper = 200; for (let v = 255; v >= 0; v--) { acc += hist[v] * 7; if (acc > n * 0.12) { paper = v; break; } }
  const thr = Math.max(40, Math.min(110, paper * 0.38));
  const lab = new Int32Array(n), comps = [];
  for (let s0 = 0; s0 < n; s0++) {
    if (lab[s0] || gr[s0] > thr) continue; const id = comps.length + 1, st = [s0]; lab[s0] = id; let a = 0, sx = 0, sy = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
    while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; a++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && !lab[p - 1] && gr[p - 1] <= thr) { lab[p - 1] = id; st.push(p - 1); } if (x < w - 1 && !lab[p + 1] && gr[p + 1] <= thr) { lab[p + 1] = id; st.push(p + 1); }
      if (y > 0 && !lab[p - w] && gr[p - w] <= thr) { lab[p - w] = id; st.push(p - w); } if (y < h - 1 && !lab[p + w] && gr[p + w] <= thr) { lab[p + w] = id; st.push(p + w); } }
    comps.push({ a, cx: sx / a, cy: sy / a, bw: x1 - x0 + 1, bh: y1 - y0 + 1 });
  }
  const cand = comps.filter((c) => { const r = c.bw / c.bh, fill = c.a / (c.bw * c.bh); return c.a > n * 0.00012 && c.a < n * 0.012 && r > 0.6 && r < 1.65 && fill > 0.78; });
  const out = [[0, 0], [w, 0], [w, h], [0, h]].map((q) => { let best = null, bd = 1e9; cand.forEach((c) => { const dd = Math.hypot(c.cx - q[0], c.cy - q[1]); if (dd < bd && dd < Math.hypot(w, h) * 0.34) { bd = dd; best = c; } }); return best; });
  if (out.some((o) => !o) || new Set(out).size < 4) return null;
  const big = out.reduce((bi, c, i) => (c.a > out[bi].a ? i : bi), 0);        // 가장 큰 표식이 도안의 왼쪽 위
  const rot = out.slice(big).concat(out.slice(0, big));
  return rot.map((c) => [c.cx / k, c.cy / k]);
}
function homography(dst, src) {   // dst(도안 판 좌표) → src(사진 좌표)
  const A = [], B = [];
  for (let i = 0; i < 4; i++) { const [x, y] = dst[i], [u, v] = src[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
  const M = A.map((r, i) => r.concat(B[i]));
  for (let c = 0; c < 8; c++) { let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 9; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[8] / r[i]);
}
/* img: 사진/스캔. 결과: { canvas(도안 판 보정 그림, 칠하지 않은 곳은 투명), found(표식을 찾았는지) } */
export function readDesign(img) {
  const S = SHEET, W = S.atlasW, H = S.atlasH, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const src = document.createElement('canvas'); src.width = iw; src.height = ih; const sg = src.getContext('2d', { willReadFrequently: true }); sg.drawImage(img, 0, 0);
  const sd = sg.getImageData(0, 0, iw, ih).data;
  let marks = null; try { marks = findMarks(src); } catch (e) { marks = null; }
  // 못 찾으면 사진이 A4 한 장 전체라고 가정해요
  const found = !!marks;
  if (!marks) { const fx = S.m0 / S.pageW, fy = S.m0 / S.pageH, gx = S.m1x / S.pageW, gy = S.m1y / S.pageH; marks = [[fx * iw, fy * ih], [gx * iw, fy * ih], [gx * iw, gy * ih], [fx * iw, gy * ih]]; }
  const Hm = homography([[0, 0], [W, 0], [W, H], [0, H]], marks);
  const out = document.createElement('canvas'); out.width = W; out.height = H; const og = out.getContext('2d'), od = og.createImageData(W, H), o = od.data;
  const lineMask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const den = Hm[6] * x + Hm[7] * y + 1, u = (Hm[0] * x + Hm[1] * y + Hm[2]) / den, v = (Hm[3] * x + Hm[4] * y + Hm[5]) / den, i = (y * W + x) * 4;
    if (u < 0 || v < 0 || u >= iw - 1 || v >= ih - 1) continue;
    const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0, a = (y0 * iw + x0) * 4, b = a + 4, c = a + iw * 4, e = c + 4;
    let r = 0, gg = 0, bb = 0; for (let ch = 0; ch < 3; ch++) { const val = (sd[a + ch] * (1 - fx) + sd[b + ch] * fx) * (1 - fy) + (sd[c + ch] * (1 - fx) + sd[e + ch] * fx) * fy; if (ch === 0) r = val; else if (ch === 1) gg = val; else bb = val; }
    o[i] = r; o[i + 1] = gg; o[i + 2] = bb; o[i + 3] = 255;
  }
  // 종이 흰색 맞추기: 가장자리가 아닌 곳의 밝은 쪽 값을 흰색으로
  const hist = new Uint32Array(256); for (let i = 0; i < W * H; i += 5) { const q = i * 4; hist[Math.max(o[q], o[q + 1], o[q + 2])]++; }
  let acc = 0, wp = 255; for (let v = 255; v >= 0; v--) { acc += hist[v] * 5; if (acc > W * H * 0.18) { wp = Math.max(v, 120); break; } }
  const kf = 255 / wp;
  for (let i = 0; i < W * H; i++) {
    const q = i * 4; if (!o[q + 3]) continue;
    let r = Math.min(255, o[q] * kf), g2 = Math.min(255, o[q + 1] * kf), b = Math.min(255, o[q + 2] * kf);
    const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), ch = mx - mn, lum = (r * 77 + g2 * 150 + b * 29) >> 8;
    let al = 255;
    if (ch < 34) { if (lum > 214) al = 0; else if (lum < 105) { al = 0; lineMask[i] = 1; } else if (lum > 170) al = Math.round((214 - lum) / 44 * 255); }
    else if (lum > 236 && ch < 50) al = 0;
    if (ch >= 34) { // 색을 또렷하게(사진은 칙칙하게 찍혀요)
      const m = (r + g2 + b) / 3, boost = 1.28; r = Math.max(0, Math.min(255, m + (r - m) * boost)); g2 = Math.max(0, Math.min(255, m + (g2 - m) * boost)); b = Math.max(0, Math.min(255, m + (b - m) * boost));
    }
    o[q] = r; o[q + 1] = g2; o[q + 2] = b; o[q + 3] = al;
  }
  // 검은 선 자리는 이웃 색으로 메워요(선이 차에 그대로 나오지 않게)
  for (let pass = 0; pass < 4; pass++) {
    const nm = new Uint8Array(lineMask);
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const i = y * W + x; if (!lineMask[i]) continue; let sr = 0, sg2 = 0, sb = 0, sn = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const j = i + dy * W + dx; if (!lineMask[j] && o[j * 4 + 3] > 200) { sr += o[j * 4]; sg2 += o[j * 4 + 1]; sb += o[j * 4 + 2]; sn++; } }
      if (sn >= 3) { const q = i * 4; o[q] = sr / sn; o[q + 1] = sg2 / sn; o[q + 2] = sb / sn; o[q + 3] = 255; nm[i] = 0; }
    }
    lineMask.set(nm);
  }
  for (let i = 0; i < W * H; i++) if (lineMask[i]) o[i * 4 + 3] = 0;
  // 크레용 결: 작은 빈틈은 이웃 색으로 메우고, 칠한 곳 색은 살짝 부드럽게 해요(하얀 점·줄이 차에 지저분하게 남지 않게)
  {
    const N = W * H, R = 6, pa = new Float32Array(N), ch = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    for (let i = 0; i < N; i++) { const q = i * 4, a2 = o[q + 3] / 255; pa[i] = a2; ch[0][i] = o[q] * a2; ch[1][i] = o[q + 1] * a2; ch[2][i] = o[q + 2] * a2; }
    const box = (src) => { // 가로·세로 상자 흐림 두 번(부드러운 종 모양)
      let cur = src;
      for (let pass = 0; pass < 2; pass++) {
        const tmp = new Float32Array(N), out = new Float32Array(N), w2 = 2 * R + 1;
        for (let y = 0; y < H; y++) { let sum = 0; const b = y * W; for (let x = -R; x <= R; x++) sum += cur[b + Math.min(W - 1, Math.max(0, x))];
          for (let x = 0; x < W; x++) { tmp[b + x] = sum / w2; sum += cur[b + Math.min(W - 1, x + R + 1)] - cur[b + Math.max(0, x - R)]; } }
        for (let x = 0; x < W; x++) { let sum = 0; for (let y = -R; y <= R; y++) sum += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
          for (let y = 0; y < H; y++) { out[y * W + x] = sum / w2; sum += tmp[Math.min(H - 1, y + R + 1) * W + x] - tmp[Math.max(0, y - R) * W + x]; } }
        cur = out;
      }
      return cur;
    };
    const ba = box(pa), b0 = box(ch[0]), b1 = box(ch[1]), b2 = box(ch[2]);
    for (let i = 0; i < N; i++) {
      const q = i * 4, c = ba[i], t = Math.max(0, Math.min(1, (c - 0.26) / 0.26));
      if (t <= 0) { o[q + 3] = 0; continue; }
      o[q] = b0[i] / c; o[q + 1] = b1[i] / c; o[q + 2] = b2[i] / c; o[q + 3] = Math.round(t * 255);
    }
  }
  // 가장자리 6칸은 지워요(표식·종이 그림자)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 6 || y < 6 || x >= W - 6 || y >= H - 6) o[(y * W + x) * 4 + 3] = 0;
  og.putImageData(od, 0, 0);
  // 표식 주변(네 모서리 12mm)은 비워요
  const px = W / S.areaW; og.globalCompositeOperation = 'destination-out'; og.fillStyle = '#000';
  [[0, 0], [S.areaW, 0], [S.areaW, S.areaH], [0, S.areaH]].forEach(([cx, cy]) => og.fillRect(cx * px - 9 * px, cy * px - 9 * px, 18 * px, 18 * px));
  og.globalCompositeOperation = 'source-over';
  // 칠한 정도(투명하지 않은 칸 비율) — 아무것도 안 칠했는지 알려 주려고
  const dd = og.getImageData(0, 0, W, H).data; let filled = 0; for (let i = 3; i < dd.length; i += 16) if (dd[i] > 128) filled++;
  return { canvas: out, found, filled: filled / (dd.length / 16) };
}

/* ---- 차체에 입히기 ---- */
export const BODY_NAME = 'carbody';
export function applyDesign(THREE, model, matNames, box, atlas, whiteBase) {
  const lo = layout(box), S = SHEET, tex = atlas.isTexture ? atlas : (() => { const t = new THREE.CanvasTexture(atlas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; })();
  const names = new Set(matNames); let n = 0; model.updateMatrixWorld(true);
  // 세 방향(옆·위·앞) 그림을 면의 방향에 따라 부드럽게 섞어 입혀요(면마다 뚝 끊기지 않게 셰이더에서 섞어요)
  const U = {
    dCen: { value: new THREE.Vector3(lo.c[0], lo.c[1], lo.c[2]) }, dArea: { value: new THREE.Vector2(S.areaW, S.areaH) },
    dSide: { value: new THREE.Vector3(lo.side.cx, lo.side.cy, lo.side.s) }, dTop: { value: new THREE.Vector3(lo.top.cx, lo.top.cy, lo.top.s) }, dFront: { value: new THREE.Vector3(lo.front.cx, lo.front.cy, lo.front.s) },
  };
  const nm3 = new THREE.Matrix3(), v = new THREE.Vector3();
  model.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (!mats.some((m) => names.has(m.name)) || mats.length > 1) return;   // 여러 재질이 섞인 덩어리는 건드리지 않아요
    const geo = o.geometry.clone(), pos = geo.attributes.position, cnt = pos.count;
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const nor = geo.attributes.normal, dp = new Float32Array(cnt * 3), dn = new Float32Array(cnt * 3); nm3.getNormalMatrix(o.matrixWorld);
    for (let k = 0; k < cnt; k++) {
      v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld); dp[k * 3] = v.x; dp[k * 3 + 1] = v.y; dp[k * 3 + 2] = v.z;
      v.fromBufferAttribute(nor, k).applyMatrix3(nm3).normalize(); dn[k * 3] = v.x; dn[k * 3 + 1] = v.y; dn[k * 3 + 2] = v.z;
    }
    geo.setAttribute('dpos', new THREE.BufferAttribute(dp, 3)); geo.setAttribute('dnor', new THREE.BufferAttribute(dn, 3));
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(cnt * 2), 2));
    o.geometry = geo;
    const fix = (m) => {
      if (!names.has(m.name)) return m; const nm = m.clone(); nm.map = tex; nm.userData.design = 1; nm.name = m.name; if (whiteBase) nm.color.set(0xffffff);
      nm.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 dpos;\nattribute vec3 dnor;\nvarying vec3 vDp;\nvarying vec3 vDn;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDp = dpos; vDn = dnor;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vDp;\nvarying vec3 vDn;\nuniform vec3 dCen;\nuniform vec2 dArea;\nuniform vec3 dSide;\nuniform vec3 dTop;\nuniform vec3 dFront;')
          .replace('#include <map_fragment>', `
          vec3 dq = vDp - dCen; vec3 dw = pow( abs( normalize( vDn ) ), vec3( 5.0 ) ); dw /= ( dw.x + dw.y + dw.z + 1e-5 );
          vec2 uS = vec2( dSide.x + dq.z * dSide.z, dSide.y - dq.y * dSide.z ) / dArea;
          vec2 uT = vec2( dTop.x + dq.z * dTop.z, dTop.y - dq.x * dTop.z ) / dArea;
          vec2 uF = vec2( dFront.x + dq.x * dFront.z, dFront.y - dq.y * dFront.z ) / dArea;
          vec4 sS = texture2D( map, vec2( uS.x, 1.0 - uS.y ) ); vec4 sT = texture2D( map, vec2( uT.x, 1.0 - uT.y ) ); vec4 sF = texture2D( map, vec2( uF.x, 1.0 - uF.y ) );
          float dA = sS.a * dw.x + sT.a * dw.y + sF.a * dw.z;
          vec3 dC = ( sS.rgb * sS.a * dw.x + sT.rgb * sT.a * dw.y + sF.rgb * sF.a * dw.z ) / max( dA, 1e-4 );
          diffuseColor.rgb = mix( diffuseColor.rgb, dC, dA );`);
      };
      nm.customProgramCacheKey = () => 'cardesign3' + (whiteBase ? 'w' : 'c'); nm.needsUpdate = true; return nm;
    };
    o.material = Array.isArray(o.material) ? o.material.map(fix) : fix(o.material); n++;
  });
  return n;
}

/* ---- 내 도안 보관(IndexedDB) ---- */
const DB = 'oks-racing-design';
function idb() { return new Promise((res, rej) => { const rq = indexedDB.open(DB, 1); rq.onupgradeneeded = () => rq.result.createObjectStore('d'); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); }
export async function saveDesign(id, canvas) { try { const blob = await new Promise((r) => canvas.toBlob(r, 'image/png')); const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('d', 'readwrite'); tx.objectStore('d').put(blob, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); return true; } catch (e) { return false; } }
export async function loadDesign(id) { try { const db = await idb(); const blob = await new Promise((res, rej) => { const rq = db.transaction('d').objectStore('d').get(id); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); if (!blob) return null; const im = await createImageBitmap(blob); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0); return cv; } catch (e) { return null; } }
export async function deleteDesign(id) { try { const db = await idb(); await new Promise((res) => { const tx = db.transaction('d', 'readwrite'); tx.objectStore('d').delete(id); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { /* 없어도 괜찮아요 */ } }
export async function listDesigns() { try { const db = await idb(); return await new Promise((res) => { const rq = db.transaction('d').objectStore('d').getAllKeys(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]); }); } catch (e) { return []; } }
