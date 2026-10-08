/* 옥쌤의 즐거운 교실 — 3D 오목 (놀이별 · 전략놀이)
   공통 3D 바탕(common3d.js) + 규칙 엔진(engine.js). 바둑돌 모델은 ../go/assets/stones.glb, 판은 코드로 그립니다.
   모드: 연습 문제(이기기·막기·열린 3·사삼) / 컴퓨터와 대국 / 둘이서 대국 */
import { createStage, THREE, woodCanvas, canvasTexture } from '../common3d.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';

const E = window.OKS_OMOK, O = window.OKS;
const LESSON = 'play-omok', LEARN_LESSON = 'play-omok-learn';
const N = 15, SP = 1.3, HALF = 7 * SP, EDGE = 1.15, TOP = 0, STONE_D = SP * 0.94, STONE_Y = 0.78;
const LEVEL_NAME = ['', '아주 쉬워요', '쉬워요', '보통', '어려워요', '아주 어려워요'];
const TYPE_NAME = ['섞어서', '이기는 수', '막는 수', '열린 4 만들기', '열린 3 막기', '사삼·삼삼'];
const cx = (s) => s % N, cy = (s) => (s / N) | 0;
const wx = (s) => (cx(s) - 7) * SP, wz = (s) => (cy(s) - 7) * SP;
const colName = (c) => (c > 0 ? '검은 돌' : '흰 돌');

const S = createStage({ extent: 17, bg: 0x5b4a30, tableColor: 0x3b4f3f, tableY: -0.9, pol: 0.62, minDist: 25, targetY: 0, sunPos: [10, 22, 12] });
const { $, scene, say, note, sleep, tween, ease, poke, calm } = S;

/* ---------- 판 ---------- */
function boardTexture() {
  const px = 1024, c = woodCanvas(px, px, '#d9a85b', 11), g = c.getContext('2d'), k = px / (2 * (HALF + EDGE));
  const P = (i) => ((i - 7) * SP + HALF + EDGE) * k;
  g.strokeStyle = '#3a2a16'; g.lineWidth = 2.2; g.beginPath();
  for (let i = 0; i < N; i++) { g.moveTo(P(i), P(0)); g.lineTo(P(i), P(N - 1)); g.moveTo(P(0), P(i)); g.lineTo(P(N - 1), P(i)); }
  g.stroke(); g.lineWidth = 4.5; g.strokeRect(P(0), P(0), P(N - 1) - P(0), P(N - 1) - P(0));
  g.fillStyle = '#2b1d0e'; [3, 7, 11].forEach((a) => [3, 7, 11].forEach((b) => { g.beginPath(); g.arc(P(a), P(b), 5.5, 0, 7); g.fill(); }));
  return canvasTexture(c, 8);
}
const side = new THREE.MeshStandardMaterial({ map: canvasTexture(woodCanvas(256, 64, '#b98a45', 5)), roughness: 0.7 });
const topMat = new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.55 });
const board = new THREE.Mesh(new THREE.BoxGeometry(2 * (HALF + EDGE), 1.0, 2 * (HALF + EDGE)), [side, side, topMat, side, side, side]);
board.position.y = TOP - 0.5; board.receiveShadow = true; board.castShadow = true; scene.add(board);
const feet = new THREE.Mesh(new THREE.BoxGeometry(2 * (HALF + EDGE) - 1.2, 0.5, 2 * (HALF + EDGE) - 1.2), side); feet.position.y = TOP - 1.2; scene.add(feet);
const stoneLayer = new THREE.Group(); scene.add(stoneLayer);
const markLayer = new THREE.Group(); scene.add(markLayer);

