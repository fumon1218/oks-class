/* 옥쌤의 즐거운 교실 — 3D 오셀로 (놀이별 · 전략놀이)
   공통 3D 바탕(common3d.js) + 규칙 엔진(engine.js). 판과 돌은 올려 준 오셀로 GLB에서 필요한 부분만 뽑은 assets/othello.glb.
   모드: 연습 문제(뒤집기·여러 방향·구석·피하기·상대 막기) / 컴퓨터와 대국 / 둘이서 대국 */
import { createStage, THREE } from '../common3d.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';

const E = window.OKS_OTHELLO, O = window.OKS;
const LESSON = 'play-othello', LEARN_LESSON = 'play-othello-learn';
const SQ = 2, K = SQ / 0.17396, TOPY = 0.02197 * K, THICK = 1.8;        // 판 한 칸 크기, 모델 → 장면 배율, 돌 두께 보정
const REST = 0.00879 * K * THICK;                                           // 돌이 판 위에 놓일 때 중심 높이
const LEVEL_NAME = ['', '아주 쉬워요', '쉬워요', '보통', '어려워요', '아주 어려워요'];
const TYPE_NAME = ['섞어서', '뒤집기 기본', '여러 방향', '구석 차지', '구석 옆 피하기', '상대 막기'];
const WHY = ['', '내 돌과 내 돌 사이에 상대 돌이 끼이면 모두 내 색으로 뒤집혀요. 초록 점 중 아무 곳이나 눌러 봐요.',
  '한 방향이 아니라 여러 방향으로 한꺼번에 끼우면 많이 뒤집혀요. 두 방향 이상 뒤집는 곳을 찾아요.',
  '구석은 절대 뒤집히지 않아요! 많이 뒤집는 곳보다 구석이 더 좋을 때가 많아요.',
  '구석 바로 옆 칸(대각선 X칸·가장자리 C칸)에 두면 상대가 구석을 가져가기 쉬워요. 안전한 곳을 골라요.',
  '상대가 둘 곳이 적을수록 좋아요. 내가 둔 뒤에 상대의 선택지가 가장 적어지는 곳을 찾아요.'];
const DONE = ['', '', '여러 방향을 한꺼번에 뒤집었어요! 끼우는 방향이 많을수록 많이 뒤집혀요.', '구석을 차지했어요! 구석 돌은 끝까지 내 돌이에요.', '안전해요! 구석 옆 칸은 상대에게 구석을 내줄 수 있어서 조심해야 해요.', '상대가 둘 곳이 줄었어요! 상대의 선택지를 줄이는 게 오셀로의 핵심이에요.'];
const colName = (c) => (c > 0 ? '검은 돌' : '흰 돌');
const cxOf = (s) => (s & 7), cyOf = (s) => (s >> 3);
const wx = (s) => (cxOf(s) - 3.5) * SQ, wz = (s) => (cyOf(s) - 3.5) * SQ;

const S = createStage({ extent: 18, bg: 0x23513a, tableColor: 0x2c3e32, tableY: -0.8, pol: 0.66, minDist: 26, targetY: 0, sunPos: [10, 22, 12] });
const { $, scene, say, note, sleep, tween, ease, poke } = S;

/* ---------- 판과 돌 (GLB) ---------- */
let proto = {};
const boardGroup = new THREE.Group(); scene.add(boardGroup);
const discLayer = new THREE.Group(); scene.add(discLayer);
const markLayer = new THREE.Group(); scene.add(markLayer);
async function loadModel() {
  const gltf = await new GLTFLoader().loadAsync('assets/othello.glb');
  ['frame', 'squares', 'disc_black', 'disc_white'].forEach((n) => { proto[n] = gltf.scene.getObjectByName(n); if (!proto[n]) throw new Error(n); });
  proto.frame.material = proto.frame.material.clone(); proto.frame.material.color.setHex(0x4a2e18);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(22.2, 0.8, 22.2), new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.65 })); slab.position.y = -0.42; slab.receiveShadow = true; slab.castShadow = true; boardGroup.add(slab);
  ['frame', 'squares'].forEach((n) => { const m = proto[n].clone(); m.scale.setScalar(K); m.position.y = -TOPY; m.castShadow = n === 'frame'; m.receiveShadow = true; boardGroup.add(m); });
  proto.disc_black.material = proto.disc_black.material.clone(); proto.disc_white.material = proto.disc_white.material.clone();
  proto.disc_white.material.color.setHex(0xf6f3ec);
}
function makeDisc(color) {
  const g = new THREE.Group(), a = proto.disc_black.clone(), b = proto.disc_white.clone();
  [a, b].forEach((m) => { m.castShadow = true; m.receiveShadow = true; g.add(m); }); g.scale.set(K, K * THICK, K); g.rotation.x = color > 0 ? 0 : Math.PI; g.userData.color = color; return g;
}

