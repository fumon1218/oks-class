"""교육과정 설계표(엑셀) → curriculum/lessons.json 변환.
엑셀을 고친 뒤 `python3 scripts/build_lessons.py` 를 다시 실행하면 앱 데이터가 갱신됩니다."""
import json, os, openpyxl
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
        'levels': [r[9], r[10], r[11], r[12], r[13]],
        'record': r[14], 'verify': r[15], 'source': r[16],
    })
# 영어 기초층(알파벳 → 낱말 → 문장): 학교급과 상관없이 누구나 시작하는 단계
EB = json.load(open(os.path.join(ROOT, 'curriculum/source/english_basics.json'), encoding='utf-8'))
for u in EB['units']:
    for k, L in enumerate(u['lessons'], 1):
        lessons.append({
            'id': '05-00-%02d-%02d' % (u['no'], k), 'subject': 'english', 'subjectName': '영어',
            'school': 'basic', 'schoolName': '기초', 'track': EB['track'],
            'unit': u['name'], 'unitNo': u['no'], 'lessonNo': k, 'no': '%d-%d' % (u['no'], k),
            'topic': L['topic'], 'goal': L['goal'], 'space': u['space'],
            'levels': ['〈%s〉 %s' % (u['space'], t) for t in L['levels']],
            'record': '참여·선택·쓰기·독립 수행(단계별 관찰)', 'verify': '자체 구성(기초 영어)', 'source': '',
        })
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
