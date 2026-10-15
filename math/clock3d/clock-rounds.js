/* 시각과 시간 — 문제 만들기(순수 계산, 화면 없음)
   makeRound(kind, level, rnd) → 한 판의 문제 그림
   kind: parts 시계 살펴보기 · hour 몇 시 · half 몇 시 30분 · min 몇 시 몇 분 · around 몇 분 전·후 · sec 초침과 초 · elapsed 걸린 시간 · ampm 오전·오후 · routine 하루 일과 순서 · table 시간표 읽기 · timer 1분 체험
   level 1~5 (느끼기 · 고르기 2개 · 해 보기 · 혼자서 4개 · 생활로)
   불러 쓰기: 브라우저(ES module)와 node 모두 */
export const pad = (n) => (n < 10 ? '0' : '') + n;
export const h12 = (t) => ((Math.floor(t / 60) + 11) % 12) + 1;
export const mm = (t) => ((t % 60) + 60) % 60;
export const norm = (t) => ((t % 1440) + 1440) % 1440;
export const isPM = (t) => Math.floor(norm(t) / 60) >= 12;
/* 말로: 3시 30분 */
export const kor = (t, ap) => (ap ? (isPM(t) ? '오후 ' : '오전 ') : '') + h12(t) + '시' + (mm(t) ? ' ' + mm(t) + '분' : '');
/* 전자시계 글씨: 3:30 */
export const dig = (t) => h12(t) + ':' + pad(mm(t));
/* 몇 분 전: 2:50 → 3시 10분 전 */
export const before = (t) => { const m = mm(t); return h12(t + 60) + '시 ' + (60 - m) + '분 전'; };
export const dur = (min) => (min >= 60 ? Math.floor(min / 60) + '시간' + (min % 60 ? ' ' + (min % 60) + '분' : '') : min + '분');

export const SCENES_HOUR = [
  [7, '🌅', '일어나는 시각'], [8, '🏫', '학교에 가는 시각'], [12, '🍚', '점심 먹는 시각'], [3, '🎒', '학교가 끝나는 시각'], [6, '🍽️', '저녁 먹는 시각'], [9, '🛏️', '잠자는 시각'], [4, '⚽', '놀이터에서 노는 시각'], [10, '📚', '책 읽는 시각']
];
export const ROUTINE = [
  { e: '🌅', txt: '일어나요', t: 7 * 60 }, { e: '🪥', txt: '이를 닦아요', t: 7 * 60 + 20 }, { e: '🍞', txt: '아침을 먹어요', t: 7 * 60 + 40 }, { e: '🚌', txt: '학교에 가요', t: 8 * 60 + 30 },
  { e: '📖', txt: '공부해요', t: 10 * 60 }, { e: '🍚', txt: '점심을 먹어요', t: 12 * 60 + 10 }, { e: '⚽', txt: '운동장에서 놀아요', t: 13 * 60 + 30 }, { e: '🏠', txt: '집에 돌아와요', t: 15 * 60 },
  { e: '🍽️', txt: '저녁을 먹어요', t: 18 * 60 }, { e: '🛁', txt: '씻어요', t: 20 * 60 }, { e: '🛏️', txt: '잠을 자요', t: 21 * 60 + 30 }
];
export const AMPM_SCENES = [
  ['🌅', '아침에 일어나요', 7, false], ['🏫', '학교에서 공부해요', 10, false], ['🍚', '점심을 먹어요', 12, true], ['⚽', '학교 끝나고 놀아요', 4, true],
  ['🍽️', '저녁을 먹어요', 6, true], ['🛏️', '밤에 잠을 자요', 9, true], ['🥣', '아침밥을 먹어요', 8, false], ['🌙', '자기 전에 이를 닦아요', 9, true]
];
export const TABLE_DEFAULT = [
  { time: '9:00', act: '국어', e: '📖' }, { time: '10:00', act: '수학', e: '🔢' }, { time: '11:00', act: '통합', e: '🎨' }, { time: '12:00', act: '점심', e: '🍚' }, { time: '1:00', act: '체육', e: '⚽' }, { time: '2:00', act: '청소', e: '🧹' }
];

