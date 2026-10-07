/* 영어 기초층 게임 엔진(abc) — 알파벳 → 낱말 → 문장
   워드 마스터(한글 마스터)의 흐름을 영어로 옮겼어요: 글자 놀이 → 따라 쓰기 → 낱말 쓰기 → 낱말 만들기 → 문장.
   cfg.kind: 'letters' (mode: find · trace · memory · phonics · write) | 'words' | 'sentences'
   모든 영어 소리는 영어 목소리(en-US)로 읽어요. */
(function () {
  'use strict';
  var O = window.OKS, E = O.el;
  var EN = window.OKS_ENGINES = window.OKS_ENGINES || {};
  var UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  /* 글자 이름을 또렷하게 읽도록 소리 나는 대로 */
  var NAME = { A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'ef', G: 'jee', H: 'aitch', I: 'eye', J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'ar', S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee' };
  function sayEn(t, o) { return O.say(t, Object.assign({ lang: 'en-US', noRepeat: true, rate: 0.85 }, o || {})); }
  function sayLetter(ch) { return sayEn(NAME[ch.toUpperCase()] || ch); }
  function css() {
    if (document.getElementById('en-css')) return;
    var s = document.createElement('style'); s.id = 'en-css';
    s.textContent = [
      '.en-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;}',
      '.en-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center;}',
      '.en-tile{min-width:84px;height:96px;padding:0 14px;border-radius:22px;border:0;background:#fff;box-shadow:0 6px 0 #c9d6f2,0 10px 18px rgba(40,60,120,.15);font:inherit;font-family:"Arial Rounded MT Bold","Nunito",Arial,sans-serif;font-size:58px;font-weight:700;color:#2c3e8f;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:transform .12s;}',
      '.en-tile:active{transform:translateY(3px);box-shadow:0 3px 0 #c9d6f2;}',
      '.en-tile.big{min-width:150px;height:170px;font-size:110px;}',
      '.en-tile.small{min-width:60px;height:70px;font-size:40px;border-radius:16px;}',
      '.en-tile.good{background:#e3f8e6;color:#1f8a3a;box-shadow:0 6px 0 #9fdcaa;}',
      '.en-tile.used{visibility:hidden;}',
      '.en-big{font-family:"Arial Rounded MT Bold","Nunito",Arial,sans-serif;font-weight:700;color:#2c3e8f;font-size:clamp(64px,12vw,130px);line-height:1;}',
      '.en-word{font-family:"Arial Rounded MT Bold","Nunito",Arial,sans-serif;font-weight:700;color:#2c3e8f;font-size:clamp(30px,5vw,52px);letter-spacing:.04em;}',
      '.en-hear{border:0;border-radius:999px;background:#ffd76a;color:#5a3c00;font:inherit;font-size:22px;padding:10px 22px;box-shadow:0 5px 0 #e0a92e;cursor:pointer;}',
      '.en-hear.big{font-size:44px;padding:22px 40px;}',
      '.en-pic{width:clamp(120px,22vw,190px);height:clamp(120px,22vw,190px);border-radius:28px;background:#fff;box-shadow:0 8px 20px rgba(40,60,120,.15);display:flex;align-items:center;justify-content:center;overflow:hidden;}',
      '.en-pic img{width:84%;height:84%;object-fit:contain;} .en-pic .emo{font-size:96px;} .en-pic .swatch{width:72%;height:72%;border-radius:22px;display:block;}',
      /* 따라 쓰기 판 (워드 마스터처럼 연두 판) */
      '.en-padbox{background:#eef9e8;border-radius:28px;padding:14px;box-shadow:inset 0 0 0 4px #cdebbf;display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.en-pad{position:relative;background:#fff;border-radius:18px;box-shadow:0 4px 12px rgba(40,90,40,.12);touch-action:none;}',
      '.en-pad canvas{position:absolute;left:0;top:0;}',
      '.en-tools{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}',
      '.en-tools button{border:0;border-radius:999px;font:inherit;font-size:20px;padding:10px 20px;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.15);}',
      '.en-tools .ok{background:#3fb05a;color:#fff;} .en-tools .er{background:#fff;color:#5a5a5a;} .en-tools .hr{background:#ffd76a;color:#5a3c00;}',
      /* 낱말 만들기 칸 */
      '.en-slots{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}',
      '.en-slot{width:62px;height:76px;border-radius:16px;border:3px dashed #b9c6ea;background:#f7f9ff;display:flex;align-items:center;justify-content:center;font-family:"Arial Rounded MT Bold","Nunito",Arial,sans-serif;font-weight:700;font-size:44px;color:#c8d0e6;}',
      '.en-slot.fill{border-style:solid;border-color:#7d93d8;background:#fff;color:#2c3e8f;animation:oks-pop .25s;}',
      /* 카드 뒤집기 */
      '.en-mem{display:grid;gap:12px;justify-content:center;}',
      '.en-card{width:clamp(78px,13vw,120px);height:clamp(96px,16vw,148px);perspective:600px;border:0;background:none;padding:0;cursor:pointer;}',
      '.en-card .in{position:relative;width:100%;height:100%;transition:transform .35s;transform-style:preserve-3d;}',
      '.en-card.open .in{transform:rotateY(180deg);}',
      '.en-card .f,.en-card .b{position:absolute;inset:0;border-radius:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;align-items:center;justify-content:center;}',
      '.en-card .f{background:linear-gradient(135deg,#8fa6ff,#b48cff);box-shadow:0 6px 0 #6d7fd6;color:#fff;font-size:40px;}',
      '.en-card .b{transform:rotateY(180deg);background:#fff;box-shadow:0 6px 0 #c9d6f2;font-family:"Arial Rounded MT Bold","Nunito",Arial,sans-serif;font-weight:700;color:#2c3e8f;font-size:clamp(40px,7vw,64px);overflow:hidden;}',
      '.en-card .b img{width:80%;height:80%;object-fit:contain;} .en-card .b .emo{font-size:52px;} .en-card .b .swatch{width:70%;height:70%;border-radius:14px;display:block;} .en-card .b.wd{font-size:clamp(18px,3vw,26px);padding:4px;text-align:center;}',
      '.en-card.done .b{background:#e3f8e6;box-shadow:0 6px 0 #9fdcaa;}',
      /* 문장 */
      '.en-sent.q{background:#eef3ff;color:#3b4f9e}.en-sent{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;min-height:70px;padding:10px 16px;border-radius:22px;background:#fff;box-shadow:0 6px 16px rgba(40,60,120,.12);font-family:"Arial Rounded MT Bold","Nunito",Arial,sans-serif;font-weight:700;color:#2c3e8f;font-size:clamp(26px,4.4vw,44px);}',
      '.en-gap{min-width:120px;height:58px;border-bottom:5px dashed #9fb0e6;display:inline-flex;align-items:center;justify-content:center;color:#2c3e8f;}',
      '.en-gap.fill{border-bottom-style:solid;border-color:#3fb05a;animation:oks-pop .25s;}',
      '.en-gap.box{min-width:66px;height:56px;padding:0 10px;border:3px dashed #b9c6ea;border-radius:14px;background:#f7f9ff;} .en-gap.box.fill{border-style:solid;border-color:#3fb05a;background:#fff;}',
      '.en-blk{border:0;border-radius:16px;background:#fff8e1;box-shadow:0 5px 0 #f0c35a;font:inherit;font-family:"Arial Rounded MT Bold","Nunito",Arial,sans-serif;font-weight:700;color:#5a3c00;font-size:clamp(24px,4vw,38px);padding:8px 18px;cursor:pointer;}',
      '.en-blk.used{visibility:hidden;}',
      '.en-say{font-size:18px;color:#6b6b8a;}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function pic(ctx, it) { return '<div class="en-pic">' + ctx.pic(it) + '</div>'; }
  function hearBtn(label, fn, big) { var b = E('button', 'en-hear' + (big ? ' big' : ''), label || '🔊 다시 듣기'); b.type = 'button'; b.onclick = function () { O.unlock && O.unlock(); fn(); }; return b; }
  function nth(arr, i, key) { return EN._nth ? EN._nth(arr, i) : arr[i % arr.length]; }
  function hintTo(ctx, el) { if (ctx.level <= 3) ctx.target({ get: function () { return el; } }); }

  /* ================= 따라 쓰기 판 ================= */
  var FONT = '"Arial Rounded MT Bold","Nunito","Helvetica Neue",Arial,sans-serif';
  function TracePad(ctx, text, o) {
    o = o || {};
    var lv = ctx.level, single = text.length === 1;
    var maxW = Math.min((ctx.board.clientWidth || innerWidth) - 40, single ? 380 : 760), W = Math.max(240, maxW);
    var H = Math.round(Math.min(single ? W * .85 : 250, innerHeight * .42));
    var box = E('div', 'en-padbox'), pad = E('div', 'en-pad'); pad.style.width = W + 'px'; pad.style.height = H + 'px';
    var cg = E('canvas'), ci = E('canvas'); pad.appendChild(cg); pad.appendChild(ci); box.appendChild(pad);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    [cg, ci].forEach(function (c) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
    /* 글자 크기: 대문자 높이가 판의 절반쯤, 낱말이면 너비에 맞춤 */
    var g = cg.getContext('2d'), fs = H * .62;
    function setF(c, f) { c.font = '700 ' + f + 'px ' + FONT; }
    setF(g, fs); var tw = g.measureText(text).width; if (tw > W * .88) fs = fs * W * .88 / tw;
    setF(g, fs);
    var mH = g.measureText('H'), capH = mH.actualBoundingBoxAscent || fs * .72, xH = g.measureText('x').actualBoundingBoxAscent || fs * .52;
    var base = H * .5 + capH * .5 + (/[gjpqy]/.test(text) ? -capH * .08 : 0);
    var tx = W / 2;
    pad.dataset.t = text; pad.dataset.fs = fs; pad.dataset.base = base; pad.dataset.tx = tx;   /* 자동 시험용 */
    function guideLines(c) {
      c.save(); c.lineWidth = 2;
      c.strokeStyle = '#f2b8b8'; c.setLineDash([]); line(c, base - capH);        /* 윗줄 */
      c.strokeStyle = '#b9c6ea'; c.setLineDash([8, 8]); line(c, base - xH);      /* 가운데 점선 */
      c.strokeStyle = '#f2b8b8'; c.setLineDash([]); line(c, base);               /* 밑줄 */
      c.strokeStyle = '#e5e5e5'; line(c, base + capH * .38);                     /* 아랫줄 */
      c.restore();
    }
    function line(c, y) { c.beginPath(); c.moveTo(10, y); c.lineTo(W - 10, y); c.stroke(); }
    var alpha = o.alpha != null ? o.alpha : [.55, .5, .42, .22, .12][lv - 1];
    function drawGuide(a) {
      g.clearRect(0, 0, W, H); guideLines(g);
      if (a > 0) { g.save(); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; setF(g, fs); g.fillStyle = 'rgba(120,130,210,' + a + ')'; g.fillText(text, tx, base);
        g.setLineDash([6, 6]); g.lineWidth = 2; g.strokeStyle = 'rgba(90,100,190,' + Math.min(1, a + .25) + ')'; g.strokeText(text, tx, base); g.restore(); }
    }
    drawGuide(alpha);
    /* 손가락·펜으로 쓰기 */
    var ink = ci.getContext('2d'), lw = Math.max(9, capH * .15), strokes = [], cur = null;
    ink.lineCap = 'round'; ink.lineJoin = 'round'; ink.strokeStyle = '#3b6cf6'; ink.lineWidth = lw;
    function pt(e) { var r = ci.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
    ci.addEventListener('pointerdown', function (e) { e.preventDefault(); O.unlock && O.unlock(); try { ci.setPointerCapture(e.pointerId); } catch (x) {} cur = [pt(e)]; strokes.push(cur); ink.beginPath(); ink.moveTo(cur[0][0], cur[0][1]); ink.lineTo(cur[0][0] + .1, cur[0][1]); ink.stroke(); });
    ci.addEventListener('pointermove', function (e) { if (!cur) return; var p = pt(e), q = cur[cur.length - 1]; cur.push(p); ink.beginPath(); ink.moveTo(q[0], q[1]); ink.lineTo(p[0], p[1]); ink.stroke(); });
    function up() { cur = null; }
    ci.addEventListener('pointerup', up); ci.addEventListener('pointercancel', up); ci.addEventListener('pointerleave', up);
    function clear() { strokes = []; ink.clearRect(0, 0, W, H); }
    /* 판정: 안내 글자를 얼마나 덮었는지(덮기) + 쓴 선이 글자 근처에 있는지(정확도) */
    function score() {
      var S = 160, k = S / W, h = Math.round(H * k);
      function mk() { var c = document.createElement('canvas'); c.width = S; c.height = h; var x = c.getContext('2d'); x.scale(k, k); return [c, x]; }
      var gm = mk(), gd = mk(), sm = mk(), sd = mk();
      [gm, gd].forEach(function (m, j) { var x = m[1]; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; setF(x, fs); x.fillStyle = '#000'; x.fillText(text, tx, base); if (j) { x.lineWidth = capH * .09; x.strokeStyle = '#000'; x.lineJoin = 'round'; x.strokeText(text, tx, base); } });
      [sm, sd].forEach(function (m, j) { var x = m[1]; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#000'; x.lineWidth = j ? lw * 1.9 : lw;
        strokes.forEach(function (s) { x.beginPath(); x.moveTo(s[0][0], s[0][1]); s.forEach(function (p) { x.lineTo(p[0], p[1]); }); if (s.length === 1) x.lineTo(s[0][0] + .1, s[0][1]); x.stroke(); }); });
      function px(m) { return m[1].getImageData(0, 0, S, h).data; }
      var G = px(gm), D = px(gd), Sr = px(sm), SD = px(sd), nG = 0, cov = 0, nS = 0, inS = 0;
      for (var i = 3; i < G.length; i += 4) {
        if (G[i] > 100) { nG++; if (SD[i] > 60) cov++; }
        if (Sr[i] > 100) { nS++; if (D[i] > 60) inS++; }
      }
      return { cover: nG ? cov / nG : 0, prec: nS ? inS / nS : 0, ink: nS };
    }
    var tools = E('div', 'en-tools');
    var hr = E('button', 'hr', '🔊 듣기'); hr.type = 'button'; hr.onclick = function () { O.unlock && O.unlock(); (o.hear || function () {})(); };
    var er = E('button', 'er', '🧽 지우기'); er.type = 'button'; er.onclick = function () { clear(); O.sfx('tick'); };
    var ok = E('button', 'ok', '✅ 다 썼어요'); ok.type = 'button';
    if (o.hear) tools.appendChild(hr); tools.appendChild(er); tools.appendChild(ok); box.appendChild(tools);
    return {
      el: box, ok: ok, clear: clear, drawGuide: drawGuide, strokes: function () { return strokes; },
      check: function () {
        var s = score(), lvI = lv - 1;
        var needC = [.4, .5, .6, .65, .68][lvI] * (text.length > 3 ? .92 : 1), needP = [.52, .6, .66, .7, .72][lvI];
        return { pass: s.ink > 0 && s.cover >= needC && s.prec >= needP, empty: s.ink === 0, s: s };
      },
      /* 안내 없이 쓴 글자 알아보기: 쓴 모양을 글자 모양과 견줘 가장 비슷한 글자 순서대로 */
      recognize: function (cands) {
        if (!strokes.length) return [];
        var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
        strokes.forEach(function (s) { s.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }); });
        var N = 48;
        function norm(drawFn, bw, bh, lineW) {
          var c = document.createElement('canvas'); c.width = N; c.height = N; var x = c.getContext('2d');
          var sc = (N - 8) / Math.max(bw, bh, 1); x.translate(N / 2, N / 2); x.scale(sc, sc); drawFn(x, lineW / sc);
          return x.getImageData(0, 0, N, N).data;
        }
        var bw = maxx - minx, bh = maxy - miny;
        var U = norm(function (x, l) { x.translate(-(minx + bw / 2), -(miny + bh / 2)); x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = Math.max(l, lw * 1.6); x.strokeStyle = '#000';
          strokes.forEach(function (s) { x.beginPath(); x.moveTo(s[0][0], s[0][1]); s.forEach(function (p) { x.lineTo(p[0], p[1]); }); if (s.length === 1) x.lineTo(s[0][0] + .1, s[0][1]); x.stroke(); }); }, bw, bh, 5);
        /* 소문자: 4줄 칸의 높이를 그대로 써서 견줘요 (c·e·s 처럼 둥근 글자 구별)
           정확도(쓴 선이 글자 근처) × 덮기(글자를 쓴 선이 덮음)의 조화 평균 + 크기 맞춘 모양 점수를 함께 */
        var lowFrame = null;
        if (cands[0] && cands[0] !== cands[0].toUpperCase()) {
          var S2 = 90, k2 = S2 / H, w2 = Math.round(W * k2), cxD = (minx + maxx) / 2;
          var msk = function (fn) { var c = document.createElement('canvas'); c.width = w2; c.height = S2; var x = c.getContext('2d'); x.scale(k2, k2); fn(x); return x.getImageData(0, 0, w2, S2).data; };
          var drawU = function (wd) { return msk(function (x) { x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = wd; x.strokeStyle = '#000';
            strokes.forEach(function (s) { x.beginPath(); x.moveTo(s[0][0], s[0][1]); s.forEach(function (p) { x.lineTo(p[0], p[1]); }); if (s.length === 1) x.lineTo(s[0][0] + .1, s[0][1]); x.stroke(); }); }); };
          var Ur = drawU(lw), Udl = drawU(lw * 3.2);
          lowFrame = {};
          cands.forEach(function (ch) {
            var gl = function (wd) { return msk(function (x) { setF(x, fs); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#000'; x.fillText(ch, cxD, base); if (wd) { x.lineWidth = wd; x.strokeStyle = '#000'; x.lineJoin = 'round'; x.strokeText(ch, cxD, base); } }); };
            var Gr = gl(0), Gdl = gl(lw * 1.6), nU = 0, pU = 0, nG = 0, rG = 0;
            for (var i = 3; i < Ur.length; i += 4) { if (Ur[i] > 80) { nU++; if (Gdl[i] > 80) pU++; } if (Gr[i] > 80) { nG++; if (Udl[i] > 80) rG++; } }
            var P = nU ? pU / nU : 0, R = nG ? rG / nG : 0; lowFrame[ch] = P + R ? 2 * P * R / (P + R) : 0;
          });
        }
        var out = cands.map(function (ch) {
          var t = document.createElement('canvas').getContext('2d'); setF(t, 100); var m = t.measureText(ch);
          var l = m.actualBoundingBoxLeft || 0, r = m.actualBoundingBoxRight || m.width, a = m.actualBoundingBoxAscent || 72, d = m.actualBoundingBoxDescent || 0;
          var cw = l + r, chh = a + d;
          var Gd = norm(function (x, lW) { x.translate(-((r - l) / 2), -((d - a) / 2)); setF(x, 100); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = '#000'; x.fillText(ch, 0, 0); x.lineWidth = lW * 1.4; x.strokeStyle = '#000'; x.lineJoin = 'round'; x.strokeText(ch, 0, 0); }, cw, chh, 5);
          var inter = 0, uni = 0;
          for (var i = 3; i < U.length; i += 4) { var p = U[i] > 80, q = Gd[i] > 80; if (p && q) inter++; if (p || q) uni++; }
          /* 가로세로 비율이 많이 다르면 감점 (I 와 O 구별) */
          var ar = Math.log(((bw + 1) / (bh + 1)) / (cw / chh)); var pen = Math.min(.35, Math.abs(ar) * .18);
          var sc0 = (uni ? inter / uni : 0) - pen;
          return { ch: ch, s: lowFrame ? sc0 * .4 + lowFrame[ch] * .6 : sc0 };
        });
        return out.sort(function (a, b) { return b.s - a.s; });
      }
    };
  }
  /* 쓰기 한 판: 맞을 때까지 (어린 수준은 두 번 해 보면 칭찬하고 넘어가요) */
  function traceRound(ctx, text, o) {
    o = o || {};
    var pad = TracePad(ctx, text, o);
    ctx.board.appendChild(pad.el);
    var tries = 0;
    return new Promise(function (res) {
      pad.ok.onclick = function () {
        O.unlock && O.unlock();
        var r = pad.check(); tries++;
        if (r.empty) { O.say('손가락으로 글자를 따라 써 봐요.', { noRepeat: true }); return; }
        if (r.pass || (ctx.level <= 2 && tries >= 2) || tries >= 4) {
          ctx.good(pad.el, false); O.praise(); setTimeout(function () { (o.after ? o.after() : Promise.resolve()).then(res); }, 300); pad.ok.onclick = null; return;
        }
        ctx.bad(pad.ok);
        if (tries >= 2) pad.drawGuide(.5);
        O.say(r.s.cover < .4 ? '글자 모양을 따라 조금 더 써 봐요.' : '선이 글자 밖으로 나갔어요. 지우고 다시 써 봐요.', { noRepeat: true });
      };
    });
  }

  /* ================= 알파벳 ================= */
  function letterCase(ctx, ch) { var c = ctx.cfg; if (c.caseMode === 'lower') return ch.toLowerCase(); if (c.caseMode === 'mixed') return Math.random() < .5 ? ch : ch.toLowerCase(); return ch; }
  function letterPool(ctx) { return ctx.cfg.letters || UP; }
  /* 차례대로 A→Z 를 이어서 연습 (다음에 오면 이어서) */
  function seqLetter(ctx, i) {
    var key = 'oks_en_seq_' + ctx.id;
    if (ctx._seq0 == null) { ctx._seq0 = (O.jget(key, 0) || 0) % 26; }
    var k = (ctx._seq0 + i) % 26; O.jset(key, k + 1); return UP[k];
  }
  var LETTER = {
    find: function (ctx, i) {
      var lv = ctx.level, pool = letterPool(ctx), t = nth(pool, i);
      var show = lv >= 5 ? t.toLowerCase() : lv === 4 ? letterCase({ cfg: { caseMode: 'mixed' } }, t) : t;
      var n = [1, 2, 3, 4, 4][lv - 1];
      var others = O.shuffle(pool.filter(function (x) { return x !== t; })).slice(0, n - 1);
      var tiles = O.shuffle([t].concat(others)).map(function (ch) {
        var s = ch === t ? show : (lv >= 5 ? ch.toLowerCase() : lv === 4 ? letterCase({ cfg: { caseMode: 'mixed' } }, ch) : ch);
        var b = E('button', 'en-tile' + (n === 1 ? ' big' : ''), s); b.type = 'button'; b._ch = ch; return b;
      });
      var wrap = E('div', 'en-wrap'), row = E('div', 'en-row'); tiles.forEach(function (b) { row.appendChild(b); });
      wrap.appendChild(row); wrap.appendChild(hearBtn('🔊 다시 듣기', function () { sayLetter(t); })); ctx.board.appendChild(wrap);
      ctx.ask(lv === 1 ? '알파벳을 눌러 이름을 들어 봐요' : '잘 듣고 알맞은 알파벳을 골라요', { html: (lv === 1 ? '알파벳을 눌러 들어 봐요' : '잘 듣고 골라요') + ' <b class="en">🔊</b>', replay: function () { return sayLetter(t); } });
      var right = tiles.filter(function (b) { return b._ch === t; })[0]; hintTo(ctx, right);
      return ctx.tapWait(tiles, function (b) { return b._ch === t; }).then(function (b) { ctx.good(b, false); return sayLetter(t).then(function () { O.praise(); return O.wait(300); }); });
    },
    order: function (ctx, i) {
      var lv = ctx.level, low = lv >= 5, F = function (c) { return low ? c.toLowerCase() : c; };
      var kind = lv === 5 ? (i % 2 ? 'tap' : 'miss') : ['tap', 'tap', 'miss', 'tap', 'miss'][lv - 1];
      var len = kind === 'tap' ? [3, 4, 5, 5, 6][lv - 1] : 5;
      var st = Math.floor(Math.random() * (26 - len + 1)), seq = UP.slice(st, st + len);
      var wrap = E('div', 'en-wrap'), slots = E('div', 'en-slots');
      var gapAt = kind === 'miss' ? 1 + Math.floor(Math.random() * (len - 2)) : -1;
      var ss = seq.map(function (ch, k) { var pre = kind === 'miss' ? k !== gapAt : (lv <= 2 && k === 0); var d = E('div', 'en-slot' + (pre ? ' fill' : ''), pre ? F(ch) : ''); slots.appendChild(d); return d; });
      wrap.appendChild(slots);
      var row = E('div', 'en-row'), tiles, need;
      if (kind === 'miss') {
        var n = lv <= 3 ? 3 : 4, others = O.shuffle(UP.filter(function (x) { return seq.indexOf(x) < 0; })).slice(0, n - 1);
        tiles = O.shuffle([seq[gapAt]].concat(others)).map(function (ch) { var b = E('button', 'en-tile small', F(ch)); b.type = 'button'; b._ch = ch; row.appendChild(b); return b; });
        wrap.appendChild(row); ctx.board.appendChild(wrap);
        ctx.ask('빠진 알파벳을 골라요', { html: '빠진 글자를 골라요 <b class="en">?</b>', speak: '빠진 알파벳을 골라요' });
        hintTo(ctx, tiles.filter(function (b) { return b._ch === seq[gapAt]; })[0]);
        return ctx.tapWait(tiles, function (b) { return b._ch === seq[gapAt]; }).then(function (b) {
          b.classList.add('used'); ss[gapAt].textContent = F(seq[gapAt]); ss[gapAt].classList.add('fill'); ctx.good(slots, false);
          return seq.reduce(function (p, ch) { return p.then(function () { return sayLetter(ch); }); }, Promise.resolve()).then(function () { O.praise(); });
        });
      }
      need = seq.slice(lv <= 2 ? 1 : 0);
      tiles = O.shuffle(need.map(function (ch) { var b = E('button', 'en-tile small', F(ch)); b.type = 'button'; b._ch = ch; row.appendChild(b); return b; }));
      wrap.appendChild(row); ctx.board.appendChild(wrap);
      ctx.ask('알파벳을 순서대로 눌러요', { html: '<b class="en">ABC</b> 순서대로 눌러요', speak: '알파벳을 순서대로 눌러요' });
      var k = lv <= 2 ? 1 : 0;
      function aim() { var nx = tiles.filter(function (b) { return !b._done && b._ch === seq[k]; })[0]; if (nx) hintTo(ctx, nx); }
      aim();
      return new Promise(function (res) {
        tiles.forEach(function (b) {
          b.onclick = function () {
            if (b._done) return; O.unlock && O.unlock();
            if (b._ch === seq[k]) {
              b._done = true; b.classList.add('used'); ss[k].textContent = F(b._ch); ss[k].classList.add('fill'); O.sfx('pop'); sayLetter(b._ch); k++;
              if (k === seq.length) { ctx.untarget(); setTimeout(function () { ctx.good(slots, false); O.praise(); setTimeout(res, 500); }, 350); } else aim();
            } else ctx.bad(b);
          };
        });
      });
    },
    trace: function (ctx, i) {
      var ch = letterCase(ctx, seqLetter(ctx, i));
      ctx.ask(ch + ' 를 따라 써요', { html: '<b class="en">' + ch + '</b> 를 따라 써요', speak: '따라 써요', replay: function () { return sayLetter(ch); } });
      return traceRound(ctx, ch, { hear: function () { sayLetter(ch); }, after: function () { return sayLetter(ch); } });
    },
    memory: function (ctx, i) {
      var lv = ctx.level, n = [2, 3, 4, 5, 6][lv - 1];
      var picks = O.shuffle(letterPool(ctx)).slice(0, n), cards = [];
      picks.forEach(function (ch) {
        cards.push({ key: ch, face: ch, say: function () { return sayLetter(ch); } });
        cards.push({ key: ch, face: lv >= 5 ? '🔊' : ch.toLowerCase(), say: function () { return sayLetter(ch); } });
      });
      ctx.ask('카드를 뒤집어 대문자와 소문자 짝을 찾아요', { speak: '카드를 뒤집어 짝을 찾아요' });
      return memoryRound(ctx, cards);
    },
    phonics: function (ctx, i) {
      var lv = ctx.level, W = ctx.cfg.words, t = nth(W, i);
      var ch = t.en[0].toUpperCase();
      var n = [1, 2, 3, 4, 4][lv - 1];
      var others = O.shuffle(W.filter(function (x) { return x.en[0].toUpperCase() !== ch; })).slice(0, n - 1);
      var wrap = E('div', 'en-wrap'), say1 = function () { return sayEn(NAME[ch] + '. ' + t.en); };
      if (lv === 5) {
        /* 거꾸로: 그림을 보고 첫 글자 고르기 */
        wrap.innerHTML = pic(ctx, t);
        var opts = O.shuffle([ch].concat(O.shuffle(UP.filter(function (x) { return x !== ch; })).slice(0, 3)));
        var tiles = opts.map(function (c) { var b = E('button', 'en-tile', c); b.type = 'button'; b._ch = c; return b; });
        var row = E('div', 'en-row'); tiles.forEach(function (b) { row.appendChild(b); }); wrap.appendChild(row);
        wrap.appendChild(hearBtn('🔊 ' + t.en, function () { sayEn(t.en); }));
        ctx.board.appendChild(wrap);
        ctx.ask('그림 이름은 어떤 글자로 시작할까요?', { html: '첫 글자를 골라요 <b class="en">🔊</b>', replay: function () { return sayEn(t.en); } });
        return ctx.tapWait(tiles, function (b) { return b._ch === ch; }).then(function (b) { ctx.good(b, false); return say1().then(function () { O.praise(); }); });
      }
      var big = E('div', 'en-big', ch + ' ' + ch.toLowerCase()); wrap.appendChild(big);
      var cards = O.shuffle([t].concat(others)).map(function (it) { var c = ctx.card(it, { big: n === 1, label: lv <= 2 ? it.en : '' }); c._ok = it === t; return c; });
      wrap.appendChild(ctx.grid(cards)); ctx.board.appendChild(wrap);
      ctx.ask(lv === 1 ? ch + ' 그림을 눌러 들어 봐요' : ch + ' 소리로 시작하는 그림을 골라요', { html: '<b class="en">' + ch + '</b> ' + (lv === 1 ? '그림을 눌러요' : '로 시작하는 그림을 골라요') + ' 🔊', speak: lv === 1 ? '그림을 눌러 들어 봐요' : '이 소리로 시작하는 그림을 골라요', replay: say1 });
      hintTo(ctx, cards.filter(function (c) { return c._ok; })[0]);
      return ctx.tapWait(cards, function (c) { return c._ok; }, function (c) { sayEn(c._item.en); }).then(function (c) { ctx.good(c, false); return say1().then(function () { O.praise(); }); });
    },
    write: function (ctx, i) {
      var lv = ctx.level, pool = letterPool(ctx), T = nth(pool, i), ch = lv >= 5 ? T.toLowerCase() : T;
      var hear = function () { return sayLetter(T); };
      ctx.ask('잘 듣고 알파벳을 써요', { html: '잘 듣고 써요 <b class="en">🔊</b>', replay: hear });
      if (lv <= 2) return traceRound(ctx, ch, { alpha: lv === 1 ? .5 : .22, hear: hear, after: hear });
      if (lv === 3) {
        /* 글자 판에서 고른 뒤 따라 쓰기 */
        var opts = O.shuffle([T].concat(O.shuffle(UP.filter(function (x) { return x !== T; })).slice(0, 5)));
        var tiles = opts.map(function (c) { var b = E('button', 'en-tile small', c); b.type = 'button'; b._ch = c; return b; });
        var row = E('div', 'en-row'); tiles.forEach(function (b) { row.appendChild(b); }); ctx.board.appendChild(row);
        hintTo(ctx, tiles.filter(function (b) { return b._ch === T; })[0]);
        return ctx.tapWait(tiles, function (b) { return b._ch === T; }).then(function (b) {
          ctx.good(b, false); row.remove(); ctx.untarget();
          ctx.ask(T + ' 를 따라 써요', { html: '<b class="en">' + T + '</b> 를 따라 써요', speak: '따라 써요', replay: hear });
          return traceRound(ctx, T, { alpha: .3, hear: hear, after: hear });
        });
      }
      /* 4·5: 안내 없이 직접 쓰기 → 쓴 모양 알아보기 */
      var pad = TracePad(ctx, ch, { alpha: 0, hear: hear }); ctx.board.appendChild(pad.el);
      var tries = 0, cands = lv >= 5 ? UP.map(function (x) { return x.toLowerCase(); }) : UP;
      return new Promise(function (res) {
        pad.ok.onclick = function () {
          O.unlock && O.unlock();
          if (!pad.strokes().length) { O.say('잘 듣고 글자를 써 봐요.', { noRepeat: true }); return; }
          var rank = pad.recognize(cands), pos = rank.map(function (r) { return r.ch; }).indexOf(ch); tries++;
          var near = pos >= 0 && rank[pos].s >= rank[0].s * .85;
          if (pos >= 0 && (pos < 3 || near)) { pad.ok.onclick = null; pad.drawGuide(.25); ctx.good(pad.el, false); hear().then(function () { O.praise(); setTimeout(res, 300); }); return; }
          ctx.bad(pad.ok);
          if (tries >= 2) { pad.clear(); pad.drawGuide(.3); O.say('안내 글자를 보고 따라 써 봐요.', { noRepeat: true });
            pad.ok.onclick = function () { var r = pad.check(); if (r.pass || tries++ >= 4) { pad.ok.onclick = null; ctx.good(pad.el, false); hear().then(function () { O.praise(); setTimeout(res, 300); }); } else ctx.bad(pad.ok); }; }
          else { pad.clear(); O.say('지우고 한 번 더 써 봐요.', { noRepeat: true }); }
        };
      });
    }
  };

  /* ================= 카드 뒤집기 ================= */
  function memoryRound(ctx, items) {
    var lv = ctx.level, deck = O.shuffle(items.slice());
    var cols = deck.length <= 4 ? deck.length : deck.length <= 8 ? 4 : deck.length <= 10 ? 5 : 6;
    var g = E('div', 'en-mem'); g.style.gridTemplateColumns = 'repeat(' + cols + ', auto)';
    var els = deck.map(function (d) {
      var b = E('button', 'en-card', '<div class="in"><div class="f">★</div><div class="b' + (d.wd ? ' wd' : '') + '">' + d.face + '</div></div>'); b.type = 'button'; b._d = d; g.appendChild(b); return b;
    });
    ctx.board.appendChild(g);
    var peek = [3000, 2600, 2000, 1500, 1000][lv - 1];
    return new Promise(function (res) {
      var busy = true, first = null, left = deck.length / 2;
      els.forEach(function (b) { b.classList.add('open'); });
      setTimeout(function () { els.forEach(function (b) { b.classList.remove('open'); }); busy = false; }, peek);
      els.forEach(function (b) {
        b.onclick = function () {
          if (busy || b.classList.contains('open')) return;
          O.unlock && O.unlock(); O.sfx('tick'); b.classList.add('open'); b._d.say();
          if (!first) { first = b; return; }
          var a = first; first = null; busy = true;
          if (a._d.key === b._d.key) {
            setTimeout(function () { a.classList.add('done'); b.classList.add('done'); O.sfx('ok'); busy = false; left--; if (!left) { O.praise(); setTimeout(res, 600); } }, 450);
          } else {
            setTimeout(function () { a.classList.remove('open'); b.classList.remove('open'); busy = false; }, 1000);
          }
        };
      });
    });
  }

  /* ================= 낱말 ================= */
  var WPLAN = [
    ['listen1', 'listen1', 'trace', 'listen1'],
    ['pick', 'trace', 'pick', 'spellHint', 'memory'],
    ['pick', 'spellHint', 'trace', 'spellHint', 'memory'],
    ['spell', 'pick', 'trace', 'spell', 'memory', 'spell'],
    ['hearSpell', 'hearSpell', 'trace', 'memory', 'hearSpell']
  ];
  function wordNext(ctx) { var W = ctx.cfg.items; if (!ctx._wo || !ctx._wo.length) ctx._wo = O.shuffle(W.slice()); return ctx._wo.pop(); }
  var WORD = {
    listen1: function (ctx, t) {
      var c = ctx.card(t, { big: true, label: t.en }); var wrap = E('div', 'en-wrap'); wrap.appendChild(ctx.grid([c])); ctx.board.appendChild(wrap);
      ctx.ask('그림을 눌러 영어 이름을 들어 봐요', { html: '그림을 눌러요 <b class="en">🔊 ' + O.esc(t.en) + '</b>', speak: '그림을 눌러 들어 봐요', replay: function () { return sayEn(t.en); } });
      hintTo(ctx, c);
      return ctx.tapWait([c], function () { return true; }).then(function () { ctx.good(c, false); return sayEn(t.en).then(function () { O.praise(); }); });
    },
    pick: function (ctx, t) {
      var lv = ctx.level, n = [1, 2, 3, 4, 4][lv - 1], W = ctx.cfg.items;
      var opts = O.shuffle([t].concat(O.shuffle(W.filter(function (x) { return x !== t; })).slice(0, n - 1)));
      var cards = opts.map(function (it) { var c = ctx.card(it, { label: '' }); c._ok = it === t; return c; });
      ctx.board.appendChild(ctx.grid(cards));
      ctx.ask('잘 듣고 그림을 골라요', { html: '잘 듣고 골라요 <b class="en">🔊' + (lv <= 2 ? ' ' + O.esc(t.en) : '') + '</b>', replay: function () { return sayEn(t.en); } });
      hintTo(ctx, cards.filter(function (c) { return c._ok; })[0]);
      return ctx.tapWait(cards, function (c) { return c._ok; }).then(function (c) {
        ctx.good(c, false); var lab = c.querySelector('.lab'); if (lab) lab.textContent = t.en; return sayEn(t.en).then(function () { O.praise(); });
      });
    },
    trace: function (ctx, t) {
      var wrap = E('div', 'en-row'); wrap.innerHTML = pic(ctx, t); ctx.board.appendChild(wrap);
      ctx.ask(t.en + ' 를 따라 써요', { html: '<b class="en">' + O.esc(t.en) + '</b> 따라 쓰기', speak: '낱말을 따라 써요', replay: function () { return sayEn(t.en); } });
      return traceRound(ctx, t.en, { hear: function () { sayEn(t.en); }, after: function () { return sayEn(t.en); } });
    },
    spell: function (ctx, t, mode) {
      var lv = ctx.level, word = t.en, hint = mode === 'hint', hearOnly = mode === 'hear';
      var wrap = E('div', 'en-wrap');
      var top = E('div', 'en-row');
      if (hearOnly) { top.appendChild(hearBtn('🔊', function () { sayEn(word); }, true)); } else top.innerHTML = pic(ctx, t);
      wrap.appendChild(top);
      var slots = E('div', 'en-slots'), ss = word.split('').map(function (ch) { var s = E('div', 'en-slot', hint ? ch : ''); slots.appendChild(s); return s; });
      wrap.appendChild(slots);
      var extra = lv >= 4 ? O.shuffle('abcdefghijklmnopqrstuvwxyz'.split('').filter(function (x) { return word.indexOf(x) < 0; })).slice(0, lv >= 5 ? 3 : 2) : [];
      var letters = O.shuffle(word.split('').concat(extra));
      var row = E('div', 'en-row'), tiles = letters.map(function (ch) { var b = E('button', 'en-tile small', ch); b.type = 'button'; b._ch = ch; row.appendChild(b); return b; });
      wrap.appendChild(row); if (!hearOnly) wrap.appendChild(hearBtn('🔊 ' + (lv <= 3 ? word : '듣기'), function () { sayEn(word); }));
      ctx.board.appendChild(wrap);
      ctx.ask(hearOnly ? '잘 듣고 글자 블록으로 낱말을 만들어요' : '글자 블록을 순서대로 눌러 낱말을 만들어요', { html: (hearOnly ? '잘 듣고 낱말을 만들어요' : '글자를 순서대로 눌러요') + ' <b class="en">🔊</b>', replay: function () { return sayEn(word); } });
      var k = 0;
      function aim() { var nx = tiles.filter(function (b) { return !b._done && b._ch === word[k]; })[0]; if (nx) hintTo(ctx, nx); }
      aim();
      return new Promise(function (res) {
        tiles.forEach(function (b) {
          b.onclick = function () {
            if (b._done) return; O.unlock && O.unlock();
            if (b._ch === word[k]) {
              b._done = true; b.classList.add('used'); ss[k].textContent = b._ch; ss[k].classList.add('fill'); O.sfx('pop'); sayLetter(b._ch); k++;
              if (k === word.length) { ctx.untarget(); if (hearOnly) top.innerHTML = pic(ctx, t); setTimeout(function () { ctx.good(slots, false); sayEn(word).then(function () { O.praise(); setTimeout(res, 300); }); }, 350); }
              else aim();
            } else ctx.bad(b);
          };
        });
      });
    },
    memory: function (ctx) {
      var lv = ctx.level, n = [2, 2, 3, 4, 5][lv - 1], picks = O.shuffle(ctx.cfg.items).slice(0, n), cards = [];
      picks.forEach(function (it) {
        cards.push({ key: it.en, face: ctx.pic(it), say: function () { return sayEn(it.en); } });
        cards.push({ key: it.en, face: O.esc(it.en), wd: true, say: function () { return sayEn(it.en); } });
      });
      ctx.ask('카드를 뒤집어 그림과 낱말 짝을 찾아요', { speak: '카드를 뒤집어 짝을 찾아요' });
      return memoryRound(ctx, cards);
    }
  };

  /* ================= 문장 ================= */
  function sentNext(ctx) { var S = ctx.cfg.sets; if (!ctx._so || !ctx._so.length) ctx._so = O.shuffle(S.slice()); return ctx._so.pop(); }
  function sayS(s) { return s.q ? sayEn(s.q).then(function () { return sayEn(s.en); }) : sayEn(s.en); }
  function repeatAfter(ctx, s) {
    /* 듣고 따라 말하기: 문장을 들려주고 '말했어요'를 누르면 끝 */
    var row = E('div', 'en-row'), b = E('button', 'oks-btn', '🗣️ 따라 말했어요'); b.type = 'button'; row.appendChild(hearBtn('🔊 다시 듣기', function () { sayS(s); })); row.appendChild(b);
    ctx.board.appendChild(row);
    return O.say('따라 말해 봐요.', { noRepeat: true }).then(function () { return sayS(s); }).then(function () {
      return new Promise(function (res) { hintTo(ctx, b); b.onclick = function () { O.unlock && O.unlock(); ctx.untarget(); ctx.good(b, false); O.praise(); setTimeout(res, 400); }; });
    });
  }
  var SENT = function (ctx, i) {
    var lv = ctx.level, s = sentNext(ctx), words = s.en.split(' ');
    var wrap = E('div', 'en-wrap');
    if (s.img || s.emo || s.color) { var p = E('div', 'en-row'); p.innerHTML = pic(ctx, s); wrap.appendChild(p); }
    if (s.q) { var qd = E('div', 'en-sent q', O.esc(s.q)); wrap.appendChild(qd); }
    var line = E('div', 'en-sent'); wrap.appendChild(line); ctx.board.appendChild(wrap);
    if (lv === 1) {
      line.textContent = s.en;
      ctx.ask('그림을 보고 영어 문장을 들어 봐요', { html: '문장을 들어요 <b class="en">🔊</b>', replay: function () { return sayS(s); } });
      return repeatAfter(ctx, s);
    }
    if (lv <= 3) {
      /* 빈칸 채우기 */
      var bi = s.blank, ans = words[bi].replace(/[.!?,]/g, '');
      words.forEach(function (w, k) {
        if (k === bi) { var gp = E('span', 'en-gap', ''); gp._p = w.replace(ans, ''); line.appendChild(gp); line._gap = gp; }
        else line.appendChild(E('span', '', O.esc(w)));
      });
      var n = lv === 2 ? 2 : 3;
      var pool = ctx.cfg.sets.map(function (x) { return x.en.split(' ')[x.blank].replace(/[.!?,]/g, ''); }).filter(function (w, k, a) { return w !== ans && a.indexOf(w) === k; });
      var opts = O.shuffle([ans].concat(O.shuffle(pool).slice(0, n - 1)));
      var row = E('div', 'en-row'), bl = opts.map(function (w) { var b = E('button', 'en-blk', O.esc(w)); b.type = 'button'; b._w = w; row.appendChild(b); return b; });
      wrap.appendChild(row);
      ctx.ask('빈칸에 알맞은 낱말을 골라요', { html: '빈칸 낱말을 골라요 <b class="en">🔊</b>', replay: function () { return sayS(s); } });
      hintTo(ctx, bl.filter(function (b) { return b._w === ans; })[0]);
      return ctx.tapWait(bl, function (b) { return b._w === ans; }, function (b) { sayEn(b._w); }).then(function (b) {
        b.classList.add('used'); line._gap.textContent = words[bi]; line._gap.classList.add('fill'); ctx.good(line, false);
        return sayS(s).then(function () { O.praise(); row.remove(); return lv === 2 ? repeatAfter(ctx, s) : O.wait(300); });
      });
    }
    /* 4·5: 낱말 블록을 순서대로 */
    var gaps = words.map(function () { var g = E('span', 'en-gap box', ''); line.appendChild(g); return g; });
    var row2 = E('div', 'en-row'), blocks = O.shuffle(words.map(function (w, k) { return { w: w, k: k }; })).map(function (o) { var b = E('button', 'en-blk', O.esc(o.w)); b.type = 'button'; b._w = o.w; row2.appendChild(b); return b; });
    wrap.appendChild(row2);
    if (lv === 4) wrap.appendChild(hearBtn('🔊 다시 듣기', function () { sayS(s); }));
    else { var hb = hearBtn('🔊', function () { sayS(s); }, true); wrap.insertBefore(hb, line); }
    ctx.ask(lv === 5 ? '잘 듣고 낱말 블록으로 문장을 만들어요' : '낱말 블록을 순서대로 눌러 문장을 만들어요', { html: '순서대로 눌러 문장을 만들어요 <b class="en">🔊</b>', replay: function () { return sayS(s); } });
    var k = 0;
    return new Promise(function (res) {
      blocks.forEach(function (b) {
        b.onclick = function () {
          if (b._done) return; O.unlock && O.unlock();
          if (b._w === words[k]) { b._done = true; b.classList.add('used'); gaps[k].textContent = b._w; gaps[k].classList.add('fill'); O.sfx('pop'); k++;
            if (k === words.length) { ctx.good(line, false); sayS(s).then(function () { O.praise(); setTimeout(res, 300); }); } }
          else { ctx.bad(b); }
        };
      });
    });
  };

  EN.abc = {
    rounds: [4, 5, 5, 6, 5],
    setup: function (ctx) { css(); ctx._wo = null; ctx._so = null; ctx._seq0 = null; },
    round: function (ctx, i) {
      css(); ctx.clear(); var c = ctx.cfg, lv = ctx.level;
      if (c.kind === 'letters') return LETTER[c.mode](ctx, i);
      if (c.kind === 'sentences') return SENT(ctx, i);
      var plan = WPLAN[lv - 1], m = plan[i % plan.length];
      if (m === 'memory') return WORD.memory(ctx);
      var t = wordNext(ctx);
      if (m === 'spellHint') return WORD.spell(ctx, t, 'hint');
      if (m === 'hearSpell') return WORD.spell(ctx, t, 'hear');
      if (m === 'spell') return WORD.spell(ctx, t, '');
      return WORD[m](ctx, t);
    }
  };
  EN.abc._NAME = NAME; EN.abc._TracePad = TracePad;
})();
