/* 우주 지도 줌 — 아주 먼 우주 → 은하 → 우리 별 무리 → 별 가까이
   PC: 마우스 휠(가리키는 곳 중심) · 끌어서 옮기기 · 키보드 + − 0
   태블릿: 두 손가락 벌리기/오므리기 · 한 손가락 끌기
   '움직임 줄이기'면 인트로 없이 바로 바뀜 */
window.OKS_ZOOM = (function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var IMGW = 1672, IMGH = 941, F = [0.69, 0.63];   /* 은하 그림에서 우리 별 무리가 있는 자리 */
  var ZMAX = 2.4, SNAP_IDLE = 520;
  var scroller, stage, mapEl, cos, deep, gal, gal2, over, markOur, markSsing, galLab, hint, ui;
  var on = false, z = 1, zT = 1, V = { x: 0, y: 0 }, V1 = null, anchor = null, home = false, pinch = false, intro = null, diving = false;
  var focus = 'our', autoFocus = false;
  var SW, SH, vw, vh, GW, GH, ZG, ZD, C, G0, raf = 0, last = 0, idleT = 0;
  function calm() { return !!O.settings().calm || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function eio(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function build() {
    scroller = document.getElementById('scroll'); stage = document.getElementById('stage'); mapEl = document.getElementById('map');
    cos = E('div', 'sp-cosmos'); cos.setAttribute('aria-hidden', 'true'); cos.hidden = true;
    deep = E('div', 'sp-deep'); gal = E('img', 'sp-galaxy'); gal.alt = ''; gal.src = 'space/img/galaxy.webp'; gal.draggable = false;
    gal2 = E('img', 'sp-galaxy soft'); gal2.alt = ''; gal2.src = 'space/img/galaxy_soft.webp'; gal2.draggable = false;
    cos.appendChild(deep); cos.appendChild(gal2); cos.appendChild(gal);
    document.body.insertBefore(cos, scroller);
    over = E('div', 'sp-zover'); over.hidden = true;
    markOur = E('button', 'sp-zmark our', '<i></i><span>✨ 우리 별 마을</span>'); markOur.type = 'button'; markOur.setAttribute('aria-label', '우리 별 마을로 가까이 가기');
    markOur.onclick = function () { O.sfx('pop'); stopIntro(); selectSystem('our', true); };
    markSsing = E('button', 'sp-zmark ssing', '<i></i><span>🏃 씽씽 별 마을<small>체육 · 놀이 · 곧 만나요</small></span>'); markSsing.type = 'button'; markSsing.setAttribute('aria-label', '씽씽 별 마을 가까이 보기, 곧 만나요');
    markSsing.onclick = function () { O.sfx('pop'); stopIntro(); selectSystem('ssing', true); };
    galLab = E('div', 'sp-zgal', '🌌 옥쌤 은하');
    hint = E('div', 'sp-zhint', '마우스 휠이나 두 손가락으로 원하는 별 마을에 가까이 가요'); hint.hidden = true;
    over.appendChild(markOur); over.appendChild(markSsing); over.appendChild(galLab); over.appendChild(hint);
    scroller.parentNode.insertBefore(over, scroller.nextSibling);
    ui = E('div', 'sp-zui', '<button type="button" data-z="in" aria-label="가까이">＋</button><button type="button" data-z="out" aria-label="멀리">－</button>' +
      '<span class="sp-zlv"><button type="button" data-l="gal"><b>🌌</b><span>은하</span></button><button type="button" data-l="map"><b>✨</b><span>별 무리</span></button><button type="button" data-l="near"><b>🔍</b><span>가까이</span></button></span>' +
      '<button type="button" data-z="home" aria-label="처음으로" title="처음으로">🏠</button>');
    ui.hidden = true; document.body.appendChild(ui);
    ui.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; O.unlock && O.unlock(); O.sfx('tick'); stopIntro();
      var k = b.dataset.z || b.dataset.l;
      if (k === 'in') stepLv(1); else if (k === 'out') stepLv(-1);
      else if (k === 'home' || k === 'map') go(1, true);
      else if (k === 'gal') go(ZG, false);
      else if (k === 'near') { if (z < 1) { V = { x: C.x, y: C.y }; } go(1.8, false); }
    });
    scroller.addEventListener('wheel', onWheel, { passive: false });
    scroller.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    addEventListener('keydown', onKey);
    addEventListener('resize', function () { if (!on) return; dims(); apply(); });
  }

  function dims() {
    vw = innerWidth; vh = innerHeight; SW = stage.offsetWidth; SH = stage.offsetHeight; C = { x: SW / 2, y: SH / 2 };
    GW = SW * 32; GH = GW * IMGH / IMGW;
    var cover = Math.max(vw, vh * IMGW / IMGH); ZG = cover * 1.1 / GW; ZD = ZG * .2;
    G0 = { x: C.x - F[0] * GW, y: C.y - F[1] * GH };
    [gal, gal2].forEach(function (g) { g.style.width = (GW * ZG) + 'px'; g.style.height = (GH * ZG) + 'px'; });
    if (!V1) V1 = { x: C.x, y: C.y };
  }
  /* 처음 자리: 세로 화면(태블릿 세로)은 전처럼 맨 위부터 */
  function homeP() { return (vh > vw * 1.1 && SH > vh + 2) ? { x: C.x, y: vh / 2 } : { x: C.x, y: C.y }; }
  function centerFor(zz) {
    var a = ease(cl((1 - zz) / .35, 0, 1));
    var bx = lerp(V1.x, C.x, a), by = lerp(V1.y, C.y, a);
    /* 화면에서 별 무리가 가운데에서 조금씩 비켜나며 은하 가운데가 화면 가운데로 오게 */
    var t = ease(cl(Math.log(1 / zz) / Math.log(1 / ZG), 0, 1)), gx = G0.x + GW / 2, gy = G0.y + GH / 2;
    if (zz <= ZG) return { x: gx + (bx - C.x) * 0, y: gy };
    return { x: bx - t * (C.x - gx) * ZG / zz, y: by - t * (C.y - gy) * ZG / zz };
  }
  function clampV() {
    var hx = vw / 2 / z, hy = vh / 2 / z;
    if (focus === 'ssing' && autoFocus && z >= .72) {
      /* 씽씽 별 마을은 우리 별 마을 왼쪽의 독립 행성계라서, 줌인할 때 화면 중앙까지 충분히 이동할 수 있게 여백을 허용 */
      V.x = cl(V.x, SW * .06, SW - hx);
    } else {
      V.x = SW * z <= vw ? C.x : cl(V.x, hx, SW - hx);
    }
    V.y = SH * z <= vh ? C.y : cl(V.y, hy, SH - hy);
  }
  function scr(wx, wy) { return { x: vw / 2 + (wx - V.x) * z, y: vh / 2 + (wy - V.y) * z }; }
  function ssingWorld() {
    var e = mapEl && mapEl.querySelector('.sp-system-ssing');
    if (!e) return { x: SW * .22, y: SH * .56 };
    return { x: parseFloat(e.style.left || '22') * SW / 100, y: parseFloat(e.style.top || '56') * SH / 100 };
  }
  function focusWorld() { return focus === 'ssing' ? ssingWorld() : C; }
  function chooseFocusAt(x, y) {
    var a = scr(C.x, C.y), s = scr(ssingWorld().x, ssingWorld().y);
    var da = Math.hypot(x - a.x, y - a.y), ds = Math.hypot(x - s.x, y - s.y);
    focus = ds < da ? 'ssing' : 'our'; V1 = focusWorld(); autoFocus = true;
  }
  function selectSystem(name, direct) {
    focus = name === 'ssing' ? 'ssing' : 'our'; V1 = focusWorld(); autoFocus = true; anchor = null; home = false;
    if (direct) zT = focus === 'ssing' ? 1.85 : 1;
    else if (zT < 1) zT = 1;
    kick();
  }

  function apply() {
    if (z >= 1) { clampV(); V1 = { x: V.x, y: V.y }; } else { if (z < .65) V1 = { x: C.x, y: C.y }; var c = centerFor(z); V.x = c.x; V.y = c.y; }
    stage.style.transform = 'translate(' + (vw / 2 - V.x * z).toFixed(2) + 'px,' + (vh / 2 - V.y * z).toFixed(2) + 'px) scale(' + z.toFixed(5) + ')';
    var m = cl((1 - z) / .3, 0, 1);
    var mk = m > 0 ? 'radial-gradient(ellipse 50% 50% at 50% 50%,#000 ' + (140 - 88 * m).toFixed(1) + '%,transparent ' + (200 - 112 * m).toFixed(1) + '%)' : 'none';
    stage.style.webkitMaskImage = stage.style.maskImage = mk;
    if (!diving) stage.style.opacity = z >= ZG ? 1 : cl((z - ZD * .7) / (ZG - ZD * .7), 0, 1).toFixed(3);
    stage.style.pointerEvents = z < .3 ? 'none' : '';
    mapEl.style.setProperty('--nm', cl((z - .32) / .28, 0, 1).toFixed(3));
    /* 은하 */
    /* 많이 확대될 때는 흐린 은하(뭉게 성운처럼), 멀어지면 또렷한 은하 */
    var go = cl((.97 - z) / .3, 0, 1), mag = z / ZG, sharp = cl((7 - mag) / 4, 0, 1);
    var tf = go > 0 ? (function () { var p = scr(G0.x, G0.y); return 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) scale(' + mag.toFixed(5) + ')'; })() : '';
    gal.style.display = go * sharp > 0 ? '' : 'none'; gal2.style.display = go * (1 - sharp) > 0 ? '' : 'none';
    if (go > 0) { gal.style.transform = gal2.style.transform = tf; gal.style.opacity = (go * sharp).toFixed(3); gal2.style.opacity = (go * (1 - sharp * .9) * cl((32 - mag) / 18, 0, 1)).toFixed(3); }
    /* 먼 우주 */
    var dO = cl(Math.log(.25 / z) / Math.log(.25 / ZG), 0, 1);
    deep.style.opacity = dO.toFixed(3); deep.style.transform = 'scale(' + (1.04 + Math.min(.3, z / ZG * .06)).toFixed(4) + ')';
    /* 행성계 이름표 — 먼 은하에서는 두 마을을 함께 보여 줍니다 */
    var mO = cl((.56 - z) / .24, 0, 1) * cl((z - ZD * 1.1) / (ZG * .8 - ZD * 1.1), 0, 1);
    var cp = scr(C.x, C.y), sw = ssingWorld(), sp = scr(sw.x, sw.y);
    /* 은하계 단계에서는 두 행성계 라벨이 서로 겹치지 않도록 화면 좌우로 충분히 벌립니다.
       가까이 갈수록 실제 3D 행성계 위치로 자연스럽게 되돌아갑니다. */
    var sep = ease(cl((.62 - z) / .24, 0, 1));
    var ourX = lerp(cp.x, vw * .78, sep), ssingX = lerp(sp.x, vw * .20, sep);
    markOur.style.left = ourX + 'px'; markOur.style.top = cp.y + 'px'; markOur.style.opacity = mO.toFixed(3); markOur.style.pointerEvents = mO > .3 ? 'auto' : 'none';
    markSsing.style.left = ssingX + 'px'; markSsing.style.top = sp.y + 'px'; markSsing.style.opacity = mO.toFixed(3); markSsing.style.pointerEvents = mO > .3 ? 'auto' : 'none';
    markOur.style.setProperty('--s', Math.max(18, SW * z * .55).toFixed(1) + 'px');
    markSsing.style.setProperty('--s', Math.max(18, SW * z * .48).toFixed(1) + 'px');
    mapEl.style.setProperty('--ssing-visible', (z < .72 || focus === 'ssing') ? '1' : '0');
    mapEl.style.setProperty('--our-visible', (z < .72 || focus === 'our') ? '1' : '0');
    mapEl.classList.toggle('focus-ssing', z >= .72 && focus === 'ssing');
    mapEl.classList.toggle('focus-our', z >= .72 && focus === 'our');
    var gp = scr(G0.x + GW / 2, G0.y + GH * .9); galLab.style.left = gp.x + 'px'; galLab.style.top = Math.min(vh - 60, gp.y) + 'px';
    galLab.style.opacity = cl((ZG * 2.4 - z) / (ZG * 1.4), 0, 1).toFixed(3);
    /* 단계 표시 */
    var lv = z < ZG * 2 ? 'gal' : z < 1.3 ? 'map' : 'near';
    if (ui.dataset.lv !== lv) { ui.dataset.lv = lv; [].forEach.call(ui.querySelectorAll('[data-l]'), function (b) { b.classList.toggle('on', b.dataset.l === lv); b.setAttribute('aria-pressed', b.dataset.l === lv); }); }
  }

  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0; var dt = last ? Math.min(.12, (now - last) / 1000) : .016; last = now;
    var moving = false;
    if (intro) {
      var t = cl((now - intro.t0) / intro.dur, 0, 1);
      z = Math.exp(lerp(Math.log(intro.from), 0, eio(t))); zT = z;
      if (t >= 1) { intro = null; hint.hidden = true; z = zT = 1; } else moving = true;
    } else {
      var lz = Math.log(z), lt = Math.log(zT);
      if (Math.abs(lt - lz) > .0015) {
        var k = (calm() || pinch) ? 1 : 1 - Math.exp(-dt * (diving ? 10 : 7)), z0 = z;
        z = Math.exp(lerp(lz, lt, k));
        if (anchor && z0 >= 1 && z >= 1) { var wx = V.x + (anchor.x - vw / 2) / z0, wy = V.y + (anchor.y - vh / 2) / z0; V.x = wx - (anchor.x - vw / 2) / z; V.y = wy - (anchor.y - vh / 2) / z; }
        moving = true;
      } else z = zT;
      if (home && z >= 1) {
        var kh = calm() ? 1 : 1 - Math.exp(-dt * 6);
        var H0 = homeP(); V.x = lerp(V.x, H0.x, kh); V.y = lerp(V.y, H0.y, kh);
        if (Math.abs(V.x - H0.x) + Math.abs(V.y - H0.y) < .5) { V.x = H0.x; V.y = H0.y; home = false; } else moving = true;
      } else if (autoFocus && z >= .72) {
        var FT = focusWorld(), kf = calm() ? 1 : 1 - Math.exp(-dt * 4.8);
        V.x = lerp(V.x, FT.x, kf); V.y = lerp(V.y, FT.y, kf);
        moving = true;
      }
    }
    apply();
    if (moving && on) raf = requestAnimationFrame(tick);
  }
  function snapLater() {
    clearTimeout(idleT);
    idleT = setTimeout(function () {
      if (!on || pinch || intro || zT >= 1) return;
      var opts = [ZD, ZG, 1], best = opts[0];
      opts.forEach(function (o) { if (Math.abs(Math.log(zT / o)) < Math.abs(Math.log(zT / best))) best = o; });
      anchor = null; zT = best; if (best === 1) home = true; kick();
    }, SNAP_IDLE);
  }
  function go(target, toHome) { anchor = null; zT = cl(target, ZD, ZMAX); home = !!toHome; kick(); }
  /* ＋/－: 1보다 멀면 한 단계씩(먼 우주 ↔ 은하 ↔ 별 무리), 가까이에서는 1.6배씩 */
  function stepLv(dir) {
    var L = [ZD, ZG, 1], i;
    if (dir > 0 && zT < .97) { for (i = 0; i < L.length; i++) if (L[i] > zT * 1.05) return go(L[i], L[i] === 1); }
    if (dir < 0 && zT <= 1.03) { for (i = L.length - 1; i >= 0; i--) if (L[i] < zT * .95) return go(L[i], false); return; }
    step(dir > 0 ? 1.6 : 1 / 1.6);
  }
  function step(f) { anchor = null; zT = cl(zT * f, ZD, ZMAX); kick(); snapLater(); }

  function onWheel(e) {
    if (!on) return; e.preventDefault(); stopIntro();
    var dy = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    if (dy < 0 && zT < .8) chooseFocusAt(e.clientX, e.clientY);
    zT = cl(zT * Math.exp(-dy * (e.ctrlKey ? .01 : .0016)), ZD, ZMAX);
    anchor = { x: e.clientX, y: e.clientY }; home = false; kick(); snapLater();
  }
  var pts = {}, np = 0, d0 = 0, pz0 = 1, downAt = null, moved = false;
  function onDown(e) {
    if (!on) return; stopIntro();
    pts[e.pointerId] = { x: e.clientX, y: e.clientY }; np = Object.keys(pts).length;
    if (np === 1) { downAt = { x: e.clientX, y: e.clientY }; moved = false; }
    if (np === 2) { var p = vals(); d0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1; pz0 = zT = z; pinch = true; moved = true; }
  }
  function vals() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
  function onMove(e) {
    if (!on || !pts[e.pointerId]) return;
    var pr = pts[e.pointerId], dx = e.clientX - pr.x, dy = e.clientY - pr.y;
    pr.x = e.clientX; pr.y = e.clientY;
    if (np >= 2) {
      var p = vals(), d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      anchor = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
      if (d > d0 * 1.03 && zT < .8) chooseFocusAt(anchor.x, anchor.y);
      zT = cl(pz0 * d / d0, ZD, ZMAX); home = false; kick();
      return;
    }
    if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) moved = true;
    if (moved && z >= 1) { autoFocus = false; V.x -= dx / z; V.y -= dy / z; home = false; apply(); }
  }
  function onUp(e) {
    if (!pts[e.pointerId]) return;
    delete pts[e.pointerId]; np = Object.keys(pts).length;
    if (np < 2 && pinch) { pinch = false; snapLater(); }
    if (np === 0 && moved) { /* 끌기 뒤에는 누르기로 치지 않음 */
      var stop = function (ev) { ev.stopPropagation(); ev.preventDefault(); };
      addEventListener('click', stop, true); setTimeout(function () { removeEventListener('click', stop, true); }, 0);
    }
  }
  function onKey(e) {
    if (!on || e.target.closest && e.target.closest('input,textarea')) return;
    var sh = document.getElementById('sheet'); if (sh && !sh.hidden) return;
    if (e.key === '+' || e.key === '=') { stopIntro(); stepLv(1); }
    else if (e.key === '-' || e.key === '_') { stopIntro(); stepLv(-1); }
    else if (e.key === '0') { stopIntro(); go(1, true); }
    else if (intro) stopIntro();
  }

  function startIntro() {
    var seen = false; try { seen = sessionStorage.getItem('oks_space_intro') === '1'; sessionStorage.setItem('oks_space_intro', '1'); } catch (x) {}
    if (seen || calm()) return false;
    intro = { t0: performance.now() + 250, dur: 4800, from: ZD * .9 }; z = zT = intro.from; hint.hidden = false;
    addEventListener('pointerdown', stopIntro, { once: true });
    return true;
  }
  function stopIntro() { if (!intro) return; intro = null; hint.hidden = true; anchor = null; zT = 1; home = true; kick(); }

  return {
    get on() { return on; },
    enter: function (opt) {
      if (!scroller) build();
      on = true; document.body.classList.add('sp-zooming');
      scroller.scrollTop = 0; scroller.scrollLeft = 0; scroller.style.backgroundImage = 'none';
      if (stage.getAnimations) stage.getAnimations().forEach(function (an) { an.cancel(); });
      cos.hidden = false; over.hidden = false; ui.hidden = false; diving = false; stage.style.transition = ''; stage.style.filter = ''; stage.style.opacity = '';
      stage.style.transformOrigin = '0 0';
      dims();
      if (!(opt && opt.keep)) { z = zT = 1; V = homeP(); V1 = homeP(); home = false; anchor = null; focus = 'our'; autoFocus = false; }
      if (!(opt && opt.noIntro)) startIntro();
      apply(); kick();
    },
    leave: function () {
      if (!scroller) return;
      if (stage.getAnimations) stage.getAnimations().forEach(function (an) { an.cancel(); });
      on = false; intro = null; diving = false; cancelAnimationFrame(raf); raf = 0; document.body.classList.remove('sp-zooming');
      stage.style.transform = ''; stage.style.transformOrigin = ''; stage.style.maskImage = stage.style.webkitMaskImage = ''; stage.style.opacity = ''; stage.style.transition = ''; stage.style.filter = ''; stage.style.pointerEvents = '';
      cos.hidden = true; over.hidden = true; ui.hidden = true; hint.hidden = true;
    },
    /* 별로 쑥 들어가기 (별 위로 내리기 전) */
    dive: function (el) {
      return new Promise(function (done) {
        if (!on || calm() || !el) return done();
        stopIntro();
        var r = el.getBoundingClientRect(); anchor = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        diving = true; zT = Math.max(z, 1) * 2.6; home = false; kick();
        stage.style.transition = 'opacity .56s ease-in, filter .56s ease-in'; void stage.offsetWidth;
        stage.style.opacity = '0'; stage.style.filter = 'brightness(1.6)';
        setTimeout(done, 580);
      });
    },
    state: function () { return { z: z, zT: zT, ZG: ZG, ZD: ZD, V: V, intro: !!intro }; },
    go: function (t) { go(t, t === 1); }
  };
})();