/* ---------- 도구 ---------- */
function mk(rnd) {
  const r = rnd || Math.random;
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (a) => a[Math.floor(r() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return { ri, pick, shuffle };
}
/* 보기 만들기: 정답 + 틀린 것들(겹치지 않게), n개 */
function choices(right, wrongs, n, R, fill) {
  const seen = new Set([right]), list = [];
  R.shuffle(wrongs).forEach((w) => { if (w && !seen.has(w) && list.length < n - 1) { seen.add(w); list.push(w); } });
  let guard = 0;
  while (list.length < n - 1 && guard++ < 200) { const w = fill(); if (w && !seen.has(w)) { seen.add(w); list.push(w); } }
  return R.shuffle([right].concat(list)).map((l) => ({ label: l, ok: l === right }));
}
const NOPT = [1, 2, 3, 4, 4];

/* 시계 읽기: 아날로그를 보고 시각 고르기 */
function readRound(kind, level, R) {
  const mins = { hour: () => 0, half: () => 30 * R.ri(0, 1), min: () => (level >= 4 ? (level === 4 ? R.ri(1, 59) : 5 * R.ri(0, 11)) : 5 * R.ri(0, 11)) }[kind]();
  const hh = R.ri(1, 12), t = hh * 60 + mins, ok = mins;
  const asDig = level === 4 || (kind === 'min' && level === 3);
  const f = asDig ? dig : kor;
  const wrongs = [];
  if (kind === 'hour') wrongs.push(f(t + 60), f(t - 60), f(((12 - hh) % 12 || 12) * 60), f((hh + 5) * 60));
  if (kind === 'half') wrongs.push(f(t + 60), f(t - 60), f(hh * 60 + (mins ? 0 : 30)), f((hh % 12 + 1) * 60 + (mins ? 0 : 30)), f((hh + 10) % 12 * 60 + mins));
  if (kind === 'min') {
    wrongs.push(f(hh * 60 + mm(mins + 5)), f(hh * 60 + mm(mins - 5)), f(t + 60), f(t - 60), f(hh * 60 + mm(mins + 30)));
    if (mins % 5 === 0 && mins > 0) wrongs.push(f(hh * 60 + mins / 5)); /* 숫자를 그대로 분으로 읽는 실수 (7 → 7분) */
    if (mins % 5 !== 0) wrongs.push(f(hh * 60 + mm(mins + 1)), f(hh * 60 + mm(mins - 1)), f(hh * 60 + mm(mins + 10)));
  }
  const right = f(t);
  const n = NOPT[level - 1];
  const fill = () => f(R.ri(1, 12) * 60 + (kind === 'hour' ? 0 : kind === 'half' ? 30 * R.ri(0, 1) : 5 * R.ri(0, 11)));
  return {
    kind, mode: 'read', level, t, s: 0, view: 'both', dig: 'blank', ap: false,
    q: level === 1 ? '시계를 보고 시각을 눌러요' : '시계가 가리키는 시각은?', say: level === 1 ? '시계를 보고 시각을 눌러요' : '시계가 가리키는 시각은 몇 시일까요?',
    opts: choices(right, wrongs, n, R, fill), ans: right, fmt: asDig ? 'dig' : 'kor',
    explain: explainTime(t), after: 'dig'
  };
}
export function explainTime(t) {
  const m = mm(t), H = h12(t);
  if (m === 0) return '짧은바늘이 ' + H + '를, 긴바늘이 12를 가리켜요. ' + H + '시예요.';
  if (m === 30) return '짧은바늘은 ' + H + '와 ' + (H % 12 + 1) + ' 사이, 긴바늘은 6을 가리켜요. ' + H + '시 30분이에요.';
  return '짧은바늘은 ' + H + '를 지났고, 긴바늘은 ' + (m % 5 === 0 ? (m / 5) + '(' + m + '분)' : '약 ' + Math.floor(m / 5) + ' 다음 ' + (m % 5) + '칸(' + m + '분)') + '이에요. ' + H + '시 ' + m + '분이에요.';
}

/* 시각 만들기: 디지털(말)로 주어진 시각을 바늘로 맞추기 */
function setRound(kind, level, R, scene) {
  const step = kind === 'hour' ? 60 : kind === 'half' ? 30 : kind === 'around' ? 5 : (level >= 5 ? 1 : 5);
  const unit = step === 60 ? [0] : step === 30 ? [0, 30] : step === 5 && kind === 'around' ? [5, 10, 15, 20, 40, 45, 50, 55] : step === 5 ? [5, 10, 15, 20, 25, 35, 40, 45, 50, 55] : null;
  const mins = unit ? R.pick(unit) : R.ri(1, 59);
  const hh = scene ? scene[0] : R.ri(1, 12), t = hh * 60 + mins;
  let start; do { start = R.ri(1, 12) * 60 + (step === 60 ? 0 : step === 30 ? 30 * R.ri(0, 1) : 5 * R.ri(0, 11)); } while (h12(start) === h12(t) && mm(start) === mm(t));
  const text = kind === 'around' ? (mins >= 40 ? before(t) : h12(t) + '시 ' + mins + '분 후') : kor(t);
  const lifeTxt = scene ? scene[1] + ' ' + scene[2] + '은 ' + text + '이에요.' : '';
  return {
    kind, mode: 'make', level, t, start, s: 0, view: level >= 4 ? 'ana' : 'both', dig: level <= 3 ? 'time' : 'blank',
    target: { t, kind: step === 60 ? 'hour' : 'auto', step }, scene: scene ? scene[1] : null,
    q: scene ? lifeTxt + ' 바늘을 맞춰요' : text + ' 만들기', say: scene ? scene[2] + '은 ' + text + '이에요. 바늘을 끌어서 맞춰요' : text + '을 바늘로 만들어요',
    ans: kor(t), explain: explainTime(t), auto: level === 3, confirm: level >= 4
  };
}

/* ---------- 종류별 문제 ---------- */
const MAKERS = {
  parts(level, R) {
    const HANDS = { hour: ['짧은바늘', '시', '#e53935'], minute: ['긴바늘', '분', '#1e88e5'], second: ['초침', '초', '#2e9d4f'] };
    if (level <= 3) {
      const list = level === 1 ? ['hour', 'minute'] : level === 2 ? ['hour', 'minute'] : ['hour', 'minute', 'second'];
      const h = R.pick(list), t = R.ri(1, 12) * 60 + 5 * R.ri(0, 11);
      return { kind: 'parts', mode: 'hand', level, t, s: level === 3 ? 5 * R.ri(1, 11) : 0, secHand: level === 3, view: 'ana', hand: h, q: HANDS[h][0] + '을 눌러요', say: HANDS[h][0] + '을 눌러 봐요. ' + HANDS[h][1] + '를 알려 줘요', ans: HANDS[h][0], explain: HANDS[h][0] + '은 ' + HANDS[h][1] + '를 알려 줘요.' };
    }
    const bank = level === 4
      ? [['시를 알려 주는 바늘은?', '짧은바늘', ['긴바늘', '초침', '숫자']], ['분을 알려 주는 바늘은?', '긴바늘', ['짧은바늘', '초침', '숫자']], ['초를 알려 주는 바늘은?', '초침', ['짧은바늘', '긴바늘', '숫자']], ['가장 짧은 바늘은?', '짧은바늘', ['긴바늘', '초침', '숫자']]]
      : [['긴바늘이 12에 있을 때 짧은바늘이 4를 가리켜요. 몇 시?', '4시', ['12시', '8시', '4시 30분']], ['긴바늘이 6에 있어요. 몇 분?', '30분', ['6분', '60분', '15분']], ['긴바늘이 3에 있어요. 몇 분?', '15분', ['3분', '30분', '45분']], ['긴바늘이 12에서 한 바퀴를 돌면 몇 분이 지났을까요?', '60분', ['12분', '30분', '1분']], ['초침이 한 바퀴 돌면 몇 초?', '60초', ['12초', '30초', '100초']]];
    const q = R.pick(bank);
    return { kind: 'parts', mode: 'text', level, t: 4 * 60, s: 0, view: 'ana', q: q[0], say: q[0], opts: choices(q[1], q[2], 4, R, () => null), ans: q[1], explain: q[1] + '이에요.' };
  },
  hour(level, R) { return level === 3 ? setRound('hour', level, R) : level === 5 ? setRound('hour', level, R, R.pick(SCENES_HOUR)) : readRound('hour', level, R); },
  half(level, R) {
    if (level === 3) return setRound('half', level, R);
    if (level === 5) { const sc = R.pick(SCENES_HOUR); return setRound('half', level, R, sc); }
    return readRound('half', level, R);
  },
  min(level, R) { return level === 3 || level === 5 ? setRound('min', level, R, level === 5 ? R.pick(SCENES_HOUR) : null) : readRound('min', level, R); },
  around(level, R) {
    if (level === 3) { const r = setRound('around', level, R); return r; }
    if (level === 5) { const r = setRound('around', level, R, R.pick(SCENES_HOUR)); return r; }
    /* 읽기: 2:50 → 3시 10분 전 / 3:05 → 3시 5분 지났어요 */
    const bf = level === 1 ? true : R.ri(0, 1) === 0, hh = R.ri(1, 12);
    const d = R.pick(level === 2 ? [5, 10] : [5, 10, 15, 20]);
    const t = bf ? hh * 60 - d : hh * 60 + d, right = bf ? h12(hh * 60) + '시 ' + d + '분 전' : h12(hh * 60) + '시 ' + d + '분 후';
    const wrongs = [bf ? h12(hh * 60) + '시 ' + d + '분 후' : h12(hh * 60) + '시 ' + d + '분 전', (hh % 12 + 1) + '시 ' + d + '분 ' + (bf ? '전' : '후'), ((hh + 10) % 12 + 1) + '시 ' + d + '분 ' + (bf ? '전' : '후'), h12(hh * 60) + '시 ' + (60 - d) + '분 ' + (bf ? '전' : '후')];
    return { kind: 'around', mode: 'read', level, t: norm(t), s: 0, view: 'both', dig: 'blank', q: '시계가 가리키는 시각은?', say: '시계가 가리키는 시각을 말해 봐요', opts: choices(right, wrongs, NOPT[level - 1], R, () => R.ri(1, 12) + '시 ' + 5 * R.ri(1, 4) + '분 ' + R.pick(['전', '후'])), ans: right, fmt: 'kor', after: 'dig', explain: bf ? (h12(hh * 60) + '시가 되기 ' + d + '분 전이에요.') : (h12(hh * 60) + '시에서 ' + d + '분이 지났어요.') };
  },
  sec(level, R) {
    if (level === 5) {
      const bank = [['1분은 몇 초일까요?', '60초', ['10초', '30초', '100초']], ['90초는 1분과 몇 초일까요?', '1분 30초', ['1분 9초', '2분', '1분 60초']], ['2분은 몇 초일까요?', '120초', ['60초', '100초', '22초']], ['초침이 한 바퀴 돌면 긴바늘은 몇 칸 갈까요?', '1칸(1분)', ['1시간', '5칸', '60칸']], ['1분 20초는 몇 초일까요?', '80초', ['120초', '60초', '100초']], ['30초 두 번은 몇 분일까요?', '1분', ['2분', '30분', '1초']]];
      const q = R.pick(bank);
      return { kind: 'sec', mode: 'text', level, t: 2 * 60, s: 0, view: 'ana', q: q[0], say: q[0], opts: choices(q[1], q[2], 4, R, () => null), ans: q[1], explain: q[1] + '이에요.' };
    }
    if (level === 1) return { kind: 'sec', mode: 'hand', level, t: R.ri(1, 12) * 60 + 5 * R.ri(0, 11), s: 15 * R.ri(1, 3), secHand: true, view: 'ana', hand: 'second', q: '초침을 눌러요', say: '초침을 눌러 봐요. 초를 알려 줘요', ans: '초침', explain: '초침은 초를 알려 줘요.' };
    const step = level === 2 ? 15 : 5, s = step * R.ri(1, Math.floor(60 / step) - 1), t = R.ri(1, 12) * 60 + 5 * R.ri(0, 11);
    const right = s + '초';
    return { kind: 'sec', mode: 'read', level, t, s, secHand: true, view: 'ana', dig: 'blank', q: '초침이 가리키는 초는?', say: '초침이 가리키는 초는 몇 초일까요?', opts: choices(right, [(s + 30) % 60 + '초', (60 - s) + '초', Math.floor(s / 5) + '초', (s + 5) % 60 + '초', (s + 15) % 60 + '초'].filter((x) => x !== '0초'), NOPT[level - 1], R, () => 5 * R.ri(1, 11) + '초'), ans: right, fmt: 'kor', explain: '초침이 ' + s / 5 + '를 가리키면 ' + s + '초예요. (한 칸이 5초)' };
  },
  elapsed(level, R) {
    if (level === 5) {
      /* 생활 문제 + 돈 연결 */
      const rate = R.pick([[10, 500, '주차 요금'], [10, 1000, '놀이기구'], [20, 500, '자전거']]);
      const k = R.ri(2, 4);
      const bank = [
        ['🎮 1시간 동안 게임을 하고 30분 쉬었어요. 모두 몇 분이 걸렸을까요?', '90분', ['60분', '30분', '100분']],
        ['📺 3시에 만화를 보기 시작해서 3시 40분에 끝났어요. 몇 분 봤을까요?', '40분', ['30분', '50분', '1시간']],
        ['🅿️ ' + rate[2] + '은 ' + rate[0] + '분에 ' + rate[1] + '원이에요. ' + rate[0] * k + '분이면 얼마일까요?', rate[1] * k + '원', [rate[1] * (k + 1) + '원', rate[1] * (k - 1) + '원', rate[1] + '원']],
        ['🚌 학교까지 20분 걸려요. 8시에 출발하면 몇 시에 도착할까요?', '8시 20분', ['8시 2분', '7시 40분', '9시']],
        ['🍚 12시에 점심을 먹기 시작해 30분 동안 먹었어요. 끝난 시각은?', '12시 30분', ['1시', '12시 3분', '11시 30분']]
      ];
      const q = R.pick(bank);
      return { kind: 'elapsed', mode: 'text', level, t: 12 * 60, s: 0, view: 'ana', q: q[0], say: q[0].replace(/^\S+\s/, ''), opts: choices(q[1], q[2], 4, R, () => null), ans: q[1], explain: q[1] + '이에요.' };
    }
    let a, d;
    if (level <= 2) { a = R.ri(1, 9) * 60; d = R.pick([60, 120]); } else if (level === 3) { a = R.ri(1, 9) * 60 + 30 * R.ri(0, 1); d = R.pick([60, 90, 120, 30]); } else { a = R.ri(1, 9) * 60 + 5 * R.ri(0, 5); d = R.pick([20, 25, 35, 40, 45, 50, 75, 80, 90]); }
    const b = a + d, right = dur(d);
    const wrongs = [dur(d + 30), dur(Math.max(5, d - 30)), dur(d + 10), dur(Math.abs(d - 10)), dur(d * 2), dur(d + 60), dur(mm(b) || 5)];
    return {
      kind: 'elapsed', mode: 'read', level, t: a, t2: b, s: 0, view: 'ana', dig: 'time', q: kor(a) + '에 시작해서 ' + kor(b) + '에 끝났어요. 걸린 시간은?', say: kor(a) + '에 시작해서 ' + kor(b) + '에 끝났어요. 걸린 시간은 얼마일까요?',
      opts: choices(right, wrongs, NOPT[level - 1], R, () => dur(5 * R.ri(1, 24))), ans: right, fmt: 'kor', explain: '긴바늘이 ' + (d >= 60 ? Math.floor(d / 60) + '바퀴' : '') + (d % 60 ? ' ' + d % 60 + '칸(분)' : '') + ' 갔으니 ' + right + '이에요.', play: true
    };
  },
  ampm(level, R) {
    if (level === 5) {
      const bank = [['하루는 모두 몇 시간일까요?', '24시간', ['12시간', '60시간', '10시간']], ['오전은 밤 12시부터 낮 12시까지예요. 몇 시간일까요?', '12시간', ['24시간', '6시간', '60시간']], ['낮 12시는 오전일까요, 오후일까요?', '오후', ['오전', '밤', '새벽']], ['오후 3시에서 2시간이 지나면 몇 시일까요?', '오후 5시', ['오전 5시', '오후 1시', '오후 6시']], ['오전 10시에서 3시간 뒤는 몇 시일까요?', '오후 1시', ['오전 1시', '오후 3시', '오전 7시']], ['시계가 한 바퀴 돌면 12시간이에요. 하루는 몇 바퀴일까요?', '2바퀴', ['1바퀴', '12바퀴', '24바퀴']]];
      const q = R.pick(bank);
      return { kind: 'ampm', mode: 'text', level, t: 15 * 60, s: 0, view: 'both', dig: 'time', q: q[0], say: q[0], opts: choices(q[1], q[2], 4, R, () => null), ans: q[1], explain: q[1] + '이에요.' };
    }
    const sc = R.pick(AMPM_SCENES), tt = (sc[2] % 12) * 60 + (sc[3] ? 720 : 0);
    const right = isPM(tt) ? '오후' : '오전';
    if (level <= 2) return { kind: 'ampm', mode: 'read', level, t: tt, s: 0, view: 'both', dig: 'time', ap: false, scene: sc[0], q: sc[0] + ' ' + sc[1] + ' · ' + sc[2] + '시', say: sc[1] + '. 오전일까요 오후일까요?', opts: choices(right, [right === '오전' ? '오후' : '오전'], level === 1 ? 1 : 2, R, () => null), ans: right, fmt: 'kor', explain: sc[1] + '는 ' + right + '예요. 밤 12시부터 낮 12시 전까지가 오전이에요.' };
    const rightL = (isPM(tt) ? '오후 ' : '오전 ') + h12(tt) + '시';
    const wrongs = [(isPM(tt) ? '오전 ' : '오후 ') + h12(tt) + '시', (isPM(tt) ? '오후 ' : '오전 ') + (h12(tt) % 12 + 1) + '시', (isPM(tt) ? '오전 ' : '오후 ') + (h12(tt) % 12 + 1) + '시'];
    return { kind: 'ampm', mode: 'read', level, t: tt, s: 0, view: 'ana', dig: 'blank', scene: sc[0], q: sc[0] + ' ' + sc[1] + ' 시각은?', say: sc[1] + '. 알맞은 시각을 골라요', opts: choices(rightL, wrongs, NOPT[level - 1], R, () => null), ans: rightL, fmt: 'kor', explain: sc[1] + ' → ' + rightL + '이에요.' };
  },
  routine(level, R) {
    const n = [2, 2, 3, 4, 4][level - 1];
    let start = R.ri(0, ROUTINE.length - n - 1), list = ROUTINE.slice(start, start + n);
    if (level >= 3) { const idx = R.shuffle(ROUTINE.map((x, i) => i)).slice(0, n).sort((a, b) => a - b); list = idx.map((i) => ROUTINE[i]); }
    const items = R.shuffle(list.map((x, i) => Object.assign({}, x, { order: i })));
    return { kind: 'routine', mode: 'order', level, items, show: level <= 3 ? 'dig' : 'ana', q: level <= 2 ? '먼저 하는 것부터 눌러요' : '시각을 보고 먼저 하는 것부터 차례로 눌러요', say: level <= 2 ? '먼저 하는 것부터 눌러 봐요' : '시각을 보고 먼저 하는 것부터 차례로 눌러요', ans: list.map((x) => x.txt).join(' → '), explain: list.map((x) => x.txt + '(' + kor(x.t, true) + ')').join(' → ') };
  },
  table(level, R, opt) {
    const rows = ((opt && opt.rows && opt.rows.length >= 3) ? opt.rows : TABLE_DEFAULT).map((r) => Object.assign({}, r));
    const n = NOPT[level - 1];
    const ri = R.ri(0, rows.length - 1), row = rows[ri];
    const kind = level <= 2 ? 'time→act' : level === 3 ? 'act→time' : level === 4 ? R.pick(['next', 'act→time', 'time→act']) : R.pick(['next', 'between', 'count']);
    let q, right, wrongs, say;
    if (kind === 'time→act') { q = row.time + '에는 무엇을 할까요?'; right = row.act; wrongs = rows.filter((x) => x !== row).map((x) => x.act); }
    else if (kind === 'act→time') { q = row.act + ' 시간은 몇 시일까요?'; right = row.time; wrongs = rows.filter((x) => x !== row).map((x) => x.time); }
    else if (kind === 'next') { const j = Math.min(ri, rows.length - 2), a = rows[j], b = rows[j + 1]; q = a.act + ' 다음에는 무엇을 할까요?'; right = b.act; wrongs = rows.filter((x) => x !== b).map((x) => x.act); }
    else if (kind === 'between') { const j = Math.min(ri, rows.length - 2); q = rows[j].act + '과 ' + rows[j + 1].act + ' 사이는 몇 시간 몇 분일까요?'; const toMin = (s) => { const p = s.split(':'); let h = +p[0]; if (h < 8) h += 12; return h * 60 + +p[1]; }; const d = toMin(rows[j + 1].time) - toMin(rows[j].time); right = dur(d); wrongs = [dur(d + 30), dur(d + 60), dur(Math.max(10, d - 30)), dur(d * 2)]; }
    else { q = '오늘 수업은 모두 몇 개일까요?'; right = rows.filter((x) => !/점심|청소/.test(x.act)).length + '개'; wrongs = [rows.length + '개', rows.length + 1 + '개', rows.length - 3 + '개', rows.length - 2 + '개']; }
    return { kind: 'table', mode: 'table', level, rows, hi: level <= 2 ? ri : -1, q, say: q, opts: choices(right, wrongs, Math.max(2, n), R, () => null), ans: right, explain: kind === 'count' ? '점심과 청소를 빼고 세어요.' : '시간표를 한 줄씩 읽어 봐요.', sub: kind };
  },
  timer(level, R) {
    if (level === 5) {
      const bank = [['1분 동안 할 수 있는 일은?', '손뼉을 60번쯤 쳐요', ['밥을 다 먹어요', '학교에 다녀와요', '잠을 자요']], ['10초 동안 할 수 있는 일은?', '손을 씻어요', ['영화를 봐요', '밥을 먹어요', '운동장을 열 바퀴 돌아요']], ['1시간 동안 할 수 있는 일은?', '영화를 한 편 봐요', ['눈을 한 번 깜빡여요', '손뼉을 한 번 쳐요', '이를 한 번 닦아요']], ['신호등이 초록불에서 빨간불로 바뀌는 데 걸리는 시간은?', '30초쯤', ['3시간', '3일', '3분의 1초']]];
      const q = R.pick(bank);
      return { kind: 'timer', mode: 'text', level, t: 3 * 60, s: 0, view: 'ana', q: q[0], say: q[0], opts: choices(q[1], q[2], 4, R, () => null), ans: q[1], explain: q[1] + ' 가 알맞아요.' };
    }
    const secs = [10, 20, 30, 40][Math.min(level, 4) - 1] * (level === 4 ? 1 : 1);
    const tasks = ['조용히 앉아 있어요', '숨을 크게 쉬어요', '손뼉을 쳐요', '두 팔을 흔들어요', '제자리에서 걸어요'];
    return { kind: 'timer', mode: 'timer', level, t: R.ri(1, 12) * 60, s: 0, view: 'ana', secs, estimate: level === 4, task: R.pick(tasks), q: level === 4 ? secs + '초가 되었다고 생각하면 눌러요 (시계는 가려요)' : secs + '초 동안 해 봐요', say: level === 4 ? secs + '초가 되었다고 생각하면 단추를 눌러요' : secs + '초 동안 해 봐요. 초침을 보세요', ans: secs + '초', explain: '초침이 ' + secs / 5 + '칸 갔어요. ' + secs + '초예요.' };
  }
};

export const KINDS = Object.keys(MAKERS);
export function makeRound(kind, level, rnd, opt) {
  const R = mk(rnd);
  if (!MAKERS[kind]) throw new Error('모르는 종류: ' + kind);
  const r = MAKERS[kind](level, R, opt);
  r.kind = kind; r.level = level;
  return r;
}
/* 판이 겹치지 않게 여러 판 만들기 */
export function makeSet(kind, level, n, rnd, opt) {
  const out = [], seen = new Set();
  let guard = 0;
  while (out.length < n && guard++ < 60) { const r = makeRound(kind, level, rnd, opt); const key = r.q + '|' + (r.t || '') + '|' + (r.ans || ''); if (seen.has(key)) continue; seen.add(key); out.push(r); }
  while (out.length < n) out.push(makeRound(kind, level, rnd, opt));
  return out;
}