/* ---------- 바둑돌 (GLB) ---------- */
let stoneProto = {};
async function loadStones() {
  const gltf = await new GLTFLoader().loadAsync('../go/assets/stones.glb');
  gltf.scene.traverse((o) => { if (o.isMesh) { const n = o.name.toLowerCase(); if (n.indexOf('white') >= 0) stoneProto[-1] = o; else if (n.indexOf('black') >= 0) stoneProto[1] = o; } });
  if (!stoneProto[1] || !stoneProto[-1]) throw new Error('stones');
  [1, -1].forEach((c) => { const m = stoneProto[c].material = stoneProto[c].material.clone(); if (m) { m.metalness = 0; m.roughness = c > 0 ? 0.3 : 0.38; m.color.set(c > 0 ? 0x1c1c20 : 0xf4f1ea); if (m.map) m.map = null; if (m.emissive) m.emissive.set(c > 0 ? 0x000000 : 0x2a2a28); } });
}
function makeStone(color) { const m = stoneProto[color].clone(); m.material = stoneProto[color].material; m.scale.set(STONE_D, STONE_D * STONE_Y, STONE_D); m.castShadow = true; m.receiveShadow = true; m.userData.rest = STONE_D * STONE_Y * 0.2; return m; }

/* ---------- 표시(마커) ---------- */
const ringGeo = new THREE.RingGeometry(SP * 0.34, SP * 0.46, 28), dotGeo = new THREE.CircleGeometry(SP * 0.14, 20);
const MARK_COL = { hint: 0xffd23c, danger: 0xff4a3a, win: 0x35c46a, warn: 0xff9d2e, last: 0xe0392b };
const marks = { hint: new Set(), danger: new Set(), win: new Set(), warn: new Set(), last: -1 };
const markPool = []; let markUsed = 0;
function markMesh(kind) {
  let m = markPool[markUsed]; if (!m) { m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; markPool.push(m); markLayer.add(m); }
  markUsed++; m.visible = true; m.material.color.setHex(MARK_COL[kind]); m.geometry = kind === 'last' ? dotGeo : ringGeo; m.userData.kind = kind; return m;
}
function refreshMarkers() {
  markUsed = 0;
  ['hint', 'danger', 'win', 'warn'].forEach((k) => marks[k].forEach((s) => { const m = markMesh(k); m.position.set(wx(s), TOP + 0.06, wz(s)); }));
  if (marks.last >= 0 && stones.has(marks.last)) { const m = markMesh('last'); m.position.set(wx(marks.last), TOP + STONE_D * STONE_Y * 0.4 + 0.03, wz(marks.last)); }
  for (let i = markUsed; i < markPool.length; i++) markPool[i].visible = false;
  poke(300);
}
const clearMarks = (keepLast) => { ['hint', 'danger', 'win', 'warn'].forEach((k) => marks[k].clear()); if (!keepLast) marks.last = -1; refreshMarkers(); };

/* ---------- 상태 ---------- */
let game = new E.Game(), mode = null, level = 3, myColor = 1, busy = false, over = false, stats = O.newStats(), runId = 0, assistOn = true;
const stones = new Map();
let pz = null;                                   // 연습 문제 진행 {type, idx, total, wrong, cur, mistakes}
let winCells = [];
const isHumanTurn = () => !over && !busy && (mode === 'two' || (mode === 'play' && game.turn === myColor));

function clearStones() { stones.forEach((m) => stoneLayer.remove(m)); stones.clear(); }
function dropStone(s, color, animate) {
  const m = makeStone(color), rest = TOP + m.userData.rest; m.position.set(wx(s), rest, wz(s)); stoneLayer.add(m); stones.set(s, m); poke(500);
  if (!animate) return Promise.resolve();
  m.position.y = rest + 3.2; OKS_PIECE.place();
  return tween(380, (p) => { m.position.y = rest + (1 - p) * 3.2; m.scale.set(STONE_D, STONE_D * STONE_Y * (0.7 + 0.3 * p), STONE_D); }, ease.out).then(() => { m.scale.set(STONE_D, STONE_D * STONE_Y, STONE_D); m.position.y = rest; });
}
function syncBoard() { clearStones(); for (let s = 0; s < N * N; s++) if (game.board[s]) dropStone(s, game.board[s], false); }
const setBoardLabel = (t) => { $('modeLabel').textContent = t; };

