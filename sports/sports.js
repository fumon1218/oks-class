(function(){
'use strict';
var O=window.OKS,D=window.OKS_SPORTS_DATA;
var q=new URLSearchParams(location.search);
var festival=q.get('festival'), sid=q.get('sport'), school=q.get('school')||'elem', lesson=q.get('lesson')||'1',
    level=Math.max(1,Math.min(5,parseInt(q.get('level')||'2',10))), play=q.get('play')==='1';

var SCHOOLS=[
  {key:'elem',floor:'1층',name:'초등',desc:'기초 움직임과 안전하게 즐기기'},
  {key:'middle',floor:'2층',name:'중등',desc:'기초 기능을 익혀 간이 게임에 적용하기'},
  {key:'high',floor:'3층',name:'고등',desc:'스스로 선택하고 생활 속 스포츠로 이어가기'}
];
var LEVELS=[
  {n:1,name:'감각 탐색'},{n:2,name:'골라 보기'},{n:3,name:'직접 해 보기'},{n:4,name:'혼자 해 보기'},{n:5,name:'생활에 써 보기'}
];
function byId(id){return D.sports.filter(function(s){return s.id===id})[0];}
function top(title,sub,back,label){
  return O.shell({title:title,subtitle:sub,back:back||'../',backLabel:label||'뒤로',level:level,compact:false});
}
function tryBg(el,s){var im=new Image();im.onload=function(){el.classList.add('has-bg');el.style.backgroundImage="url('"+s.image+"')"};im.src=s.image;}
function store(){try{return JSON.parse(localStorage.getItem('oks_sports_progress_v3')||'{}')}catch(e){return{}}}
function save(k,lv,stars){
  var p=store();p[k]=p[k]||{plays:0,best:{}};p[k].plays++;p[k].last=lv;p[k].best[lv]=Math.max(p[k].best[lv]||0,stars||0);
  try{localStorage.setItem('oks_sports_progress_v3',JSON.stringify(p))}catch(e){}
}
function lessonInfo(s,sk,no){
  var base={
    athletics:{elem:[['달리기 출발과 도착','출발·달리기·도착의 순서를 알고 안전하게 움직여요.'],['달리기 준비와 안전','운동화와 준비운동 등 달리기 전 준비를 알아봐요.'],['나의 달리기 기록','출발 신호에 반응하고 나의 움직임을 기록해요.']],middle:[['달리기와 기록','신호에 맞춰 출발하고 자신의 기록을 확인해요.'],['속도와 거리 조절','거리와 속도를 조절해 달려요.'],['간이 이어달리기','차례와 구역을 지키며 이어달리기를 경험해요.']],high:[['나의 육상 활동 계획','상황에 맞는 달리기 목표를 정하고 스스로 실천해요.'],['기록 비교하기','나의 이전 기록과 현재 기록을 비교해요.'],['안전한 운동 계획','준비·운동·정리운동을 스스로 계획해요.']]},
    swimming:{elem:[['수영장과 안전 약속','수영장 도구와 안전 약속을 알고 물놀이에 참여해요.'],['물에서 움직여요','물속에서 몸을 편안하게 움직이는 방법을 알아봐요.'],['호흡과 마무리','기초 호흡과 활동 후 정리 방법을 알아봐요.']],middle:[['호흡과 레인 이용','레인을 지키고 기초 호흡 순서를 익혀요.'],['기초 영법 경험','팔과 다리 움직임을 순서대로 경험해요.'],['수영장 안전 판단','상황을 보고 안전한 행동을 선택해요.']],high:[['안전한 수영 계획','준비부터 마무리까지 안전한 수영 활동을 계획해요.'],['나의 수영 목표','나에게 맞는 거리와 활동 목표를 정해요.'],['생활 속 수영','건강과 여가를 위한 수영 활동을 선택해요.']]},
    archery:{elem:[['과녁의 중심 찾기','과녁의 중심과 방향을 살펴 목표를 맞혀요.'],['활과 화살 알아보기','양궁 도구의 이름과 역할을 알아봐요.'],['안전한 차례 지키기','기다리기와 안전선 지키기를 연습해요.']],middle:[['집중해서 과녁 맞히기','주의를 집중하고 목표 지점을 조절해요.'],['거리와 방향','거리와 방향에 따라 목표를 조절해요.'],['점수 알아보기','과녁의 위치에 따른 점수를 알아봐요.']],high:[['나의 목표 정하기','목표 난이도를 정하고 결과를 기록하며 도전해요.'],['집중 전략 찾기','나에게 맞는 집중 방법을 찾아요.'],['안전한 경기 참여','규칙과 차례를 지키며 참여해요.']]},
    gymnastics:{elem:[['몸의 균형 느끼기','기본 자세와 균형 동작을 차례로 경험해요.'],['팔과 다리 움직이기','팔과 다리를 여러 방향으로 움직여요.'],['동작 순서 기억하기','간단한 동작 순서를 보고 따라 해요.']],middle:[['균형 동작 이어 하기','여러 균형 동작을 순서대로 연결해요.'],['높이와 방향 바꾸기','몸의 높이와 방향을 바꾸어 움직여요.'],['짧은 동작 구성','배운 동작을 연결해 짧은 순서를 만들어요.']],high:[['나만의 체조 구성','할 수 있는 동작을 선택해 짧은 순서를 만들어요.'],['동작 표현하기','음악이나 신호에 맞춰 동작을 표현해요.'],['안전한 연습 계획','공간과 몸 상태를 살피며 연습 계획을 세워요.']]},
    taekwondo:{elem:[['준비 자세와 방향','준비 자세와 왼쪽·오른쪽 방향을 알아봐요.'],['기본 발차기','목표를 향해 기초 발차기를 경험해요.'],['예절과 안전','인사와 차례, 안전 약속을 알아봐요.']],middle:[['기본 발차기 익히기','목표 방향에 맞춰 안전하게 발차기를 연습해요.'],['거리 조절하기','목표와의 거리를 살펴 움직여요.'],['동작 이어 하기','준비 자세와 발차기를 연결해요.']],high:[['안전한 태권도 활동','예절과 안전 약속을 지키며 동작을 선택해요.'],['나의 동작 구성','할 수 있는 동작을 골라 순서를 만들어요.'],['생활 속 태권도','건강과 자기관리를 위한 활동을 계획해요.']]},
    soccer:{elem:[['공과 골대 알아보기','공과 골대를 구별하고 빈 공간을 찾아봐요.'],['공 차고 멈추기','발로 공을 보내고 멈추는 기초 움직임을 경험해요.'],['친구와 함께하기','친구와 차례를 지키며 공을 주고받아요.']],middle:[['패스와 공간 찾기','친구와 함께 빈 공간으로 패스하는 방법을 익혀요.'],['드리블과 방향','공을 가까이 두고 방향을 바꾸어 움직여요.'],['간이 경기 규칙','간단한 규칙을 지키며 게임에 참여해요.']],high:[['협동하는 축구 활동','상황을 보고 패스할 곳을 스스로 선택해요.'],['공격과 수비 판단','공과 사람의 위치를 보고 움직임을 선택해요.'],['나의 축구 계획','역할과 목표를 정해 활동에 참여해요.']]}
  };
  var arr=base[s.id]&&base[s.id][sk]||[];return arr[Math.max(0,Math.min(arr.length-1,(+no||1)-1))]||[s.title,s.goal];
}

/* 1단계: 씽씽 별 마을 */
function villageHub(){
  var sh=top('씽씽 별 마을','체육 · 놀이','../','우주로');
  sh.ask('가 보고 싶은 스포츠 마을을 골라 보세요.',{silent:true});
  var b=document.createElement('div');b.className='sports-village';
  b.innerHTML='<div class="sports-town-head"><h1>씽씽 별 마을</h1><p>스포츠와 놀이를 한 단계씩 탐험해요</p></div><div class="festival-grid"></div>';
  var g=b.querySelector('.festival-grid');
  var festivals=(D.festivals||[
    {id:'summer',name:'하계 올림픽',sub:'달리고 · 뛰고 · 헤엄치고 · 겨뤄요',image:'assets/summer_hub.webp',active:true},
    {id:'winter',name:'동계 올림픽',sub:'눈과 얼음 위 스포츠',emo:'❄️',active:false},
    {id:'summer_para',name:'하계 패럴림픽',sub:'함께 즐기는 여름 스포츠',emo:'♿',active:false},
    {id:'winter_para',name:'동계 패럴림픽',sub:'함께 즐기는 겨울 스포츠',emo:'🏂',active:false},
    {id:'asian',name:'아시안게임',sub:'아시아의 다양한 스포츠',emo:'🏅',active:false}
  ]);
  festivals.forEach(function(f){
    var a=document.createElement('button');a.className='festival-card'+(f.active?'':' locked');
    var v=f.image?'<img src="'+f.image+'" alt="">':'<span class="festival-emo">'+(f.emo||'⭐')+'</span>';
    a.innerHTML=v+'<span class="festival-label"><b>'+f.name+'</b><small>'+f.sub+'</small><em>'+(f.active?'들어가기':'곧 만나요')+'</em></span>';
    a.onclick=function(){if(f.active){O.sfx('pop');location.href='?festival='+f.id}else{O.sfx('tick');O.toast('이 스포츠 마을은 준비 중이에요')}};
    g.appendChild(a);
  });
  sh.board.innerHTML='';sh.board.appendChild(b);
}

/* 2단계: 하계 올림픽 종목 목차 */
function summerHub(){
  var sh=top('하계 올림픽','종목 목차','./','씽씽별로');
  sh.ask('배우고 싶은 하계 올림픽 종목을 골라 보세요.',{silent:true});
  var b=document.createElement('div');b.className='summer-toc';
  b.innerHTML='<div class="sports-hero small"><h1>하계 올림픽</h1><p>종목을 고르면 학습 목차로 들어가요</p></div><div class="sports-grid"></div>';
  var g=b.querySelector('.sports-grid');
  D.sports.forEach(function(s){
    var a=document.createElement('button');a.className='sport-card image-card';a.style.setProperty('--sport',s.color);
    a.innerHTML='<img src="'+s.image+'" alt=""><span class="sport-card-label"><b>'+s.name+'</b><small>'+s.title+'</small><em>목차 보기</em></span>';
    a.onclick=function(){O.sfx('pop');location.href='?festival=summer&sport='+s.id};g.appendChild(a);
  });
  sh.board.innerHTML='';sh.board.appendChild(b);
}

/* 3단계: 종목 안의 초·중·고 + 차시 목차 */
function sportToc(){
  var s=byId(sid);if(!s){summerHub();return}
  var sh=top(s.name+' 경기장','하계 올림픽 · 체육 · 놀이','?festival=summer','하계 올림픽');
  sh.ask(s.name+' 경기장이에요. 층을 고르고 차시와 수준을 눌러요.',{silent:true});
  var host=document.createElement('div');host.className='sport-toc';
  host.innerHTML='<div class="sport-toc-head"><img src="'+s.image+'" alt=""><div><small>하계 올림픽</small><h1>'+s.name+' 경기장</h1><p>'+s.goal+'</p></div></div><div class="sports-floor-tabs"></div><div class="sports-lesson-list"></div>';
  var tabs=host.querySelector('.sports-floor-tabs'),list=host.querySelector('.sports-lesson-list'),sel=school;
  SCHOOLS.slice().reverse().forEach(function(sc){
    var t=document.createElement('button');t.className='sports-floor';t.dataset.k=sc.key;
    t.innerHTML='<b>'+sc.floor+'</b> '+sc.name+' <small>3</small>';
    t.onclick=function(){sel=sc.key;school=sel;draw();O.sfx('tick');O.say(sc.name,{noRepeat:true})};tabs.appendChild(t);
  });
  function draw(){
    Array.from(tabs.children).forEach(function(t){t.classList.toggle('on',t.dataset.k===sel)});
    list.innerHTML='';
    [1,2,3].forEach(function(no){list.appendChild(lessonRow(s,sel,no))});
  }
  draw();sh.board.innerHTML='';sh.board.appendChild(host);
}
function lessonRow(s,sk,no){
  var info=lessonInfo(s,sk,no), key=s.id+'-'+sk+'-'+no, pr=store()[key]||{}, row=document.createElement('article');row.className='sports-lesson';
  row.innerHTML='<div class="sports-lesson-head"><span class="sports-no">체육 '+no+'</span><div><b>'+info[0]+'</b><small>〈'+s.name+'〉 '+info[1]+'</small></div><em>'+(pr.plays||0)+'번</em></div><div class="sports-level-row"></div>';
  var lv=row.querySelector('.sports-level-row'), cur=pr.last||level;
  LEVELS.forEach(function(L){
    var a=document.createElement('a');a.className='sports-level-btn'+(L.n===cur?' cur':'')+(pr.best&&pr.best[L.n]?' got':'');
    var stars=pr.best&&pr.best[L.n]?'<i>'+'★'.repeat(pr.best[L.n])+'</i>':'';
    a.innerHTML='<b>'+L.n+'</b><small>'+L.name+'</small>'+stars;
    a.href='?festival=summer&sport='+s.id+'&school='+sk+'&lesson='+no+'&level='+L.n+'&play=1';lv.appendChild(a);
  });
  return row;
}

/* 4단계: 수준별 실제 활동 */
function activity(){
 var s=byId(sid);if(!s){summerHub();return}
 var info=lessonInfo(s,school,lesson), sh=top(s.name+' '+lesson+'차시 · '+info[0],SCHOOLS.filter(function(x){return x.key===school})[0].name+' · 체육 · 놀이','?festival=summer&sport='+s.id+'&school='+school,s.name+' 목차');
 sh.setLevel(level);sh.setRounds(5,0);sh.ask(info[0]+'! 시작해 볼까요?',{silent:true});
 var wrap=document.createElement('div');wrap.className='sports-activity-wrap';
 var start=document.createElement('div');start.className='sports-start';
 start.innerHTML='<div class="sports-start-level">'+LEVELS[level-1].name+'</div><h2>'+info[0]+'</h2><p>'+info[1]+'</p><p class="sports-space">〈'+s.name+'〉 '+s.goal+'</p>';
 var go=document.createElement('button');go.className='oks-btn';go.innerHTML=O.iconHtml('icon_play.png','시작하기');start.appendChild(go);
 var ws=document.createElement('a');ws.className='oks-btn blue';ws.href='worksheet.html?sport='+s.id+'&school='+school+'&level='+level;ws.textContent='학습지 인쇄';start.appendChild(ws);
 wrap.appendChild(start);sh.board.innerHTML='';sh.board.appendChild(wrap);
 go.onclick=function(){O.unlock();O.sfx('pop');runActivity(sh,s,info,wrap)};
}
function runActivity(sh,s,info,wrap){
  sh.ask(info[1],{silent:true});sh.setRounds(5,0);
  wrap.innerHTML='';var st=document.createElement('div');st.className='activity-stage';wrap.appendChild(st);tryBg(st,s);
  var act=document.createElement('div');act.className='activity-in';st.appendChild(act);
  var score=0,round=0,mist=0;
  function scoreEl(){return '<div class="scorebar">'+[0,1,2,3,4].map(function(i){return '<img src="../core/ui/'+(i<score?'star_gold.webp':'star.webp')+'" alt="">'}).join('')+' <b>'+score+'/5</b></div>'}
  function ask(t){sh.ask(t,{silent:true});}
  function correct(next){score++;O.sfx('ok');O.praise();round++;sh.setRounds(5,round);setTimeout(next,550)}
  function wrong(btn,msg){mist++;O.sfx('no');btn&&btn.classList.add('bad');O.toast(msg||'다시 한 번 살펴봐요');setTimeout(function(){btn&&btn.classList.remove('bad')},450)}
  function finish(){
    var stars=mist<=1?3:mist<=3?2:1;save(s.id+'-'+school+'-'+lesson,level,stars);
    act.innerHTML='<div class="sport-prompt">⭐ '+info[0]+' 활동을 마쳤어요!</div>'+scoreEl()+
      '<div class="activity-actions"><a class="oks-btn blue" href="worksheet.html?sport='+s.id+'&school='+school+'&level='+level+'">학습지 인쇄</a>'+
      '<a class="oks-btn orange" href="?festival=summer&sport='+s.id+'&school='+school+'&lesson='+lesson+'&level='+Math.min(5,level+1)+'&play=1">다음 수준</a><a class="oks-btn" href="?festival=summer&sport='+s.id+'&school='+school+'">'+s.name+' 목차</a></div>';
  }
  var rounds=makers[s.id](s,act,{level:level,good:correct,bad:wrong,ask:ask});
  function next(){if(round>=5)return finish();act.innerHTML='';rounds[round%rounds.length](next)} next();
}
function choices(host,items,ok,next,bad){
 var r=document.createElement('div');r.className='choice-row';host.appendChild(r);
 items.forEach(function(x){var b=document.createElement('button');b.className='schoice';b.innerHTML='<span class="big">'+x[0]+'</span><span>'+x[1]+'</span>';b.onclick=function(){if(x[2]===ok){b.classList.add('good');next()}else bad(b)};r.appendChild(b)});
}
var makers={
 athletics:function(s,h,c){return[
  function(n){c.ask('달리기는 어디에서 시작할까요?');h.innerHTML='<div class="sport-prompt">출발 지점을 찾아보세요.</div>';choices(h,[['🚩','출발',1],['🏁','도착',0]],1,function(){c.good(n)},c.bad)},
  function(n){c.ask('출발부터 도착까지 차례대로 눌러 보세요.');h.innerHTML='<div class="sport-prompt">1 → 2 → 3 → 4</div><div class="trackline"></div>';var k=1,tr=h.querySelector('.trackline');[1,2,3,4].forEach(function(i){var b=document.createElement('button');b.className='trackstep';b.textContent=i;b.onclick=function(){if(i===k){b.classList.add('done');k++;O.sfx('tick');if(k===5)c.good(n)}else c.bad(b,'차례를 다시 확인해요')};tr.appendChild(b)})},
  function(n){c.ask('달리기 전에 준비해야 할 것을 골라 보세요.');h.innerHTML='<div class="sport-prompt">안전하게 준비해요.</div>';choices(h,[['👟','운동화',1],['🧸','인형',0],['💧','물',1]],1,function(){c.good(n)},c.bad)},
  function(n){c.ask('신호가 나오면 빠르게 눌러 보세요.');h.innerHTML='<div class="sport-prompt">준비…</div><button class="oks-btn orange" disabled>기다려요</button>';var b=h.querySelector('button'),p=h.querySelector('.sport-prompt');setTimeout(function(){p.textContent='출발!';b.disabled=false;b.textContent='🏃 달리기';var t=performance.now();b.onclick=function(){p.textContent='반응 시간 '+Math.round(performance.now()-t)+'ms';c.good(n)}},700+Math.random()*900)},
  function(n){c.ask('나에게 맞는 달리기 목표를 골라 보세요.');h.innerHTML='<div class="sport-prompt">내 목표 정하기</div>';choices(h,[['🙂','천천히 끝까지',1],['⚡','빠르게 달리기',1],['🤝','친구와 함께',1]],1,function(){c.good(n)},c.bad)}
 ]},
 swimming:function(s,h,c){return[
  function(n){c.ask('수영장에서 사용하는 것을 골라 보세요.');h.innerHTML='<div class="sport-prompt">수영 도구 찾기</div>';choices(h,[['🥽','물안경',1],['🧤','야구 글러브',0]],1,function(){c.good(n)},c.bad)},
  function(n){c.ask('안전한 레인을 골라 보세요.');h.innerHTML='<div class="sport-prompt">표시된 레인으로 들어가요.</div><div class="pool-lanes"></div>';var p=h.querySelector('.pool-lanes');[1,2,3].forEach(function(i){var b=document.createElement('button');b.className='pool-lane';b.innerHTML='🏊<small>'+i+'번 레인</small>';b.onclick=function(){if(i===2)c.good(n);else c.bad(b,'2번 레인을 찾아봐요')};p.appendChild(b)})},
  function(n){c.ask('물에 들어가기 전에 먼저 할 일을 골라 보세요.');h.innerHTML='<div class="sport-prompt">안전 약속</div>';choices(h,[['🙆','준비운동',1],['🏃','바로 뛰어들기',0]],1,function(){c.good(n)},c.bad)},
  function(n){c.ask('호흡 순서를 차례로 눌러 보세요.');h.innerHTML='<div class="sport-prompt">숨 쉬기 순서</div>';var seq=[['😮‍💨','내쉬기'],['🌊','물속 움직임'],['🙂','고개 들고 들이쉬기']],k=0;choices(h,seq.map(function(x,i){return [x[0],x[1],i]}),0,function(){},function(){});Array.from(h.querySelectorAll('.schoice')).forEach(function(b,i){b.onclick=function(){if(i===k){b.classList.add('good');k++;if(k===3)c.good(n)}else c.bad(b,'순서를 다시 생각해요')}})},
  function(n){c.ask('수영을 마친 뒤 할 일을 골라 보세요.');h.innerHTML='<div class="sport-prompt">건강하게 마무리해요.</div>';choices(h,[['🧴','몸 닦고 정리하기',1],['💦','젖은 채로 있기',0]],1,function(){c.good(n)},c.bad)}
 ]},
 archery:function(s,h,c){return Array.from({length:5},function(_,i){return function(n){c.ask(i<2?'과녁의 중심을 눌러 보세요.':'집중해서 중심 가까이에 눌러 보세요.');h.innerHTML='<div class="sport-prompt">🎯 중심을 향해!</div><div class="target"><button aria-label="과녁"></button></div>';var t=h.querySelector('.target'),b=t.querySelector('button');b.onclick=function(e){var r=t.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy)/(r.width/2);if(d<(level<=2?.58:.42)){t.classList.add('flash');c.good(n)}else c.bad(t,'조금 더 가운데를 노려봐요')}}})},
 gymnastics:function(s,h,c){var seq=[['🧍','똑바로 서기'],['🙆','두 팔 벌리기'],['🦩','한 발 균형']];return Array.from({length:5},function(_,ri){return function(n){c.ask('동작을 차례로 눌러 보세요.');h.innerHTML='<div class="sport-prompt">균형 동작 '+(ri+1)+'</div><div class="pose-row"></div>';var order=ri<2?seq:seq.slice().sort(function(){return Math.random()-.5}),k=0,p=h.querySelector('.pose-row');order.forEach(function(x){var b=document.createElement('button');b.className='pose';b.innerHTML=x[0]+'<small>'+x[1]+'</small>';b.onclick=function(){var idx=seq.indexOf(x);if(idx===k){b.classList.add('sel');k++;if(k===3)c.good(n)}else c.bad(b,'1번 동작부터 차례로 해요')};p.appendChild(b)})}})},
 taekwondo:function(s,h,c){return Array.from({length:5},function(_,ri){return function(n){var want=ri%2?'왼쪽':'오른쪽';c.ask(want+' 목표를 향해 발차기해요.');h.innerHTML='<div class="sport-prompt">'+want+' 목표를 골라 보세요.</div><div class="kick-targets"><button class="kick-target" data-side="왼쪽">🥋</button><button class="kick-target" data-side="오른쪽">🥋</button></div>';Array.from(h.querySelectorAll('.kick-target')).forEach(function(b){b.onclick=function(){if(b.dataset.side===want){b.classList.add('hit');c.good(n)}else c.bad(b,'방향을 다시 확인해요')}})}})},
 soccer:function(s,h,c){return Array.from({length:5},function(_,ri){return function(n){var open=(ri%3)+1;c.ask('빈 공간으로 공을 보내 보세요.');h.innerHTML='<div class="sport-prompt">⚽ 패스할 곳을 골라요.</div><div class="choice-row"></div>';var r=h.querySelector('.choice-row');[1,2,3].forEach(function(i){var b=document.createElement('button');b.className='schoice';b.innerHTML='<span class="big">'+(i===open?'🥅':'🧍')+'</span><span>'+i+'번 공간</span>';b.onclick=function(){if(i===open)c.good(n);else c.bad(b,'사람이 없는 공간을 찾아봐요')};r.appendChild(b)})}})}
};
if(play&&sid)activity();
else if(festival==='summer'&&sid)sportToc();
else if(festival==='summer')summerHub();
else villageHub();
})();