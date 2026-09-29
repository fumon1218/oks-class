/* 게임 엔진 1 — 고르기(pick) · 짝 찾기(pairs) · 나누어 담기(sort) · 순서(order) · 규칙(pattern) · 수 세기(count)
   정글 점프의 '이럴 땐 어떻게', '안전 짝꿍', '분리수거', '분식집 순서', '구슬 공예', '포장 공방'을 교과용으로 옮긴 틀입니다.
   모든 엔진은 5수준을 같은 원칙으로 바꿉니다:
   1 느끼기(하나만·틀릴 수 없음) → 2 고르기(2개) → 3 해 보기(3개·옮기기) → 4 혼자서(4개·요청할 때만 힌트) → 5 생활로(새 장면·만들기) */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var EN = window.OKS_ENGINES = window.OKS_ENGINES || {};

  function fill(t, it) { return String(t || '').replace(/\{x\}/g, it.label || '').replace(/\{en\}/g, it.en || '').replace(/\{snd\}/g, it.snd || ''); }
  function zone(ctx, html, cls) { var z = E('div', 'dropzone ' + (cls || ''), html || '<span>여기에 놓아요</span>'); return z; }
  function row(cls) { return E('div', 'row ' + (cls || '')); }

  /* ================= 고르기 ================= */
  /* cfg: items[{label,img|emo|color|svg, en, snd, inst, mel}], q: '...{x}...', voice: label|sound|en|inst|mel,
          l1: 느끼기 안내, sets: [{q, opts:[item], ok:[번호]}] (상황 고르기), l5: {items,q,voice,sets,free,multi} */
  function playTarget(ctx, it, how) {
    if (how === 'mel' && it.mel) return EN._melody(it.mel, it.tempo, it.inst2);
    if (how === 'inst' && it.inst) { O.inst(it.inst, it.freq); return O.wait(600); }
    return ctx.voice(it, how);
  }
  EN._melody = function (mel, tempo, inst) {
    var t = 0, step = 60 / (tempo || 100);
    mel.forEach(function (n) { var p = String(n).split(':'); var f = O.NOTE[p[0]]; var d = parseFloat(p[1] || 1);
      if (f) O.inst(inst || 'piano', f, t); t += d * step; });
    return O.wait(t * 1000 + 200);
  };
  function pickRound(ctx, i) {
    var c = ctx.cfg, lv = ctx.level;
    if (lv === 5 && c.l5) c = Object.assign({}, c, c.l5);
    var how = c.voice || 'label';
    /* 상황 세트형 */
    if (c.sets && c.sets.length) {
      var s = c.sets[i % c.sets.length];
      var okIdx = [].concat(s.ok == null ? 0 : s.ok);
      var right = okIdx.map(function (k) { return s.opts[k]; });
      var wrong = s.opts.filter(function (x, k) { return okIdx.indexOf(k) < 0; });
      var n = Math.max(right.length, Math.min(s.opts.length, lv === 1 ? right.length : ctx.nOpt));
      var opts = O.shuffle(right.concat(O.shuffle(wrong).slice(0, n - right.length)));
      if (s.en) return { q: s.q, say: s.say, opts: opts, right: right, how: 'en', target: { en: s.en }, free: s.free || c.free, speakEn: true };
      return { q: s.q, say: s.say, opts: opts, right: right, how: s.voice || (how === 'en' ? 'label' : how), target: s.target, free: s.free || c.free, sayEn: how === 'en' };
    }
    var pool = c.items;
    if (!ctx._order || ctx._order.length === 0) ctx._order = O.shuffle(pool.map(function (x, k) { return k; }));
    var tgt = pool[ctx._order.pop()];
    var others = O.shuffle(pool.filter(function (x) { return x !== tgt; }));
    var n2 = Math.min(pool.length, ctx.nOpt);
    var list = O.shuffle([tgt].concat(others.slice(0, n2 - 1)));
    var q = c.free ? (c.q || '좋아하는 것을 골라요') : fill(c.q || '{x}를 찾아요', tgt);
    return { q: q, opts: list, right: c.free ? list : [tgt], how: how, target: tgt, free: c.free };
  }
  function askRound(ctx, R) {
    var t = R.target, how = R.how;
    if (R.free || !t) return ctx.ask(R.q, { speak: R.say || R.q });
    if (how === 'en') return ctx.ask(R.q, { html: O.esc(R.q) + ' <b class="en">🔊' + (ctx.level <= 2 ? ' ' + O.esc(t.en) : '') + '</b>', replay: function () { return O.say(t.en, { lang: 'en-US', noRepeat: true }); }, speak: R.say || R.q.replace(/\{en\}|🔊.*/g, '') });
    if (how === 'inst' || how === 'mel') return ctx.ask(R.q, { html: O.esc(R.q) + ' <b class="en">🔊</b>', replay: function () { return playTarget(ctx, t, how); }, speak: R.say || R.q });
    if (how === 'sound' && t.snd) return ctx.ask(R.q, { speak: R.say || R.q });
    return ctx.ask(R.q, { speak: R.say || R.q });
  }
  EN.pick = {
    rounds: [3, 5, 5, 6, 5],
    round: function (ctx, i) {
      var c = ctx.cfg, lv = ctx.level;
      ctx.clear();
      if (lv === 1 && !(c.sets && c.sets.length)) {
        /* 느끼기: 큰 카드 2~3장, 아무거나 눌러 듣기. 모두 눌러 보면 끝 */
        var items = O.pick(c.items, Math.min(3, c.items.length));
        var cards = items.map(function (it) { return ctx.card(it, { big: true }); });
        ctx.board.appendChild(ctx.grid(cards));
        ctx.ask(c.l1 || '하나씩 눌러서 들어 봐요!');
        return new Promise(function (res) {
          var left = cards.length;
          ctx.target({ get: function () { return cards.filter(function (x) { return !x._done; }); } });
          cards.forEach(function (cd) {
            cd.onclick = function () {
              playTarget(ctx, cd._item, c.voice === 'label' || !c.voice ? 'label' : c.voice === 'en' ? 'en' : c.voice);
              if (c.voice === 'sound' && cd._item.snd) setTimeout(function () { O.say(cd._item.snd, { noRepeat: true }); }, 50);
              cd.classList.remove('bounce'); void cd.offsetWidth; cd.classList.add('bounce');
              if (!cd._done) { cd._done = true; cd.classList.add('good'); O.sfx('pop'); left--; O.clearPrompt();
                if (left === 0) { setTimeout(function () { O.praise(); res(); }, 1300); }
                else ctx.target({ get: function () { return cards.filter(function (x) { return !x._done; }); } }); }
            };
          });
        });
      }
      var R = pickRound(ctx, i);
      var cardsB = R.opts.map(function (it) { return ctx.card(it, { big: R.opts.length <= 2, noLabel: c.hideLabel && lv >= (c.hideLabel || 4) }); });
      var okEls = cardsB.filter(function (cd) { return R.right.indexOf(cd._item) >= 0; });
      ctx.board.appendChild(ctx.grid(cardsB));
      var dragMode = lv === 3 && !R.free && okEls.length === 1 && !c.noDrag;
      var dz;
      if (dragMode) { dz = zone(ctx, '<span class="dz-ico">' + (c.zoneIcon || '🧺') + '</span><span>' + (c.zoneLabel || '여기에 옮겨요') + '</span>'); ctx.board.appendChild(dz); }
      return askRound(ctx, R).then(function () {
        var need = R.free ? 1 : okEls.length;
        ctx.target({ get: function () { return okEls.filter(function (x) { return !x._done; }); }, to: dz ? function () { return dz; } : null });
        if (dragMode) {
          return ctx.dnd(cardsB, [dz], function (it) { return okEls.indexOf(it) >= 0; }, function (it) {
            dz.innerHTML = ''; var cp = ctx.card(it._item); cp.classList.add('good'); dz.appendChild(cp); it.classList.add('dim');
            ctx.good(null); playTarget(ctx, it._item, R.how === 'en' ? 'en' : 'label');
          }, function () { return true; }).then(function () { return O.wait(900); });
        }
        return new Promise(function (res) {
          var got = 0;
          (function next() {
            ctx.tapWait(cardsB, function (e) { return R.free || (okEls.indexOf(e) >= 0 && !e._done); }).then(function (e) {
              e._done = true; got++; ctx.good(e, got >= need ? undefined : false);
              if (R.free && (e._item.inst || e._item.mel)) playTarget(ctx, e._item, e._item.mel ? 'mel' : 'inst');
              else if (R.free && e._item.en) O.say(fill(c.freeSay || 'I like {en}!', e._item), { lang: 'en-US', noRepeat: true });
              else if (R.free) O.say(fill(c.freeSay || '{x}! 좋아요', e._item), { noRepeat: true });
              else playTarget(ctx, e._item, (R.how === 'en' || R.sayEn) && e._item.en ? 'en' : R.how === 'inst' ? 'inst' : 'label');
              if (got >= need) setTimeout(res, 1100);
              else { ctx.target({ get: function () { return okEls.filter(function (x) { return !x._done; }); } }); next(); }
            });
          })();
        });
      });
    }
  };

  /* ================= 짝 찾기 ================= */
  /* cfg: items[{label, img|emo, word?, en?}], wordOf: 'label'|'en' */
  EN.pairs = {
    rounds: [3, 3, 3, 3, 2],
    round: function (ctx) {
      var c = ctx.cfg, lv = ctx.level;
      ctx.clear();
      var n = [1, 2, 3, 4, 3][lv - 1];
      var set = O.pick(c.items, n);
      var wordOf = function (it) { return c.wordOf === 'en' ? it.en : (it.word || it.label); };
      if (lv === 5) return memory(ctx, set, wordOf);
      var pics = set.map(function (it) { return ctx.card(it, { noLabel: true, cls: 'pic-card' }); });
      var words = O.shuffle(set).map(function (it) { var w = E('button', 'oks-card word-card', '<span class="envelope">✉️</span><b>' + O.esc(wordOf(it)) + '</b>'); w.type = 'button'; w._item = it; return w; });
      var wrap = row('pairs'); var L = E('div', 'col'); var Rr = E('div', 'col');
      pics.forEach(function (p) { L.appendChild(p); }); words.forEach(function (w) { Rr.appendChild(w); });
      wrap.appendChild(L); wrap.appendChild(E('div', 'pair-arrow', '➜')); wrap.appendChild(Rr);
      ctx.board.appendChild(wrap);
      var say = c.wordOf === 'en' ? function (it) { return O.say(it.en, { lang: 'en-US', noRepeat: true }); } : function (it) { return O.say(wordOf(it), { noRepeat: true }); };
      return ctx.ask(lv === 1 ? (c.l1 || '그림을 눌러 낱말 봉투에 넣어요') : (c.q || '그림과 같은 낱말을 찾아 옮겨요')).then(function () {
        var left = set.length;
        function nextTarget() { var p = pics.filter(function (x) { return !x._done; })[0]; if (!p) return; var w = words.filter(function (x) { return x._item === p._item; })[0];
          ctx.target({ get: function () { return p; }, to: function () { return w; } }); }
        if (lv === 1) ctx.target({ get: function () { return pics[0]; } }); else nextTarget();
        if (lv === 1) {
          return new Promise(function (res) {
            pics[0].onclick = function () { pics[0]._done = true; O.clearPrompt(); O.sfx('pop'); ctx.fly(pics[0], words[0]).then(function () { words[0].classList.add('good'); pics[0].classList.add('dim'); say(set[0]); ctx.good(null); setTimeout(res, 1000); }); };
          });
        }
        return ctx.dnd(pics, words, function (p, w) { return p._item === w._item; }, function (p, w) {
          p.classList.add('dim'); w.classList.add('good'); w.querySelector('.envelope').textContent = '💌'; say(p._item); left--;
          if (left > 0) { ctx.good(null, false); nextTarget(); } else ctx.good(null);
        }, function () { return left === 0; }).then(function () { return O.wait(900); });
      });
    }
  };
  function memory(ctx, set, wordOf) {
    var cards = [];
    set.forEach(function (it) {
      [0, 1].forEach(function (k) {
        var b = E('button', 'oks-card flip', '<div class="back">❓</div><div class="face">' + (k === 0 ? '<div class="pic">' + ctx.pic(it) + '</div>' : '<b class="wordbig">' + O.esc(wordOf(it)) + '</b>') + '</div>');
        b.type = 'button'; b._item = it; cards.push(b);
      });
    });
    cards = O.shuffle(cards);
    ctx.board.appendChild(ctx.grid(cards, 3));
    return ctx.ask('카드를 뒤집어 그림과 낱말 짝을 찾아요').then(function () {
      return new Promise(function (res) {
        var open = [], found = 0, lock = false;
        ctx.target({ get: function () {
          if (lock) return null;
          if (open.length === 1) return cards.filter(function (x) { return x !== open[0] && x._item === open[0]._item; })[0];
          return cards.filter(function (x) { return !x._done; })[0];
        } });
        cards.forEach(function (b) {
          b.onclick = function () {
            if (lock || b._done || open.indexOf(b) >= 0) return;
            b.classList.add('open'); O.sfx('tick'); open.push(b); O.clearPrompt();
            if (ctx.cfg.wordOf === 'en') O.say(b._item.en, { lang: 'en-US', noRepeat: true }); else O.say(wordOf(b._item), { noRepeat: true });
            if (open.length === 2) {
              lock = true;
              if (open[0]._item === open[1]._item) { open.forEach(function (x) { x._done = true; x.classList.add('good'); }); found++; open = []; lock = false; ctx.good(null, found === set.length ? undefined : false); if (found === set.length) setTimeout(res, 900); }
              else { setTimeout(function () { open.forEach(function (x) { x.classList.remove('open'); }); open = []; lock = false; }, 1100); }
            }
          };
        });
      });
    });
  }

  /* ================= 나누어 담기 ================= */
  /* cfg: bins[{key,label,emo|img}], items[{label,img|emo,bin, wash?}], mode:'water'|'', rinse(5수준 헹구기), countAfter */
  EN.sort = {
    rounds: [2, 3, 3, 3, 2],
    round: function (ctx, i) {
      var c = ctx.cfg, lv = ctx.level;
      ctx.clear();
      var nb = Math.min(c.bins.length, [1, 2, 2, 3, 4][lv - 1]);
      var water = c.mode === 'water';
      var bins = lv === 1 ? [c.bins[i % c.bins.length]] : c.fixedBins ? c.bins.slice() : O.pick(c.bins, nb);
      var keys = bins.map(function (b) { return b.key; });
      var ni = [3, 4, 4, 5, 6][lv - 1];
      var pool = (water && lv === 1) ? c.items.slice() : c.items.filter(function (it) { return keys.indexOf(it.bin) >= 0; });
      var items = [];
      if (!(water && lv === 1)) keys.forEach(function (k) { var one = O.pick(pool.filter(function (it) { return it.bin === k; }), 1)[0]; if (one) items.push(one); });
      items = O.shuffle(items.concat(O.pick(pool.filter(function (it) { return items.indexOf(it) < 0; }), Math.max(0, Math.min(ni, pool.length) - items.length))));
      var rinse = lv === 5 && c.rinse;
      var binEls = bins.map(function (b) {
        var z = E('div', 'dropzone bin' + (water ? ' tank' : ''), '<div class="bin-ico">' + ctx.pic(b) + '</div><b>' + O.esc(b.label) + '</b><div class="bin-in"></div>');
        z._bin = b; return z;
      });
      if (water && lv === 1) { binEls = [E('div', 'dropzone bin tank big', '<div class="bin-ico"><span class="emo">🫧</span></div><b>물에 넣어 봐요</b><div class="bin-in"></div>')]; }
      var sink;
      if (rinse) { sink = E('div', 'dropzone bin sink', '<div class="bin-ico"><span class="emo">🚰</span></div><b>물로 헹구기</b>'); }
      var itemEls = items.map(function (it) { var cd = ctx.card(it, { cls: 'small' + (rinse && it.wash ? ' dirty' : '') }); cd._washed = !(rinse && it.wash); return cd; });
      var top = row('items'); itemEls.forEach(function (e) { top.appendChild(e); });
      var bottom = row('bins'); if (sink) bottom.appendChild(sink); binEls.forEach(function (e) { bottom.appendChild(e); });
      ctx.board.appendChild(top); ctx.board.appendChild(bottom);
      var q = lv === 1 ? (water ? '물에 넣으면 어떻게 될까요? 하나씩 넣어 봐요' : (c.l1 || '모두 여기에 넣어요')) : (rinse ? '더러운 것은 먼저 헹구고, 알맞은 통에 넣어요' : (c.q || '같은 것끼리 알맞은 곳에 넣어요'));
      var zones = sink ? [sink].concat(binEls) : binEls;
      function nextTarget() {
        var it = itemEls.filter(function (x) { return !x._done; })[0]; if (!it) return;
        var to = !it._washed ? sink : (lv === 1 ? binEls[0] : binEls.filter(function (z) { return z._bin.key === it._item.bin; })[0]);
        ctx.target({ get: function () { return it; }, to: function () { return to; }, say: it._item.label + '(은)는 여기에 넣어요' });
      }
      return ctx.ask(q).then(function () {
        nextTarget();
        var left = itemEls.length;
        return ctx.dnd(itemEls, zones, function (it, z) {
          if (z === sink) return !it._washed;
          if (!it._washed) { O.say('먼저 물로 헹궈요', { noRepeat: true }); return false; }
          if (lv === 1) return true;
          return z._bin.key === it._item.bin;
        }, function (it, z) {
          if (z === sink) { it._washed = true; it._done = false; it.classList.remove('dirty'); O.sfx('water'); O.say('깨끗해졌어요!', { noRepeat: true }); nextTarget(); return; }
          left--; it.classList.add('dim'); it.style.visibility = 'hidden';
          var mini = E('span', 'bin-item' + (water ? (it._item.float ? ' floats' : ' sinks') : ''), ctx.pic(it._item));
          z.querySelector('.bin-in').appendChild(mini);
          if (water) { O.sfx('splash'); O.say(it._item.float ? '둥둥 떠요' : '꼬르륵 가라앉아요', { noRepeat: true }); }
          else O.say(it._item.label, { noRepeat: true });
          ctx.good(null, left === 0 ? undefined : false); nextTarget();
        }, function () { return left === 0; }).then(function () {
          if (c.countAfter && lv >= 4) return countAsk(ctx, binEls);
          return O.wait(1200);
        });
      });
    }
  };
  function countAsk(ctx, binEls) {
    var z = O.pick(binEls, 1)[0]; var n = z.querySelectorAll('.bin-item').length;
    var opts = O.shuffle([n].concat(O.pick([1, 2, 3, 4, 5, 6].filter(function (x) { return x !== n; }), 3)));
    var box = E('div', 'numrow'); var btns = opts.map(function (k) { var b = E('button', 'oks-card num', '<b>' + k + '</b>'); b.type = 'button'; b._n = k; box.appendChild(b); return b; });
    ctx.board.appendChild(box); z.classList.add('oks-glow');
    return ctx.ask(z._bin.label + '에 몇 개 들어 있나요?').then(function () {
      ctx.target({ get: function () { return btns.filter(function (b) { return b._n === n; }); } });
      return ctx.tapWait(btns, function (b) { return b._n === n; }).then(function (b) { z.classList.remove('oks-glow'); ctx.good(b); O.say(n + '개!', { noRepeat: true }); return O.wait(1000); });
    });
  }

  /* ================= 순서 ================= */
  /* cfg: seqs[{title, steps:[item]}] */
  EN.order = {
    rounds: [3, 3, 3, 3, 2],
    round: function (ctx, i) {
      var c = ctx.cfg, lv = ctx.level;
      if (lv === 5 && c.l5) c = Object.assign({}, c, c.l5);
      ctx.clear();
      var seq = c.seqs[i % c.seqs.length];
      var len = Math.min(seq.steps.length, [2, 2, 3, 4, 4][lv - 1]);
      var steps = sub(seq.steps, len);
      var slots = steps.map(function (s, k) { var z = E('div', 'dropzone slot', '<span class="slot-no">' + (k + 1) + '</span><div class="slot-in"></div>'); z._k = k; return z; });
      var sr = row('slots'); slots.forEach(function (z, k) { sr.appendChild(z); if (k < slots.length - 1) sr.appendChild(E('span', 'slot-arrow', '➜')); });
      var cards = steps.map(function (s, k) { var cd = ctx.card(s); cd._k = k; return cd; });
      var cr = row('items'); O.shuffle(cards).forEach(function (cd) { cr.appendChild(cd); });
      ctx.board.appendChild(E('div', 'seq-title', '📖 ' + O.esc(seq.title)));
      ctx.board.appendChild(sr); ctx.board.appendChild(cr);
      var nextK = 0;
      if (lv === 1) cards.forEach(function (cd) { if (cd._k !== 0) cd.style.visibility = 'hidden'; });
      function tgt() { var cd = cards.filter(function (x) { return x._k === nextK; })[0]; if (cd) ctx.target({ get: function () { return cd; }, to: function () { return slots[nextK]; } }); }
      return ctx.ask(lv <= 2 ? (c.q || '처음에 무엇을 할까요? 차례대로 옮겨요') : (c.q3 || '차례대로 번호 칸에 옮겨요')).then(function () {
        tgt();
        return ctx.dnd(cards, slots, function (cd, z) { return cd._k === z._k && cd._k === nextK; }, function (cd, z) {
          var cp = ctx.card(cd._item); cp.classList.add('good', 'in-slot'); z.querySelector('.slot-in').appendChild(cp); z.classList.add('filled');
          cd.style.visibility = 'hidden'; O.say(cd._item.label, { noRepeat: true }); nextK++;
          if (lv === 1) { var nx = cards.filter(function (x) { return x._k === nextK; })[0]; if (nx) nx.style.visibility = ''; }
          ctx.good(null, nextK >= steps.length ? undefined : false); tgt();
        }, function () { return nextK >= steps.length; }).then(function () {
          /* 이야기로 다시 들려주기 */
          var txt = steps.map(function (s, k) { return ['먼저', '그 다음', '그리고', '마지막으로'][k === steps.length - 1 ? 3 : Math.min(k, 2)] + ' ' + (s.story || s.label); }).join(', ');
          return O.say(txt, { noRepeat: true }).then(function () { return O.wait(400); });
        });
      });
    }
  };
  function sub(arr, n) { if (n >= arr.length) return arr.slice(); if (n === 1) return [arr[0]]; var out = []; for (var k = 0; k < n; k++) out.push(arr[Math.round(k * (arr.length - 1) / (n - 1))]); return out; }
  EN._sub = sub;

  /* ================= 규칙 (기차·구슬) ================= */
  var SYMS = [
    { key: 'r', label: '빨강 동그라미', c: '#e53935', s: 'circle' },
    { key: 'b', label: '파랑 네모', c: '#1e88e5', s: 'square' },
    { key: 'y', label: '노랑 세모', c: '#fbc02d', s: 'triangle' },
    { key: 'g', label: '초록 별', c: '#43a047', s: 'star' }
  ];
  function symSvg(sy) {
    var sh = { circle: '<circle cx="50" cy="50" r="40"/>', square: '<rect x="12" y="12" width="76" height="76" rx="10"/>', triangle: '<polygon points="50,8 94,90 6,90"/>', star: '<polygon points="50,6 62,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 38,38"/>' }[sy.s];
    return '<svg viewBox="0 0 100 100" class="sym"><g fill="' + sy.c + '" stroke="rgba(0,0,0,.25)" stroke-width="4">' + sh + '</g></svg>';
  }
  EN._symSvg = symSvg;
  EN.pattern = {
    rounds: [3, 4, 4, 5, 3],
    round: function (ctx, i) {
      var c = ctx.cfg, lv = ctx.level;
      ctx.clear();
      var syms = (c.syms || SYMS).map(function (s) { return s.svg || s.img || s.emo ? s : Object.assign({}, s, { svg: symSvg(s) }); });
      if (lv === 5) return makeOwn(ctx, syms);
      var unitLen = [2, 2, 3, 3, 3][lv - 1];
      var chosen = O.pick(syms, lv === 4 ? 3 : 2);
      var unit = lv <= 2 ? [chosen[0], chosen[1]] : lv === 3 ? (Math.random() < .5 ? [chosen[0], chosen[0], chosen[1]] : [chosen[0], chosen[1], chosen[1]]) : [chosen[0], chosen[1], chosen[2]];
      var shown = [2, 3, 2, 2][lv - 1] * unit.length; var blanks = lv >= 4 ? 2 : 1;
      var seq = []; for (var k = 0; k < shown + blanks; k++) seq.push(unit[k % unit.length]);
      var train = row('train'); train.appendChild(E('div', 'car engine', '🚂'));
      var blanksEls = [];
      seq.forEach(function (s, k) {
        var car = E('div', 'car' + (k >= shown ? ' dropzone blank' : ''), k >= shown ? '<span>?</span>' : ctx.pic(s));
        if (k >= shown) { car._s = s; blanksEls.push(car); }
        train.appendChild(car);
      });
      ctx.board.appendChild(train);
      var n = Math.min(syms.length, ctx.nOpt);
      var need = unit.filter(function (x, k, a) { return a.indexOf(x) === k; });
      var optsS = need.concat(O.shuffle(syms.filter(function (s) { return need.indexOf(s) < 0; })));
      optsS = O.shuffle(optsS.slice(0, Math.max(n, lv === 1 ? 1 : need.length)));
      if (lv === 1) optsS = [seq[shown]];
      var opts = optsS.map(function (s) { var cd = ctx.card(s, { noLabel: true, cls: 'small bead' }); cd._s = s; return cd; });
      var orow = row('items'); opts.forEach(function (o) { orow.appendChild(o); }); ctx.board.appendChild(orow);
      var filled = 0;
      function tgt() { var b = blanksEls[filled]; if (!b) return; var o = opts.filter(function (x) { return x._s === b._s; })[0]; ctx.target({ get: function () { return o; } }); }
      return ctx.ask(lv <= 2 ? '다음에 올 칸을 채워요' : '규칙을 찾아 빈칸을 채워요').then(function () {
        tgt();
        /* 같은 모양 카드를 여러 번 쓸 수 있게: 눌러서 빈칸에 넣고, 카드는 제자리에 남아 있음 */
        return new Promise(function (res) {
          function place(o, b) {
            b.innerHTML = ctx.pic(o._s); b.classList.remove('blank'); b.classList.add('good'); filled++;
            O.sfx('pop'); O.clearPrompt();
            if (filled >= blanksEls.length) { ctx.good(null); train.classList.add('go'); O.sfx('win'); setTimeout(res, 1400); } else { ctx.good(null, false); tgt(); }
          }
          opts.forEach(function (o) {
            o.onclick = function () {
              var b = blanksEls[filled]; if (!b) return;
              if (o._s === b._s) place(o, b); else ctx.bad(o);
            };
          });
        });
      });
    }
  };
  function makeOwn(ctx, syms) {
    var slots = []; var train = row('train'); train.appendChild(E('div', 'car engine', '🚂'));
    for (var k = 0; k < 6; k++) { var s = E('div', 'car dropzone blank', '<span>' + (k < 2 ? '★' : '?') + '</span>'); slots.push(s); train.appendChild(s); }
    ctx.board.appendChild(train);
    var opts = syms.map(function (s) { var cd = ctx.card(s, { noLabel: true, cls: 'small bead' }); cd._s = s; return cd; });
    var orow = row('items'); opts.forEach(function (o) { orow.appendChild(o); }); ctx.board.appendChild(orow);
    return ctx.ask('나만의 규칙 기차! 처음 두 칸을 마음대로 고르고, 그 규칙대로 이어 가요').then(function () {
      return new Promise(function (res) {
        var seq = [];
        ctx.target({ get: function () { var k = seq.length; if (k >= 6) return null; if (k < 2) return opts[k]; return opts.filter(function (x) { return x._s === seq[k % 2]; })[0]; } });
        opts.forEach(function (o) {
          o.onclick = function () {
            var k = seq.length; if (k >= 6) return;
            if (k >= 2 && o._s !== seq[k % 2]) { ctx.bad(o); ctx.target({ get: function () { return opts.filter(function (x) { return x._s === seq[k % 2]; }); } }); return; }
            seq.push(o._s); slots[k].innerHTML = ctx.pic(o._s); slots[k].classList.remove('blank'); slots[k].classList.add('good'); O.sfx('pop'); O.clearPrompt();
            if (k === 1) O.say('좋아요! 이제 규칙대로 이어 가요', { noRepeat: true });
            if (seq.length === 6) { train.classList.add('go'); ctx.good(null, '나만의 규칙 완성!'); setTimeout(res, 1500); }
          };
        });
      });
    });
  }

  /* ================= 수 세기 · 모으기 · 가르기 ================= */
  /* cfg: thing{label,img|emo} 또는 things[], max */
  var NUMW = ['영', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  EN._NUMW = NUMW;
  function dots(n) { var s = ''; for (var k = 0; k < n; k++) s += '●'; return '<small class="dots">' + s + '</small>'; }
  EN._dots = dots;
  EN.count = {
    rounds: [3, 5, 4, 5, 4],
    round: function (ctx) {
      var c = ctx.cfg, lv = ctx.level; ctx.clear();
      var thing = O.pick(c.things || [c.thing], 1)[0];
      var blk = function () { var b = E('button', 'block oks-pop', ctx.pic(thing)); b.type = 'button'; return b; };
      if (lv === 1) {
        var n1 = 2 + Math.floor(Math.random() * 2); var r1 = row('blocks'); var bs = []; for (var k = 0; k < n1; k++) { var b = blk(); bs.push(b); r1.appendChild(b); }
        ctx.board.appendChild(r1);
        return ctx.ask('하나씩 눌러서 같이 세어 봐요').then(function () {
          return new Promise(function (res) { var cnt = 0;
            ctx.target({ get: function () { return bs.filter(function (x) { return !x._done; })[0]; } });
            bs.forEach(function (b) { b.onclick = function () { if (b._done) return; b._done = true; cnt++; b.classList.add('counted'); b.setAttribute('data-n', cnt); O.sfx('pop'); O.say(NUMW[cnt], { noRepeat: true }); O.clearPrompt();
              if (cnt === n1) { setTimeout(function () { O.say('모두 ' + NUMW[cnt] + '!', { noRepeat: true }); O.praise(); setTimeout(res, 1200); }, 700); }
              else ctx.target({ get: function () { return bs.filter(function (x) { return !x._done; })[0]; } }); }; });
          });
        });
      }
      if (lv === 2) {
        var n2 = 1 + Math.floor(Math.random() * 5); var r2 = row('blocks'); for (var j = 0; j < n2; j++) r2.appendChild(blk());
        ctx.board.appendChild(r2);
        return numChoice(ctx, n2, 2, '몇 개일까요?');
      }
      if (lv === 3) {
        var n3 = 1 + Math.floor(Math.random() * 5);
        var pile = row('blocks pile'); var pieces = []; for (var q = 0; q < 7; q++) { var p = blk(); pieces.push(p); pile.appendChild(p); }
        var box = E('div', 'dropzone box', '<div class="order-card"><b>' + n3 + '</b>' + dots(n3) + '</div><div class="box-in"></div>');
        var done = E('button', 'oks-btn orange', '다 넣었어요'); done.type = 'button';
        ctx.board.appendChild(box); ctx.board.appendChild(pile); var dr = row('center'); dr.appendChild(done); ctx.board.appendChild(dr);
        return ctx.ask(NUMW[n3] + ', ' + n3 + '개를 상자에 넣어요').then(function () { return fillBox(ctx, pieces, box, done, n3); });
      }
      if (lv === 4) { /* 모으기 */
        var a = 1 + Math.floor(Math.random() * 4), b2 = 1 + Math.floor(Math.random() * 4);
        var g = row('groups'); var ga = E('div', 'group'), gb = E('div', 'group alt');
        for (var x = 0; x < a; x++) ga.appendChild(blk()); for (var y = 0; y < b2; y++) gb.appendChild(blk());
        g.appendChild(ga); g.appendChild(E('span', 'plus', '+')); g.appendChild(gb); ctx.board.appendChild(g);
        return numChoice(ctx, a + b2, 4, a + '개와 ' + b2 + '개를 모으면 모두 몇 개일까요?', 9);
      }
      /* 5: 가르기 */
      var tot = 3 + Math.floor(Math.random() * 4), part = 1 + Math.floor(Math.random() * (tot - 1));
      var plates = row('groups'); var p1 = E('div', 'group plate'), p2 = E('div', 'group plate alt');
      for (var z = 0; z < part; z++) p1.appendChild(blk()); for (var w = 0; w < tot - part; w++) p2.appendChild(blk());
      p2.classList.add('covered'); plates.appendChild(p1); plates.appendChild(p2); ctx.board.appendChild(plates);
      var qtext = (c.shareText || '{t}개를 두 친구에게 나누어 주었어요. 한 친구가 {p}개를 받았어요. 다른 친구는 몇 개?').replace('{t}', tot).replace('{p}', part);
      return numChoice(ctx, tot - part, 4, qtext, tot).then(function () { p2.classList.remove('covered'); return O.wait(900); });
    }
  };
  function numChoice(ctx, n, k, q, max) {
    max = max || 5;
    var others = O.shuffle(Array.from({ length: max }, function (x, i) { return i + 1; }).filter(function (x) { return x !== n; })).slice(0, k - 1);
    var opts = O.shuffle([n].concat(others));
    var box = E('div', 'numrow'); var btns = opts.map(function (v) { var b = E('button', 'oks-card num', '<b>' + v + '</b>' + dots(v)); b.type = 'button'; b._n = v; box.appendChild(b); return b; });
    ctx.board.appendChild(box);
    return ctx.ask(q).then(function () {
      ctx.target({ get: function () { return btns.filter(function (b) { return b._n === n; }); } });
      return ctx.tapWait(btns, function (b) { return b._n === n; }).then(function (b) { ctx.good(b); O.say(NUMW[n] + '! ' + n + '개', { noRepeat: true }); return O.wait(1100); });
    });
  }
  EN._numChoice = numChoice;
  function fillBox(ctx, pieces, box, done, n) {
    return new Promise(function (res) {
      var inBox = [];
      function tgt() { if (inBox.length < n) ctx.target({ get: function () { return pieces.filter(function (x) { return !x._done; })[0]; }, to: function () { return box; } }); else ctx.target({ get: function () { return done; } }); }
      tgt();
      ctx.dnd(pieces, [box], function () { return true; }, function (p) {
        inBox.push(p); p.style.visibility = 'hidden';
        var m = E('button', 'block mini', p.innerHTML); m.type = 'button'; box.querySelector('.box-in').appendChild(m);
        O.say(NUMW[inBox.length] || String(inBox.length), { noRepeat: true });
        m.onclick = function (e) { e.stopPropagation(); m.remove(); p.style.visibility = ''; p._done = false; inBox.splice(inBox.indexOf(p), 1); O.sfx('tick'); tgt(); };
        tgt();
      }, function () { return false; });
      done.onclick = function () {
        if (inBox.length === n) { ctx.good(done); O.say(NUMW[n] + '! 딱 맞아요', { noRepeat: true }); done.onclick = null; setTimeout(res, 1200); }
        else { ctx.bad(done); O.say(inBox.length < n ? '조금 더 넣어요' : '너무 많아요. 하나 빼 볼까요?', { noRepeat: true }); }
      };
    });
  }
  EN._fillBox = fillBox;
})();
