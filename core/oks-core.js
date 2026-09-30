/* 옥쌤의 즐거운 교실 — 공통 틀 (OKS)
   모든 교과 게임이 같이 쓰는 것: 설정·목소리·효과음·5수준·촉진(반짝임→손가락)·기록·끝 화면.
   외부 라이브러리 없이 동작합니다. */
(function (global) {
  'use strict';
  var me = document.currentScript;
  var ROOT = me ? me.src.replace(/core\/oks-core\.js.*$/, '') : '../';
  var UI = ROOT + 'core/ui/';

  var LEVELS = [
    { n: 1, name: '감각 탐색', short: '1 느끼기', desc: '한 번 눌러 보고 듣기 · 틀려도 괜찮아요' },
    { n: 2, name: '골라 보기', short: '2 고르기', desc: '2개 중에서 고르기 · 그림·소리 힌트' },
    { n: 3, name: '직접 해 보기', short: '3 해 보기', desc: '옮기고·놓고·연주하기 · 3개 보기' },
    { n: 4, name: '혼자 해 보기', short: '4 혼자서', desc: '스스로 해결 · 필요하면 도와줘 버튼' },
    { n: 5, name: '생활에 써 보기', short: '5 생활로', desc: '새 장면에 적용하고 만들어 보기' }
  ];
  /* 수준별 촉진 시간(초): 먼저 반짝임, 다음에 손가락. 4·5수준은 요청할 때만 */
  var PROMPT = { 1: [3, 6], 2: [6, 12], 3: [9, 16], 4: null, 5: null };

  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function qs(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a, n) { return shuffle(a).slice(0, n == null ? 1 : n); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 설정 ---------- */
  function settings() {
    var a = jget('oksaem-settings', {}), b = jget('oks_core_v1', {});
    return {
      voice: a.voice !== false, sound: a.sound !== false,
      calm: !!b.calm, big: !!b.big, slow: !!b.slow, scan: !!b.scan, scanSec: b.scanSec || 1.6, openAll: !!b.openAll,
      levels: b.levels || {}, defaultLevel: b.defaultLevel || 2
    };
  }
  function saveSetting(key, val) {
    if (key === 'voice' || key === 'sound') { var a = jget('oksaem-settings', {}); a[key] = val; jset('oksaem-settings', a); }
    else { var b = jget('oks_core_v1', {}); b[key] = val; jset('oks_core_v1', b); }
    applyBody();
  }
  function levelFor(lessonId) {
    var q = parseInt(qs('level'), 10); if (q >= 1 && q <= 5) return q;
    var s = settings(); var v = s.levels[lessonId]; if (v >= 1 && v <= 5) return v;
    return s.defaultLevel;
  }
  function rememberLevel(lessonId, lv) { var b = jget('oks_core_v1', {}); b.levels = b.levels || {}; b.levels[lessonId] = lv; jset('oks_core_v1', b); }
  function applyBody() {
    var s = settings(); var b = document.body; if (!b) return;
    b.classList.toggle('calm', s.calm); b.classList.toggle('big-targets', s.big);
  }

  /* ---------- 목소리 ---------- */
  var voices = [];
  function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) {} }
  if ('speechSynthesis' in global) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
  var lastSaid = { text: '', opt: null };
  function say(text, opt) {
    opt = opt || {};
    if (!text) return Promise.resolve();
    if (!opt.noRepeat) lastSaid = { text: text, opt: opt };
    var s = settings();
    if (!s.voice || !('speechSynthesis' in global)) return Promise.resolve();
    return new Promise(function (res) {
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
        var lang = opt.lang || 'ko-KR'; u.lang = lang;
        var v = voices.filter(function (x) { return x.lang && x.lang.replace('_', '-').indexOf(lang.slice(0, 2)) === 0; });
        var best = v.filter(function (x) { return /Google|Yuna|Heami|Samantha|Natural/i.test(x.name); })[0] || v[0];
        if (best) u.voice = best;
        u.rate = (opt.rate || (lang.indexOf('en') === 0 ? 0.82 : 0.95)) * (s.slow ? 0.8 : 1);
        u.pitch = opt.pitch || 1.05;
        var done = false; var fin = function () { if (!done) { done = true; res(); } };
        u.onend = fin; u.onerror = fin;
        setTimeout(fin, 900 + String(text).length * 170);
        speechSynthesis.speak(u);
      } catch (e) { res(); }
    });
  }
  var replayFn = null;
  function setReplay(fn) { replayFn = fn; }
  function repeat() { if (replayFn) { replayFn(); return; } if (lastSaid.text) say(lastSaid.text, Object.assign({}, lastSaid.opt, { noRepeat: true })); }
  function hush() { try { speechSynthesis.cancel(); } catch (e) {} }

  /* ---------- 소리 (Web Audio 합성) ---------- */
  var ac = null;
  function actx() {
    if (!ac) { try { ac = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(freq, dur, type, vol, when) {
    var c = actx(); if (!c) return; var t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    env(g, t, 0.012, dur || 0.3, vol || 0.25); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + (dur || 0.3) + 0.05);
  }
  function noise(dur, vol, hp, when, lp) {
    var c = actx(); if (!c) return; var t = c.currentTime + (when || 0);
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = buf; var f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 1000;
    var g = c.createGain(); env(g, t, 0.004, dur, vol || 0.2); s.connect(f);
    if (lp) { var f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp; f.connect(f2); f2.connect(g); } else f.connect(g);
    g.connect(c.destination); s.start(t); s.stop(t + dur + 0.02);
  }
  var NOTE = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, C3: 130.8, G3: 196 };
  function inst(name, freq, when) {
    if (!settings().sound && name !== 'force') return;
    var w = when || 0;
    switch (name) {
      case 'drum': tone(110, 0.35, 'sine', 0.6, w); tone(70, 0.4, 'sine', 0.45, w); noise(0.06, 0.12, 200, w, 900); break;
      case 'tambourine': noise(0.25, 0.22, 5000, w); tone(1800, 0.15, 'triangle', 0.04, w); break;
      case 'maracas': noise(0.09, 0.3, 3500, w, 9000); noise(0.07, 0.2, 3500, w + 0.12, 9000); break;
      case 'triangle': tone(2600, 1.2, 'sine', 0.12, w); tone(5200, 0.8, 'sine', 0.04, w); break;
      case 'clap': noise(0.05, 0.35, 900, w, 4000); noise(0.06, 0.3, 900, w + 0.02, 4000); break;
      case 'bell': tone(freq || 880, 1, 'sine', 0.2, w); tone((freq || 880) * 2.76, 0.5, 'sine', 0.06, w); break;
      case 'xylo': tone(freq || 523, 0.45, 'triangle', 0.3, w); tone((freq || 523) * 4, 0.12, 'sine', 0.05, w); break;
      case 'piano': tone(freq || 262, 0.9, 'triangle', 0.25, w); tone((freq || 262) * 2, 0.5, 'sine', 0.06, w); break;
      case 'whistle': tone(freq || 1200, 0.5, 'sine', 0.15, w); break;
      case 'low': tone(130, 0.9, 'triangle', 0.4, w); tone(65, 0.9, 'sine', 0.3, w); break;
      case 'high': tone(1047, 0.7, 'sine', 0.22, w); tone(2093, 0.4, 'sine', 0.06, w); break;
      default: tone(freq || 440, 0.4, 'sine', 0.25, w);
    }
  }
  function sfx(name) {
    if (!settings().sound) return;
    switch (name) {
      case 'ok': tone(660, 0.14, 'triangle', 0.22); tone(990, 0.22, 'triangle', 0.2, 0.1); break;
      case 'no': tone(260, 0.2, 'sine', 0.14); tone(220, 0.25, 'sine', 0.12, 0.12); break;
      case 'pop': tone(520, 0.08, 'sine', 0.2); tone(780, 0.08, 'sine', 0.12, 0.04); break;
      case 'tick': tone(1200, 0.04, 'square', 0.05); break;
      case 'coin': tone(988, 0.08, 'square', 0.08); tone(1319, 0.25, 'square', 0.08, 0.07); break;
      case 'water': noise(0.5, 0.12, 400, 0, 2500); break;
      case 'splash': noise(0.35, 0.25, 300, 0, 3000); tone(300, 0.2, 'sine', 0.1); break;
      case 'win': [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.3, 'triangle', 0.22, i * 0.12); }); break;
      default: tone(600, 0.1);
    }
  }

  /* ---------- 촉진(프롬프트) ---------- */
  var hand = null, glowEls = [], timers = [], handAnim = null, curTarget = null, stats = null;
  function clearPrompt() {
    timers.forEach(clearTimeout); timers = [];
    glowEls.forEach(function (e) { e.classList.remove('oks-glow'); }); glowEls = [];
    if (hand) { hand.style.display = 'none'; if (handAnim) { handAnim.cancel(); handAnim = null; } }
  }
  function targetEls() { var t = curTarget && curTarget.get ? curTarget.get() : null; if (!t) return []; return (t.length != null ? Array.prototype.slice.call(t) : [t]).filter(Boolean); }
  function doGlow() { var t = targetEls(); if (!t.length) return false; t.forEach(function (e) { e.classList.add('oks-glow'); glowEls.push(e); }); if (stats) stats.glow++; return true; }
  function center(e) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function doHand() {
    var t = targetEls(); if (!t.length) return false;
    if (!hand) { hand = el('img', 'oks-hand'); hand.src = UI + 'pointer.webp'; hand.alt = ''; document.body.appendChild(hand); }
    hand.style.display = 'block';
    if (handAnim) handAnim.cancel();
    var a = center(t[0]); var ox = -14, oy = -8; /* 손끝 위치 보정 */
    var calm = settings().calm;
    if (curTarget.to) { /* 옮기기 시범: 물건 → 놓을 곳 */
      var toEl = typeof curTarget.to === 'function' ? curTarget.to() : curTarget.to; if (!toEl) return false;
      var b = center(toEl);
      handAnim = hand.animate([
        { transform: 'translate(' + (a.x + ox) + 'px,' + (a.y + oy) + 'px) scale(1)', offset: 0 },
        { transform: 'translate(' + (a.x + ox) + 'px,' + (a.y + oy + 8) + 'px) scale(.92)', offset: 0.15 },
        { transform: 'translate(' + (b.x + ox) + 'px,' + (b.y + oy + 8) + 'px) scale(.92)', offset: 0.7 },
        { transform: 'translate(' + (b.x + ox) + 'px,' + (b.y + oy) + 'px) scale(1)', offset: 1 }
      ], { duration: calm ? 2600 : 1700, iterations: Infinity });
    } else {
      handAnim = hand.animate([
        { transform: 'translate(' + (a.x + ox) + 'px,' + (a.y + oy + 26) + 'px) scale(1)' },
        { transform: 'translate(' + (a.x + ox) + 'px,' + (a.y + oy) + 'px) scale(.9)' },
        { transform: 'translate(' + (a.x + ox) + 'px,' + (a.y + oy + 26) + 'px) scale(1)' }
      ], { duration: calm ? 1800 : 1100, iterations: Infinity });
    }
    if (stats) stats.hand++;
    if (curTarget.say) say(curTarget.say);
    return true;
  }
  /* 목표 지정: get() → 눌러야 할 요소(들), to → 옮길 곳, say → 손가락과 함께 들려줄 말 */
  function target(t, level) {
    clearPrompt(); curTarget = t; if (!t) return;
    var p = PROMPT[level];
    if (p && !t.noAuto) {
      timers.push(setTimeout(doGlow, p[0] * 1000 * (t.slow || 1)));
      timers.push(setTimeout(doHand, p[1] * 1000 * (t.slow || 1)));
    }
  }
  function help() { /* 🙋 도와줘: 반짝임 → 한 번 더 누르면 손가락 */
    if (!curTarget) { repeat(); return; }
    if (stats) stats.asked++;
    if (!glowEls.length) { doGlow(); repeat(); } else doHand();
  }
  function showNow(kind) { if (kind === 'hand') doHand(); else doGlow(); }

  /* ---------- 화면 틀 ---------- */
  function mascot(kind) { return ROOT + 'icons/mascot-' + (kind || 'idle') + '.png'; }
  var shellRef = null;
  function shell(o) {
    applyBody();
    document.body.classList.add('oks');
    var app = el('div', 'oks-app');
    var top = el('div', 'oks-top');
    var back = el('a', 'oks-pill', '⬅ <span>' + esc(o.backLabel || '배움 지도') + '</span>'); back.href = o.back || (ROOT + 'learn/');
    var title = el('div', 'oks-title', '<b>' + esc(o.title) + '</b>' + (o.subtitle ? '<span>' + esc(o.subtitle) + '</span>' : ''));
    var lvl = el('button', 'oks-pill oks-level', ''); lvl.type = 'button';
    var dots = el('div', 'oks-dots');
    var speak = el('button', 'oks-round', '<img src="' + UI + 'speaker.webp" alt="다시 듣기">'); speak.type = 'button'; speak.title = '다시 듣기';
    var helpBtn = el('button', 'oks-pill oks-help', '🙋 도와줘'); helpBtn.type = 'button';
    top.appendChild(back); top.appendChild(title); top.appendChild(lvl); top.appendChild(dots); top.appendChild(speak); top.appendChild(helpBtn);
    var ask = el('div', 'oks-ask', '<img class="oks-mascot" src="' + mascot('idle') + '" alt=""><div class="oks-ask-bubble"><span class="oks-ask-text"></span></div>');
    var board = el('div', 'oks-board');
    app.appendChild(top); app.appendChild(ask); app.appendChild(board);
    document.body.appendChild(app);
    speak.onclick = function () { actx(); repeat(); };
    helpBtn.onclick = function () { actx(); help(); };
    ask.querySelector('.oks-ask-bubble').onclick = function () { repeat(); };
    var ref = {
      app: app, board: board, top: top, levelBtn: lvl,
      setLevel: function (n) { lvl.textContent = '수준 ' + LEVELS[n - 1].short; lvl.title = LEVELS[n - 1].desc; },
      setRounds: function (n, cur) {
        dots.innerHTML = ''; for (var i = 0; i < n; i++) dots.appendChild(el('span', 'oks-dot' + (i < cur ? ' done' : i === cur ? ' now' : '')));
      },
      ask: function (text, opt) {
        opt = opt || {};
        var b = ask.querySelector('.oks-ask-bubble');
        b.innerHTML = '<span class="oks-ask-text">' + (opt.html || esc(text)) + '</span>' + (opt.img ? '<img class="oks-ask-img" src="' + opt.img + '" alt="">' : '');
        ask.querySelector('.oks-mascot').src = mascot(opt.mood || 'idle');
        b.classList.remove('oks-pop'); void b.offsetWidth; b.classList.add('oks-pop');
        replayFn = opt.replay || null;
        if (opt.replay) { lastSaid = { text: text, opt: opt }; return say(opt.speak || text, opt).then(function () { return opt.replay(); }); }
        if (opt.silent) { lastSaid = { text: opt.speak || text, opt: opt }; return Promise.resolve(); }
        return say(opt.speak || text, opt);
      },
      mood: function (m) { ask.querySelector('.oks-mascot').src = mascot(m); }
    };
    if (o.level) ref.setLevel(o.level);
    if (o.rounds) ref.setRounds(o.rounds, 0);
    shellRef = ref;
    return ref;
  }
  function toast(text, ms) {
    var t = el('div', 'oks-toast', esc(text)); document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 1800);
  }
  var PRAISE = ['잘했어요!', '멋져요!', '최고예요!', '좋아요!', '훌륭해요!'];
  function praise(text) {
    var p = el('div', 'oks-praise', '<img src="' + UI + 'sparkles.webp" alt="">' + esc(text || PRAISE[Math.floor(Math.random() * PRAISE.length)]));
    document.body.appendChild(p); setTimeout(function () { p.remove(); }, 1050);
  }

  /* ---------- 기록 ---------- */
  function independence(st) {
    if (st.helpLevel) return st.helpLevel;
    if (st.hand > 0) return '시범';
    if (st.glow > 0 || st.asked > 0) return '시각힌트';
    return '독립';
  }
  function starsFor(st) {
    if (st.mistakes <= 1 && st.hand === 0) return 3;
    if (st.mistakes <= 3 && st.hand <= 1) return 2;
    return 1;
  }
  function log(entry) {
    var all = jget('oks_learning_log_v1', []); all.push(entry); if (all.length > 800) all = all.slice(-800); jset('oks_learning_log_v1', all);
    var pr = jget('oks_learning_progress_v1', {}); var p = pr[entry.lesson] || { best: {}, plays: 0 };
    p.plays++; p.last = entry.level; p.at = entry.at;
    p.best[entry.level] = Math.max(p.best[entry.level] || 0, entry.stars);
    pr[entry.lesson] = p; jset('oks_learning_progress_v1', pr);
    /* 기존 선생님 화면(reports.html)도 볼 수 있도록 예전 기록에도 한 줄 남김 */
    var old = jget('oks-activity-log', []);
    old.push({ at: entry.at, subject: entry.subject, method: entry.engine, level: entry.level, stars: entry.stars, mistakes: entry.mistakes, hints: entry.glow + entry.hand, sec: entry.sec, lesson: entry.lesson });
    if (old.length > 500) old = old.slice(-500); jset('oks-activity-log', old);
  }
  function progress() { return jget('oks_learning_progress_v1', {}); }

  /* ---------- 끝 화면 ---------- */
  function finish(o) {
    clearPrompt();
    var st = o.stats, stars = o.stars || starsFor(st);
    sfx('win'); if (shellRef) shellRef.mood('cheer');
    var ov = el('div', 'oks-overlay');
    var box = el('div', 'oks-finish');
    var starHtml = ''; for (var i = 0; i < 3; i++) starHtml += '<img src="' + UI + 'star_gold.webp" class="' + (i < stars ? '' : 'off') + '" alt="">';
    box.innerHTML = '<img class="oks-mascot" src="' + mascot('cheer') + '" alt="">' +
      '<h2>' + esc(o.title || '다 했어요!') + '</h2><p>' + esc(o.text || '') + '</p><div class="stars">' + starHtml + '</div>' +
      '<div class="oks-help-rec"><span>선생님 기록 · 도움 정도</span><div class="chips"></div></div><div class="btns"></div>' +
      '<div class="note"></div>';
    var chips = box.querySelector('.chips');
    var auto = independence(st);
    var entry = o.entry; entry.independence = auto; entry.stars = stars;
    ['독립', '언어힌트', '시각힌트', '시범', '신체지원'].forEach(function (k) {
      var c = el('button', 'oks-chip' + (k === auto ? ' on' : ''), k); c.type = 'button';
      c.onclick = function () {
        chips.querySelectorAll('.oks-chip').forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on');
        var all = jget('oks_learning_log_v1', []); var last = all[all.length - 1];
        if (last && last.at === entry.at) { last.independence = k; last.teacherSet = true; jset('oks_learning_log_v1', all); }
      };
      chips.appendChild(c);
    });
    log(entry);
    if (global.OKS.eco && !o.noReward) { /* 코인·경험치 */
      var rc = o.coins != null ? o.coins : 3 + stars * 3, rx = o.xp != null ? o.xp : 10 + (entry.level || 1) * 4 + stars * 3;
      global.OKS.eco.reward({ coins: rc, xp: rx, mission: o.mission || { lesson: 1 }, badge: [o.badge || 'first_lesson'].concat(entry.level === 5 && stars === 3 ? ['star5'] : []), delay: 900 });
      box.querySelector('.stars').insertAdjacentHTML('afterend', '<div class="eco-gain">🪙 +' + rc + ' · ⭐ 경험치 +' + rx + '</div>');
    }
    var btns = box.querySelector('.btns');
    (o.buttons || []).forEach(function (b) {
      var x = el(b.href ? 'a' : 'button', 'oks-btn ' + (b.color || ''), esc(b.label)); if (b.href) x.href = b.href; else { x.type = 'button'; x.onclick = function () { ov.remove(); b.onClick && b.onClick(); }; }
      btns.appendChild(x);
    });
    box.querySelector('.note').textContent = '틀린 횟수 ' + st.mistakes + ' · 반짝임 ' + st.glow + ' · 손가락 ' + st.hand + ' · 도와줘 ' + st.asked + ' · ' + entry.sec + '초';
    ov.appendChild(box); document.body.appendChild(ov);
    say(o.speak || (stars === 3 ? '정말 잘했어요! 별 세 개!' : '끝까지 잘했어요!'));
    return stars;
  }

  function newStats() { stats = { mistakes: 0, glow: 0, hand: 0, asked: 0, t0: Date.now() }; return stats; }

  global.OKS = {
    ROOT: ROOT, UI: UI, LEVELS: LEVELS, PROMPT: PROMPT, NOTE: NOTE,
    jget: jget, jset: jset, qs: qs, el: el, esc: esc, shuffle: shuffle, pick: pick, wait: wait,
    settings: settings, saveSetting: saveSetting, levelFor: levelFor, rememberLevel: rememberLevel, applyBody: applyBody,
    say: say, repeat: repeat, setReplay: setReplay, hush: hush, sfx: sfx, tone: tone, noise: noise, inst: inst, unlock: actx,
    target: target, clearPrompt: clearPrompt, help: help, showNow: showNow,
    shell: shell, toast: toast, praise: praise, mascot: mascot,
    log: log, progress: progress, finish: finish, newStats: newStats, starsFor: starsFor,
    _cur: function () { return curTarget; },
    get stats() { return stats; }
  };
  document.addEventListener('pointerdown', function once() { actx(); document.removeEventListener('pointerdown', once); }, { once: true });
})(window);
