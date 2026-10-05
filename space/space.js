/* 옥쌤의 즐거운 교실 — 우주 지도
   우주(별 고르기) → 우주선 타고 날아가기 → 별 위(건물 고르기) → 건물 안(초·중·고 층별 차시, 수준 1~5) */
(function () {
  'use strict';
  var O = window.OKS, E = O.el, SP = window.OKS_SPACE, D = window.OKS_LESSONS;
  var READY = {}; ((window.OKS_ART && window.OKS_ART.ready) || []).forEach(function (p) { READY[p.split('/').pop().replace(/\.webp$/, '')] = p; });
  function art(n) { return READY[n] || null; }
  var MODELS = {}; (window.OKS_MODELS || []).forEach(function (n) { MODELS[n] = 'art/3d/' + n + '.glb'; });
  function model(n) { return MODELS[n] || null; }
  function open3d(n, title, color) { if (model(n) && window.OKS3D && OKS3D.ok()) { O.sfx('pop'); OKS3D.open(model(n), { title: title, glow: color ? hex(color) : null }); return true; } return false; }
  var SUBJ = { korean: '국어', math: '수학', social: '사회', science: '과학', english: '영어', art: '미술', music: '음악', career: '진로' };
  var SCH = {}; D.schools.forEach(function (s) { SCH[s.key] = s.name; });
  var BYB = SP.assign(D.lessons);
  var stage = document.getElementById('stage'), scroller = document.getElementById('scroll');
  var mapEl = document.getElementById('map'), landEl = document.getElementById('land');
  var guide = document.getElementById('guide'), guideImg = document.getElementById('guideImg'), bubble = document.getElementById('bubble');
  var sheet = document.getElementById('sheet');
  var cur = { view: 'map', star: null, b: null };
  var calm = function () { return O.settings().calm; };
  var portrait = function () { return innerHeight > innerWidth * 1.1; };
  O.applyBody();
  if (O.eco) O.eco.hud(document.getElementById('ecoHud'));
  try { sessionStorage.removeItem('oks_return'); } catch (e) {}

  function starById(id) { return SP.STARS.filter(function (s) { return s.id === id; })[0]; }
  function bById(sid, bid) { return (SP.B[sid] || []).filter(function (b) { return b.id === bid; })[0]; }
  function pic(name, emo, cls) {
    var p = art(name);
    return p ? '<img class="' + (cls || '') + '" src="' + p + '" alt="" draggable="false">' : '<span class="sp-fallback ' + (cls || '') + '">' + (emo || '✨') + '</span>';
  }

  /* ---------- 말하는 안내자 ---------- */
  function talk(imgName, text, speak) {
    guide.hidden = false;
    var p = art(imgName) || art('ok_wave') || 'icons/mascot-cheer.png';
    if (guideImg.getAttribute('src') !== p) guideImg.src = p;
    bubble.textContent = text; guide.dataset.say = text;
    guide.classList.remove('pop'); void guide.offsetWidth; guide.classList.add('pop');
    if (speak !== false) O.say(text, { noRepeat: true });
    guide.classList.remove('quiet'); clearTimeout(talk.t); talk.t = setTimeout(function () { guide.classList.add('quiet'); }, 7000);
  }
  guide.onclick = function () { guide.classList.remove('quiet'); clearTimeout(talk.t); talk.t = setTimeout(function () { guide.classList.add('quiet'); }, 7000); if (guide.dataset.say) O.say(guide.dataset.say); };

  /* ---------- 우주 지도 ---------- */
  function place(el, x, y, w) { el.style.left = x + '%'; el.style.top = y + '%'; el.style.width = w + '%'; return el; }
  function renderMap() {
    mapEl.innerHTML = '';
    var P = portrait();
    SP.DECO.forEach(function (d, i) {
      if (!art(d.img) || (P && !d.p)) return;
      var e = place(E('div', 'sp-deco' + (d.dim ? ' dim' : '') + (d.drift ? ' drift' : ''), pic(d.img)), P ? d.p[0] : d.x, P ? d.p[1] : d.y, P ? d.p[2] : d.w);
      e.dataset.depth = '0.35'; e.style.animationDelay = (-i * 1.3) + 's'; mapEl.appendChild(e);
    });
    SP.EGGS.forEach(function (g, i) {
      var e = place(E('button', 'sp-egg', pic(g.img, '🥚')), P ? g.p[0] : g.x, P ? g.p[1] : g.y, P ? g.p[2] : g.w);
      e.type = 'button'; e.setAttribute('aria-label', '아직 태어나지 않은 별'); e.dataset.depth = '0.55'; e.style.animationDelay = (-i * 2.1) + 's';
      e.onclick = function () { O.sfx('pop'); talk('ok_think', g.say); };
      mapEl.appendChild(e);
    });
    /* 3D 별: 캔버스 하나에 별마다 천천히 도는 3D 모델 (못 쓰는 기기·'움직임 줄이기'면 그림 그대로) */
    if (view3d) { view3d.stop(); view3d = null; }
    var use3d = window.OKS3D && OKS3D.ok();
    if (use3d) { var cv3 = E('canvas', 'sp-3d'); cv3.setAttribute('aria-hidden', 'true'); mapEl.appendChild(cv3); view3d = OKS3D.view(cv3, mapEl); }
    SP.STARS.forEach(function (s, i) {
      var m = P ? s.mapP : s.map;
      var e = place(E('button', 'sp-star' + (s.id === 'center' ? ' main' : '') + (s.soon ? ' soon' : '') + (s.system ? ' system-' + s.system : ''), ''), m.x, m.y, m.w);
      e.type = 'button'; e.dataset.id = s.id; e.dataset.depth = s.id === 'center' ? '1' : '0.8'; e.style.setProperty('--c', s.color);
      e.style.animationDelay = (-i * 1.7) + 's';
      var labels = s.chips || s.subjects.map(function (k) { return SUBJ[k]; });
      var chips = labels.map(function (k) { return '<i>' + O.esc(k) + '</i>'; }).join('');
      if (s.soon) chips += '<i class="sp-soon-chip">곧 만나요</i>';
      e.innerHTML = '<span class="sp-star-glow"></span>' + pic(s.img, s.emo || '🪐', 'sp-star-img') + '<span class="sp-star-name"><b>' + O.esc(s.name) + '</b>' + chips + '</span>';
      if (s.soon) {
        e.disabled = true; e.setAttribute('aria-disabled', 'true'); e.setAttribute('aria-label', s.name + ' · 곧 만나요');
      } else {
        e.onclick = function () { O.unlock && O.unlock(); O.sfx('pop'); go(s.id); };
      }
      mapEl.appendChild(e);
      if (view3d && model(s.model)) {
        view3d.add(model(s.model), e, { box: e.querySelector('.sp-star-img'), spin: s.spin == null ? (s.id === 'center' ? .18 : .26) : s.spin, yaw: s.yaw == null ? i * 1.3 : s.yaw, tilt: s.tilt == null ? .42 : s.tilt, dist: s.dist || 1.8, dy: -.04, glow: hex(s.color),
          onload: function (ok3) {
            if (!ok3 || s.soon) return;
            var z = E('span', 'sp-zoom', '🔍'); z.setAttribute('role', 'button'); z.tabIndex = 0; z.setAttribute('aria-label', s.name + ' 크게 보기'); z.title = '크게 보기 (돌리고 확대해 봐요)';
            z.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
            z.onclick = function (ev) { ev.stopPropagation(); ev.preventDefault(); open3d(s.model, s.name, s.color); };
            z.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); open3d(s.model, s.name, s.color); } };
            e.appendChild(z);
          } });
      }
    });
    /* 은하계 레벨의 독립 별 마을 — 우리 별 마을 내부 별들과 섞이지 않게 별도 렌더링 */
    (SP.SYSTEMS || []).forEach(function (s, i) {
      var m = P ? s.mapP : s.map;
      var directEntry = s.id === 'ssing' && !s.soon;
      var e = place(E(directEntry ? 'button' : 'div', 'sp-star sp-system sp-system-' + s.id, ''), m.x, m.y, m.w);
      e.dataset.worldX = m.x; e.dataset.worldY = m.y; e.dataset.worldW = m.w;
      e.dataset.system = s.id; e.dataset.depth = '0'; e.style.setProperty('--c', s.color);
      if (directEntry) {
        e.type = 'button'; e.setAttribute('aria-label', s.name + ' 들어가기');
        e.onclick = function () { O.unlock && O.unlock(); O.sfx('pop'); location.href = 'sports/'; };
      } else {
        e.setAttribute('role', 'group'); e.setAttribute('aria-label', s.name + ' · ' + (s.chips || []).join(' · '));
      }
      var chips = (s.chips || []).map(function (k) { return '<i>' + O.esc(k) + '</i>'; }).join('');
      if (s.soon) chips += '<i class="sp-soon-chip">곧 만나요</i>';
      e.innerHTML = '<span class="sp-star-glow"></span>' + pic(s.img, '🏟️', 'sp-star-img') +
        (directEntry ? '' : '<span class="sp-star-name"><b>' + O.esc(s.name) + '</b>' + chips + '</span>' +
        (!s.soon && s.id === 'play' ? '<a class="sp-system-enter" href="playground/">🪁 놀이별 들어가기</a>' : ''));
      mapEl.appendChild(e);
      var enter = e.querySelector('.sp-system-enter');
      if (enter) {
        enter.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
        enter.addEventListener('click', function (ev) { ev.stopPropagation(); O.unlock && O.unlock(); O.sfx('pop'); });
      }
      if (view3d && model(s.model)) {
        /* 우리 별 마을의 3D 별과 같은 map 모드: 마우스/한 손가락으로 직접 360° 회전 */
        view3d.add(model(s.model), e, { box: e.querySelector('.sp-star-img'), spin: s.spin == null ? .14 : s.spin, yaw: s.yaw == null ? .25 + i : s.yaw, tilt: s.tilt == null ? .36 : s.tilt, dist: s.dist || 2.05, dy: -.03, glow: hex(s.color), mode: 'map' });
      }
    });
    /* 다른 게임 별: 누르면 우주선 타고 날아가서 그 게임으로 */
    (SP.LINKS || []).forEach(function (s, i) {
      var m = P ? s.mapP : s.map;
      var e = place(E('button', 'sp-star link', ''), m.x, m.y, m.w);
      e.type = 'button'; e.dataset.id = s.id; e.dataset.depth = '0.7'; e.style.setProperty('--c', s.color); e.style.animationDelay = (-i * 2.3 - 1) + 's';
      e.innerHTML = '<span class="sp-star-glow"></span>' + pic(s.img, s.emo, 'sp-star-img') + '<span class="sp-star-name"><b>' + O.esc(s.name) + '</b><i>' + O.esc(s.chip) + '</i></span>';
      e.onclick = function () { O.unlock && O.unlock(); O.sfx('pop'); leave(s, e); };
      mapEl.appendChild(e);
      if (view3d && model(s.model)) view3d.add(model(s.model), e, { box: e.querySelector('.sp-star-img'), spin: .3, yaw: 2 + i, tilt: .42, dist: 1.8, dy: -.04, glow: hex(s.color) });
    });
    if (view3d) view3d.start();
  }
  var view3d = null;
  /* 다른 게임으로 떠나기: 가운데 별에서 우주선이 날아가고, 그 별로 쑥 들어가면 게임 열기 */
  function leave(s, el) {
    if (busy) return; busy = true;
    talk(s.id === 'jungle' ? 'ok_wave' : 'ok_wave', s.say);
    var from = mapEl.querySelector('.sp-star.main');
    var go3 = function () { location.href = s.url; };
    fly(from, el).then(function () { return zoomInto(el); }).then(function () { setTimeout(go3, calm() ? 0 : 150); });
    setTimeout(function () { busy = false; }, 4000);
  }
  function hex(c) { var n = parseInt(c.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  /* 살짝 입체감: 손가락·마우스를 따라 층마다 다르게 움직임 */
  var par = { x: 0, y: 0 };
  function parallax() {
    if (calm() || cur.view !== 'map') return;
    mapEl.querySelectorAll('[data-depth]').forEach(function (e) {
      var d = parseFloat(e.dataset.depth); e.style.translate = (par.x * 16 * d) + 'px ' + (par.y * 10 * d) + 'px';
    });
  }
  window.addEventListener('pointermove', function (ev) { par.x = ev.clientX / innerWidth - .5; par.y = ev.clientY / innerHeight - .5; requestAnimationFrame(parallax); });

  /* ---------- 반짝이는 별 ---------- */
  var cv = document.getElementById('twinkle'), cx = cv.getContext('2d'), dots = [], raf = 0;
  function sizeCanvas() {
    var r = window.devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; cx.setTransform(r, 0, 0, r, 0, 0);
    dots = []; var n = Math.round(innerWidth * innerHeight / 9000);
    for (var i = 0; i < n; i++) dots.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() < .15 ? 1.8 : 1, p: Math.random() * 6.28, v: .6 + Math.random() * 1.6 });
  }
  function twinkle(t) {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    dots.forEach(function (d) {
      var a = calm() ? .55 : .25 + .75 * Math.abs(Math.sin(d.p + t / 1000 * d.v));
      cx.fillStyle = 'rgba(255,250,235,' + a.toFixed(2) + ')'; cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.28); cx.fill();
      if (d.r > 1.5 && a > .85) { cx.fillRect(d.x - 4, d.y - .4, 8, .8); cx.fillRect(d.x - .4, d.y - 4, .8, 8); }
    });
    if (!calm() && cur.view === 'map') raf = requestAnimationFrame(twinkle);
  }
  function startTwinkle() { cancelAnimationFrame(raf); cv.hidden = cur.view !== 'map'; if (!cv.hidden) raf = requestAnimationFrame(twinkle); }

  /* ---------- 별 위 ---------- */
  function renderLand(s) {
    landEl.innerHTML = '';
    if (land3d) { land3d.stop(); land3d = null; }
    if (window.OKS3D && OKS3D.ok() && (SP.B[s.id] || []).some(function (b) { return model(b.id); })) {
      var cv3 = E('canvas', 'sp-3d'); cv3.setAttribute('aria-hidden', 'true'); landEl.appendChild(cv3); land3d = OKS3D.view(cv3, landEl);
    }
    var bs = SP.B[s.id] || [];
    bs.slice().sort(function (a, b) { return portrait() ? 0 : a.y - b.y; }).forEach(function (b, i) {
      var w = 12.5 * (b.s || 1);
      var e = E('button', 'sp-bld' + (b.far ? ' far' : ''), '');
      if (!portrait()) place(e, b.x, b.y, w);
      e.type = 'button'; e.dataset.id = b.id; e.style.zIndex = Math.round(b.y);
      var n = (BYB[b.id] || []).length;
      e.innerHTML = pic(b.id, b.emo, 'sp-bld-img') + '<span class="sp-bld-name"><b>' + O.esc(b.name) + '</b><small>' + O.esc(b.sub) + (n ? ' · ' + n + '차시' : '') + '</small></span>';
      e.style.animationDelay = (i * 60) + 'ms';
      e.onclick = function () { O.sfx('pop'); location.hash = s.id + '/' + b.id; };
      landEl.appendChild(e);
      if (land3d && model(b.id)) land3d.add(model(b.id), e, { box: e.querySelector('.sp-bld-img'), spin: .2, yaw: -.5, tilt: .28, dist: 1.75, dy: -.02, pad: 1.35, glow: hex(s.color) });
    });
    if (land3d) land3d.start();
  }
  var land3d = null;

  /* ---------- 우주선 이동 ---------- */
  var flight = document.getElementById('flight'), ship = document.getElementById('flightShip');
  ship.src = art('ship_fly') || art('ship') || '';
  function centerOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function fly(fromEl, toEl, back) {
    return new Promise(function (done) {
      if (calm() || !fromEl || !toEl || !ship.src || !ship.animate) return done();
      var a = centerOf(fromEl), b = centerOf(toEl); if (back) { var t = a; a = b; b = t; }
      flight.hidden = false;
      var flip = b.x < a.x ? -1 : 1, ang = Math.atan2(b.y - a.y, Math.abs(b.x - a.x)) * 57.3;
      var mid = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 90 };
      O.sfx('water');
      var an = ship.animate([
        { transform: 'translate(' + a.x + 'px,' + a.y + 'px) translate(-50%,-50%) scale(' + flip * .35 + ',.35) rotate(' + ang * .5 + 'deg)', opacity: 0 },
        { transform: 'translate(' + a.x + 'px,' + (a.y - 30) + 'px) translate(-50%,-50%) scale(' + flip * .6 + ',.6)', opacity: 1, offset: .15 },
        { transform: 'translate(' + mid.x + 'px,' + mid.y + 'px) translate(-50%,-50%) scale(' + flip * .9 + ',.9) rotate(' + ang * .3 + 'deg)', opacity: 1, offset: .55 },
        { transform: 'translate(' + b.x + 'px,' + b.y + 'px) translate(-50%,-50%) scale(' + flip * .3 + ',.3)', opacity: 0 }
      ], { duration: 1500, easing: 'cubic-bezier(.45,.05,.4,1)' });
      an.onfinish = function () { flight.hidden = true; done(); };
    });
  }
  function zoomInto(el) {
    return new Promise(function (done) {
      if (window.OKS_ZOOM && OKS_ZOOM.on) return OKS_ZOOM.dive(el).then(done);
      if (calm() || !el || !stage.animate) return done();
      var r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      var ox = (r.left + r.width / 2 - sr.left) / sr.width * 100, oy = (r.top + r.height / 2 - sr.top) / sr.height * 100;
      stage.style.transformOrigin = ox + '% ' + oy + '%';
      var an = stage.animate([{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(2.6)', filter: 'brightness(1.6)', opacity: 0 }], { duration: 520, easing: 'ease-in' });
      an.onfinish = done;
    });
  }
  function fadeIn() { if (calm() || !stage.animate) return; if (window.OKS_ZOOM && OKS_ZOOM.on) { (document.querySelector('.sp-cosmos') || stage).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420 }); stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }); return; } stage.animate([{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' }); }

  /* ---------- 화면 바꾸기 ---------- */
  var busy = false, booting = true;
  function setBg(name) { var p = art(name); stage.style.backgroundImage = scroller.style.backgroundImage = p ? 'url(' + p + ')' : ''; }
  function centerScroll(xPct, yPct) {
    var max = scroller.scrollWidth - scroller.clientWidth; if (max > 0) scroller.scrollLeft = max * (xPct == null ? .5 : xPct / 100);
    var maxY = scroller.scrollHeight - scroller.clientHeight; if (maxY > 0) scroller.scrollTop = maxY * (yPct == null ? .5 : yPct / 100);
  }
  function showMap(fromStar) {
    cur = { view: 'map', star: null, b: null }; document.body.dataset.view = 'map'; if (land3d) land3d.stop();
    landEl.hidden = true; mapEl.hidden = false; setBg('space_bg');
    document.getElementById('backBtn').hidden = true;
    document.getElementById('title').innerHTML = '<b>옥쌤의 즐거운 교실</b><span>우주선을 타고 공부하러 떠나요</span><button class="sp-maker" type="button" aria-label="만든 사람"><span class="mk-f"><img src="space/img/maker.webp" alt="">Made by</span><span class="mk-b">우리 아이들과 옥선생님을 위하여<br><i>박장학사</i>가 만들다 ✨</span></button>';
    renderMap(); startTwinkle(); closeSheet(true);
    var target = fromStar && mapEl.querySelector('.sp-star[data-id="' + fromStar + '"]');
    centerScroll(50, portrait() ? 0 : 50);
    if (window.OKS_ZOOM) OKS_ZOOM.enter({ noIntro: !!fromStar });
    fadeIn();
    if (target) { busy = true; fly(target, mapEl.querySelector('.sp-star.main'), false).then(function () { busy = false; }); }
    talk('ok_wave', '어느 별로 가 볼까요? 별을 눌러요!', !fromStar);
  }
  function showLand(s, withFlight) {
    var go2 = function () {
      cur = { view: 'land', star: s.id, b: null }; document.body.dataset.view = 'land'; document.body.style.setProperty('--star', s.color);
      if (window.OKS_ZOOM) OKS_ZOOM.leave();
      mapEl.hidden = true; landEl.hidden = false; setBg(s.land); if (view3d) view3d.stop();
      document.getElementById('backBtn').hidden = false;
      document.getElementById('title').innerHTML = '<b>' + O.esc(s.name) + '</b><span>' + s.subjects.map(function (k) { return SUBJ[k]; }).join(' · ') + ' · 건물을 눌러요</span>';
      if (model(s.model) && window.OKS3D && OKS3D.ok()) {
        var zb = E('button', 'oks-pill sp-3dbtn', '🪐 <span>3D로 보기</span>'); zb.type = 'button';
        zb.onclick = function () { open3d(s.model, s.name, s.color); };
        document.getElementById('title').appendChild(zb);
      }
      renderLand(s); startTwinkle(); centerScroll(50); fadeIn();
      talk(s.guide, s.hello);
    };
    if (!withFlight || calm()) return go2();
    busy = true;
    var from = mapEl.querySelector('.sp-star.main'), to = mapEl.querySelector('.sp-star[data-id="' + s.id + '"]');
    (s.id === 'center' ? Promise.resolve() : fly(from, to)).then(function () { return zoomInto(to); }).then(function () { busy = false; go2(); });
  }

  /* ---------- 주소(#별/건물)로 움직이기 ---------- */
  function route() {
    var h = decodeURIComponent(location.hash.slice(1)).split('/');
    var s = starById(h[0]);
    if (!s) { if (cur.view !== 'map') showMap(cur.star); else if (!mapEl.children.length) showMap(); closeSheet(true); return; }
    if (cur.star !== s.id) showLand(s, !booting && cur.view === 'map');
    var b = h[1] && bById(s.id, h[1]);
    if (b) openBuilding(s, b); else closeSheet(true);
  }
  function go(id) { if (busy) return; location.hash = id; }
  window.addEventListener('hashchange', route);
  document.getElementById('backBtn').onclick = function () { O.sfx('pop'); location.hash = ''; };

  /* ---------- 건물 안 ---------- */
  function closeSheet(silent) { sheet.hidden = true; if (!silent && cur.star) { history.replaceState(null, '', '#' + cur.star); cur.b = null; } }
  document.getElementById('sheetClose').onclick = function () { closeSheet(); };
  sheet.addEventListener('click', function (e) {
    if (e.target === sheet) return closeSheet();
    var a = e.target.closest('a[href]');
    if (a && cur.star) { try { sessionStorage.setItem('oks_return', 'index.html#' + cur.star + (cur.b ? '/' + cur.b : '')); } catch (x) {} }
    if (a && a.dataset.lesson) O.rememberLevel(a.dataset.lesson, +a.dataset.lv);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

  function openBuilding(s, b) {
    cur.b = b.id;
    document.getElementById('sheetPic').innerHTML = pic(b.id, b.emo);
    if (model(b.id) && window.OKS3D && OKS3D.ok()) {
      var zb = E('button', 'sp-zoom in-sheet', '🔍'); zb.type = 'button'; zb.setAttribute('aria-label', b.name + ' 3D로 크게 보기');
      zb.onclick = function () { open3d(b.id, b.name, s.color); };
      document.getElementById('sheetPic').appendChild(zb);
    }
    document.getElementById('sheetName').textContent = b.name;
    document.getElementById('sheetSub').textContent = s.name + ' · ' + b.sub;
    var body = document.getElementById('sheetBody'); body.innerHTML = '';
    sheet.style.setProperty('--c', s.color);
    ({ lessons: lessonsView, hub: hubView, review: reviewView, room: roomView, link: function () {}, dock: dockView })[b.kind](body, s, b);
    if (b.links) body.appendChild(linkList(b.links));
    sheet.hidden = false;
    var t = (b.kind === 'lessons' ? b.name + '이에요. 층을 고르고, 차시와 수준을 눌러요.' : b.name + '이에요.');
    talk(s.guide, t);
  }
  function linkList(links) {
    var d = E('div', 'sp-links');
    links.forEach(function (l) { var a = E('a', 'sp-link', l[0]); a.href = l[1]; d.appendChild(a); });
    return d;
  }
  function stars(p, lv) { var n = p && p.best && p.best[lv] || 0; return n ? '<i>' + '★'.repeat(n) + '</i>' : ''; }
  function lessonRow(l, rec) {
    var pr = O.progress()[l.id], lvNow = O.settings().levels[l.id] || (pr && pr.last) || O.settings().defaultLevel;
    if (rec) lvNow = rec;
    var row = E('article', 'sp-les');
    row.innerHTML = '<div class="sp-les-h"><span class="sp-no" style="--s:var(--' + l.subject + ',#888)">' + SUBJ[l.subject] + ' ' + l.no + '</span><div><b>' + O.esc(l.topic) + '</b><small>〈' + O.esc(l.space) + '〉 ' + O.esc(l.goal) + '</small></div>' +
      (pr ? '<em>' + pr.plays + '번</em>' : '') + '</div><div class="sp-lv"></div>';
    var lv = row.querySelector('.sp-lv');
    O.LEVELS.forEach(function (L) {
      var a = E('a', 'sp-lvb' + (L.n === lvNow ? ' cur' : '') + (pr && pr.best && pr.best[L.n] ? ' got' : ''), '<b>' + L.n + '</b><small>' + L.name + '</small>' + stars(pr, L.n));
      a.href = 'play/?id=' + l.id + '&level=' + L.n; a.dataset.lesson = l.id; a.dataset.lv = L.n;
      if (rec && L.n === rec) a.insertAdjacentHTML('beforeend', '<span class="sp-rec">추천</span>');
      lv.appendChild(a);
    });
    return row;
  }
  function lessonsView(body, s, b) {
    var list = BYB[b.id] || [];
    var schools = D.schools.filter(function (x) { return list.some(function (l) { return l.school === x.key; }); });
    if (!list.length) { body.innerHTML = '<p class="sp-empty">이 건물의 차시는 곧 열려요!</p>'; return; }
    var last = (O.jget('oks_learn_last', {}) || {}).school;
    var sel = schools.some(function (x) { return x.key === last; }) ? last : schools[0].key;
    var tabs = E('div', 'sp-floors'), box = E('div', 'sp-les-list');
    function draw() {
      tabs.querySelectorAll('button').forEach(function (t) { t.classList.toggle('on', t.dataset.k === sel); t.setAttribute('aria-pressed', t.dataset.k === sel); });
      box.innerHTML = '';
      list.filter(function (l) { return l.school === sel; }).forEach(function (l) { box.appendChild(lessonRow(l)); });
    }
    schools.slice().reverse().forEach(function (x) {
      var n = list.filter(function (l) { return l.school === x.key; }).length;
      var t = E('button', 'sp-floor', '<b>' + ({ elem: '1층', middle: '2층', high: '3층' }[x.key] || '') + '</b> ' + x.name + ' <small>' + n + '</small>');
      t.type = 'button'; t.dataset.k = x.key;
      t.onclick = function () { sel = x.key; var ll = O.jget('oks_learn_last', {}) || {}; ll.school = sel; O.jset('oks_learn_last', ll); O.sfx('tick'); draw(); O.say(x.name, { noRepeat: true }); };
      tabs.appendChild(t);
    });
    body.appendChild(tabs); body.appendChild(box); draw();
  }
  function hubView(body) {
    var pr = O.progress(), played = Object.keys(pr).length;
    var i = O.eco ? O.eco.info() : null;
    body.insertAdjacentHTML('beforeend', '<div class="sp-stats"><div><b>' + played + '</b><small>해 본 차시</small></div><div><b>' + D.lessons.length + '</b><small>전체 차시</small></div>' +
      (i ? '<div><b>Lv.' + i.lv + '</b><small>' + O.esc(i.title) + '</small></div><div><b>🪙 ' + i.coins + '</b><small>코인</small></div>' : '') + '</div>');
    var btns = E('div', 'sp-links');
    if (O.eco) { var m = E('button', 'sp-link', '🎯 오늘의 미션'); m.type = 'button'; m.onclick = function () { O.eco.missionsView(); }; btns.appendChild(m); }
    [
      [O.iconHtml('icon_map.png', '배움 지도 (7교과 144차시 한눈에)'), 'learn/'],
      [O.iconHtml('icon_teacher.png', '선생님 지도 계획서'), 'curriculum/plan.html'],
      ['✏️ 선생님 문항 편집', 'curriculum/editor.html'],
      [O.iconHtml('icon_settings.png', '설정 (목소리·움직임·큰 버튼)'), 'learn/?set=1']
    ].forEach(function (l) { var a = E('a', 'sp-link', l[0]); a.href = l[1]; btns.appendChild(a); });
    body.appendChild(btns);
  }
  function reviewView(body) {
    var pr = O.progress(), byId = {};
    D.lessons.forEach(function (l) { byId[l.id] = l; });
    var ids = Object.keys(pr).filter(function (id) { return byId[id]; }).sort(function (a, b) { return String(pr[b].at || '').localeCompare(String(pr[a].at || '')); }).slice(0, 8);
    var box = E('div', 'sp-les-list');
    if (!ids.length) {
      body.insertAdjacentHTML('beforeend', '<p class="sp-note">아직 해 본 차시가 없어요. 여기서 시작해 봐요!</p>');
      ['korean', 'math', 'music'].forEach(function (k) { var l = D.lessons.filter(function (x) { return x.subject === k && x.school === 'elem'; })[0]; if (l) box.appendChild(lessonRow(l, O.settings().defaultLevel)); });
    } else {
      body.insertAdjacentHTML('beforeend', '<p class="sp-note">최근에 한 차시예요. 별 3개를 받은 수준은 다음 수준을, 아니면 같은 수준을 한 번 더 추천해요.</p>');
      ids.forEach(function (id) {
        var p = pr[id], lv = p.last || 1, got = (p.best && p.best[lv]) || 0;
        box.appendChild(lessonRow(byId[id], got >= 3 ? Math.min(5, lv + 1) : lv));
      });
    }
    body.appendChild(box);
  }
  function roomView(body) {
    var i = O.eco ? O.eco.info() : null, d = O.eco ? O.eco.data() : { badges: {} };
    var nb = Object.keys(d.badges || {}).length;
    body.insertAdjacentHTML('beforeend', '<div class="sp-stats">' + (i ? '<div><b>Lv.' + i.lv + '</b><small>' + O.esc(i.title) + '</small></div><div><b>🪙 ' + i.coins + '</b><small>코인</small></div>' : '') +
      '<div><b>🏅 ' + nb + '</b><small>배지</small></div><div><b>' + Object.keys(O.progress()).length + '</b><small>해 본 차시</small></div></div>' +
      '<p class="sp-note">코인으로 내 방을 꾸미는 기능은 곧 열려요!</p>');
    var btns = E('div', 'sp-links');
    if (O.eco && O.eco.badgesView) { var bb = E('button', 'sp-link', '🏅 배지 보기'); bb.type = 'button'; bb.onclick = function () { O.eco.badgesView(); }; btns.appendChild(bb); }
    var a = E('a', 'sp-link', '📋 학습 기록 보기'); a.href = 'learn/?rec=1'; btns.appendChild(a);
    body.appendChild(btns);
  }
  function dockView(body) {
    body.insertAdjacentHTML('beforeend', '<p class="sp-note">어느 별로 떠날까요?</p>');
    var d = E('div', 'sp-dock');
    SP.STARS.filter(function (s) { return s.id !== 'center'; }).forEach(function (s) {
      var b = E('button', 'sp-dockb', pic(s.img, '🪐') + '<b>' + O.esc(s.name) + '</b><small>' + s.subjects.map(function (k) { return SUBJ[k]; }).join(' · ') + '</small>');
      b.type = 'button'; b.style.setProperty('--c', s.color);
      b.onclick = function () { closeSheet(true); cur = { view: 'map', star: null }; showMap(); setTimeout(function () { location.hash = s.id; }, calm() ? 0 : 450); };
      d.appendChild(b);
    });
    body.appendChild(d);
  }

  /* 다른 게임(정글 점프 등)에 갔다가 '뒤로'로 돌아오면 브라우저가 떠날 때 모습(어둡게 사라지고 확대된 채)을 그대로 되살려요.
     그래서 돌아왔을 때 화면을 처음 상태로 다시 맞춰요. */
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false; flight.hidden = true;
    if (stage.getAnimations) stage.getAnimations().forEach(function (an) { an.cancel(); });
    if (cur.view === 'map') { if (window.OKS_ZOOM) OKS_ZOOM.enter({ noIntro: true }); if (view3d) view3d.start(); startTwinkle(); }
    else if (land3d) land3d.start();
  });

  /* 만든 사람 배지: 누르면 뒤집혀서 한 마디, 6초 뒤 다시 앞면 */
  document.addEventListener('click', function (e) {
    var m = e.target.closest && e.target.closest('.sp-maker'); if (!m) return;
    O.sfx && O.sfx('pop');
    var wasBack = m.classList.contains('back'), flip = function () { m.classList.toggle('back'); };
    clearTimeout(m._t);
    if (calm() || !m.animate) flip();
    else m.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 180, easing: 'ease-in' }).onfinish = function () { flip(); m.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 220, easing: 'ease-out' }); };
    if (!wasBack) m._t = setTimeout(function () { if (m.classList.contains('back')) m.click(); }, 6000);
  });

  /* ---------- 시작 ---------- */
  var wasP = portrait();
  addEventListener('resize', function () {
    sizeCanvas(); document.body.classList.toggle('portrait', portrait());
    if (portrait() !== wasP) { wasP = portrait(); if (cur.view === 'map') { renderMap(); if (window.OKS_ZOOM && OKS_ZOOM.on) OKS_ZOOM.enter({ keep: true, noIntro: true }); } else if (cur.star) renderLand(starById(cur.star)); }
    if (cur.view === 'map') startTwinkle();
  });
  document.body.classList.toggle('portrait', portrait());
  sizeCanvas();
  if (location.hash.length > 1) route(); else showMap();
  booting = false;
})();
