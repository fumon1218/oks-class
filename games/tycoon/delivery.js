/* 배달 놀이: 🚚 트럭(항공 지도에서 주소 보고 집 찾기) · 🚁 드론(꾹 눌러 날아서 고리 지나 배달)
   OKS_DELIVERY.start({ mode:'truck'|'drone', level:1~5, guest:{img,name}, house:0~8, onDone:function(r){} })  r = { ok, mistakes, rings } */
window.OKS_DELIVERY = (function () {
  'use strict';
  var O = window.OKS, T = window.OKS_TOWN, IMG = 'img/', E = O.el;
  function josa(w, a, b) { var c = String(w).charCodeAt(String(w).length - 1) - 0xAC00; return (c >= 0 && c % 28) ? a : b; }
  var css = document.createElement('style');
  css.textContent = [
    '.dl{position:fixed;inset:0;z-index:95;background:#2f6b3a;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;}',
    '.dl .map{position:relative;flex:none;box-shadow:0 0 0 6px rgba(255,255,255,.5),0 20px 50px rgba(0,0,0,.45);border-radius:14px;overflow:hidden;}',
    '.dl .map > img.town{position:absolute;inset:0;width:100%;height:100%;}',
    '.dl svg.ov{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}',
    '.dl .badge{position:absolute;transform:translate(-50%,-50%);background:#fffdf6;border:3px solid #6d4c41;border-radius:999px;min-width:38px;height:38px;padding:0 8px;display:flex;align-items:center;justify-content:center;gap:4px;font-size:20px;color:#3e2723;box-shadow:0 3px 8px rgba(0,0,0,.3);pointer-events:none;white-space:nowrap;}',
    '.dl .badge img{height:28px;}',
    '.dl .badge.goal{animation:dlgoal 1s ease-in-out infinite;border-color:#ff9800;box-shadow:0 0 0 6px rgba(255,193,7,.6),0 0 24px 8px rgba(255,193,7,.6);}',
    '@keyframes dlgoal{50%{transform:translate(-50%,-50%) scale(1.15)}}',
    '.dl .truck{position:absolute;transform:translate(-50%,-70%);pointer-events:none;filter:drop-shadow(0 6px 6px rgba(0,0,0,.35));transition:left .55s ease-in-out,top .55s ease-in-out;z-index:3;}',
    '.dl .truck img{width:100%;display:block;transition:transform .25s;}',
    '.dl .arw{position:absolute;transform:translate(-50%,-50%);width:58px;height:58px;border-radius:50%;border:4px solid #fff;background:#ff8a3d;color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.35);z-index:4;font-family:inherit;padding:0;}',
    '.dl .arw:active{transform:translate(-50%,-50%) scale(.92);}',
    '.dl .addr{position:absolute;right:14px;top:14px;z-index:6;background:#fffdf6;border-radius:22px;padding:10px 16px 12px;box-shadow:0 10px 26px rgba(0,0,0,.35);min-width:220px;max-width:330px;border:4px solid #f0c27b;}',
    '.dl .addr h4{margin:0 0 6px;font-weight:400;font-size:16px;color:#8a5a1e;display:flex;align-items:center;gap:6px;}',
    '.dl .addr .who{display:flex;align-items:center;gap:10px;font-size:22px;}',
    '.dl .addr .who img{height:64px;}',
    '.dl .addr .line{font-size:21px;margin-top:6px;display:flex;align-items:center;gap:8px;}',
    '.dl .addr .sw{display:inline-block;width:26px;height:26px;border-radius:6px;border:2px solid #6d4c41;}',
    '.dl .addr .num{display:inline-flex;min-width:34px;height:34px;border-radius:50%;border:3px solid #6d4c41;align-items:center;justify-content:center;background:#fff;}',
    '.dl .bar{position:absolute;left:14px;top:14px;z-index:6;display:flex;gap:8px;}',
    '.dl .bar button{border:none;border-radius:999px;background:#fffdf6;font:inherit;font-size:18px;padding:8px 16px;box-shadow:0 4px 10px rgba(0,0,0,.25);cursor:pointer;color:#3e2723;}',
    '.dl .msg{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:6;background:rgba(255,253,246,.96);border-radius:20px;padding:8px 20px;font-size:21px;box-shadow:0 6px 18px rgba(0,0,0,.3);max-width:90%;text-align:center;}',
    '.dl .win{position:absolute;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);}',
    '.dl .win .card{background:#fffdf6;border-radius:28px;padding:20px 28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4);animation:dlpop .4s ease;}',
    '.dl .win h3{margin:6px 0;font-weight:400;font-size:28px;}',
    '.dl .win button{border:none;border-radius:999px;background:#3fb05a;color:#fff;font:inherit;font-size:22px;padding:10px 30px;box-shadow:0 4px 0 #2b8040;cursor:pointer;margin-top:8px;}',
    '@keyframes dlpop{from{transform:scale(.5)}to{transform:scale(1)}}',
    '.dl canvas{display:block;}',
    '.dl .hold{position:absolute;right:18px;bottom:18px;z-index:6;width:150px;height:110px;border-radius:24px;border:4px solid #fff;background:#4fc3f7;color:#fff;font:inherit;font-size:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 6px 0 #0288d1,0 10px 20px rgba(0,0,0,.3);cursor:pointer;}',
    '.dl .hold b{font-size:40px;font-weight:400;line-height:1;}',
    '.dl .hold.on{transform:translateY(4px);box-shadow:0 2px 0 #0288d1;}',
    '@media (max-width:700px){.dl .addr{right:8px;top:62px;min-width:0;padding:6px 10px;} .dl .addr .who img{height:42px;} .dl .addr .who,.dl .addr .line{font-size:16px;} .dl .arw{width:46px;height:46px;font-size:24px;} .dl .badge{min-width:28px;height:28px;font-size:15px;}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- 주소 말 (수준별) ---------- */
  function addrLines(h, guest, lv) {
    var sw = '<span class="sw" style="background:' + h.hex + '"></span>', num = '<span class="num">' + h.no + '</span>';
    if (lv <= 1) return { html: [sw + ' ' + h.color + ' 지붕 집'], say: h.color + ' 지붕 집으로 가요' };
    if (lv === 2) return { html: [num + ' ' + h.no + '번지', sw + ' ' + h.color + ' 지붕'], say: h.no + '번지, ' + h.color + ' 지붕 집으로 가요' };
    if (lv === 3) return { html: [num + ' 햇살 마을 ' + h.no + '번지'], say: '햇살 마을 ' + h.no + '번지로 가요' };
    return { html: ['📍 ' + h.near, num + ' ' + h.no + '번지'], say: h.near + ', ' + h.no + '번지로 가요' };
  }

  /* ================= 🚚 트럭 ================= */
  function truck(o) {
    var lv = o.level, h = T.HOUSES[o.house], cur = T.START, mistakes = 0, moving = false, helpOn = lv <= 1;
    var root = E('div', 'dl'), map = E('div', 'map');
    map.innerHTML = '<img class="town" src="' + IMG + T.img + '" alt="햇살 마을 지도"><svg class="ov" viewBox="0 0 ' + T.W + ' ' + T.H + '" preserveAspectRatio="none"><path class="hint" d="" fill="none" stroke="#ff9800" stroke-width="14" stroke-dasharray="4 26" stroke-linecap="round" opacity=".95"/></svg>';
    root.appendChild(map);
    var hint = map.querySelector('.hint');
    /* 집 번호표: 1·2수준은 번호, 3수준부터는 번호 + (4수준부터) 문패 없이 */
    T.HOUSES.forEach(function (x, i) {
      var b = E('div', 'badge' + (helpOn && i === o.house ? ' goal' : ''), lv >= 2 ? String(x.no) : '<span class="sw" style="display:inline-block;width:18px;height:18px;border-radius:4px;background:' + x.hex + ';border:2px solid #6d4c41"></span>');
      b.style.left = (x.at[0] / T.W * 100) + '%'; b.style.top = ((x.at[1] - 115) / T.H * 100) + '%'; b.dataset.i = i; map.appendChild(b);
    });
    var sch = E('div', 'badge', '🏫 학교'); sch.style.left = (1450 / T.W * 100) + '%'; sch.style.top = (60 / T.H * 100) + '%'; map.appendChild(sch);
    var gh = E('div', 'badge', '🌱 출발'); gh.style.left = (175 / T.W * 100) + '%'; gh.style.top = (600 / T.H * 100) + '%'; map.appendChild(gh);
    var tr = E('div', 'truck', '<img src="' + IMG + 'truck.webp" alt="">'); map.appendChild(tr);
    var ad = addrLines(h, o.guest, lv);
    var card = E('div', 'addr', '<h4>📦 배달 주소</h4><div class="who"><img src="' + o.guest.img + '" alt="">' + o.guest.name + '네 집</div>' + ad.html.map(function (l) { return '<div class="line">' + l + '</div>'; }).join(''));
    root.appendChild(card);
    var bar = E('div', 'bar', '<button type="button" class="hear">🔊 주소 듣기</button><button type="button" class="hlp">🙋 길 알려 줘</button><button type="button" class="x">✖ 그만</button>');
    root.appendChild(bar);
    var msg = E('div', 'msg', '화살표를 눌러 길을 따라가요. 주소의 집 앞에 서면 배달돼요!'); root.appendChild(msg);
    document.body.appendChild(root);
    function fit() {
      var w = innerWidth - 16, hgt = innerHeight - 16, k = Math.min(w / T.W, hgt / T.H);
      map.style.width = Math.round(T.W * k) + 'px'; map.style.height = Math.round(T.H * k) + 'px';
      tr.style.width = Math.max(64, T.W * k * .075) + 'px';
    }
    fit(); addEventListener('resize', fit);
    function pos(n) { var p = T.N[n]; return [p[0] / T.W * 100, p[1] / T.H * 100]; }
    function place() { var p = pos(cur); tr.style.left = p[0] + '%'; tr.style.top = p[1] + '%'; }
    function drawHint() {
      if (!helpOn) { hint.setAttribute('d', ''); return; }
      var pth = T.path(cur, h.node); hint.setAttribute('d', pth.map(function (n, i) { return (i ? 'L' : 'M') + T.N[n][0] + ' ' + T.N[n][1]; }).join(' '));
    }
    var ARW = { U: '⬆', D: '⬇', L: '⬅', R: '➡' }, OFF = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
    function arrows() {
      [].forEach.call(map.querySelectorAll('.arw'), function (a) { a.remove(); });
      if (moving) return;
      var p = T.N[cur], seen = {};
      (T.ADJ[cur] || []).forEach(function (nb) {
        var d = T.dir(cur, nb); if (seen[d]) return; seen[d] = 1;
        var a = E('button', 'arw', ARW[d]); a.type = 'button';
        var gap = 70; a.style.left = ((p[0] + OFF[d][0] * gap) / T.W * 100) + '%'; a.style.top = ((p[1] + OFF[d][1] * gap) / T.H * 100) + '%';
        if (helpOn) { var nx = T.path(cur, h.node)[1]; if (nx === nb) a.style.background = '#43a047'; }
        a.onclick = function (e) { e.stopPropagation(); go(nb); };
        map.appendChild(a);
      });
    }
    function go(nb) {
      if (moving) return; moving = true; O.unlock(); O.hush(); O.sfx('tick');
      var d = T.dir(cur, nb); tr.querySelector('img').style.transform = d === 'L' ? 'scaleX(-1)' : '';
      cur = nb; place(); arrows();
      setTimeout(function () { moving = false; arrive(); }, 580);
    }
    function arrive() {
      var hi = T.HOUSES.findIndex(function (x) { return x.node === cur; });
      if (hi === o.house) return win();
      if (hi >= 0) {
        mistakes++; O.sfx('no'); var x = T.HOUSES[hi];
        var t = '여기는 ' + x.no + '번지 ' + x.color + ' 지붕 집이에요. 주소를 다시 봐요.'; msg.textContent = t; O.say(t);
        if (mistakes >= 2 && !helpOn) { helpOn = true; badgeGoal(); }
      } else if (T.PLACES[cur]) { msg.textContent = '여기는 ' + T.PLACES[cur] + '이에요.'; }
      drawHint(); arrows();
    }
    function badgeGoal() { [].forEach.call(map.querySelectorAll('.badge'), function (b) { b.classList.toggle('goal', +b.dataset.i === o.house); }); drawHint(); arrows(); }
    function win() {
      O.sfx('ok'); O.say(o.guest.name + '네 집에 도착! 배달 완료!');
      var w = E('div', 'win', '<div class="card"><img src="' + o.guest.img + '" alt="" style="height:120px"><h3>🏠 ' + h.no + '번지 도착!</h3><p style="font-size:19px;margin:4px 0">' + o.guest.name + ': "고마워요! 잘 받았어요!"</p><button type="button">📦 배달 완료</button></div>');
      root.appendChild(w);
      w.querySelector('button').onclick = function () { close(); o.onDone({ ok: true, mistakes: mistakes, mode: 'truck' }); };
    }
    function close() { removeEventListener('resize', fit); removeEventListener('keydown', key); root.remove(); }
    function key(e) {
      var m = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R' }[e.key]; if (!m) return; e.preventDefault();
      var nb = (T.ADJ[cur] || []).filter(function (n) { return T.dir(cur, n) === m; })[0]; if (nb) go(nb);
    }
    addEventListener('keydown', key);
    bar.querySelector('.hear').onclick = function () { O.unlock(); O.say(o.guest.name + '네 집. ' + ad.say); };
    bar.querySelector('.hlp').onclick = function () { helpOn = true; badgeGoal(); O.say('초록 화살표를 따라가요'); };
    bar.querySelector('.x').onclick = function () { close(); o.onDone({ ok: false }); };
    place(); drawHint(); arrows();
    setTimeout(function () { O.say(o.guest.name + '네 집으로 배달 가요. ' + ad.say); }, 300);
    return { state: function () { return { cur: cur, goal: h.node, mistakes: mistakes }; }, go: go };
  }

  /* ================= 🚁 드론 (원주분원 드론 날리기를 옮겨 온 것) ================= */
  function drone(o) {
    var lv = o.level, W = 1280, H = 720, DX = 300, SPD = 170 + lv * 12, LANDY = 522;
    var R = [110, 100, 90, 80, 72][lv - 1], n = 2 + lv;
    var root = E('div', 'dl'), cv = E('canvas'); cv.width = W; cv.height = H; root.appendChild(cv);
    var h = T.HOUSES[o.house];
    var card = E('div', 'addr', '<h4>🚁 드론 배달</h4><div class="who"><img src="' + o.guest.img + '" alt="">' + o.guest.name + '네 집</div><div class="line"><span class="num">' + h.no + '</span>' + h.no + '번지 · 고리를 지나가요</div>');
    root.appendChild(card);
    var bar = E('div', 'bar', '<button type="button" class="x">✖ 그만</button>'); root.appendChild(bar);
    var msg = E('div', 'msg', '꾹 누르면 올라가요 · 떼면 내려와요'); root.appendChild(msg);
    var hold = E('button', 'hold', '<b>⬆</b>꾹 누르기'); hold.type = 'button'; root.appendChild(hold);
    document.body.appendChild(root);
    var A = {}; ['drone', 'drone_box', 'ring', 'ring_ok', 'pad', 'house', 'bg'].forEach(function (k) { var im = new Image(); im.src = IMG + 'drone/' + k + '.webp'; A[k] = im; });
    var y = 330, vy = 0, wx = 0, on = false, landing = false, doneT = -1, t0 = performance.now(), last = t0, raf = 0, fx = [];
    var rings = []; for (var k = 0; k < n; k++) rings.push({ x: 900 + k * 380, y: 350 + Math.sin(k * 1.3 + lv * 2) * (lv <= 1 ? 60 : 165), done: false, ok: false });
    var pad = { x: 900 + n * 380 + 260 };
    function fit() { var k = Math.min(innerWidth / W, innerHeight / H); cv.style.width = Math.round(W * k) + 'px'; cv.style.height = Math.round(H * k) + 'px'; }
    fit(); addEventListener('resize', fit);
    function setHold(v) { if (doneT >= 0) return; on = v; hold.classList.toggle('on', v); if (v) O.unlock(); }
    hold.addEventListener('pointerdown', function (e) { e.preventDefault(); setHold(true); });
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); setHold(true); });
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    function up() { setHold(false); }
    function key(e) { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); setHold(e.type === 'keydown'); } }
    addEventListener('keydown', key); addEventListener('keyup', key);
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function ok() { return rings.filter(function (r) { return r.ok; }).length; }
    function step(now) {
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (doneT >= 0) { doneT += dt; y += (LANDY - y) * Math.min(1, dt * 4); if (doneT > 1.2 && !step.shown) { step.shown = 1; win(); } }
      else {
        if (landing) wx += (pad.x - DX - wx) * Math.min(1, dt * 3); else wx += SPD * dt;
        if (!landing) { vy += (on ? -900 : (lv <= 1 ? 380 : 520)) * dt; vy = clamp(vy, -420, 340); y = clamp(y + vy * dt, 120, 575); if (y >= 575 || y <= 120) vy = 0; }
        rings.forEach(function (r) { if (!r.done && r.x - wx < DX) { r.done = true; r.ok = Math.abs(r.y - y) < R * .85; O.sfx(r.ok ? 'pop' : 'no'); fx.push({ t: 0, x: DX, y: r.y, txt: r.ok ? '통과!' : '아깝다!', c: r.ok ? '#2e7d32' : '#e65100' }); } });
        if (pad.x - wx < DX + 20 && !landing) { landing = true; msg.textContent = '착륙해요!'; }
        if (landing) { y += (LANDY - y) * Math.min(1, dt * 3); vy = 0; if (Math.abs(LANDY - y) < 6) { doneT = 0; O.sfx('ok'); fx.push({ t: 0, x: DX, y: 470, txt: '배달 완료! 📦', c: '#1565c0' }); } }
      }
      draw(now); raf = requestAnimationFrame(step);
    }
    function img(im, x, y2, w) { if (!im.complete || !im.naturalWidth) return 0; var hh = w * im.naturalHeight / im.naturalWidth; c.drawImage(im, x, y2, w, hh); return hh; }
    var c = cv.getContext('2d');
    function ringDraw(r, front) {
      var x = r.x - wx; if (x < -150 || x > W + 150) return;
      var im = r.done && r.ok ? A.ring_ok : A.ring; if (!im.complete || !im.naturalWidth) return;
      var ovH = R * 2.3, ih = ovH / .9, iw = ih * im.naturalWidth / im.naturalHeight, top = r.y - ovH / 2 - ih * .02;
      c.save(); if (r.done && !r.ok) c.globalAlpha = .4;
      if (front) { c.beginPath(); c.rect(x, top - 10, iw, ih + 20); c.clip(); }
      c.drawImage(im, x - iw / 2, top, iw, ih); c.restore();
    }
    function draw(now) {
      var t = (now - t0) / 1000;
      if (A.bg.complete && A.bg.naturalWidth) { var k = Math.max(W / A.bg.naturalWidth, H / A.bg.naturalHeight), bw = A.bg.naturalWidth * k, off = (wx * .15) % (bw - W + 1); c.drawImage(A.bg, -off, (H - A.bg.naturalHeight * k) / 2, bw, A.bg.naturalHeight * k); }
      else { c.fillStyle = '#81d4fa'; c.fillRect(0, 0, W, H); }
      rings.forEach(function (r) { ringDraw(r, false); });
      var px = pad.x - wx;
      if (px < W + 360) { img(A.house, px + 110, 612 - 230 * 485 / 512, 230); img(A.pad, px - 110, 612 - 220 * 241 / 512, 220); if (doneT >= 0) { c.font = '40px sans-serif'; c.fillText('📦', px + 10, 590); } }
      var withBox = doneT < 0, im = withBox ? A.drone_box : A.drone, tilt = clamp(vy / 900, -.22, .22) + .06, bob = Math.sin(t * 6) * 3;
      c.save(); c.translate(DX, y + bob); c.rotate(tilt);
      if (im.complete && im.naturalWidth) { var w = 180, hh = w * im.naturalHeight / im.naturalWidth, cy = withBox ? hh * .36 : hh * .5; c.drawImage(im, -w / 2, -cy, w, hh); }
      c.restore();
      rings.forEach(function (r) { ringDraw(r, true); });
      fx = fx.filter(function (f) { f.t += .016; return f.t < 1.2; });
      fx.forEach(function (f) { c.save(); c.globalAlpha = Math.max(0, 1 - f.t / 1.2); c.font = '40px Jua, sans-serif'; c.fillStyle = f.c; c.strokeStyle = '#fff'; c.lineWidth = 6; c.textAlign = 'center'; c.strokeText(f.txt, f.x + 120, f.y - 40 - f.t * 40); c.fillText(f.txt, f.x + 120, f.y - 40 - f.t * 40); c.restore(); });
      var left = rings.filter(function (r) { return !r.done; }).length;
      c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect ? c.roundRect(470, 20, 340, 56, 28) : c.rect(470, 20, 340, 56); c.fill();
      c.font = '26px Jua, sans-serif'; c.fillStyle = '#01579b'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('남은 고리 ' + left + ' · 통과 ' + ok(), 640, 48); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
    function win() {
      O.say(o.guest.name + '네 집에 드론 배달 완료! 고리 ' + ok() + '개 통과!');
      var w = E('div', 'win', '<div class="card"><img src="' + o.guest.img + '" alt="" style="height:120px"><h3>🚁 배달 완료!</h3><p style="font-size:19px;margin:4px 0">고리 ' + ok() + ' / ' + n + '개 통과 ' + (ok() === n ? '⭐ 완벽해요!' : '') + '</p><button type="button">📦 좋아요</button></div>');
      root.appendChild(w); w.querySelector('button').onclick = function () { close(); o.onDone({ ok: true, rings: ok(), total: n, mistakes: n - ok(), mode: 'drone' }); };
    }
    function close() { cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('keydown', key); removeEventListener('keyup', key); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); root.remove(); }
    bar.querySelector('.x').onclick = function () { close(); o.onDone({ ok: false }); };
    raf = requestAnimationFrame(step);
    setTimeout(function () { O.say(o.guest.name + '네 집으로 드론 배달! 꾹 누르면 올라가요.'); }, 300);
    return { state: function () { return { y: y, landing: landing, done: doneT >= 0, rings: rings, wx: wx, DX: DX }; }, hold: setHold };
  }

  return { start: function (o) { return (o.mode === 'drone' ? drone : truck)(o); } };
})();
