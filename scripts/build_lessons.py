"""교육과정 설계표(엑셀) → curriculum/lessons.json 변환.
엑셀을 고친 뒤 `python3 scripts/build_lessons.py` 를 다시 실행하면 앱 데이터가 갱신됩니다."""
import json, os, re, openpyxl


def _has_final(ch):
    return '가' <= ch <= '힣' and (ord(ch) - 0xAC00) % 28 != 0


def josa(s):
    """설계표 틀 문장의 조사를 바로잡습니다. '소리을(를)' → '소리를', '이해을 수행' → '이해를 수행' ('마을'은 그대로)."""
    if not isinstance(s, str):
        return s
    s = re.sub(r'([가-힣])(을|이|은|과)\((를|가|는|와)\)',
               lambda m: m.group(1) + (m.group(2) if _has_final(m.group(1)) else m.group(3)), s)
    s = re.sub(r'([가-힣])을 (생활|활용|수행|표현|스스로)',
               lambda m: m.group(0) if m.group(1) == '마' or _has_final(m.group(1))
               else m.group(1) + '를 ' + m.group(2), s)
    return s


def codes(v):
    return [c.strip() for c in str(v).split(',') if c.strip()] if v else []


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'curriculum/source/okssem_7subjects_2022_game_curriculum_126lessons.xlsx')
SUBJ = {'국어': 'korean', '수학': 'math', '사회': 'social', '과학': 'science', '영어': 'english', '미술': 'art', '음악': 'music'}
SCHOOL = {'기초': 'basic', '초등': 'elem', '중등': 'middle', '고등': 'high'}   # 기초: 학교급 공통 기초 단계(영어 알파벳 등)
wb = openpyxl.load_workbook(SRC, data_only=True)
guide = {r[0]: r[1] for r in wb['시작_안내'].iter_rows(values_only=True) if r[0]}
lessons = []
for r in wb['전체_차시'].iter_rows(min_row=2, values_only=True):
    if not r[0]:
        continue
    unit_no, lesson_no = (int(x) for x in str(r[5]).split('-'))
    lessons.append({
        'id': r[0], 'subject': SUBJ[r[1]], 'subjectName': r[1],
        'school': SCHOOL[r[2]], 'schoolName': r[2], 'track': r[3],
        'unit': r[4], 'unitNo': unit_no, 'lessonNo': lesson_no, 'no': str(r[5]),
        'topic': r[6], 'goal': r[7], 'space': r[8],
        'levels': [josa(r[i]) for i in range(9, 14)],
        'record': r[14], 'verify': r[15], 'source': r[16],
        # 성취기준 연결(R~W열): 별책 3 대조 초안 — 교사 검토 필요, 고시 아님
        'std': codes(r[17]) if len(r) > 17 else [], 'grade': r[18] if len(r) > 18 else None,
        'match': r[19] if len(r) > 19 else None, 'stdEarly': codes(r[20]) if len(r) > 20 else [],
        'stdLink': codes(r[21]) if len(r) > 21 else [], 'crit': r[22] if len(r) > 22 else None,
    })
# 기초층(학교급과 상관없이 누구나 시작하는 단계): 영어(알파벳 → 낱말 → 문장), 국어(한글 자음·모음 → 글자 → 낱말)
def basics(fname, key, subj, subjName, code, verify):
    EB = json.load(open(os.path.join(ROOT, 'curriculum/source/' + fname), encoding='utf-8'))
    for u in EB['units']:
        for k, L in enumerate(u['lessons'], 1):
            lessons.append({
                'id': '%s-00-%02d-%02d' % (code, u['no'], k), 'subject': subj, 'subjectName': subjName,
                'school': 'basic', 'schoolName': '기초', 'track': EB['track'],
                'unit': u['name'], 'unitNo': u['no'], 'lessonNo': k, 'no': '%d-%d' % (u['no'], k),
                'topic': L['topic'], 'goal': L['goal'], 'space': u['space'],
                'levels': ['〈%s〉 %s' % (u['space'], t) for t in L['levels']],
                'record': '참여·선택·쓰기·독립 수행(단계별 관찰)', 'verify': verify, 'source': '',
            })
basics('english_basics.json', 'en', 'english', '영어', '05', '자체 구성(기초 영어)')
basics('korean_basics.json', 'ko', 'korean', '국어', '01', '자체 구성(기초 한글 · 수업 설계 제안)')
basics('math_clock_basics.json', 'mc', 'math', '수학', '02', '자체 구성(시각과 시간 · 수업 설계 제안)')

# 시각과 시간 차시의 게임 내용표(play/clock-content.js) — 엔진 play/clock.js, 문제 math/clock3d/clock-rounds.js
def clock_content():
    CB = json.load(open(os.path.join(ROOT, 'curriculum/source/math_clock_basics.json'), encoding='utf-8'))
    rows = []
    for u in CB['units']:
        for k, L in enumerate(u['lessons'], 1):
            rid = '02-00-%02d-%02d' % (u['no'], k)
            desc = json.dumps([t for t in L['levels']], ensure_ascii=False)
            extra = ", rounds: [3, 3, 3, 3, 4]" if L['clock'] == 'timer' else ''
            rows.append("  C['%s'] = { engine: 'clock', clock: '%s'%s, desc: %s };" % (rid, L['clock'], extra, desc))
    with open(os.path.join(ROOT, 'play/clock-content.js'), 'w', encoding='utf-8') as f:
        f.write("/* 자동 생성: scripts/build_lessons.py (curriculum/source/math_clock_basics.json) — 시각과 시간 차시 내용표. 엔진: play/clock.js */\n(function () {\n  var C = window.OKS_CONTENT = window.OKS_CONTENT || {};\n" + "\n".join(rows) + "\n})();\n")
clock_content()
out = {
    'title': guide.get('옥쌤의 즐거운 교실 | 7교과 3D 교육게임 통합 설계표') or '7교과 3D 교육게임 통합 설계표',
    'version': guide.get('버전'), 'note': guide.get('중요 구분'),
    'levelNames': [guide.get(f'수준 {i}') for i in range(1, 6)],
    'record': guide.get('평가 기록'),
    'subjects': [{'key': v, 'name': k} for k, v in SUBJ.items()],
    'schools': [{'key': v, 'name': k} for k, v in SCHOOL.items()],
    'lessons': lessons,
}
with open(os.path.join(ROOT, 'curriculum/lessons.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print(len(lessons), 'lessons')
# 서버 없이(파일로 열거나 오프라인일 때도) 쓸 수 있게 스크립트판도 만든다
with open(os.path.join(ROOT, 'curriculum/lessons.js'), 'w', encoding='utf-8') as f:
    f.write('/* 자동 생성: scripts/build_lessons.py — 직접 고치지 말고 엑셀을 고친 뒤 다시 만드세요 */\n')
    f.write('window.OKS_LESSONS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