/* ---------- 알려주기(코치) ---------- */
function coach() {
  clearMarks(true); if (over) return;
  const me = game.turn, mine = game.winCells(me), theirs = game.winCells(-me);
  if (!assistOn) return;
  if (mine.length) { mine.forEach((s) => marks.win.add(s)); refreshMarkers(); note('이길 수 있는 곳이 있어요! 초록 동그라미를 눌러 보세요.', 'good'); return; }
  if (theirs.length) { theirs.forEach((s) => marks.danger.add(s)); refreshMarkers(); say(colName(-me) + ' 4개가 이어졌어요! 빨간 동그라미를 막아요!', 'warn'); return; }
  const open = []; game.candidates(2).forEach((s) => { const sh = game.shapes(cx(s), cy(s), -me); if (sh.open4 || sh.four >= 2 || (sh.four && sh.open3)) open.push(s); });
  if (open.length) { open.forEach((s) => marks.warn.add(s)); refreshMarkers(); say('조심! ' + colName(-me) + ' 열린 4를 만들려고 해요. 주황 동그라미 중 한 곳을 먼저 막아요.', 'warn'); return; }
  refreshMarkers();
}
function turnText() { if (mode === 'two') return colName(game.turn) + ' 차례예요.'; return game.turn === myColor ? '내 차례예요. 놓을 곳을 눌러요.' : '컴퓨터가 생각해요…'; }

/* ---------- 대국 ---------- */
async function placeMove(s, human) {
  const rec = game.place(cx(s), cy(s)); if (!rec) return; clearMarks(); marks.last = s;
  await dropStone(s, rec.color, true); refreshMarkers(); updateButtons();
  const st = game.status();
  if (st === 'win') return endGame('win', game.win.color);
  if (st === 'draw') return endGame('draw');
  if (mode === 'play' && game.turn !== myColor) return aiTurn();
  coach(); if (!document.querySelector('.ch-msg.warn')) note(turnText());
}
async function humanTap(s) {
  if (!isHumanTurn() || game.board[s]) return; O.unlock(); busy = true; updateButtons(); await placeMove(s, true); busy = false; updateButtons();
}
async function aiTurn() {
  busy = true; updateButtons(); note('컴퓨터가 생각하고 있어요…'); const rid = runId;
  await sleep(450); if (rid !== runId || over) return;
  const t0 = Date.now(), m = E.ai.choose(game, level); await sleep(Math.max(0, 500 - (Date.now() - t0)));
  if (rid !== runId || over) return;
  await placeMove(m.s, false); busy = false; updateButtons();
}
function doHint() {
  if (over) return; O.unlock();
  if (mode === 'learn') { if (!pz || pz.done) return; stats.asked++; clearMarks(true); marks.hint.add(pz.cur.sol[0]); refreshMarkers(); say('노란 동그라미 자리를 눌러 보세요.', 'good'); return; }
  if (!isHumanTurn()) return; stats.asked++;
  const h = E.ai.hint(game); clearMarks(true); marks.hint.add(h.s); refreshMarkers();
  say(h.why === 'win' ? '여기에 두면 5개! 이겨요!' : h.why === 'block' ? '상대가 5개를 만들려 해요. 여기를 막아요!' : '노란 동그라미가 좋은 자리예요.', 'good');
}
function doUndo() {
  if (busy || over || !(mode === 'play' || mode === 'two') || !game.stack.length) return;
  let n = 0; do { if (!game.undo()) break; n++; } while (mode === 'play' && game.turn !== myColor && game.stack.length);
  if (!n) return; syncBoard(); clearMarks(); const l = game.stack[game.stack.length - 1]; marks.last = l ? l.s : -1; refreshMarkers(); updateButtons(); O.sfx('tick');
  say('한 수 물렸어요. 다시 해 보세요!', null, '한 수 물렸어요.'); coach();
}
function updateButtons() {
  $('btnUndo').disabled = busy || over || !(mode === 'play' || mode === 'two') || !game.stack.length;
  $('btnHint').disabled = over || (mode !== 'learn' && !isHumanTurn() && !(mode === 'play' && !busy && game.turn === myColor));
}

