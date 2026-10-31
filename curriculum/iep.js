/* 개별화교육계획 작성 도구 (curriculum/iep.html)
   - 서식: 특수교육법 제22조·시행규칙 제4조의 필수 내용(인적사항, 현재 학습수행수준, 교육목표, 교육내용, 교육방법, 평가계획,
     특수교육 관련서비스) + 학교 현장 서식(학기별 교과 교육계획 월별 표, 가·나·다·라 평가) + 개별화교육지원팀·행동지원·전환교육.
   - 성취기준: curriculum/standards.js (2022 개정 특수교육 기본 교육과정 [별책 3], 2026.1.21. 일부개정 포함)
   - 차시 연결: curriculum/lessons.js 의 std/stdEarly/stdLink, 기초층은 아래 BASIC_STD
   - 저장: 이 기기 localStorage 'oks_iep_v1'. 이름·생년월일·주소·연락처 등 인적사항은 '이 기기에 저장'을 켤 때만 저장합니다.
   - 성취기준·차시 연결과 자동 문장은 작성 보조용 제안이며 고시가 아닙니다. 최종 내용은 개별화교육지원팀이 정합니다. */
(function () {
  'use strict';
  var STD = window.OKS_STD_TEXT || {}, AREA = window.OKS_STD_AREA || {};
  var LES = ((window.OKS_LESSONS || {}).lessons) || [];
  var KEY = 'oks_iep_v1', PROF_KEY = 'oks_profiles_v1', LOG_KEY = 'oks_learning_log_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function uid() { return 'i' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function toast(t) { var e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2200); }

  /* ---------- 교육과정 메타 ---------- */
  var SUBJ = { '국어': '국어', '수학': '수학', '사회': '사회', '과학': '과학', '진로': '진로와 직업', '체육': '체육', '음악': '음악', '미술': '미술',
    '생영': '생활영어', '정통': '정보통신활용', '보건': '보건', '실과': '실과', '바생': '바른 생활', '슬생': '슬기로운 생활', '건생': '건강한 생활', '즐생': '즐거운 생활' };
  var SUBJ_ORDER = ['국어', '수학', '사회', '과학', '진로와 직업', '체육', '음악', '미술', '바른 생활', '슬기로운 생활', '건강한 생활', '즐거운 생활', '실과', '생활영어', '정보통신활용', '보건'];
  var BAND = { '2': '초1~2', '4': '초3~4', '6': '초5~6', '9': '중1~3', '09': '중1~3', '12': '고1~3' };
  var BAND_ORDER = ['초1~2', '초3~4', '초5~6', '중1~3', '고1~3'];
  /* 생활지원 영역: 총론의 일상생활 활동 영역 + 행동지원(나이스 생활지원 영역 기준) — 성취기준 없이 학교·교사가 목표를 정함 */
  var LIFE = ['의사소통', '자립생활', '신체활동', '여가활동', '생활적응', '행동지원', '진로·직업(전환)'];
  function meta(code) {
    var m = /^(\d+)([가-힣]{2})(\d{2})-(\d{2})$/.exec(code); if (!m) return null;
    return { band: BAND[m[1]], subj: SUBJ[m[2]], area: AREA[m[1] + m[2] + m[3]] || '', areaKey: m[1] + m[2] + m[3] };
  }
  var ALL = Object.keys(STD).map(function (c) { var m = meta(c); return m && { code: c, text: STD[c], band: m.band, subj: m.subj, area: m.area, areaKey: m.areaKey }; }).filter(Boolean);

  /* 기초층 차시(한글·시계·영어 기초)는 엑셀 밖 JSON이라 여기서 연결합니다(worksheet/clock.js 의 배움 근거와 같음) */
  var BASIC_STD = {
    '02-00-01-01': ['6수학03-03'], '02-00-01-02': ['6수학03-03'], '02-00-01-03': ['6수학03-03'], '02-00-01-04': ['9수학03-03'],
    '02-00-01-05': ['9수학03-03'], '02-00-02-02': ['9수학03-03', '6수학03-04'], '02-00-02-03': ['6수학03-04'],
    '02-00-03-01': ['6수학03-03', '6수학03-04'], '02-00-03-02': ['6수학03-04'], '02-00-03-03': ['9수학03-03']
  };
  function basicStd(l) {
    if (BASIC_STD[l.id]) return BASIC_STD[l.id];
    if (l.subject === 'korean' && l.school === 'basic') return /낱말/.test(l.topic) ? ['6국어03-02', '4국어03-02'] : ['6국어03-01'];
    if (l.subject === 'english' && l.school === 'basic') {
      var t = l.topic + ' ' + l.goal;
      if (/대문자|소문자/.test(t) && /쓰/.test(t)) return ['09생영03-02'];
      if (/쓰/.test(t)) return ['09생영03-03'];
      if (/대.?소문자|짝/.test(t)) return ['09생영02-02'];
      if (/알파벳/.test(t)) return ['09생영01-02'];
      if (/문장|말하/.test(t)) return ['09생영01-05'];
      if (/읽/.test(t)) return ['09생영02-03'];
      return ['09생영01-04'];
    }
    return [];
  }
  LES.forEach(function (l) { l._std = [].concat(l.std || [], l.stdEarly || [], l.stdLink || [], basicStd(l)); });
  function lessonsFor(code) { return LES.filter(function (l) { return l._std.indexOf(code) >= 0; }); }
  function lessonById(id) { return LES.filter(function (l) { return l.id === id; })[0]; }
  function lessonLabel(l) { return l.subjectName + ' ' + l.schoolName + ' ' + l.no + ' ' + l.topic; }

  /* ---------- 문장 다듬기: 성취기준·준거 → '~할 수 있다' 목표, '~할 수 있는가?' 준거 ---------- */
  var JONG = function (ch) { var c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? c % 28 : -1; };
  function setJong(ch, j) { var c = ch.charCodeAt(0) - 0xAC00; return String.fromCharCode(0xAC00 + c - (c % 28) + j); }
  function toGoal(s) {
    s = String(s || '').trim().replace(/\s+/g, ' ').replace(/\.$/, '');
    if (!s) return '';
    if (/수 있다$/.test(s)) return s + '.';
    if (/한다$/.test(s)) return s.replace(/한다$/, '할 수 있다.');
    var m = /(\S*?)는다$/.exec(s);
    if (m && m[1]) {
      var st = m[1], last = st.slice(-1), head = s.replace(/는다$/, '');
      var IRR = { '갖': '가질', '듣': '들을', '짓': '지을', '걷': '걸을' };   /* 불규칙: 갖는다→가질, 듣는다→들을, 짝짓는다→짝지을 */
      if (IRR[last]) return head.slice(0, -1) + IRR[last] + ' 수 있다.';
      return head + (JONG(last) > 0 ? '을' : '를') + ' 수 있다.';
    }
    m = /(.)다$/.exec(s);
    if (m && JONG(m[1]) === 4) return s.slice(0, -2) + setJong(m[1], 8) + ' 수 있다.';
    if (/이다$|있다$|없다$/.test(s)) return s + '.';
    return s + '.';
  }
  function toQuestion(goal) { return String(goal || '').replace(/수 있다\.?$/, '수 있는가?').replace(/\.$/, '?'); }

  /* ---------- 학생·계획 저장 ---------- */
  function profiles() { var d = jget(PROF_KEY, null); return d && Array.isArray(d.list) ? d.list : []; }
  function addProfile(label) {
    var d = jget(PROF_KEY, null); if (!d || !Array.isArray(d.list)) d = { active: '', list: [] };
    var id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
    d.list.push({ id: id, label: label }); jset(PROF_KEY, d); return id;
  }
  var store = jget(KEY, { plans: [] }); if (!Array.isArray(store.plans)) store.plans = [];
  var PERSONAL = ['name', 'birth', 'guardian', 'address', 'phone', 'welfare'];
  var memPersonal = {};   /* 저장하지 않는 인적사항(이 탭이 열려 있는 동안만) */
  var cur = null, curProfile = jget('oks_iep_last', {}).profile || '';
  function persist() {
    var copy = JSON.parse(JSON.stringify(store));
    copy.plans.forEach(function (p) { if (!p.keepPersonal) PERSONAL.forEach(function (k) { if (p.info) p.info[k] = ''; }); });
    if (!jset(KEY, copy)) toast('저장 공간이 부족해요. 백업 파일로 저장해 주세요.');
    jset('oks_iep_last', { profile: curProfile, plan: cur && cur.id });
  }
  var saveT; function save() { clearTimeout(saveT); saveT = setTimeout(persist, 400); }
  function restorePersonal(p) { var m = memPersonal[p.id]; if (m) PERSONAL.forEach(function (k) { if (!p.info[k] && m[k]) p.info[k] = m[k]; }); }

  function termMonths(term) { return term === '2' ? ['8~9월', '10월', '11월', '12월', '1~2월'] : ['3월', '4월', '5월', '6월', '7월']; }
  function newPlan(profileId) {
    var now = new Date(), y = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear(), term = (now.getMonth() >= 7 || now.getMonth() < 1) ? '2' : '1';
    return {
      id: uid(), profile: profileId, created: now.toISOString(), year: String(y), term: term, type: '교과 및 생활지원 중심',
      start: term === '1' ? y + '-03-02' : y + '-08-17', keepPersonal: false,
      info: { school: '', gradeClass: '', name: '', specialTeacher: '', generalTeacher: '', birth: '', placement: '특수학급', disability: '', welfare: '', guardian: '', address: '', selectDate: '', phone: '' },
      team: [['개별화교육지원팀장(교감)', ''], ['보호자', ''], ['특수교육교원', ''], ['일반교육교원(통합학급 담임)', ''], ['진로·직업교육 담당교원', ''], ['특수교육 관련서비스 담당 인력', '']].map(function (r) { return { role: r[0], name: r[1] }; }),
      meetings: [{ date: '', topic: '1차: 현재 수준·요구 공유, 계획 유형과 우선 영역 결정' }, { date: '', topic: '2차: 계획 확정·관련서비스 협의' }],
      services: ['상담지원', '가족지원', '치료지원', '보조인력지원', '보조공학기기지원', '학습보조기기지원', '통학지원', '정보접근지원', '방과후학교 지원'].map(function (k) { return { kind: k, org: '', content: '', note: '' }; }),
      tests: [{ tool: '', date: '', result: '' }],
      present: '', strengths: '', parentNeeds: '', studentNeeds: '', etc: '',
      behavior: { on: false, target: '', func: '', prevent: '', replace: '', respond: '', crisis: '' },
      transition: { on: false, hope: '', goal: '', now: '', link: '', support: '' },
      subjects: [],
      scale: { a: 70, b: 40 },
      evalTotal: '', evalNote: ''
    };
  }
  function newSubject(name, band) {
    var life = LIFE.indexOf(name) >= 0;
    return { id: uid(), name: name, band: band || '', life: life, present: '', longGoals: '', stds: [], rows: [], eval: '', open: true };
  }
  function newRow(month) { return { month: month || '', unit: '', goal: '', content: '', method: '직접교수, 모델링, 최소촉진', crit: '', result: '', memo: '', std: [], lessons: [] }; }

  /* ---------- 기록 → 평가 ---------- */
  function logsFor(p, lessonIds) {
    var from = p.start ? new Date(p.start) : null, to = from ? new Date(from.getTime() + 200 * 864e5) : null;
    return jget(LOG_KEY, []).filter(function (r) {
      if ((r.profile || '') !== (p.profile || '')) return false;
      if (lessonIds.indexOf(r.lesson) < 0) return false;
      if (from) { var t = new Date(r.at); if (t < from || t > to) return false; }
      return true;
    });
  }
  var INDEP = { '독립': 1, '언어힌트': 1 };
  function summarize(rs) {
    if (!rs.length) return null;
    var n = rs.length, ind = rs.filter(function (r) { return INDEP[r.independence]; }).length;
    var lv = Math.max.apply(null, rs.map(function (r) { return r.level || 0; }));
    var recent = rs.slice(-3).map(function (r) { return r.independence || '-'; });
    var tr = rs.filter(function (r) { return r.transfer && r.transfer !== '미관찰'; }).map(function (r) { return r.transfer; });
    return { n: n, rate: Math.round(ind / n * 100), maxLevel: lv, recent: recent, transfer: tr };
  }
  /* 앱 기록은 '끝까지 해낸' 판만 남으므로 자동 제안은 가·나·다까지. '라'(수행하지 못함)는 교사가 판단해 고릅니다. */
  function gradeOf(rate, sc) { if (rate == null) return ''; if (rate >= sc.a) return '가'; if (rate >= sc.b) return '나'; return '다'; }
  var GRADE_TEXT = { '가': '대체로 스스로 수행함', '나': '부분적인 도움을 필요로 함', '다': '전반적인 도움을 필요로 함', '라': '과제 수행을 하지 못함' };

  /* ---------- 화면 ---------- */
  function fld(label, path, val, opt) {
    opt = opt || {};
    var id = 'f_' + path.replace(/\W/g, '_');
    var input = opt.area ? '<textarea id="' + id + '" data-p="' + path + '" placeholder="' + esc(opt.ph || '') + '">' + esc(val) + '</textarea>'
      : opt.sel ? '<select id="' + id + '" data-p="' + path + '">' + opt.sel.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>'
      : '<input id="' + id + '" data-p="' + path + '" type="' + (opt.type || 'text') + '" value="' + esc(val) + '" placeholder="' + esc(opt.ph || '') + '">';
    return '<div class="' + (opt.wide ? 'wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label>' + input + '</div>';
  }
  function getP(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj); }
  function setP(obj, path, v) { var ks = path.split('.'), o = obj; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
  function addDays(d, n) { if (!d) return ''; var t = new Date(d); if (isNaN(t)) return ''; t.setDate(t.getDate() + n); return t.getFullYear() + '. ' + (t.getMonth() + 1) + '. ' + t.getDate() + '.'; }

  function render() {
    var app = $('#app');
    if (!cur) {
      app.innerHTML = '<section class="card"><h2>개별화교육계획을 시작해요</h2><p class="hint">위에서 학생을 고르고 <b>＋ 새 계획</b>을 누르세요. 학생은 배움 지도와 같은 익명 프로필(별명·번호)을 씁니다. 실제 이름은 계획서의 인적사항 칸에만 적고, 기본값으로는 이 기기에 저장하지 않습니다.</p></section>';
      return;
    }
    var p = cur, i = p.info, h = '';
    /* 1 기본 정보 */
    h += '<section class="card" id="s-basic"><h2>1. 기본 정보·인적사항</h2><p class="hint">특수교육법 시행규칙 제4조: 개별화교육지원팀은 학기 시작일부터 2주 이내 구성, 계획은 매 학기 시작일부터 30일 이내 작성(지역 지침 확인).</p>';
    h += '<div class="grid">' + fld('학년도', 'year', p.year) + fld('학기', 'term', p.term, { sel: ['1', '2'] }) + fld('학기 시작일(배치일)', 'start', p.start, { type: 'date' }) +
      fld('계획 유형', 'type', p.type, { sel: ['교과 중심', '생활지원 중심', '교과 및 생활지원 중심'] }) + '</div>';
    h += '<p class="dates">팀 구성 기한 <b>' + (addDays(p.start, 14) || '-') + '</b> · 계획 결재 기한 <b>' + (addDays(p.start, 30) || '-') + '</b> · 학기 말 평가 결과 보호자 안내</p>';
    h += '<div class="grid">' + fld('학교명', 'info.school', i.school) + fld('학년 반', 'info.gradeClass', i.gradeClass, { ph: '예: 5학년 2반' }) + fld('이름', 'info.name', i.name) +
      fld('특수학급(특수교육) 담임', 'info.specialTeacher', i.specialTeacher) + fld('통합학급 담임', 'info.generalTeacher', i.generalTeacher) + '</div>';
    h += '<h3 style="font-size:15px;margin:14px 0 6px">학생·가족 정보</h3><div class="grid">' + fld('생년월일', 'info.birth', i.birth, { type: 'date' }) +
      fld('배치형태', 'info.placement', i.placement, { sel: ['특수학급', '일반학급(전일제 통합)', '특수학교', '순회교육', '병원학교·원격수업'] }) +
      fld('장애유형', 'info.disability', i.disability, { ph: '선정 시 장애 영역' }) + fld('복지카드', 'info.welfare', i.welfare, { ph: '유/무' }) +
      fld('보호자', 'info.guardian', i.guardian) + fld('전화번호', 'info.phone', i.phone) + fld('주소', 'info.address', i.address, { wide: true }) +
      fld('특수교육대상자 선정·배치일', 'info.selectDate', i.selectDate, { type: 'date' }) + '</div>';
    h += '<label style="display:flex;gap:8px;align-items:center;margin-top:10px;color:var(--ink)"><input type="checkbox" id="keepP" style="width:auto"' + (p.keepPersonal ? ' checked' : '') + '> 이름·생년월일·보호자·주소·전화·복지카드를 이 기기에 저장</label>';
    h += '<p class="note">꺼 두면 이 칸들은 지금 열린 화면에서만 쓰이고 저장되지 않습니다(출력·한글 파일에는 들어감). 공용 기기에서는 끈 채로 쓰세요. 개별화교육계획은 학교 규정에 따라 원본을 보관합니다.</p></section>';

    /* 2 팀·관련서비스 */
    h += '<section class="card" id="s-team"><h2>2. 개별화교육지원팀·특수교육 관련서비스</h2><p class="hint">팀: 보호자, 특수교육교원, 일반교육교원, 진로·직업교육 담당교원, 관련서비스 담당 인력 등(시행규칙 제4조). 관련서비스는 실제로 필요한 것만 남기세요.</p>';
    h += '<div class="scroll"><table class="edit"><thead><tr><th style="width:42%">역할</th><th>이름</th><th style="width:44px"></th></tr></thead><tbody>' +
      p.team.map(function (t, k) { return '<tr><td><input data-p="team.' + k + '.role" value="' + esc(t.role) + '"></td><td><input data-p="team.' + k + '.name" value="' + esc(t.name) + '"></td><td><button class="ghost del" data-del="team.' + k + '" aria-label="삭제">✕</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="actions"><button data-add="team">＋ 팀원</button></div>';
    h += '<div class="scroll"><table class="edit"><thead><tr><th style="width:140px">협의회 일자</th><th>협의 내용</th><th style="width:44px"></th></tr></thead><tbody>' +
      p.meetings.map(function (t, k) { return '<tr><td><input type="date" data-p="meetings.' + k + '.date" value="' + esc(t.date) + '"></td><td><input data-p="meetings.' + k + '.topic" value="' + esc(t.topic) + '"></td><td><button class="ghost del" data-del="meetings.' + k + '" aria-label="삭제">✕</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="actions"><button data-add="meetings">＋ 협의회</button></div>';
    h += '<div class="scroll"><table class="edit"><thead><tr><th style="width:150px">제공 서비스</th><th>지원기관명</th><th>교육(지원) 내용</th><th>비고</th><th style="width:44px"></th></tr></thead><tbody>' +
      p.services.map(function (s, k) { return '<tr><td><input data-p="services.' + k + '.kind" value="' + esc(s.kind) + '"></td><td><input data-p="services.' + k + '.org" value="' + esc(s.org) + '"></td><td><input data-p="services.' + k + '.content" value="' + esc(s.content) + '"></td><td><input data-p="services.' + k + '.note" value="' + esc(s.note) + '"></td><td><button class="ghost del" data-del="services.' + k + '" aria-label="삭제">✕</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="actions"><button data-add="services">＋ 서비스</button></div></section>';

    /* 3 진단·현재 수준 */
    h += '<section class="card" id="s-diag"><h2>3. 진단·평가 결과와 현재 수행 수준</h2>';
    h += '<div class="scroll"><table class="edit"><thead><tr><th>검사도구</th><th style="width:150px">검사일자</th><th>검사결과</th><th style="width:44px"></th></tr></thead><tbody>' +
      p.tests.map(function (t, k) { return '<tr><td><input data-p="tests.' + k + '.tool" value="' + esc(t.tool) + '" placeholder="예: K-WISC-V, 기초학력검사"></td><td><input type="date" data-p="tests.' + k + '.date" value="' + esc(t.date) + '"></td><td><input data-p="tests.' + k + '.result" value="' + esc(t.result) + '"></td><td><button class="ghost del" data-del="tests.' + k + '" aria-label="삭제">✕</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="actions"><button data-add="tests">＋ 검사</button><button data-act="recSummary">📋 앱 기록 요약 넣기</button></div>';
    h += '<div class="grid">' + fld('현재 수행 수준 및 행동특성', 'present', p.present, { area: 1, wide: 1, ph: '영역별로 할 수 있는 것과 지원이 필요한 것을 관찰한 행동으로 적어요.' }) +
      fld('강점·흥미(동기 부여 요소)', 'strengths', p.strengths, { area: 1 }) + fld('학생의 요구·선호', 'studentNeeds', p.studentNeeds, { area: 1 }) +
      fld('학부모 요구사항', 'parentNeeds', p.parentNeeds, { area: 1, wide: 1 }) + fld('기타(건강·투약·의사소통 수단 등)', 'etc', p.etc, { area: 1, wide: 1 }) + '</div></section>';

    /* 4 교과·영역별 계획 */
    h += '<section class="card" id="s-subj"><h2>4. 교과·영역별 교육계획</h2><p class="hint">교과를 고르면 2022 개정 특수교육 기본 교육과정 성취기준(별책 3)에서 목표를 고를 수 있고, 앱 차시가 연결된 성취기준은 단원·차시·평가 준거까지 월별 표에 채워집니다. 생활지원 영역은 성취기준 없이 학교가 정한 목표로 씁니다.</p>';
    h += '<div class="actions"><select id="addSubjName" style="width:auto"><optgroup label="교과">' + SUBJ_ORDER.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</optgroup><optgroup label="생활지원 영역">' + LIFE.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</optgroup></select>' +
      '<select id="addSubjBand" style="width:auto">' + BAND_ORDER.map(function (b) { return '<option>' + b + '</option>'; }).join('') + '</select><button class="pri" data-act="addSubj">＋ 교과·영역 추가</button></div>';
    h += p.subjects.map(subjectHtml).join('') || '<p class="hint">아직 추가한 교과·영역이 없어요.</p>';
    h += '</section>';

    /* 5 행동지원·전환 */
    var b = p.behavior, t = p.transition;
    h += '<section class="card" id="s-beh"><h2>5. 도전행동 지원·전환교육</h2>';
    h += '<label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" data-chk="behavior.on" style="width:auto"' + (b.on ? ' checked' : '') + '> 도전행동 지원계획 포함</label>';
    if (b.on) h += '<div class="grid" style="margin-top:8px">' + fld('도전행동(관찰 가능한 행동으로)', 'behavior.target', b.target, { area: 1, wide: 1 }) +
      fld('추정 기능(왜 하는가)', 'behavior.func', b.func, { sel: ['', '관심 얻기', '회피·도피', '원하는 물건·활동 얻기', '감각 자극', '복합·확인 중'] }) +
      fld('예방 전략(선행사건 조절)', 'behavior.prevent', b.prevent, { area: 1 }) + fld('대체행동 교수', 'behavior.replace', b.replace, { area: 1 }) +
      fld('반응 전략(후속결과)', 'behavior.respond', b.respond, { area: 1 }) + fld('위기 행동 대응 절차', 'behavior.crisis', b.crisis, { area: 1 }) + '</div>';
    h += '<label style="display:flex;gap:8px;align-items:center;color:var(--ink);margin-top:12px"><input type="checkbox" data-chk="transition.on" style="width:auto"' + (t.on ? ' checked' : '') + '> 개별화전환교육계획(중·고) 포함 <small style="color:var(--soft)">— 법적 의무는 아니며 진로·직업교육을 위해 넣을 수 있어요</small></label>';
    if (t.on) h += '<div class="grid" style="margin-top:8px">' + fld('졸업 후 희망 진로(학생·보호자)', 'transition.hope', t.hope, { area: 1 }) + fld('현재 진로 준비 수준', 'transition.now', t.now, { area: 1 }) +
      fld('이번 학기 전환 목표', 'transition.goal', t.goal, { area: 1 }) + fld('연계 기관·현장실습·체험', 'transition.link', t.link, { area: 1 }) + fld('필요한 지원', 'transition.support', t.support, { area: 1, wide: 1 }) + '</div>';
    h += '</section>';

    /* 6 평가 */
    h += '<section class="card" id="s-eval"><h2>6. 평가</h2><p class="hint">학기별 1회 보호자에게 평가 결과를 안내합니다. 점수보다 학생의 변화를 담은 서술형 평가를 중심으로, 앱 기록은 근거로 함께 씁니다.</p>';
    h += '<div class="grid">' + fld('가: 이상(%)', 'scale.a', p.scale.a, { type: 'number' }) + fld('나: 이상(%)', 'scale.b', p.scale.b, { type: 'number' }) + '</div>';
    h += '<p class="hint" style="margin-top:6px">가 ' + p.scale.a + '% 이상 대체로 스스로 수행 · 나 ' + p.scale.b + '~' + p.scale.a + '% 부분적 도움 · 다 ' + p.scale.b + '% 미만 전반적 도움 · 라 수행하지 못함. 앱 기록은 독립·언어힌트로 해낸 비율로 계산해요.</p>';
    h += '<div class="actions"><button class="pri" data-act="fillEval">📊 앱 기록으로 평가 결과 제안</button><button data-act="draftEval">✍️ 종합 평가 초안 쓰기</button></div>';
    h += p.subjects.map(function (s, si) { return '<div class="grid" style="margin-bottom:8px">' + fld(s.name + ' 평가 결과(서술)', 'subjects.' + si + '.eval', s.eval, { area: 1, wide: 1 }) + '</div>'; }).join('');
    h += '<div class="grid">' + fld('종합 평가', 'evalTotal', p.evalTotal, { area: 1, wide: 1 }) + '</div></section>';

    /* 7 파일 */
    h += '<section class="card" id="s-file"><h2>7. 저장·불러오기</h2><p class="hint">작성 내용은 이 기기에 자동 저장돼요(인적사항은 1번 설정에 따름). 다른 기기로 옮기거나 보관하려면 백업 파일을 쓰세요.</p>' +
      '<div class="actions"><button data-act="exportJson">💾 백업 파일 저장</button><label class="ghost" style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;color:var(--ink);margin:0;cursor:pointer">📂 백업 파일 불러오기<input type="file" id="importJson" accept="application/json,.json" style="display:none"></label>' +
      '<button data-act="copyPlan">📑 다음 학기로 복사</button><button class="del" data-act="delPlan">🗑️ 이 계획 삭제</button></div></section>';
    app.innerHTML = h;
    $$('table.edit textarea', app).forEach(grow);
  }
  function grow(t) { t.style.height = 'auto'; t.style.height = Math.max(56, t.scrollHeight + 2) + 'px'; }

  function subjectHtml(s, si) {
    var base = 'subjects.' + si;
    var h = '<div class="subj" data-si="' + si + '"><div class="head"><h3>' + esc(s.name) + (s.band ? ' <small style="font-weight:400;color:var(--soft)">' + esc(s.band) + '</small>' : '') + '</h3>' +
      '<button class="ghost" data-act="moveSubj" data-si="' + si + '" data-dir="-1" aria-label="위로">▲</button><button class="ghost" data-act="moveSubj" data-si="' + si + '" data-dir="1" aria-label="아래로">▼</button>' +
      '<button class="ghost del" data-act="delSubj" data-si="' + si + '">삭제</button></div><div class="body">';
    if (!s.life) {
      h += '<div class="picker"><div class="row"><div><label>학년군</label><select data-pick="band" data-si="' + si + '">' + BAND_ORDER.map(function (b) { return '<option' + (b === s.band ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></div>' +
        '<div><label>성취기준 찾기</label><input data-pick="q" data-si="' + si + '" placeholder="낱말로 찾기 (예: 시각, 화폐, 인사)"></div></div>' +
        '<div class="stdlist" id="stdlist-' + si + '">' + stdListHtml(s, si, '') + '</div>' +
        '<div class="actions"><button class="pri" data-act="autoFill" data-si="' + si + '">⚡ 고른 성취기준으로 장기 목표·월별 계획 채우기</button><span class="hint" style="margin:0;align-self:center">앱 차시가 있으면 단원·차시·평가 준거까지 들어가요</span></div></div>';
    }
    if (s.stds.length) h += '<div class="chips" style="margin:6px 0">' + s.stds.map(function (c) { return '<span class="chip std" title="' + esc(STD[c]) + '"><b>' + esc(c) + '</b></span>'; }).join('') + '</div>';
    h += '<div class="grid">' + fld('현재 학습 수행 수준', base + '.present', s.present, { area: 1, wide: 1, ph: '- 할 수 있는 것(구체적 행동)\n- 도움이 필요한 것' }) +
      fld('학기 장기 목표', base + '.longGoals', s.longGoals, { area: 1, wide: 1, ph: '- (조건) + 행동 + (기준) 으로 적어요. 예: 그림 단서가 주어지면 ~을 5회 중 4회 할 수 있다.' }) + '</div>';
    h += '<div class="actions"><button data-act="presentFromRec" data-si="' + si + '">📋 앱 기록으로 현재 수준 초안</button></div>';
    h += '<div class="scroll"><table class="edit"><thead><tr><th style="width:74px">월</th><th style="width:140px">단원</th><th>단기 교육목표</th><th>교육내용</th><th style="width:120px">교육방법</th><th style="width:150px">성취준거</th><th style="width:70px">평가결과</th><th style="width:96px"></th></tr></thead><tbody>';
    h += s.rows.map(function (r, ri) {
      var rb = base + '.rows.' + ri;
      var tags = r.std.map(function (c) { return '<span class="chip std" title="' + esc(STD[c]) + '">' + esc(c) + '</span>'; }).concat(r.lessons.map(function (id) { var l = lessonById(id); return '<span class="chip les" title="' + esc(l ? lessonLabel(l) : id) + '">🎮 ' + esc(id) + '</span>'; })).join('');
      return '<tr><td><input data-p="' + rb + '.month" value="' + esc(r.month) + '" list="months-' + si + '"></td><td><textarea data-p="' + rb + '.unit">' + esc(r.unit) + '</textarea></td>' +
        '<td><textarea data-p="' + rb + '.goal">' + esc(r.goal) + '</textarea>' + (tags ? '<div class="chips">' + tags + '</div>' : '') + '</td><td><textarea data-p="' + rb + '.content">' + esc(r.content) + '</textarea></td>' +
        '<td><textarea data-p="' + rb + '.method">' + esc(r.method) + '</textarea></td><td><textarea data-p="' + rb + '.crit">' + esc(r.crit) + '</textarea></td>' +
        '<td><select data-p="' + rb + '.result"><option></option>' + ['가', '나', '다', '라'].map(function (g) { return '<option' + (g === r.result ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select><input data-p="' + rb + '.memo" value="' + esc(r.memo) + '" placeholder="근거" title="평가 근거"></td>' +
        '<td><button class="ghost" data-act="pickLes" data-si="' + si + '" data-ri="' + ri + '" title="앱 차시 연결">🎮</button><button class="ghost" data-act="moveRow" data-si="' + si + '" data-ri="' + ri + '" data-dir="-1" aria-label="위로">▲</button><button class="ghost del" data-del="' + rb + '" aria-label="삭제">✕</button></td></tr>';
    }).join('');
    h += '</tbody></table></div><datalist id="months-' + si + '">' + termMonths(cur.term).map(function (m) { return '<option value="' + m + '">'; }).join('') + '<option value="학기 내내"></datalist>';
    h += '<div class="actions"><button data-add="' + base + '.rows">＋ 행 추가</button></div></div></div>';
    return h;
  }
  function stdListHtml(s, si, q) {
    var list = ALL.filter(function (x) { return x.subj === s.name && x.band === s.band; });
    if (q) { var w = q.split(/\s+/).filter(Boolean); list = list.filter(function (x) { return w.every(function (t) { return (x.code + x.text + x.area).indexOf(t) >= 0; }); }); }
    if (!list.length) return '<p class="hint" style="padding:8px">' + (q ? '찾는 성취기준이 없어요.' : '이 교과는 이 학년군에 성취기준이 없어요. 학년군을 바꿔 보세요(예: 진로와 직업은 중1~3·고1~3, 바른 생활 등은 초1~2).') + '</p>';
    var lastA = null, h = '';
    list.forEach(function (x) {
      if (x.areaKey !== lastA) { h += '<div class="area">' + esc(x.area || x.subj) + '</div>'; lastA = x.areaKey; }
      var n = lessonsFor(x.code).length;
      h += '<label><input type="checkbox" data-std="' + x.code + '" data-si="' + si + '"' + (s.stds.indexOf(x.code) >= 0 ? ' checked' : '') + '><span><b>[' + esc(x.code) + ']</b> ' + esc(x.text) + (n ? ' <small>· 🎮 앱 차시 ' + n + '개</small>' : '') + '</span></label>';
    });
    return h;
  }

  /* ---------- 자동 채우기 ---------- */
  function autoFill(si) {
    var s = cur.subjects[si]; if (!s.stds.length) { toast('먼저 성취기준을 골라 주세요'); return; }
    if (s.rows.length && !confirm('지금 있는 월별 표 뒤에 새 행을 붙일까요? (기존 행은 그대로 둡니다)')) return;
    var months = termMonths(cur.term), stds = s.stds.slice();
    var goals = stds.map(function (c) { return '- ' + toGoal(STD[c]); });
    s.longGoals = (s.longGoals ? s.longGoals.replace(/\s+$/, '') + '\n' : '') + goals.join('\n');
    var made = 0;
    stds.forEach(function (c, k) {
      var month = months[Math.min(months.length - 1, Math.floor(k * months.length / stds.length))];
      var ls = lessonsFor(c).filter(function (l) { return !s.band || bandOfLesson(l) === s.band || !bandOfLesson(l); });
      if (!ls.length) ls = lessonsFor(c);
      var m = meta(c);
      if (!ls.length) {
        var r = newRow(month); r.unit = m.area ? '[' + m.area + ']' : ''; r.goal = toGoal(STD[c]); r.content = '- '; r.crit = toQuestion(r.goal); r.std = [c];
        s.rows.push(r); made++; return;
      }
      ls.slice(0, 3).forEach(function (l) {
        var r = newRow(month);
        r.unit = l.unit + '\n(' + l.schoolName + ' ' + l.no + ' ' + l.topic + ')';
        var g = l.crit ? toGoal(l.crit) : toGoal(STD[c]);
        r.goal = g;
        r.content = '- ' + l.goal + '\n- 앱 차시 ' + l.id + ' 〈' + (l.space || l.topic) + '〉 수준 ' + startLevel(l) + '→' + Math.min(5, startLevel(l) + 1) + '\n- 실제 생활 장면에서 해 보기';
        r.method = '직접교수, 모델링, 최소촉진\n앱 차시(수준 ' + startLevel(l) + ')';
        r.crit = toQuestion(g); r.std = [c]; r.lessons = [l.id];
        s.rows.push(r); made++;
      });
    });
    var ord = function (x) { var i = months.indexOf(x.month); return i < 0 ? 99 : i; };
    s.rows.sort(function (a, b) { return ord(a) - ord(b); });
    save(); render(); toast('장기 목표 ' + goals.length + '개, 월별 계획 ' + made + '행을 채웠어요. 학생에 맞게 고쳐 주세요');
  }
  function bandOfLesson(l) { return { elem: '', middle: '중1~3', high: '고1~3', basic: '' }[l.school] || ''; }
  function startLevel(l) {
    var pr = jget('oks_learning_progress_v1' + (cur.profile ? '__' + cur.profile : ''), {})[l.id];
    if (pr && pr.last) return Math.min(5, pr.last);
    return 2;
  }

  function presentFromRec(si) {
    var s = cur.subjects[si], ids = {};
    s.rows.forEach(function (r) { r.lessons.forEach(function (id) { ids[id] = 1; }); });
    if (!Object.keys(ids).length) LES.forEach(function (l) { if (l.subjectName === s.name || (s.name === '생활영어' && l.subject === 'english')) ids[l.id] = 1; });
    var rs = jget(LOG_KEY, []).filter(function (r) { return (r.profile || '') === (cur.profile || '') && ids[r.lesson]; });
    if (!rs.length) { toast('이 학생의 앱 기록이 아직 없어요'); return; }
    var by = {}; rs.forEach(function (r) { (by[r.lesson] = by[r.lesson] || []).push(r); });
    var lines = Object.keys(by).map(function (id) { var l = lessonById(id), sm = summarize(by[id]); return '- ' + (l ? l.topic : id) + ': 수준 ' + sm.maxLevel + '까지 ' + sm.n + '회, 독립·언어힌트 수행 ' + sm.rate + '% (최근: ' + sm.recent.join('→') + ')'; });
    s.present = (s.present ? s.present.replace(/\s+$/, '') + '\n' : '') + '[앱 기록 요약]\n' + lines.join('\n');
    save(); render(); toast('현재 수준에 앱 기록 요약을 넣었어요');
  }
  function recSummary() {
    var rs = jget(LOG_KEY, []).filter(function (r) { return (r.profile || '') === (cur.profile || ''); });
    if (!rs.length) { toast('이 학생의 앱 기록이 아직 없어요'); return; }
    var by = {}; rs.forEach(function (r) { var l = lessonById(r.lesson); var k = l ? l.subjectName : '기타'; (by[k] = by[k] || []).push(r); });
    var lines = Object.keys(by).map(function (k) { var sm = summarize(by[k]); return '- ' + k + ': ' + sm.n + '회 활동, 독립·언어힌트 수행 ' + sm.rate + '%, 최고 수준 ' + sm.maxLevel; });
    cur.tests.push({ tool: '옥쌤의 즐거운 교실 활동 기록', date: new Date().toISOString().slice(0, 10), result: lines.join(' / ') });
    save(); render(); toast('진단·평가 결과에 앱 기록 요약을 넣었어요');
  }
  function fillEval() {
    var n = 0, none = 0;
    cur.subjects.forEach(function (s) {
      s.rows.forEach(function (r) {
        if (!r.lessons.length) return;
        var sm = summarize(logsFor(cur, r.lessons));
        if (!sm) { none++; return; }
        r.result = gradeOf(sm.rate, cur.scale);
        r.memo = '앱 ' + sm.n + '회 · 독립 ' + sm.rate + '% · 수준 ' + sm.maxLevel + (sm.transfer.length ? ' · 생활 적용: ' + sm.transfer.slice(-1)[0] : '');
        n++;
      });
    });
    save(); render(); toast(n ? n + '개 행에 평가 결과를 제안했어요' + (none ? ' (기록 없는 행 ' + none + '개)' : '') : '학기 기간 안의 앱 기록이 없어요');
  }
  function draftEval() {
    cur.subjects.forEach(function (s) {
      var by = { '가': [], '나': [], '다': [], '라': [] };
      s.rows.forEach(function (r) { if (by[r.result]) by[r.result].push(r.goal.replace(/\s*\n\s*/g, ' ').replace(/\.$/, '')); });
      var parts = [];
      if (by['가'].length) parts.push('‘' + by['가'].join('’, ‘') + '’ 목표는 대체로 스스로 수행함.');
      if (by['나'].length) parts.push('‘' + by['나'].join('’, ‘') + '’ 목표는 부분적인 도움을 받아 수행함.');
      if (by['다'].length) parts.push('‘' + by['다'].join('’, ‘') + '’ 목표는 전반적인 도움이 필요하여 다음 학기에도 이어서 지도가 필요함.');
      if (by['라'].length) parts.push('‘' + by['라'].join('’, ‘') + '’ 목표는 아직 수행하지 못하여 목표 수준이나 지원 방법을 조정할 필요가 있음.');
      if (parts.length && !s.eval) s.eval = parts.join(' ');
    });
    if (!cur.evalTotal) {
      var all = []; cur.subjects.forEach(function (s) { s.rows.forEach(function (r) { if (r.result) all.push(r.result); }); });
      var good = all.filter(function (g) { return g === '가' || g === '나'; }).length;
      cur.evalTotal = all.length ? '이번 학기 단기 목표 ' + all.length + '개 중 ' + good + '개를 스스로 또는 부분적인 도움을 받아 수행함. (학생의 변화, 강점, 가정과 연계할 점을 덧붙여 주세요.)' : '';
    }
    save(); render(); toast('비어 있는 평가 칸에 초안을 넣었어요');
  }

  /* ---------- 앱 차시 고르기 ---------- */
  var lesTarget = null;
  function openLesDlg(si, ri) {
    lesTarget = { si: si, ri: ri };
    var s = cur.subjects[si], r = s.rows[ri];
    var related = {}; (r.std.length ? r.std : s.stds).forEach(function (c) { lessonsFor(c).forEach(function (l) { related[l.id] = 1; }); });
    var list = LES.slice().sort(function (a, b) { return (related[b.id] ? 1 : 0) - (related[a.id] ? 1 : 0); });
    var body = '<input id="lesQ" placeholder="차시 이름·교과로 찾기" style="margin-bottom:8px"><div class="lespick">' + list.map(function (l) {
      return '<label data-txt="' + esc(lessonLabel(l) + ' ' + l.id + ' ' + l.goal) + '"><input type="checkbox" value="' + l.id + '"' + (r.lessons.indexOf(l.id) >= 0 ? ' checked' : '') + '><span>' + (related[l.id] ? '⭐ ' : '') + '<b>' + esc(l.id) + '</b> ' + esc(lessonLabel(l)) + ' <small style="color:var(--soft)">— ' + esc(l.goal) + '</small></span></label>';
    }).join('') + '</div><p class="hint">⭐ = 이 행(또는 교과)의 성취기준과 연결된 차시</p>';
    var d = $('#lesDlg'); $('.dbody', d).innerHTML = body; d.showModal();
    $('#lesQ').addEventListener('input', function (e) { var q = e.target.value.trim(); $$('.lespick label', d).forEach(function (lb) { lb.style.display = !q || lb.getAttribute('data-txt').indexOf(q) >= 0 ? '' : 'none'; }); });
  }

  /* ---------- 출력 문서 ---------- */
  function lines(t) { return esc(t || '').replace(/\n/g, '<br>'); }
  function docHtml(p) {
    var i = p.info, title = p.year + '학년도 ' + p.term + '학기 개별화교육계획';
    var subjNames = p.subjects.map(function (s) { return s.name; }).join(', ');
    var h = '<div class="docwrap"><h1>' + esc(title) + (subjNames ? ' (' + esc(subjNames) + ')' : '') + '</h1>';
    h += '<table><tr><th>학교명</th><td>' + esc(i.school) + '</td><th>학년 반</th><td>' + esc(i.gradeClass) + '</td><th>이 름</th><td>' + esc(i.name) + '</td></tr>' +
      '<tr><th>특수학급 담임</th><td>' + esc(i.specialTeacher) + '</td><th>통합학급 담임</th><td>' + esc(i.generalTeacher) + '</td><th>계획 유형</th><td>' + esc(p.type) + '</td></tr></table>';
    h += '<h2>1. 인적사항</h2><table><tr><th colspan="2">학생 정보</th><th colspan="2">가족 정보</th></tr>' +
      '<tr><th>생년월일</th><td>' + esc(i.birth) + '</td><th>보호자</th><td>' + esc(i.guardian) + '</td></tr>' +
      '<tr><th>배치형태</th><td>' + esc(i.placement) + '</td><th>주 소</th><td>' + esc(i.address) + '</td></tr>' +
      '<tr><th>장애유형</th><td>' + esc(i.disability) + '</td><th>특수교육대상자<br>선정배치일</th><td>' + esc(i.selectDate) + '</td></tr>' +
      '<tr><th>복지카드</th><td>' + esc(i.welfare) + '</td><th>전화번호</th><td>' + esc(i.phone) + '</td></tr></table>';
    var team = p.team.filter(function (t) { return t.role || t.name; });
    h += '<h2>2. 개별화교육지원팀</h2><table><tr><th>역할</th><th>이름</th><th style="width:22%">서명</th></tr>' + team.map(function (t) { return '<tr><td>' + esc(t.role) + '</td><td>' + esc(t.name) + '</td><td></td></tr>'; }).join('') + '</table>';
    var mt = p.meetings.filter(function (m) { return m.date || m.topic; });
    if (mt.length) h += '<table><tr><th style="width:22%">협의회 일자</th><th>협의 내용</th></tr>' + mt.map(function (m) { return '<tr><td class="center">' + esc(m.date) + '</td><td>' + esc(m.topic) + '</td></tr>'; }).join('') + '</table>';
    var sv = p.services.filter(function (s) { return s.org || s.content || s.note; }); if (!sv.length) sv = p.services;
    h += '<h2>3. 특수교육 관련서비스</h2><table><tr><th>제공 서비스</th><th>지원기관명</th><th>교육(지원) 내용</th><th>비고</th></tr>' + sv.map(function (s) { return '<tr><td>' + esc(s.kind) + '</td><td>' + esc(s.org) + '</td><td>' + esc(s.content) + '</td><td>' + esc(s.note) + '</td></tr>'; }).join('') + '</table>';
    h += '<h2>4. 진단·평가 결과</h2><table><tr><th>검사도구</th><th style="width:18%">검사일자</th><th>검사결과</th></tr>' + p.tests.map(function (t) { return '<tr><td>' + esc(t.tool) + '</td><td class="center">' + esc(t.date) + '</td><td>' + esc(t.result) + '</td></tr>'; }).join('') + '</table>';
    h += '<h2>5. 현재 수행 수준 및 도전행동 관련 사항</h2><table>' +
      '<tr><th style="width:20%">현재 수행 수준 및<br>행동특성</th><td>' + lines(p.present) + '</td></tr>' +
      (p.strengths ? '<tr><th>강점·흥미</th><td>' + lines(p.strengths) + '</td></tr>' : '') +
      (p.studentNeeds ? '<tr><th>학생 요구</th><td>' + lines(p.studentNeeds) + '</td></tr>' : '') +
      '<tr><th>학부모 요구사항</th><td>' + lines(p.parentNeeds) + '</td></tr>' +
      '<tr><th>도전행동</th><td>' + (p.behavior.on ? lines(p.behavior.target) + (p.behavior.func ? '<br><small>추정 기능: ' + esc(p.behavior.func) + '</small>' : '') : '') + '</td></tr>' +
      '<tr><th>도전행동 중재방안</th><td>' + (p.behavior.on ? ['예방 전략|prevent', '대체행동 교수|replace', '반응 전략|respond', '위기 대응|crisis'].map(function (x) { var a = x.split('|'); return p.behavior[a[1]] ? '<b>' + a[0] + '</b>: ' + lines(p.behavior[a[1]]) : ''; }).filter(Boolean).join('<br>') : '') + '</td></tr></table>';
    if (p.etc) h += '<h2>6. 기타</h2><div class="box">' + esc(p.etc) + '</div>';
    if (p.transition.on) {
      var t = p.transition;
      h += '<h2>' + (p.etc ? '7' : '6') + '. 개별화전환교육계획</h2><table><tr><th style="width:22%">희망 진로</th><td>' + lines(t.hope) + '</td></tr><tr><th>현재 진로 준비 수준</th><td>' + lines(t.now) + '</td></tr><tr><th>전환 목표</th><td>' + lines(t.goal) + '</td></tr><tr><th>연계 기관·실습</th><td>' + lines(t.link) + '</td></tr><tr><th>필요한 지원</th><td>' + lines(t.support) + '</td></tr></table>';
    }
    p.subjects.forEach(function (s) {
      h += '<div class="pb"></div><h3>' + esc(p.term) + '학기 ' + esc(s.name) + (s.life ? ' 영역' : / /.test(s.name) ? '' : '과') + ' 교육계획</h3>';
      h += '<table><tr><th>현재 학습 수행 수준</th></tr><tr><td>' + lines(s.present) + '</td></tr><tr><th>' + esc(p.term) + '학기 장기 목표</th></tr><tr><td>' + lines(s.longGoals) + '</td></tr></table>';
      if (s.stds.length) h += '<table><tr><th style="width:18%">관련 성취기준<br><small>2022 개정 특수교육<br>기본 교육과정</small></th><td>' + s.stds.map(function (c) { return '[' + esc(c) + '] ' + esc(STD[c]); }).join('<br>') + '</td></tr></table>';
      h += '<table><tr><th rowspan="2" style="width:7%">월</th><th rowspan="2" style="width:13%">단원</th><th rowspan="2" style="width:18%">단기 교육목표</th><th rowspan="2">교육내용</th><th rowspan="2" style="width:10%">교육<br>방법</th><th colspan="2">평가계획</th></tr><tr><th style="width:17%">성취준거</th><th style="width:8%">평가결과</th></tr>' +
        (s.rows.length ? s.rows.map(function (r) { return '<tr><td class="center">' + esc(r.month) + '</td><td>' + lines(r.unit) + '</td><td>' + lines(r.goal) + (r.std.length ? '<br><small>' + r.std.map(function (c) { return '[' + esc(c) + ']'; }).join(' ') + '</small>' : '') + '</td><td>' + lines(r.content) + '</td><td>' + lines(r.method) + '</td><td>' + lines(r.crit) + '</td><td class="center">' + esc(r.result) + '</td></tr>'; }).join('')
          : '<tr><td colspan="7" class="center">-</td></tr>') + '</table>';
    });
    h += '<div class="pb"></div><h1>' + esc(p.year) + '학년도 ' + esc(p.term) + '학기 개별화교육계획 평가</h1>';
    h += '<table><tr><th>평가 기준</th></tr><tr><td><ul><li>가: ' + p.scale.a + '% 이상 수행한 경우: 대체로 스스로 수행함</li><li>나: ' + p.scale.b + '~' + p.scale.a + '% 수행한 경우: 부분적인 도움을 필요로 함</li><li>다: ' + p.scale.b + '% 미만 수행한 경우: 전반적인 도움을 필요로 함</li><li>라: 과제 수행을 전혀 하지 못함</li></ul></td></tr></table>';
    h += '<table><tr><th colspan="2">' + esc(p.term) + '학기 개별화교육계획 평가 결과</th></tr>' + p.subjects.map(function (s) { return '<tr><th style="width:16%">' + esc(s.name) + '</th><td style="height:60pt">' + lines(s.eval) + '</td></tr>'; }).join('') +
      '<tr><th>종합<br>평가</th><td style="height:70pt">' + lines(p.evalTotal) + '</td></tr></table>';
    h += '<p><small>※ 성취기준: 교육부 고시 제2022-34호 [별책 3] 특수교육 기본 교육과정(국가교육위원회 고시 제2026-2호 일부개정 포함). 성취기준·차시 연결과 자동 작성 문장은 작성 보조용 제안이며, 최종 내용은 개별화교육지원팀 협의로 정합니다.</small></p></div>';
    return h;
  }
  function openPreview() { if (!cur) { toast('먼저 계획을 만들어 주세요'); return; } persistNow(); var d = $('#preview'); $('.dbody', d).innerHTML = docHtml(cur); d.showModal(); }
  function persistNow() { clearTimeout(saveT); persist(); }
  function fileBase() { var p = cur, nm = (p.info.name || profLabel(p.profile) || '학생').replace(/[\\/:*?"<>|\s]+/g, '_'); return '개별화교육계획_' + p.year + '_' + p.term + '학기_' + nm; }
  function download(name, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function exportWord() {
    var css = 'body{font-family:"맑은 고딕","Malgun Gothic",sans-serif;font-size:10pt}table{border-collapse:collapse;width:100%;margin-bottom:6pt}th,td{border:1px solid #000;padding:3pt 5pt;vertical-align:top;font-size:10pt}th{background:#e8e8e8;text-align:center}h1{font-size:15pt;text-align:center}h2{font-size:12pt}h3{font-size:12pt;text-align:center}.center{text-align:center}.pb{page-break-before:always}small{font-size:8.5pt}';
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(fileBase()) + '</title><style>' + css + '</style></head><body>' + docHtml(cur).replace(/<div class="pb"><\/div>/g, '<br style="page-break-before:always" clear="all">') + '</body></html>';
    download(fileBase() + '.doc', new Blob(['﻿' + html], { type: 'application/msword' }));
    toast('한글·Word에서 열 수 있는 파일을 저장했어요');
  }
  function profLabel(id) { var f = profiles().filter(function (x) { return x.id === id; })[0]; return f ? f.label : (id ? '' : '공용'); }

  /* ---------- 머리 영역 ---------- */
  function drawHead() {
    var ps = profiles();
    $('#profSel').innerHTML = '<option value="">공용(프로필 없음)</option>' + ps.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === curProfile ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join('') + '<option value="__new">＋ 새 학생(별명)</option>';
    var mine = store.plans.filter(function (p) { return (p.profile || '') === (curProfile || ''); });
    $('#planSel').innerHTML = mine.length ? mine.map(function (p) { return '<option value="' + p.id + '"' + (cur && cur.id === p.id ? ' selected' : '') + '>' + esc(p.year + ' ' + p.term + '학기') + '</option>'; }).join('') : '<option value="">(계획 없음)</option>';
  }
  function choosePlan(id) {
    if (cur && !cur.keepPersonal) memPersonal[cur.id] = PERSONAL.reduce(function (o, k) { o[k] = cur.info[k]; return o; }, {});
    cur = store.plans.filter(function (p) { return p.id === id; })[0] || null;
    if (cur) restorePersonal(cur);
    drawHead(); render(); save();
  }
  function pickProfile(id) {
    curProfile = id;
    var mine = store.plans.filter(function (p) { return (p.profile || '') === (id || ''); });
    choosePlan(mine.length ? mine[mine.length - 1].id : null);
  }

  /* ---------- 이벤트 ---------- */
  document.addEventListener('input', function (e) {
    var t = e.target, path = t.getAttribute && t.getAttribute('data-p');
    if (t.tagName === 'TEXTAREA' && t.closest('table.edit')) grow(t);
    if (path && cur) {
      var v = t.type === 'number' ? Number(t.value) : t.value; setP(cur, path, v);
      if (PERSONAL.indexOf(path.replace('info.', '')) >= 0 && path.indexOf('info.') === 0) { memPersonal[cur.id] = memPersonal[cur.id] || {}; memPersonal[cur.id][path.slice(5)] = v; }
      save();
      if (path === 'start' || /^scale\./.test(path)) { clearTimeout(render.t); render.t = setTimeout(function () { var y = window.scrollY; render(); window.scrollTo(0, y); }, 600); }
      return;
    }
    var pk = t.getAttribute && t.getAttribute('data-pick');
    if (pk === 'q') { var si = +t.getAttribute('data-si'); $('#stdlist-' + si).innerHTML = stdListHtml(cur.subjects[si], si, t.value.trim()); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'profSel') { if (t.value === '__new') { var nm = prompt('학생 별명이나 번호를 적어 주세요 (실명 대신, 12자 이내)'); if (nm && nm.trim()) { pickProfile(addProfile(nm.trim().slice(0, 12))); } else drawHead(); } else pickProfile(t.value); return; }
    if (t.id === 'planSel') { choosePlan(t.value); return; }
    if (t.id === 'keepP') { cur.keepPersonal = t.checked; persistNow(); toast(t.checked ? '인적사항을 이 기기에 저장해요' : '인적사항은 저장하지 않아요'); return; }
    if (t.id === 'importJson') { importFile(t.files[0]); t.value = ''; return; }
    var chk = t.getAttribute('data-chk'); if (chk) { setP(cur, chk, t.checked); save(); var y = window.scrollY; render(); window.scrollTo(0, y); return; }
    var code = t.getAttribute('data-std');
    if (code) { var s = cur.subjects[+t.getAttribute('data-si')]; var k = s.stds.indexOf(code); if (t.checked && k < 0) s.stds.push(code); if (!t.checked && k >= 0) s.stds.splice(k, 1); s.stds.sort(); save(); return; }
    if (t.getAttribute('data-pick') === 'band') { var s2 = cur.subjects[+t.getAttribute('data-si')]; s2.band = t.value; save(); var y2 = window.scrollY; render(); window.scrollTo(0, y2); return; }
    if (t.getAttribute('data-p')) { save(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var y = window.scrollY, rerender = function () { render(); window.scrollTo(0, y); };
    var add = b.getAttribute('data-add');
    if (add) {
      var arr = getP(cur, add);
      var tpl = /rows$/.test(add) ? newRow('') : add === 'team' ? { role: '', name: '' } : add === 'meetings' ? { date: '', topic: '' } : add === 'services' ? { kind: '', org: '', content: '', note: '' } : { tool: '', date: '', result: '' };
      arr.push(tpl); save(); rerender(); return;
    }
    var del = b.getAttribute('data-del');
    if (del) { var ks = del.split('.'), idx = +ks.pop(), a2 = getP(cur, ks.join('.')); a2.splice(idx, 1); save(); rerender(); return; }
    var act = b.getAttribute('data-act'), si = +b.getAttribute('data-si'), ri = +b.getAttribute('data-ri');
    if (act === 'addSubj') {
      var nm = $('#addSubjName').value, band = $('#addSubjBand').value;
      if (LIFE.indexOf(nm) < 0 && !ALL.some(function (x) { return x.subj === nm && x.band === band; })) {
        var bands = BAND_ORDER.filter(function (bb) { return ALL.some(function (x) { return x.subj === nm && x.band === bb; }); });
        band = bands.indexOf(band) >= 0 ? band : bands[0] || band; toast(nm + '은(는) ' + bands.join('·') + ' 학년군에 있어요 → ' + band);
      }
      cur.subjects.push(newSubject(nm, LIFE.indexOf(nm) >= 0 ? '' : band)); save(); rerender();
      var last = $$('.subj'); if (last.length) last[last.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (act === 'delSubj') { if (confirm(cur.subjects[si].name + ' 계획을 지울까요?')) { cur.subjects.splice(si, 1); save(); rerender(); } return; }
    if (act === 'moveSubj') { var d = +b.getAttribute('data-dir'), j = si + d; if (j >= 0 && j < cur.subjects.length) { var tmp = cur.subjects[si]; cur.subjects[si] = cur.subjects[j]; cur.subjects[j] = tmp; save(); rerender(); } return; }
    if (act === 'moveRow') { var rows = cur.subjects[si].rows; if (ri > 0) { var t2 = rows[ri]; rows[ri] = rows[ri - 1]; rows[ri - 1] = t2; save(); rerender(); } return; }
    if (act === 'autoFill') return autoFill(si);
    if (act === 'presentFromRec') return presentFromRec(si);
    if (act === 'recSummary') return recSummary();
    if (act === 'fillEval') return fillEval();
    if (act === 'draftEval') return draftEval();
    if (act === 'pickLes') return openLesDlg(si, ri);
    if (act === 'exportJson') { persistNow(); download(fileBase() + '.json', new Blob([JSON.stringify({ app: 'oks-iep', v: 1, plan: cur }, null, 1)], { type: 'application/json' })); toast('백업 파일을 저장했어요(인적사항 포함 — 보관에 주의)'); return; }
    if (act === 'copyPlan') {
      var c = JSON.parse(JSON.stringify(cur)); c.id = uid(); c.created = new Date().toISOString();
      if (c.term === '1') c.term = '2'; else { c.term = '1'; c.year = String(+c.year + 1); }
      c.start = c.term === '1' ? c.year + '-03-02' : c.year + '-08-17';
      c.subjects.forEach(function (s) { s.present = s.eval ? '[지난 학기 평가]\n' + s.eval : s.present; s.eval = ''; s.rows.forEach(function (r) { r.result = ''; r.memo = ''; r.month = ''; }); });
      c.evalTotal = ''; store.plans.push(c); if (!cur.keepPersonal) memPersonal[c.id] = memPersonal[cur.id]; choosePlan(c.id); toast(c.year + '학년도 ' + c.term + '학기 계획으로 복사했어요'); return;
    }
    if (act === 'delPlan') { if (confirm('이 계획을 이 기기에서 지울까요? 되돌릴 수 없어요.')) { store.plans = store.plans.filter(function (p) { return p.id !== cur.id; }); persistNow(); pickProfile(curProfile); } return; }
  });
  function importFile(f) {
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result), p = d && d.plan; if (!p || !p.subjects) throw 0;
        p.id = uid(); p.profile = curProfile; store.plans.push(p); memPersonal[p.id] = PERSONAL.reduce(function (o, k) { o[k] = (p.info || {})[k]; return o; }, {});
        choosePlan(p.id); toast('계획을 불러왔어요');
      } catch (e) { toast('개별화교육계획 백업 파일이 아니에요'); }
    };
    rd.readAsText(f);
  }
  $('#newPlan').onclick = function () { var p = newPlan(curProfile); store.plans.push(p); choosePlan(p.id); toast('새 계획을 만들었어요'); };
  $('#prevBtn').onclick = openPreview;
  $('#pClose').onclick = function () { $('#preview').close(); };
  $('#pPrint').onclick = function () { $('#doc').innerHTML = docHtml(cur); $('#preview').close(); setTimeout(function () { window.print(); }, 50); };
  $('#pWord').onclick = exportWord;
  $('#lesClose').onclick = function () { $('#lesDlg').close(); };
  $('#lesOk').onclick = function () {
    var r = cur.subjects[lesTarget.si].rows[lesTarget.ri];
    r.lessons = $$('#lesDlg .lespick input:checked').map(function (x) { return x.value; });
    r.lessons.forEach(function (id) { var l = lessonById(id); if (l && !r.unit) r.unit = l.unit + '\n(' + l.schoolName + ' ' + l.no + ' ' + l.topic + ')'; });
    $('#lesDlg').close(); save(); var y = window.scrollY; render(); window.scrollTo(0, y);
  };
  window.addEventListener('beforeprint', function () { if (cur && !$('#doc').innerHTML) $('#doc').innerHTML = docHtml(cur); });
  window.addEventListener('afterprint', function () { $('#doc').innerHTML = ''; });

  /* 시작 */
  var last = jget('oks_iep_last', {});
  drawHead();
  var start = store.plans.filter(function (p) { return p.id === last.plan; })[0];
  if (start) { curProfile = start.profile || ''; choosePlan(start.id); } else pickProfile(curProfile);
  window.OKS_IEP = { toGoal: toGoal, toQuestion: toQuestion, docHtml: function () { return cur && docHtml(cur); } };
})();