/* ---------- 표시(마커) ---------- */
const dotGeo = new THREE.CircleGeometry(SQ * 0.14, 20), ringGeo = new THREE.RingGeometry(SQ * 0.34, SQ * 0.45, 28), lastGeo = new THREE.CircleGeometry(SQ * 0.09, 16);
const MARK_COL = { dot: 0x2fe07a, hint: 0xffd23c, last: 0xe0392b, bad: 0xff4a3a };
const marks = { dot: new Set(), hint: new Set(), last: -1, bad: new Set() };
const pool = []; let used = 0;
function mm(kind) { let m = pool[used]; if (!m) { m = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; pool.push(m); markLayer.add(m); }
  used++; m.visible = true; m.material.color.setHex(MARK_COL[kind]); m.geometry = kind === 'hint' || kind === 'bad' ? ringGeo : kind === 'last' ? lastGeo : dotGeo; m.userData.kind = kind; return m; }
function refreshMarkers() {
  used = 0;
  marks.dot.forEach((s) => { mm('dot').position.set(wx(s), 0.06, wz(s)); });
  marks.hint.forEach((s) => { mm('hint').position.set(wx(s), 0.08, wz(s)); });
  marks.bad.forEach((s) => { mm('bad').position.set(wx(s), 0.08, wz(s)); });
  if (marks.last >= 0 && discs.has(marks.last)) mm('last').position.set(wx(marks.last), REST * 2 + 0.05, wz(marks.last));
  for (let i = used; i < pool.length; i++) pool[i].visible = false; poke(300);
}
const clearMarks = (keepLast) => { marks.dot.clear(); marks.hint.clear(); marks.bad.clear(); if (!keepLast) marks.last = -1; refreshMarkers(); };

/* ---------- 상태 ---------- */
let game = new E.Game(), mode = null, level = 3, myColor = 1, busy = false, over = false, stats = O.newStats(), runId = 0, assistOn = true, pz = null;
const discs = new Map();
const isHumanTurn = () => !over && !busy && (mode === 'two' || (mode === 'play' && game.turn === myColor));

function clearDiscs() { discs.forEach((d) => discLayer.remove(d)); discs.clear(); }
function syncBoard() { clearDiscs(); for (let s = 0; s < 64; s++) if (game.board[s]) { const d = makeDisc(game.board[s]); d.position.set(wx(s), REST, wz(s)); discLayer.add(d); discs.set(s, d); } poke(500); updateScore(); }
function updateScore() {
  const c = game.count(); $('scB').textContent = '⚫ ' + c.b; $('scW').textContent = '⚪ ' + c.w;
  $('scB').classList.toggle('turn', !over && game.turn > 0); $('scW').classList.toggle('turn', !over && game.turn < 0);
}
function showLegal() { marks.dot.clear(); if (assistOn && !over && mode && (mode === 'learn' || mode === 'two' || game.turn === myColor)) game.moves().forEach((s) => marks.dot.add(s)); refreshMarkers(); }
async function dropDisc(s, color) {
  const d = makeDisc(color); d.position.set(wx(s), REST + 3.4, wz(s)); discLayer.add(d); discs.set(s, d); O.sfx('pop');
  await tween(380, (p) => { d.position.y = REST + (1 - p) * 3.4; }, ease.out); d.position.y = REST;
}
async function flipDisc(s, to, delay) {
  const d = discs.get(s); if (!d) return; await sleep(delay); const r0 = d.rotation.x, r1 = to > 0 ? 0 : Math.PI, dir = r1 > r0 ? 1 : -1; d.userData.color = to;
  O.sfx('tick'); await tween(520, (p) => { d.rotation.x = r0 + (r1 - r0) * p; d.position.y = REST + Math.sin(p * Math.PI) * 1.6; }); d.rotation.x = r1; d.position.y = REST;
}
async function animateMove(rec) {
  marks.dot.clear(); marks.hint.clear(); marks.bad.clear(); marks.last = rec.s; refreshMarkers();
  await dropDisc(rec.s, rec.color); refreshMarkers();
  const cx0 = cxOf(rec.s), cy0 = cyOf(rec.s);
  await Promise.all(rec.flips.map((f) => flipDisc(f, rec.color, (Math.max(Math.abs(cxOf(f) - cx0), Math.abs(cyOf(f) - cy0)) - 1) * 130)));
  updateScore();
}

