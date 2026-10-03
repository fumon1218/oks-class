/* 차시별·수준별 '게임에서 실제로 하는 일'을 내용표에서 만들어 냅니다.
   배움 지도의 수준 설명, 차시 시작 화면, 교사용 지도 계획서(curriculum/plan.html)가 함께 씁니다. */
(function () {
  'use strict';
  var ENG = {
    pick: '고르기', pairs: '짝 찾기', sort: '나누어 담기', order: '순서 맞추기', pattern: '규칙 기차', count: '세기·모으기·가르기', farm: '햇살 농장',
    rhythm: '리듬 연주', gauge: '힘 조절 게이지', mix: '색 섞기', route: '길 찾기', draw: '선 따라 그리기', build: '도형 조립', portal: '미술실 활동', alphaHear:'알파벳 소리 찾기', alphaTrace:'알파벳 따라 쓰기', alphaMemory:'대·소문자 짝 찾기', alphaOrder:'알파벳 순서 맞추기', alphaSpell:'영어 철자 맞추기', alphaSentence:'기초 문장 만들기'
  };
  function cfgAt(c, lv) {
    var x = Object.assign({}, c || {});
    if (x.byLevel && x.byLevel[lv]) x = Object.assign(x, x.byLevel[lv]);
    if (lv === 5 && x.l5) x = Object.assign(x, x.l5);
    return x;
  }
  function names(list, n) { return (list || []).slice(0, n || 3).map(function (i) { return (i.emo ? i.emo + ' ' : '') + (i.label || i.en || ''); }).join(', '); }
  function firstQ(c) { var s = c.sets && c.sets[0]; return s ? s.q : ''; }
  function nsets(c) { return c.sets ? c.sets.length : 0; }
  function one(c, lv) {
    var e = c.engine, N = [1, 2, 3, 4, 4][lv - 1];
    switch (e) {
      case 'pick':
        if (c.free) return '좋아하는 것을 스스로 골라 말하기(' + names(c.items, 4) + ' …) — 정답 없이 자기 표현';
        if (c.sets && c.sets.length) {
          var multi = c.sets.some(function (s) { return Array.isArray(s.ok) && s.ok.length > 1; });
          if (lv === 1) return '상황 ' + nsets(c) + '가지를 듣고, 하나뿐인 알맞은 카드를 눌러 확인하기 (예: ' + firstQ(c) + ')';
          return '상황 ' + nsets(c) + '가지 — ' + (multi ? '알맞은 것을 모두 골라요, ' : '') + N + '개 보기 중에서 고르기' + (lv === 3 ? ', 정답 카드를 끌어 옮기기' : '') + (lv >= 4 ? ', 힌트는 🙋 요청할 때만' : '') + ' (예: ' + firstQ(c) + ')';
        }
        var how = c.voice === 'en' ? '영어 소리' : c.voice === 'sound' ? '소리(의성어)' : c.voice === 'inst' ? '악기 소리' : c.voice === 'mel' ? '가락·음악' : '이름';
        if (lv === 1) return '큰 카드 3장(' + names(c.items, 3) + ')을 눌러 ' + how + ' 듣기 — 틀림 없음';
        return how + '를 듣고 ' + N + '개 중에서 고르기' + (lv === 3 ? ', 끌어서 ' + (c.zoneLabel || '바구니') + '에 옮기기' : '') + (lv >= 4 ? ', 도움은 요청할 때만' : '') + ' (' + names(c.items, 4) + ' …)';
      case 'pairs':
        if (lv === 5) return '카드 뒤집기 기억 놀이: 그림과 ' + (c.wordOf === 'en' ? '영어 낱말' : '낱말') + ' 짝 3쌍';
        return '그림 ' + [1, 2, 3, 4][lv - 1] + '장을 알맞은 ' + (c.wordOf === 'en' ? '영어 낱말' : '낱말') + ' 봉투에 ' + (lv === 1 ? '눌러서 넣기' : '옮기기') + ' (' + names(c.items, 3) + ' …)';
      case 'sort':
        var nb = Math.min(c.bins.length, [1, 2, 2, 3, 4][lv - 1]);
        if (lv === 1) return (c.mode === 'water' ? '물에 넣어 뜨는지 가라앉는지 보기' : '물건을 모두 한 통에 넣기') + ' — 틀림 없음';
        return (c.fixedBins ? c.bins.length : nb) + '개 통(' + c.bins.slice(0, c.fixedBins ? 4 : nb).map(function (b) { return b.label; }).join('·') + ')에 ' + [3, 4, 4, 5, 6][lv - 1] + '개 나누어 담기' + (lv === 5 && c.rinse ? ', 더러운 것은 먼저 헹구기' : '') + (lv >= 4 && c.countAfter ? ', 담은 뒤 개수 세기' : '');
      case 'order':
        var s0 = c.seqs && c.seqs[0];
        var len = [2, 2, 3, 4, 4][lv - 1];
        if (lv === 1) return '〈' + (s0 ? s0.title : '') + '〉 카드가 한 장씩 나오면 차례대로 옮기기 (2단계)';
        return '〈' + (c.seqs || []).map(function (s) { return s.title; }).join('〉·〈') + '〉 ' + len + '단계 순서 맞추기' + (lv >= 3 ? ', 번호 칸에 옮기기' : '') + (lv === 5 ? ' — 새 이야기·생활 장면' : '');
      case 'pattern': return ['AB 규칙 빈칸 1개(보기 1개)', 'AB 규칙, 보기 2개', 'AAB·ABB 규칙, 보기 3개', 'ABC 규칙 빈칸 2개, 보기 4개', '나만의 규칙 기차 만들기'][lv - 1] + ' (색과 모양 기호 함께)';
      case 'count': return ['블록을 하나씩 눌러 같이 세기(2~3개)', '몇 개인지 보고 숫자 2개 중 고르기(1~5)', '말한 수만큼 상자에 담고 “다 넣었어요”(1~5)', '두 묶음 모으기: 모두 몇 개? (보기 4개, 9까지)', '가르기: ' + (c.shareText ? '남은 수 구하기' : '한 쪽을 보고 다른 쪽 구하기')][lv - 1] + ' — ' + names(c.things || [c.thing], 3);
      case 'farm':
        if (c.mode === 'science') return ['화분을 누를 때마다 씨앗→새싹→잎→열매로 자라는 모습 보기', '씨앗·새싹·자란 잎·열매 이름 듣고 2개 중 고르기', '', '', '식물의 신호(시듦·어두움·익음·빈 화분)를 보고 알맞은 돌봄 고르기'][lv - 1];
        return ['익은 작물을 눌러 따서 바구니에 담기(틀림 없음)', '손님이 말한 작물을 2개 중에서 골라 드리기', '주문 카드(숫자+점)를 보고 1~5개를 바구니에 하나씩 옮기기', '두 가지 작물 주문을 개수대로 담기(힌트는 요청할 때만)', '심기→물 주기→수확→포장→배달→동전 하나씩 세기'][lv - 1];
      case 'rhythm':
        var pads = names(c.pads, 4);
        return ['패드(' + pads + ')를 마음껏 눌러 소리 탐색', '반짝일 때 눌러 박자 맞추기(8박)', '내려오는 음표 ' + (c.songs && c.songs[3] ? '(정해진 곡)' : '') + '를 2~3줄에서 맞춰 누르기', '3~4줄, 조금 더 빠르게' + (c.songs && c.songs[4] ? ' (정해진 곡)' : ''), '옥쌤 연주를 듣고 똑같이 따라 연주하기(주고받기)'][lv - 1];
      case 'gauge': return ['밀기·당기기 버튼으로 수레를 움직여 보기', '', '바늘이 ✓칸(넓음)에 올 때 멈춰 깃발까지 밀기', '깃발 거리가 바뀌고 ✓칸이 좁아짐', ''][lv - 1];
      case 'mix': return ['물감을 떨어뜨려 색이 바뀌는 것 보기', '', '목표 색(주황·초록·보라)을 만드는 두 물감 옮기기', '하양까지 4가지 물감으로 목표 색 만들기', '섞은 색으로 꽃 그림 색칠하기(자유)'][lv - 1];
      case 'route': return ['화살표 하나를 눌러 길 따라가기', '갈림길마다 화살표 2개 중 고르기', '3×3 지도에서 다음 칸을 눌러 이동', '4×4 지도, 힌트는 요청할 때만', '두 곳을 차례로 들르는 심부름 길 찾기'][lv - 1];
      case 'draw': return ['손가락으로 마음껏 그리기', '넓은 직선 점선 따라 그리기', '꺾인 선·곡선 따라 그리기', '지그재그 좁은 길 따라 그리기', '집에서 학교까지 나만의 길 그리기'][lv - 1];
      case 'build': return ['빠진 도형 1개를 옮겨 동물 완성', '도형 2개 옮기기', '도형 3개 옮기기', '윤곽 없이 모든 조각을 제자리에', '도형을 골라 나만의 동물 만들기'][lv - 1];
      case 'portal': return '미술실의 ' + (c.title || '') + ' 활동을 수준(' + ['쉬움', '쉬움', '보통', '어려움', '어려움'][lv - 1] + ')에 맞춰 하고 돌아오기';
      case 'alphaHear': return ['알파벳 카드를 눌러 이름과 소리 익히기','들은 알파벳을 2~3개 보기에서 찾기','들은 알파벳을 3개 보기에서 찾기','4개 보기에서 도움 없이 찾기','새 순서로 제시된 알파벳 소리를 듣고 스스로 찾기'][lv - 1];
      case 'alphaTrace': return ['큰 점선 글자를 손가락으로 자유롭게 따라 보기','점선 알파벳을 따라 쓰고 소리 듣기','획의 모양을 보며 스스로 따라 쓰기','도움 없이 알파벳 모양 완성하기','배운 글자를 보고 한 번 더 스스로 써 보기'][lv - 1];
      case 'alphaMemory': return ['대문자·소문자 짝 2쌍 뒤집어 보기','짝 3쌍을 기억해 맞추기','짝 4쌍을 기억해 맞추기','짝 5쌍을 도움 없이 맞추기','새 순서의 짝 5쌍을 스스로 완성하기'][lv - 1];
      case 'alphaOrder': return ['연속된 알파벳 3개를 순서대로 누르기','4개 알파벳 순서 맞추기','5개 알파벳 순서 맞추기','6개 알파벳을 도움 없이 배열하기','새 구간의 알파벳 6개를 스스로 배열하기'][lv - 1];
      case 'alphaSpell': return ['그림과 영어 낱말 소리를 함께 익히기','그림을 보고 짧은 낱말 철자 누르기','철자 카드를 순서대로 배열하기','도움 없이 영어 낱말 철자 완성하기','새 그림 낱말의 철자를 스스로 완성하기'][lv - 1];
      case 'alphaSentence': return ['그림과 짧은 영어 문장을 함께 듣기','문장 낱말을 순서대로 눌러 보기','낱말 카드를 배열해 문장 만들기','도움 없이 기초 문장 완성하기','새 생활 장면에서 배운 문장 틀을 적용하기'][lv - 1];
    }
    return '';
  }
  function describe(c, lv) {
    if (!c) return '';
    var x = cfgAt(c, lv), t = one(x, lv);
    if (!t && x.engine !== c.engine) t = one(cfgAt(c, lv), lv);
    if (!t) { var y = Object.assign({}, x, { engine: (c.byLevel && c.byLevel[lv] && c.byLevel[lv].engine) || x.engine }); t = one(y, lv); }
    return t;
  }
  window.OKS_DESCRIBE = describe;
  window.OKS_ENGINE_NAME = function (c, lv) { var x = cfgAt(c, lv || 3); return ENG[x.engine] || x.engine; };
})();
