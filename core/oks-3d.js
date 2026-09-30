/* 옥쌤의 즐거운 교실 — 가벼운 3D 보기 (외부 라이브러리 없이 WebGL로 직접)
   scripts/import_3d.py 로 줄인 GLB(한 덩어리 모델 + 기본 색 질감)를 그립니다.
   캔버스 하나로 여러 모델을 각자 자리(HTML 요소 위치)에 그려요.
   사용:
     var v = OKS3D.view(canvas, hostEl);            // hostEl: 캔버스가 덮는 영역(좌표 기준)
     v.add(url, el, { spin: .25, tilt: .38 });      // el 자리에 모델을 그림. 불러오면 el 에 'is-3d' 클래스
     v.stop(); v.start(); v.clear();                // 멈춤 / 다시 / 모두 지우기
     OKS3D.open(url, { title: '바다별' });           // 크게 보기 창 (돌리기·확대·축소·옮기기)
     OKS3D.ok()                                     // 이 기기에서 3D를 켜도 되는지 */
(function (global) {
  'use strict';
  var cache = {};   // url → Promise(모델 자료)

  function ok() {
    try {
      if (global.OKS && global.OKS.settings && global.OKS.settings().calm) return false;
      if (global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  }

  /* ---------- GLB 읽기 ---------- */
  var NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  var TA = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  function parse(buf) {
    var dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('GLB 아님');
    var jl = dv.getUint32(12, true);
    var j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
    var bo = 20 + jl + 8, bl = dv.getUint32(20 + jl, true);
    function view(i) { var v = j.bufferViews[i]; return { off: bo + (v.byteOffset || 0), len: v.byteLength, stride: v.byteStride || 0 }; }
    function acc(i) {
      var a = j.accessors[i], v = view(a.bufferView), T = TA[a.componentType], n = NC[a.type];
      var size = T.BYTES_PER_ELEMENT * n, stride = v.stride || size;
      return { raw: new Uint8Array(buf, v.off + (a.byteOffset || 0), stride * (a.count - 1) + size), type: a.componentType, n: n, stride: stride, norm: !!a.normalized, count: a.count, T: T };
    }
    var node = (j.nodes || []).filter(function (n) { return n.mesh != null; })[0] || { mesh: 0 };
    var p = j.meshes[node.mesh].primitives[0];
    var out = { pos: acc(p.attributes.POSITION), nrm: p.attributes.NORMAL != null ? acc(p.attributes.NORMAL) : null,
      uv: p.attributes.TEXCOORD_0 != null ? acc(p.attributes.TEXCOORD_0) : null, idx: acc(p.indices),
      scale: (node.scale || [1, 1, 1])[0] };
    var mat = j.materials && j.materials[p.material], t = mat && mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture;
    if (t) { var im = j.images[j.textures[t.index].source], iv = view(im.bufferView); out.img = new Blob([new Uint8Array(buf, iv.off, iv.len)], { type: im.mimeType || 'image/jpeg' }); }
    return out;
  }
  function load(url) {
    if (!cache[url]) cache[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (b) {
      var m = parse(b);
      if (!m.img) return m;
      return new Promise(function (res) {
        var im = new Image(); im.onload = function () { m.image = im; res(m); }; im.onerror = function () { res(m); };
        im.src = URL.createObjectURL(m.img);
      });
    });
    return cache[url];
  }

  /* ---------- 작은 행렬 도구 ---------- */
  function persp(f, a, n, fa) { var t = 1 / Math.tan(f / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]; }
  function mul(a, b) { var o = new Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
  function rotY(r) { var c = Math.cos(r), s = Math.sin(r); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function rotX(r) { var c = Math.cos(r), s = Math.sin(r); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  function trans(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }

  var VS = 'attribute vec3 aP;attribute vec3 aN;attribute vec2 aU;uniform mat4 uM;uniform mat4 uVP;uniform float uS;varying vec3 vN;varying vec2 vU;varying float vY;' +
    'void main(){vec4 w=uM*vec4(aP*uS,1.0);vN=normalize((uM*vec4(aN,0.0)).xyz);vU=aU;vY=aP.y*uS;gl_Position=uVP*w;}';
  var FS = 'precision mediump float;uniform sampler2D uT;uniform float uHas;uniform vec3 uGlow;uniform float uHi;varying vec3 vN;varying vec2 vU;varying float vY;' +
    'void main(){vec3 n=normalize(vN);vec3 base=mix(vec3(0.85),texture2D(uT,vU).rgb,uHas);' +
    'vec3 L=normalize(vec3(0.45,0.85,0.55));float d=max(dot(n,L),0.0);float hemi=0.5+0.5*n.y;' +
    'float rim=pow(1.0-max(n.z,0.0),2.5);' +
    'vec3 c=base*(0.52+0.42*d+0.16*hemi)+uGlow*rim*0.22+uHi*0.05;gl_FragColor=vec4(c,1.0);}';

  function camInit(o) { return { yaw: o.yaw || 0, pitch: o.tilt == null ? .38 : o.tilt, zoom: 1, px: 0, py: 0, auto: true }; }
  function clampCam(c) {
    c.pitch = Math.max(-1.45, Math.min(1.45, c.pitch));
    c.zoom = Math.max(.5, Math.min(2.6, c.zoom));
    var lim = .9 * c.zoom; c.px = Math.max(-lim, Math.min(lim, c.px)); c.py = Math.max(-lim, Math.min(lim, c.py));
  }
  function view(canvas, host) {
    var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true }) || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    var u32 = gl.getExtension('OES_element_index_uint');
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    var L = { P: gl.getAttribLocation(pr, 'aP'), N: gl.getAttribLocation(pr, 'aN'), U: gl.getAttribLocation(pr, 'aU') };
    var U = {}; ['uM', 'uVP', 'uS', 'uT', 'uHas', 'uGlow', 'uHi'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var items = [], raf = 0, running = false, last = 0, dpr = Math.min(global.devicePixelRatio || 1, 2);

    function upload(m) {
      function buf(a, target) { var b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, a.raw, gl.STATIC_DRAW); return b; }
      var g = { pos: buf(m.pos, gl.ARRAY_BUFFER), m: m };
      if (m.nrm) g.nrm = buf(m.nrm, gl.ARRAY_BUFFER);
      if (m.uv) g.uv = buf(m.uv, gl.ARRAY_BUFFER);
      g.idx = buf(m.idx, gl.ELEMENT_ARRAY_BUFFER);
      g.itype = m.idx.type === 5125 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      if (g.itype === gl.UNSIGNED_INT && !u32) return null;
      if (m.image) {
        g.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, g.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, m.image);
        var pot = (m.image.width & (m.image.width - 1)) === 0 && (m.image.height & (m.image.height - 1)) === 0;
        if (pot) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, pot ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      return g;
    }
    function attr(loc, b, a) {
      if (loc < 0) return;
      if (!b) { gl.disableVertexAttribArray(loc); gl.vertexAttrib3f(loc, 0, 1, 0); return; }
      gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, a.n, a.type, a.norm, a.stride, 0);
    }
    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      var W = Math.round(w * dpr), H = Math.round(h * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    }
    function frame(now) {
      raf = 0; if (!running) return;
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.disable(gl.SCISSOR_TEST); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.SCISSOR_TEST); gl.useProgram(pr);
      var hr = host.getBoundingClientRect(), dt = Math.min(.1, (now - (last || now)) / 1000); last = now;
      items.forEach(function (it) {
        if (!it.g || !it.el.isConnected || it.el.offsetParent === null) return;
        var r = (it.box || it.el).getBoundingClientRect();
        /* 모델이 돌면서 자리 밖으로 조금 나가도 잘리지 않게 그리는 칸을 넓히고, 그만큼 멀리서 봄 */
        var K = it.o.pad || 1.5;
        var w = r.width * K * dpr, h = r.height * K * dpr;
        var x = (r.left - hr.left - r.width * (K - 1) / 2) * dpr, y = (hr.bottom - r.bottom - r.height * (K - 1) / 2) * dpr;
        if (w < 2 || h < 2 || x > canvas.width || y > canvas.height || x + w < 0 || y + h < 0) return;
        gl.viewport(x, y, w, h); gl.scissor(Math.max(0, x), Math.max(0, y), w, h); gl.clear(gl.DEPTH_BUFFER_BIT);
        var o = it.o, c3 = it.cam;
        if (c3.auto) c3.yaw += dt * (o.spin == null ? .25 : o.spin);
        var model = mul(rotX(c3.pitch), rotY(c3.yaw));
        var vp = mul(persp(.5, w / h, .05, 60), trans(c3.px, (o.dy || 0) + c3.py, -(o.dist || 2.35) * K * Math.max(1, h / w) / c3.zoom));
        gl.uniformMatrix4fv(U.uM, false, new Float32Array(model)); gl.uniformMatrix4fv(U.uVP, false, new Float32Array(vp));
        gl.uniform1f(U.uS, it.g.m.scale); gl.uniform1f(U.uHas, it.g.tex ? 1 : 0); gl.uniform1f(U.uHi, it.hi ? 1 : 0);
        var c = o.glow || [1, .9, .7]; gl.uniform3f(U.uGlow, c[0], c[1], c[2]);
        attr(L.P, it.g.pos, it.g.m.pos); attr(L.N, it.g.nrm, it.g.m.nrm); attr(L.U, it.g.uv, it.g.m.uv);
        if (it.g.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, it.g.tex); gl.uniform1i(U.uT, 0); }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, it.g.idx);
        gl.drawElements(gl.TRIANGLES, it.g.m.idx.count, it.g.itype, 0);
      });
      raf = requestAnimationFrame(frame);
    }
    /* 손가락·마우스로 보기
       mode 'map' : 한 손가락 끌기 = 위아래·좌우로 돌리기 (조금만 움직이면 그냥 누르기)
       mode 'full': 한 손가락·왼쪽 버튼 = 돌리기, 두 손가락 벌리기·휠 = 확대/축소, 두 손가락 끌기·오른쪽 버튼·Shift = 옮기기 */
    function bindControls(it, mode) {
      var el = it.el, pts = {}, start = null, moved = false, full = mode === 'full';
      function snap() {
        var ids = Object.keys(pts), a = pts[ids[0]], b = pts[ids[1]];
        var c = it.cam, s = { n: ids.length, yaw: c.yaw, pitch: c.pitch, zoom: c.zoom, px: c.px, py: c.py, x: a.x, y: a.y };
        if (b) { s.x = (a.x + b.x) / 2; s.y = (a.y + b.y) / 2; s.d = Math.hypot(a.x - b.x, a.y - b.y) || 1; }
        return s;
      }
      el.addEventListener('pointerdown', function (e) {
        if (!full && e.button > 0) return;
        pts[e.pointerId] = { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey };
        start = snap(); moved = false;
        if (full && el.setPointerCapture) try { el.setPointerCapture(e.pointerId); } catch (x) {}
      });
      global.addEventListener('pointermove', function (e) {
        if (!pts[e.pointerId]) return;
        pts[e.pointerId].x = e.clientX; pts[e.pointerId].y = e.clientY;
        var ids = Object.keys(pts); if (ids.length !== start.n) start = snap();
        var cur = snap(), dx = cur.x - start.x, dy = cur.y - start.y, c = it.cam;
        if (!moved && Math.hypot(dx, dy) < 8 && !(cur.d && Math.abs(cur.d - start.d) > 8)) return;
        if (!moved) { moved = true; start.yaw = c.yaw; c.auto = false; }
        var r = el.getBoundingClientRect(), sc = 2.2 / Math.max(120, Math.min(r.width, r.height));
        var p0 = pts[ids[0]], panMode = full && (ids.length >= 2 || p0.btn === 2 || p0.shift);
        if (full && ids.length >= 2) c.zoom = start.zoom * (cur.d / start.d);
        if (panMode) { c.px = start.px + dx * sc * .55; c.py = start.py - dy * sc * .55; }
        else { c.yaw = start.yaw + dx * sc * 1.2; c.pitch = start.pitch + dy * sc * 1.0; }
        clampCam(c);
      });
      function up(e) { if (pts[e.pointerId]) { delete pts[e.pointerId]; start = Object.keys(pts).length ? snap() : null; } }
      global.addEventListener('pointerup', up); global.addEventListener('pointercancel', up);
      el.addEventListener('click', function (e) { if (moved) { e.stopImmediatePropagation(); e.preventDefault(); moved = false; } }, true);
      el.addEventListener('pointerenter', function () { it.hi = true; });
      el.addEventListener('pointerleave', function () { it.hi = false; });
      if (full) {
        el.addEventListener('wheel', function (e) { e.preventDefault(); it.cam.auto = false; it.cam.zoom *= Math.exp(-e.deltaY / 900); clampCam(it.cam); }, { passive: false });
        el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      }
    }
    var api = {
      add: function (url, el, o) {
        o = o || {};
        var it = { el: el, o: o, box: o.box || null, cam: camInit(o) };
        items.push(it); bindControls(it, o.mode || 'map');
        return load(url).then(function (m) { it.g = upload(m); if (it.g) el.classList.add('is-3d'); if (o.onload) o.onload(!!it.g); return !!it.g; })
          .catch(function () { return false; });
      },
      item: function (i) { return items[i || 0]; },
      clear: function () { items = []; },
      start: function () { if (running) return; running = true; last = 0; if (!raf) raf = requestAnimationFrame(frame); },
      stop: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    };
    return api;
  }

  /* ---------- 크게 보기 창: 자유롭게 돌리고, 확대·축소하고, 옮겨 보기 ---------- */
  function css() {
    if (document.getElementById('oks3d-css')) return;
    var st = document.createElement('style'); st.id = 'oks3d-css';
    st.textContent = '.o3v{position:fixed;inset:0;z-index:9000;background:radial-gradient(circle at 50% 40%,#3a2f7a,#140f33 70%);display:flex;flex-direction:column;touch-action:none;}' +
      '.o3v-stage{position:relative;flex:1;cursor:grab;touch-action:none;}.o3v-stage:active{cursor:grabbing;}.o3v canvas{position:absolute;inset:0;}' +
      '.o3v-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 8px;color:#fff;z-index:2;pointer-events:none;}' +
      '.o3v-top b{font-size:clamp(18px,3vw,26px);font-weight:700;text-shadow:0 2px 8px #0008;flex:1;}' +
      '.o3v button{pointer-events:auto;font:inherit;border:0;border-radius:999px;background:#fff;color:#2a2060;min-width:52px;height:52px;font-size:22px;font-weight:700;box-shadow:0 4px 14px #0005;cursor:pointer;}' +
      '.o3v button:focus-visible{outline:4px solid #ffd54f;outline-offset:2px;}' +
      '.o3v-bar{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);display:flex;gap:10px;z-index:2;flex-wrap:wrap;justify-content:center;}' +
      '.o3v-bar button.txt{font-size:16px;padding:0 18px;}' +
      '.o3v-hint{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 70px);transform:translateX(-50%);color:#fff;background:#0006;padding:6px 14px;border-radius:999px;font-size:14px;z-index:2;pointer-events:none;transition:opacity .6s;white-space:nowrap;}';
    document.head.appendChild(st);
  }
  function open(url, opt) {
    opt = opt || {}; css();
    var box = document.createElement('div'); box.className = 'o3v'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div class="o3v-stage"><canvas></canvas></div>' +
      '<div class="o3v-top"><b></b><button type="button" class="x" aria-label="닫기">✕</button></div>' +
      '<div class="o3v-hint">끌어서 돌려 보고, 두 손가락(휠)으로 크게·작게 해 봐요</div>' +
      '<div class="o3v-bar"><button type="button" class="zi" aria-label="크게">＋</button><button type="button" class="zo" aria-label="작게">－</button>' +
      '<button type="button" class="up" aria-label="위에서 보기">⬆</button><button type="button" class="dn" aria-label="아래에서 보기">⬇</button>' +
      '<button type="button" class="spin txt">⟳ 돌리기</button><button type="button" class="reset txt">처음으로</button></div>';
    box.querySelector('b').textContent = opt.title || '';
    document.body.appendChild(box);
    var stage = box.querySelector('.o3v-stage'), v = view(box.querySelector('canvas'), stage);
    if (!v) { box.remove(); return null; }
    var o = { mode: 'full', box: stage, pad: 1, spin: .35, tilt: opt.tilt == null ? .35 : opt.tilt, dist: opt.dist || 2.4, glow: opt.glow };
    v.add(url, stage, o); v.start();
    var it = v.item(0), c = function () { return it.cam; };
    function step(f) { f(c()); clampCam(c()); }
    box.querySelector('.zi').onclick = function () { step(function (k) { k.zoom *= 1.25; }); };
    box.querySelector('.zo').onclick = function () { step(function (k) { k.zoom /= 1.25; }); };
    box.querySelector('.up').onclick = function () { step(function (k) { k.auto = false; k.pitch += .3; }); };
    box.querySelector('.dn').onclick = function () { step(function (k) { k.auto = false; k.pitch -= .3; }); };
    box.querySelector('.spin').onclick = function () { c().auto = !c().auto; };
    box.querySelector('.reset').onclick = function () { it.cam = camInit(o); };
    function close() { v.stop(); v.clear(); box.remove(); document.removeEventListener('keydown', key); if (opt.onclose) opt.onclose(); }
    function key(e) {
      var k = c();
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') { k.auto = false; k.yaw -= .2; } else if (e.key === 'ArrowRight') { k.auto = false; k.yaw += .2; }
      else if (e.key === 'ArrowUp') { k.auto = false; k.pitch += .2; } else if (e.key === 'ArrowDown') { k.auto = false; k.pitch -= .2; }
      else if (e.key === '+' || e.key === '=') k.zoom *= 1.2; else if (e.key === '-') k.zoom /= 1.2; else return;
      clampCam(k); e.preventDefault();
    }
    document.addEventListener('keydown', key);
    box.querySelector('.x').onclick = close;
    setTimeout(function () { var h = box.querySelector('.o3v-hint'); if (h) h.style.opacity = 0; }, 4000);
    box.querySelector('.x').focus();
    return { close: close };
  }
  global.OKS3D = { ok: ok, view: view, load: load, open: open };
})(window);
