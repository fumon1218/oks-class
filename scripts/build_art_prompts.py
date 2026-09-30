#!/usr/bin/env python3
"""scripts/art_manifest.py 로 그림 프롬프트 문서 두 가지를 만듭니다.
 - docs/image-prompts-v2.md   (저장소용 글 문서)
 - docs/image-prompts.html    (복사 버튼·체크 표시가 있는 작업 페이지)
사용: python3 scripts/build_art_prompts.py"""
import os, sys, json, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import art_manifest as M  # noqa: E402

PRI = {1: '1순위 — 우주 지도 만들기에 꼭 필요', 2: '2순위 — 별 안 풍경과 내 캐릭터', 3: '3순위 — 그림 사전 (받는 대로 이모지가 그림으로 바뀜)'}
RULES = [
    '파일 이름을 표 그대로 해 주세요 (예: star_sea.png, sheet_fruit.png). png·jpg·webp 모두 괜찮아요. 여러 장은 zip 하나로 주셔도 돼요.',
    '글자·숫자·로고가 들어가면 다시 만들어 주세요. 이름과 숫자는 앱에서 붙여요.',
    '하나짜리 그림(건물·별·캐릭터)은 흰 배경이면 충분해요. 투명 배경이면 더 좋아요. 흰 배경은 제가 지워요.',
    '여러 개를 한 장에(sheet_…) 그릴 때는 물건끼리 닿지 않게, 순서는 왼쪽 위부터 오른쪽으로. 순서가 바뀌면 알려 주세요.',
    '캐릭터는 첫 그림을 참고 그림으로 함께 넣어야 같은 얼굴이 유지돼요 (옥쌤은 지금 앱의 옥쌤 그림).',
    '돈·시계·달력·숫자·도형·색·표지판처럼 정확해야 하는 것은 제가 코드로 그려요. 만들지 않으셔도 돼요.',
    '받은 것부터 바로 넣어요. 한꺼번에 다 주지 않으셔도 돼요.',
]
TIPS = [
    '챗GPT: 투명 배경과 여러 개 한 장(sheet)에 강해요 → 건물·사물·사람 추천.',
    '제미나이: 참고 그림을 보고 같은 캐릭터 유지하기, 넓은 배경에 강해요 → 옥쌤·별지기·배경 추천.',
    '프롬프트는 영어 그대로 붙여 넣으세요 (공통 그림체 문장이 이미 앞에 들어 있어요).',
]


def rows():
    out = []
    for g in sorted(M.GROUPS, key=lambda g: M.GROUPS.index(g) + g['priority'] * 100):
        items = []
        for it in g['items']:
            d = {'file': it['file'], 'ko': it['ko'], 'use': it.get('use', ''), 'kind': it['kind'], 'star': it.get('star', ''),
                 'ratio': it.get('ratio') or ('3:1' if it['kind'] == 'sheet' and it['grid'][0] == 1 else '1:1'),
                 'ref': it.get('ref', ''), 'prompt': M.full_prompt(g, it)}
            if it['kind'] == 'sheet':
                d['grid'] = list(it['grid']); d['names'] = [[k, ko, emo] for k, ko, emo, _ in it['names']]
            items.append(d)
        out.append({'id': g['id'], 'title': g['title'], 'priority': g['priority'], 'folder': g['folder'], 'note': g['note'], 'items': items})
    return out


def ref_label(ref):
    if not ref: return ''
    if ref.startswith('icons/'): return '참고 그림: 지금 앱의 옥쌤 그림 (함께 보내 드린 mascot-cheer.png)'
    if 'avatar' in ref: return '참고 그림: 학생 캐릭터 sheet_kids 그림'
    return '참고 그림: ' + ref


def md(data):
    L = ['# 그림 프롬프트 — 우주 콘셉트·교과 공간·그림 사전', '',
         '옥쌤의 즐거운 교실(초·중·고 교육 앱)을 **우주 여행** 콘셉트로 바꾸는 데 필요한 그림 목록입니다. 정글 점프(강원특수교육원 홍보 게임)와 겹치지 않는 이 앱만의 그림이에요.',
         '작업 페이지(`docs/image-prompts.html`)에서 복사 버튼으로 쓰면 편해요. 목록 원본은 `scripts/art_manifest.py`.', '',
         '## 보내 주실 때', ''] + ['- ' + r for r in RULES] + ['', '### 어느 도구로?', ''] + ['- ' + t for t in TIPS] + ['',
         '### 공통 그림체 (모든 프롬프트 앞에 이미 들어 있음)', '', '```', M.STYLE, '```', '']
    total = 0
    for g in data:
        n = sum(len(i.get('names', [1])) for i in g['items'])
        L += ['---', '', '## [%d순위] %s — 그림 %d장 → 파일 %d개' % (g['priority'], g['title'], len(g['items']), n), '', '> ' + g['note'], '']
        for it in g['items']:
            total += 1
            head = '### `%s.png` — %s' % (it['file'], it['ko'])
            L += [head, '- 비율 %s · %s%s' % (it['ratio'], ('%s · ' % it['star']) if it['star'] else '', it['use'])]
            if it['ref']: L.append('- **' + ref_label(it['ref']) + '**')
            if it.get('names'):
                L.append('- 칸 순서: ' + ' / '.join('%d.%s' % (i + 1, n[1]) for i, n in enumerate(it['names'])))
            L += ['', '```', it['prompt'], '```', '']
    L += ['---', '', '### 이전 문서의 차시 장면 15종', '', '`docs/gemini-prompts-scenes.md`의 배경·조각 30장도 그대로 쓰여요(차시 게임 안 장면). 같은 방법으로 보내 주시면 함께 넣어요.', '']
    return '\n'.join(L), total