function endGame(kind, winner) {
  const rid = runId; over = true; busy = false; updateButtons(); clearMarks(true);
  let title, text, stars, speak;
  if (kind === 'win') {
    winCells = game.win.cells.slice(); winCells.forEach((s) => marks.win.add(s)); refreshMarkers(); winJump();
    const humanWon = mode === 'two' || winner === myColor;
    title = mode === 'two' ? colName(winner) + ' 이겼어요!' : humanWon ? '오목! 이겼어요!' : '아쉬워요. 다음엔 이길 수 있어요!';
    text = '같은 색 돌 ' + winCells.length + '개가 한 줄로 이어졌어요.'; stars = humanWon ? 3 : 1;
    speak = humanWon ? '오목! 정말 잘했어요!' : '아쉽지만 끝까지 잘했어요. 한 번 더 해 볼까요?';
  } else { title = '비겼어요!'; text = '판이 가득 찼어요.'; stars = 2; speak = title; }
  const entry = { at: new Date().toISOString(), lesson: LESSON, subject: 'play', subjectName: '놀이(오목)', school: 'elem', topic: '3D 오목', level: mode === 'play' ? level : 1, engine: 'omok',
    rounds: Math.ceil(game.stack.length / 2), mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const btns = [{ label: '🔁 한 번 더', color: 'green', onClick: () => startGame({ mode, level, color: myColor }) }];
  if (mode === 'play' && stars === 3 && level < 5) btns.push({ label: '⬆ 다음 수준 (' + (level + 1) + ')', color: 'orange', onClick: () => { O.rememberLevel(LESSON, level + 1); startGame({ mode, level: level + 1, color: myColor }); } });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title, text, speak, mission: { lesson: 1 }, buttons: btns }); }, 1500);
}
async function winJump() { const arr = winCells.slice(); for (let i = 0; i < arr.length; i++) { const m = stones.get(arr[i]); if (m) tween(420, (p) => { m.position.y = m.userData.rest + Math.sin(p * Math.PI) * 0.9; }); await sleep(90); } }

function resetState() { over = false; busy = false; runId++; clearMarks(); marks.last = -1; winCells = []; stats = O.newStats(); pz = null; game = new E.Game(); clearStones(); }
function startGame(cfg) {
  resetState(); mode = cfg.mode; level = cfg.level || 3; myColor = cfg.color || 1; if (mode === 'play') O.rememberLevel(LESSON, level);
  $('menu').hidden = true; setBoardLabel(mode === 'play' ? '컴퓨터와 대국 · 수준 ' + level : '둘이서 대국'); updateButtons();
  S.setView(mode === 'play' && myColor < 0 ? Math.PI : 0, false, 0.62);
  if (mode === 'play' && myColor < 0) { say('컴퓨터가 먼저 시작해요.'); aiTurn(); } else say(mode === 'two' ? '검은 돌부터 시작해요. 놓을 곳을 눌러요.' : '내가 검은 돌이에요. 가운데 근처를 눌러 시작해요!');
}

/* ---------- 연습 문제 ---------- */
const TASK = ['', '검은 돌 차례! 한 번에 5개를 이을 수 있는 곳을 눌러요.', '흰 돌이 4개를 이었어요! 5개가 되기 전에 막아요.', '검은 돌 3개가 열려 있어요. 열린 4를 만들어요!',
  '흰 돌이 열린 3을 만들었어요. 열린 4가 되기 전에 막아요.', '한 수로 두 가지 공격을 동시에 만들어요! (4·3 또는 3·3)'];
