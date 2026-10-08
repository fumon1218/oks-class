/* 놀이별 마을 — 씽씽 별 마을과 같은 틀: 지도 배경 + 건물 + 이름표 + 안내자
   그림이 없어도 임시 건물로 보이고, assets/ 에 같은 이름의 webp를 넣으면 자동으로 바뀌어요. */
(function () {
  'use strict';
  var O = window.OKS, HUB_W = 1672, HUB_H = 941;
  /* x,y = 건물 아래쪽 가운데 위치(지도 1672×941 기준), w = 건물 너비 */
  var HUB = [
    { id: 'jegi', name: '전통놀이 마당', sub: '토끼와 제기차기', ph: '🪁', img: 'hub_bld_trad', x: 836, y: 470, w: 340, url: 'jegi/', color: '#ffb44f', say: '전통놀이 마당으로 가요! 토끼와 제기차기를 해요.' },
    { id: 'chess', name: '3D 체스', sub: '말 움직임 · 컴퓨터와 대국', ph: '♞', img: 'hub_bld_chess', x: 900, y: 168, w: 260, url: 'chess/', color: '#6d7bd9', say: '체스 성으로 가요!' },
    { id: 'janggi', name: '3D 장기', sub: '한자 장기말 · 둘이서', ph: '帥', img: 'hub_bld_janggi', x: 392, y: 322, w: 290, url: 'janggi/', color: '#e0613f', say: '장기 정자로 가요!' },
    { id: 'go', name: '3D 바둑', sub: '입문부터 고급까지 수업', ph: '⚫', img: 'hub_bld_go', x: 1285, y: 326, w: 290, url: 'go/', color: '#3f3f4f', say: '바둑 찻집으로 가요! 입문부터 차근차근 배워요.' },
    { id: 'omok', name: '3D 오목', sub: '이기는 법 · 막는 법', ph: '⚪', img: 'hub_bld_omok', x: 360, y: 650, w: 300, url: 'omok/', color: '#4aa86a', say: '오목 놀이터로 가요!' },
    { id: 'othello', name: '3D 오셀로', sub: '뒤집기 · 구석 전략', ph: '🔄', img: 'hub_bld_othello', x: 1335, y: 662, w: 280, url: 'othello/', color: '#2f8f7a', say: '오셀로 뒤집기 마을로 가요!' },
    { id: 'darts', name: '3D 다트', sub: '숫자 맞히기 · 점수 모으기', ph: '🎯', img: 'hub_bld_darts', x: 836, y: 760, w: 240, url: 'darts/', color: '#e0508a', say: '다트 놀이관으로 가요!' }
  ];
  function E(t, c) { var e = document.createElement(t); if (c) e.className = c; return e; }
  var root = E('div', 'sh-root'), hello = '놀이별 마을에 오신 것을 환영해요! 하고 싶은 놀이 건물을 눌러 보세요.';
  root.innerHTML = '<div class="sh-back" style="background-image:url(assets/hub_map.webp),linear-gradient(180deg,#a7a6ee 0%,#cdbdf4 45%,#e6dafa 100%)"></div><div class="sh-scroll"><div class="sh-map"><img class="sh-bg" src="assets/hub_map.webp" alt="놀이별 마을 지도"></div></div>' +
    '<div class="sh-top"><a class="oks-pill sh-exit" href="../">🚀 <span>우주로</span></a><div class="sh-title"><b>놀이별 마을</b><span>전통놀이 · 전략놀이 · 건물을 눌러요</span></div><div class="sh-hud"></div></div>' +
    '<div class="sh-guide"><img src="../art/char/ok_wave.webp" alt=""><div class="sh-bubble"></div></div>';
  var map = root.querySelector('.sh-map'), bub = root.querySelector('.sh-bubble'), guide = root.querySelector('.sh-guide');
  var bg = root.querySelector('.sh-bg'); bg.onerror = function () { bg.style.display = 'none'; root.querySelector('.sh-map').style.background = 'radial-gradient(ellipse at 50% 40%,#e9dcff,#b7b8f3 70%)'; };
  function talk(t) { bub.textContent = t; guide.dataset.say = t; guide.classList.remove('pop'); void guide.offsetWidth; guide.classList.add('pop'); guide.classList.remove('quiet'); clearTimeout(talk.t); talk.t = setTimeout(function () { guide.classList.add('quiet'); }, 7000); O.say(t, { noRepeat: true }); }
  guide.onclick = function () { guide.classList.remove('quiet'); clearTimeout(talk.t); talk.t = setTimeout(function () { guide.classList.add('quiet'); }, 7000); if (guide.dataset.say) O.say(guide.dataset.say); };
  HUB.forEach(function (b, i) {
    var e = E('button', 'sh-bld'); e.type = 'button'; e.dataset.id = b.id;
    e.style.left = b.x / HUB_W * 100 + '%'; e.style.top = b.y / HUB_H * 100 + '%'; e.style.width = b.w / HUB_W * 100 + '%'; e.style.zIndex = Math.round(b.y); e.style.animationDelay = (i * 70) + 'ms'; e.style.setProperty('--bcolor', b.color);
    e.innerHTML = '<img class="sh-img" src="assets/' + b.img + '.webp" alt=""><span class="sh-name"><b>' + O.esc(b.name) + '</b><small>' + O.esc(b.sub) + '</small></span>';
    var img = e.querySelector('img'); img.onerror = function () { var ph = E('div', 'sh-ph'); ph.innerHTML = '<span></span>'; ph.firstChild.textContent = b.ph; img.replaceWith(ph); };
    e.onclick = function () { O.sfx('pop'); talk(b.say); setTimeout(function () { location.href = b.url; }, 650); };
    map.appendChild(e);
  });
  document.body.innerHTML = ''; document.body.appendChild(root);
  var sc = root.querySelector('.sh-scroll'); sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
  if (O.eco && O.eco.hud) { try { O.eco.hud(root.querySelector('.sh-hud')); } catch (x) {} }
  talk(hello);
})();