/* ---------- 대국 ---------- */
function turnText() { if (mode === 'two') return colName(game.turn) + ' 차례예요. 초록 점을 눌러요.'; return game.turn === myColor ? '내 차례예요. 초록 점을 눌러요.' : '컴퓨터가 생각해요…'; }
async function afterMove(rec, human) {
  const rid = runId;
  if (game.over()) return endGame();
  if (rec.passed) { const who = rec.passed; say(colName(who) + (mode === 'play' ? (who === myColor ? '(나)' : '(컴퓨터)') : '') + '은 둘 곳이 없어서 차례를 넘겨요.', 'warn', colName(who) + '은 둘 곳이 없어서 차례를 넘겨요.'); await sleep(1300); if (rid !== runId) return; }
  if (mode === 'play' && game.turn !== myColor) return aiTurn();
  showLegal(); if (!rec.passed) note(turnText());
}
async function humanTap(s) {
  if (!isHumanTurn()) return; O.unlock();
  if (game.board[s]) return;
  if (!game.legal(s)) { stats.mistakes++; O.sfx('no'); say('거기는 놓을 수 없어요. 상대 돌을 끼울 수 있는 초록 점만 가능해요.', 'warn', '거기는 놓을 수 없어요.'); return; }
  busy = true; updateButtons(); const rec = game.play(s); await animateMove(rec); busy = false; updateButtons(); await afterMove(rec, true);
}
async function aiTurn() {
  busy = true; updateButtons(); note('컴퓨터가 생각하고 있어요…'); const rid = runId; clearMarks(true);
  await sleep(450); if (rid !== runId || over) return;
  const t0 = Date.now(), m = E.ai.choose(game, level); await sleep(Math.max(0, 500 - (Date.now() - t0))); if (rid !== runId || over) return;
  const rec = game.play(m.s); await animateMove(rec); if (rid !== runId) return; busy = false; updateButtons(); await afterMove(rec, false);
}
const HINT_TXT = { corner: '구석이에요! 구석은 절대 뒤집히지 않아요.', mobility: '상대가 둘 곳이 거의 없어져요.', many: '돌을 많이 뒤집을 수 있어요.', edge: '가장자리는 뒤집히기 어려워 안전해요.', good: '노란 동그라미가 좋은 자리예요.' };
function doHint() {
  if (over || busy) return; O.unlock(); stats.asked++;
  if (mode === 'learn') { if (!pz || pz.done) return; clearMarks(true); marks.hint.add(pz.cur.sol[0]); showLegalKeep(); say('노란 동그라미 자리를 눌러 보세요.', 'good'); return; }
  if (!isHumanTurn()) return; const h = E.ai.hint(game); marks.hint.clear(); marks.hint.add(h.s); refreshMarkers(); say(HINT_TXT[h.why], 'good');
}
function showLegalKeep() { if (assistOn) game.moves().forEach((s) => marks.dot.add(s)); refreshMarkers(); }
function doUndo() {
  if (busy || over || !(mode === 'play' || mode === 'two') || !game.stack.length) return;
  let n = 0; do { if (!game.undo()) break; n++; } while (mode === 'play' && game.turn !== myColor && game.stack.length); if (!n) return;
  syncBoard(); clearMarks(); const l = game.stack[game.stack.length - 1]; marks.last = l ? l.s : -1; showLegal(); updateButtons(); O.sfx('tick'); say('한 수 물렸어요. 다시 해 보세요!', null, '한 수 물렸어요.');
}
function updateButtons() { $('btnUndo').disabled = busy || over || !(mode === 'play' || mode === 'two') || !game.stack.length; $('btnHint').disabled = over || busy || (mode !== 'learn' && !isHumanTurn()); }

