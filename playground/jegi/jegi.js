(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, O = window.OKS;
  var video = $('video'), overlay = $('skeleton'), ctx = overlay.getContext('2d');
  var stream = null, worker = null, cancelModel = null, detector = null;
  var epoch = 0, starting = false, ready = false, valid = false, playing = false, paused = false, busy = false;
  var countMode = 'button';
  var count = 0, raf = 0, lastFrame = 0, lastVideoTime = -1, poseTimer = 0, flight = null, shine = null, poseTimeout = 0;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !!(O && O.settings().calm);
  function status(text) { if ($('status').textContent !== text) $('status').textContent = text; }
  function cue(text) { $('cue').textContent = text; }
  function updateControls() {
    $('camera').disabled = starting || !!stream;
    $('camera').textContent = starting ? '카메라 준비 중…' : stream ? '카메라 켜짐' : '카메라 켜기';
    $('stop').disabled = !starting && !stream;
    $('calibrate').disabled = !ready || !valid || paused;
    $('pause').disabled = !playing;
    $('pause').textContent = paused ? '다시 놀기' : '잠깐 쉬기';
    $('tryKick').disabled = starting;
    $('tryKick').textContent = stream ? '버튼 연습으로 전환' : '버튼으로 차 보기';
    $('framing').hidden = !ready;
    $('cameraBadge').textContent = starting ? '준비 중' : stream ? (valid ? '다리 인식됨' : '다리를 보여 주세요') : '카메라 꺼짐';
    $('inputLabel').textContent = stream ? '카메라 동작 모드' : '버튼 연습 모드';
  }
  function newDetector() { return new window.JegiMotion({ foot: $('foot').value, seated: $('posture').value === 'seated', sensitivity: Number($('sensitivity').value) }); }
  function resetVisuals() {
    clearTimeout(poseTimeout); if (flight) flight.cancel(); if (shine) shine.cancel(); flight = shine = null;
    $('rabbit').src = 'assets/rabbit-ready.webp'; $('rabbit').alt = '제기차기를 준비하는 토끼'; $('jegi').style.transform = ''; $('spark').style.opacity = '0';
  }
  function resetScore() {
    count = 0; $('score').textContent = '0'; $('goal').textContent = '별 모으기 0 / 5'; document.body.classList.remove('celebrate'); resetVisuals();
  }
  function kick(side) {
    if (paused) return;
    if (!stream && countMode !== 'button') { resetScore(); countMode = 'button'; }
    count++; $('score').textContent = count;
    $('goal').textContent = '★ ' + Math.floor(count / 5) + '개 · 다음 별 ' + count % 5 + ' / 5';
    var earned = count % 5 === 0; document.body.classList.toggle('celebrate', earned);
    cue(earned ? '별 하나를 모았어요! 계속 놀아요.' : '통통! 발을 내리고 다시 들어요.');
    $('caption').textContent = stream ? (side === 'left' ? '내 왼발' : '내 오른발') + ' 움직임이 인식됐어요.' : '버튼으로 차 보는 연습이에요.';
    if (O) { O.unlock && O.unlock(); O.sfx(earned ? 'win' : 'pop'); }
    clearTimeout(poseTimeout); $('rabbit').src = 'assets/rabbit-kick.webp'; $('rabbit').alt = '제기를 차는 토끼';
    poseTimeout = setTimeout(function () { $('rabbit').src = 'assets/rabbit-ready.webp'; $('rabbit').alt = '제기차기를 준비하는 토끼'; }, 360);
    if (flight) flight.cancel(); if (shine) shine.cancel();
    if (!reduced && $('jegi').animate) {
      var lift = Math.min(210, document.querySelector('.play-court').clientHeight * .32);
      flight = $('jegi').animate([{ transform: 'translateY(0) rotate(-8deg)' }, { transform: 'translateY(-' + lift + 'px) rotate(12deg)', offset: .48 }, { transform: 'translateY(0) rotate(-8deg)' }], { duration: 1100, easing: 'ease-in-out' });
      shine = $('spark').animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)', offset: .35 }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 700 });
    }
  }
  function draw(points) {
    overlay.width = video.videoWidth || 640; overlay.height = video.videoHeight || 480; ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!points) return;
    var links = [[11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
    ctx.strokeStyle = valid ? '#7af2b6' : '#ffd365'; ctx.lineWidth = Math.max(3, overlay.width / 150);
    links.forEach(function (ids) { var a = points[ids[0]], b = points[ids[1]]; if (!a || !b || a.visibility < .55 || b.visibility < .55) return; ctx.beginPath(); ctx.moveTo(a.x * overlay.width, a.y * overlay.height); ctx.lineTo(b.x * overlay.width, b.y * overlay.height); ctx.stroke(); });
    [23, 24, 25, 26, 27, 28].forEach(function (i) { var p = points[i]; if (p && p.visibility >= .55) { ctx.beginPath(); ctx.arc(p.x * overlay.width, p.y * overlay.height, 6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); } });
  }
  function framing(points) {
    var check = detector.inspect(points);
    document.querySelectorAll('[data-body]').forEach(function (e) {
      var labels = { shoulders: '어깨', hips: '몸통', knees: '무릎', feet: '발' };
      e.classList.toggle('seen', check.seen[e.dataset.body]);
      e.textContent = (check.seen[e.dataset.body] ? '✓ ' : '! ') + labels[e.dataset.body];
    });
    if (check.valid) return '';
    if (!check.detected) return '화면 중앙에 한 명만 서 주세요. 어깨부터 발까지 보여야 시작할 수 있어요.';
    if (!check.seen.feet) return '발이 안 보여요. 맥북에서 조금 더 뒤로 이동하거나 화면 각도를 낮춰 발까지 보여 주세요.';
    if (!check.seen.knees) return '무릎이 안 보여요. 다리 전체가 화면에 들어오도록 위치를 맞춰 주세요.';
    if (!check.seen.hips) return '몸통이 가려졌어요. 화면 중앙에서 몸통과 다리를 함께 보여 주세요.';
    if (!check.seen.shoulders) return '어깨가 안 보여요. 어깨부터 발까지 화면에 들어오도록 맞춰 주세요.';
    return '화면에서 너무 작게 보여요. 조금 가까이 이동해 주세요.';
  }
  function receivePose(points) {
    clearTimeout(poseTimer); busy = false;
    valid = !!detector.read(points); var instruction = framing(points); draw(points);
    if (paused || $('helpDialog').open) { updateControls(); return; }
    if (!playing && valid && detector.start(points)) {
      playing = true;
      cue('놀이 시작! 발을 내린 뒤 살짝 들어요.');
      status('인식됐어요! 자동으로 놀이를 시작했어요.');
      $('caption').textContent = '발을 내린 뒤 다시 들어야 다음 동작으로 인정해요.';
      updateControls();
      return;
    }
    if (playing) {
      var r = detector.update(points, performance.now());
      if (!r.valid) { cue('다리가 보이면 이어서 놀아요.'); status(instruction); }
      else { status('발을 내린 뒤 다시 들면 제기를 차요.'); if (r.kick) kick(r.kick); else if ($('cue').textContent === '다리가 보이면 이어서 놀아요.') cue('발을 내리고 다시 준비해요.'); }
    } else { status(instruction); cue('다리가 인식되면 자동으로 시작해요.'); }
    updateControls();
  }
  function stopCamera(message) {
    epoch++; starting = ready = valid = playing = paused = busy = false;
    cancelAnimationFrame(raf); raf = 0; clearTimeout(poseTimer);
    if (cancelModel) { cancelModel(); cancelModel = null; }
    if (worker) worker.terminate(); worker = null;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; video.srcObject = null;
    ctx.clearRect(0, 0, overlay.width, overlay.height); $('cameraEmpty').hidden = false;
    resetVisuals(); updateControls(); status(message || '카메라를 껐어요. 버튼으로 연습하거나 다시 켤 수 있어요.'); cue('발을 들면 제기가 통통!');
  }
  function frame(now) {
    if (!ready || !stream) return;
    raf = requestAnimationFrame(frame);
    if (paused || document.hidden || busy || now - lastFrame < 90 || video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastFrame = now; lastVideoTime = video.currentTime; busy = true;
    var token = epoch, activeWorker = worker;
    createImageBitmap(video).then(function (bitmap) {
      if (token !== epoch || !ready || activeWorker !== worker) { bitmap.close(); return; }
      activeWorker.postMessage({ type: 'frame', bitmap: bitmap, time: now }, [bitmap]);
      poseTimer = setTimeout(function () { if (token === epoch) stopCamera('동작 인식이 멈췄어요. 카메라를 다시 켜 주세요.'); }, 8000);
    }).catch(function () { if (token === epoch) stopCamera('카메라 화면을 읽지 못했어요. 카메라를 다시 켜 주세요.'); });
  }
  function initModel(token) {
    worker = new Worker('pose-worker.js');
    return new Promise(function (resolve, reject) {
      var settled = false, timer;
      function end(error) { if (settled) return; settled = true; clearTimeout(timer); cancelModel = null; error ? reject(error) : resolve(); }
      cancelModel = function () { end(new Error('cancelled')); };
      timer = setTimeout(function () { end(new Error('model-timeout')); }, 45000);
      worker.onmessage = function (e) {
        if (token !== epoch) return;
        if (e.data.type === 'ready') end();
        else if (e.data.type === 'error') { if (!settled) end(new Error('model-load')); else stopCamera('동작 인식을 실행하지 못했어요. 다시 켜거나 버튼으로 연습해 주세요.'); }
        else if (e.data.type === 'pose') receivePose(e.data.points);
      };
      worker.onerror = function () { if (!settled) end(new Error('model-load')); else if (token === epoch) stopCamera('동작 인식 연결이 끊겼어요. 카메라를 다시 켜 주세요.'); };
      worker.postMessage({ type: 'init' });
    });
  }
  async function startCamera() {
    if (starting || stream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.Worker || !window.createImageBitmap) { status('이 브라우저에서는 카메라 동작 인식을 사용할 수 없어요. 맥북 Chrome에서 열거나 버튼으로 연습해 주세요.'); return; }
    starting = true; detector = newDetector(); var token = ++epoch; updateControls();
    status('카메라 사용을 허용해 주세요. 동작 인식도 함께 준비합니다…');
    try {
      // 두 준비 작업 모두 종료되도록 실패 처리를 연결합니다. 늦게 도착한 카메라도 즉시 해제합니다.
      var cameraPromise = navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } }).then(async function (s) {
        if (token !== epoch) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = s; video.srcObject = stream; await video.play(); $('cameraEmpty').hidden = true;
        stream.getVideoTracks().forEach(function (track) { track.onended = function () { if (token === epoch) stopCamera('카메라 연결이 끊겼어요. 다시 켜 주세요.'); }; });
      });
      await Promise.all([cameraPromise, initModel(token)]);
      if (token !== epoch) return;
      starting = false; ready = true; lastFrame = 0; lastVideoTime = -1; resetScore(); countMode = 'camera'; status('다리가 한 번 인식되면 자동으로 시작해요. 어깨부터 발까지 보여 주세요.'); updateControls(); raf = requestAnimationFrame(frame);
    } catch (e) {
      if (token !== epoch) return;
      var message = e.name === 'NotAllowedError' ? '카메라 권한이 허용되지 않았어요. 주소창의 사이트 설정에서 카메라를 허용하고 다시 켜 주세요.' : e.name === 'NotFoundError' ? '사용할 카메라를 찾지 못했어요. 맥북 카메라 연결을 확인해 주세요.' : e.name === 'NotReadableError' ? '카메라를 사용하지 못했어요. 다른 앱의 카메라 사용을 끝내고 다시 켜 주세요.' : '카메라 또는 동작 인식 준비에 실패했어요. 인터넷 연결을 확인하고 다시 켜 주세요. 버튼 연습도 가능합니다.';
      stopCamera(message);
    }
  }
  $('camera').onclick = startCamera;
  $('stop').onclick = function () { stopCamera(); };
  $('calibrate').onclick = function () { detector = newDetector(); playing = false; resetScore(); cue('다시 인식되면 바로 시작해요.'); status('편한 자세에서 발을 내려 주세요. 인식되면 자동으로 시작해요.'); updateControls(); };
  $('pause').onclick = function () {
    paused = !paused; detector.resetTracking(); updateControls();
    if (flight) paused ? flight.pause() : flight.play(); if (shine) paused ? shine.pause() : shine.play();
    status(paused ? '잠깐 쉬어요. 다시 놀기를 누르면 이어서 참여해요.' : '발을 내리고 다시 준비해 주세요.'); cue(paused ? '잠깐 쉬어요.' : '발을 내린 뒤 다시 들어요.');
  };
  $('reset').onclick = function () { resetScore(); paused = false; if (detector) detector.resetTracking(); cue('새로운 별을 모아 볼까요?'); updateControls(); };
  $('tryKick').onclick = function () { if (starting) return; if (stream) stopCamera('카메라를 끄고 버튼 연습으로 전환했어요. 카메라를 다시 켜면 동작 놀이로 돌아갈 수 있어요.'); kick('button'); };
  ['posture', 'foot', 'sensitivity'].forEach(function (id) { $(id).onchange = function () { detector = newDetector(); playing = paused = false; resetVisuals(); status(stream ? '설정을 바꿨어요. 다리가 인식되면 자동으로 다시 시작해요.' : '카메라를 켜거나 버튼으로 연습해 주세요.'); cue('내 움직임에 맞춰 준비해요.'); updateControls(); }; });
  $('help').onclick = function () { if (playing && !paused) $('pause').click(); $('helpDialog').showModal(); };
  $('helpDialog').addEventListener('close', function () { if (detector) detector.resetTracking(); });
  var lastButton = 0;
  document.addEventListener('keydown', function (e) { if (e.code === 'Space' && !e.repeat && !stream && !starting && !$('helpDialog').open && !e.target.closest('button,a,select,input,textarea') && performance.now() - lastButton > 400) { e.preventDefault(); lastButton = performance.now(); kick('button'); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden && (stream || starting)) stopCamera('화면을 떠나 카메라를 껐어요. 다시 켜고 준비 자세를 맞춰 주세요.'); });
  addEventListener('pagehide', function () { stopCamera(); });
  updateControls();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../../sw.js').catch(function () {});
})();