TPL = r'''<title>옥쌤 그림 작업판</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* 밤하늘 남색 머리 띠 + 밝은 작업판: 할 일 목록처럼 훑고, 카드마다 복사·완료 */
:root{
  --bg:#f5f4fa; --panel:#ffffff; --ink:#1d1b33; --muted:#6a6788; --line:#e3e0f0;
  --night:#1c1a3f; --night-ink:#f3f1ff; --accent:#5b4fd6; --accent-soft:#ecebff; --done:#2f9e6a; --done-soft:#e6f6ee; --gold:#f2b53a;
  --f-display:'Jua','Noto Sans KR',system-ui,sans-serif; --f-body:'Noto Sans KR',system-ui,-apple-system,sans-serif; --f-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#12111f; --panel:#1b1a2e; --ink:#ecebf8; --muted:#a19fbf; --line:#2d2b47; --night:#0b0a18; --night-ink:#f3f1ff;
  --accent:#9d94ff; --accent-soft:#2a2750; --done:#5fd39b; --done-soft:#17362a; --gold:#f5c35a; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#12111f; --panel:#1b1a2e; --ink:#ecebf8; --muted:#a19fbf; --line:#2d2b47; --night:#0b0a18; --night-ink:#f3f1ff;
  --accent:#9d94ff; --accent-soft:#2a2750; --done:#5fd39b; --done-soft:#17362a; --gold:#f5c35a; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:15px;line-height:1.6;margin:0}
.hero{background:var(--night);color:var(--night-ink);padding-block:28px 22px;position:relative;overflow:hidden}
.hero canvas{position:absolute;inset:0;width:100%;height:100%;opacity:.8}
.wrap{max-width:1040px;margin:0 auto;padding-inline:16px;position:relative}
.hero h1{font-family:var(--f-display);font-weight:400;font-size:clamp(26px,5vw,38px);margin:0;text-wrap:balance}
.hero p{margin:6px 0 0;opacity:.85;max-width:62ch}
.meter{display:flex;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap}
.bar{flex:1 1 220px;height:10px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden}
.bar i{display:block;height:100%;width:0;background:var(--gold);border-radius:99px;transition:width .3s}
.meter b{font-variant-numeric:tabular-nums;font-weight:500}
nav.tabs{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}
nav.tabs .wrap{display:flex;gap:8px;padding-block:10px;overflow-x:auto}
nav.tabs button{font:inherit;font-size:14px;border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:6px 14px;border-radius:99px;cursor:pointer;white-space:nowrap}
nav.tabs button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
button:focus-visible,summary:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
main .wrap{padding-block:20px 60px;display:grid;gap:28px}
details.guide{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px}
details.guide summary{cursor:pointer;font-weight:700}
details.guide ul{margin:8px 0 4px;padding-left:20px}
.style-line{font-family:var(--f-mono);font-size:12.5px;background:var(--accent-soft);padding:10px 12px;border-radius:8px;overflow-wrap:anywhere}
section h2{font-family:var(--f-display);font-weight:400;font-size:24px;margin:0;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
section h2 .pri{font-family:var(--f-body);font-size:12px;letter-spacing:.04em;background:var(--accent-soft);color:var(--accent);padding:2px 10px;border-radius:99px;font-weight:700}
section h2 .cnt{font-family:var(--f-body);font-size:13px;color:var(--muted)}
section .note{color:var(--muted);margin:4px 0 12px;max-width:75ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;min-width:0}
.card.is-done{background:var(--done-soft);border-color:var(--done)}
.top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.fname{font-family:var(--f-mono);font-size:13px;background:var(--accent-soft);color:var(--accent);border:0;border-radius:6px;padding:3px 8px;cursor:pointer;overflow-wrap:anywhere;text-align:left}
.ko{font-weight:700;font-size:16px;line-height:1.35}
.meta{font-size:13px;color:var(--muted)}
.ref{font-size:13px;color:var(--ink);background:var(--accent-soft);border-radius:6px;padding:4px 8px}
.cells{display:grid;gap:4px;font-size:12.5px}
.cells span{border:1px dashed var(--line);border-radius:6px;padding:3px 6px;text-align:center;min-width:0;overflow-wrap:anywhere}
.cells span em{font-style:normal;color:var(--muted);font-variant-numeric:tabular-nums;margin-right:3px}
.prompt{font-family:var(--f-mono);font-size:12px;line-height:1.5;color:var(--muted);max-height:4.6em;overflow:hidden;position:relative;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.card.open .prompt{max-height:none}
.acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}
.acts button{font:inherit;font-size:13.5px;border-radius:8px;padding:6px 12px;cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--ink)}
.acts .copy{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:700}
.acts .done[aria-pressed="true"]{background:var(--done);border-color:var(--done);color:#fff}
.chip{font-size:11.5px;border:1px solid var(--line);border-radius:99px;padding:1px 8px;color:var(--muted);white-space:nowrap}
.toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--night);color:var(--night-ink);padding:8px 16px;border-radius:99px;font-size:14px;opacity:0;transition:opacity .2s;pointer-events:none}
.toast.on{opacity:1}
@media (prefers-reduced-motion:reduce){.bar i,.toast{transition:none}}
</style>
<header class="hero"><canvas id="sky" aria-hidden="true"></canvas><div class="wrap">
  <h1>옥쌤 그림 작업판</h1>
  <p>우주 여행 콘셉트로 바꾸는 데 필요한 그림 __N__장(파일 __F__개)입니다. 프롬프트를 복사해 챗GPT·제미나이에 붙여 넣고, 만든 그림은 적힌 파일 이름으로 보내 주세요.</p>
  <div class="meter"><div class="bar"><i id="barFill"></i></div><b id="meterText">0 / __N__ 완료</b></div>
</div></header>
<nav class="tabs" aria-label="순위"><div class="wrap" id="tabs"></div></nav>
<main><div class="wrap" id="list">
  <details class="guide" open><summary>보내 주실 때 (꼭 읽어 주세요)</summary><ul>__RULES__</ul>
    <p style="margin:10px 0 4px;font-weight:700">어느 도구로?</p><ul>__TIPS__</ul>
    <p style="margin:10px 0 6px;font-weight:700">공통 그림체 (복사하면 이미 앞에 붙어 있어요)</p><div class="style-line">__STYLE__</div></details>
</div></main>
<div class="toast" id="toast" role="status"></div>
<script>
var DATA = __DATA__;
var KEY='oks-art-done-v1', done={};
try{done=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){done={}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(done))}catch(e){}}
var list=document.getElementById('list'), tabs=document.getElementById('tabs'), toastEl=document.getElementById('toast'), filter='all';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(t){toastEl.textContent=t;toastEl.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){toastEl.classList.remove('on')},1400)}
function copy(text,msg,el){
  var ok=function(){toast(msg)};
  var fail=function(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);toast('선택했어요. 복사해 주세요')};
  try{navigator.clipboard.writeText(text).then(ok,fail)}catch(e){fail()}
}
var total=0; DATA.forEach(function(g){total+=g.items.length});
function meter(){var n=0;DATA.forEach(function(g){g.items.forEach(function(it){if(done[it.file])n++})});
  document.getElementById('barFill').style.width=(n/total*100)+'%';document.getElementById('meterText').textContent=n+' / '+total+' 완료'}
[['all','전체'],[1,'1순위'],[2,'2순위'],[3,'3순위'],['todo','남은 것']].forEach(function(t){
  var b=document.createElement('button');b.type='button';b.textContent=t[1];b.setAttribute('aria-pressed',t[0]==='all');
  b.onclick=function(){filter=t[0];[].forEach.call(tabs.children,function(x){x.setAttribute('aria-pressed',x===b)});apply()};tabs.appendChild(b)});
function apply(){[].forEach.call(document.querySelectorAll('section'),function(s){var p=+s.dataset.p;var anyShown=false;
  [].forEach.call(s.querySelectorAll('.card'),function(c){var show=(filter==='all'||filter===p||filter==='todo')&&!(filter==='todo'&&done[c.dataset.file]);c.hidden=!show;if(show)anyShown=true});
  s.hidden=!anyShown})}
var PRI={1:'1순위',2:'2순위',3:'3순위'};
DATA.forEach(function(g){
  var s=document.createElement('section');s.dataset.p=g.priority;
  var files=0;g.items.forEach(function(i){files+=i.names?i.names.length:1});
  s.innerHTML='<h2><span class="pri">'+PRI[g.priority]+'</span>'+esc(g.title)+'<span class="cnt">그림 '+g.items.length+'장 · 파일 '+files+'개</span></h2><p class="note">'+esc(g.note)+'</p><div class="grid"></div>';
  var grid=s.querySelector('.grid');
  g.items.forEach(function(it){
    var c=document.createElement('article');c.className='card'+(done[it.file]?' is-done':'');c.dataset.file=it.file;
    var cells='';
    if(it.names){cells='<div class="cells" style="grid-template-columns:repeat('+it.grid[1]+',minmax(0,1fr))">'+it.names.map(function(n,i){return '<span><em>'+(i+1)+'</em>'+esc(n[1])+'</span>'}).join('')+'</div>'}
    c.innerHTML='<div class="top"><button type="button" class="fname" title="파일 이름 복사">'+esc(it.file)+'.png</button><span class="chip">'+esc(it.ratio)+(it.names?' · '+it.names.length+'개':'')+'</span></div>'+
      '<div class="ko">'+esc(it.ko)+'</div><div class="meta">'+(it.star?esc(it.star)+' · ':'')+esc(it.use)+'</div>'+
      (it.ref?'<div class="ref">'+esc(it.refLabel)+'</div>':'')+cells+
      '<p class="prompt">'+esc(it.short)+'</p>'+
      '<div class="acts"><button type="button" class="copy">프롬프트 복사</button><button type="button" class="more">전체 보기</button><button type="button" class="done" aria-pressed="'+(!!done[it.file])+'">'+(done[it.file]?'완료 ✓':'완료 표시')+'</button></div>';
    var pre=c.querySelector('.prompt');
    c.querySelector('.copy').onclick=function(){copy(it.prompt,'프롬프트를 복사했어요',pre)};
    c.querySelector('.fname').onclick=function(){copy(it.file+'.png','파일 이름을 복사했어요',this)};
    c.querySelector('.more').onclick=function(){var o=c.classList.toggle('open');this.textContent=o?'접기':'전체 보기'};
    c.querySelector('.done').onclick=function(){done[it.file]=!done[it.file];if(!done[it.file])delete done[it.file];save();
      this.setAttribute('aria-pressed',!!done[it.file]);this.textContent=done[it.file]?'완료 ✓':'완료 표시';c.classList.toggle('is-done',!!done[it.file]);meter();if(filter==='todo')apply()};
    grid.appendChild(c)});
  list.appendChild(s)});
meter();
(function(){var cv=document.getElementById('sky'),x=cv.getContext('2d');function draw(){var w=cv.width=cv.offsetWidth,h=cv.height=cv.offsetHeight;x.clearRect(0,0,w,h);
  var seed=7;function r(){seed=(seed*9301+49297)%233280;return seed/233280}
  for(var i=0;i<Math.round(w*h/2600);i++){var a=r()*.8+.2;x.fillStyle='rgba(243,241,255,'+a+')';var s=r()<.08?2:1;x.fillRect(r()*w,r()*h,s,s)}
  var gr=x.createRadialGradient(w*.85,h*.2,0,w*.85,h*.2,h*1.2);gr.addColorStop(0,'rgba(157,148,255,.35)');gr.addColorStop(1,'rgba(157,148,255,0)');x.fillStyle=gr;x.fillRect(0,0,w,h)}
  draw();addEventListener('resize',draw)})();
</script>
'''


