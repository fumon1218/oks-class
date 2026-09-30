/* 가게 영업(타이쿤) 실행기 — 정글 점프 체험마을·원주분원 타이쿤 방식
   손님 입장 → 인사 → 주문(그림+소리) → 작업대 순서 → 드리기 → 계산 → 팁 코인 → 다음 손님 … → 하루 결산
   단골손님(3번 오면), 오늘의 특별 손님(고릴라 대장), 가게 꾸미기(코인으로 사기)가 있어요. */
(function () {
  'use strict';
  var O = window.OKS, E = O.el, SH = window.OKS_SHOPS, HALLS = window.OKS_HALLS, ST = window.OKS_STATIONS;
  var DATA = window.OKS_LESSONS;
  var LOOKS = ['dog', 'cat', 'rabbit', 'bear', 'panda', 'penguin', 'monkey', 'fox', 'koala', 'frog', 'owl', 'elephant', 'tiger', 'parrot'];
  var LOOKN = { dog: '강아지', cat: '고양이', rabbit: '토끼', bear: '곰', panda: '판다', penguin: '펭귄', monkey: '원숭이', fox: '여우', koala: '코알라', frog: '개구리', owl: '부엉이', elephant: '코끼리', tiger: '호랑이', parrot: '앵무새', gorilla_king: '고릴라 대장' };
  var STEPICON = { greet: ['👋', '인사'], pick: ['🖐', '고르기'], count: ['🧺', '담기'], seq: ['🔢', '순서'], hold: ['✋', '꾹 누르기'], timing: ['⏱', '타이밍'], rub: ['🧽', '문지르기'], tapN: ['👆', '톡톡'], wait: ['⏲', '기다리기'], sort: ['♻️', '나누기'], pattern: ['📿', '규칙'], pay: ['💵', '계산'], fly: ['🚁', '날기'], scan: ['🔘', '스위치'], situation: ['🤝', '돕기'], serve: ['🎁', '드리기'] };
  var DECO = [
    { id: 'plant', icon: '🪴', name: '화분', price: 30 }, { id: 'balloon', icon: '🎈', name: '풍선', price: 40 }, { id: 'frame', icon: '🖼️', name: '액자', price: 50 },
    { id: 'light', icon: '💡', name: '반짝 조명', price: 60 }, { id: 'flower', icon: '💐', name: '꽃다발', price: 70 }, { id: 'bear', icon: '🧸', name: '곰 인형', price: 80 },
    { id: 'music', icon: '📻', name: '음악 상자 (손님이 오면 노래)', price: 100 }, { id: 'sign', icon: '🌟', name: '금빛 간판 (손님마다 🪙+1)', price: 150 }
  ];
  var CAMPN = { gn: '강릉분원', cc: '춘천본원', wj: '원주분원' };
  var id = O.qs('id');
  O.applyBody(); document.body.classList.add('oks');
  if (!id || !SH[id]) return directory();

  var S = SH[id], hall = HALLS[S.hall] || {};
  var level = O.levelFor('shop:' + id);
  var backUrl = O.ret('../index.html#dream/b_shop_street');
  var lessonsInfo = (S.lessons || []).map(function (lid) { return DATA.lessons.filter(function (l) { return l.id === lid; })[0]; }).filter(Boolean);
  var sh = O.shell({ title: S.icon + ' ' + S.name, subtitle: CAMPN[S.camp] + ' · ' + (hall.name || '') + (lessonsInfo.length ? ' · 연계 ' + lessonsInfo.map(function (l) { return l.subjectName + ' ' + l.no; }).join(', ') : ''), back: backUrl, backLabel: '꿈별로', level: level });
  document.title = S.name + ' · 옥쌤의 즐거운 교실';
  if (O.eco) { var hh = O.eco.hud(sh.top); sh.top.insertBefore(hh, sh.levelBtn); }
  sh.board.className = 'oks-board shop-board';
  var stage = E('div', 'stage ' + (S.bg && S.bg.indexOf('img:') === 0 ? '' : S.bg || ''));
  if (S.bg && S.bg.indexOf('img:') === 0) stage.style.backgroundImage = 'url(' + O.ROOT + S.bg.slice(4) + ')';
  stage.innerHTML = '<div class="sign" style="--c:' + S.col + '">' + S.icon + ' ' + O.esc(S.name) + '</div><div class="deco"></div><div class="rack"></div>' +
    '<div class="cust"><div class="tag"></div><img alt=""><div class="pat"><span></span></div></div><div class="bubble"></div><div class="counter"></div>';
  var stepbar = E('div', 'stepbar');
  var desk = E('div', 'desk');
  sh.board.appendChild(stage); sh.board.appendChild(stepbar); sh.board.appendChild(desk);
  var custEl = stage.querySelector('.cust'), bubble = stage.querySelector('.bubble');
  var rec = O.eco ? O.eco.shop(id) : { days: 0, served: 0, best: {}, deco: { owned: [], eq: {} }, regs: {} };
  drawDeco();

  /* 수준 고르기 */
  sh.levelBtn.onclick = function () {
    var ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish oks-levelpick');
    box.innerHTML = '<h2>가게 수준</h2><p>' + O.esc(S.name) + '</p><div class="btns"></div>';
    O.LEVELS.forEach(function (L) {
      var b = E('button', 'oks-lv' + (L.n === level ? ' on' : ''), '<b>' + L.n + '</b><span><strong>' + L.name + '</strong><small>' + L.desc + '</small></span>');
      b.type = 'button'; b.onclick = function () { O.rememberLevel('shop:' + id, L.n); location.href = '?id=' + id + '&level=' + L.n; };
      box.querySelector('.btns').appendChild(b);
    });
    var c = E('button', 'oks-btn blue', '닫기'); c.type = 'button'; c.onclick = function () { ov.remove(); }; box.querySelector('.btns').appendChild(c);
    ov.appendChild(box); document.body.appendChild(ov);
  };

  function drawDeco() {
    var d = stage.querySelector('.deco'); d.innerHTML = '';
    (rec.deco.owned || []).forEach(function (k, i) { var it = DECO.filter(function (x) { return x.id === k; })[0]; if (it) d.insertAdjacentHTML('beforeend', '<span class="dc dc-' + it.id + '">' + it.icon + '</span>'); });
  }
  function decoShop(after) {
    var ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish deco-shop');
    function paint() {
      var coins = O.eco ? O.eco.info().coins : 0;
      box.innerHTML = '<h2>🎀 가게 꾸미기</h2><p>코인으로 꾸미면 손님이 더 좋아해요 · 내 코인 🪙 ' + coins + '</p><div class="deco-grid">' + DECO.map(function (it) {
        var own = rec.deco.owned.indexOf(it.id) >= 0;
        return '<button type="button" class="deco-it' + (own ? ' own' : coins < it.price ? ' poor' : '') + '" data-id="' + it.id + '"><span>' + it.icon + '</span><b>' + it.name + '</b><em>' + (own ? '✔ 있어요' : '🪙 ' + it.price) + '</em></button>';
      }).join('') + '</div><div class="btns"></div>';
      box.querySelectorAll('.deco-it').forEach(function (b) {
        b.onclick = function () {
          var it = DECO.filter(function (x) { return x.id === b.dataset.id; })[0];
          if (rec.deco.owned.indexOf(it.id) >= 0) return;
          if (!O.eco || !O.eco.spend(it.price)) { O.toast('코인이 조금 모자라요. 영업해서 모아요!'); O.sfx('no'); return; }
          rec.deco.owned.push(it.id); O.eco.saveShop(id, rec); O.eco.reward({ badge: ['deco'] }); O.sfx('coin'); O.say(it.name + '을 샀어요!', { noRepeat: true }); drawDeco(); paint();
        };
      });
      var c = E('button', 'oks-btn blue', '다 꾸몄어요'); c.type = 'button'; c.onclick = function () { ov.remove(); if (after) after(); };
      box.querySelector('.btns').appendChild(c);
    }
    paint(); ov.appendChild(box); document.body.appendChild(ov);
  }

  /* 작업대 도우미 */
  var st = O.newStats();
  var ctx = { sh: sh, level: level, stats: st, cfg: {}, desk: desk, stage: stage, board: desk, shop: S };
  O.kit(ctx);
  ctx.ask = function (t, o) { return sh.ask(t, o); };
  ctx.clearDesk = function () { O.clearPrompt(); desk.innerHTML = ''; };
  ctx.clear = ctx.clearDesk;

  /* ---------- 첫 화면 ---------- */
  function intro() {
    stage.classList.remove('open'); custEl.classList.remove('in');
    var regN = Object.keys(rec.regs || {}).filter(function (k) { return rec.regs[k] >= 3; }).length;
    desk.innerHTML = '<div class="intro"><div class="intro-how">' + S.how.map(function (h, i) { return '<p><b>' + (i + 1) + '</b>' + O.esc(h) + '</p>'; }).join('') + '</div>' +
      '<div class="intro-stat">📅 영업 ' + (rec.days || 0) + '일 · 🙋 ' + S.customerWord2 + (rec.served || 0) + '명 · 💛 단골 ' + regN + '명' + (lessonsInfo.length ? '<br>📚 ' + lessonsInfo.map(function (l) { return l.subjectName + ' ' + l.schoolName + ' ' + l.no + ' ' + l.topic; }).join(' / ') : '') + '</div>' +
      '<div class="intro-lv">' + O.LEVELS.map(function (L) { return '<a class="lvchip' + (L.n === level ? ' on' : '') + '" href="?id=' + id + '&level=' + L.n + '"><b>' + L.n + '</b>' + L.name + '</a>'; }).join('') + '</div><div class="row center btnrow"></div></div>';
    var go = E('button', 'oks-btn', '▶ 영업 시작!'); go.type = 'button';
    var dc = E('button', 'oks-btn pink', '🎀 꾸미기'); dc.type = 'button';
    desk.querySelector('.btnrow').appendChild(go); desk.querySelector('.btnrow').appendChild(dc);
    desk.querySelectorAll('.lvchip').forEach(function (a) { a.onclick = function () { O.rememberLevel('shop:' + id, +a.querySelector('b').textContent); }; });
    sh.ask(S.name + '에 온 걸 환영해요! 영업을 시작해 볼까요?', { silent: true });
    O.target({ get: function () { return go; } }, 2);
    go.onclick = function () { O.unlock(); O.clearPrompt(); runDay(); };
    dc.onclick = function () { O.unlock(); decoShop(); };
  }
  S.customerWord2 = S.customerWord ? S.customerWord + ' ' : '손님 ';

  /* ---------- 하루 영업 ---------- */
  function runDay() {
    st = O.newStats(); ctx.stats = st;
    var n = [3, 4, 5, 6, 6][level - 1], i = 0, dayCoins = 0, served = 0;
    var kingToday = level >= 2 && rec.kingDay !== (O.eco ? O.eco.today() : '');
    stage.classList.add('open');
    sh.setRounds(n, 0);
    function nextCustomer() {
      if (i >= n) return endDay();
      sh.setRounds(n, i);
      var king = kingToday && i === 1;
      var look = king ? 'gorilla_king' : pickLook();
      var visits = (rec.regs[look] || 0);
      var isReg = !king && visits >= 3;
      return enter(look, king, isReg).then(function () {
        var t0 = Date.now(), m0 = st.mistakes;
        var o = S.order(ctx, i);
        var steps = S.steps(ctx, o).slice();
        if (!S.noGreet) steps.unshift(Object.assign({ k: 'greet' }, S.greet || {}));
        if (S.price && !S.noPay) steps.push({ k: 'pay', price: o.price || S.price });
        drawStepbar(steps);
        return greetFirst(steps, o, king, isReg).then(function () {
          return runSteps(steps, o, 0);
        }).then(function () {
          /* 드리기 · 보상 */
          var mistakes = st.mistakes - m0, sec = (Date.now() - t0) / 1000;
          var patOk = level < 4 || sec < 70;
          var tip = 4 + (mistakes === 0 ? 2 : 0) + (isReg ? 2 : 0) + (king ? 15 : 0) + (rec.deco.owned.indexOf('sign') >= 0 ? 1 : 0) + (patOk ? 0 : -2);
          dayCoins += tip; served++;
          rec.regs[look] = visits + (king ? 0 : 1);
          var becameReg = !king && visits + 1 === 3;
          return serve(o, tip, king, becameReg);
        });
      }).then(function () { return leave(); }).then(function () { i++; return nextCustomer(); });
    }
    function endDay() {
      stage.classList.remove('open'); bubble.classList.remove('show'); stepbar.innerHTML = '';
      rec.days = (rec.days || 0) + 1; rec.served = (rec.served || 0) + served;
      if (kingToday) rec.kingDay = O.eco ? O.eco.today() : '';
      var stars = O.starsFor(st); rec.best[level] = Math.max(rec.best[level] || 0, stars);
      if (O.eco) O.eco.saveShop(id, rec);
      var entry = { at: new Date().toISOString(), lesson: (S.lessons && S.lessons[0]) || 'shop:' + id, subject: lessonsInfo[0] ? lessonsInfo[0].subject : 'career', school: 'elem', topic: S.name + ' 영업', level: level, engine: 'shop:' + id,
        rounds: n, mistakes: st.mistakes, glow: st.glow, hand: st.hand, asked: st.asked, sec: Math.round((Date.now() - st.t0) / 1000) };
      O.finish({ stats: st, entry: entry, title: S.name + ' 영업 끝!', text: S.customerWord2 + served + '명 · 오늘 번 코인 🪙' + dayCoins, coins: dayCoins, xp: 15 + level * 5 + stars * 4,
        mission: { shop: 1, cust: served }, badge: 'first_shop', speak: '오늘 영업 끝! 코인 ' + dayCoins + '개를 벌었어요',
        buttons: [{ label: '다음 날 영업', onClick: function () { location.reload(); } }, { label: '🎀 꾸미기', color: 'pink', onClick: function () { decoShop(function () { location.reload(); }); } }, { label: '🏠 마을로', color: 'blue', href: backUrl }] });
    }
    nextCustomer().catch(function (e) { console.error(e); O.toast('앗, 문제가 생겼어요. 다시 시작해 주세요.'); });
  }
  var lastLook = null;
  function pickLook() { var c = LOOKS.filter(function (l) { return l !== lastLook; }); var favRegs = c.filter(function (l) { return (rec.regs[l] || 0) >= 1; }); var l = Math.random() < 0.45 && favRegs.length ? O.pick(favRegs, 1)[0] : O.pick(c, 1)[0]; lastLook = l; return l; }
  function enter(look, king, isReg) {
    var img = custEl.querySelector('img'); img.src = O.ROOT + 'art/jj/animals/' + look + '.webp';
    custEl.className = 'cust' + (king ? ' king' : '');
    custEl.querySelector('.tag').innerHTML = (king ? '👑 ' : isReg ? '💛 ' : '') + LOOKN[look] + (isReg ? ' <small>단골</small>' : '');
    custEl.querySelector('.pat').style.display = level >= 4 ? '' : 'none';
    patience(level >= 4);
    void custEl.offsetWidth; custEl.classList.add('in');
    O.inst('bell', 1568); O.inst('bell', 1319, 0.15);
    if (rec.deco.owned.indexOf('music') >= 0) [523, 659, 784].forEach(function (f, k) { O.inst('xylo', f, 0.3 + k * 0.15); });
    return O.wait(O.settings().calm ? 200 : 750);
  }
  var patRaf = null;
  function patience(on) {
    cancelAnimationFrame(patRaf); var bar = custEl.querySelector('.pat span'); bar.style.width = '100%'; if (!on) return;
    var t0 = performance.now(); (function f(t) { var k = Math.max(0, 1 - (t - t0) / 70000); bar.style.width = k * 100 + '%'; bar.style.background = k > 0.5 ? '#43a047' : k > 0.2 ? '#fbc02d' : '#e53935'; if (k > 0) patRaf = requestAnimationFrame(f); })(t0);
  }
  function greetFirst(steps, o, king, isReg) {
    bubble.innerHTML = (king ? '<span class="crown">👑</span>' : '') + o.bubble; bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
    var line = (king ? '에헴! 고릴라 대장이다. ' : isReg ? '또 왔어요! ' : '') + o.say;
    return O.say(line, { noRepeat: true, lang: o.lang && !king && !isReg ? o.lang : undefined }).then(function () { O.setReplay(null); });
  }
  function drawStepbar(steps) {
    stepbar.innerHTML = steps.concat([{ k: 'serve' }]).filter(function (s) { return s.k !== 'serve' || true; }).map(function (s, k) { var ic = STEPICON[s.k] || ['•', '']; return '<span class="sb" data-k="' + k + '"><i>' + ic[0] + '</i><small>' + ic[1] + '</small></span>'; }).join('<em>›</em>');
  }
  function markStep(k) { stepbar.querySelectorAll('.sb').forEach(function (e) { var j = +e.dataset.k; e.classList.toggle('now', j === k); e.classList.toggle('done', j < k); }); }
  function runSteps(steps, o, k) {
    if (k >= steps.length) return Promise.resolve();
    markStep(k);
    var sp = steps[k], fn = ST[sp.k];
    if (!fn) return runSteps(steps, o, k + 1);
    setTimeout(fitDesk, 120);
    return fn(ctx, sp).then(function () { return runSteps(steps, o, k + 1); });
  }
  function fitDesk() { /* 작업대가 화면 아래로 잘리면 살짝 올려 보여 줌 */
    var r = desk.getBoundingClientRect(), over = r.bottom - innerHeight + 12;
    if (over > 0) window.scrollBy({ top: Math.min(over, r.top - 70), behavior: O.settings().calm ? 'auto' : 'smooth' });
  }
  function serve(o, tip, king, becameReg) {
    setTimeout(fitDesk, 120);
    markStep(99); ctx.clearDesk(); cancelAnimationFrame(patRaf);
    var prod = E('div', 'product oks-pop', o.product || '🎁'); desk.appendChild(prod);
    var give = E('button', 'oks-btn orange', '🎁 ' + (S.bye || '여기 있어요!')); give.type = 'button'; var r = E('div', 'row center'); r.appendChild(give); desk.appendChild(r);
    sh.ask('손님께 드려요!', { silent: level >= 3 });
    ctx.target({ get: function () { return give; } });
    return new Promise(function (res) {
      give.onclick = function () {
        O.clearPrompt(); O.say(S.bye || '여기 있어요! 감사합니다', { noRepeat: true, lang: S.bye && /[a-z]/i.test(S.bye) ? 'en-US' : undefined });
        ctx.fly(prod, custEl.querySelector('img'), o.product).then(function () {
          custEl.classList.add('happy'); bubble.innerHTML = '<span class="emo">😍</span><b>고마워요!</b>';
          var rack = stage.querySelector('.rack'); rack.insertAdjacentHTML('beforeend', '<span>' + (o.product || '🎁') + '</span>'); while (rack.children.length > 6) rack.firstChild.remove();
          var fl = E('div', 'coin-float', '🪙 +' + tip); stage.appendChild(fl); setTimeout(function () { fl.remove(); }, 1400);
          O.sfx('coin');
          if (king && O.eco) { O.eco.reward({ badge: ['king'] }); O.toast('👑 고릴라 대장이 팁을 듬뿍 줬어요! 🪙+' + tip); }
          if (becameReg) { O.toast('💛 ' + (custEl.querySelector('.tag').textContent.replace(/[👑💛]/g, '').trim()) + '가 단골손님이 되었어요!'); if (O.eco) O.eco.reward({ badge: ['reg'] }); }
          setTimeout(res, 1200);
        });
      };
    });
  }
  function leave() { bubble.classList.remove('show'); custEl.classList.remove('in', 'happy'); custEl.classList.add('out'); return O.wait(O.settings().calm ? 150 : 650).then(function () { custEl.classList.remove('out'); }); }

  window.OKS_SHOP_CTX = ctx;
  intro();

  /* ---------- 가게 목록 (id 없이 열 때) ---------- */
  function directory() {
    var sh2 = O.shell({ title: '🏪 가게 영업', subtitle: '강릉 · 춘천 · 원주 체험 가게', back: O.ret('../index.html#dream/b_shop_street'), backLabel: '꿈별로' });
    if (O.eco) { var h2 = O.eco.hud(sh2.top); sh2.top.insertBefore(h2, sh2.levelBtn); }
    sh2.levelBtn.style.display = 'none';
    sh2.ask('어느 가게에서 일해 볼까요?', { silent: true });
    sh2.board.className = 'oks-board shop-dir';
    ['gn', 'cc', 'wj'].forEach(function (c) {
      var open = !O.eco || O.eco.placeOpen(c);
      var sec = E('section', 'camp-sec' + (open ? '' : ' locked'));
      sec.innerHTML = '<h2>' + O.eco.PLACES[c].icon + ' ' + CAMPN[c] + (open ? '' : ' <small>🔒 레벨 ' + O.eco.PLACE_LV[c] + '에 열려요</small>') + '</h2><div class="shop-grid"></div>';
      Object.keys(HALLS).filter(function (h) { return HALLS[h].camp === c; }).forEach(function (h) {
        HALLS[h].items.forEach(function (sid) {
          var s = SH[sid], r = O.eco ? O.eco.shop(sid) : {};
          var a = E(open ? 'a' : 'div', 'shop-card', '<span class="ic" style="background:' + s.col + '">' + s.icon + '</span><b>' + s.name + '</b><small>' + O.esc(s.desc) + '</small><em>' + (r.days ? '영업 ' + r.days + '일' : '새 가게') + '</em>');
          if (open) a.href = '?id=' + sid;
          sec.querySelector('.shop-grid').appendChild(a);
        });
      });
      sh2.board.appendChild(sec);
    });
  }
})();
