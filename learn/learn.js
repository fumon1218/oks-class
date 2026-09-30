/* 배움 지도: 교과 → 학교급 → 단원 → 차시 → 수준(1~5) */
(function () {
  'use strict';
  var O = window.OKS, E = O.el, D = window.OKS_LESSONS, C = window.OKS_CONTENT || {};
  var SUBJ = {
    korean: { emo: '📖', color: '#ff8a65', game: '소리 숲 · 낱말 우체국 · 심부름 가게' },
    math: { emo: '🔢', color: '#66bb6a', game: '햇살 농장 · 블록 공장 · 규칙 기차' },
    social: { emo: '🏘️', color: '#ffb300', game: '학교 지도 · 마을 광장 · 길 찾기' },
    science: { emo: '🔬', color: '#29b6f6', game: '햇살 농장 · 물놀이 실험 · 분리수거' },
    english: { emo: '🔤', color: '#ab47bc', game: '동물 마을 · 스낵 바 · 영어 우체국' },
    art: { emo: '🎨', color: '#ec407a', game: '색 정원 · 색 섞기 · 도형 공방' },
    music: { emo: '🎵', color: '#5c6bc0', game: '소리 숲 · 리듬 산책 · 동물 악단' }
  };
  var subject = O.qs('subject') || O.jget('oks_learn_last', {}).subject || 'math';
  var school = O.qs('school') || O.jget('oks_learn_last', {}).school || 'elem';
  var ask = document.getElementById('askText');
  O.applyBody();
  if (O.eco) O.eco.hud(document.getElementById('ecoHud'));
  var SHOPS_OF = window.OKS_SHOP_BY_LESSON || function () { return []; };

  function renderTabs() {
    var s = document.getElementById('subjects'); s.innerHTML = '';
    D.subjects.forEach(function (x) {
      var b = E('button', 'subj' + (x.key === subject ? ' on' : ''), '<span class="ic">' + SUBJ[x.key].emo + '</span><b>' + x.name + '</b>');
      b.type = 'button'; b.style.setProperty('--c', SUBJ[x.key].color);
      b.onclick = function () { subject = x.key; save(); render(); O.say(x.name, { noRepeat: true }); };
      s.appendChild(b);
    });
    var sc = document.getElementById('schools'); sc.innerHTML = '';
    D.schools.forEach(function (x) {
      var ready = D.lessons.filter(function (l) { return l.subject === subject && l.school === x.key && C[l.id]; }).length;
      var b = E('button', 'sch' + (x.key === school ? ' on' : ''), x.name + (ready ? ' <small>게임 ' + ready + '</small>' : ' <small>계획</small>'));
      b.type = 'button'; b.onclick = function () { school = x.key; save(); render(); };
      sc.appendChild(b);
    });
  }
  function save() { O.jset('oks_learn_last', { subject: subject, school: school }); history.replaceState(null, '', '?subject=' + subject + '&school=' + school); }

  function starRow(best) {
    var s = ''; for (var i = 1; i <= 5; i++) { var v = best && best[i] || 0; s += v ? '★' : '·'; } return s;
  }
  function render() {
    renderTabs();
    var main = document.getElementById('main'); main.innerHTML = '';
    var list = D.lessons.filter(function (l) { return l.subject === subject && l.school === school; });
    var pr = O.progress();
    var sn = D.subjects.filter(function (x) { return x.key === subject; })[0].name;
    ask.textContent = sn + ' · ' + D.schools.filter(function (x) { return x.key === school; })[0].name + '. 차시를 고르고 수준 번호를 눌러요!';
    var units = {};
    list.forEach(function (l) { (units[l.unitNo] = units[l.unitNo] || { name: l.unit, items: [] }).items.push(l); });
    Object.keys(units).forEach(function (k) {
      var u = units[k];
      var sec = E('section', 'unit'); sec.style.setProperty('--c', SUBJ[subject].color);
      sec.innerHTML = '<h2><span>' + k + '단원</span>' + O.esc(u.name) + '</h2>';
      var grid = E('div', 'lessons');
      u.items.forEach(function (l) {
        var ready = !!C[l.id], p = pr[l.id], lv = (O.settings().levels[l.id]) || (p && p.last) || O.settings().defaultLevel;
        var card = E('article', 'lesson' + (ready ? ' ready' : ' plan')); card.id = l.id;
        card.innerHTML = '<div class="lhead"><span class="no">' + l.no + '</span><div><h3>' + O.esc(l.topic) + '</h3><p>〈' + O.esc(l.space) + '〉 ' + O.esc(l.goal) + '</p></div></div>' +
          '<div class="lvls"></div><div class="lfoot"><span class="st">' + (ready ? (p ? '별 ' + starRow(p.best) + ' · ' + p.plays + '번' : '게임 준비됨') : '📝 준비 중 · 계획 보기') + '</span><button type="button" class="more">수준 설명</button></div><ol class="desc"></ol>';
        var lvls = card.querySelector('.lvls');
        O.LEVELS.forEach(function (L) {
          var got = p && p.best && p.best[L.n];
          var a = E(ready ? 'a' : 'button', 'lv' + (L.n === lv ? ' cur' : '') + (got ? ' got' : ''), '<b>' + L.n + '</b><small>' + L.name + '</small>' + (got ? '<i>' + '★'.repeat(got) + '</i>' : ''));
          if (ready) { a.href = '../play/?id=' + l.id + '&level=' + L.n; a.onclick = function () { O.rememberLevel(l.id, L.n); }; }
          else { a.type = 'button'; a.onclick = function () { card.classList.add('open'); }; }
          lvls.appendChild(a);
        });
        var desc = card.querySelector('.desc');
        var DS = window.OKS_DESCRIBE;
        l.levels.forEach(function (t, i) { var g = C[l.id] && DS ? DS(C[l.id], i + 1) : ''; desc.insertAdjacentHTML('beforeend', '<li><b>' + O.LEVELS[i].name + '</b> ' + (g ? '<span class="game">🎮 ' + O.esc(g) + '</span><br>' : '') + '<small class="orig">' + O.esc(t.replace(/^〈[^〉]*〉\s*/, '')) + '</small></li>'); });
        desc.insertAdjacentHTML('beforeend', '<li class="rec"><a href="../curriculum/plan.html?subject=' + l.subject + '&school=' + l.school + '">📘 지도 계획서</a> · 기록: ' + O.esc(l.record) + (l.track ? ' · ' + O.esc(l.track) : '') + '</li>');
        var shops = SHOPS_OF(l.id);
        if (shops.length) card.querySelector('.lfoot').insertAdjacentHTML('beforebegin', '<div class="lshops">' + shops.map(function (S) { return '<a href="../shop/?id=' + S.id + '&level=' + lv + '" style="--c:' + S.col + '">' + S.icon + ' ' + S.name + '에서 일하기</a>'; }).join('') + '</div>');
        card.querySelector('.more').onclick = function () { card.classList.toggle('open'); };
        grid.appendChild(card);
      });
      sec.appendChild(grid); main.appendChild(sec);
    });
    document.getElementById('foot').textContent = D.note + ' (' + D.version + ')';
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) { t.classList.add('flash'); setTimeout(function () { t.scrollIntoView({ block: 'center' }); }, 60); } }
  }

  /* 설정 */
  document.getElementById('setBtn').onclick = function () {
    var s = O.settings();
    var ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish settings');
    var rows = [['voice', '🗣️ 읽어 주는 목소리', s.voice], ['sound', '🎵 효과음', s.sound], ['slow', '🐢 천천히 말하기', s.slow], ['calm', '🌙 움직임 줄이기(감각 조절)', s.calm], ['big', '👆 큰 누름 칸', s.big], ['scan', '🔘 스위치(스캔) 모드', !!s.scan], ['openAll', '🔓 모든 마을 열기(선생님)', !!s.openAll]];
    box.innerHTML = '<h2>설정</h2><div class="set-rows"></div><p>처음 시작할 수준</p><div class="set-lv"></div><div class="btns"></div><div class="note">시간 제한은 없어요. 4·5수준은 🙋 도와줘를 누를 때만 힌트가 나와요.</div>';
    var sr = box.querySelector('.set-rows');
    rows.forEach(function (r) { var b = E('button', 'tog' + (r[2] ? ' on' : ''), r[1] + '<span>' + (r[2] ? '켜짐' : '꺼짐') + '</span>'); b.type = 'button'; b.onclick = function () { r[2] = !r[2]; O.saveSetting(r[0], r[2]); b.classList.toggle('on', r[2]); b.querySelector('span').textContent = r[2] ? '켜짐' : '꺼짐'; }; sr.appendChild(b); });
    var sl = box.querySelector('.set-lv');
    O.LEVELS.forEach(function (L) { var b = E('button', 'lvpick' + (L.n === s.defaultLevel ? ' on' : ''), L.n + ' ' + L.name); b.type = 'button'; b.onclick = function () { O.saveSetting('defaultLevel', L.n); sl.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }; sl.appendChild(b); });
    var close = E('button', 'oks-btn blue', '닫기'); close.type = 'button'; close.onclick = function () { ov.remove(); render(); };
    box.querySelector('.btns').appendChild(close); ov.appendChild(box); document.body.appendChild(ov);
  };

  /* 기록 */
  document.getElementById('recBtn').onclick = function () {
    var log = O.jget('oks_learning_log_v1', []).slice().reverse();
    var byId = {}; D.lessons.forEach(function (l) { byId[l.id] = l; });
    var ov = E('div', 'oks-overlay'), box = E('div', 'oks-finish records');
    var rowsHtml = log.slice(0, 60).map(function (r) {
      var l = byId[r.lesson] || {}; var d = new Date(r.at);
      return '<tr><td>' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</td><td>' + O.esc((l.subjectName || '') + ' ' + (l.schoolName || '') + ' ' + (l.no || '') + ' ' + (l.topic || r.lesson)) + '</td><td>' + r.level + '</td><td>' + '★'.repeat(r.stars || 0) + '</td><td>' + O.esc(r.independence || '') + (r.teacherSet ? '✎' : '') + '</td><td>' + r.mistakes + '</td><td>' + (r.glow + r.hand) + '/' + r.asked + '</td><td>' + r.sec + '초</td></tr>';
    }).join('');
    box.innerHTML = '<h2>배움 기록</h2><p>이 기기에 저장된 최근 기록이에요. 도움 정도는 끝 화면에서 선생님이 고칠 수 있어요(✎).</p>' +
      (log.length ? '<div class="tbl"><table><thead><tr><th>날짜</th><th>차시</th><th>수준</th><th>별</th><th>도움</th><th>틀림</th><th>힌트/요청</th><th>시간</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' : '<p>아직 기록이 없어요.</p>') +
      '<div class="btns"></div>';
    var csv = E('button', 'oks-btn orange', 'CSV로 저장'); csv.type = 'button';
    csv.onclick = function () {
      var head = ['날짜', '활동ID', '교과', '학교급', '차시', '주제', '수준', '별', '도움정도', '틀림', '반짝임', '손가락', '도와줘', '초'];
      var lines = [head.join(',')].concat(O.jget('oks_learning_log_v1', []).map(function (r) { var l = byId[r.lesson] || {}; return [r.at, r.lesson, l.subjectName, l.schoolName, l.no, l.topic, r.level, r.stars, r.independence, r.mistakes, r.glow, r.hand, r.asked, r.sec].map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(','); }));
      var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '배움기록.csv'; a.click();
    };
    var close = E('button', 'oks-btn blue', '닫기'); close.type = 'button'; close.onclick = function () { ov.remove(); };
    if (log.length) box.querySelector('.btns').appendChild(csv);
    box.querySelector('.btns').appendChild(close); ov.appendChild(box); document.body.appendChild(ov);
  };
  render();
})();
