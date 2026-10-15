/* 검색 색인(search/index.json) 만들기
   사용: node scripts/build_search.mjs   (로컬 서버가 8742 포트에 떠 있고 Playwright 가 있어야 해요)
   - 차시(OKS_LESSONS 중 게임이 열린 것) · 학습지(학습지 화면의 차시 목록) · 우주 지도 건물 · 놀이/도구 쪽을 한 파일에 모아요.
   - 새 놀이나 화면을 추가했다면 아래 PAGES 에 한 줄 넣고 다시 실행하세요.
   항목: { t 제목, c 분류(lesson·sheet·game·tool·place), e 그림말, s 부제, k 찾기 도움말, u 주소(루트 기준) } */
import fs from 'fs';
import vm from 'vm';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_PATH || '/home/claude/.npm-global/lib/node_modules/playwright');
const ROOT = new URL('..', import.meta.url).pathname;
const BASE = process.env.BASE || 'http://localhost:8742/';

/* ---------- 놀이 · 도구 쪽 (손으로 관리) ---------- */
const PAGES = [
  /* 분류, 그림말, 제목, 부제, 찾기 도움말, 주소 */
  ['game', '🌻', '햇살 농장', '씨앗 심고 키우기', '농사 농장 수확 채소 과일 씨앗 물주기', 'games/farm/index.html'],
  ['game', '🚜', '쑥쑥 햇살 농장', '농장 타이쿤', '농장 배달 키우기 지도 주소', 'games/tycoon/index.html'],
  ['game', '🎪', '미니게임 마을', '5교과 미니게임', '미니게임 모음 놀이터', 'minigames/index.html'],
  ['game', '🎈', '풍선 터트리기', '미니게임', '풍선 터치 과일 색깔', 'games/balloons/index.html'],
  ['game', '🐦', '새 잡기 놀이', '미니게임', '새 동물 터치 잡기', 'games/birds/index.html'],
  ['game', '🔵', '점 잇기', '미니게임', '점 이어 그리기 숫자 순서 선', 'games/dots/index.html'],
  ['game', '🎣', '바다 낚시', '미니게임', '낚시 물고기 바다 세기', 'games/fishing/index.html'],
  ['game', '🔍', '그림 속 색 찾기', '미니게임', '색깔 찾기 숨은 그림', 'games/look/index.html'],
  ['game', '🃏', '그림 짝 찾기', '미니게임', '카드 짝 맞추기 기억력', 'games/match/index.html'],
  ['game', '🙂', '나를 만들어요', '미니게임', '얼굴 꾸미기 나 신체 감정', 'games/myface/index.html'],
  ['game', '🧩', '그림 퍼즐', '미니게임', '퍼즐 맞추기 조각', 'games/puzzle/index.html'],
  ['game', '👃', '체험 놀이', '미니게임', '감각 오감 만지기 소리 냄새', 'games/senses/index.html'],
  ['game', '🔷', '모양 뽑기', '미니게임', '도형 동그라미 세모 네모 뽑기', 'games/shapes/index.html'],
  ['game', '🎨', '마법 미술 공방 타이쿤', '미술 가게 운영', '미술 색 그림 가게', 'minigames/art-tycoon.html'],
  ['game', '☕', '동물 친구 카페', '직업 체험', '카페 음료 주문 직업 손님', 'career/cafe.html'],
  ['game', '🧋', '정글 바리스타', '직업 체험', '바리스타 음료 커피 직업', 'career/barista.html'],
  ['game', '🏪', '가게 영업', '타이쿤 · 일터 거리', '가게 손님 주문 일터 직업 염색 목공 분식 뷰티 드론', 'shop/index.html'],
  ['game', '🚌', '마을과 버스', '강릉 · 춘천 · 원주', '버스 마을 분원 이동', 'town/index.html'],
  ['game', '🗺️', '통합 퀘스트', '마을 퀘스트', '퀘스트 임무 미션', 'quests/index.html'],
  ['game', '🔤', '국어 도서관', '한글별 여행', '한글 글자 낱말 읽기 자음 모음', 'korean/index.html'],
  ['game', '⭐', '소리 별 · 글자 받기', '한글 놀이', '소리 글자 받기 한글', 'korean/catch.html'],
  ['game', '✏️', '한글 따라 쓰기', '자음·모음·글자·낱말', '글씨 쓰기 한글 쓰기 획순', 'trace/hangul.html'],
  ['game', '🔡', '알파벳 따라 쓰기', '영어 기초', '영어 알파벳 쓰기 abc', 'trace/alpha.html'],
  ['game', '🏃', '씽씽 별 마을', '체육 · 놀이', '체육 운동 스포츠 육상 수영 양궁 체조 태권도 축구 야구 농구 럭비 테니스 탁구', 'sports/index.html'],
  ['game', '🎲', '놀이별 마을', '3D 보드게임 · 놀이', '보드게임 놀이터', 'playground/index.html'],
  ['game', '🎳', '3D 볼링', '놀이별', '볼링 공 핀', 'playground/bowling/index.html'],
  ['game', '♟️', '3D 체스', '놀이별', '체스 말 보드게임', 'playground/chess/index.html'],
  ['game', '🎯', '3D 다트', '놀이별', '다트 던지기 점수', 'playground/darts/index.html'],
  ['game', '⚫', '3D 바둑', '놀이별', '바둑 돌 보드게임', 'playground/go/index.html'],
  ['game', '🀄', '3D 장기', '놀이별', '장기 보드게임', 'playground/janggi/index.html'],
  ['game', '🪶', '제기차기', '놀이별', '제기 전통놀이', 'playground/jegi/index.html'],
  ['game', '⚪', '3D 오목', '놀이별', '오목 보드게임 바둑돌', 'playground/omok/index.html'],
  ['game', '🔘', '3D 오셀로', '놀이별', '오셀로 보드게임 뒤집기', 'playground/othello/index.html'],
  ['game', '🏎️', '스피드 레이스', '놀이별', '레이싱 자동차 달리기', 'playground/racing/index.html'],
  ['game', '🚗', '주차장 탈출', '놀이별', '퍼즐 러시아워 자동차 길 찾기', 'playground/rushhour/index.html'],
  ['game', '🕰️', '3D 시계', '수학 · 시각과 시간', '시계 아날로그 디지털 전자시계 시침 분침 초침 시각 시간 몇 시 몇 분', 'math/clock3d/index.html'],
  ['game', '🌴', '정글 점프 별', '모험 게임', '정글 점프 열매 모험', 'https://fumon1218.github.io/jungle-jump/'],
  ['game', '🔤', '한글별 · 워드 마스터', '한글 게임', '워드 마스터 한글 자음 모음 문장', 'https://fumon1218.github.io/word-master/?from=oks'],
  ['tool', '🌱', '배움 지도', '교과 → 학교급 → 차시 → 수준', '차시 목록 기록 학생 프로필 별', 'learn/index.html'],
  ['tool', '📘', '교사용 지도 계획서', '교육과정 · 학습 목표 · 평가', '선생님 계획서 성취기준 평가 준거 지도안', 'curriculum/plan.html'],
  ['tool', '📖', '교사용 교육과정', '교육과정 안내', '선생님 교육과정 안내 2022 개정', 'curriculum/teacher-guide.html'],
  ['tool', '📋', '활동 관찰 기록', '교사용', '선생님 기록 관찰 CSV 평가', 'curriculum/reports.html'],
  ['tool', '✍️', '문항 편집', '선생님 문항 · 우리 학교 사진', '선생님 문항 추가 사진 이름 카드 편집', 'curriculum/editor.html'],
  ['tool', '📝', '학습지 만들기', '인쇄용 학습지', '프린트 인쇄 학습지 정답지 PDF', 'worksheet/index.html'],
  ['tool', '🧩', '종이 퍼즐 학습지', '인쇄용 퍼즐', '퍼즐 프린트 인쇄 미로 낱말', 'worksheet/puzzle.html'],
  ['tool', '🏃', '씽씽 별 마을 학습지', '체육 학습지', '체육 학습지 프린트', 'sports/worksheet.html'],
  ['tool', '🏫', '예전 학교 마을', '옛 첫 화면', '클래식 학교 마을', 'classic.html']
];
const SPORTS = [['athletics', '육상', '🏃'], ['swimming', '수영', '🏊'], ['archery', '양궁', '🏹'], ['gymnastics', '체조', '🤸'], ['taekwondo', '태권도', '🥋'], ['soccer', '축구', '⚽'], ['baseball', '야구', '⚾'], ['basketball', '농구', '🏀'], ['rugby', '럭비', '🏉'], ['tennis', '테니스', '🎾'], ['tabletennis', '탁구', '🏓']];
const SUBJ = { korean: '📚', english: '🌏', math: '➗', science: '🔬', social: '🏘️', art: '🎨', music: '🎵', career: '💼' };

