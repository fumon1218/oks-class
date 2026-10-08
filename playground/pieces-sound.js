/* 말·돌을 놓는 소리 (체스·바둑·장기·오목). assets/pieces.mp3 한 파일에 짧은 "딱" 소리 9개가 0.4초 간격으로 들어 있어요. 못 불러오면 기본 소리를 내요. */
(function () {
  var O = window.OKS, buf = null, loading = false, last = -1, N = 9, STEP = 0.4, LEN = 0.34;
  function ctx() { try { return O && O.unlock && O.unlock(); } catch (e) { return null; } }
  function load() {
    if (buf || loading) return; loading = true; var c = ctx(); if (!c) { loading = false; return; }
    fetch('../assets/pieces.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (a) { return new Promise(function (ok, no) { c.decodeAudioData(a, ok, no); }); }).then(function (b) { buf = b; }).catch(function () { loading = false; });
  }
  function place(vol) {
    var on = true; try { on = O.settings().sound !== false; } catch (e) {} if (!on) return;
    var c = ctx(); if (!c) return; if (!buf) { load(); if (O && O.sfx) O.sfx('pop'); return; }
    var k; do { k = Math.floor(Math.random() * N); } while (k === last && N > 1); last = k;
    var s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; s.playbackRate.value = 0.96 + Math.random() * 0.08; g.gain.value = vol || 0.9; s.connect(g); g.connect(c.destination); s.start(0, k * STEP, LEN);
  }
  window.OKS_PIECE = { place: place, load: load };
  document.addEventListener('pointerdown', load, { once: true, capture: true });
  setTimeout(load, 1500);
})();
