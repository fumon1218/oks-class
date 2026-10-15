/* 🔍 통합 검색 — 차시 · 학습지 · 놀이 · 교사용 도구 · 우주 지도 건물을 한 곳에서 찾아요.
   - 색인: search/index.json (scripts/build_search.mjs 로 만들어요). 처음 열 때 한 번만 불러와요.
   - 한글 초성 검색(ㅅㄱ → 시각), 띄어쓰기 여러 낱말(AND), 분류 걸러 보기, 최근 본 것 기억.
   - 쓰는 법: <script src=".../search/search.js"></script>
       · data-oks-search 가 붙은 단추가 있으면 그 단추에 연결하고, 없으면 오른쪽 아래에 🔍 단추를 만들어요.
       · 키보드: / 또는 Ctrl+K · 닫기: Esc */
(function () {
  'use strict';
  var me = document.currentScript, BASE = me ? me.src.replace(/search\/search\.js.*$/, '') : '';
  if (!document.querySelector('link[data-oks-sq]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + 'search/search.css'; l.setAttribute('data-oks-sq', ''); document.head.appendChild(l); }
  var CATS = [['all', '전체'], ['lesson', '📘 수업'], ['game', '🎮 놀이·게임'], ['sheet', '📝 학습지'], ['place', '🪐 우주 지도'], ['tool', '🧰 선생님 도구']];
  var TAG = { lesson: '수업', game: '놀이', sheet: '학습지', place: '우주 지도', tool: '도구' };
  var SUGGEST = ['시계', '화폐', '국어', '수학', '체스', '야구', '한글', '학습지', '농장', '카페'];
  /* 비슷한 말: 돈을 찾으면 화폐·동전도 보여 줘요 */
  var SYN = { '돈': ['화폐', '동전', '지폐', '가격'], '화폐': ['돈', '동전', '지폐'], '동전': ['돈', '화폐'], '지폐': ['돈', '화폐'], '시계': ['시각', '시간'], '시각': ['시계'], '시간': ['시계', '시각'], '전자시계': ['디지털'], '디지털': ['전자시계'], '글자': ['한글', '낱말'], '글씨': ['쓰기', '따라쓰기'], '운동': ['체육'], '체육': ['운동', '스포츠'], '프린트': ['학습지', '인쇄'], '인쇄': ['학습지', '프린트'], '선생님': ['교사'], '교사': ['선생님'], '그림': ['미술'], '노래': ['음악'], '계산': ['덧셈', '뺄셈', '수'], '영어': ['알파벳', 'english'] };
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  var items = null, loading = null, cat = 'all', q = '', res = [], act = -1, root, inp, list, chips, lastFocus;

  function cho(s) { var o = ''; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); o += c >= 0xAC00 && c <= 0xD7A3 ? CHO[Math.floor((c - 0xAC00) / 588)] : s[i]; } return o; }
  function nrm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load() {
    if (items) return Promise.resolve(items);
    return loading || (loading = fetch(BASE + 'search/index.json').then(function (r) { return r.json(); }).then(function (d) {
      items = d.items.map(function (o, i) { var t = nrm(o.t), s = nrm(o.s), k = nrm(o.k); o._i = i; o._t = t; o._s = s; o._k = k; o._c = cho(t + s + k); o._tc = cho(t); return o; }); return items;
    }).catch(function () { loading = null; items = []; return items; }));
  }
  function highlight(text, toks) {
    var s = String(text), low = s.toLowerCase(), marks = [];
    toks.forEach(function (t) { if (!t || /^[ㄱ-ㅎ]+$/.test(t)) return; var i = low.indexOf(t); if (i >= 0) marks.push([i, i + t.length]); });
    if (!marks.length) return esc(s);
    marks.sort(function (a, b) { return a[0] - b[0]; }); var out = '', p = 0;
    marks.forEach(function (m) { if (m[0] < p) return; out += esc(s.slice(p, m[0])) + '<mark>' + esc(s.slice(m[0], m[1])) + '</mark>'; p = m[1]; });
    return out + esc(s.slice(p));
  }
  function search(query) {
    var toks = query.toLowerCase().split(/\s+/).filter(Boolean), out = [];
    if (!toks.length) return { rows: [], toks: toks };
    items.forEach(function (o) {
      var sc = 0, ok = true;
      for (var i = 0; i < toks.length && ok; i++) {
        var t = toks[i], jam = /^[ㄱ-ㅎ]+$/.test(t), hit = 0;
        if (jam) { if (o._tc.indexOf(t) === 0) hit = 40; else if (o._tc.indexOf(t) > 0) hit = 28; else if (o._c.indexOf(t) >= 0) hit = 8; }
        else {
          var cands = [t].concat(SYN[t] || []).map(nrm);
          cands.forEach(function (w, wi) {
            var h = 0, f = wi ? .7 : 1;
            if (o._t === w) h = 100; else if (o._t.indexOf(w) === 0) h = 60; else if (o._t.indexOf(w) > 0) h = 36;
            else if (o._s.indexOf(w) >= 0) h = 14; else if (o._k.indexOf(w) >= 0) h = 7;
            if (h * f > hit) hit = h * f;
          });
        }
        if (!hit) ok = false; else sc += hit;
      }
      if (ok) { sc += o.c === 'game' ? 25 : o.c === 'lesson' ? 15 : o.c === 'sheet' ? 0 : 8; out.push([sc, o]); }
    });
    out.sort(function (a, b) { return b[0] - a[0] || a[1]._i - b[1]._i; });
    return { rows: out.map(function (x) { return x[1]; }), toks: toks };
  }
  function recent() { try { return JSON.parse(localStorage.getItem('oks_search_recent') || '[]'); } catch (e) { return []; } }
  function remember(o) { try { var r = recent().filter(function (x) { return x.u !== o.u; }); r.unshift({ t: o.t, e: o.e, s: o.s, c: o.c, u: o.u }); localStorage.setItem('oks_search_recent', JSON.stringify(r.slice(0, 8))); } catch (e) {} }
  function href(u) { return /^https?:/.test(u) ? u : BASE + u; }
  function row(o, toks) {
    return '<a class="oks-sq-row" role="option" href="' + esc(href(o.u)) + '" data-u="' + esc(o.u) + '"><span class="oks-sq-e">' + esc(o.e || '🔎') + '</span><span class="oks-sq-t"><b>' + highlight(o.t, toks) + '</b><i>' + highlight(o.s || '', toks) + '</i></span><span class="oks-sq-tag ' + o.c + '">' + (TAG[o.c] || '') + '</span></a>';
  }
  function render() {
    var r = search(q), rows = r.rows, counts = { all: rows.length };
    rows.forEach(function (o) { counts[o.c] = (counts[o.c] || 0) + 1; });
    chips.innerHTML = CATS.map(function (c) { return (c[0] === 'all' || counts[c[0]] || cat === c[0]) && q ? '<button type="button" data-c="' + c[0] + '" class="' + (cat === c[0] ? 'on' : '') + '">' + c[1] + '<small>' + (counts[c[0]] || 0) + '</small></button>' : ''; }).join('');
    var show = cat === 'all' ? rows : rows.filter(function (o) { return o.c === cat; });
    res = show.slice(0, 80); act = -1;
    if (!q.trim()) {
      var rc = recent(), h = '';
      if (rc.length) h += '<div class="oks-sq-h">최근에 열어 본 것</div>' + rc.map(function (o) { return row(o, []); }).join('');
      h += '<div class="oks-sq-h">이런 걸 찾아보세요</div><div class="oks-sq-chips" style="padding:0 4px 6px">' + SUGGEST.map(function (s) { return '<button type="button" data-s="' + s + '">' + s + '</button>'; }).join('') + '</div>';
      list.innerHTML = h;
    } else if (!res.length) {
      list.innerHTML = '<div class="oks-sq-empty">“' + esc(q) + '” 을(를) 찾지 못했어요<small>다른 낱말로 찾아보세요. 초성(예: ㅅㄱ)이나 짧은 낱말도 돼요.</small></div>';
    } else {
      list.innerHTML = res.map(function (o) { return row(o, r.toks); }).join('') + (show.length > res.length ? '<div class="oks-sq-h">더 보려면 낱말을 더 적어 주세요 (' + show.length + '개 중 ' + res.length + '개)</div>' : '');
    }
  }
  function setAct(i) {
    var rows = list.querySelectorAll('.oks-sq-row'); if (!rows.length) return;
    act = (i + rows.length) % rows.length; [].forEach.call(rows, function (r, k) { r.classList.toggle('on', k === act); });
    rows[act].scrollIntoView({ block: 'nearest' });
  }
  function build() {
    root = document.createElement('div'); root.className = 'oks-sq'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', '검색');
    root.innerHTML = '<div class="oks-sq-box"><div class="oks-sq-top"><label class="oks-sq-in"><span aria-hidden="true">🔍</span><input type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="무엇을 찾나요? (예: 시계, 돈, 체스, ㅅㄱ)" aria-label="검색어"><button type="button" aria-label="지우기" hidden>✕</button></label><button type="button" class="oks-sq-x">닫기</button></div><div class="oks-sq-chips"></div><div class="oks-sq-list" role="listbox"></div></div>';
    document.body.appendChild(root);
    inp = root.querySelector('input'); list = root.querySelector('.oks-sq-list'); chips = root.querySelectorAll('.oks-sq-chips')[0];
    var clr = root.querySelector('.oks-sq-in button');
    inp.addEventListener('input', function () { q = inp.value; clr.hidden = !q; cat = 'all'; render(); });
    clr.onclick = function () { inp.value = ''; q = ''; clr.hidden = true; cat = 'all'; render(); inp.focus(); };
    root.querySelector('.oks-sq-x').onclick = close;
    root.addEventListener('mousedown', function (e) { if (e.target === root) close(); });
    chips.addEventListener('click', function (e) { var b = e.target.closest('button[data-c]'); if (b) { cat = b.dataset.c; render(); } });
    list.addEventListener('click', function (e) {
      var s = e.target.closest('button[data-s]'); if (s) { inp.value = q = s.dataset.s; clr.hidden = false; render(); inp.focus(); return; }
      var a = e.target.closest('a.oks-sq-row'); if (a) pick(a.dataset.u, e);
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAct(act + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(act - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); var rows = list.querySelectorAll('.oks-sq-row'); var a = rows[act >= 0 ? act : 0]; if (a) { pick(a.dataset.u); } }
    });
  }
  function pick(u, e) {
    var all = (items || []).concat(recent()), o = all.filter(function (x) { return x.u === u; })[0]; if (o) remember(o);
    if (e) return;   /* 링크는 그대로 이동 */
    var go = href(u), same = go.split('#')[0] === location.href.split('#')[0];
    close(); if (same && go.indexOf('#') > 0) location.hash = go.split('#')[1]; else location.href = go;
  }
  function open(preset) {
    if (!root) build(); lastFocus = document.activeElement; root.hidden = false; document.documentElement.style.overflow = 'hidden';
    cat = 'all'; q = preset || ''; inp.value = q; root.querySelector('.oks-sq-in button').hidden = !q; render();
    load().then(function () { if (!root.hidden) render(); }); setTimeout(function () { inp.focus(); inp.select(); }, 30);
  }
  function close() { if (!root || root.hidden) return; root.hidden = true; document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} }
  document.addEventListener('keydown', function (e) {
    var tg = e.target && e.target.tagName, typing = tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || (e.target && e.target.isContentEditable);
    if (e.key === 'Escape') close();
    else if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); open(); }
  });
  function mount() {
    var bs = document.querySelectorAll('[data-oks-search]');
    if (bs.length) [].forEach.call(bs, function (b) { b.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
    else if (!(me && me.hasAttribute('data-no-fab'))) { var f = document.createElement('button'); f.type = 'button'; f.className = 'oks-sq-fab'; f.setAttribute('aria-label', '검색'); f.textContent = '🔍'; f.onclick = function () { open(); }; document.body.appendChild(f); }
  }
  window.OKSSearch = { open: open, close: close };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