function endGame() {
  const rid = runId; over = true; busy = false; updateButtons(); clearMarks(true); updateScore();
  const c = game.count(), w = game.winner(); let title, text, stars, speak;
  text = '⚫ ' + c.b + ' 대 ⚪ ' + c.w;
  if (!w) { title = '비겼어요!'; stars = 2; speak = '비겼어요!'; }
  else { const humanWon = mode === 'two' || w === myColor; title = mode === 'two' ? colName(w) + ' 이겼어요!' : humanWon ? '이겼어요! 대단해요!' : '아쉬워요. 다음엔 이길 수 있어요!'; stars = humanWon ? 3 : 1; speak = humanWon ? '이겼어요! 정말 잘했어요!' : '아쉽지만 끝까지 잘했어요. 한 번 더 해 볼까요?'; }
  say(title + ' ' + text, w ? 'good' : null, false);
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(오셀로)', school: 'elem', topic: '3D 오셀로', level: mode === 'play' ? level : 1, engine: 'othello',
    rounds: game.stack.length, mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: () => startGame({ mode, level, color: myColor }) }];
  if (mode === 'play' && stars === 3 && level < 5) btns.push({ label: '⬆ 다음 수준 (' + (level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, level + 1); startGame({ mode, level: level + 1, color: myColor }); } });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 1800);
}
function resetState() { over = false; busy = false; runId++; clearMarks(); marks.last = -1; stats = O.newStats(); pz = null; game = new E.Game(); }
function startGame(cfg) {
  resetState(); mode = cfg.mode; level = cfg.level || 3; myColor = cfg.color || 1; if (mode === 'play') O.rememberLevel(LESSON, level);
  $('menu').hidden = true; $('modeLabel').textContent = mode === 'play' ? '컴퓨터와 대국 · 수준 ' + level : '둘이서 대국'; syncBoard(); updateButtons();
  S.setView(mode === 'play' && myColor < 0 ? Math.PI : 0, false, 0.66);
  if (mode === 'play' && myColor < 0) { say('컴퓨터가 먼저 시작해요.'); aiTurn(); } else { showLegal(); say(mode === 'two' ? '검은 돌부터 시작해요. 초록 점을 눌러요.' : '내가 검은 돌이에요. 초록 점을 눌러 시작해요!'); }
}

