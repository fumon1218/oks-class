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
  if (O.eco) { var ehud = O.eco.hud(sh.top); sh.top.insertBefore(ehud, sh.levelBtn); }

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
    ask: function (t, o) { return sh.ask(t, o); },
    clear: function () { O.clearPrompt(); sh.board.innerHTML = ''; sh.board.className = 'oks-board'; },
    scene: function (kind) { sh.board.className = 'oks-board ' + (kind || ''); },
    progress: function (i, n) { sh.setRounds(n, i); }
  };
  O.kit(ctx);

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
    (window.OKS_SHOP_BY_LESSON ? window.OKS_SHOP_BY_LESSON(id) : []).slice(0, 1).forEach(function (S) { btns.push({ label: '🏪 ' + S.name + '에서 일하기', color: 'pink', href: '../shop/?id=' + S.id + '&level=' + level }); });
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
