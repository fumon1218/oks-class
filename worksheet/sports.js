/* 씽씽 별 마을 체육 학습지: 앱의 차시 자료(sports/lessons*.js)를 종이 문제로 바꿔요.
   id 형식: sp-<종목>-<학교급>-<차시>   예) sp-swimming-elem-1 */
window.OKS_WS_SPORTS = (function () {
  'use strict';
  var SP = [['athletics', '육상', '🏃'], ['swimming', '수영', '🏊'], ['archery', '양궁', '🏹'], ['gymnastics', '체조', '🤸'], ['taekwondo', '태권도', '🥋'], ['soccer', '축구', '⚽'], ['baseball', '야구', '⚾'], ['basketball', '농구', '🏀'], ['rugby', '럭비', '🏉'], ['tennis', '테니스', '🎾'], ['tabletennis', '탁구', '🏓']];
  var SC = [['elem', '초등'], ['middle', '중등'], ['high', '고등']];
  var GAME = {
    ping: '말랑한 공이나 풍선을 책상 위에서 살살 굴려 주면 탁구채(또는 책)로 쳐서 돌려 줘요.',
    rally: '말랑한 공이나 풍선을 친구가 살살 던져 주면 라켓(또는 손바닥)으로 쳐서 돌려 줘요.',
    tag: '말랑한 공이나 신문지 공을 안고 달리다가, 옆(뒤)에 있는 친구에게 건네 줘요. 앞으로는 던지지 않아요.',
    hoop: '신문지 공을 두 손으로 위로 올려 바구니에 던져 넣어 봐요. 콘으로 자리를 표시해요.',
    bat: '신문지 공을 가볍게 던져 주면 풍선이나 종이 방망이로 쳐 봐요. 친구와 거리를 두어요.',
    aim: '신문지 공을 과녁(그림)의 가운데에 던져 맞혀요.', breath: '대야 물에 얼굴을 가까이 대고 "후~" 숨을 내쉬어 봐요.', lane: '바닥에 붙인 선(레인)을 따라 한 줄로 걸어요.',
    hold: '한 발로 서서 3초 동안 균형을 잡아요.', pose: '선생님 동작을 보고 순서대로 따라 해요.', dir: '선생님이 말한 방향(왼쪽·오른쪽)으로 몸을 돌려요.', pass: '친구에게 공을 굴려 패스해 봐요.'
  };
  var STEPW = { signal: ['🚦', '출발 신호 기다리기'], run: ['🏁', '도착 지점까지 이동'], order: ['🔢', '준비 → 이동 → 도착'], gear: ['👟', '상황에 맞는 준비물 고르기'], warmup: ['🙆', '나에게 맞는 몸 풀기'], safety: ['👀', '몸과 주변 공간 확인'], reflect: ['💭', '내 참여 돌아보기'], goal: ['🎯', '내 목표 고르기'], pace: ['🐢', '천천히 · 빠르게 · 멈춤'], hurdle: ['🚧', '내 방법으로 장애물 넘기'], relay: ['🤝', '친구에게 차례 전달'], cooldown: ['😮‍💨', '숨 고르며 마무리'] };
  function parse(id) { var m = /^sp-(\w+)-(elem|middle|high)-(\d)$/.exec(id || ''); return m ? { sport: m[1], school: m[2], no: +m[3] } : null; }
  function has(id) { return !!parse(id); }
  function lessons() {
    var T = window.OKS_SPORT_TITLES || {}, out = [];
    SP.forEach(function (s) { SC.forEach(function (sc) { for (var n = 1; n <= 3; n++) {
      var t, g;
      if (s[0] === 'athletics' && window.OKS_ATHLETICS_COURSES) { var c = OKS_ATHLETICS_COURSES[sc[0]][n - 1]; t = c.title; g = c.goal; }
      else { var r = (T[s[0]] && T[s[0]][sc[0]] && T[s[0]][sc[0]][n - 1]) || [s[1] + ' ' + n, '']; t = r[0]; g = r[1]; }
      out.push({ id: 'sp-' + s[0] + '-' + sc[0] + '-' + n, subject: 'physical', subjectName: '체육', schoolName: '씽씽 별 마을 · ' + sc[1], unitNo: '', unit: '씽씽 별 마을 · ' + s[1], no: n, topic: t, goal: g, special: true, sportName: s[1] });
    } }); });
    return out;
  }
  function vis(it, sz) {
    sz = sz || 56; var e = it[0] || '';
    if (String(e).indexOf('img:') === 0) return '<img src="../' + e.slice(4) + '" alt="" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:contain">';
    return '<span style="font-size:' + Math.round(sz * .78) + 'px;line-height:1">' + e + '</span>';
  }
  function card(it, circ, sz) { return '<div class="card' + (sz > 60 ? ' big' : '') + (circ ? ' circ' : '') + '" style="min-width:86px">' + vis(it, sz || 54) + '<span style="font-size:16px;text-align:center">' + it[1] + '</span></div>'; }
  function ask(q) { return q.replace(/[을를] (골라요|찾아요)\.?$/, '에 ○ 하세요.').replace(/\.\.$/, '.'); }
  function make(W) {
    var p = parse(W.id), level = W.level, shuf = W.shuf, ri = W.ri, box = W.box, trace = level <= 2, qs = [];
    if (p.sport === 'athletics') return athletics(W, p);
    var A = window.OKS_SPORT_LESSONS && OKS_SPORT_LESSONS[p.sport], L = A && A[p.school][p.no - 1];
    if (!L) return [{ t: '교실에서 배운 것을 그려 보세요.', b: '<div style="height:150px;border:1.5px dashed #bbb;border-radius:10px"></div>' }];
    var nopt = [2, 2, 3, 3, 4][level - 1], it = shuf(L.i.slice()), nr = shuf(L.n.slice());
    function pick(k) {
      var right = it[k % it.length], wr = shuf(nr.slice()).slice(0, nopt - 1), opts = shuf([right].concat(wr));
      return opts.map(function (o) { return card(o, o === right, level <= 2 ? 66 : 54); }).join('');
    }
    /* 1. 고르기 */
    qs.push({ t: ask(L.q), b: '<div class="row">' + pick(0) + '</div>' });
    /* 2. 레벨 1: 그림 이름 말하기 / 그 외: 하나 더 고르기 */
    if (level === 1) qs.push({ t: '그림을 보고 이름을 말해 보세요. 말한 그림에 ○ 하세요.', b: '<div class="row">' + it.slice(0, 3).map(function (x) { return card(x, false, 66); }).join('') + '</div>' });
    else qs.push({ t: ask(L.q) + ' (하나 더)', b: '<div class="row">' + pick(1) + '</div>' });
    /* 3. 순서 */
    var steps = L.s.slice(0, level <= 2 ? 3 : 4), order = shuf(steps.map(function (x, i) { return { x: x, n: i + 1 }; }));
    qs.push({ t: (trace ? '일어나는 순서를 따라 쓰세요.' : '일어나는 순서대로 1, 2, 3' + (steps.length > 3 ? ', 4' : '') + '을 쓰세요.'), b: '<div class="row">' + order.map(function (o) { return '<div class="card">' + vis(o.x, 46) + '<span style="font-size:15px;text-align:center">' + o.x[1] + '</span>' + box(o.n, trace) + '</div>'; }).join('') + '</div>' });
    /* 4. 상황 판단 */
    var ts = shuf(L.t.slice()).slice(0, level >= 4 ? 2 : 1);
    ts.forEach(function (T) {
      var good = T.o.filter(function (x) { return x[2]; }), bad = T.o.filter(function (x) { return !x[2]; }),
        opts = level <= 2 ? shuf([good[0]].concat(shuf(bad.slice()).slice(0, 1))) : shuf(T.o.slice());
      qs.push({ t: T.q + ' ' + (level <= 2 ? '알맞은 것에 ○ 하세요.' : '알맞은 행동에 모두 ○ 하세요.'), b: '<div class="row">' + opts.map(function (o) { return card(o, !!o[2], 52); }).join('') + '</div>' });
    });
    /* 5. 교실에서 해 보기 */
    var gk = String(L.g || '').split(':')[0];
    qs.push({ t: '교실에서 직접 해 봐요. 해 본 칸에 ○ 하세요.', b: '<div style="font-size:18px;margin-bottom:8px">' + (GAME[gk] || '오늘 배운 동작을 선생님과 함께 따라 해요.') + '</div><div class="row"><span class="card">□ 혼자서</span><span class="card">□ 도움 받아서</span><span class="card">□ 다음에 또</span></div>' });
    /* 6. 마음 + 그리기 */
    if (level >= 3) qs.push({ t: '오늘 배운 ' + (L.z || '내용') + '을 그림이나 글로 나타내요.', b: '<div style="height:96px;border:1.5px dashed #bbb;border-radius:10px"></div>' });
    qs.push({ t: '활동을 마친 내 마음에 ○ 하세요.', b: '<div class="row" style="gap:34px"><span class="card" style="font-size:19px">😀 재미있어요</span><span class="card" style="font-size:19px">🙂 할 수 있어요</span><span class="card" style="font-size:19px">😌 다시 해 볼래요</span></div>' });
    return qs;
  }
  function athletics(W, p) {
    var C = window.OKS_ATHLETICS_COURSES[p.school][p.no - 1], shuf = W.shuf, box = W.box, level = W.level, trace = level <= 2, qs = [];
    var st = C.steps.filter(function (k, i, a) { return k !== 'order' && a.indexOf(k) === i; }).slice(0, 4), ord = shuf(st.map(function (k, i) { return { k: k, n: i + 1 }; }));
    qs.push({ t: '오늘 활동 순서를 ' + (trace ? '따라 쓰세요.' : '1, 2, 3 …으로 쓰세요.'), b: '<div class="row">' + ord.map(function (o) { var w = STEPW[o.k] || ['⭐', o.k]; return '<div class="card"><span style="font-size:36px">' + w[0] + '</span><span style="font-size:15px;text-align:center">' + w[1] + '</span>' + box(o.n, trace) + '</div>'; }).join('') + '</div>' });
    var good = [['🚦', '신호를 기다려요'], ['👀', '주변을 살펴요'], ['🙆', '몸을 풀어요']], bad = [['🏃', '먼저 뛰어나가요'], ['🙈', '앞을 안 봐요'], ['😜', '친구를 밀어요']];
    var opts = shuf(good.slice(0, level <= 2 ? 1 : 2).concat(bad.slice(0, level <= 2 ? 1 : 2)));
    qs.push({ t: '달리기 전에 알맞은 행동에 ○ 하세요.', b: '<div class="row">' + opts.map(function (o) { return card(o, good.indexOf(o) >= 0, 54); }).join('') + '</div>' });
    qs.push({ t: '교실에서 직접 해 봐요.', b: '<div style="font-size:18px;margin-bottom:8px">' + C.transfer + '</div><div class="row"><span class="card">□ 혼자서</span><span class="card">□ 도움 받아서</span><span class="card">□ 다음에 또</span></div>' });
    if (level >= 3) qs.push({ t: '오늘 달리기를 그림이나 글로 나타내요.', b: '<div style="height:96px;border:1.5px dashed #bbb;border-radius:10px"></div>' });
    qs.push({ t: '활동을 마친 내 마음에 ○ 하세요.', b: '<div class="row" style="gap:34px"><span class="card" style="font-size:19px">😀 재미있어요</span><span class="card" style="font-size:19px">🙂 할 수 있어요</span><span class="card" style="font-size:19px">😌 다시 해 볼래요</span></div>' });
    return qs;
  }
  return { has: has, make: make, lessons: lessons };
})();