/* ---------- 연습 문제 ---------- */
function startLearn(cfg) {
  resetState(); mode = 'learn'; $('menu').hidden = true; $('modeLabel').textContent = '연습 문제 · ' + TYPE_NAME[cfg.type]; O.rememberLevel(LEARN_LESSON, cfg.type || 1);
  pz = { type: cfg.type, idx: 0, total: 5, wrong: 0, cur: null, done: false }; S.setView(0, false, 0.66); updateButtons(); nextPuzzle();
}
function nextPuzzle() {
  const p = E.puzzle(pz.type); pz.cur = p; pz.wrong = 0; pz.done = false; pz.idx++;
  game = new E.Game(); game.board.set(p.board); game.turn = p.turn; game.stack = []; clearMarks(); syncBoard(); showLegal();
  const tasks = ['', colName(p.turn) + ' 차례! 초록 점 중 한 곳을 눌러서 상대 돌을 뒤집어 봐요.', colName(p.turn) + ' 차례! 두 방향 이상으로 뒤집는 곳을 찾아요.', colName(p.turn) + ' 차례! 가장 좋은 자리는 어디일까요? (구석을 찾아봐요)', colName(p.turn) + ' 차례! 구석 옆의 위험한 칸을 피해서 안전한 곳에 둬요.', colName(p.turn) + ' 차례! 상대가 둘 곳이 가장 적어지는 곳은 어디일까요?'];
  say('문제 ' + pz.idx + '/' + pz.total + ' · ' + tasks[p.type], null, tasks[p.type]);
}
async function learnTap(s) {
  if (!pz || pz.done || busy) return; O.unlock(); if (game.board[s]) return;
  const p = pz.cur;
  if (!game.legal(s)) { stats.mistakes++; O.sfx('no'); say('거기는 놓을 수 없어요. 초록 점만 눌러요. 상대 돌을 끼울 수 있어야 해요.', 'warn', '거기는 놓을 수 없어요.'); return; }
  if (p.sol.indexOf(s) >= 0) {
    pz.done = true; busy = true; const rid = runId, nFlip = game.flips(s, game.turn).length; const rec = game.play(s); await animateMove(rec); O.sfx('ok');
    say(p.type === 1 ? '돌 ' + nFlip + '개를 뒤집었어요! 끼인 상대 돌은 모두 내 색으로 바뀌어요.' : DONE[p.type], 'good'); await sleep(2300); busy = false; if (rid !== runId) return;
    if (pz.idx >= pz.total) return learnDone(); nextPuzzle(); return;
  }
  pz.wrong++; stats.mistakes++; O.sfx('no'); let why = WHY[p.type];
  if (p.type === 2) why = '거기는 한 방향만 뒤집어요. 두 방향 이상 끼우는 곳을 찾아요.';
  else if (p.type === 3) why = '돌을 많이 뒤집는 곳이 항상 좋은 건 아니에요. 구석에 둘 수 있는 곳이 있어요!';
  else if (p.type === 4) why = '거기는 구석 옆 칸이라서 상대가 구석을 가져갈 수 있어요. 다른 곳을 골라요.';
  else if (p.type === 5) { const h = game.copy(); h.play(s); why = '거기에 두면 상대가 ' + (h.turn === game.turn ? '또' : h.moves(h.turn).length + '곳에') + ' 둘 수 있어요. 더 적어지는 곳을 찾아요.'; }
  say(why, 'warn');
  if (pz.wrong >= 2) { marks.hint.clear(); marks.hint.add(p.sol[0]); refreshMarkers(); }
}
function learnDone() {
  const rid = runId, m = stats.mistakes; over = true; updateButtons();
  const stars = m <= 1 ? 3 : m <= 4 ? 2 : 1, t = pz.type, label = TYPE_NAME[t];
  const entry = { at: new Date().toISOString(), lesson: LEARN_LESSON, subject: 'play', subjectName: '놀이(오셀로)', school: 'elem', topic: '3D 오셀로 연습', level: t || 1, engine: 'othello-learn',
    rounds: pz.total, mistakes: m, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const btns = [{ label: '🔁 새 문제', color: 'green', onClick: () => startLearn({ type: t }) }];
  if (t && t < 5 && stars === 3) btns.push({ label: '⬆ 다음 종류: ' + TYPE_NAME[t + 1], color: 'orange', onClick: () => startLearn({ type: t + 1 }) });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title: '연습 문제를 다 풀었어요!', text: label + ' 문제 ' + pz.total + '개 · 틀린 횟수 ' + m + '번', speak: '문제를 다 풀었어요! 정말 잘했어요!', mission: { lesson: 1 }, buttons: btns }); }, 400);
}

