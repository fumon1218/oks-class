/* 씽씽 별 스포츠 구단 타이쿤
   - 선수 카드: 뽑기 없이 "별을 모으면 정해진 카드가 합류" (마구마구의 카드 수집·라인업·이닝 전광판만 가져옴)
   - 구단 시설: 코인으로 짓기. 잃는 것 없음
   - 오늘의 경기: 5개 공 종목 = 5이닝. 모두 마치면 시즌 보상
   진행 기록은 기존 oks_sports_progress_v4 에서 읽고, 구단 기록은 oks_tycoon_v1 에 저장 */
(function (g) {
  'use strict';
  var O = g.OKS, E = O.el, KEY = 'oks_tycoon_v1';
  var ASSET = 'assets/';

  var SPORTS = [
    { id: 'baseball', name: '야구', emo: '⚾' },
    { id: 'basketball', name: '농구', emo: '🏀' },
    { id: 'rugby', name: '럭비', emo: '🏉' },
    { id: 'tennis', name: '테니스', emo: '🎾' },
    { id: 'tabletennis', name: '탁구', emo: '🏓' }
  ];
  /* 카드 6장씩. need = 그 종목에서 모은 별 수 (첫 카드는 한 번 해 보면 합류) */
  var TIERS = [
    { k: 'N', name: '노말', power: 1, need: 0, plays: 1, cls: 'n' },
    { k: 'N', name: '노말', power: 1, need: 3, cls: 'n' },
    { k: 'R', name: '레어', power: 2, need: 6, cls: 'r' },
    { k: 'R', name: '레어', power: 2, need: 10, cls: 'r' },
    { k: 'E', name: '에픽', power: 3, need: 15, cls: 'e' },
    { k: 'L', name: '전설', power: 5, need: 22, cls: 'l' }
  ];
  var ROSTER = {
    baseball: [['타자 보미', 'batter_ready'], ['튼튼 배트', 'bat'], ['투수 마루', 'pitcher_ready'], ['포수 단이', 'catcher_ready'], ['마법 글러브', 'glove'], ['야구 마스코트', 'mascot']],
    basketball: [['가드 하늘', 'girl_ready'], ['우리 팀 유니폼', 'jersey'], ['슈터 하늘', 'girl_shoot'], ['센터 도윤', 'boy_catch'], ['반짝 골대', 'hoop'], ['치어리더 하늘', 'girl_cheer']],
    rugby: [['러너 도윤', 'boy_stand'], ['럭비공', 'ball'], ['수비수 나래', 'girl_flag'], ['트라이 도윤', 'boy_try'], ['골대', 'goalposts'], ['응원단장 도윤', 'boy_cheer']],
    tennis: [['선수 도윤', 'boy_ready'], ['튼튼 라켓', 'racket'], ['선수 나래', 'girl_ready'], ['서브왕 도윤', 'boy_serve'], ['테니스 네트', 'net'], ['응원단장 도윤', 'boy_cheer']],
    tabletennis: [['선수 나래', 'girl_ready'], ['반짝 라켓', 'paddle'], ['선수 도윤', 'boy_ready'], ['서브 나래', 'girl_serve'], ['탁구대', 'table'], ['응원단장 나래', 'girl_cheer']]
  };
  var CARDS = [];
  SPORTS.forEach(function (s) {
    ROSTER[s.id].forEach(function (r, i) {
      var t = TIERS[i];
      CARDS.push({ id: s.id + i, sport: s.id, emo: s.emo, sname: s.name, name: r[0], img: ASSET + s.id + '/' + r[1] + '.webp', tier: i, tname: t.name, cls: t.cls, power: t.power, need: t.need, plays: t.plays || 0, thing: /배트|글러브|유니폼|골대|럭비공|라켓|네트|탁구대|마스코트/.test(r[0]) });
    });
  });
  var BYID = {}; CARDS.forEach(function (c) { BYID[c.id] = c; });

  var FAC = [
    { id: 'board', name: '전광판', img: 'baseball/scoreboard', cost: 40, perk: 4, tip: '점수가 크게 보여요' },
    { id: 'base', name: '잔디 구장', img: 'baseball/base', cost: 30, perk: 3, tip: '푹신한 새 잔디' },
    { id: 'hoop', name: '농구 골대', img: 'basketball/hoop', cost: 50, perk: 4, tip: '반짝이는 새 골대' },
    { id: 'bottle', name: '물병 보관함', img: 'basketball/bottle', cost: 30, perk: 2, tip: '시원한 물 한 모금' },
    { id: 'court', name: '테니스 코트', img: 'tennis/court', cost: 60, perk: 5, tip: '넓은 새 코트' },
    { id: 'table', name: '탁구장', img: 'tabletennis/table', cost: 60, perk: 5, tip: '탁구대가 두 대' }
  ];
  var LEVEL_TITLES = ['동네 구단', '씽씽 구단', '별빛 구단', '은하 구단', '우주 챔피언 구단'];
  var LEVEL_AT = [0, 6, 14, 24, 36];

  function def() { return { name: '씽씽 별 구단', lineup: [], built: {}, seen: {}, season: { n: 1, inn: {} }, titles: 0, level: 2, school: 'elem' }; }
  function load() { var d = O.jget(KEY, null) || def(); var b = def(); Object.keys(b).forEach(function (k) { if (d[k] == null) d[k] = b[k]; }); return d; }
  function save(d) { O.jset(KEY, d); }
  function progress() { try { return JSON.parse(localStorage.getItem('oks_sports_progress_v4') || '{}'); } catch (e) { return {}; } }
  function sportStat(id) {
    var p = progress(), stars = 0, plays = 0;
    Object.keys(p).forEach(function (k) { if (k.indexOf(id + '-') === 0) { var x = p[k] || {}; plays += x.plays || 0; Object.keys(x.best || {}).forEach(function (lv) { stars += x.best[lv] || 0; }); } });
    return { stars: stars, plays: plays };
  }
  function owned() {
    var st = {}; SPORTS.forEach(function (s) { st[s.id] = sportStat(s.id); });
    return CARDS.filter(function (c) { var s = st[c.sport]; return c.plays ? s.plays >= c.plays : s.stars >= c.need; });
  }
  function ownedSet() { var o = {}; owned().forEach(function (c) { o[c.id] = 1; }); return o; }
  function power(d) {
    var os = ownedSet(), sum = 0, sp = {};
    d.lineup.forEach(function (id) { if (id && os[id]) { sum += BYID[id].power; sp[BYID[id].sport] = 1; } });
    var all = SPORTS.every(function (s) { return sp[s.id]; });
    return { sum: sum, all: all, total: sum + (all ? 10 : 0) };
  }
  function facPerk(d) { var n = 0; FAC.forEach(function (f) { if (d.built[f.id]) n += f.perk; }); return n; }
  function clubLevel(d) {
    var score = owned().length + Object.keys(d.built).length * 2 + (d.titles || 0) * 3, lv = 0;
    LEVEL_AT.forEach(function (a, i) { if (score >= a) lv = i; });
    return { lv: lv + 1, title: LEVEL_TITLES[lv], score: score, next: LEVEL_AT[lv + 1] };
  }
  function seasonDone(d) { return SPORTS.every(function (s) { return d.season.inn[s.id] != null; }); }
  function lessonFor(d) { return ((d.season.n - 1) % 3) + 1; }

  /* 경기 끝 → 이닝 기록 (sports.js endSport 에서 호출) */
  function inning(sportId, stars) {
    var d = load();
    if (d.season.inn[sportId] == null) d.season.inn[sportId] = stars || 1;
    save(d);
    return { done: seasonDone(d), left: SPORTS.filter(function (s) { return d.season.inn[s.id] == null; }).length };
  }

  function say(t) { try { O.say(t, { noRepeat: true }); } catch (e) { } }
  function calm() { try { return !!(O.settings() && O.settings().calm); } catch (e) { return false; } }

  /* ---------- 화면 ---------- */
  function open() {
    document.body.classList.add('sports-hubmap');
    var d = load(), tab = 'game';
    var root = E('div', 'tc-root');
    root.innerHTML = '<div class="tc-top"><a class="oks-pill tc-exit" href="./">🌌 <span>씽씽 별 마을</span></a><div class="tc-title"><b>🏟️ 스포츠 구단 타이쿤</b><span>별을 모으고 · 선수를 모으고 · 구단을 키워요</span></div><div class="tc-hud"></div></div>' +
      '<div class="tc-club"></div><nav class="tc-tabs"></nav><main class="tc-body"></main>';
    document.body.innerHTML = ''; document.body.appendChild(root);
    var club = root.querySelector('.tc-club'), tabs = root.querySelector('.tc-tabs'), body = root.querySelector('.tc-body');
    if (O.eco && O.eco.hud) { try { O.eco.hud(root.querySelector('.tc-hud')); } catch (x) { } }

    var TABS = [['game', '⚾ 오늘의 경기'], ['cards', '🃏 선수 카드'], ['lineup', '📋 라인업'], ['fac', '🏗️ 구단 시설']];
    TABS.forEach(function (t) {
      var b = E('button', 'tc-tab', t[1]); b.type = 'button'; b.dataset.k = t[0];
      b.onclick = function () { tab = t[0]; O.sfx('tick'); draw(); }; tabs.appendChild(b);
    });

    function drawClub() {
      var L = clubLevel(d), P = power(d), os = owned().length;
      club.innerHTML = '<img class="tc-emblem" src="' + ASSET + 'baseball/mascot.webp" alt="">' +
        '<div class="tc-clubinfo"><button type="button" class="tc-name" title="이름 바꾸기">' + O.esc(d.name) + ' <i>✏️</i></button>' +
        '<div class="tc-lvl"><b>Lv.' + L.lv + '</b> ' + L.title + (L.next ? ' <small>(다음 구단까지 ' + (L.next - L.score) + ')</small>' : ' 🏆') + '</div>' +
        '<div class="tc-chips"><span>🃏 카드 ' + os + '/' + CARDS.length + '</span><span>📣 응원력 ' + P.total + '</span><span>🏗️ 시설 ' + Object.keys(d.built).length + '/' + FAC.length + '</span><span>🏆 우승 ' + (d.titles || 0) + '번</span></div></div>';
      club.querySelector('.tc-name').onclick = function () {
        var n = prompt('우리 구단 이름을 지어요', d.name);
        if (n && n.trim()) { d.name = n.trim().slice(0, 12); save(d); O.sfx('ok'); drawClub(); say(d.name + '! 멋진 이름이에요'); }
      };
    }

    function card(c, opt) {
      opt = opt || {};
      var has = opt.has, el = E(opt.click ? 'button' : 'div', 'tc-card ' + c.cls + (has ? '' : ' locked') + (opt.pick ? ' pick' : '') + (c.thing ? ' thing' : ''));
      if (opt.click) el.type = 'button';
      var cond = c.plays ? '한 번 해 보면 합류' : '⭐ ' + c.need + '개 모으면';
      el.innerHTML = '<span class="tc-rar">' + c.tname + '</span><span class="tc-sp">' + c.emo + '</span><span class="tc-pic"><img src="' + c.img + '" alt="" loading="lazy"></span>' +
        '<b>' + (has ? O.esc(c.name) : '???') + '</b><small>' + (has ? '📣 응원력 +' + c.power : '🔒 ' + c.sname + ' ' + cond) + '</small>';
      return el;
    }

    /* 새로 합류한 카드 알림 */
    function newCards() {
      var os = owned(), fresh = os.filter(function (c) { return !d.seen[c.id]; });
      if (!fresh.length) return Promise.resolve();
      if (fresh.length > 3) {
        fresh.forEach(function (c) { d.seen[c.id] = 1; }); save(d);
        return new Promise(function (res) {
          var ov = E('div', 'tc-modal'), box = E('div', 'tc-pop');
          box.innerHTML = '<h2>🎉 선수 ' + fresh.length + '명이 합류했어요!</h2><p class="tc-note">지금까지 모은 별 덕분에 카드가 모였어요. <b>🃏 선수 카드</b>에서 볼 수 있어요.</p>';
          var ok = E('button', 'oks-btn orange', '좋아요!'); ok.type = 'button'; ok.onclick = function () { ov.remove(); O.sfx('pop'); res(); };
          box.appendChild(ok); ov.appendChild(box); root.appendChild(ov); O.sfx('win'); say('선수 ' + fresh.length + '명이 합류했어요');
        });
      }
      return new Promise(function (res) {
        var i = 0;
        (function one() {
          if (i >= fresh.length) { save(d); res(); return; }
          var c = fresh[i++]; d.seen[c.id] = 1;
          var ov = E('div', 'tc-modal'), box = E('div', 'tc-pop');
          box.innerHTML = '<h2>🎉 새 선수가 합류했어요!</h2>'; box.appendChild(card(c, { has: true }));
          var ok = E('button', 'oks-btn orange', i < fresh.length ? '다음 카드 ▶' : '좋아요!'); ok.type = 'button';
          ok.onclick = function () { ov.remove(); O.sfx('pop'); one(); };
          box.appendChild(ok); ov.appendChild(box); root.appendChild(ov);
          O.sfx('win'); say(c.name + ' 카드가 합류했어요');
        })();
      });
    }

    /* 시즌 보상 */
    function claim() {
      if (!seasonDone(d)) return Promise.resolve();
      var P = power(d), perk = facPerk(d), stars = 0;
      SPORTS.forEach(function (s) { stars += d.season.inn[s.id] || 0; });
      var coins = 20 + stars * 2 + P.total + perk, xp = 15 + stars;
      var rows = [['이닝 별 ' + stars + '개 × 2', stars * 2], ['기본 보상', 20], ['응원력', P.total], ['구단 시설', perk]];
      d.titles = (d.titles || 0) + 1; var n = d.season.n; d.season = { n: n + 1, inn: {} }; save(d);
      try { O.eco.reward({ coins: coins, xp: xp, delay: 200 }); } catch (e) { }
      return new Promise(function (res) {
        var ov = E('div', 'tc-modal'), box = E('div', 'tc-pop big');
        box.innerHTML = '<div class="tc-trophy">🏆</div><h2>시즌 ' + n + ' 우승!</h2><p>' + O.esc(d.name) + '이(가) 5이닝을 모두 마쳤어요.</p><ul class="tc-sum">' +
          rows.map(function (r) { return '<li><span>' + r[0] + '</span><b>+' + r[1] + '</b></li>'; }).join('') + '<li class="tot"><span>🪙 코인</span><b>+' + coins + '</b></li></ul>';
        var ok = E('button', 'oks-btn orange', '다음 시즌 시작!'); ok.type = 'button';
        ok.onclick = function () { ov.remove(); O.sfx('pop'); drawClub(); draw(); res(); };
        box.appendChild(ok); ov.appendChild(box); root.appendChild(ov); O.sfx('win'); say('시즌 ' + n + ' 우승! 축하해요');
        if (!calm()) confetti(box);
      });
    }
    function confetti(host) {
      var cols = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff'];
      for (var i = 0; i < 26; i++) {
        var p = E('i', 'tc-conf'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % 5];
        p.style.animationDelay = (Math.random() * .6) + 's'; p.style.animationDuration = (1.4 + Math.random()) + 's'; host.appendChild(p);
      }
    }

    /* ----- 탭: 오늘의 경기 ----- */
    function tabGame() {
      var h = '<section class="tc-sec"><h2>📺 시즌 ' + d.season.n + ' · 오늘의 경기</h2><p class="tc-note">5개 공 운동이 5이닝이에요. 이닝을 눌러 경기를 하고 별을 모으면 점수판이 채워져요.</p>';
      h += '<div class="tc-board"><div class="tc-bh"><span></span>' + SPORTS.map(function (s, i) { return '<span>' + (i + 1) + '회</span>'; }).join('') + '<span>합계</span></div><div class="tc-br"><b>' + O.esc(d.name) + '</b>';
      var sum = 0, first = null;
      SPORTS.forEach(function (s) {
        var v = d.season.inn[s.id]; if (v != null) sum += v; else if (!first) first = s;
        h += '<button type="button" class="tc-inn ' + (v != null ? 'done' : (first === s ? 'now' : '')) + '" data-s="' + s.id + '"><i>' + s.emo + '</i><em>' + (v != null ? '⭐'.repeat(v) : (first === s ? '▶ 지금' : s.name)) + '</em></button>';
      });
      h += '<span class="tc-sum2">' + sum + '</span></div></div>';
      h += '<div class="tc-ctl"><div><small>학년</small><div class="tc-pills" data-g="school">' + [['elem', '초등'], ['middle', '중등'], ['high', '고등']].map(function (x) { return '<button type="button" data-v="' + x[0] + '" class="' + (d.school === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
        '<div><small>수준</small><div class="tc-pills" data-g="level">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-v="' + n + '" class="' + (d.level === n ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div></div></div>';
      var P = power(d);
      h += '<p class="tc-note">📣 지금 응원력 <b>' + P.total + '</b> · 🏗️ 시설 보너스 <b>+' + facPerk(d) + '</b> → 시즌이 끝나면 코인으로 돌아와요. 못 하는 경기가 있어도 괜찮아요. 별이 적어도 이닝은 채워져요.</p>';
      var go = first;
      h += go ? '<button type="button" class="oks-btn orange tc-go">▶ ' + go.emo + ' ' + go.name + ' 경기 시작</button>' : '';
      h += '</section>';
      body.innerHTML = h;
      function launch(sid) { location.href = '?festival=summer&sport=' + sid + '&school=' + d.school + '&lesson=' + lessonFor(d) + '&level=' + d.level + '&play=1&season=1'; }
      var gobtn = body.querySelector('.tc-go'); if (gobtn) gobtn.onclick = function () { O.sfx('pop'); say(go.name + ' 경기를 시작해요'); setTimeout(function () { launch(go.id); }, 350); };
      Array.prototype.forEach.call(body.querySelectorAll('.tc-inn'), function (b) {
        b.onclick = function () {
          var id = b.dataset.s, s = SPORTS.filter(function (x) { return x.id === id; })[0];
          if (d.season.inn[id] != null) { O.sfx('tick'); O.toast(s.name + ' 이닝은 끝났어요. 다음 이닝을 해요'); return; }
          O.sfx('pop'); setTimeout(function () { launch(id); }, 250);
        };
      });
      Array.prototype.forEach.call(body.querySelectorAll('.tc-pills'), function (p) {
        p.onclick = function (e) {
          var b = e.target.closest('button'); if (!b) return; O.sfx('tick');
          if (p.dataset.g === 'school') d.school = b.dataset.v; else d.level = +b.dataset.v;
          save(d); tabGame(); markTab();
        };
      });
    }

    /* ----- 탭: 선수 카드 ----- */
    function tabCards() {
      var os = ownedSet(), h = '<section class="tc-sec"><h2>🃏 선수 카드 도감</h2><p class="tc-note">뽑기는 없어요! 종목마다 별을 모으면 정해진 카드가 하나씩 합류해요. 🔒 카드에는 모으는 방법이 적혀 있어요.</p>';
      SPORTS.forEach(function (s) {
        var st = sportStat(s.id), mine = CARDS.filter(function (c) { return c.sport === s.id && os[c.id]; }).length;
        h += '<div class="tc-row"><h3>' + s.emo + ' ' + s.name + ' <small>카드 ' + mine + '/6 · ⭐ ' + st.stars + '</small></h3><div class="tc-cards" data-s="' + s.id + '"></div></div>';
      });
      h += '</section>'; body.innerHTML = h;
      SPORTS.forEach(function (s) {
        var host = body.querySelector('.tc-cards[data-s="' + s.id + '"]');
        CARDS.filter(function (c) { return c.sport === s.id; }).forEach(function (c) {
          var el = card(c, { has: !!os[c.id], click: true });
          el.onclick = function () { O.sfx('tick'); if (os[c.id]) say(c.name + '. 응원력 ' + c.power); else O.toast(c.sname + (c.plays ? '을 한 번 해 보면 합류해요' : ' 별 ' + c.need + '개를 모으면 합류해요')); };
          host.appendChild(el);
        });
      });
    }

    /* ----- 탭: 라인업 ----- */
    function tabLineup() {
      var os = ownedSet(), P = power(d), h = '<section class="tc-sec"><h2>📋 선발 라인업 <small>9명</small></h2><p class="tc-note">좋아하는 카드를 9칸에 넣어요. 응원력이 높을수록 시즌 코인이 늘어요. 5종목 카드를 한 장씩 넣으면 <b>올스타 +10</b>!</p>';
      h += '<div class="tc-power"><b>📣 ' + P.total + '</b><span>' + (P.all ? '⭐ 올스타 보너스 +10 적용!' : '5종목을 모두 넣으면 올스타 +10') + '</span></div><div class="tc-slots">';
      for (var i = 0; i < 9; i++) {
        var id = d.lineup[i], c = id && os[id] ? BYID[id] : null;
        h += '<button type="button" class="tc-slot ' + (c ? 'has ' + c.cls : '') + '" data-i="' + i + '"><em>' + (i + 1) + '</em>' + (c ? '<img src="' + c.img + '" alt=""><b>' + O.esc(c.name) + '</b><small>' + c.emo + ' +' + c.power + '</small>' : '<i>＋</i><small>카드 넣기</small>') + '</button>';
      }
      h += '</div><button type="button" class="oks-btn blue tc-auto">✨ 추천 라인업으로 채우기</button></section>';
      body.innerHTML = h;
      Array.prototype.forEach.call(body.querySelectorAll('.tc-slot'), function (b) { b.onclick = function () { O.sfx('pop'); pickCard(+b.dataset.i); }; });
      body.querySelector('.tc-auto').onclick = function () {
        var list = owned().sort(function (a, b) { return b.power - a.power || a.tier - b.tier; }), out = [], used = {}, sp = {};
        SPORTS.forEach(function (s) { var c = list.filter(function (x) { return x.sport === s.id; })[0]; if (c) { out.push(c.id); used[c.id] = 1; } });
        list.forEach(function (c) { if (out.length < 9 && !used[c.id]) { out.push(c.id); used[c.id] = 1; } });
        d.lineup = out.slice(0, 9); save(d); O.sfx('ok'); say('추천 라인업이에요'); drawClub(); tabLineup(); markTab();
      };
    }
    function pickCard(slot) {
      var os = owned(), ov = E('div', 'tc-modal'), box = E('div', 'tc-pop wide');
      box.innerHTML = '<h2>' + (slot + 1) + '번 자리에 누구를 넣을까요?</h2>';
      var grid = E('div', 'tc-cards pickgrid');
      var cur = d.lineup[slot];
      os.forEach(function (c) {
        var el = card(c, { has: true, click: true, pick: d.lineup.indexOf(c.id) >= 0 });
        if (d.lineup.indexOf(c.id) >= 0) el.classList.add('used');
        el.onclick = function () {
          var j = d.lineup.indexOf(c.id);
          if (j >= 0 && j !== slot) { d.lineup[j] = cur || null; }
          d.lineup[slot] = c.id;
          for (var k = 0; k < 9; k++) if (d.lineup[k] === undefined) d.lineup[k] = null;
          save(d); ov.remove(); O.sfx('ok'); say(c.name); drawClub(); tabLineup();
        };
        grid.appendChild(el);
      });
      box.appendChild(grid);
      var row = E('div', 'tc-btnrow');
      if (cur) { var rm = E('button', 'oks-btn blue', '이 자리 비우기'); rm.type = 'button'; rm.onclick = function () { d.lineup[slot] = null; save(d); ov.remove(); O.sfx('tick'); drawClub(); tabLineup(); }; row.appendChild(rm); }
      var cl = E('button', 'oks-btn', '닫기'); cl.type = 'button'; cl.onclick = function () { ov.remove(); }; row.appendChild(cl);
      box.appendChild(row); ov.appendChild(box); ov.onclick = function (e) { if (e.target === ov) ov.remove(); }; root.appendChild(ov);
    }

    /* ----- 탭: 구단 시설 ----- */
    function tabFac() {
      var coins = O.eco ? O.eco.info().coins : 0;
      var h = '<section class="tc-sec"><h2>🏗️ 구단 시설</h2><p class="tc-note">코인으로 시설을 지어요. 지은 시설은 시즌이 끝날 때마다 코인을 더 가져다줘요. 🪙 ' + coins + '</p><div class="tc-facs">';
      FAC.forEach(function (f) {
        var has = d.built[f.id];
        h += '<div class="tc-fac ' + (has ? 'built' : '') + '"><div class="tc-fpic"><img src="' + ASSET + f.img + '.webp" alt=""></div><b>' + f.name + '</b><small>' + f.tip + '</small><span>시즌 보상 +' + f.perk + '</span>' +
          (has ? '<em>✅ 완성!</em>' : '<button type="button" class="oks-btn orange" data-f="' + f.id + '">🪙 ' + f.cost + ' 짓기</button>') + '</div>';
      });
      h += '</div></section>'; body.innerHTML = h;
      Array.prototype.forEach.call(body.querySelectorAll('[data-f]'), function (b) {
        b.onclick = function () {
          var f = FAC.filter(function (x) { return x.id === b.dataset.f; })[0];
          if (!O.eco || !O.eco.spend(f.cost)) { O.sfx('no'); O.toast('코인이 조금 모자라요. 경기를 하면 모여요!'); return; }
          d.built[f.id] = 1; save(d); O.sfx('coin'); O.sfx('win'); say(f.name + '이 완성됐어요!');
          if (O.eco.refresh) O.eco.refresh(); drawClub(); tabFac(); markTab();
        };
      });
    }

    function markTab() { Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle('on', b.dataset.k === tab); }); }
    function draw() { markTab(); body.scrollTop = 0; ({ game: tabGame, cards: tabCards, lineup: tabLineup, fac: tabFac })[tab](); }

    drawClub(); draw();
    claim().then(newCards).then(function () { if (!document.querySelector('.tc-modal')) say('구단에 온 걸 환영해요. 오늘의 경기를 시작해 봐요'); });
  }

  g.OKS_TYCOON = { open: open, inning: inning, cards: CARDS, owned: owned, load: load };
})(window);