const WHY = ['', '5개를 이으면 바로 이겨요. 4개짜리 줄의 빈 곳(끝이나 가운데)을 찾아요.', '막지 않으면 흰 돌이 5개를 이어서 져요. 5가 되는 빈 곳을 막아요.',
  '3개 줄 옆에 한 개 더 놓아서 양쪽이 모두 열린 4를 만들어요. 열린 4는 막을 수 없어요!', '열린 3을 그대로 두면 열린 4가 돼서 져요. 줄의 바로 옆 끝을 막아요.', '4와 3이 한꺼번에 생기는 자리, 또는 열린 3이 두 개 생기는 자리를 찾아요.'];
const DONE = ['', '5개 완성! 4개짜리 줄을 만들어 두면 이길 수 있어요.', '잘 막았어요! 상대가 4개를 이으면 바로 막아야 해요.', '열린 4 완성! 양쪽 끝을 한꺼번에 막을 수 없어요.',
  '잘 막았어요! 열린 3은 열린 4가 되기 전에 막는 게 좋아요.', '두 갈래 공격 성공! 상대는 한쪽밖에 못 막아요.'];
function startLearn(cfg) {
  resetState(); mode = 'learn'; $('menu').hidden = true; setBoardLabel('연습 문제 · ' + TYPE_NAME[cfg.type]);
  O.rememberLevel(LEARN_LESSON, cfg.type || 1); pz = { type: cfg.type, idx: 0, total: 5, wrong: 0, cur: null, done: false }; S.setView(0, false, 0.62); updateButtons(); nextPuzzle();
}
function nextPuzzle() {
  const p = E.puzzle(pz.type); pz.cur = p; pz.wrong = 0; pz.done = false; game = new E.Game(); clearStones(); clearMarks();
  p.black.forEach((s) => { game.board[s] = 1; game.stack.push({ x: cx(s), y: cy(s), color: 1, s }); }); p.white.forEach((s) => { game.board[s] = -1; game.stack.push({ x: cx(s), y: cy(s), color: -1, s }); }); game.turn = 1; game.win = null;
  syncBoard(); pz.idx++; const rid = runId;
  say('문제 ' + pz.idx + '/' + pz.total + ' · ' + TASK[p.type], null, TASK[p.type]); poke(600);
  if (rid !== runId) return;
}
async function learnTap(s) {
  if (!pz || pz.done || busy) return; O.unlock();
  if (game.board[s]) { note('돌이 있는 곳이에요. 빈 곳을 눌러요.'); return; }
  const p = pz.cur;
  if (p.sol.indexOf(s) >= 0) {
    pz.done = true; busy = true; clearMarks(); const rid = runId;
    game.place(cx(s), cy(s)); marks.last = s; await dropStone(s, 1, true); refreshMarkers();
    if (p.type === 1 && game.win) { winCells = game.win.cells.slice(); winCells.forEach((q) => marks.win.add(q)); refreshMarkers(); winJump(); }
    O.sfx('ok'); say(DONE[p.type], 'good'); await sleep(2000); busy = false; if (rid !== runId) return;
    if (pz.idx >= pz.total) return learnDone(); nextPuzzle(); return;
  }
  pz.wrong++; stats.mistakes++; O.sfx('no');
  let why = WHY[p.type];
  const h = game.copy(); h.place(cx(s), cy(s));   // 잘못 두면 어떻게 되는지 보여 줘요(실제로 놓지는 않아요)
  if (p.type === 2 && h.winCells(-1).length) why = '거기는 아니에요. 흰 돌이 5개를 이을 수 있는 곳이 남아 있어요.';
  else if (p.type === 4) { let open = false; h.candidates(3).forEach((t) => { if (!h.board[t]) { const sh = h.shapes(cx(t), cy(t), -1); if (sh.open4 || sh.five) open = true; } }); if (open) why = '거기는 아니에요. 흰 돌이 열린 4를 만들 수 있어요. 3개 줄의 바로 옆 끝을 막아요.'; }
  else if (p.type === 1) why = '거기는 아직 5개가 안 돼요. ' + why;
  say(why, 'warn');
  if (pz.wrong >= 2) { clearMarks(true); marks.hint.add(p.sol[0]); refreshMarkers(); }
}
function learnDone() {
  const rid = runId, m = pz.type ? stats.mistakes : stats.mistakes; over = true; updateButtons();
  const stars = m <= 1 ? 3 : m <= 4 ? 2 : 1, label = TYPE_NAME[pz.type];
  const entry = { at: new Date().toISOString(), lesson: LEARN_LESSON, subject: 'play', subjectName: '놀이(오목)', school: 'elem', topic: '3D 오목 연습', level: pz.type || 1, engine: 'omok-learn',
    rounds: pz.total, mistakes: stats.mistakes, glow: 0, hand: 0, asked: stats.asked, sec: Math.round((Date.now() - stats.t0) / 1000) };
  const t = pz.type, btns = [{ label: '🔁 새 문제', color: 'green', onClick: () => startLearn({ type: t }) }];
  if (t && t < 5 && stars === 3) btns.push({ label: '⬆ 다음 종류: ' + TYPE_NAME[t + 1], color: 'orange', onClick: () => startLearn({ type: t + 1 }) });
  btns.push({ label: '☰ 다른 놀이', color: 'blue', onClick: () => openMenu(true) });
  setTimeout(() => { if (rid === runId) O.finish({ stats, entry, stars, title: '연습 문제를 다 풀었어요!', text: label + ' 문제 ' + pz.total + '개 · 틀린 횟수 ' + stats.mistakes + '번', speak: '문제를 다 풀었어요! 정말 잘했어요!', mission: { lesson: 1 }, buttons: btns }); }, 400);
}

