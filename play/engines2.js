/* 게임 엔진 2 — 리듬(rhythm) · 힘 조절 게이지(gauge) · 색 섞기(mix) · 길 찾기(route) · 선 긋기(draw) · 도형 만들기(build) · 미술실 연결(portal)
   정글 점프의 '리듬 스타', '타이밍 게이지', '염색', '드론 배달', 미술실의 '선 따라 그리기'를 바탕으로 만들었습니다. 실패가 없도록 설계합니다. */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var EN = window.OKS_ENGINES = window.OKS_ENGINES || {};
  function row(cls) { return E('div', 'row ' + (cls || '')); }
  function beep(p) { O.inst(p.inst || 'xylo', p.freq ? p.freq : (p.note ? O.NOTE[p.note] : null)); }

  /* ================= 리듬 ================= */
  /* cfg: pads[{label, emo|img, inst, note}], songs: {3:[패드번호...], 4:[...]} (선택), tempo */
  EN.rhythm = {
    rounds: [3, 3, 3, 3, 4],
    round: function (ctx, i) {
      var c = ctx.cfg, lv = ctx.level; ctx.clear(); ctx.scene('stage');
      var nPad = Math.min(c.pads.length, [3, 1, 2, 3, 3][lv - 1]);
      if (c.songs && c.songs[lv]) nPad = Math.max.apply(null, c.songs[lv]) + 1;
      var pads = c.pads.slice(0, nPad);
      var lanes = row('lanes'); var padEls = pads.map(function (p, k) {
        var lane = E('div', 'lane'); var track = E('div', 'track'); var hit = E('div', 'hitline');
        var b = E('button', 'pad', ctx.pic(p) + '<b>' + O.esc(p.label) + '</b>'); b.type = 'button'; b._p = p; b._k = k;
        if (lv >= 3 && lv <= 4) { lane.appendChild(track); track.appendChild(hit); }
        lane.appendChild(b); lanes.appendChild(lane); b._track = track; return b;
      });
      ctx.board.appendChild(lanes);
      function hitFx(b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); beep(b._p); }
      if (lv === 1) {
        return ctx.ask(c.l1 || '마음대로 눌러서 소리를 들어 봐요').then(function () {
          return new Promise(function (res) { var n = 0; ctx.target({ get: function () { return padEls; } });
            padEls.forEach(function (b) { b.onclick = function () { hitFx(b); O.clearPrompt(); n++; if (n === 8) { O.praise(); setTimeout(res, 800); } }; }); });
        });
      }
      if (lv === 5) return callResponse(ctx, padEls, hitFx, i);
      var tempo = (c.tempo || 80) * (lv === 4 ? 1.15 : 1); var beat = 60000 / tempo;
      if (lv === 2) { /* 반짝일 때 누르기 */
        var b = padEls[0], hits = 0, beats = 8;
        return ctx.ask(c.q2 || '반짝일 때 눌러요! 쿵, 쿵, 쿵', { wait: true }).then(function () {
          return new Promise(function (res) {
            var k = 0, lastBeat = 0;
            b.onclick = function () { hitFx(b); if (Math.abs(performance.now() - lastBeat) < beat * 0.45) { hits++; b.classList.add('ok'); setTimeout(function () { b.classList.remove('ok'); }, 200); } };
            (function tick() {
              if (k >= beats) { if (hits < 3) ctx.stats.mistakes++; O.say(hits >= 5 ? '박자를 잘 맞췄어요!' : '잘 들었어요!', { noRepeat: true }); O.praise(); setTimeout(res, 1100); return; }
              lastBeat = performance.now(); b.classList.add('beat'); O.inst('tick' === c.metro ? 'clap' : 'clap'); setTimeout(function () { b.classList.remove('beat'); }, beat * 0.4); k++; setTimeout(tick, beat);
            })();
          });
        });
      }
      /* 3·4: 내려오는 음표를 선에서 누르기 */
      var song = (c.songs && c.songs[lv]) || Array.from({ length: 10 }, function () { return Math.floor(Math.random() * nPad); });
      var fall = beat * 3; /* 음표가 내려오는 시간 */
      return ctx.ask(c.q3 || '음표가 선에 닿을 때 눌러요', { wait: true }).then(function () {
        return new Promise(function (res) {
          var t0 = performance.now() + 600, notes = song.map(function (lane, k) { var n = E('div', 'note', ctx.pic(pads[lane])); padEls[lane]._track.appendChild(n); return { lane: lane, at: t0 + fall + k * beat * (c.spacing || 1), el: n, done: false }; });
          var hits = 0, raf;
          padEls.forEach(function (b) { b.onclick = function () {
            hitFx(b); var now = performance.now();
            var n = notes.filter(function (x) { return !x.done && x.lane === b._k && Math.abs(x.at - now) < beat * 0.5; })[0];
            if (n) { n.done = true; hits++; n.el.classList.add('pop'); O.clearPrompt(); }
          }; });
          function frame() {
            var now = performance.now(), live = 0;
            notes.forEach(function (n) {
              var p = 1 - (n.at - now) / fall; if (n.done && !n.el.classList.contains('pop')) return;
              if (p < 0) { n.el.style.opacity = 0; live++; return; }
              n.el.style.opacity = 1; n.el.style.top = Math.min(p, 1.25) * 82 + '%';
              if (!n.done && now - n.at > beat * 0.5) { n.done = true; n.el.classList.add('miss'); }
              if (!n.done) live++;
              if (!n.done && Math.abs(n.at - now) < beat * 0.35 && lv === 3) { padEls[n.lane].classList.add('oks-glow'); } else padEls[n.lane].classList.remove('oks-glow');
            });
            if (live > 0 || now < notes[notes.length - 1].at + beat) raf = requestAnimationFrame(frame);
            else { padEls.forEach(function (b) { b.classList.remove('oks-glow'); b.onclick = null; }); if (hits < song.length / 3) ctx.stats.mistakes++;
              O.say(hits >= song.length * 0.7 ? '최고의 연주예요!' : '멋진 연주였어요!', { noRepeat: true }); O.praise(); setTimeout(res, 1200); }
          }
          raf = requestAnimationFrame(frame);
          if (c.withSong && c.songs && c.songs[lv]) { /* 반주: 박자에 맞춰 약하게 */ }
        });
      });
    }
  };
  function callResponse(ctx, padEls, hitFx, i) {
    var len = 3 + (i >= 2 ? 1 : 0);
    var pat = Array.from({ length: len }, function () { return Math.floor(Math.random() * padEls.length); });
    function playPat() {
      padEls.forEach(function (b) { b.onclick = null; });
      return pat.reduce(function (p, k) { return p.then(function () { padEls[k].classList.add('oks-glow'); hitFx(padEls[k]); return O.wait(520).then(function () { padEls[k].classList.remove('oks-glow'); return O.wait(120); }); }); }, O.wait(300));
    }
    return ctx.ask('옥쌤이 먼저 연주해요. 잘 듣고 똑같이 따라 해요!', { replay: playPat }).then(function () {
      return new Promise(function (res) {
        var pos = 0;
        ctx.target({ get: function () { return padEls[pat[pos]]; } });
        function arm() {
          padEls.forEach(function (b) { b.onclick = function () {
            hitFx(b);
            if (b._k === pat[pos]) { pos++; O.clearPrompt(); if (pos === pat.length) { ctx.good(null, '똑같이 연주했어요!'); padEls.forEach(function (x) { x.onclick = null; }); setTimeout(res, 1200); } else ctx.target({ get: function () { return padEls[pat[pos]]; } }); }
            else { ctx.bad(b); pos = 0; setTimeout(function () { playPat().then(arm); }, 700); }
          }; });
        }
        arm();
      });
    });
  }

  /* ================= 힘 조절 게이지 ================= */
  EN.gauge = {
    rounds: [3, 5, 4, 5, 5],
    round: function (ctx, i) {
      var c = ctx.cfg, lv = ctx.level; ctx.clear();
      var track = E('div', 'force-track', '<div class="flag">🚩</div><div class="cart">' + (c.cartEmo || '🛒') + '</div>');
      ctx.board.appendChild(track);
      var cart = track.querySelector('.cart'), flag = track.querySelector('.flag');
      var pos = 5; function setPos(p) { pos = Math.max(2, Math.min(90, p)); cart.style.left = pos + '%'; }
      setPos(5);
      if (lv === 1) {
        flag.style.display = 'none';
        var push = E('button', 'oks-btn', '👐 밀기'), pull = E('button', 'oks-btn blue', '🫳 당기기'); push.type = pull.type = 'button';
        var r = row('center'); r.appendChild(pull); r.appendChild(push); ctx.board.appendChild(r);
        return ctx.ask('밀기와 당기기를 눌러 수레를 움직여 봐요').then(function () {
          return new Promise(function (res) { var n = 0; ctx.target({ get: function () { return [push, pull]; } });
            function go(d, t) { setPos(pos + d); O.sfx('pop'); O.say(t, { noRepeat: true }); O.clearPrompt(); n++; if (n >= 5) { O.praise(); setTimeout(res, 900); } }
            push.onclick = function () { go(18, '밀면 멀어져요'); }; pull.onclick = function () { go(-18, '당기면 다가와요'); }; });
        });
      }
      /* 3·4: 게이지 멈추기 */
      var dist = lv === 3 ? 60 : [40, 60, 80][i % 3];
      flag.style.left = (5 + dist) + '%';
      var zoneW = lv === 3 ? 26 : 16, zoneC = Math.min(95 - zoneW / 2, Math.max(zoneW / 2 + 5, dist));
      var g = E('div', 'gauge', '<div class="zone" style="left:' + (zoneC - zoneW / 2) + '%;width:' + zoneW + '%">✓</div><div class="needle"></div>');
      var stop = E('button', 'oks-btn orange', '✋ 멈춰! 밀기'); stop.type = 'button';
      ctx.board.appendChild(g); var r2 = row('center'); r2.appendChild(stop); ctx.board.appendChild(r2);
      var needle = g.querySelector('.needle');
      return ctx.ask(lv === 3 ? '바늘이 ✓ 칸에 오면 멈춰요! 깃발까지 밀어요' : '깃발까지 가려면 얼마나 세게 밀까요?').then(function () {
        return new Promise(function (res) {
          var v = 0, dir = 1, raf, speed = lv === 3 ? 0.55 : 0.8;
          ctx.target({ get: function () { return (v > zoneC - zoneW / 2 && v < zoneC + zoneW / 2) ? stop : null; } });
          function f() { v += dir * speed; if (v > 100) { v = 100; dir = -1; } if (v < 0) { v = 0; dir = 1; } needle.style.left = v + '%';
            var inZone = v > zoneC - zoneW / 2 && v < zoneC + zoneW / 2; g.classList.toggle('in', inZone && lv === 3); raf = requestAnimationFrame(f); }
          f();
          stop.onclick = function () {
            cancelAnimationFrame(raf); var p = v; stop.disabled = true;
            cart.style.transition = 'left 1s ease-out'; setPos(5 + p);
            setTimeout(function () {
              cart.style.transition = '';
              if (Math.abs(p - zoneC) <= zoneW / 2 + 1) { ctx.good(stop, '깃발에 도착!'); O.say('알맞은 힘으로 밀었어요', { noRepeat: true }); setTimeout(res, 1100); }
              else { ctx.bad(stop); O.say(p < zoneC ? '조금 더 세게 밀어요' : '너무 세게 밀었어요. 살살 밀어요', { noRepeat: true }); setTimeout(function () { setPos(5); stop.disabled = false; f(); }, 1300); }
            }, 1050);
          };
        });
      });
    }
  };

  /* ================= 색 섞기 ================= */
  var PAINT = { red: ['빨강', '#e53935'], yellow: ['노랑', '#fbc02d'], blue: ['파랑', '#1e88e5'], white: ['하양', '#fafafa'] };
  var MIX = { 'red+yellow': ['주황', '#fb8c00'], 'blue+yellow': ['초록', '#43a047'], 'blue+red': ['보라', '#8e24aa'], 'red+white': ['분홍', '#f48fb1'], 'blue+white': ['하늘', '#81d4fa'], 'white+yellow': ['연노랑', '#fff59d'] };
  function mixKey(a, b) { return [a, b].sort().join('+'); }
  EN.mix = {
    rounds: [3, 5, 4, 5, 1],
    round: function (ctx, i) {
      var lv = ctx.level; ctx.clear();
      var keys = lv === 4 ? ['red', 'yellow', 'blue', 'white'] : ['red', 'yellow', 'blue'];
      var pots = keys.map(function (k) { var b = E('button', 'oks-card pot', '<div class="pic"><span class="paint" style="background:' + PAINT[k][1] + '"></span></div><div class="lab">' + PAINT[k][0] + '</div>'); b.type = 'button'; b._k = k; return b; });
      var bowl = E('div', 'dropzone bowl', '<div class="bowl-in"></div><b>섞는 그릇</b>');
      var pr = row('items'); pots.forEach(function (p) { pr.appendChild(p); });
      if (lv === 5) return paintFree(ctx);
      ctx.board.appendChild(pr); ctx.board.appendChild(bowl);
      var inb = bowl.querySelector('.bowl-in');
      if (lv === 1) {
        return ctx.ask('물감을 눌러 그릇에 떨어뜨려 봐요. 색이 어떻게 변할까요?').then(function () {
          return new Promise(function (res) { var put = [], n = 0; ctx.target({ get: function () { return pots; } });
            pots.forEach(function (p) { p.onclick = function () { O.clearPrompt(); O.sfx('water'); put.push(p._k); if (put.length > 2) put.shift(); n++;
              var col = put.length === 2 && put[0] !== put[1] ? MIX[mixKey(put[0], put[1])] : PAINT[p._k];
              inb.style.background = col[1]; O.say(col[0] + (put.length === 2 && put[0] !== put[1] ? '이 되었어요!' : ''), { noRepeat: true });
              if (n >= 4) { O.praise(); setTimeout(res, 1200); } }; }); });
        });
      }
      var goals = lv === 4 ? Object.keys(MIX) : ['red+yellow', 'blue+yellow', 'blue+red'];
      var gk = goals[i % goals.length], need = gk.split('+'), goal = MIX[gk];
      var goalEl = E('div', 'goal-color', '<span style="background:' + goal[1] + '"></span><b>' + goal[0] + ' 만들기</b>');
      ctx.board.insertBefore(goalEl, pr);
      return ctx.ask(goal[0] + '을 만들려면 어떤 물감 두 개를 섞을까요?').then(function () {
        var got = [];
        ctx.target({ get: function () { return pots.filter(function (p) { return need.indexOf(p._k) >= 0 && got.indexOf(p._k) < 0; })[0]; }, to: function () { return bowl; } });
        return ctx.dnd(pots, [bowl], function (p) { return need.indexOf(p._k) >= 0 && got.indexOf(p._k) < 0; }, function (p) {
          got.push(p._k); p._done = false; O.sfx('water'); inb.style.background = got.length === 2 ? goal[1] : PAINT[p._k][1];
          if (got.length === 2) { ctx.good(null, goal[0] + ' 완성!'); O.say(PAINT[need[0]][0] + '과 ' + PAINT[need[1]][0] + '을 섞으면 ' + goal[0] + '!', { noRepeat: true }); }
          else { O.say(PAINT[p._k][0] + '! 하나 더', { noRepeat: true }); ctx.target({ get: function () { return pots.filter(function (x) { return need.indexOf(x._k) >= 0 && got.indexOf(x._k) < 0; })[0]; }, to: function () { return bowl; } }); }
        }, function () { return got.length === 2; }).then(function () { return O.wait(1800); });
      });
    }
  };
  function paintFree(ctx) {
    var cols = Object.keys(PAINT).map(function (k) { return PAINT[k]; }).concat(Object.keys(MIX).map(function (k) { return MIX[k]; }));
    var cur = cols[0];
    var pal = row('palette'); cols.forEach(function (c) { var b = E('button', 'swatch-btn', '<span style="background:' + c[1] + '"></span>' + c[0]); b.type = 'button'; b.onclick = function () { cur = c; pal.querySelectorAll('.swatch-btn').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); O.say(c[0], { noRepeat: true }); }; pal.appendChild(b); });
    pal.firstChild.classList.add('on');
    var svg = E('div', 'paint-pic', '<svg viewBox="0 0 300 260"><g stroke="#5d4037" stroke-width="5">' +
      '<rect data-p="1" x="140" y="120" width="20" height="130" fill="#fff"/>' +
      '<ellipse data-p="1" cx="110" cy="200" rx="40" ry="18" fill="#fff" transform="rotate(-25 110 200)"/>' +
      [0, 72, 144, 216, 288].map(function (a) { return '<ellipse data-p="1" cx="150" cy="60" rx="26" ry="44" fill="#fff" transform="rotate(' + a + ' 150 100)"/>'; }).join('') +
      '<circle data-p="1" cx="150" cy="100" r="26" fill="#fff"/></g></svg>');
    var fin = E('button', 'oks-btn orange', '완성했어요'); fin.type = 'button';
    ctx.board.appendChild(pal); ctx.board.appendChild(svg); var r = row('center'); r.appendChild(fin); ctx.board.appendChild(r);
    return ctx.ask('섞어서 만든 색으로 꽃을 색칠해요. 다 칠하면 완성!').then(function () {
      return new Promise(function (res) { var parts = svg.querySelectorAll('[data-p]'); var painted = new Set();
        parts.forEach(function (p) { p.addEventListener('click', function () { p.setAttribute('fill', cur[1]); painted.add(p); O.sfx('pop'); O.clearPrompt(); }); });
        ctx.target({ get: function () { return painted.size >= 3 ? fin : Array.prototype.filter.call(parts, function (p) { return !painted.has(p); })[0]; } });
        fin.onclick = function () { if (painted.size < 2) { O.say('조금 더 색칠해 볼까요?', { noRepeat: true }); return; } ctx.good(fin, '멋진 작품!'); setTimeout(res, 1300); };
      });
    });
  }

  /* ================= 길 찾기 ================= */
  var PLACES = [{ label: '학교', emo: '🏫' }, { label: '마트', emo: '🏪' }, { label: '병원', emo: '🏥' }, { label: '우체국', emo: '📮' }, { label: '공원', emo: '🌳' }, { label: '도서관', emo: '📚' }];
  EN.route = {
    rounds: [3, 4, 4, 4, 2],
    round: function (ctx, i) {
      var lv = ctx.level; ctx.clear();
      var cols = [3, 3, 4, 5, 5][lv - 1], rows = [1, 2, 3, 4, 4][lv - 1];
      var home = { x: 0, y: rows - 1 };
      var dests = lv === 5 ? O.pick(PLACES, 2) : O.pick(PLACES, 1);
      /* 오른쪽·위로만 가는 길 만들기 */
      function walk(from, to) { var p = [], x = from.x, y = from.y; while (x !== to.x || y !== to.y) { var canX = x !== to.x, canY = y !== to.y; if (canX && (!canY || Math.random() < .55)) x += Math.sign(to.x - x); else y += Math.sign(to.y - y); p.push({ x: x, y: y }); } return p; }
      var goals = lv === 5 ? [{ x: cols - 1, y: rows - 1 }, { x: cols - 1, y: 0 }] : [{ x: cols - 1, y: 0 }];
      var path = [], at = home; goals.forEach(function (g) { path = path.concat(walk(at, g)); at = g; });
      var grid = E('div', 'map'); grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      var cells = {};
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        var cell = E('button', 'mapcell'); cell.type = 'button'; cell._x = x; cell._y = y; cells[x + ',' + y] = cell; grid.appendChild(cell);
      }
      var onPath = function (x, y) { return (x === home.x && y === home.y) || path.some(function (p) { return p.x === x && p.y === y; }); };
      Object.keys(cells).forEach(function (k) { var cl = cells[k]; if (onPath(cl._x, cl._y)) cl.classList.add('road'); else if (Math.random() < .5) cl.innerHTML = '<span class="deco">' + O.pick(['🌳', '🌷', '🏠', '🌲'], 1)[0] + '</span>'; });
      cells[home.x + ',' + home.y].innerHTML = '<span class="place">🏠</span>';
      goals.forEach(function (g, k) { cells[g.x + ',' + g.y].innerHTML = '<span class="place">' + dests[k].emo + '<small>' + dests[k].label + '</small></span>'; });
      var me = E('div', 'walker', '<img src="' + O.ROOT + 'icons/avatar-walk-a.png" alt="">');
      ctx.board.appendChild(grid); grid.appendChild(me);
      var cur = { x: home.x, y: home.y }, step = 0;
      function placeMe() { var cl = cells[cur.x + ',' + cur.y]; me.style.left = cl.offsetLeft + cl.offsetWidth / 2 + 'px'; me.style.top = cl.offsetTop + cl.offsetHeight / 2 + 'px'; }
      setTimeout(placeMe, 30);
      var ARW = { '1,0': ['➡️', '오른쪽'], '-1,0': ['⬅️', '왼쪽'], '0,-1': ['⬆️', '위쪽'], '0,1': ['⬇️', '아래쪽'] };
      var q = lv === 5 ? dests[0].label + '에 들렀다가 ' + dests[1].label + '에 가요' : dests[0].label + '에 가는 길을 찾아요';
      var ctrl = row('center arrows');
      if (lv <= 2) ctx.board.appendChild(ctrl);
      return ctx.ask(q).then(function () {
        return new Promise(function (res) {
          function nextCell() { return path[step]; }
          function arrived() {
            var g = goals.filter(function (gg) { return gg.x === cur.x && gg.y === cur.y; })[0];
            if (g) { var k = goals.indexOf(g); O.sfx('coin'); O.say(dests[k].label + '에 도착했어요!', { noRepeat: true }); if (k === goals.length - 1) { ctx.good(null, '도착!'); setTimeout(res, 1300); return true; } }
            return false;
          }
          function moveTo(p) { cur = { x: p.x, y: p.y }; step++; placeMe(); O.sfx('pop'); O.clearPrompt(); if (!arrived()) arm(); }
          function arm() {
            var n = nextCell(); if (!n) return;
            var d = (n.x - cur.x) + ',' + (n.y - cur.y);
            if (lv <= 2) {
              ctrl.innerHTML = '';
              var opts = [d]; if (lv === 2) opts.push(O.pick(Object.keys(ARW).filter(function (k) { return k !== d; }), 1)[0]);
              var btns = O.shuffle(opts).map(function (k) { var b = E('button', 'oks-card arrow', '<span class="emo">' + ARW[k][0] + '</span><div class="lab">' + ARW[k][1] + '</div>'); b.type = 'button'; b._d = k; ctrl.appendChild(b); return b; });
              ctx.target({ get: function () { return btns.filter(function (b) { return b._d === d; }); } });
              ctx.tapWait(btns, function (b) { return b._d === d; }).then(function () { O.say(ARW[d][1], { noRepeat: true }); moveTo(n); });
            } else {
              var nc = cells[n.x + ',' + n.y];
              ctx.target({ get: function () { return nc; } });
              var near = Object.keys(cells).map(function (k) { return cells[k]; }).filter(function (cl) { return Math.abs(cl._x - cur.x) + Math.abs(cl._y - cur.y) === 1; });
              Object.keys(cells).forEach(function (k) { cells[k].onclick = null; });
              near.forEach(function (cl) { cl.onclick = function () { if (cl === nc) moveTo(n); else ctx.bad(cl); }; });
            }
          }
          arm();
        });
      });
    }
  };

  /* ================= 선 따라 그리기 ================= */
  var PATHS = {
    2: [[[.08, .5], [.92, .5]], [[.08, .3], [.92, .7]]],
    3: [[[.08, .7], [.35, .3], [.65, .7], [.92, .3]], [[.1, .2], [.1, .8], [.9, .8]]],
    4: [[[.06, .5], [.2, .2], [.34, .8], [.48, .2], [.62, .8], [.76, .2], [.94, .5]], [[.1, .8], [.1, .2], [.5, .2], [.5, .8], [.9, .8], [.9, .2]]]
  };
  EN.draw = {
    rounds: [2, 3, 3, 3, 1],
    round: function (ctx, i) {
      var lv = ctx.level; ctx.clear();
      var wrap = E('div', 'draw-wrap'); var cv = E('canvas', 'draw-cv'); wrap.appendChild(cv); ctx.board.appendChild(wrap);
      var W = wrap.clientWidth || 800, H = Math.round(Math.min(420, W * 0.55)); cv.width = W * 2; cv.height = H * 2; cv.style.height = H + 'px';
      var g = cv.getContext('2d'); g.scale(2, 2); g.lineCap = 'round'; g.lineJoin = 'round';
      var col = ['#e53935', '#1e88e5', '#43a047', '#8e24aa'][i % 4];
      var pts = null, tol = [0, 44, 36, 26, 0][lv - 1];
      var start = E('div', 'draw-mark', '🐰'), end = E('div', 'draw-mark', '🥕');
      if (lv >= 2 && lv <= 4) {
        var poly = PATHS[lv][i % PATHS[lv].length].map(function (p) { return [p[0] * W, p[1] * H]; });
        pts = []; for (var k = 0; k < poly.length - 1; k++) { var a = poly[k], b = poly[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 30); for (var s = 0; s < n; s++) pts.push({ x: a[0] + (b[0] - a[0]) * s / n, y: a[1] + (b[1] - a[1]) * s / n, hit: false }); }
        pts.push({ x: poly[poly.length - 1][0], y: poly[poly.length - 1][1], hit: false });
        g.setLineDash([2, 16]); g.strokeStyle = 'rgba(90,70,50,.55)'; g.lineWidth = lv === 4 ? 10 : 16; g.beginPath(); poly.forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke(); g.setLineDash([]);
        g.strokeStyle = 'rgba(255,200,60,.28)'; g.lineWidth = tol * 2; g.beginPath(); poly.forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke();
        start.style.left = poly[0][0] + 'px'; start.style.top = poly[0][1] + 'px'; end.style.left = poly[poly.length - 1][0] + 'px'; end.style.top = poly[poly.length - 1][1] + 'px';
        wrap.appendChild(start); wrap.appendChild(end);
      }
      if (lv === 5) { start.style.left = '8%'; start.style.top = '80%'; start.innerHTML = '🏠'; end.style.left = '90%'; end.style.top = '20%'; end.innerHTML = '🏫'; wrap.appendChild(start); wrap.appendChild(end); }
      var prog = E('div', 'draw-prog', '<span></span>'); ctx.board.appendChild(prog);
      var q = lv === 1 ? '손가락으로 마음껏 그려 봐요' : lv === 5 ? '집에서 학교까지 나만의 길을 그려요' : '토끼가 당근까지 가도록 점선을 따라 그려요';
      return ctx.ask(q).then(function () {
        return new Promise(function (res) {
          var drawing = false, last = null, ink = 0, finished = false;
          var hint = E('div', 'draw-hint'); if (pts) { ctx.target({ get: function () { return start; } }); }
          else ctx.target({ get: function () { return wrap; } });
          function xy(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
          cv.style.touchAction = 'none';
          cv.onpointerdown = function (e) { drawing = true; last = xy(e); O.clearPrompt(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} };
          cv.onpointermove = function (e) {
            if (!drawing || finished) return; var p = xy(e);
            g.strokeStyle = col; g.lineWidth = 12; g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke();
            ink += Math.hypot(p.x - last.x, p.y - last.y); last = p;
            var done = 0;
            if (pts) { pts.forEach(function (q2) { if (!q2.hit && Math.hypot(q2.x - p.x, q2.y - p.y) < tol) { q2.hit = true; } if (q2.hit) done++; }); done = done / pts.length; }
            else if (lv === 5) { var sx = 0.08 * W, sy = 0.8 * H, ex = 0.9 * W, ey = 0.2 * H; if (Math.hypot(p.x - sx, p.y - sy) < 60) ctx._s5 = true; if (ctx._s5 && Math.hypot(p.x - ex, p.y - ey) < 60) done = 1; else done = Math.min(.9, ink / (W * 1.2)); }
            else done = Math.min(1, ink / (W * 2.2));
            prog.firstChild.style.width = Math.round(done * 100) + '%';
            if (Math.random() < .08) O.sfx('tick');
            if (done >= (pts ? .88 : 1) && !finished) { finished = true; ctx._s5 = false; ctx.good(null, lv === 5 ? '길 완성!' : '잘 그렸어요!'); setTimeout(res, 1300); }
          };
          cv.onpointerup = cv.onpointercancel = function () { drawing = false; };
        });
      });
    }
  };

  /* ================= 도형으로 동물 만들기 ================= */
  var ANIMALS = [
    { label: '고양이', parts: [{ s: 'circle', c: '#ffb74d', x: 50, y: 55, w: 46, h: 46, name: '동그라미 얼굴' }, { s: 'triangle', c: '#fb8c00', x: 33, y: 28, w: 18, h: 20, name: '세모 귀' }, { s: 'triangle', c: '#fb8c00', x: 67, y: 28, w: 18, h: 20, name: '세모 귀' }, { s: 'circle', c: '#3e2723', x: 42, y: 52, w: 7, h: 7, name: '눈' }, { s: 'circle', c: '#3e2723', x: 58, y: 52, w: 7, h: 7, name: '눈' }] },
    { label: '물고기', parts: [{ s: 'circle', c: '#4fc3f7', x: 45, y: 50, w: 50, h: 34, name: '동그라미 몸' }, { s: 'triangle-r', c: '#0288d1', x: 80, y: 50, w: 22, h: 28, name: '세모 꼬리' }, { s: 'circle', c: '#fff', x: 33, y: 45, w: 9, h: 9, name: '눈' }] },
    { label: '로봇 곰', parts: [{ s: 'square', c: '#a1887f', x: 50, y: 58, w: 42, h: 38, name: '네모 얼굴' }, { s: 'circle', c: '#8d6e63', x: 32, y: 34, w: 16, h: 16, name: '동그라미 귀' }, { s: 'circle', c: '#8d6e63', x: 68, y: 34, w: 16, h: 16, name: '동그라미 귀' }, { s: 'square', c: '#fff3e0', x: 50, y: 66, w: 18, h: 12, name: '네모 입' }] }
  ];
  function shapeHtml(p, ghost) {
    var st = 'background:' + (ghost ? 'transparent' : p.c) + ';';
    var cls = 'shp ' + p.s + (ghost ? ' ghost' : '');
    return '<div class="' + cls + '" style="' + st + '"></div>';
  }
  EN.build = {
    rounds: [2, 3, 3, 3, 1],
    round: function (ctx, i) {
      var lv = ctx.level; ctx.clear();
      var an = ANIMALS[i % ANIMALS.length];
      var stage = E('div', 'build-stage');
      ctx.board.appendChild(stage);
      if (lv === 5) return buildFree(ctx, stage);
      var missing = Math.min(an.parts.length, [1, 2, 3, 5, 5][lv - 1]);
      var miss = an.parts.slice(0, missing);
      var slots = [];
      an.parts.forEach(function (p) {
        var d = E('div', 'bpart', shapeHtml(p, miss.indexOf(p) >= 0 && lv < 4));
        d.style.left = p.x + '%'; d.style.top = p.y + '%'; d.style.width = p.w + '%'; d.style.height = p.h + '%';
        if (miss.indexOf(p) >= 0) { d.classList.add('dropzone', 'bslot'); if (lv >= 4) d.classList.add('hidden-slot'); d._p = p; slots.push(d); }
        stage.appendChild(d);
      });
      var tray = row('items tray');
      var pieces = O.shuffle(miss).map(function (p) { var b = E('button', 'oks-card piece small', '<div class="pic"><div class="shp-wrap">' + shapeHtml(p) + '</div></div><div class="lab">' + p.name + '</div>'); b.type = 'button'; b._p = p; tray.appendChild(b); return b; });
      ctx.board.appendChild(tray);
      var same = function (a, b) { return a.s === b.s && a.w === b.w && a.c === b.c; };
      var left = slots.length;
      function tgt() { var z = slots.filter(function (s) { return !s._filled; })[0]; if (!z) return; var pc = pieces.filter(function (x) { return !x._done && same(x._p, z._p); })[0]; ctx.target({ get: function () { return pc; }, to: function () { return z; } }); }
      return ctx.ask(lv === 1 ? an.label + ' 얼굴을 완성해요. 도형을 옮겨요' : '빈 곳에 알맞은 도형을 옮겨 ' + an.label + '를 만들어요').then(function () {
        tgt();
        return ctx.dnd(pieces, slots, function (pc, z) { return !z._filled && same(pc._p, z._p); }, function (pc, z) {
          z._filled = true; z.innerHTML = shapeHtml(z._p); z.classList.add('placed'); pc.style.visibility = 'hidden'; left--; O.say(pc._p.name, { noRepeat: true });
          ctx.good(null, left === 0 ? an.label + ' 완성!' : false); tgt();
        }, function () { return left === 0; }).then(function () { stage.classList.add('wiggle'); return O.wait(1400); });
      });
    }
  };
  function buildFree(ctx, stage) {
    var kinds = [{ s: 'circle', c: '#ffb74d', name: '동그라미' }, { s: 'triangle', c: '#e57373', name: '세모' }, { s: 'square', c: '#64b5f6', name: '네모' }, { s: 'circle', c: '#3e2723', name: '작은 눈', small: true }];
    var cur = kinds[0], n = 0;
    var tray = row('items tray');
    kinds.forEach(function (k) { var b = E('button', 'oks-card piece small', '<div class="pic"><div class="shp-wrap">' + shapeHtml(k) + '</div></div><div class="lab">' + k.name + '</div>'); b.type = 'button'; b.onclick = function () { cur = k; tray.querySelectorAll('.piece').forEach(function (x) { x.classList.remove('good'); }); b.classList.add('good'); O.say(k.name, { noRepeat: true }); }; tray.appendChild(b); });
    tray.firstChild.classList.add('good');
    var fin = E('button', 'oks-btn orange', '다 만들었어요'); fin.type = 'button';
    ctx.board.appendChild(tray); var r = row('center'); r.appendChild(fin); ctx.board.appendChild(r);
    stage.classList.add('free');
    return ctx.ask('도형을 골라 빈 곳을 눌러요. 나만의 동물을 만들어요!').then(function () {
      return new Promise(function (res) {
        stage.onclick = function (e) { var rc = stage.getBoundingClientRect(); var x = (e.clientX - rc.left) / rc.width * 100, y = (e.clientY - rc.top) / rc.height * 100; var sz = cur.small ? 7 : 24;
          var d = E('div', 'bpart placed', shapeHtml(cur)); d.style.left = x + '%'; d.style.top = y + '%'; d.style.width = sz + '%'; d.style.height = sz + '%'; stage.appendChild(d); n++; O.sfx('pop'); O.clearPrompt(); };
        ctx.target({ get: function () { return n >= 3 ? fin : stage; } });
        fin.onclick = function () { if (n < 2) { O.say('도형을 더 놓아 볼까요?', { noRepeat: true }); return; } stage.classList.add('wiggle'); ctx.good(fin, '멋진 동물!'); setTimeout(res, 1400); };
      });
    });
  }

  /* ================= 미술실 연결 ================= */
  EN.portal = {
    rounds: [1, 1, 1, 1, 1],
    round: function (ctx) {
      var c = ctx.cfg, lv = ctx.level; ctx.clear();
      var diff = ['easy', 'easy', 'normal', 'hard', 'hard'][lv - 1];
      var box = E('div', 'portal', '<div class="portal-ico">' + (c.emo || '🎨') + '</div><h3>' + O.esc(c.title) + '</h3><p>' + O.esc(ctx.lesson.levels[lv - 1].replace(/^〈[^〉]*〉\s*/, '')) + '</p>');
      var go = E('a', 'oks-btn', '▶ ' + O.esc(c.button || '미술실에서 하기')); go.href = O.ROOT + 'classic.html?go=' + c.go + '&level=' + diff + '&from=' + ctx.id;
      var fin = E('button', 'oks-btn blue', '✓ 활동을 마쳤어요'); fin.type = 'button';
      box.appendChild(go); box.appendChild(fin); ctx.board.appendChild(box);
      return ctx.ask(c.q || '미술실로 가서 활동해요. 다 하면 돌아와서 마쳤어요를 눌러요').then(function () {
        ctx.target({ get: function () { return go; } });
        return new Promise(function (res) { fin.onclick = function () { ctx.good(fin); setTimeout(res, 700); }; });
      });
    }
  };
})();
