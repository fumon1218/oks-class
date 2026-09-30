/* 마을: 춘천본원 · 원주분원 (정글 점프의 디오라마·건물 위치를 그대로 씀) + 버스 정류장 */
(function () {
  'use strict';
  var O = window.OKS, E = O.el, SH = window.OKS_SHOPS, HALLS = window.OKS_HALLS;
  var IW = 1666, IH = 944;
  var TOWNS = {
    cc: {
      name: '춘천본원', icon: '🏞️', img: 'cc.webp', start: [372, 512],
      spots: [
        { id: 'bus', icon: '🚌', text: '버스 정류장', col: '#e0a800', sign: [116, 404, 374, 460], area: [150, 450, 340, 560], door: [305, 540] },
        { id: 'ccmain', icon: '🏫', text: '이해·보조공학실', col: '#1b7fc4', sign: [180, 168, 524, 232], area: [170, 150, 720, 420], door: [455, 430], hall: 'ccmain' },
        { id: 'craft', icon: '🧵', text: '진로직업 공방', col: '#d9651b', sign: [1024, 474, 1320, 536], area: [1000, 545, 1400, 800], door: [1150, 712], hall: 'craft' },
        { id: 'learn', icon: '🌱', text: '배움 지도', col: '#2e8b3a', sign: [1312, 230, 1590, 294], area: [1170, 140, 1480, 500], door: [1180, 460], url: '../learn/' },
        { id: 'village', icon: '🏪', text: '체험마을', col: '#c2331b', sign: [560, 530, 800, 590], area: [830, 440, 1010, 640], door: [900, 640], hall: 'village' }
      ],
      tips: ['춘천본원에 온 걸 환영해! 소양강 처녀상이 보이지?', '공방 거리에서 염색이랑 목공을 해 볼까?', '본관에서 친구를 돕는 방법을 배워 보자!', '스위치 하나로도 말할 수 있어. 보조공학실에 가 봐!']
    },
    wj: {
      name: '원주분원', icon: '⛰️', img: 'wj.webp', start: [622, 698],
      spots: [
        { id: 'bus', icon: '🚌', text: '버스 정류장', col: '#e0a800', sign: [326, 674, 562, 726], area: [470, 690, 600, 770], door: [560, 735] },
        { id: 'wjmain', icon: '🏫', text: '진로직업체험관', col: '#2e8b57', sign: [220, 218, 562, 282], area: [220, 280, 770, 540], door: [500, 550], hall: 'wjmain' },
        { id: 'farm', icon: '🌱', text: '스마트팜', col: '#3f9b2f', sign: [418, 604, 642, 656], area: [590, 625, 840, 800], door: [800, 735], shop: 'farm' },
        { id: 'snack', icon: '🍜', text: '분식집', col: '#e07b12', sign: [726, 496, 932, 548], area: [790, 560, 925, 725], door: [880, 705], shop: 'snack' },
        { id: 'recycle', icon: '♻️', text: '분리수거장', col: '#1e88e5', sign: [880, 600, 1060, 650], area: [925, 615, 1005, 700], door: [960, 700], shop: 'recycle' },
        { id: 'beauty', icon: '💅', text: '뷰티숍', col: '#d81b60', sign: [1040, 470, 1200, 520], area: [965, 515, 1095, 645], door: [1040, 655], shop: 'beauty' },
        { id: 'drone', icon: '🚁', text: '드론장', col: '#2b6cb0', sign: [988, 846, 1202, 898], area: [1040, 690, 1195, 775], door: [1110, 738], shop: 'drone' },
        { id: 'learn', icon: '🌱', text: '배움 지도', col: '#2e8b3a', sign: [1402, 120, 1652, 180], area: [880, 20, 1180, 380], door: [1090, 474], url: '../learn/' }
      ],
      tips: ['원주분원에 온 걸 환영해! 출렁다리 멋지지?', '스마트팜 채소는 알맞은 도구로 돌봐야 자라!', '분식집에서 라면이랑 김밥을 만들어 볼래?', '분리수거장에서 쓰레기를 알맞은 통에 넣어 보자!', '드론장에서 드론을 날려 봐!']
    }
  };
  var c = O.qs('c');
  O.applyBody();
  if (!TOWNS[c]) return busPage();
  var T = TOWNS[c];
  document.title = T.name + ' · 옥쌤의 즐거운 교실';
  var sh = O.shell({ title: T.icon + ' ' + T.name, subtitle: '버스를 타고 온 마을 · 건물을 눌러 들어가요', back: '../index.html', backLabel: '강릉 마을' });
  sh.levelBtn.style.display = 'none';
  if (O.eco) { var h = O.eco.hud(sh.top); sh.top.insertBefore(h, sh.levelBtn); }
  sh.board.className = 'oks-board town-board';
  if (O.eco && !O.eco.placeOpen(c)) {
    sh.ask(T.name + '은 레벨 ' + O.eco.PLACE_LV[c] + '이 되면 갈 수 있어요. 배움 지도와 가게에서 경험치를 모아요!');
    sh.board.innerHTML = '<div class="locked-town"><img src="' + T.img + '" alt=""><div><span>🔒</span><b>레벨 ' + O.eco.PLACE_LV[c] + '에 열려요</b><a class="oks-btn" href="../learn/">🌱 배움 지도로</a></div></div>';
    return;
  }
  if (O.eco) O.eco.reward({ badge: ['visit_' + c] });
  var map = E('div', 'town-map'); map.style.aspectRatio = IW + ' / ' + IH;
  map.innerHTML = '<img class="bg" src="' + T.img + '" alt="' + T.name + ' 마을 그림">';
  var me = E('img', 'walker'); me.src = O.ROOT + 'icons/avatar-walk-a.png'; me.alt = '';
  var pct = function (x, y) { return { left: x / IW * 100 + '%', top: y / IH * 100 + '%' }; };
  function place(el, x, y) { var p = pct(x, y); el.style.left = p.left; el.style.top = p.top; }
  place(me, T.start[0], T.start[1]);
  T.spots.forEach(function (s) {
    var a = E('button', 'spot'); a.type = 'button'; a.setAttribute('aria-label', s.text);
    a.style.left = s.area[0] / IW * 100 + '%'; a.style.top = s.area[1] / IH * 100 + '%'; a.style.width = (s.area[2] - s.area[0]) / IW * 100 + '%'; a.style.height = (s.area[3] - s.area[1]) / IH * 100 + '%';
    var lab = E('button', 'sign', '<span class="ic" style="background:' + s.col + '">' + s.icon + '</span>' + s.text); lab.type = 'button';
    lab.style.left = (s.sign[0] + s.sign[2]) / 2 / IW * 100 + '%'; lab.style.top = (s.sign[1] + s.sign[3]) / 2 / IH * 100 + '%';
    a.onclick = lab.onclick = function () { go(s); };
    map.appendChild(a); map.appendChild(lab);
  });
  map.appendChild(me);
  sh.board.appendChild(map);
  var tipI = 0;
  sh.ask(T.tips[0], { mood: 'cheer' });
  var tipTimer = setInterval(function () { tipI = (tipI + 1) % T.tips.length; sh.ask(T.tips[tipI], { silent: true }); }, 9000);
  var list = E('div', 'town-list'); T.spots.forEach(function (s) { var b = E('button', 'tl', s.icon + ' ' + s.text); b.type = 'button'; b.onclick = function () { go(s); }; list.appendChild(b); });
  sh.board.appendChild(list);

  var busy = false;
  function go(s) {
    if (busy) return; busy = true; O.unlock(); O.sfx('pop'); clearInterval(tipTimer);
    me.classList.add('walking'); place(me, s.door[0], s.door[1]);
    O.say(s.text, { noRepeat: true });
    setTimeout(function () { me.classList.remove('walking'); busy = false; open(s); }, O.settings().calm ? 150 : 900);
  }
  function open(s) {
    if (s.id === 'bus') return busModal();
    if (s.url) { location.href = s.url; return; }
    if (s.shop) { location.href = '../shop/?id=' + s.shop; return; }
    if (s.hall) return hallModal(s.hall);
  }
  function hallModal(hid) {
    var H = HALLS[hid], ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish hall');
    box.innerHTML = '<h2>' + H.icon + ' ' + H.name + '</h2><p>해 보고 싶은 일을 골라요!</p><div class="hall-grid"></div><div class="btns"></div>';
    var g = box.querySelector('.hall-grid');
    H.items.forEach(function (sid) { var S = SH[sid], r = O.eco ? O.eco.shop(sid) : {}; var a = E('a', 'shop-card', '<span class="ic" style="background:' + S.col + '">' + S.icon + '</span><b>' + S.name + '</b><small>' + O.esc(S.desc) + '</small><em>' + (r.days ? '영업 ' + r.days + '일 · ★' + Math.max.apply(null, [0].concat(Object.keys(r.best || {}).map(function (k) { return r.best[k]; }))) : '새 가게') + '</em>'); a.href = '../shop/?id=' + sid; g.appendChild(a); });
    if (hid === 'village') { g.insertAdjacentHTML('beforeend', '<a class="shop-card" href="../career/barista.html"><span class="ic" style="background:#6d4c41">☕</span><b>바리스타 체험</b><small>음료 만들기 · 직업 체험</small><em>체험마을</em></a>'); }
    var cl = E('button', 'oks-btn blue', '마을로'); cl.type = 'button'; cl.onclick = function () { ov.remove(); };
    box.querySelector('.btns').appendChild(cl); ov.appendChild(box); document.body.appendChild(ov);
  }

  function busModal() {
    var ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish bus');
    box.innerHTML = '<h2>🚌 버스 정류장</h2><p>어느 분원으로 갈까요?</p><div class="bus-grid"></div><div class="btns"></div>';
    fillBus(box.querySelector('.bus-grid'));
    var cl = E('button', 'oks-btn blue', '닫기'); cl.type = 'button'; cl.onclick = function () { ov.remove(); };
    box.querySelector('.btns').appendChild(cl); ov.appendChild(box); document.body.appendChild(ov);
  }
  function fillBus(g) {
    var here = O.qs('c') || 'gn';
    [['gn', '강릉분원', '🌊', '../icons/world-spring.jpg', '../index.html'], ['cc', '춘천본원', '🏞️', 'cc.webp', '?c=cc'], ['wj', '원주분원', '⛰️', 'wj.webp', '?c=wj']].forEach(function (b) {
      var open = !O.eco || O.eco.placeOpen(b[0]);
      var a = E(open ? 'a' : 'div', 'bus-card' + (open ? '' : ' lock') + (here === b[0] ? ' here' : ''), '<img src="' + b[3] + '" alt=""><b>' + (open ? b[2] : '🔒') + ' ' + b[1] + '</b><small>' + (here === b[0] ? '📍 지금 여기' : open ? (b[0] === 'gn' ? '바닷가 마을 · 배움 지도 · 미술실' : b[0] === 'cc' ? '장애이해 · 보조공학 · 진로직업 공방' : '스마트팜 · 분식집 · 분리수거 · 드론 · 뷰티숍') : '레벨 ' + O.eco.PLACE_LV[b[0]] + '에 열려요 (지금 Lv.' + O.eco.info().lv + ')') + '</small>');
      if (open && here !== b[0]) { a.href = b[4]; a.onclick = function (e) { e.preventDefault(); ride(b[1], b[2], b[4]); }; }
      g.appendChild(a);
    });
  }
  function ride(name, icon, url) {
    var el = E('div', 'bus-ride', '<div class="br-mt">⛰️ 🌲 ⛰️ 🌲 ⛰️ 🌲</div><div class="br-road"></div><div class="br-bus">🚌</div><b>' + icon + ' ' + name + '으로 가는 중… (누르면 바로 도착)</b>');
    document.body.appendChild(el); O.say(name + '으로 출발!', { noRepeat: true }); [523, 659, 784].forEach(function (f, i) { O.inst('xylo', f, i * 0.12); });
    var go2 = function () { location.href = url; }; el.onclick = go2; setTimeout(go2, O.settings().calm ? 400 : 2400);
  }
  window.OKS_TOWN = { busModal: busModal };

  function busPage() {
    var sh2 = O.shell({ title: '🚌 버스 정류장', subtitle: '강릉 · 춘천 · 원주 분원으로 가요', back: '../index.html', backLabel: '강릉 마을' });
    sh2.levelBtn.style.display = 'none';
    if (O.eco) { var h2 = O.eco.hud(sh2.top); sh2.top.insertBefore(h2, sh2.levelBtn); }
    sh2.ask('어느 분원으로 갈까요? 레벨이 오르면 새 마을이 열려요!', { silent: true });
    sh2.board.className = 'oks-board town-board';
    var g = E('div', 'bus-grid big'); sh2.board.appendChild(g); fillBus(g);
  }
})();
