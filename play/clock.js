/* 게임 엔진 — 3D 시계 (시각과 시간)
   cfg.clock = 'parts' | 'hour' | 'half' | 'min' | 'around' | 'sec' | 'elapsed' | 'ampm' | 'routine' | 'table' | 'timer'
   문제는 math/clock3d/clock-rounds.js 가 만들고(화면 없이 검사 가능), 시계는 math/clock3d/clock-view.js(3D)가 그려요.
   3D를 쓸 수 없는 기기에서는 같은 일을 하는 2D 시계로 바뀌어요.
   모양: 읽기(read) · 만들기(make) · 바늘 누르기(hand) · 글 문제(text) · 순서(order) · 시간표(table) · 1분 체험(timer) */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var EN = window.OKS_ENGINES = window.OKS_ENGINES || {};
  var LS_TT = 'oks_clock_timetable';
  var MOD = null, TTDEF = null;

  function css() {
    if (document.getElementById('ck-css')) return;
    var s = document.createElement('style'); s.id = 'ck-css';
    s.textContent = [
      '.ck-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;}',
      '.ck-stage{position:relative;width:min(100%,760px);height:clamp(190px,40vh,400px);border-radius:26px;background:radial-gradient(circle at 50% 30%,#fffdf2,#e7efff 70%);box-shadow:inset 0 0 0 4px #d6e2ff,0 8px 20px rgba(40,60,120,.12);overflow:hidden;}',
      '.ck-stage.blur canvas,.ck-stage.blur svg{filter:blur(14px);}',
      '.ck-scene{font-size:46px;line-height:1;}',
      '.ck-note{min-height:26px;font-size:20px;color:#41507f;text-align:center;max-width:720px;}',
      '.ck-opts{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;width:100%;}',
      '.ck-opt{min-width:130px;min-height:72px;padding:6px 22px;border:0;border-radius:22px;background:#fff;color:#2c3e8f;font:inherit;font-size:clamp(24px,4vw,36px);font-weight:700;box-shadow:0 6px 0 #c9d6f2,0 10px 18px rgba(40,60,120,.14);cursor:pointer;}',
      '.ck-opt:active{transform:translateY(3px);box-shadow:0 3px 0 #c9d6f2;}',
      '.ck-opt.good{background:#e3f8e6;color:#1f8a3a;box-shadow:0 6px 0 #9fdcaa;}',
      '.ck-opt.wide{min-width:min(100%,360px);font-size:clamp(20px,3vw,28px);}',
      '.ck-adj{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;}',
      '.ck-adj button,.ck-tool{min-width:92px;min-height:60px;border:0;border-radius:18px;background:#fff8e1;color:#5a3c00;font:inherit;font-size:22px;font-weight:700;box-shadow:0 5px 0 #f0c35a;cursor:pointer;padding:4px 14px;}',
      '.ck-adj button:active{transform:translateY(3px);}',
      '.ck-go{background:#3fb05a!important;color:#fff!important;box-shadow:0 5px 0 #2c8a43!important;min-width:150px;}',
      '.ck-items{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;width:100%;}',
      '.ck-item{position:relative;width:clamp(130px,22vw,180px);padding:12px 8px;border:0;border-radius:24px;background:#fff;box-shadow:0 6px 0 #c9d6f2,0 10px 18px rgba(40,60,120,.14);font:inherit;color:#2c3e8f;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;}',
      '.ck-item .e{font-size:46px;line-height:1.1;} .ck-item .tx{font-size:20px;font-weight:700;} .ck-item .tm{font-size:24px;font-weight:700;color:#e0572f;}',
      '.ck-item.good{background:#e3f8e6;box-shadow:0 6px 0 #9fdcaa;} .ck-item .no{position:absolute;top:-10px;left:-6px;width:38px;height:38px;border-radius:50%;background:#3fb05a;color:#fff;font-size:22px;display:none;align-items:center;justify-content:center;font-weight:700;}',
      '.ck-item.good .no{display:flex;}',
      '.ck-table{border-collapse:separate;border-spacing:0;background:#fff;border-radius:20px;box-shadow:0 6px 16px rgba(40,60,120,.14);overflow:hidden;font-size:clamp(20px,3.2vw,28px);color:#2c3e8f;}',
      '.ck-table th{background:#8fa6ff;color:#fff;padding:8px 22px;} .ck-table td{padding:8px 22px;border-top:2px solid #eef2ff;text-align:center;font-weight:700;} .ck-table tr.hi td{background:#fff3c4;}',
      '.ck-bar{width:min(100%,520px);height:26px;border-radius:13px;background:#e3e9ff;overflow:hidden;box-shadow:inset 0 2px 4px rgba(0,0,0,.1);} .ck-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4cc3ff,#3fb05a);}',
      '.ck-task{font-size:clamp(26px,4.4vw,40px);font-weight:700;color:#2c3e8f;}',
      '.ck-svg text{font-family:inherit;} .ck-hand{cursor:pointer} .ck-hand.pulse{filter:drop-shadow(0 0 6px #ffd54f);}',
      '.ck-dig2d{font-family:"Courier New",monospace;font-size:34px;font-weight:700;color:#0a6e7a;background:#0e2230;color:#8ffcff;padding:4px 18px;border-radius:12px;position:absolute;right:12px;bottom:10px;}',
      '.ck-tt label{display:flex;gap:8px;align-items:center;margin:4px 0;font-size:20px;} .ck-tt input{font:inherit;font-size:20px;padding:6px 10px;border-radius:10px;border:2px solid #c9d6f2;min-width:0;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- 2D 시계 (3D를 못 쓸 때, 그리고 작은 시계) ---------- */
  function svgClock(t, o) {
    o = o || {}; var s = o.size || 200, c = s / 2, r = c - 6, m = ((t % 60) + 60) % 60, hh = ((t / 60) % 12), sec = o.s || 0;
    function hand(deg, len, w, col, key) { var rad = (deg - 90) * Math.PI / 180; return '<line class="ck-hand" data-h="' + (key || '') + '" x1="' + c + '" y1="' + c + '" x2="' + (c + Math.cos(rad) * len).toFixed(1) + '" y2="' + (c + Math.sin(rad) * len).toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }
    var nums = '';
    for (var i = 1; i <= 12; i++) { var a = (i * 30 - 90) * Math.PI / 180; nums += '<text x="' + (c + Math.cos(a) * r * .78).toFixed(1) + '" y="' + (c + Math.sin(a) * r * .78 + s * .05).toFixed(1) + '" font-size="' + (s * .12).toFixed(0) + '" text-anchor="middle" fill="#2b3f5c" font-weight="700">' + i + '</text>'; }
    var ticks = ''; for (var k = 0; k < 60; k++) { var b = (k * 6 - 90) * Math.PI / 180, l = k % 5 ? .03 : .06; ticks += '<line x1="' + (c + Math.cos(b) * r * (1 - l)).toFixed(1) + '" y1="' + (c + Math.sin(b) * r * (1 - l)).toFixed(1) + '" x2="' + (c + Math.cos(b) * r).toFixed(1) + '" y2="' + (c + Math.sin(b) * r).toFixed(1) + '" stroke="#8a97bd" stroke-width="' + (k % 5 ? 1 : 2) + '"/>'; }
    return '<svg class="ck-svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (o.px || s) + '" height="' + (o.px || s) + '" role="img" aria-label="시계"><circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="#fffdf6" stroke="#e7b34a" stroke-width="6"/>' + ticks + nums +
      hand(hh * 30 + m * .5, r * .5, s * .045, o.mono ? '#2b3f5c' : '#e53935', 'hour') + hand(m * 6 + sec * .1, r * .78, s * .03, o.mono ? '#2b3f5c' : '#1e88e5', 'minute') + (o.secHand ? hand(sec * 6, r * .85, s * .012, '#2e9d4f', 'second') : '') + '<circle cx="' + c + '" cy="' + c + '" r="' + (s * .03) + '" fill="#f4b73f"/></svg>';
  }
  /* 3D 대신 쓰는 2D 시계: 같은 이름의 함수를 가진 가짜 view */
  function flatView(box) {
    var S = { t: 15 * 60, s: 0, secHand: false, blank: true, digT: null, pulse: null, drag: null }, cb = {};
    var wrap = E('div', 'ck-flat'); wrap.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    var dg = E('div', 'ck-dig2d'); box.appendChild(wrap); box.appendChild(dg);
    function draw() {
      var h = Math.min(box.clientHeight || 300, 360);
      wrap.innerHTML = svgClock(S.t, { size: 240, px: h - 10, secHand: S.secHand || S.s > 0, s: S.s });
      var t = S.digT == null ? S.t : S.digT, hh = ((Math.floor(t / 60) + 11) % 12) + 1, mi = ((t % 60) + 60) % 60;
      dg.textContent = S.blank ? '–:––' : hh + ':' + (mi < 10 ? '0' : '') + mi; dg.style.display = S.hideDig ? 'none' : '';
      if (S.pulse) { var p = wrap.querySelector('[data-h="' + S.pulse + '"]'); if (p) p.classList.add('pulse'); }
      wrap.querySelectorAll('.ck-hand').forEach(function (e) { e.onclick = function () { if (cb.hand) cb.hand(e.getAttribute('data-h')); }; });
    }
    var v = {
      flat: true,
      setTime: function (t, s) { S.t = ((Math.round(t) % 1440) + 1440) % 1440; S.s = s || 0; draw(); },
      getTime: function () { return { t: S.t, s: S.s }; },
      setView: function (x) { S.hideDig = x === 'ana'; draw(); }, setRun: function () {}, setSecHand: function (b) { S.secHand = !!b; draw(); },
      setDigital: function (o) { if (o && 'blank' in o) S.blank = o.blank; draw(); }, setDigitalTime: function (t) { S.digT = t; draw(); },
      setDrag: function () {}, onChange: function () {}, onDragEnd: function () {}, onHand: function (f) { cb.hand = f; },
      pulse: function (n) { S.pulse = n; draw(); }, resize: draw, destroy: function () { wrap.remove(); dg.remove(); }
    };
    draw(); return v;
  }

  function loadMod() {
    if (MOD) return MOD;
    var base = new URL(O.ROOT + 'math/clock3d/', location.href).href;
    MOD = Promise.all([import(base + 'clock-rounds.js'), import(base + 'clock-view.js').catch(function (e) { console.warn('3D 시계를 못 불러 2D로 바꿔요', e); return null; })]).then(function (a) { return { R: a[0], V: a[1] }; });
    return MOD;
  }
  function canGL() { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

  /* ---------- 우리 반 시간표 ---------- */
  function getTT() { try { var r = JSON.parse(localStorage.getItem(LS_TT) || 'null'); if (r && r.length >= 3) return r; } catch (e) {} return null; }
  function editTT(done) {
    var cur = getTT() || TTDEF || [];
    var ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish ck-tt');
    box.innerHTML = '<h2>🏫 우리 반 시간표</h2><p>시각과 하는 일을 적어요. (3~6줄)</p>';
    var rows = [];
    for (var i = 0; i < 6; i++) { var r = cur[i] || {}; var l = E('label'); l.innerHTML = '<input class="tm" size="6" placeholder="9:00" value="' + O.esc(r.time || '') + '"><input class="ac" size="10" placeholder="국어" value="' + O.esc(r.act || '') + '">'; box.appendChild(l); rows.push(l); }
    var bt = E('div', 'btns');
    var ok = E('button', 'oks-btn', '저장'), rs = E('button', 'oks-btn orange', '처음 시간표로'), cl = E('button', 'oks-btn blue', '닫기');
    [ok, rs, cl].forEach(function (b) { b.type = 'button'; bt.appendChild(b); });
    ok.onclick = function () {
      var list = rows.map(function (l) { return { time: l.querySelector('.tm').value.trim(), act: l.querySelector('.ac').value.trim(), e: '📘' }; }).filter(function (x) { return /^\d{1,2}:\d{2}$/.test(x.time) && x.act; });
      if (list.length < 3) { O.toast('시각(예: 9:00)과 하는 일을 3줄 이상 적어요'); return; }
      try { localStorage.setItem(LS_TT, JSON.stringify(list)); } catch (e) {} ov.remove(); done();
    };
    rs.onclick = function () { try { localStorage.removeItem(LS_TT); } catch (e) {} ov.remove(); done(); };
    cl.onclick = function () { ov.remove(); };
    box.appendChild(bt); ov.appendChild(box); document.body.appendChild(ov);
  }

  function sayP(t) { return O.say(t, { noRepeat: true }); }
  function label(r, text) { return r.fmt === 'dig' ? text : text; }

  EN.clock = {
    rounds: [3, 4, 5, 5, 4],
    setup: function (ctx) {
      css();
      return loadMod().then(function (m) {
        ctx._R = m.R; TTDEF = m.R.TABLE_DEFAULT;
        ctx._stage = E('div', 'ck-stage');
        document.body.classList.add('ck-on');
        var need3d = ['timer', 'routine', 'table'].indexOf(ctx.cfg.clock) < 0 || true;
        if (m.V && canGL()) {
          return m.V.createClockView(ctx._stage, {}).then(function (v) { ctx._view = v; }).catch(function (e) { console.warn(e); ctx._view = flatView(ctx._stage); });
        }
        ctx._view = flatView(ctx._stage);
      });
    },
    round: function (ctx, i) {
      var c = ctx.cfg, lv = ctx.level, R = ctx._R, v = ctx._view;
      var opt = {}; var tt = getTT(); if (c.clock === 'table' && tt) opt.rows = tt;
      var r = R.makeRound(c.clock, lv, null, opt); ctx.cur = r;
      ctx.clear();
      var wrap = E('div', 'ck-wrap'); ctx.board.appendChild(wrap);
      if (r.mode === 'order') return orderRound(ctx, r, wrap);
      if (r.mode === 'table') return tableRound(ctx, r, wrap);
      /* 시계 무대 */
      v.setDrag(null); v.pulse(null); v.setRun(0); v.onHand(null); v.onChange(function () {}); v.onDragEnd(function () {});
      v.setView(r.view || 'both'); v.setSecHand(!!r.secHand); v.setDigitalTime(null);
      v.setDigital({ blank: r.dig === 'blank', sec: !!r.secHand, ampm: c.clock === 'ampm' });
      v.setTime(r.mode === 'make' ? r.start : r.t, r.s || 0, { jump: true });
      if (r.mode === 'make') v.setDigitalTime(r.t);
      if (r.dig === 'none') v.setDigital({ blank: true });
      wrap.appendChild(ctx._stage); if (v.resize) v.resize();
      var note = E('div', 'ck-note'); wrap.appendChild(note);
      if (r.mode === 'read' || r.mode === 'text') return readRound(ctx, r, wrap, note);
      if (r.mode === 'make') return makeRound(ctx, r, wrap, note);
      if (r.mode === 'hand') return handRound(ctx, r, wrap, note);
      if (r.mode === 'timer') return timerRound(ctx, r, wrap, note);
      return Promise.resolve();
    }
  };

  /* ===== 읽기 · 글 문제 ===== */
  function readRound(ctx, r, wrap, note) {
    var v = ctx._view, lv = ctx.level;
    if (r.scene) { var sc = E('div', 'ck-scene', r.scene); wrap.insertBefore(sc, ctx._stage); }
    var box = E('div', 'ck-opts'); wrap.appendChild(box);
    var btns = r.opts.map(function (o) { var b = E('button', 'ck-opt' + (r.mode === 'text' ? ' wide' : ''), O.esc(o.label)); b.type = 'button'; b._ok = o.ok; b._label = o.label; box.appendChild(b); return b; });
    v.onHand(function (h) { if (lv <= 2 || r.mode === 'hand') sayP({ hour: '짧은바늘은 시를 알려 줘요', minute: '긴바늘은 분을 알려 줘요', second: '초침은 초를 알려 줘요' }[h]); });
    var okBtn = btns.filter(function (b) { return b._ok; })[0];
    var go = function () {
      ctx.target({ get: function () { return okBtn; } });
      return new Promise(function (res) {
        (function next() {
          ctx.tapWait(btns, function (e) { return e._ok; }, function () {
            if (lv <= 3) { note.textContent = '짧은바늘은 시, 긴바늘은 분이에요'; v.pulse(r.t % 60 === 0 ? 'hour' : 'minute'); } else if (lv === 4) note.textContent = '시계를 다시 살펴봐요';
          }).then(function (e) {
            ctx.good(e); v.pulse(null);
            if (r.dig === 'blank') { v.setDigital({ blank: false }); }
            note.textContent = r.explain || '';
            var after = lv <= 3 ? sayP((r.explain || '').replace(/\(\d+분\)/g, '')) : O.wait(600);
            Promise.resolve(after).then(function () { return O.wait(lv <= 3 ? 900 : 500); }).then(res);
          });
        })();
      });
    };
    /* 걸린 시간: 시작 시각을 보여 준 뒤 바늘이 끝 시각으로 가요 */
    var intro = ctx.ask(r.q, { speak: r.say || r.q });
    return Promise.resolve(intro).then(function () {
      if (r.t2 != null) return O.wait(1200).then(function () { note.textContent = '⏱ 바늘이 움직여요…'; v.setTime(r.t2, 0); return O.wait(2200); }).then(function () { note.textContent = ''; });
      if (lv === 1 && r.mode === 'read') { v.pulse('hour'); return O.wait(1100).then(function () { v.pulse('minute'); return O.wait(1100); }).then(function () { v.pulse(null); }); }
    }).then(go);
  }

  /* ===== 바늘 누르기 ===== */
  function handRound(ctx, r, wrap, note) {
    var v = ctx._view, lv = ctx.level, done = false;
    return Promise.resolve(ctx.ask(r.q, { speak: r.say })).then(function () {
      if (lv === 1) v.pulse(r.hand);
      return new Promise(function (res) {
        v.onHand(function (h) {
          if (done) return;
          if (h === r.hand) { done = true; v.pulse(null); ctx.good(null); note.textContent = r.explain; Promise.resolve(sayP(r.explain)).then(function () { return O.wait(700); }).then(res); }
          else { ctx.bad(null); note.textContent = '다시 눌러 봐요'; if (lv <= 3) v.pulse(r.hand); }
        });
        /* 바늘을 못 찾을 때: 누를 곳이 없어 막히지 않도록 큰 단추도 둬요 */
        var box = E('div', 'ck-opts'); wrap.appendChild(box);
        [['hour', '짧은바늘'], ['minute', '긴바늘']].concat(r.secHand ? [['second', '초침']] : []).forEach(function (p) {
          var b = E('button', 'ck-opt', p[1]); b.type = 'button'; box.appendChild(b);
          b.onclick = function () { if (done) return; if (p[0] === r.hand) { done = true; v.pulse(null); b.classList.add('good'); ctx.good(b); note.textContent = r.explain; Promise.resolve(sayP(r.explain)).then(function () { return O.wait(700); }).then(res); } else { ctx.bad(b); if (lv <= 3) v.pulse(r.hand); } };
        });
      });
    });
  }

  /* ===== 시각 만들기 ===== */
  function makeRound(ctx, r, wrap, note) {
    var v = ctx._view, lv = ctx.level, tg = r.target, finished = false, idle = null, miss = 0;
    var step = tg.step;
    var same = function () { var s = v.getTime().t; return (((s / 60) | 0) % 12 === ((r.t / 60) | 0) % 12) && s % 60 === r.t % 60; };
    v.setDrag({ kind: tg.kind, step: step });
    var adj = E('div', 'ck-adj'); wrap.appendChild(adj);
    var opts = step === 60 ? [['−1시간', -60], ['+1시간', 60]] : step === 30 ? [['−30분', -30], ['+30분', 30], ['+1시간', 60]] : step === 5 ? [['−1시간', -60], ['−5분', -5], ['+5분', 5], ['+1시간', 60]] : [['−5분', -5], ['−1분', -1], ['+1분', 1], ['+5분', 5], ['+1시간', 60]];
    opts.forEach(function (p) { var b = E('button', '', p[0]); b.type = 'button'; b.onclick = function () { if (finished) return; var cur = v.getTime().t; v.setTime(cur + p[1], 0); changed(); }; adj.appendChild(b); });
    var ok = E('button', 'ck-tool ck-go', '✔ 다 맞췄어요'); ok.type = 'button'; if (r.auto) ok.style.display = 'none'; wrap.appendChild(ok);
    function wrongHand() { var s = v.getTime().t; return ((s / 60) | 0) % 12 !== ((r.t / 60) | 0) % 12 ? 'hour' : 'minute'; }
    function resetIdle() { clearTimeout(idle); if (finished) return; idle = setTimeout(function () { if (finished) return; var h = wrongHand(); v.pulse(h); note.textContent = h === 'hour' ? '짧은바늘(시)을 움직여 봐요' : '긴바늘(분)을 움직여 봐요'; sayP(note.textContent); }, lv <= 3 ? 12000 : 25000); }
    return Promise.resolve(ctx.ask(r.q, { speak: r.say })).then(function () {
      return new Promise(function (res) {
        function win() {
          if (finished) return; finished = true; clearTimeout(idle); v.setDrag(null); v.pulse(null); v.setDigitalTime(null); v.setDigital({ blank: false });
          ctx.good(ok); note.textContent = r.explain;
          Promise.resolve(lv <= 3 ? sayP(r.ans + '이에요. ' + r.explain) : O.wait(500)).then(function () { return O.wait(900); }).then(res);
        }
        function lose() {
          miss++; ctx.bad(ok); var h = wrongHand();
          note.textContent = h === 'hour' ? '짧은바늘이 ' + (((r.t / 60) | 0) % 12 || 12) + ' 근처에 있어야 해요' : '긴바늘이 ' + (r.t % 60 / 5) + '에 있어야 해요 (' + (r.t % 60) + '분)';
          if (lv <= 3) v.pulse(h);
          if (miss >= 3 && lv <= 3) { v.setTime(r.t, 0); note.textContent = '이렇게 맞춰요. ' + r.ans; }
        }
        function changed() { v.pulse(null); resetIdle(); if (r.auto && same()) win(); }
        ctx._poke = changed; /* 점검용 */
        v.onChange(function () { changed(); }); v.onDragEnd(function () { if (r.auto && same()) win(); });
        ok.onclick = function () { if (finished) return; if (same()) win(); else lose(); };
        ctx.target({ get: function () { return r.auto ? adj : ok; } });
        resetIdle();
      });
    });
  }

  /* ===== 1분 체험 ===== */
  function timerRound(ctx, r, wrap, note) {
    var v = ctx._view, lv = ctx.level;
    var task = E('div', 'ck-task', O.esc(r.task)); wrap.insertBefore(task, ctx._stage);
    var bar = E('div', 'ck-bar'); var fill = E('i'); bar.appendChild(fill); wrap.appendChild(bar);
    var btn = E('button', 'ck-tool ck-go', r.estimate ? '시작!' : '시작!'); btn.type = 'button'; wrap.appendChild(btn);
    return Promise.resolve(ctx.ask(r.q, { speak: r.say })).then(function () {
      v.setView('ana'); v.setSecHand(true);
      ctx.target({ get: function () { return btn; } });
      return new Promise(function (res) {
        btn.onclick = function () {
          O.clearPrompt(); O.unlock && O.unlock(); var t0 = Date.now(), fin = false, TS = window.OKS_CLOCK_TEST ? 20 : 1;
          v.setTime(r.t, 0, { jump: true }); v.setRun(1);
          if (r.estimate) { ctx._stage.classList.add('blur'); btn.textContent = '지금이야!'; note.textContent = '속으로 ' + r.secs + '초를 세어 봐요…'; }
          else { btn.style.display = 'none'; note.textContent = '초침을 보며 ' + r.task; }
          function finish(good, msg) { if (fin) return; fin = true; clearInterval(tm); v.setRun(0); ctx._stage.classList.remove('blur'); btn.style.display = 'none'; fill.style.width = '100%';
            note.textContent = msg; if (good) ctx.good(null); else { ctx.stats.mistakes++; O.sfx('no'); }
            Promise.resolve(sayP(msg)).then(function () { return O.wait(900); }).then(res); }
          var tm = setInterval(function () {
            var el = (Date.now() - t0) / 1000 * TS; if (!r.estimate) fill.style.width = Math.min(100, el / r.secs * 100) + '%';
            if (!r.estimate && el >= r.secs) finish(true, r.secs + '초가 지났어요! ' + r.explain);
            if (r.estimate && el > r.secs * 2 + 5) finish(false, '시간이 많이 지났어요. 초침을 보며 다시 해 봐요');
          }, 100);
          if (r.estimate) btn.onclick = function () { var el = (Date.now() - t0) / 1000 * TS, d = el - r.secs; var tol = Math.max(4, r.secs * .25);
            if (Math.abs(d) <= tol) finish(true, '진짜 ' + el.toFixed(0) + '초! ' + r.secs + '초를 잘 느꼈어요'); else finish(false, (d < 0 ? '조금 빨랐어요. ' : '조금 늦었어요. ') + el.toFixed(0) + '초가 지났어요'); };
        };
      });
    });
  }

  /* ===== 하루 일과 순서 ===== */
  function orderRound(ctx, r, wrap) {
    var lv = ctx.level, K = ctx._R;
    var box = E('div', 'ck-items'); wrap.appendChild(box);
    var els = r.items.map(function (it) {
      var b = E('button', 'ck-item'); b.type = 'button'; b._o = it.order;
      var tm = r.show === 'dig' ? '<div class="tm">' + O.esc(K.kor(it.t, true)) + '</div>' : svgClock(it.t, { size: 120, px: 92, mono: true });
      b.innerHTML = '<span class="no"></span><div class="e">' + it.e + '</div><div class="tx">' + O.esc(it.txt) + '</div>' + (lv === 1 ? '' : tm); if (lv === 1) b.insertAdjacentHTML('beforeend', '<div class="tm">' + O.esc(K.kor(it.t, true)) + '</div>');
      box.appendChild(b); return b;
    });
    var next = 0, note = E('div', 'ck-note'); wrap.appendChild(note);
    return Promise.resolve(ctx.ask(r.q, { speak: r.say })).then(function () {
      return new Promise(function (res) {
        (function step() {
          ctx.target({ get: function () { return els.filter(function (e) { return e._o === next; }); } });
          ctx.tapWait(els, function (e) { return !e._done && e._o === next; }, function () { note.textContent = '시각이 더 이른 것부터 눌러요'; }).then(function (e) {
            e._done = true; e.classList.add('good'); e.querySelector('.no').textContent = next + 1; ctx.good(e, next + 1 >= els.length ? undefined : false);
            Promise.resolve(sayP(r.items.filter(function (x) { return x.order === next; })[0].txt)).then(function () {
              next++; if (next >= els.length) { note.textContent = r.explain; return O.wait(1200).then(res); } step();
            });
          });
        })();
      });
    });
  }

  /* ===== 시간표 읽기 ===== */
  function tableRound(ctx, r, wrap) {
    var lv = ctx.level;
    var tb = E('table', 'ck-table'); tb.innerHTML = '<tr><th>시각</th><th>하는 일</th></tr>' + r.rows.map(function (x, k) { return '<tr class="' + (k === r.hi ? 'hi' : '') + '"><td>' + O.esc(x.time) + '</td><td>' + (x.e || '') + ' ' + O.esc(x.act) + '</td></tr>'; }).join('');
    wrap.appendChild(tb);
    var box = E('div', 'ck-opts'); wrap.appendChild(box);
    var btns = r.opts.map(function (o) { var b = E('button', 'ck-opt', O.esc(o.label)); b.type = 'button'; b._ok = o.ok; box.appendChild(b); return b; });
    var tools = E('div', 'ck-adj'); var ed = E('button', '', '✏️ 우리 반 시간표'); ed.type = 'button'; ed.onclick = function () { editTT(function () { location.reload(); }); }; tools.appendChild(ed); wrap.appendChild(tools);
    var note = E('div', 'ck-note'); wrap.appendChild(note);
    var okBtn = btns.filter(function (b) { return b._ok; })[0];
    return Promise.resolve(ctx.ask(r.q, { speak: r.say })).then(function () {
      ctx.target({ get: function () { return okBtn; } });
      return ctx.tapWait(btns, function (e) { return e._ok; }, function () { note.textContent = lv <= 3 ? '시간표에서 줄을 찾아 읽어 봐요' : ''; }).then(function (e) {
        ctx.good(e); note.textContent = r.explain; return O.wait(1000);
      });
    });
  }
})();
