/* 햇살 농장 — 수학 1-1 '수량 일대일 대응', 과학 1-1 '씨앗에서 식물로'
   온실 배경과 농장 그림은 그대로 쓰고, 게임 방식만 5수준으로 나눴습니다. 곱셈·가격 계산은 뺐습니다. */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var EN = window.OKS_ENGINES = window.OKS_ENGINES || {};
  var A = 'games/farm/assets/';
  var CROPS = [
    { key: 'tomato', label: '토마토', plant: A + 'tomato_plant.webp', one: A + 'harvest_tomato.webp' },
    { key: 'strawberry', label: '딸기', plant: A + 'strawberry_plant.webp', one: A + 'strawberry_single.webp' },
    { key: 'lettuce', label: '상추', plant: A + 'lettuce_plant.webp', one: A + 'harvest_lettuce.webp' },
    { key: 'carrot', label: '당근', plant: A + 'carrots.webp', one: A + 'harvest_carrot.webp' }
  ];
  var FRIENDS = [
    { label: '판다', img: A + 'panda.webp' }, { label: '원숭이', img: A + 'monkey.webp' }, { label: '고양이', img: A + 'cat.webp' }, { label: '토끼', img: A + 'rabbit_farmer.webp' }
  ];
  var STAGES = [
    { label: '씨앗', img: A + 'soil_pot.webp', say: '씨앗을 심었어요' },
    { label: '새싹', img: A + 'sprout_pot.webp', say: '새싹이 났어요' },
    { label: '자란 잎', img: A + 'young_plant.webp', say: '잎이 자랐어요' },
    { label: '열매', img: A + 'tomato_plant.webp', say: '열매가 열렸어요' }
  ];
  EN._farm = { CROPS: CROPS, STAGES: STAGES, FRIENDS: FRIENDS, A: A };
  var NUMW = ['영', '하나', '둘', '셋', '넷', '다섯', '여섯'];
  function img(ctx, p, cls) { return '<img class="' + (cls || '') + '" src="' + ctx.img(p) + '" alt="">'; }
  function row(cls) { return E('div', 'row ' + (cls || '')); }
  function planter(ctx, crop, cls) {
    var b = E('button', 'planter oks-pop ' + (cls || ''), img(ctx, A + 'empty_planter.webp', 'box') + (crop ? img(ctx, crop.plant, 'plant') : '') + '<span class="tag">' + (crop ? crop.label : '') + '</span>');
    b.type = 'button'; b._crop = crop; return b;
  }
  /* 바구니: 담은 것이 바구니 안에 쌓여 보이고(앞 테두리가 살짝 가림), 몇 개인지 숫자와 빈칸으로 보여 줘요 */
  function basket(ctx, goal) {
    var b = E('div', 'dropzone basket', img(ctx, A + 'basket.webp', 'bk') + '<div class="basket-in"></div>' + img(ctx, A + 'basket_rim.webp', 'bkf') +
      '<div class="bk-count" aria-live="polite"><b>0</b><small>개</small></div>' + (goal ? '<div class="bk-slots">' + new Array(goal + 1).join('<i></i>') + '</div>' : ''));
    b._n = 0; return b;
  }
  function bkSync(bk) {
    var items = bk.querySelectorAll('.basket-in > *'), n = items.length;
    var c = bk.querySelector('.bk-count'); c.querySelector('b').textContent = n; c.classList.toggle('on', n > 0);
    if (n !== bk._n) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
    bk._n = n;
    var slots = bk.querySelectorAll('.bk-slots i');
    slots.forEach(function (sl, k) { var it = items[k]; sl.className = it ? 'got' : ''; sl.innerHTML = it ? (it.querySelector('img') ? it.querySelector('img').outerHTML : '') : ''; });
    bk.classList.toggle('full', slots.length > 0 && n === slots.length);
    bk.classList.toggle('over', slots.length > 0 && n > slots.length);
  }
  function bkAdd(bk, el) { el.classList.add('drop'); bk.querySelector('.basket-in').appendChild(el); bkSync(bk); return el; }
  function friend(ctx, f, orderHtml) {
    var w = E('div', 'customer', '<div class="bubble">' + orderHtml + '</div>' + img(ctx, f.img, 'who'));
    return w;
  }
  function orderHtml(ctx, items) { return items.map(function (o) { return '<span class="ord">' + img(ctx, o.crop.one) + (o.n ? '<b>' + o.n + '</b>' + EN._dots(o.n) : '') + '</span>'; }).join(''); }

  EN.farm = {
    rounds: [3, 5, 4, 4, 2],
    setup: function (ctx) { ctx.scene('farm'); },
    round: function (ctx, i) {
      ctx.clear(); ctx.scene('farm');
      return (ctx.cfg.mode === 'science' ? SCI : MATH)[ctx.level - 1](ctx, i);
    }
  };

  /* ---------------- 수학 ---------------- */
  var MATH = [
    /* 1 느끼기: 잘 익은 작물을 눌러 따기 (틀릴 수 없음) */
    function (ctx, i) {
      var crop = CROPS[i % CROPS.length];
      var ps = [0, 1, 2].map(function () { return planter(ctx, crop); });
      var bk = basket(ctx, ps.length);
      var field = row('field'); ps.forEach(function (p) { field.appendChild(p); });
      ctx.board.appendChild(field); var br = row('center'); br.appendChild(bk); ctx.board.appendChild(br);
      return ctx.ask('잘 익은 ' + crop.label + '를 눌러서 따요!').then(function () {
        return new Promise(function (res) {
          var n = 0; ctx.target({ get: function () { return ps.filter(function (p) { return !p._done; }); } });
          ps.forEach(function (p) {
            p.onclick = function () {
              if (p._done) return; p._done = true; n++; O.clearPrompt(); O.sfx('pop');
              p.querySelector('.plant').classList.add('picked');
              var tg = p.querySelector('.tag'); if (tg) { tg.textContent = '✓ 땄어요'; tg.classList.add('done'); }
              ctx.fly(p.querySelector('.plant'), bk, img(ctx, crop.one)).then(function () {
                bkAdd(bk, E('span', 'in-fruit', img(ctx, crop.one)));
                O.say(crop.label + ' ' + NUMW[n], { noRepeat: true });
                if (n === ps.length) { O.praise('바구니 가득!'); setTimeout(res, 1100); }
                else ctx.target({ get: function () { return ps.filter(function (x) { return !x._done; }); } });
              });
            };
          });
        });
      });
    },
    /* 2 고르기: 손님이 말한 작물 고르기 (2개 중) */
    function (ctx, i) {
      var two = O.pick(CROPS, 2), want = two[Math.floor(Math.random() * 2)], f = FRIENDS[i % FRIENDS.length];
      var cust = friend(ctx, f, orderHtml(ctx, [{ crop: want }]));
      var ps = two.map(function (c) { return planter(ctx, c); });
      var top = row('shop'); top.appendChild(cust); ctx.board.appendChild(top);
      var field = row('field'); ps.forEach(function (p) { field.appendChild(p); }); ctx.board.appendChild(field);
      return ctx.ask(f.label + ': "' + want.label + ' 주세요!"').then(function () {
        var right = ps.filter(function (p) { return p._crop === want; });
        ctx.target({ get: function () { return right; } });
        return ctx.tapWait(ps, function (p) { return p._crop === want; }).then(function (p) {
          O.sfx('pop'); return ctx.fly(p.querySelector('.plant'), cust.querySelector('.who'), img(ctx, want.one)).then(function () {
            ctx.good(p); O.sfx('coin'); O.say('고마워요! ' + want.label + ' 맛있겠다', { noRepeat: true }); return O.wait(1200);
          });
        });
      });
    },
    /* 3 해 보기: 주문한 수만큼 바구니에 옮기기 (1~5, 숫자+점) */
    function (ctx, i) {
      var crop = CROPS[i % CROPS.length], n = [2, 3, 1, 4, 5][i % 5], f = FRIENDS[(i + 1) % FRIENDS.length];
      var cust = friend(ctx, f, orderHtml(ctx, [{ crop: crop, n: n }]));
      var bk = basket(ctx, n);
      var pile = row('pile'); var fruits = []; for (var k = 0; k < 6; k++) { var fr = E('button', 'fruit oks-pop', img(ctx, crop.one)); fr.type = 'button'; fruits.push(fr); pile.appendChild(fr); }
      var send = E('button', 'oks-btn orange', '📦 배달하기'); send.type = 'button';
      var top = row('shop'); top.appendChild(cust); top.appendChild(bk); ctx.board.appendChild(top); ctx.board.appendChild(pile);
      var sr = row('center'); sr.appendChild(send); ctx.board.appendChild(sr);
      return ctx.ask(crop.label + ' ' + NUMW[n] + '! ' + n + '개를 바구니에 담아요').then(function () { return fillBasket(ctx, fruits, bk, send, [{ crop: crop, n: n }], cust); });
    },
    /* 4 혼자서: 두 가지 작물 주문 (힌트는 도와줘를 누를 때만) */
    function (ctx, i) {
      var two = O.pick(CROPS, 2), n1 = 1 + Math.floor(Math.random() * 3), n2 = 1 + Math.floor(Math.random() * 3), f = FRIENDS[i % FRIENDS.length];
      var order = [{ crop: two[0], n: n1 }, { crop: two[1], n: n2 }];
      var cust = friend(ctx, f, orderHtml(ctx, order));
      var bk = basket(ctx, n1 + n2);
      var pile = row('pile'); var fruits = [];
      O.shuffle([0, 0, 0, 0, 1, 1, 1, 1]).forEach(function (w) { var fr = E('button', 'fruit oks-pop', img(ctx, two[w].one)); fr.type = 'button'; fr._crop = two[w]; fruits.push(fr); pile.appendChild(fr); });
      var send = E('button', 'oks-btn orange', '📦 배달하기'); send.type = 'button';
      var top = row('shop'); top.appendChild(cust); top.appendChild(bk); ctx.board.appendChild(top); ctx.board.appendChild(pile);
      var sr = row('center'); sr.appendChild(send); ctx.board.appendChild(sr);
      return ctx.ask(two[0].label + ' ' + n1 + '개, ' + two[1].label + ' ' + n2 + '개 주세요!').then(function () { return fillBasket(ctx, fruits, bk, send, order, cust); });
    },
    /* 5 생활로: 심기 → 물 주기 → 수확 → 포장 → 배달 → 동전 하나씩 세기 */
    function (ctx, i) {
      var crop = CROPS[(i * 2) % CROPS.length], n = 2 + Math.floor(Math.random() * 3), f = FRIENDS[(i + 2) % FRIENDS.length];
      var steps = E('div', 'steps', ['🌱 심기', '💧 물 주기', '🧺 수확', '📦 포장', '🚚 배달', '🪙 세기'].map(function (s) { return '<span>' + s + '</span>'; }).join(''));
      ctx.board.appendChild(steps);
      function stepOn(k) { steps.querySelectorAll('span').forEach(function (s, j) { s.classList.toggle('now', j === k); s.classList.toggle('done', j < k); }); }
      var cust = friend(ctx, f, orderHtml(ctx, [{ crop: crop, n: n }]));
      var pot = E('div', 'dropzone planter big', img(ctx, A + 'empty_planter.webp', 'box') + '<img class="plant" alt="" style="display:none">');
      var seed = E('button', 'oks-card tool small', '<div class="pic">' + img(ctx, A + 'parcel_seed.webp') + '</div><div class="lab">씨앗</div>'); seed.type = 'button';
      var can = E('button', 'oks-card tool small', '<div class="pic">' + img(ctx, A + 'watering_can.webp') + '</div><div class="lab">물뿌리개</div>'); can.type = 'button';
      var top = row('shop'); top.appendChild(cust); ctx.board.appendChild(top);
      var mid = row('field'); mid.appendChild(seed); mid.appendChild(pot); mid.appendChild(can); top.appendChild(mid);
      var plantImg = pot.querySelector('.plant');
      stepOn(0);
      return ctx.ask(f.label + '가 ' + crop.label + ' ' + n + '개를 주문했어요. 먼저 씨앗을 심어요').then(function () {
        ctx.target({ get: function () { return seed; }, to: function () { return pot; } });
        return ctx.dnd([seed, can], [pot], function (it) { return it === seed; }, function () { plantImg.src = ctx.img(A + 'sprout.webp'); plantImg.style.display = ''; plantImg.className = 'plant small'; seed.classList.add('dim'); O.say('씨앗을 심었어요', { noRepeat: true }); }, function () { return true; });
      }).then(function () {
        stepOn(1); ctx.ask('물을 주어요'); can._done = false;
        ctx.target({ get: function () { return can; }, to: function () { return pot; } });
        return ctx.dnd([can], [pot], function () { return true; }, function () { O.sfx('water'); }, function () { return true; });
      }).then(function () {
        plantImg.src = ctx.img(A + 'young_plant.webp'); O.say('쑥쑥 자라요', { noRepeat: true });
        return O.wait(900).then(function () { plantImg.src = ctx.img(crop.plant); plantImg.className = 'plant'; O.sfx('ok'); return O.wait(500); });
      }).then(function () {
        stepOn(2); mid.innerHTML = ''; var bk = basket(ctx, n);
        var pile = row('pile'); var fruits = []; for (var k = 0; k < 6; k++) { var fr = E('button', 'fruit oks-pop', img(ctx, crop.one)); fr.type = 'button'; fruits.push(fr); pile.appendChild(fr); }
        var send = E('button', 'oks-btn orange', '다 담았어요'); send.type = 'button';
        top.appendChild(bk); mid.appendChild(pile); var sr = row('center'); sr.appendChild(send); ctx.board.appendChild(sr);
        ctx.ask(crop.label + ' ' + n + '개를 따서 바구니에 담아요');
        return fillBasket(ctx, fruits, bk, send, [{ crop: crop, n: n }], null, true).then(function () { sr.remove(); return bk; });
      }).then(function (bk) {
        stepOn(3); mid.innerHTML = '';
        var box = E('div', 'dropzone parcel-zone', img(ctx, A + 'parcel.webp')); mid.appendChild(box);
        var bkBtn = E('button', 'oks-card tool small', '<div class="pic">' + img(ctx, A + 'basket.webp') + '</div><div class="lab">바구니</div>'); bkBtn.type = 'button'; mid.insertBefore(bkBtn, box); bk.remove();
        ctx.ask('바구니를 상자에 넣어 포장해요');
        ctx.target({ get: function () { return bkBtn; }, to: function () { return box; } });
        return ctx.dnd([bkBtn], [box], function () { return true; }, function () { bkBtn.classList.add('dim'); box.classList.add('packed'); O.sfx('pop'); }, function () { return true; }).then(function () { return box; });
      }).then(function (box) {
        stepOn(4); ctx.ask('상자를 ' + f.label + '에게 배달해요');
        var boxBtn = E('button', 'oks-card tool small', '<div class="pic">' + img(ctx, A + 'parcel.webp') + '</div><div class="lab">상자</div>'); boxBtn.type = 'button'; box.replaceWith(boxBtn);
        cust.classList.add('dropzone');
        ctx.target({ get: function () { return boxBtn; }, to: function () { return cust; } });
        return ctx.dnd([boxBtn], [cust], function () { return true; }, function () { boxBtn.classList.add('dim'); O.sfx('coin'); O.say('고마워요! 동전 ' + n + '개를 줄게요', { noRepeat: true }); }, function () { return true; });
      }).then(function () {
        stepOn(5); mid.innerHTML = '';
        var coins = []; for (var k = 0; k < n; k++) { var c = E('button', 'coin oks-pop', img(ctx, A + 'coin.webp')); c.type = 'button'; coins.push(c); mid.appendChild(c); }
        var cnt = 0;
        return ctx.ask('동전을 하나씩 눌러 세어요').then(function () {
          return new Promise(function (res) {
            ctx.target({ get: function () { return coins.filter(function (c) { return !c._done; })[0]; } });
            coins.forEach(function (c) { c.onclick = function () { if (c._done) return; c._done = true; cnt++; c.classList.add('counted'); c.setAttribute('data-n', cnt); O.sfx('coin'); O.say(NUMW[cnt], { noRepeat: true }); O.clearPrompt();
              if (cnt === n) { stepOn(6); setTimeout(function () { O.say('동전 ' + NUMW[n] + ' 개! 농장 일을 모두 해냈어요', { noRepeat: true }); O.praise('농장 사장님!'); setTimeout(res, 1600); }, 600); }
              else ctx.target({ get: function () { return coins.filter(function (x) { return !x._done; })[0]; } }); }; });
          });
        });
      });
    }
  ];
  /* 바구니에 딱 맞게 담기 (한 개씩 옮기면 한 개씩 세어 줌. 바구니 속 것을 누르면 다시 꺼냄) */
  function fillBasket(ctx, fruits, bk, send, order, cust, noDeliver) {
    return new Promise(function (res) {
      var inB = [];
      var total = order.reduce(function (s, o) { return s + o.n; }, 0);
      function countOf(crop) { return inB.filter(function (f) { return !crop || f._crop === crop || (!f._crop && order.length === 1); }).length; }
      function need() { for (var k = 0; k < order.length; k++) { var o = order[k]; var have = order.length === 1 ? inB.length : countOf(o.crop); if (have < o.n) return o; } return null; }
      function tgt() {
        var o = need();
        if (o) ctx.target({ get: function () { return fruits.filter(function (f) { return !f._done && (!f._crop || f._crop === o.crop); })[0]; }, to: function () { return bk; } });
        else ctx.target({ get: function () { return send; } });
      }
      tgt();
      ctx.dnd(fruits, [bk], function () { return true; }, function (f) {
        inB.push(f); f.style.visibility = 'hidden';
        var m = E('button', 'in-fruit', f.innerHTML); m.type = 'button'; m.title = '다시 꺼내기'; bkAdd(bk, m);
        var cnt = order.length === 1 ? inB.length : countOf(f._crop);
        O.say(NUMW[cnt] || String(cnt), { noRepeat: true });
        m.onclick = function (e) { e.stopPropagation(); m.remove(); bkSync(bk); f.style.visibility = ''; f._done = false; inB.splice(inB.indexOf(f), 1); O.sfx('tick'); tgt(); };
        tgt();
      }, function () { return false; });
      send.onclick = function () {
        var ok = order.every(function (o) { return (order.length === 1 ? inB.length : countOf(o.crop)) === o.n; }) && inB.length === total;
        if (ok) {
          send.onclick = null; O.clearPrompt();
          if (noDeliver) { ctx.good(send, '딱 맞아요!'); setTimeout(res, 900); return; }
          ctx.fly(bk, cust.querySelector('.who')).then(function () { ctx.good(send, '배달 완료!'); O.sfx('coin'); O.say('주문한 만큼 딱 맞게 담았어요', { noRepeat: true }); setTimeout(res, 1300); });
        } else {
          ctx.bad(send);
          var o = order.filter(function (x) { return (order.length === 1 ? inB.length : countOf(x.crop)) !== x.n; })[0] || order[0];
          var have = order.length === 1 ? inB.length : countOf(o.crop);
          O.say(have < o.n ? o.crop.label + '를 조금 더 담아요' : o.crop.label + '가 너무 많아요. 하나 꺼내 볼까요?', { noRepeat: true });
        }
      };
    });
  }

  /* ---------------- 과학 ---------------- */
  var SCI = [
    /* 1 느끼기: 화분을 누를 때마다 자라는 모습 보기 */
    function (ctx, i) {
      var crop = CROPS[i % CROPS.length];
      var stages = STAGES.slice(0, 3).concat([{ label: crop.label, img: crop.plant, say: crop.label + ' 열매가 열렸어요' }]);
      var pot = E('button', 'planter big grow', '<img class="plant" src="' + ctx.img(A + 'soil_pot.webp') + '" alt=""><span class="tag">눌러 보세요</span>'); pot.type = 'button';
      var can = E('div', 'can-deco', img(ctx, A + 'watering_can.webp'));
      var f = row('field'); f.appendChild(can); f.appendChild(pot); ctx.board.appendChild(f);
      var strip = row('growth'); ctx.board.appendChild(strip);
      return ctx.ask('화분을 눌러 물을 주어요. 어떻게 자라는지 봐요!').then(function () {
        return new Promise(function (res) {
          var k = 0; ctx.target({ get: function () { return pot; } });
          strip.insertAdjacentHTML('beforeend', '<span class="g on">' + img(ctx, stages[0].img) + '<b>' + stages[0].label + '</b></span>');
          pot.onclick = function () {
            if (k >= stages.length - 1) return; k++; O.clearPrompt(); O.sfx('water'); can.classList.add('pour'); setTimeout(function () { can.classList.remove('pour'); }, 600);
            var pl = pot.querySelector('.plant'); pl.classList.add('grow-anim'); pl.src = ctx.img(stages[k].img); setTimeout(function () { pl.classList.remove('grow-anim'); }, 600);
            pot.querySelector('.tag').textContent = stages[k].label; O.say(stages[k].say, { noRepeat: true });
            strip.insertAdjacentHTML('beforeend', '<span class="arr">➜</span><span class="g on">' + img(ctx, stages[k].img) + '<b>' + stages[k].label + '</b></span>');
            if (k === stages.length - 1) { O.praise('다 자랐어요!'); setTimeout(res, 1500); } else ctx.target({ get: function () { return pot; } });
          };
        });
      });
    },
    /* 2 고르기: 자라는 단계 이름 듣고 고르기 */
    function (ctx, i) {
      var tgt = STAGES[i % STAGES.length], other = O.pick(STAGES.filter(function (s) { return s !== tgt; }), 1)[0];
      var cards = O.shuffle([tgt, other]).map(function (s) { return ctx.card(s, { big: true }); });
      ctx.board.appendChild(ctx.grid(cards));
      return ctx.ask(tgt.label + '은(는) 어느 것일까요?').then(function () {
        var r = cards.filter(function (c) { return c._item === tgt; });
        ctx.target({ get: function () { return r; } });
        return ctx.tapWait(cards, function (c) { return c._item === tgt; }).then(function (c) { ctx.good(c); O.say(tgt.say, { noRepeat: true }); return O.wait(1100); });
      });
    },
    null, null,
    /* 5 생활로: 식물이 보내는 신호를 보고 알맞은 돌봄 고르기 */
    function (ctx, i) {
      var CASES = [
        { q: '잎이 축 처졌어요. 흙이 말랐어요. 무엇이 필요할까요?', cls: 'wilt', ok: 'water', fix: '물을 주었더니 잎이 다시 섰어요' },
        { q: '어두운 곳에서 잎이 노랗게 변했어요. 무엇이 필요할까요?', cls: 'dark', ok: 'sun', fix: '햇빛을 받아 초록색이 되었어요' },
        { q: '열매가 빨갛게 익었어요. 이제 무엇을 할까요?', cls: 'ripe', ok: 'basket', fix: '맛있게 수확했어요' },
        { q: '화분에 흙만 있어요. 무엇부터 할까요?', cls: 'empty', ok: 'seed', fix: '씨앗을 심었어요' }
      ];
      var TOOLS = { water: { label: '물 주기', img: A + 'watering_can.webp' }, sun: { label: '햇빛 쬐기', emo: '☀️' }, basket: { label: '수확하기', img: A + 'basket.webp' }, seed: { label: '씨앗 심기', img: A + 'parcel_seed.webp' } };
      var cs = CASES[(i * 3 + Math.floor(Math.random() * 2)) % CASES.length];
      var plantSrc = cs.cls === 'ripe' ? A + 'tomato_plant.webp' : cs.cls === 'empty' ? A + 'soil_pot.webp' : A + 'young_plant.webp';
      var pot = E('div', 'planter big ' + cs.cls, '<img class="plant" src="' + ctx.img(plantSrc) + '" alt="">');
      var f = row('field'); f.appendChild(pot); ctx.board.appendChild(f);
      var tools = Object.keys(TOOLS).map(function (k) { var c = ctx.card(TOOLS[k], { cls: 'small' }); c._k = k; return c; });
      ctx.board.appendChild(ctx.grid(tools));
      return ctx.ask(cs.q).then(function () {
        ctx.target({ get: function () { return tools.filter(function (c) { return c._k === cs.ok; }); } });
        return ctx.tapWait(tools, function (c) { return c._k === cs.ok; }).then(function (c) {
          ctx.good(c); pot.classList.remove(cs.cls); if (cs.ok === 'seed') pot.querySelector('.plant').src = ctx.img(A + 'sprout_pot.webp');
          if (cs.ok === 'basket') pot.querySelector('.plant').src = ctx.img(A + 'young_plant.webp');
          O.say(cs.fix, { noRepeat: true }); return O.wait(1500);
        });
      });
    }
  ];
})();