/* ---------- 메뉴 ---------- */
const DEFAULT_PREFS = { mode: 'learn', color: 1, type: 1 };
const prefs = (() => { try { return Object.assign({}, DEFAULT_PREFS, JSON.parse(localStorage.getItem('oks_othello_prefs_v1') || '{}')); } catch (e) { return Object.assign({}, DEFAULT_PREFS); } })();
function savePrefs() { try { localStorage.setItem('oks_othello_prefs_v1', JSON.stringify(prefs)); } catch (e) {} }
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  const sel = { mode: prefs.mode, color: prefs.color, type: prefs.type, playLv: O.levelFor(LESSON) };
  const chip = (cls, val, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + cls + '="' + val + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    const modes = [['learn', '🎓', '연습 문제', '뒤집기·구석·전략'], ['play', '🤖', '컴퓨터와 대국', '수준을 골라요'], ['two', '👫', '둘이서 대국', '친구와 번갈아']];
    let opt = '';
    if (sel.mode === 'learn') opt = '<div class="ch-row"><label>문제 종류</label>' + TYPE_NAME.map((n, i) => chip('type', i, i ? i + '. ' + n : n, '', sel.type === i)).join('') + '</div><p class="why">' + (sel.type ? WHY[sel.type] : '다섯 종류를 섞어서 내요.') + '</p>';
    else if (sel.mode === 'play') opt = '<div class="ch-row"><label>컴퓨터 수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('plv', l, l, LEVEL_NAME[l], sel.playLv === l)).join('') + '</div><div class="ch-row"><label>내 돌</label>' + chip('color', 1, '⚫ 검은 돌', '먼저 시작', sel.color === 1) + chip('color', -1, '⚪ 흰 돌', '나중에', sel.color === -1) + '</div>';
    el.innerHTML = '<div class="ch-card"><h1>⚫⚪ 3D 오셀로</h1><p>상대 돌을 끼워서 내 색으로 뒤집어요. 마지막에 돌이 많은 쪽이 이겨요.</p><div class="ch-modes">' +
      modes.map((m) => '<button type="button" class="ch-mode' + (sel.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '"><i>' + m[1] + '</i><b>' + m[2] + '</b><span>' + m[3] + '</span></button>').join('') + '</div>' + opt +
      '<button type="button" class="ch-go" id="goBtn">시작!</button>' + (mode && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { sel.mode = b.dataset.mode; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-type]').forEach((b) => { b.onclick = () => { sel.type = +b.dataset.type; render(); }; });
    el.querySelectorAll('[data-plv]').forEach((b) => { b.onclick = () => { sel.playLv = +b.dataset.plv; render(); }; });
    el.querySelectorAll('[data-color]').forEach((b) => { b.onclick = () => { sel.color = +b.dataset.color; render(); }; });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => { O.unlock(); Object.assign(prefs, { mode: sel.mode, color: sel.color, type: sel.type }); savePrefs(); el.hidden = true;
      if (sel.mode === 'learn') startLearn({ type: sel.type }); else startGame({ mode: sel.mode, level: sel.playLv, color: sel.color }); };
  }
  render(); O.say('3D 오셀로예요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 입력 ---------- */
function cellAt(clientX, clientY) {
  const p = S.planePoint(clientX, clientY, 0.1); if (!p) return -1;
  const gx = Math.floor(p.x / SQ + 4), gy = Math.floor(p.z / SQ + 4); if (gx < 0 || gy < 0 || gx > 7 || gy > 7) return -1; return gy * 8 + gx;
}
S.onTap((x, y) => { const s = cellAt(x, y); if (s < 0) return; if (mode === 'learn') learnTap(s); else humanTap(s); });
S.wireButtons({ menu: () => openMenu(false) });
$('btnUndo').onclick = doUndo; $('btnHint').onclick = doHint;
$('btnAssist').onclick = (e) => { assistOn = !assistOn; e.currentTarget.setAttribute('aria-pressed', assistOn); e.currentTarget.textContent = assistOn ? '✅ 둘 수 있는 곳 보기' : '⬜ 둘 수 있는 곳 숨김'; if (mode) { marks.dot.clear(); if (!busy) showLegal(); } };
S.setAlive(() => marks.dot.size || marks.hint.size);
S.onFrame((dt, t) => { const k = 1 + Math.sin(t * 5) * 0.12; pool.forEach((m) => { if (m.visible && m.userData.kind !== 'last') m.scale.setScalar(k); }); });

(async function boot() {
  try { await loadModel(); } catch (e) { S.failLoading('오셀로판 모델을 불러오지 못했어요.'); return; }
  syncBoard(); S.start(); S.setView(0, true, 0.66); S.hideLoading(); say('놀이를 골라 주세요.', null, false); updateButtons(); openMenu(true);
})();

/* 시험용 손잡이 */
window.__othello = {
  game: () => game, mode: () => mode, over: () => over, busy: () => busy, puzzle: () => pz, discCount: () => discs.size, marks,
  tap: (s) => (mode === 'learn' ? learnTap(s) : humanTap(s)), start: startGame, startLearn, openMenu,
  screen(s) { return S.screenOf(new THREE.Vector3(wx(s), 0.2, wz(s))); }
};
