/* 놀이별 마을 — 씽씽 별 마을과 같은 틀: 지도 배경 + 건물 + 이름표 + 안내자
   메인 지도(구역 3곳) → 구역 지도(?zone=trad|strategy|board) → 놀이.
   x,y = 지도(1672×941)에서 광장 가운데, w = 광장 너비. 건물은 광장 위에 올려요. */
(function () {
  'use strict';
  var O = window.OKS, HUB_W = 1672, HUB_H = 941;
  var ZONES = {
    main: { title: '놀이별 마을', sub: '전통놀이 · 전략놀이 · 보드게임 놀이', map: 'hub_map', hello: '놀이별 마을에 오신 것을 환영해요! 가 보고 싶은 마을을 눌러 보세요.', exit: ['🚀', '우주로', '../'],
      slots: [
        { name: '전통놀이 마을', sub: '딱지 · 제기 · 연날리기', img: 'hub_bld_trad', ph: '🪁', x: 330, y: 505, w: 390, zone: 'trad', color: '#ffb44f', say: '전통놀이 마을로 가요!' },
        { name: '전략놀이 마을', sub: '체스 · 장기 · 바둑 · 오목 · 오셀로', img: 'hub_bld_strategy', ph: '♞', x: 840, y: 240, w: 330, zone: 'strategy', color: '#6d7bd9', say: '전략놀이 마을로 가요!' },
        { name: '보드게임 놀이 마을', sub: '다트 · 볼링 · 주차장 탈출', img: 'hub_bld_board', ph: '🎲', x: 1390, y: 520, w: 390, zone: 'board', color: '#e0508a', say: '보드게임 놀이 마을로 가요!' }
      ] },
    trad: { title: '전통놀이 마을', sub: '옛날 놀이를 함께 해요', map: 'zone_trad_map', hello: '전통놀이 마을이에요. 토끼와 제기차기부터 시작해요!', exit: ['🌌', '놀이별 마을', './'],
      slots: [
        { name: '딱지치기', soon: 1, x: 340, y: 295, w: 250 }, { name: '잣치기', soon: 1, x: 835, y: 225, w: 240 }, { name: '구슬치기', soon: 1, x: 1340, y: 295, w: 250 },
        { name: '연날리기', soon: 1, x: 310, y: 610, w: 270 },
        { name: '토끼와 제기차기', sub: '카메라로 발 들기 · 버튼으로도 OK', img: 'hub_bld_trad', ph: '🪁', x: 840, y: 595, w: 300, url: 'jegi/', color: '#ffb44f', say: '토끼와 제기차기를 하러 가요!', today: 1 },
        { name: '비석치기', soon: 1, x: 1380, y: 615, w: 270 }
      ] },
    strategy: { title: '전략놀이 마을', sub: '한 수씩 생각해요', map: 'zone_strategy_map', hello: '전략놀이 마을이에요. 하고 싶은 놀이를 골라요. 바둑은 입문부터 배울 수 있어요!', exit: ['🌌', '놀이별 마을', './'],
      slots: [
        { name: '3D 체스', sub: '말 움직임 · 컴퓨터와 대국', img: 'hub_bld_chess', ph: '♞', x: 270, y: 275, w: 320, url: 'chess/', color: '#6d7bd9', say: '체스 탑으로 가요!' },
        { name: '3D 바둑', sub: '입문부터 고급까지 수업', img: 'hub_bld_go', ph: '⚫', x: 835, y: 225, w: 330, url: 'go/', color: '#3f3f4f', say: '바둑 정자로 가요! 입문부터 차근차근 배워요.', today: 1 },
        { name: '3D 장기', sub: '한자 장기말 · 둘이서', img: 'hub_bld_janggi', ph: '帥', x: 1400, y: 270, w: 320, url: 'janggi/', color: '#e0613f', say: '장기 정자로 가요!' },
        { name: '3D 오목', sub: '이기는 법 · 막는 법', img: 'hub_bld_omok', ph: '⚪', x: 510, y: 610, w: 360, url: 'omok/', color: '#4aa86a', say: '오목 놀이터로 가요!' },
        { name: '3D 오셀로', sub: '뒤집기 · 구석 전략', img: 'hub_bld_othello', ph: '🔄', x: 1160, y: 610, w: 360, url: 'othello/', color: '#2f8f7a', say: '오셀로 마을로 가요!' }
      ] },
    board: { title: '보드게임 놀이 마을', sub: '함께 계획하고 문제를 풀어요', map: 'zone_board_map', hello: '보드게임 놀이 마을이에요. 새로 생긴 주차장에 가 볼까요?', exit: ['🌌', '놀이별 마을', './'],
      slots: [
        { name: '3D 다트', sub: '숫자 맞히기 · 301 줄이기', img: 'hub_bld_darts', ph: '🎯', x: 330, y: 215, w: 330, url: 'darts/', color: '#e0508a', say: '다트 놀이관으로 가요!' },
        { name: '3D 볼링', sub: '스트라이크 · 스페어', img: 'hub_bld_bowling', ph: '🎳', x: 838, y: 205, w: 330, url: 'bowling/', color: '#8a5ae0', say: '볼링장으로 가요!' },
        { name: '주차장 탈출', sub: '러시아워 · 차 빼기 퍼즐', img: 'hub_bld_parking', ph: '🚗', x: 1345, y: 215, w: 330, url: 'rushhour/', color: '#3d8bff', say: '주차장으로 가요!', today: 1 },
        { name: '우주 도시 건설', soon: 1, x: 322, y: 615, w: 330 }, { name: '새 놀이 준비 중', soon: 1, x: 838, y: 612, w: 330 }, { name: '새 놀이 준비 중', soon: 1, x: 1360, y: 615, w: 330 }
      ] }
  };
  var zid = (location.search.match(/[?&]zone=(\w+)/) || [])[1]; var Z = ZONES[zid] || ZONES.main; if (!ZONES[zid]) zid = 'main';
  function E(t, c) { var e = document.createElement(t); if (c) e.className = c; return e; }
  document.title = Z.title + ' · 놀이별';
  var root = E('div', 'sh-root'), mapUrl = 'assets/' + Z.map + '.webp';
  root.innerHTML = '<div class="sh-back" style="background-image:url(' + mapUrl + '),linear-gradient(180deg,#a7a6ee 0%,#cdbdf4 45%,#e6dafa 100%)"></div><div class="sh-scroll"><div class="sh-map"><img class="sh-bg" src="' + mapUrl + '" alt="' + O.esc(Z.title) + ' 지도"></div></div>' +
    '<div class="sh-top"><a class="oks-pill sh-exit" href="' + Z.exit[2] + '">' + Z.exit[0] + ' <span>' + O.esc(Z.exit[1]) + '</span></a><div class="sh-title"><b>' + O.esc(Z.title) + '</b><span>' + O.esc(Z.sub) + '</span></div><div class="sh-hud"></div></div>' +
    '<div class="sh-guide"><img src="../art/char/ok_wave.webp" alt=""><div class="sh-bubble"></div></div>';
  var map = root.querySelector('.sh-map'), bub = root.querySelector('.sh-bubble'), guide = root.querySelector('.sh-guide');
  var bg = root.querySelector('.sh-bg'); bg.onerror = function () { bg.style.display = 'none'; map.style.background = 'radial-gradient(ellipse at 50% 40%,#e9dcff,#b7b8f3 70%)'; };
  function talk(t) { bub.textContent = t; guide.dataset.say = t; guide.classList.remove('pop'); void guide.offsetWidth; guide.classList.add('pop'); guide.classList.remove('quiet'); clearTimeout(talk.t); talk.t = setTimeout(function () { guide.classList.add('quiet'); }, 7000); O.say(t, { noRepeat: true }); }
  guide.onclick = function () { guide.classList.remove('quiet'); clearTimeout(talk.t); talk.t = setTimeout(function () { guide.classList.add('quiet'); }, 7000); if (guide.dataset.say) O.say(guide.dataset.say); };
  Z.slots.forEach(function (b, i) {
    var e = E('button', 'sh-bld' + (b.soon ? ' soon' : '')); e.type = 'button';
    var ax = b.x, ay = b.y + b.w * 0.27, bw = b.w * 1.04;
    e.style.left = ax / HUB_W * 100 + '%'; e.style.top = ay / HUB_H * 100 + '%'; e.style.width = bw / HUB_W * 100 + '%'; e.style.zIndex = Math.round(ay); e.style.animationDelay = (i * 70) + 'ms'; e.style.setProperty('--bcolor', b.color || '#b9b6d6');
    var imgName = b.soon ? 'bld_soon' : b.img;
    e.innerHTML = '<img class="sh-img" src="assets/' + imgName + '.webp" alt="">' + (b.today ? '<span class="sh-tag">추천!</span>' : '') +
      '';
    var lbl = E('div', 'sh-lbl'); lbl.style.left = e.style.left; lbl.style.top = e.style.top; lbl.style.width = e.style.width; lbl.style.setProperty('--bcolor', b.color || '#b9b6d6');
    lbl.innerHTML = '<span class="sh-name"><b>' + O.esc(b.name) + '</b><small>' + (b.soon ? '🔒 곧 만나요' : O.esc(b.sub)) + '</small></span>';
    var img = e.querySelector('img'); img.onerror = function () { var ph = E('div', 'sh-ph'); ph.innerHTML = '<span></span>'; ph.firstChild.textContent = b.ph || '🏗️'; img.replaceWith(ph); };
    e.onclick = function () {
      if (b.soon) { O.sfx('tick'); talk(b.name + '은(는) 곧 열려요. 조금만 기다려요!'); e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); return; }
      O.sfx('pop'); talk(b.say);
      setTimeout(function () { location.href = b.zone ? '?zone=' + b.zone : b.url; }, 650);
    };
    lbl.firstChild.onclick = function () { e.click(); };
    map.appendChild(e); map.appendChild(lbl);
  });
  document.body.innerHTML = ''; document.body.appendChild(root);
  var sc = root.querySelector('.sh-scroll'); sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
  if (O.eco && O.eco.hud) { try { O.eco.hud(root.querySelector('.sh-hud')); } catch (x) {} }
  talk(Z.hello);
})();