const KO = { korean: '국어', english: '영어', math: '수학', science: '과학', social: '사회', art: '미술', music: '음악', career: '진로' };
const out = [];
const seen = new Set();
const add = (o) => { const key = o.c + '|' + o.u; if (seen.has(key)) return; seen.add(key); out.push(o); };
PAGES.forEach(([c, e, t, s, k, u]) => add({ t, c, e, s, k, u }));
SPORTS.forEach(([id, name, e]) => add({ t: name + ' 활동', c: 'game', e, s: '씽씽 별 마을 · 체육', k: '체육 운동 스포츠 ' + name, u: 'sports/?festival=summer&sport=' + id }));

/* 우주 지도: 별 · 건물 · 건물 안의 바로가기 */
const sandbox = { window: {} }; vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(ROOT + 'space/data.js', 'utf8'), sandbox);
const SP = sandbox.window.OKS_SPACE;
SP.STARS.forEach((s) => {
  add({ t: s.name, c: 'place', e: '🪐', s: '우주 지도 · 별', k: s.subjects.map((x) => KO[x] || x).join(' ') + ' ' + (s.hello || ''), u: 'index.html#' + s.id });
  (SP.B[s.id] || []).forEach((b) => {
    if (b.kind === 'lessons' || b.kind === 'hub' || b.kind === 'room' || b.kind === 'review') add({ t: b.name, c: 'place', e: b.emo || '🏠', s: s.short + ' · ' + b.sub, k: (b.keys || []).join(' '), u: 'index.html#' + s.id + '/' + b.id });
    (b.links || []).forEach((l) => { const m = /^(\S+)\s+(.*)$/.exec(l[0]) || [0, '🔗', l[0]]; add({ t: m[2].replace(/\s*\(.*$/, ''), c: l[1].indexOf('http') === 0 ? 'game' : 'game', e: m[1], s: b.name + ' · ' + s.short, k: l[0], u: l[1] }); });
  });
});

/* 차시 · 학습지: 실제 화면에서 모아요 */
const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
await p.goto(BASE + 'worksheet/index.html?id=clk-1');
await p.waitForSelector('#lesson option', { state: 'attached' });
const data = await p.evaluate(() => {
  const L = (window.OKS_LESSONS.lessons || []).filter((l) => window.OKS_CONTENT && window.OKS_CONTENT[l.id]);
  const lessons = L.map((l) => ({ id: l.id, subject: l.subject, subjectName: l.subjectName, schoolName: l.schoolName, unit: l.unit, no: l.no, topic: l.topic, goal: l.goal, space: l.space }));
  const sheets = [].map.call(document.querySelectorAll('#lesson option'), (o) => ({ id: o.value, text: o.textContent, group: o.parentElement.label || '' }));
  return { lessons, sheets };
});
await b.close();
data.lessons.forEach((l) => add({ t: l.topic, c: 'lesson', e: SUBJ[l.subject] || '📘', s: [l.subjectName, l.schoolName, l.unit, l.no + '차시'].join(' · '), k: [l.goal, l.space].filter(Boolean).join(' '), u: 'play/?id=' + l.id + '&level=2' }));
data.sheets.forEach((o) => add({ t: o.text.indexOf(' · ') > 0 ? o.text : o.text.replace(/^\S+\s+\S+\s+/, ''), c: 'sheet', e: '📝', s: '학습지 · ' + o.group, k: '프린트 인쇄 학습지 ' + o.group + ' ' + o.text, u: 'worksheet/?id=' + o.id + '&level=3' }));

fs.mkdirSync(ROOT + 'search', { recursive: true });
fs.writeFileSync(ROOT + 'search/index.json', JSON.stringify({ v: 1, built: new Date().toISOString().slice(0, 10), items: out }));
const cnt = {}; out.forEach((o) => (cnt[o.c] = (cnt[o.c] || 0) + 1));
console.log('항목', out.length, cnt);