/* ---------- 메뉴 ---------- */
const DEFAULT_PREFS = { mode: 'learn', color: 1, type: 1 };
const prefs = (() => { try { return Object.assign({}, DEFAULT_PREFS, JSON.parse(localStorage.getItem('oks_omok_prefs_v1') || '{}')); } catch (e) { return Object.assign({}, DEFAULT_PREFS); } })();
function savePrefs() { try { localStorage.setItem('oks_omok_prefs_v1', JSON.stringify(prefs)); } catch (e) {} }
function openMenu(fromFinish) {
  const el = $('menu'); el.hidden = false; document.querySelectorAll('.oks-overlay').forEach((x) => x.remove());
  const sel = { mode: prefs.mode, color: prefs.color, type: prefs.type, playLv: O.levelFor(LESSON) };
  const chip = (cls, val, label, small, on) => '<button type="button" class="ch-chip' + (on ? ' on' : '') + '" data-' + cls + '="' + val + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
  function render() {
    const modes = [['learn', '🎓', '연습 문제', '이기는 법·막는 법'], ['play', '🤖', '컴퓨터와 대국', '수준을 골라요'], ['two', '👫', '둘이서 대국', '친구와 번갈아']];
    let opt = '';
    if (sel.mode === 'learn') opt = '<div class="ch-row"><label>문제 종류</label>' + TYPE_NAME.map((n, i) => chip('type', i, i ? i + '. ' + n : n, '', sel.type === i)).join('') + '</div><p class="why">' + (sel.type ? WHY[sel.type] : '다섯 종류를 섞어서 내요.') + '</p>';
    else if (sel.mode === 'play') opt = '<div class="ch-row"><label>컴퓨터 수준</label>' + [1, 2, 3, 4, 5].map((l) => chip('plv', l, l, LEVEL_NAME[l], sel.playLv === l)).join('') + '</div><div class="ch-row"><label>내 돌</label>' + chip('color', 1, '⚫ 검은 돌', '먼저 시작', sel.color === 1) + chip('color', -1, '⚪ 흰 돌', '나중에', sel.color === -1) + '</div>';
    el.innerHTML = '<div class="ch-card"><h1>⚫⚪ 3D 오목</h1><p>같은 색 돌 5개를 먼저 한 줄로 이으면 이겨요.</p><div class="ch-modes">' +
      modes.map((m) => '<button type="button" class="ch-mode' + (sel.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '"><i>' + m[1] + '</i><b>' + m[2] + '</b><span>' + m[3] + '</span></button>').join('') + '</div>' + opt +
      '<button type="button" class="ch-go" id="goBtn">시작!</button>' + (mode && !fromFinish ? '<div class="ch-row"><button type="button" class="ch-chip" id="closeMenu">닫기</button></div>' : '') + '</div>';
    el.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { sel.mode = b.dataset.mode; O.unlock(); O.sfx('tick'); render(); }; });
    el.querySelectorAll('[data-type]').forEach((b) => { b.onclick = () => { sel.type = +b.dataset.type; render(); }; });
    el.querySelectorAll('[data-plv]').forEach((b) => { b.onclick = () => { sel.playLv = +b.dataset.plv; render(); }; });
    el.querySelectorAll('[data-color]').forEach((b) => { b.onclick = () => { sel.color = +b.dataset.color; render(); }; });
    const cm = $('closeMenu'); if (cm) cm.onclick = () => { el.hidden = true; };
    $('goBtn').onclick = () => {
      O.unlock(); Object.assign(prefs, { mode: sel.mode, color: sel.color, type: sel.type }); savePrefs(); el.hidden = true;
      if (sel.mode === 'learn') startLearn({ type: sel.type }); else startGame({ mode: sel.mode, level: sel.playLv, color: sel.color });
    };
  }
  render(); O.say('3D 오목이에요. 하고 싶은 놀이를 골라요.');
}

