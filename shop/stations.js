/* 가게 작업대(스테이션) 모음 — 정글 점프 춘천본원·원주분원 체험의 조작 방식을 DOM으로 옮겼습니다.
   모든 스테이션: ST[k](ctx, sp) → Promise<boolean 한 번에 성공?>
   수준(ctx.level)에 따라 보기 수·✓칸 넓이·자동 촉진이 달라집니다. 스위치(스캔) 모드에서는 '꾹 누르기'가 '한 번 눌러 시작/멈춤'으로 바뀝니다. */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var ST = window.OKS_STATIONS = {};
  var NOPT = [1, 2, 3, 4, 4];
  var NUMW = ['영', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  function row(cls) { return E('div', 'row ' + (cls || '')); }
  function scanOn() { return !!O.settings().scan; }
  function first(ctx) { return ctx.stats.mistakes === ctx._m0; }
  function begin(ctx, q, opt) { ctx.clearDesk(); ctx._m0 = ctx.stats.mistakes; ctx.newStep(); return q ? ctx.ask(q, opt) : Promise.resolve(); }
  function btn(label, cls) { var b = E('button', 'oks-btn ' + (cls || ''), label); b.type = 'button'; return b; }
  function dots(n) { var s = ''; for (var k = 0; k < n; k++) s += '●'; return '<small class="dots">' + s + '</small>'; }
  ST._dots = dots; ST._NUMW = NUMW;

  /* 👋 인사 */
  ST.greet = function (ctx, sp) {
    return begin(ctx, sp.q || '손님이 왔어요. 인사해요!').then(function () {
      var ok = ctx.card({ label: sp.text || '어서 오세요!', emo: sp.emo || '👋' }, { cls: 'greet' });
      var list = [ok];
      if (ctx.level >= 4 && !sp.only) list.push(ctx.card({ label: sp.wrong || '안녕히 가세요', emo: '🙋' }, { cls: 'greet' }));
      list = O.shuffle(list); ctx.desk.appendChild(ctx.grid(list));
      ctx.target({ get: function () { return ok; } });
      return ctx.tapWait(list, function (e) { return e === ok; }).then(function () {
        ctx.good(ok, false); O.say(sp.text || '어서 오세요!', { noRepeat: true, lang: sp.lang }); return O.wait(700).then(function () { return first(ctx); });
      });
    });
  };

  /* 🖐 고르기: 주문한 것(들) 고르기. sp.targets 여러 개면 모두 */
  ST.pick = function (ctx, sp) {
    var targets = sp.targets || [sp.target];
    var n = Math.max(targets.length, Math.min(sp.items.length, sp.n || NOPT[ctx.level - 1] + (targets.length - 1)));
    var others = O.shuffle(sp.items.filter(function (x) { return targets.indexOf(x) < 0; })).slice(0, n - targets.length);
    var list = O.shuffle(targets.concat(others));
    return begin(ctx, sp.q, sp.askOpt).then(function () {
      if (sp.before) ctx.desk.insertAdjacentHTML('beforeend', '<div class="before">' + sp.before + '</div>');
      var cards = list.map(function (it) { return ctx.card(it, { noLabel: sp.noLabel, cls: sp.cls }); });
      var okEls = cards.filter(function (c) { return targets.indexOf(c._item) >= 0; });
      ctx.desk.appendChild(ctx.grid(cards));
      var drag = ctx.level === 3 && targets.length === 1 && sp.zone !== false;
      var z;
      if (drag) { z = E('div', 'dropzone tray', '<span class="dz-ico">' + (sp.zoneIcon || '🧺') + '</span><span>' + (sp.zone || '여기에 옮겨요') + '</span>'); var zr = row('center'); zr.appendChild(z); ctx.desk.appendChild(zr); }
      var left = okEls.slice();
      function tgt() { var nx = sp.ordered ? left[0] : null; ctx.target({ get: function () { return nx ? [nx] : left; }, to: z ? function () { return z; } : null }); }
      tgt();
      if (drag) {
        return ctx.dnd(cards, [z], function (it) { return okEls.indexOf(it) >= 0; }, function (it) {
          z.innerHTML = ''; var cp = ctx.card(it._item, { cls: sp.cls }); cp.classList.add('good'); z.appendChild(cp); it.classList.add('dim'); ctx.good(null, false); ctx.voice(it._item, sp.voice);
        }, function () { return true; }).then(function () { return O.wait(600).then(function () { return first(ctx); }); });
      }
      return new Promise(function (res) {
        (function loop() {
          ctx.tapWait(cards, function (e) { return sp.ordered ? e === left[0] : left.indexOf(e) >= 0; }).then(function (e) {
            left.splice(left.indexOf(e), 1); e._done = true; ctx.good(e, false); ctx.voice(e._item, sp.voice); if (sp.onPick) sp.onPick(e._item);
            if (!left.length) setTimeout(function () { res(first(ctx)); }, 650); else { tgt(); loop(); }
          });
        })();
      });
    });
  };

  /* 🧺 세어서 담기: sp.order = [{item, n}], sp.box = {label, icon} */
  ST.count = function (ctx, sp) {
    var order = sp.order, total = order.reduce(function (s, o) { return s + o.n; }, 0);
    return begin(ctx, sp.q).then(function () {
      var box = E('div', 'dropzone box', '<div class="order-card">' + order.map(function (o) { return '<span>' + ctx.pic(o.item) + '<b>' + o.n + '</b>' + (ctx.level <= 4 ? dots(o.n) : '') + '</span>'; }).join('') + '</div><div class="box-in"></div>');
      var pile = row('blocks pile'), pieces = [];
      order.forEach(function (o) { for (var k = 0; k < Math.min(o.n + 2, 8); k++) { var p = E('button', 'block oks-pop', ctx.pic(o.item)); p.type = 'button'; p._it = o.item; pieces.push(p); } });
      O.shuffle(pieces).forEach(function (p) { pile.appendChild(p); });
      var done = btn('✔ 다 담았어요', 'orange');
      ctx.desk.appendChild(box); ctx.desk.appendChild(pile); var dr = row('center'); dr.appendChild(done); ctx.desk.appendChild(dr);
      var inB = [];
      function cnt(it) { return inB.filter(function (p) { return p._it === it; }).length; }
      function need() { return order.filter(function (o) { return cnt(o.item) < o.n; })[0]; }
      function tgt() { var o = need(); if (o) ctx.target({ get: function () { return pieces.filter(function (p) { return !p._done && p._it === o.item; })[0]; }, to: function () { return box; } }); else ctx.target({ get: function () { return done; } }); }
      tgt();
      return new Promise(function (res) {
        ctx.dnd(pieces, [box], function () { return true; }, function (p) {
          inB.push(p); p.style.visibility = 'hidden';
          var m = E('button', 'block mini', p.innerHTML); m.type = 'button'; box.querySelector('.box-in').appendChild(m);
          var c = order.length === 1 ? inB.length : cnt(p._it); O.say(NUMW[c] || String(c), { noRepeat: true });
          m.onclick = function (e) { e.stopPropagation(); m.remove(); p.style.visibility = ''; p._done = false; inB.splice(inB.indexOf(p), 1); O.sfx('tick'); tgt(); };
          tgt();
        }, function () { return false; });
        done.onclick = function () {
          var bad = order.filter(function (o) { return cnt(o.item) !== o.n; })[0];
          if (!bad) { done.onclick = null; ctx.good(done, '딱 맞아요!'); setTimeout(function () { res(first(ctx)); }, 900); }
          else { ctx.bad(done); O.say(cnt(bad.item) < bad.n ? (bad.item.label || '') + ' 조금 더 담아요' : (bad.item.label || '') + ' 너무 많아요. 하나 빼 볼까요?', { noRepeat: true }); }
        };
      });
    });
  };

  /* 🔢 순서대로 누르기: sp.steps [{icon,label}] — 1~3수준은 순서 카드(시각 일과표)를 보여 줌 */
  ST.seq = function (ctx, sp) {
    return begin(ctx, sp.q || '순서대로 해요').then(function () {
      var show = sp.show != null ? sp.show : ctx.level <= 3;
      if (show) { var strip = row('seqstrip'); sp.steps.forEach(function (s, k) { strip.insertAdjacentHTML('beforeend', '<span class="sq" data-k="' + k + '"><b>' + (k + 1) + '</b>' + ctx.pic(s) + '<small>' + O.esc(s.label) + '</small></span>' + (k < sp.steps.length - 1 ? '<i>➜</i>' : '')); }); ctx.desk.appendChild(strip); }
      var bs = sp.steps.map(function (s, k) { var c = ctx.card(s, { cls: 'small' }); c._k = k; return c; });
      ctx.desk.appendChild(ctx.grid(O.shuffle(bs)));
      var k = 0;
      function upd() { if (ctx.level === 1) bs.forEach(function (b) { b.classList.toggle('dim', b._k !== k && !b._done); }); ctx.target({ get: function () { return bs.filter(function (b) { return b._k === k; })[0]; } }); }
      upd();
      return new Promise(function (res) {
        (function loop() {
          ctx.tapWait(bs, function (b) { return b._k === k; }).then(function (b) {
            b._done = true; b.classList.add('good'); O.sfx('pop'); O.clearPrompt(); O.say(sp.steps[k].label, { noRepeat: true });
            var sq = ctx.desk.querySelector('.sq[data-k="' + k + '"]'); if (sq) sq.classList.add('done');
            if (sp.onStep) sp.onStep(k);
            k++; if (k >= sp.steps.length) { ctx.good(null, false); setTimeout(function () { res(first(ctx)); }, 700); } else { upd(); loop(); }
          });
        })();
      });
    });
  };

  /* ✋ 꾹 누르기 게이지: 누르는 동안 차오르고, ✓ 칸에서 손을 뗌 (붓기·물들이기·말기·당기기) */
  var ZONES = { 1: null, 2: [0.4, 0.9], 3: [0.52, 0.82], 4: [0.6, 0.8], 5: [0.6, 0.78] };
  ST.hold = function (ctx, sp) {
    var zone = sp.zone || ZONES[ctx.level], scan = scanOn();
    return begin(ctx, sp.q).then(function () {
      var art = E('div', 'hold-art ' + (sp.art || ''), sp.artHtml || '');
      var g = E('div', 'gauge big', (zone ? '<div class="zone" style="left:' + zone[0] * 100 + '%;width:' + (zone[1] - zone[0]) * 100 + '%">✓</div>' : '') + '<div class="fill"></div><div class="needle"></div>');
      var b = btn(scan ? '👆 눌러서 시작' : '✋ ' + (sp.button || '꾹 누르기'), 'hold-btn');
      ctx.desk.appendChild(art); ctx.desk.appendChild(g); var r = row('center'); r.appendChild(b); ctx.desk.appendChild(r);
      var v = 0, on = false, raf, last = 0, speed = sp.speed || 0.32, done = false;
      function paint() { g.querySelector('.fill').style.width = v * 100 + '%'; g.querySelector('.needle').style.left = v * 100 + '%'; art.style.setProperty('--v', v.toFixed(3)); if (sp.onVal) sp.onVal(v, art); g.classList.toggle('in', !!zone && v >= zone[0] && v <= zone[1]); }
      paint();
      ctx.target({ get: function () { return b; } });
      return new Promise(function (res) {
        function tick(t) {
          if (!on) return; var dt = last ? (t - last) / 1000 : 0; last = t; v = Math.min(1, v + dt * speed); paint();
          if (!zone && v >= 0.7) return stop(); /* 1수준: 알맞은 곳에서 저절로 멈춤 */
          if (v >= 1) return stop();
          raf = requestAnimationFrame(tick);
        }
        function start() { if (on || done) return; on = true; last = 0; O.clearPrompt(); O.sfx('tick'); if (sp.sfx) O.sfx(sp.sfx); b.textContent = scan ? '✋ 눌러서 멈춤' : '…'; raf = requestAnimationFrame(tick); }
        function stop() {
          if (!on) return; on = false; cancelAnimationFrame(raf);
          var ok = !zone || (v >= zone[0] && v <= zone[1]);
          if (ok) { done = true; ctx.good(b, sp.okText || '딱 좋아요!'); setTimeout(function () { res(first(ctx)); }, 800); }
          else { ctx.bad(b); O.say(v < zone[0] ? (sp.low || '조금 모자라요. 다시 해 봐요') : (sp.high || '조금 넘쳤어요. 다시 해 봐요'), { noRepeat: true }); v = 0; setTimeout(function () { paint(); b.textContent = scan ? '👆 눌러서 시작' : '✋ ' + (sp.button || '꾹 누르기'); ctx.target({ get: function () { return b; } }); }, 700); }
        }
        if (scan) b.onclick = function () { on ? stop() : start(); };
        else {
          b.addEventListener('pointerdown', function (e) { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} start(); });
          ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { stop(); }); });
          b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } });
          b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
        }
      });
    });
  };

  /* ⏱ 타이밍: 바늘이 ✓ 칸에 올 때 누르기 (망치질·마사지). sp.hits 번 */
  var TW = [1, 0.42, 0.3, 0.22, 0.18];
  ST.timing = function (ctx, sp) {
    var w = sp.w || TW[ctx.level - 1], hits = sp.hits || 1;
    return begin(ctx, sp.q).then(function () {
      var art = E('div', 'hold-art ' + (sp.art || ''), sp.artHtml || '');
      var c0 = w >= 1 ? 0.5 : 0.25 + Math.random() * 0.5, zone = [Math.max(0, c0 - w / 2), Math.min(1, c0 + w / 2)];
      var g = E('div', 'gauge big', '<div class="zone" style="left:' + zone[0] * 100 + '%;width:' + (zone[1] - zone[0]) * 100 + '%">✓</div><div class="needle"></div>');
      var b = btn((sp.icon || '🔨') + ' ' + (sp.button || '탕!'), 'orange'); var cntEl = E('div', 'hits', '');
      ctx.desk.appendChild(art); ctx.desk.appendChild(g); ctx.desk.appendChild(cntEl); var r = row('center'); r.appendChild(b); ctx.desk.appendChild(r);
      var v = 0, dir = 1, got = 0, raf, speed = [0.35, 0.45, 0.55, 0.7, 0.8][ctx.level - 1] * (sp.speed || 1);
      function inZ() { return v >= zone[0] && v <= zone[1]; }
      function show() { cntEl.textContent = (sp.unit || '') + ' ' + got + ' / ' + hits; }
      show();
      ctx.target({ get: function () { return inZ() ? b : null; }, slow: 0.4 });
      var last = 0;
      function f(t) { var dt = last ? (t - last) / 1000 : 0; last = t; v += dir * speed * dt; if (v > 1) { v = 1; dir = -1; } if (v < 0) { v = 0; dir = 1; } g.querySelector('.needle').style.left = v * 100 + '%'; g.classList.toggle('in', inZ()); raf = requestAnimationFrame(f); }
      raf = requestAnimationFrame(f);
      return new Promise(function (res) {
        b.onclick = function () {
          if (inZ()) { got++; O.sfx('pop'); O.clearPrompt(); if (sp.onHit) sp.onHit(got, art); show(); art.classList.remove('hit'); void art.offsetWidth; art.classList.add('hit');
            if (got >= hits) { cancelAnimationFrame(raf); ctx.good(b, sp.okText || '잘했어요!'); setTimeout(function () { res(first(ctx)); }, 800); }
            else O.say(NUMW[got] || String(got), { noRepeat: true });
          } else { ctx.bad(b); O.say('✓ 칸에 오면 눌러요', { noRepeat: true }); }
        };
      });
    });
  };

  /* 🧽 문지르기 (사포질·닦기·밥 펴기): 손가락으로 문지르거나 여러 번 톡톡 */
  ST.rub = function (ctx, sp) {
    return begin(ctx, sp.q).then(function () {
      var area = E('div', 'rub-area ' + (sp.art || ''), (sp.artHtml || '') + '<div class="rub-dirt"></div>');
      var bar = E('div', 'draw-prog', '<span></span>');
      ctx.desk.appendChild(area); ctx.desk.appendChild(bar);
      var p = 0, need = sp.amount || [600, 900, 1200, 1500, 1500][ctx.level - 1], lx = null, ly = null, finished = false;
      ctx.target({ get: function () { return area; } });
      return new Promise(function (res) {
        function add(d) {
          if (finished) return; p = Math.min(need, p + d); var k = p / need; bar.firstChild.style.width = k * 100 + '%'; area.style.setProperty('--v', k.toFixed(3)); O.clearPrompt();
          if (Math.random() < 0.15) O.sfx('tick');
          if (k >= 1) { finished = true; ctx.good(area, sp.okText || '반짝반짝!'); setTimeout(function () { res(first(ctx)); }, 800); }
        }
        area.style.touchAction = 'none';
        area.addEventListener('pointerdown', function (e) { lx = e.clientX; ly = e.clientY; try { area.setPointerCapture(e.pointerId); } catch (x) {} add(need * 0.06); });
        area.addEventListener('pointermove', function (e) { if (lx == null) return; add(Math.hypot(e.clientX - lx, e.clientY - ly)); lx = e.clientX; ly = e.clientY; });
        area.addEventListener('pointerup', function () { lx = null; });
        area.addEventListener('click', function () { if (scanOn()) add(need * 0.2); });
      });
    });
  };

  /* 👆 여러 번 톡톡 (자르기·펴기): sp.n 번 */
  ST.tapN = function (ctx, sp) {
    var n = sp.n;
    return begin(ctx, sp.q).then(function () {
      var obj = E('button', 'tap-obj ' + (sp.art || ''), sp.artHtml || ctx.pic(sp.item || { emo: '👆' })); obj.type = 'button';
      var c = E('div', 'hits', '0 / ' + n);
      ctx.desk.appendChild(obj); ctx.desk.appendChild(c);
      ctx.target({ get: function () { return obj; } });
      return new Promise(function (res) {
        var k = 0;
        obj.onclick = function () {
          if (k >= n) return; k++; O.sfx('pop'); O.clearPrompt(); O.say(NUMW[k] || String(k), { noRepeat: true }); c.textContent = k + ' / ' + n;
          obj.classList.remove('hit'); void obj.offsetWidth; obj.classList.add('hit'); obj.style.setProperty('--v', (k / n).toFixed(3)); if (sp.onTap) sp.onTap(k, obj);
          if (k >= n) { ctx.good(obj, sp.okText || false); setTimeout(function () { res(first(ctx)); }, 700); } else ctx.target({ get: function () { return obj; } });
        };
      });
    });
  };

  /* ⏲ 기다리기: 타이머가 끝나면 종 누르기 (일찍 누르면 "아직이에요") */
  ST.wait = function (ctx, sp) {
    var sec = sp.sec || 4;
    return begin(ctx, sp.q).then(function () {
      var clock = E('div', 'wait-clock', '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="fg"/></svg><b>' + sec + '</b>');
      var bell = btn('🔔 ' + (sp.button || '다 됐어요!'), 'orange'); bell.classList.add('waiting');
      ctx.desk.appendChild(clock); var r = row('center'); r.appendChild(bell); ctx.desk.appendChild(r);
      var t0 = performance.now(), ready = false, raf;
      function f(t) { var k = Math.min(1, (t - t0) / (sec * 1000)); clock.querySelector('.fg').style.strokeDashoffset = (276 * (1 - k)).toFixed(1); clock.querySelector('b').textContent = Math.ceil(sec * (1 - k));
        if (k >= 1 && !ready) { ready = true; bell.classList.remove('waiting'); O.inst('bell', 1320); O.inst('bell', 1568, 0.25); O.say(sp.readyText || '다 됐어요! 종을 눌러요', { noRepeat: true }); ctx.target({ get: function () { return bell; } }); }
        if (!ready) raf = requestAnimationFrame(f); }
      raf = requestAnimationFrame(f);
      return new Promise(function (res) {
        bell.onclick = function () {
          if (!ready) { if (ctx.level >= 4) ctx.stats.mistakes++; O.say('아직이에요. 조금만 기다려요', { noRepeat: true }); bell.classList.remove('wobble'); void bell.offsetWidth; bell.classList.add('wobble'); return; }
          ctx.good(bell, false); setTimeout(function () { res(first(ctx)); }, 500);
        };
      });
    });
  };

  /* ♻ 나누어 담기 (+헹구기) */
  ST.sort = function (ctx, sp) {
    return begin(ctx, sp.q).then(function () {
      var rinse = !!sp.rinse;
      var bins = sp.bins.map(function (b) { var z = E('div', 'dropzone bin', '<div class="bin-ico">' + ctx.pic(b) + '</div><b>' + O.esc(b.label) + '</b><div class="bin-in"></div>'); z._b = b; return z; });
      var sink = rinse ? E('div', 'dropzone bin sink', '<div class="bin-ico"><span class="emo">🚰</span></div><b>헹구기</b>') : null;
      var items = sp.items.map(function (it) { var c = ctx.card(it, { cls: 'small' + (rinse && it.wash ? ' dirty' : '') }); c._washed = !(rinse && it.wash); return c; });
      var top = row('items'); items.forEach(function (c) { top.appendChild(c); });
      var bot = row('bins'); if (sink) bot.appendChild(sink); bins.forEach(function (z) { bot.appendChild(z); });
      ctx.desk.appendChild(top); ctx.desk.appendChild(bot);
      var left = items.length;
      function tgt() { var it = items.filter(function (x) { return !x._done; })[0]; if (!it) return; var to = !it._washed ? sink : bins.filter(function (z) { return z._b.key === it._item.bin; })[0]; ctx.target({ get: function () { return it; }, to: function () { return to; } }); }
      tgt();
      return ctx.dnd(items, sink ? [sink].concat(bins) : bins, function (it, z) {
        if (z === sink) return !it._washed;
        if (!it._washed) { O.say('먼저 물로 헹궈요', { noRepeat: true }); return false; }
        return z._b.key === it._item.bin;
      }, function (it, z) {
        if (z === sink) { it._washed = true; it._done = false; it.classList.remove('dirty'); O.sfx('water'); O.say('깨끗해졌어요!', { noRepeat: true }); tgt(); return; }
        left--; it.style.visibility = 'hidden'; z.querySelector('.bin-in').insertAdjacentHTML('beforeend', '<span class="bin-item">' + ctx.pic(it._item) + '</span>');
        O.say(it._item.label, { noRepeat: true }); ctx.good(null, false); tgt();
      }, function () { return left === 0; }).then(function () { return O.wait(500).then(function () { return first(ctx); }); });
    });
  };

  /* 📿 규칙 채우기: sp.seq(보이는 것+빈칸), sp.blanks, sp.opts */
  ST.pattern = function (ctx, sp) {
    return begin(ctx, sp.q || '규칙을 보고 빈칸에 올 구슬을 골라요').then(function () {
      var line = row('train bracelet'), blanks = [];
      sp.seq.forEach(function (s, k) { var bd = E('div', 'car bead' + (k >= sp.seq.length - sp.blanks ? ' dropzone blank' : ''), k >= sp.seq.length - sp.blanks ? '<span>?</span>' : ctx.pic(s)); if (k >= sp.seq.length - sp.blanks) { bd._s = s; blanks.push(bd); } line.appendChild(bd); });
      ctx.desk.appendChild(line);
      var opts = sp.opts.map(function (s) { var c = ctx.card(s, { noLabel: true, cls: 'small bead' }); c._s = s; return c; });
      ctx.desk.appendChild(ctx.grid(opts));
      var f = 0;
      function tgt() { var b = blanks[f]; if (b) ctx.target({ get: function () { return opts.filter(function (o) { return o._s === b._s; })[0]; } }); }
      tgt();
      return new Promise(function (res) {
        opts.forEach(function (o) {
          o.onclick = function () {
            var b = blanks[f]; if (!b) return;
            if (o._s === b._s) { b.innerHTML = ctx.pic(o._s); b.classList.remove('blank'); b.classList.add('good'); f++; O.sfx('pop'); O.clearPrompt();
              if (f >= blanks.length) { line.classList.add('shine'); ctx.good(null, '팔찌 완성!'); setTimeout(function () { res(first(ctx)); }, 900); } else tgt(); }
            else ctx.bad(o);
          };
        });
      });
    });
  };

  /* 💵 돈 받기: sp.price(원). 1~2수준 받기만, 3수준 한 장씩 세기, 4수준 필요한 만큼만 받기, 5수준 모두 얼마인지 고르기 */
  ST.pay = function (ctx, sp) {
    var n = Math.round(sp.price / 1000), lv = ctx.level, money = ctx.img('art/jj/snack/money.webp');
    var bill = function () { return '<img src="' + money + '" alt="천 원">'; };
    var won = function (k) { return (k * 1000).toLocaleString() + '원'; };
    return begin(ctx, lv <= 2 ? '손님이 돈을 주었어요. 받아요' : lv === 3 ? '천 원짜리를 한 장씩 세면서 받아요' : lv === 4 ? won(n) + '만큼 받아요' : '손님이 준 돈은 모두 얼마일까요?').then(function () {
      var reg = E('div', 'dropzone register', '<span class="dz-ico">🧾</span><b>계산대</b><div class="box-in"></div>');
      if (lv <= 2) {
        var one = E('button', 'bill-pile', bill() + '<b>' + won(n) + '</b>'); one.type = 'button'; ctx.desk.appendChild(one);
        ctx.target({ get: function () { return one; } });
        return new Promise(function (res) { one.onclick = function () { O.sfx('coin'); ctx.good(one, false); O.say(won(n) + ' 받았어요. 감사합니다', { noRepeat: true }); setTimeout(function () { res(first(ctx)); }, 900); }; });
      }
      if (lv === 5) {
        var hand = row('bills'); for (var k = 0; k < n; k++) hand.insertAdjacentHTML('beforeend', '<span class="bill">' + bill() + '</span>');
        ctx.desk.appendChild(hand);
        var opts = O.shuffle([n].concat(O.pick([1, 2, 3, 4, 5, 6].filter(function (x) { return x !== n; }), 3)));
        var bs = opts.map(function (k) { var b = E('button', 'oks-card num won', '<b>' + won(k) + '</b>'); b.type = 'button'; b._n = k; return b; });
        ctx.desk.appendChild(ctx.grid(bs));
        ctx.target({ get: function () { return bs.filter(function (b) { return b._n === n; }); } });
        return ctx.tapWait(bs, function (b) { return b._n === n; }).then(function (b) { O.sfx('coin'); ctx.good(b, false); O.say('모두 ' + won(n) + '! 감사합니다', { noRepeat: true }); return O.wait(900).then(function () { return first(ctx); }); });
      }
      var give = lv === 3 ? n : Math.min(7, n + 2);
      var pile = row('bills'), bills = [];
      for (var j = 0; j < give; j++) { var b = E('button', 'bill oks-pop', bill()); b.type = 'button'; bills.push(b); pile.appendChild(b); }
      ctx.desk.appendChild(pile); ctx.desk.appendChild(reg);
      var got = 0, doneB = lv === 4 ? btn('✔ 다 받았어요', 'orange') : null;
      if (doneB) { var dr = row('center'); dr.appendChild(doneB); ctx.desk.appendChild(dr); }
      function tgt() { if (got < n) ctx.target({ get: function () { return bills.filter(function (x) { return !x._done; })[0]; }, to: function () { return reg; } }); else if (doneB) ctx.target({ get: function () { return doneB; } }); }
      tgt();
      return new Promise(function (res) {
        ctx.dnd(bills, [reg], function () { return true; }, function (b) {
          got++; b.style.visibility = 'hidden'; reg.querySelector('.box-in').insertAdjacentHTML('beforeend', '<span class="bill mini">' + bill() + '</span>'); O.sfx('coin'); O.say(won(got), { noRepeat: true });
          if (lv === 3 && got >= n) { ctx.good(null, false); O.say('모두 ' + won(n) + '. 감사합니다', { noRepeat: true }); setTimeout(function () { res(first(ctx)); }, 1100); }
          tgt();
        }, function () { return lv === 3 && got >= n; });
        if (doneB) doneB.onclick = function () {
          if (got === n) { doneB.onclick = null; ctx.good(doneB, false); O.say(won(n) + ' 딱 맞게 받았어요. 감사합니다', { noRepeat: true }); setTimeout(function () { res(first(ctx)); }, 1000); }
          else { ctx.bad(doneB); O.say(got < n ? '조금 더 받아요' : '너무 많이 받았어요. 돌려 드려요', { noRepeat: true }); }
        };
      });
    });
  };

  /* 🚁 드론 날리기: 꾹 누르면 올라가고 떼면 내려와요. 고리를 지나 배달 */
  ST.fly = function (ctx, sp) {
    var lv = ctx.level, scan = scanOn();
    var nRing = [0, 1, 2, 3, 3][lv - 1], tol = [60, 30, 22, 16, 13][lv - 1];
    return begin(ctx, sp.q || (nRing ? '꾹 누르면 드론이 올라가요. 고리를 지나가요!' : '드론이 날아가요. 눌러서 높이를 바꿔 봐요')).then(function () {
      var sky = E('div', 'sky', '<img class="drone" src="' + ctx.img('art/jj/drone/drone.webp') + '" alt=""><img class="house" src="' + ctx.img('art/jj/drone/house.webp') + '" alt="">');
      var rings = []; for (var k = 0; k < nRing; k++) { var rg = E('div', 'ring'); var y = 20 + Math.random() * 55; rg.style.left = (25 + k * (55 / Math.max(1, nRing))) + '%'; rg.style.top = y + '%'; rg.style.height = (tol * 2 + 20) + 'px'; rg._x = parseFloat(rg.style.left); rg._y = y; sky.appendChild(rg); rings.push(rg); }
      var b = btn(scan ? '👆 올라가기 켜기/끄기' : '✋ 꾹 누르면 올라가요', 'hold-btn');
      ctx.desk.appendChild(sky); var r = row('center'); r.appendChild(b); ctx.desk.appendChild(r);
      var dr = sky.querySelector('.drone'), x = 3, y = 70, vy = 0, up = false, last = 0, raf, passed = 0;
      ctx.target({ get: function () { var nx = rings.filter(function (g) { return !g._done; })[0]; if (!nx) return null; return y > nx._y + 6 && !up ? b : null; }, slow: 0.3 });
      return new Promise(function (res) {
        function f(t) {
          var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
          x += dt * (lv === 1 ? 9 : 7); vy += (up ? -60 : 40) * dt; vy = Math.max(-35, Math.min(35, vy)); y = Math.max(5, Math.min(85, y + vy * dt));
          dr.style.left = x + '%'; dr.style.top = y + '%';
          rings.forEach(function (g) { if (!g._done && x >= g._x) { g._done = true; var h = sky.clientHeight || 300; if (Math.abs((y - g._y) / 100 * h) <= tol + 10) { passed++; g.classList.add('ok'); O.sfx('ok'); O.say('통과!', { noRepeat: true }); } else { g.classList.add('miss'); ctx.stats.mistakes++; O.sfx('no'); } } });
          if (x >= 86) { cancelAnimationFrame(raf); O.sfx('coin'); dr.classList.add('land'); ctx.good(null, nRing ? '고리 ' + passed + '개 통과!' : '배달 도착!'); setTimeout(function () { res(first(ctx)); }, 900); return; }
          raf = requestAnimationFrame(f);
        }
        raf = requestAnimationFrame(f);
        if (scan) b.onclick = function () { up = !up; O.clearPrompt(); };
        else {
          b.addEventListener('pointerdown', function (e) { e.preventDefault(); up = true; O.clearPrompt(); try { b.setPointerCapture(e.pointerId); } catch (z) {} });
          ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { up = false; }); });
          b.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); up = true; } });
          b.addEventListener('keyup', function () { up = false; });
        }
      });
    });
  };

  /* 🔘 스위치 고르기: 불빛이 카드를 차례로 비추면, 원하는 카드일 때 큰 스위치를 눌러요 */
  ST.scan = function (ctx, sp) {
    var lv = ctx.level, n = Math.min(sp.cards.length, [2, 3, 4, 4, 4][lv - 1]), speed = [2.4, 2.0, 1.8, 1.4, 1.3][lv - 1];
    var list = O.shuffle([sp.target].concat(O.shuffle(sp.cards.filter(function (c) { return c !== sp.target; })).slice(0, n - 1)));
    return begin(ctx, sp.q).then(function () {
      var cards = list.map(function (it) { return ctx.card(it, { cls: 'scan-card' }); });
      ctx.desk.appendChild(ctx.grid(cards));
      var sw = E('button', 'big-switch', '<span>스위치</span>'); sw.type = 'button';
      var r = row('center'); r.appendChild(sw); ctx.desk.appendChild(r);
      var i = -1, tm;
      function step() { cards.forEach(function (c) { c.classList.remove('lit'); }); i = (i + 1) % cards.length; cards[i].classList.add('lit'); O.sfx('tick'); if (lv <= 2) O.say(cards[i]._item.label, { noRepeat: true }); tm = setTimeout(step, speed * 1000); }
      step();
      ctx.target({ get: function () { return cards[i] && cards[i]._item === sp.target ? sw : null; }, slow: 0.35 });
      return new Promise(function (res) {
        function press() {
          var c = cards[i];
          if (c._item === sp.target) { clearTimeout(tm); document.removeEventListener('keydown', key); ctx.good(c, false); O.say(sp.sayOk || c._item.label, { noRepeat: true }); setTimeout(function () { res(first(ctx)); }, 900); }
          else { ctx.bad(c); }
        }
        function key(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(); } }
        sw.onclick = press; document.addEventListener('keydown', key);
        cards.forEach(function (c) { c.onclick = press; });
      });
    });
  };

  /* 🤝 상황 고르기 + 이유 카드 */
  ST.situation = function (ctx, sp) {
    return ST.pick(ctx, { q: sp.q, items: sp.opts, target: sp.opts[0], n: [1, 2, 3, 3, 3][ctx.level - 1], zone: false }).then(function (f) {
      ctx.clearDesk();
      var card = E('div', 'why-card oks-pop', '<span>💡</span><p>' + O.esc(sp.why) + '</p>');
      var ok = btn('알겠어요!', ''); var r = row('center'); r.appendChild(ok);
      ctx.desk.appendChild(card); ctx.desk.appendChild(r);
      O.say(sp.why, { noRepeat: true });
      ctx.target({ get: function () { return ok; } });
      return new Promise(function (res) { ok.onclick = function () { O.clearPrompt(); res(f); }; });
    });
  };
})();
