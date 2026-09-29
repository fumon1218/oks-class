/* 차시 실행기: ?id=<활동ID>&level=1~5
   교육과정(lessons.js)에서 차시를, 내용표(content.js)에서 게임 종류와 소재를 찾아 게임 엔진(engines.js)을 돌립니다. */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var DATA = window.OKS_LESSONS, CONTENT = window.OKS_CONTENT || {}, ENGINES = window.OKS_ENGINES || {};
  var ROUNDS = [4, 5, 5, 6, 5];
  var NOPT = [1, 2, 3, 4, 4];

  var id = O.qs('id') || '02-01-01-01';
  var lesson = DATA.lessons.filter(function (l) { return l.id === id; })[0];
  if (!lesson) { document.body.classList.add('oks'); document.body.innerHTML = '<div class="oks-app"><div class="oks-board">차시를 찾을 수 없어요. <a href="../learn/">배움 지도로</a></div></div>'; return; }
  var base = CONTENT[id];
  var level = O.levelFor(id);

  function cfgFor(lv) {
    var c = Object.assign({}, base || {});
    if (c.byLevel && c.byLevel[lv]) c = Object.assign(c, c.byLevel[lv]);
    return c;
  }
  var sh = O.shell({
    title: lesson.subjectName + ' ' + lesson.no + ' · ' + lesson.topic,
    subtitle: '〈' + lesson.space + '〉 ' + lesson.goal,
    back: '../learn/?subject=' + lesson.subject + '&school=' + lesson.school + '#' + id,
    level: level
  });
  document.title = lesson.topic + ' · 옥쌤의 즐거운 교실';

  /* 수준 바꾸기 (선생님용) */
  sh.levelBtn.onclick = function () {
    var ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish oks-levelpick');
    box.innerHTML = '<h2>수준 고르기</h2><p>' + O.esc(lesson.topic) + '</p><div class="btns"></div><div class="note">수준을 바꾸면 처음부터 다시 시작해요.</div>';
    O.LEVELS.forEach(function (L) {
      var b = E('button', 'oks-lv' + (L.n === level ? ' on' : ''), '<b>' + L.n + '</b><span><strong>' + L.name + '</strong><small>' + O.esc(lesson.levels[L.n - 1].replace(/^〈[^〉]*〉\s*/, '')) + '</small></span>');
      b.type = 'button'; b.onclick = function () { O.rememberLevel(id, L.n); location.href = '?id=' + id + '&level=' + L.n; };
      box.querySelector('.btns').appendChild(b);
    });
    var close = E('button', 'oks-btn blue', '닫기'); close.type = 'button'; close.onclick = function () { ov.remove(); };
    box.querySelector('.btns').appendChild(close);
    ov.appendChild(box); document.body.appendChild(ov);
  };

  if (!base || !ENGINES[cfgFor(level).engine]) { plan(); return; }

  /* ---------- 준비 중 차시: 수준별 계획만 보여주기 ---------- */
  function plan() {
    sh.ask('이 차시 게임은 준비 중이에요. 선생님과 함께 계획을 살펴봐요.', { silent: true });
    sh.board.innerHTML = '<div class="plan"><h3>' + O.esc(lesson.topic) + ' <small>' + O.esc(lesson.goal) + '</small></h3><ol>' +
      lesson.levels.map(function (t, i) { return '<li><b>' + O.LEVELS[i].name + '</b> ' + O.esc(t.replace(/^〈[^〉]*〉\s*/, '')) + '</li>'; }).join('') + '</ol><p class="src">기록: ' + O.esc(lesson.record) + '</p></div>';
  }

  /* ---------- 게임 도우미(ctx) ---------- */
  var st = O.newStats();
  var ctx = {
    lesson: lesson, id: id, level: level, sh: sh, board: sh.board, stats: st,
    cfg: cfgFor(level), nOpt: NOPT[level - 1], rounds: ROUNDS[level - 1],
    O: O, el: E, wait: O.wait, shuffle: O.shuffle, pick: O.pick, say: O.say, sfx: O.sfx,
    img: function (p) { return /^(https?:|data:|\.\.?\/)/.test(p) ? p : O.ROOT + p; },
    ask: function (t, o) { return sh.ask(t, o); },
    target: function (t) { O.target(t, level); },
    untarget: function () { O.target(null); },
    clear: function () { O.clearPrompt(); sh.board.innerHTML = ''; sh.board.className = 'oks-board'; },
    scene: function (kind) { sh.board.className = 'oks-board ' + (kind || ''); },
    progress: function (i, n) { sh.setRounds(n, i); }
  };
  /* 그림 카드 */
  ctx.pic = function (item) {
    var sc = item.scale ? ' style="transform:scale(' + item.scale + ')"' : '';
    if (item.svg) return item.svg;
    if (item.img) return '<img src="' + ctx.img(item.img) + '" alt=""' + sc + '>';
    if (item.color) return '<span class="swatch" style="background:' + item.color + '"></span>';
    return '<span class="emo"' + sc + '>' + (item.emo || '❓') + '</span>';
  };
  ctx.card = function (item, o) {
    o = o || {};
    var c = E('button', 'oks-card oks-pop' + (o.big ? ' big' : '') + (o.cls ? ' ' + o.cls : ''));
    c.type = 'button';
    c.innerHTML = '<div class="pic">' + ctx.pic(item) + '</div>' + (o.noLabel ? '' : '<div class="lab">' + O.esc(o.label != null ? o.label : item.label || '') + '</div>');
    c._item = item;
    return c;
  };
  ctx.grid = function (els, cols) {
    var g = E('div', 'oks-grid');
    var n = cols || els.length; if (n > 4) n = Math.ceil(n / 2) <= 4 ? Math.ceil(n / 2) : 4;
    g.style.gridTemplateColumns = 'repeat(' + n + ', minmax(0, ' + (els.length === 1 ? 300 : 220) + 'px))';
    els.forEach(function (e) { g.appendChild(e); });
    return g;
  };
  /* 항목을 소리/말로 들려주기 */
  ctx.voice = function (item, how) {
    how = how || ctx.cfg.voice || 'label';
    if (item.inst) { O.inst(item.inst, item.freq); if (how === 'inst') return O.wait(700); }
    if (how === 'en' && item.en) return O.say(item.en, { lang: 'en-US', noRepeat: true });
    if (how === 'sound' && item.snd) return O.say(item.snd, { noRepeat: true, rate: 0.9 });
    return O.say(item.sayAs || item.label, { noRepeat: true });
  };
  ctx.good = function (el, text) {
    O.clearPrompt(); O.sfx('ok');
    if (el) { el.classList.add('good'); }
    if (text !== false) O.praise(text);
  };
  var stepMiss = 0;
  ctx.bad = function (el) {
    O.sfx('no'); st.mistakes++; stepMiss++;
    if (el) { el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble'); }
    sh.mood('soft');
    if (level <= 3) O.showNow(stepMiss >= 2 ? 'hand' : 'glow');
    else if (stepMiss >= 3) O.showNow('glow');
    O.say(['다시 해 볼까요?', '괜찮아요, 한 번 더!', '천천히 다시 봐요.'][stepMiss % 3], { noRepeat: true });
  };
  ctx.newStep = function () { stepMiss = 0; sh.mood('idle'); };

  /* 누르기 기다리기: right(el) 이 참인 것을 누를 때까지. 틀리면 흔들림 + 촉진 */
  ctx.tapWait = function (els, right, onWrong) {
    return new Promise(function (res) {
      els.forEach(function (e) {
        e.onclick = function () {
          if (e.classList.contains('dim') || e._done) return;
          if (right(e)) { els.forEach(function (x) { x.onclick = null; }); res(e); }
          else { ctx.bad(e); if (onWrong) onWrong(e); }
        };
      });
    });
  };

  /* 옮기기(끌어다 놓기 + 눌러서 고르고 눌러서 놓기 둘 다 됨)
     items: 옮길 요소들, zones: 놓을 곳들, check(item, zone) → true면 성공
     성공할 때마다 onPlace(item, zone) 실행, done() 이 true를 돌려주면 끝 */
  ctx.dnd = function (items, zones, check, onPlace, done) {
    return new Promise(function (res) {
      var sel = null, drag = null;
      function select(it) { if (sel) sel.classList.remove('sel'); sel = it; if (it) it.classList.add('sel'); }
      function tryPlace(it, z) {
        if (!it || !z) return;
        if (check(it, z)) {
          it._done = true; it.classList.remove('sel'); select(null);
          O.sfx('pop'); O.clearPrompt();
          var r = onPlace(it, z);
          if (done()) { cleanup(); res(); }
          return r;
        } else { ctx.bad(it); select(null); }
      }
      function zoneAt(x, y) { /* 겹쳐 있으면 가운데가 가장 가까운 곳 */
        var best = null, bd = 1e9;
        for (var i = 0; i < zones.length; i++) { var r = zones[i].getBoundingClientRect(); if (x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12) {
          var d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) / Math.max(20, Math.min(r.width, r.height)); if (d < bd) { bd = d; best = zones[i]; } } }
        return best;
      }
      function down(e) {
        var it = e.currentTarget; if (it._done) return;
        var r = it.getBoundingClientRect();
        drag = { it: it, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, ghost: null, moved: false, w: r.width, h: r.height };
        try { it.setPointerCapture(e.pointerId); } catch (x) {}
      }
      function move(e) {
        if (!drag) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 10) {
          drag.moved = true;
          var g = drag.it.cloneNode(true); g.classList.add('ghost'); g.classList.remove('oks-glow', 'oks-pop');
          g.style.width = drag.w + 'px'; g.style.height = drag.h + 'px'; document.body.appendChild(g); drag.ghost = g;
          drag.it.classList.add('lifted'); O.sfx('tick');
        }
        if (drag.ghost) {
          drag.ghost.style.transform = 'translate(' + (e.clientX - drag.dx) + 'px,' + (e.clientY - drag.dy) + 'px)';
          zones.forEach(function (z) { z.classList.remove('hover'); }); var z = zoneAt(e.clientX, e.clientY); if (z) z.classList.add('hover');
        }
      }
      function up(e) {
        if (!drag) return; var d = drag; drag = null;
        zones.forEach(function (z) { z.classList.remove('hover'); });
        if (d.ghost) { d.ghost.remove(); d.it.classList.remove('lifted'); var z = zoneAt(e.clientX, e.clientY); if (z) tryPlace(d.it, z); }
        else { if (sel === d.it) select(null); else { select(d.it); O.sfx('tick'); } }
      }
      function zclick(e) { if (sel) tryPlace(sel, e.currentTarget); }
      items.forEach(function (it) { it.style.touchAction = 'none'; it.addEventListener('pointerdown', down); it.addEventListener('pointermove', move); it.addEventListener('pointerup', up); it.addEventListener('pointercancel', up); it.onclick = null; });
      zones.forEach(function (z) { z.addEventListener('click', zclick); });
      function cleanup() {
        items.forEach(function (it) { it.removeEventListener('pointerdown', down); it.removeEventListener('pointermove', move); it.removeEventListener('pointerup', up); it.removeEventListener('pointercancel', up); });
        zones.forEach(function (z) { z.removeEventListener('click', zclick); });
      }
    });
  };
  /* 요소를 다른 곳으로 날려 보내기(애니메이션) */
  ctx.fly = function (from, to, html) {
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var f = E('div', 'oks-fly', html || from.innerHTML); document.body.appendChild(f);
    f.style.width = a.width + 'px'; f.style.height = a.height + 'px'; f.style.left = a.left + 'px'; f.style.top = a.top + 'px';
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var an = f.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.45)', opacity: .6 }], { duration: O.settings().calm ? 10 : 520, easing: 'ease-in' });
    return new Promise(function (r) { an.onfinish = function () { f.remove(); r(); }; });
  };

  /* ---------- 실행 ---------- */
  function run() {
    var cfg = ctx.cfg, eng = ENGINES[cfg.engine];
    ctx.rounds = cfg.rounds ? (cfg.rounds[level - 1] || ctx.rounds) : (eng.rounds ? eng.rounds[level - 1] : ctx.rounds);
    if (cfg.nOpt) ctx.nOpt = cfg.nOpt[level - 1];
    sh.setRounds(ctx.rounds, 0);
    var i = 0;
    (eng.setup ? Promise.resolve(eng.setup(ctx)) : Promise.resolve()).then(function loop() {
      if (i >= ctx.rounds) return end();
      sh.setRounds(ctx.rounds, i); ctx.newStep();
      return Promise.resolve(eng.round(ctx, i)).then(function () { O.clearPrompt(); i++; return O.wait(650).then(loop); });
    }).catch(function (e) { console.error(e); O.toast('앗, 문제가 생겼어요. 다시 시작해 주세요.'); });
  }
  function end() {
    sh.setRounds(ctx.rounds, ctx.rounds);
    var sec = Math.round((Date.now() - st.t0) / 1000);
    var entry = { at: new Date().toISOString(), lesson: id, subject: lesson.subject, school: lesson.school, topic: lesson.topic, level: level, engine: ctx.cfg.engine,
      rounds: ctx.rounds, mistakes: st.mistakes, glow: st.glow, hand: st.hand, asked: st.asked, sec: sec };
    var btns = [{ label: '한 번 더', color: '', onClick: function () { location.reload(); } }];
    if (level < 5) btns.push({ label: '다음 수준 (' + (level + 1) + ')', color: 'orange', onClick: function () { O.rememberLevel(id, level + 1); location.href = '?id=' + id + '&level=' + (level + 1); } });
    btns.push({ label: '배움 지도', color: 'blue', href: '../learn/?subject=' + lesson.subject + '&school=' + lesson.school + '#' + id });
    O.finish({ stats: st, entry: entry, title: '다 했어요!', text: lesson.topic + ' · ' + O.LEVELS[level - 1].name, buttons: btns });
  }

  /* 첫 화면: 시작 버튼(소리 켜기 위해 한 번 눌러야 함) */
  sh.ask(lesson.topic + '! 시작해 볼까요?', { silent: true });
  var start = E('div', 'oks-start');
  start.innerHTML = '<div class="oks-start-lv">' + O.LEVELS[level - 1].name + '</div><p>' + O.esc(lesson.levels[level - 1].replace(/^〈[^〉]*〉\s*/, '')) + '</p>';
  var go = E('button', 'oks-btn', '▶ 시작하기'); go.type = 'button';
  start.appendChild(go); sh.board.appendChild(start);
  O.target({ get: function () { return go; } }, Math.min(level, 2));
  go.onclick = function () { O.unlock(); O.clearPrompt(); st.t0 = Date.now(); st.glow = 0; st.hand = 0; ctx.clear(); run(); };
  window.OKS_CTX = ctx;
})();