/* ---------- 입력 ---------- */
function cellAt(clientX, clientY) {
  const p = S.planePoint(clientX, clientY, TOP + 0.1); if (!p) return -1;
  const gx = Math.round(p.x / SP) + 7, gy = Math.round(p.z / SP) + 7; if (gx < 0 || gy < 0 || gx >= N || gy >= N) return -1;
  if (Math.hypot(p.x - (gx - 7) * SP, p.z - (gy - 7) * SP) > SP * 0.72) return -1; return gy * N + gx;
}
S.onTap((x, y) => { const s = cellAt(x, y); if (s < 0) return; if (mode === 'learn') learnTap(s); else humanTap(s); });
S.wireButtons({ menu: () => openMenu(false) });
$('btnUndo').onclick = doUndo; $('btnHint').onclick = doHint;
$('btnAssist').onclick = (e) => { assistOn = !assistOn; e.currentTarget.setAttribute('aria-pressed', assistOn); e.currentTarget.textContent = assistOn ? '🧭 위험 알려주기' : '⬜ 알려주기 끔'; if (mode === 'play' || mode === 'two') coach(); else { clearMarks(true); } };
S.setAlive(() => marks.hint.size || marks.danger.size || marks.win.size || marks.warn.size);
S.onFrame((dt, t) => { const k = 1 + Math.sin(t * 5) * 0.1; markPool.forEach((m) => { if (m.visible && m.userData.kind !== 'last') m.scale.setScalar(k); }); });

(async function boot() {
  try { await loadStones(); } catch (e) { S.failLoading('바둑돌 모델을 불러오지 못했어요.'); return; }
  S.start(); S.setView(0, true, 0.62); S.hideLoading(); say('놀이를 골라 주세요.', null, false); updateButtons(); openMenu(true);
})();

/* 시험용 손잡이 */
window.__omok = {
  game: () => game, mode: () => mode, over: () => over, busy: () => busy, puzzle: () => pz, stoneCount: () => stones.size, markCount: () => markUsed,
  tap: (s) => (mode === 'learn' ? learnTap(s) : humanTap(s)), start: startGame, startLearn, openMenu, marks,
  screen(s) { return S.screenOf(new THREE.Vector3(wx(s), TOP + 0.2, wz(s))); }
};
