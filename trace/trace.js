/* 따라 쓰기 엔진 (알파벳 · 앞으로 한글 자음·모음·음절에도 같이 씁니다)
   - 글자(glyph) = 순서 있는 획 목록. 획마다 번호가 붙고, 번호 순서대로 손가락으로 따라 그려요.
   - 판정: 획을 잘게 나눈 '점검점'을 차례로 지나가면 칠해져요. 손가락을 떼었다가 이어서 써도 돼요.
     수준이 높아질수록 허용 범위(R)가 좁아지고, 번호·점선 길잡이가 줄어요.
   - 시작 화면(글자 고르기)·수준·별·기록(OKS.finish)·학생별 별 저장을 함께 처리합니다.
   cfg: { title, lessonDefault, subject, school, topic, engine, back, bg, sets:[{id,label}],
          glyphs(set) → [ {id,label,strokes,lines,say,word:{text,img,emoji,ko},group} ],
          levels: {1..5: {set, pick:function(all)→ids, R, guide:{num,ghost,demo,reveal}}},
          speak(glyph) → 말해 줄 영어/한글 소리 설정 } */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;

  function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
  /* 꺾은선을 일정 간격(step)으로 다시 나눔 */
  function resample(poly, step) {
    if (poly.length === 1) return [poly[0].slice()];
    var out = [poly[0].slice()], carry = 0;
    for (var i = 1; i < poly.length; i++) {
      var a = poly[i - 1], b = poly[i], d = dist(a, b); if (!d) continue;
      var pos = step - carry;
      while (pos <= d) { var t = pos / d; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); pos += step; }
      carry = d - (pos - step);
    }
    var last = poly[poly.length - 1], lo = out[out.length - 1];
    if (dist(lo, last) > step * .35) out.push(last.slice()); else out[out.length - 1] = last.slice();
    return out;
  }
  function pathD(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); }

  /* ---------- 별 저장 (학생별) ---------- */
  function starKey(cfg) { var a = O.profile && O.profile.active ? O.profile.active() : ''; return 'oks_trace_' + cfg.engine + '_v1' + (a ? '__' + a : ''); }
  function getStars(cfg) { return O.jget(starKey(cfg), {}); }
  function putStar(cfg, id, n) { var d = getStars(cfg); if ((d[id] || 0) < n) { d[id] = n; O.jset(starKey(cfg), d); } }

  function start(cfg) {
    var LESSON = O.qs('lesson') || cfg.lessonDefault;
    var level = O.levelFor(LESSON);
    var BACK = O.qs('lesson') ? (O.qs('direct') ? O.ret(O.ROOT + 'learn/?subject=' + cfg.subject + '&school=basic#' + LESSON) : O.ret(O.ROOT + 'play/?id=' + LESSON)) : O.ret(cfg.back || (O.ROOT + 'index.html'));
    var setId = O.qs('set') || cfg.sets[0].id;
    var sh = O.shell({ compact: true, title: cfg.title, back: BACK, backLabel: '돌아가기', level: level });
    if (O.eco) try { sh.menu.insertBefore(O.eco.hud(sh.menu), sh.levelBtn); } catch (e) {}
    var board = sh.board; board.classList.add('tr-board');
    var VB = cfg.vb || { x: -25, y: -22, w: 150, h: 204 };
    board.innerHTML =
      '<div class="tr-main"><div class="tr-stage" style="aspect-ratio:' + VB.w + '/' + VB.h + '">' +
      '<svg class="tr-svg" viewBox="' + [VB.x, VB.y, VB.w, VB.h].join(' ') + '" xmlns="http://www.w3.org/2000/svg"><g class="tr-lines"></g><g class="tr-ghost"></g><g class="tr-fill"></g><g class="tr-nums"></g><circle class="tr-demo" r="7" cx="-99" cy="-99"></circle><circle class="tr-pen" r="6" cx="-99" cy="-99"></circle></svg>' +
      '<div class="tr-hot"></div></div>' +
      '<div class="tr-side"><div class="tr-card"><div class="tr-big"></div><div class="tr-pic"></div><div class="tr-word"></div><div class="tr-stars"></div></div>' +
      '<div class="tr-btns"><button type="button" class="oks-btn tr-undo">↺ 다시 쓰기</button><button type="button" class="oks-btn tr-listen">🔊 듣기</button><button type="button" class="oks-btn green tr-next" hidden>다음 ▶</button></div></div></div>';
    var svg = board.querySelector('.tr-svg'), gLines = svg.querySelector('.tr-lines'), gGhost = svg.querySelector('.tr-ghost'), gFill = svg.querySelector('.tr-fill'),
      gNums = svg.querySelector('.tr-nums'), demo = svg.querySelector('.tr-demo'), pen = svg.querySelector('.tr-pen'), hot = board.querySelector('.tr-hot'),
      big = board.querySelector('.tr-big'), pic = board.querySelector('.tr-pic'), wordEl = board.querySelector('.tr-word'), starsEl = board.querySelector('.tr-stars'),
      btnUndo = board.querySelector('.tr-undo'), btnListen = board.querySelector('.tr-listen'), btnNext = board.querySelector('.tr-next');

    /* ---------- 상태 ---------- */
    var cfgL = cfg.levels[level], R = cfgL.R, guide = cfgL.guide;
    var stats = null, queue = [], round = 0, cur = null, playing = false, calm = O.settings().calm;
    var S = null;     /* 지금 글자 상태 {g, strokes:[{pts, prog, done}], si, miss, hints} */
    var pressed = false, drawing = false, lost = false, demoRaf = 0, demoStop = false;
    var results = [];

    function drawLines(lines) {
      var h = '';
      if (cfg.cross) { h += '<rect x="0" y="0" width="100" height="100" fill="none" stroke="#c9bfae" stroke-width="1.4"/><line x1="50" x2="50" y1="0" y2="100" stroke="#d8cfbf" stroke-width="1" stroke-dasharray="4 4"/><line x1="0" x2="100" y1="50" y2="50" stroke="#d8cfbf" stroke-width="1" stroke-dasharray="4 4"/>'; gLines.innerHTML = h; return; }
      (lines || [0, 40, 100, 160]).forEach(function (y) {
        var base = y === 100;
        h += '<line x1="-20" x2="120" y1="' + y + '" y2="' + y + '" stroke="' + (base ? '#ff9db8' : '#c9bfae') + '" stroke-width="' + (base ? 1.6 : 1) + '"' + (base ? '' : ' stroke-dasharray="4 4"') + '/>';
      });
      gLines.innerHTML = h;
    }
    function pctX(x) { return ((x - VB.x) / VB.w * 100) + '%'; }
    function pctY(y) { return ((y - VB.y) / VB.h * 100) + '%'; }

    function setupGlyph(g) {
      var step = cfgL.step || 3.5;
      R = cfgL.R * (g.rScale || 1); var sw = g.sw || 13, gw = sw + 2, nr = g.nr || 9.5;
      S = { g: g, strokes: g.strokes.map(function (poly) { var pts = resample(poly, step); return { poly: poly, pts: pts, prog: 0, done: false, dot: poly.length === 1 }; }), si: 0, miss: 0, hints: 0, doneAll: false };
      drawLines(g.lines);
      var gh = '', nums = '';
      S.strokes.forEach(function (st, i) {
        if (st.dot) gh += '<circle cx="' + st.pts[0][0] + '" cy="' + st.pts[0][1] + '" r="7" class="tr-g' + i + '" fill="#e9e1d3"/>';
        else gh += '<path class="tr-g' + i + '" d="' + pathD(st.pts) + '" fill="none" stroke="#e9e1d3" stroke-width="' + gw + '" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="' + pathD(st.pts) + '" fill="none" stroke="#bfb3a0" stroke-width="1.6" stroke-dasharray="3 5" stroke-linecap="round"/>';
        nums += '<g class="tr-n tr-n' + i + '"><circle cx="' + st.pts[0][0] + '" cy="' + st.pts[0][1] + '" r="9.5"/><text x="' + st.pts[0][0] + '" y="' + (st.pts[0][1] + 4.2) + '" text-anchor="middle">' + (i + 1) + '</text></g>';
      });
      gGhost.innerHTML = gh; gNums.innerHTML = nums;
      gFill.innerHTML = S.strokes.map(function (st, i) { return st.dot ? '<circle class="tr-f' + i + '" cx="' + st.pts[0][0] + '" cy="' + st.pts[0][1] + '" r="0" fill="#ff6fa6"/>' : '<path class="tr-f' + i + '" d="" fill="none" stroke="#ff6fa6" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/>'; }).join('');
      gGhost.style.opacity = guide.ghost ? 1 : 0; gNums.style.display = guide.num ? '' : 'none';
      refreshNums();
      pen.setAttribute('cx', -99);
    }
    function refreshNums() {
      S.strokes.forEach(function (st, i) {
        var n = gNums.querySelector('.tr-n' + i); if (!n) return;
        n.classList.toggle('done', st.done); n.classList.toggle('now', i === S.si && !S.doneAll);
        n.style.display = (guide.num && !st.done) ? '' : 'none';
      });
    }
    function paintStroke(i) {
      var st = S.strokes[i], f = gFill.querySelector('.tr-f' + i); if (!f) return;
      if (st.dot) { f.setAttribute('r', st.done ? 7 : 0); return; }
      f.setAttribute('d', st.prog > 0 ? pathD(st.pts.slice(0, st.prog)) : '');
    }
    function placeHot() {
      var st = S.strokes[S.si]; if (!st) return;
      hot.style.left = pctX(st.pts[0][0]); hot.style.top = pctY(st.pts[0][1]);
    }

    /* ---------- 시범 점 (수준 1·2) ---------- */
    function stopDemo() { demoStop = true; cancelAnimationFrame(demoRaf); demo.setAttribute('cx', -99); demo.setAttribute('cy', -99); }
    function runDemo() {
      stopDemo(); if (!guide.demo || !playing || !S || S.doneAll) return;
      demoStop = false;
      var st = S.strokes[S.si], pts = st.pts, t0 = performance.now(), dur = Math.max(1100, pts.length * (calm ? 55 : 32)), pause = 900;
      (function frame(t) {
        if (demoStop) return;
        var k = (t - t0) % (dur + pause), u = Math.min(1, k / dur), idx = u * (pts.length - 1), i0 = Math.floor(idx), i1 = Math.min(pts.length - 1, i0 + 1), f = idx - i0;
        var x = pts[i0][0] + (pts[i1][0] - pts[i0][0]) * f, y = pts[i0][1] + (pts[i1][1] - pts[i0][1]) * f;
        demo.setAttribute('cx', x); demo.setAttribute('cy', y);
        demoRaf = requestAnimationFrame(frame);
      })(t0);
    }
    var demoTimer = 0;
    function armDemo() { clearTimeout(demoTimer); stopDemo(); if (guide.demo) demoTimer = setTimeout(runDemo, calm ? 2600 : 1600); }

    /* ---------- 손가락 판정 ---------- */
    function toSvg(e) { var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); if (!m) return [0, 0]; var p = pt.matrixTransform(m.inverse()); return [p.x, p.y]; }
    function nowStroke() { return S && !S.doneAll ? S.strokes[S.si] : null; }

    function onDown(e) {
      if (!playing) return;
      var st = nowStroke(); if (!st) return;
      e.preventDefault(); O.unlock(); O.clearPrompt(); stopDemo();
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      pressed = true; var p = toSvg(e); pen.setAttribute('cx', p[0]); pen.setAttribute('cy', p[1]);
      if (st.dot) { if (dist(p, st.pts[0]) <= R * 1.6) { st.done = true; strokeDone(); } else wrongStart(); return; }
      var ref = st.pts[Math.max(0, st.prog - 1 + (st.prog === 0 ? 0 : 0))];
      var near = dist(p, st.pts[Math.min(st.prog, st.pts.length - 1)]) <= R * 1.5 || (st.prog > 0 && dist(p, ref) <= R * 1.5);
      if (near) { drawing = true; lost = false; advance(p); }
      else { drawing = false; wrongStart(); }
    }
    function wrongStart() {
      /* 시작 위치가 아닌 곳을 눌렀어요: 다시 시작할 곳을 알려 줘요 */
      if (level >= 3) { S.miss++; stats.mistakes++; }
      O.sfx('no'); S.hints++;
      var st = nowStroke(); if (st) { hot.classList.remove('oks-glow'); void hot.offsetWidth; hot.classList.add('oks-glow'); }
      O.target({ get: function () { return [hot]; }, say: '여기서 시작해요' }, level);
      if (S.hints >= 2) gGhost.style.opacity = 1;
    }
    function advance(p) {
      var st = nowStroke(); if (!st) return;
      var best = -1, lim = Math.min(st.pts.length - 1, st.prog + 7);
      for (var i = st.prog; i <= lim; i++) if (dist(p, st.pts[i]) <= R) best = i;
      if (best >= st.prog) { st.prog = best + 1; paintStroke(S.si); }
      if (st.prog >= st.pts.length) { st.done = true; drawing = false; strokeDone(); }
    }
    function onMove(e) {
      if (!pressed || !playing) return;
      var st = nowStroke(); if (!st || st.dot) return;
      e.preventDefault();
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!evs || !evs.length) evs = [e];
      evs.forEach(function (ev) {
        if (!nowStroke() || nowStroke() !== st) return;
        var p = toSvg(ev); pen.setAttribute('cx', p[0]); pen.setAttribute('cy', p[1]);
        if (!drawing) {                      /* 길에서 벗어났다가 돌아오면 이어서 */
          var ref = st.pts[Math.min(st.prog, st.pts.length - 1)];
          if (dist(p, ref) <= R * 1.5) { drawing = true; lost = false; }
        }
        if (drawing) {
          advance(p);
          if (nowStroke() === st && st.prog > 0) {
            var ref2 = st.pts[Math.min(st.prog, st.pts.length - 1)];
            if (dist(p, ref2) > R * 2.3) {   /* 길을 벗어났어요 */
              drawing = false; lost = true; S.miss++; stats.mistakes++; O.sfx('no'); wobble();
              if (S.miss >= 2) gGhost.style.opacity = 1;
            }
          }
        }
      });
    }
    function onUp(e) {
      if (!pressed) return; pressed = false; drawing = false; pen.setAttribute('cx', -99);
      var st = nowStroke(); if (!st) return;
      armDemo(); setTarget();
    }
    function wobble() { svg.classList.remove('tr-wob'); void svg.getBoundingClientRect(); svg.classList.add('tr-wob'); }

    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    function setTarget() {
      var st = nowStroke(); if (!st) return;
      placeHot();
      var pos = st.prog > 0 && !st.dot ? st.pts[Math.min(st.prog, st.pts.length - 1)] : st.pts[0];
      hot.style.left = pctX(pos[0]); hot.style.top = pctY(pos[1]);
      O.target({ get: function () { return [hot]; }, say: st.prog > 0 ? '여기서부터 이어서 써요' : (S.strokes.length > 1 ? (S.si + 1) + '번 획이에요. 여기서 시작해요' : '여기서 시작해요') }, level);
    }

    function strokeDone() {
      var i = S.si; paintStroke(i); O.sfx('tick'); pressed = false; drawing = false;
      var f = gFill.querySelector('.tr-f' + i); if (f) { f.classList.remove('tr-pulse'); void f.getBoundingClientRect(); f.classList.add('tr-pulse'); }
      S.si++;
      if (S.si >= S.strokes.length) { S.doneAll = true; refreshNums(); stopDemo(); glyphDone(); return; }
      refreshNums(); armDemo(); setTarget();
    }

    /* ---------- 글자 하나 끝 ---------- */
    function starsOf(g) { return S.miss === 0 && S.hints === 0 ? 3 : (S.miss <= 2 ? 2 : 1); }
    function showWord(reveal) {
      var w = S.g.word;
      big.textContent = S.g.label;
      pic.innerHTML = w ? (w.img ? '<img src="' + O.ROOT + 'art/' + w.img + '" alt="' + O.esc(w.text) + '">' : '<span class="tr-emoji">' + (w.emoji || '') + '</span>') : '';
      wordEl.innerHTML = w ? '<b>' + O.esc(w.text) + '</b>' + (w.ko ? '<small>' + O.esc(w.ko) + '</small>' : '') : '';
      pic.classList.toggle('hide', !(reveal || S.g.picAlways)); wordEl.classList.toggle('hide', !reveal);
    }
    function speakGlyph() { var f = cfg.speak ? cfg.speak(S.g) : null; if (f) return O.say(f.text, { lang: f.lang, rate: f.rate }); return Promise.resolve(); }
    async function glyphDone() {
      clearTimeout(demoTimer); O.clearPrompt();
      var n = starsOf(); results.push({ id: S.g.id, stars: n, miss: S.miss });
      putStar(cfg, S.g.id, n);
      O.sfx('ok'); O.praise();
      showWord(true);
      starsEl.innerHTML = [1, 2, 3].map(function (k) { return '<i class="' + (k <= n ? 'on' : '') + '" style="animation-delay:' + (k * .15) + 's">★</i>'; }).join('');
      round++; sh.setRounds(queue.length, round);
      speakGlyph();
      if (round >= queue.length) { btnNext.textContent = '끝났어요! ▶'; }
      else btnNext.textContent = '다음 ▶';
      btnNext.hidden = false;
      O.target({ get: function () { return [btnNext]; }, say: '다음을 눌러요' }, level);
    }
    function goNext() {
      if (!playing || btnNext.hidden) return;
      btnNext.hidden = true; O.hush(); O.clearPrompt();
      if (round >= queue.length) { playing = false; done(); } else loadGlyph();
    }
    btnNext.onclick = goNext;

    /* ---------- 글자 불러오기 ---------- */
    function loadGlyph() {
      var g = queue[round]; cur = g; pressed = drawing = lost = false;
      setupGlyph(g); btnNext.hidden = true; starsEl.innerHTML = '';
      showWord(!!guide.reveal);
      var f = cfg.speak ? cfg.speak(g) : null;
      var text = (g.say || (g.label + ' 따라 쓰기')) + '';
      sh.ask(text, { html: '<b class="tr-ask">' + O.esc(g.label) + '</b> 를 순서대로 따라 써요', speak: g.say || (g.label + '를 따라 써요'), replay: f ? function () { return O.say(f.text, { lang: f.lang, rate: f.rate, noRepeat: true }); } : null });
      sh.setRounds(queue.length, round);
      armDemo(); setTarget();
    }

    btnUndo.onclick = function () {
      if (!playing || !S || S.doneAll) return;     /* 다 쓴 글자는 '다음'으로 */
      var m = S.miss, h = S.hints; setupGlyph(S.g); S.miss = m; S.hints = h; armDemo(); setTarget(); O.sfx('tick');
    };
    btnListen.onclick = function () { O.unlock(); if (S) speakGlyph(); };

    /* ---------- 끝 ---------- */
    function done() {
      var st = stats; stopDemo();
      var tot = results.reduce(function (a, r) { return a + r.stars; }, 0), avg = results.length ? tot / results.length : 0;
      var entry = { at: new Date().toISOString(), lesson: LESSON, subject: cfg.subject, school: cfg.school, topic: cfg.topic, level: level, engine: cfg.engine, rounds: queue.length,
        mistakes: st.mistakes, glow: st.glow, hand: st.hand, asked: st.asked, sec: Math.round((Date.now() - st.t0) / 1000), items: results.map(function (r) { return r.id + ':' + r.stars; }).join(',') };
      var btns = [{ label: '🔁 한 번 더', color: 'green', onClick: function () { location.reload(); } }];
      if (level < 5) btns.push({ label: '다음 수준 (' + (level + 1) + ')', color: 'orange', onClick: function () { O.rememberLevel(LESSON, level + 1); location.href = '?' + (O.qs('lesson') ? 'lesson=' + LESSON + '&' : '') + (O.qs('set') ? 'set=' + O.qs('set') + '&' : '') + (O.qs('direct') ? 'direct=1&' : '') + 'level=' + (level + 1); } });
      btns.push({ label: O.qs('lesson') ? '차시로 돌아가기' : '🏠 돌아가기', color: 'blue', href: BACK });
      O.finish({ stats: st, entry: entry, stars: avg >= 2.5 ? 3 : (avg >= 1.6 ? 2 : 1), title: cfg.doneTitle || '글자를 잘 썼어요!', text: cfg.topic + ' ' + queue.length + '글자 · ' + O.LEVELS[level - 1].name, mission: { lesson: 1 }, buttons: btns });
    }

    /* ---------- 시작 화면: 글자 고르기 ---------- */
    function startScreen() {
      sh.askEl.style.visibility = 'hidden';
      var ov = E('div', 'oks-start tr-start'), picked = null, stars = getStars(cfg);
      function html() {
        var gl = cfg.glyphs(setId), seen = {};
        var grid = gl.filter(function (g) { var k = g.group || g.id; if (seen[k]) return false; seen[k] = 1; return true; }).map(function (g) {
          var k = g.group || g.id, s = Math.max.apply(null, gl.filter(function (x) { return (x.group || x.id) === k; }).map(function (x) { return stars[x.id] || 0; }));
          return '<button type="button" class="tr-cell' + (picked === k ? ' on' : '') + '" data-k="' + O.esc(k) + '"><b>' + O.esc(g.cell || g.label) + '</b><i>' + (s ? '★'.repeat(s) : '') + '</i></button>';
        }).join('');
        var tabs = cfg.sets.map(function (s) { return '<button type="button" data-set="' + s.id + '" class="' + (s.id === setId ? 'on' : '') + '">' + s.label + '</button>'; }).join('');
        var lvBtns = O.LEVELS.map(function (L) { return '<button type="button" data-lv="' + L.n + '" class="' + (L.n === level ? 'on' : '') + '" title="' + O.esc(L.desc) + '">' + L.short + '</button>'; }).join('');
        ov.innerHTML = '<div class="st-card tr-st"><h1>' + cfg.icon + ' ' + O.esc(cfg.title) + '</h1><p>' + (cfg.intro || '') + '</p>' +
          '<div class="st-lv tr-tabs">' + tabs + '</div><div class="tr-grid">' + grid + '</div>' +
          '<p class="tr-hintp">' + (picked ? '<b>' + O.esc(picked) + '</b> 만 연습해요' : '글자를 누르면 그 글자만 연습해요. 안 누르면 차례대로 써요.') + '</p>' +
          '<div class="st-lv tr-levels">' + lvBtns + '</div><button type="button" class="oks-btn green st-go">시작! ▶</button></div>';
        ov.querySelectorAll('.tr-tabs button').forEach(function (b) { b.onclick = function () { setId = b.dataset.set; picked = null; html(); }; });
        ov.querySelectorAll('.tr-cell').forEach(function (b) { b.onclick = function () { picked = picked === b.dataset.k ? null : b.dataset.k; O.unlock(); html(); if (picked && cfg.speakKey) O.say(cfg.speakKey(picked).text, { lang: cfg.speakKey(picked).lang }); }; });
        ov.querySelectorAll('.tr-levels button').forEach(function (b) { b.onclick = function () { level = +b.dataset.lv; html(); }; });
        ov.querySelector('.st-go').onclick = function () { O.unlock(); O.hush(); ov.remove(); begin(picked); };
      }
      html(); document.body.appendChild(ov);
    }
    function begin(picked) {
      cfgL = cfg.levels[level]; R = cfgL.R; guide = cfgL.guide;
      sh.askEl.style.visibility = ''; O.rememberLevel(LESSON, level); sh.setLevel(level);
      var all = cfg.glyphs(setId);
      queue = picked ? all.filter(function (g) { return (g.group || g.id) === picked; }) : cfgL.pick(all);
      if (!queue.length) queue = all.slice(0, 4);
      stats = O.newStats(); round = 0; results = []; playing = true;
      loadGlyph();
    }
    sh.levelBtn.onclick = function () { location.reload(); };
    addEventListener('resize', function () { if (S && nowStroke()) placeHot(); });
    startScreen();
    window.OKS_TRACE_STATE = { get S() { return S; }, get R() { return R; }, get playing() { return playing; }, svg: svg, get queue() { return queue; }, next: goNext };
  }

  window.OKS_TRACE = { start: start, resample: resample };
})();