def main():
    data = rows()
    for g in data:
        for it in g['items']:
            it['refLabel'] = ref_label(it['ref'])
            it['short'] = it['prompt'][len(M.STYLE):].strip() if it['prompt'].startswith(M.STYLE) else it['prompt']
    text, n = md(data)
    open(os.path.join(ROOT, 'docs/image-prompts-v2.md'), 'w', encoding='utf-8').write(text)
    files = sum(len(i.get('names', [1])) for g in data for i in g['items'])
    page = (TPL.replace('__DATA__', json.dumps(data, ensure_ascii=False))
               .replace('__N__', str(n)).replace('__F__', str(files))
               .replace('__RULES__', ''.join('<li>%s</li>' % html.escape(r) for r in RULES))
               .replace('__TIPS__', ''.join('<li>%s</li>' % html.escape(t) for t in TIPS))
               .replace('__STYLE__', html.escape(M.STYLE)))
    full = '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + page.replace('</style>', '</style></head><body>', 1) + '</body></html>\n'
    open(os.path.join(ROOT, 'docs/image-prompts.html'), 'w', encoding='utf-8').write(full)
    if len(sys.argv) > 1:   # 게시용(머리 없는) 페이지
        open(sys.argv[1], 'w', encoding='utf-8').write(page)
    print('그림 %d장, 파일 %d개 → docs/image-prompts-v2.md, docs/image-prompts.html' % (n, files))


if __name__ == '__main__':
    main()
