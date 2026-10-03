(function(){
'use strict';
var O=window.OKS,D=window.OKS_SPORTS_DATA,E=O.el;
var q=new URLSearchParams(location.search);
var festival=q.get('festival'),sid=q.get('sport'),school=q.get('school')||'elem',lessonNo=+(q.get('lesson')||1),
    level=Math.max(1,Math.min(5,+(q.get('level')||2))),play=q.get('play')==='1';

var SCHOOLS=[
 {key:'elem',floor:'1층',name:'초등',desc:'기초 움직임과 안전하게 즐기기'},
 {key:'middle',floor:'2층',name:'중등',desc:'기초 기능을 익혀 간이 게임에 적용하기'},
 {key:'high',floor:'3층',name:'고등',desc:'스스로 선택하고 생활 속 스포츠로 이어가기'}
];
var LEVELS=O.LEVELS;

var SPORT_ITEMS={
 athletics:{tools:[
  ['img:assets/athletics/outfit_sneakers.webp','운동화'],
  ['img:assets/athletics/start_block.webp','스타팅 블록'],
  ['img:assets/athletics/finish_ribbon.webp','결승선'],
  ['img:assets/athletics/start_signal.webp','출발 신호']
],bad:[
  ['img:assets/athletics/outfit_coat.webp','두꺼운 겨울 외투'],
  ['img:assets/athletics/outfit_sandals.webp','샌들']
],action:'달리기'},
 swimming:{tools:[['🥽','물안경'],['🩱','수영복'],['🏊','수영'],['🛟','튜브']],bad:[['🧤','야구 글러브'],['🎸','기타']],action:'수영'},
 archery:{tools:[['🏹','활'],['🎯','과녁'],['➡️','방향'],['🧍','안전선']],bad:[['⚽','축구공'],['🥄','숟가락']],action:'양궁'},
 gymnastics:{tools:[['🧍','바른 자세'],['🙆','팔 벌리기'],['🦩','한 발 균형'],['🤸','체조']],bad:[['🏹','활'],['🥽','물안경']],action:'체조'},
 taekwondo:{tools:[['🥋','도복'],['🙇','인사'],['🦵','발차기'],['↔️','방향']],bad:[['🎣','낚싯대'],['🥽','물안경']],action:'태권도'},
 soccer:{tools:[['⚽','축구공'],['🥅','골대'],['👟','운동화'],['🤝','협동']],bad:[['🏹','활'],['🥽','물안경']],action:'축구'}
};

function byId(id){return D.sports.filter(function(s){return s.id===id})[0];}
function schoolInfo(){return SCHOOLS.filter(function(x){return x.key===school})[0]||SCHOOLS[0];}
function top(title,sub,back,label,compact){
 return O.shell({title:title,subtitle:sub,back:back||'../',backLabel:label||'뒤로',level:level,compact:compact!==false,fit:compact!==false});
}
function tryBg(el,s){var im=new Image();im.onload=function(){el.classList.add('sports-bg');el.style.setProperty('--sport-bg',"url('"+s.image+"')")};im.src=s.image;}
function progress(){try{return JSON.parse(localStorage.getItem('oks_sports_progress_v4')||'{}')}catch(e){return{}}}
function save(key,stars,mistakes){
 var p=progress();p[key]=p[key]||{plays:0,best:{}};p[key].plays++;p[key].last=level;p[key].best[level]=Math.max(p[key].best[level]||0,stars||0);p[key].mistakes=mistakes;
 try{localStorage.setItem('oks_sports_progress_v4',JSON.stringify(p))}catch(e){}
}
function info(s,sk,no){
 var map={
 athletics:{
  elem:[['달리기 출발과 도착','출발선과 결승선을 알고 순서대로 움직여요.'],['달리기 준비와 안전','운동화와 준비운동 등 안전한 준비를 알아봐요.'],['나의 달리기 기록','출발 신호에 반응하고 기록을 살펴봐요.']],
  middle:[['달리기와 기록','신호에 맞춰 출발하고 자신의 기록을 확인해요.'],['속도와 거리 조절','거리와 속도를 조절하며 달려요.'],['간이 이어달리기','차례와 구역을 지키며 이어달리기를 경험해요.']],
  high:[['나의 육상 활동 계획','상황에 맞는 달리기 목표를 정하고 실천해요.'],['기록 비교하기','이전 기록과 현재 기록을 비교해요.'],['안전한 운동 계획','준비·운동·정리운동을 스스로 계획해요.']]},
 swimming:{
  elem:[['수영장과 안전 약속','수영장 도구와 안전 약속을 알고 참여해요.'],['물에서 움직여요','물속에서 몸을 편안하게 움직이는 방법을 알아봐요.'],['호흡과 마무리','기초 호흡과 활동 후 정리 방법을 알아봐요.']],
  middle:[['호흡과 레인 이용','레인을 지키고 기초 호흡 순서를 익혀요.'],['기초 영법 경험','팔과 다리 움직임을 순서대로 경험해요.'],['수영장 안전 판단','상황을 보고 안전한 행동을 선택해요.']],
  high:[['안전한 수영 계획','준비부터 마무리까지 안전한 활동을 계획해요.'],['나의 수영 목표','나에게 맞는 거리와 목표를 정해요.'],['생활 속 수영','건강과 여가를 위한 활동을 선택해요.']]},
 archery:{
  elem:[['과녁의 중심 찾기','과녁의 중심과 방향을 살펴 목표를 맞혀요.'],['활과 화살 알아보기','양궁 도구의 이름과 역할을 알아봐요.'],['안전한 차례 지키기','기다리기와 안전선 지키기를 연습해요.']],
  middle:[['집중해서 과녁 맞히기','주의를 집중하고 목표 지점을 조절해요.'],['거리와 방향','거리와 방향에 따라 목표를 조절해요.'],['점수 알아보기','과녁 위치에 따른 점수를 알아봐요.']],
  high:[['나의 목표 정하기','목표 난이도를 정하고 결과를 기록하며 도전해요.'],['집중 전략 찾기','나에게 맞는 집중 방법을 찾아요.'],['안전한 경기 참여','규칙과 차례를 지키며 참여해요.']]},
 gymnastics:{
  elem:[['몸의 균형 느끼기','기본 자세와 균형 동작을 차례로 경험해요.'],['팔과 다리 움직이기','팔과 다리를 여러 방향으로 움직여요.'],['동작 순서 기억하기','간단한 동작 순서를 보고 따라 해요.']],
  middle:[['균형 동작 이어 하기','여러 균형 동작을 순서대로 연결해요.'],['높이와 방향 바꾸기','몸의 높이와 방향을 바꾸어 움직여요.'],['짧은 동작 구성','배운 동작을 연결해 짧은 순서를 만들어요.']],
  high:[['나만의 체조 구성','할 수 있는 동작을 선택해 짧은 순서를 만들어요.'],['동작 표현하기','음악이나 신호에 맞춰 동작을 표현해요.'],['안전한 연습 계획','공간과 몸 상태를 살피며 연습 계획을 세워요.']]},
 taekwondo:{
  elem:[['준비 자세와 방향','준비 자세와 왼쪽·오른쪽 방향을 알아봐요.'],['기본 발차기','목표를 향해 기초 발차기를 경험해요.'],['예절과 안전','인사와 차례, 안전 약속을 알아봐요.']],
  middle:[['기본 발차기 익히기','목표 방향에 맞춰 안전하게 발차기를 연습해요.'],['거리 조절하기','목표와의 거리를 살펴 움직여요.'],['동작 이어 하기','준비 자세와 발차기를 연결해요.']],
  high:[['안전한 태권도 활동','예절과 안전 약속을 지키며 동작을 선택해요.'],['나의 동작 구성','할 수 있는 동작을 골라 순서를 만들어요.'],['생활 속 태권도','건강과 자기관리를 위한 활동을 계획해요.']]},
 soccer:{
  elem:[['공과 골대 알아보기','공과 골대를 구별하고 빈 공간을 찾아봐요.'],['공 차고 멈추기','발로 공을 보내고 멈추는 기초 움직임을 경험해요.'],['친구와 함께하기','친구와 차례를 지키며 공을 주고받아요.']],
  middle:[['패스와 공간 찾기','친구와 함께 빈 공간으로 패스하는 방법을 익혀요.'],['드리블과 방향','공을 가까이 두고 방향을 바꾸어 움직여요.'],['간이 경기 규칙','간단한 규칙을 지키며 게임에 참여해요.']],
  high:[['협동하는 축구 활동','상황을 보고 패스할 곳을 스스로 선택해요.'],['공격과 수비 판단','공과 사람의 위치를 보고 움직임을 선택해요.'],['나의 축구 계획','역할과 목표를 정해 활동에 참여해요.']]}
 };
 return (map[s.id]&&map[s.id][sk]&&map[s.id][sk][Math.max(0,Math.min(2,no-1))])||[s.title,s.goal];
}

/* ---------- 씽씽 별 마을 ---------- */
function villageHub(){
 var sh=top('씽씽 별 마을','체육 · 놀이','../','우주로',false);
 sh.ask('가 보고 싶은 스포츠 마을을 골라 보세요.',{silent:true});
 var b=E('div','sports-village');
 b.innerHTML='<div class="sports-town-head"><h1>씽씽 별 마을</h1><p>스포츠와 놀이를 한 단계씩 탐험해요</p></div><div class="festival-grid"></div>';
 var g=b.querySelector('.festival-grid');
 (D.festivals||[]).forEach(function(f){
   var a=E('button','festival-card'+(f.active?'':' locked'));
   var visual=f.image?'<img src="'+f.image+'" alt="">':'<span class="festival-emo">'+(f.emo||'⭐')+'</span>';
   a.innerHTML=visual+'<span class="festival-label"><b>'+f.name+'</b><small>'+f.sub+'</small><em>'+(f.active?'들어가기':'곧 만나요')+'</em></span>';
   a.onclick=function(){if(f.active){O.sfx('pop');location.href='?festival='+f.id}else O.toast('이 스포츠 마을은 준비 중이에요')};
   g.appendChild(a);
 });
 sh.board.innerHTML='';sh.board.appendChild(b);
}
/* ---------- 하계 올림픽 종목 ---------- */
function summerHub(){
 var sh=top('하계 올림픽','종목 목차','./','씽씽별로',false);
 sh.ask('배우고 싶은 하계 올림픽 종목을 골라 보세요.',{silent:true});
 var b=E('div','summer-toc');
 b.innerHTML='<div class="sports-hero small"><h1>하계 올림픽</h1><p>종목을 고르면 학습 목차로 들어가요</p></div><div class="sports-grid"></div>';
 var g=b.querySelector('.sports-grid');
 D.sports.forEach(function(s){
  var a=E('button','sport-card image-card');a.style.setProperty('--sport',s.color);
  a.innerHTML='<img src="'+s.image+'" alt=""><span class="sport-card-label"><b>'+s.name+'</b><small>'+s.title+'</small><em>목차 보기</em></span>';
  a.onclick=function(){O.sfx('pop');location.href='?festival=summer&sport='+s.id};g.appendChild(a);
 });
 sh.board.innerHTML='';sh.board.appendChild(b);
}
/* ---------- 종목 차시 + 수준 ---------- */
function sportToc(){
 var s=byId(sid);if(!s){summerHub();return}
 var sh=top(s.name+' 경기장','하계 올림픽 · 체육 · 놀이','?festival=summer','하계 올림픽',false);
 sh.ask(s.name+' 경기장이에요. 층을 고르고 차시와 수준을 눌러요.',{silent:true});
 var host=E('div','sport-toc');
 host.innerHTML='<div class="sport-toc-head"><img src="'+s.image+'" alt=""><div><small>하계 올림픽</small><h1>'+s.name+' 경기장</h1><p>'+s.goal+'</p></div></div><div class="sports-floor-tabs"></div><div class="sports-lesson-list"></div>';
 var tabs=host.querySelector('.sports-floor-tabs'),list=host.querySelector('.sports-lesson-list'),sel=school;
 SCHOOLS.slice().reverse().forEach(function(sc){
  var t=E('button','sports-floor');t.dataset.k=sc.key;t.innerHTML='<b>'+sc.floor+'</b> '+sc.name+' <small>3</small>';
  t.onclick=function(){sel=sc.key;school=sel;draw();O.sfx('tick');O.say(sc.name,{noRepeat:true})};tabs.appendChild(t);
 });
 function draw(){
  Array.from(tabs.children).forEach(function(t){t.classList.toggle('on',t.dataset.k===sel)});
  list.innerHTML='';[1,2,3].forEach(function(no){list.appendChild(lessonRow(s,sel,no))});
 }
 draw();sh.board.innerHTML='';sh.board.appendChild(host);
}
function lessonRow(s,sk,no){
 var li=info(s,sk,no),key=s.id+'-'+sk+'-'+no,pr=progress()[key]||{},row=E('article','sports-lesson');
 row.innerHTML='<div class="sports-lesson-head"><span class="sports-no">체육 '+no+'</span><div><b>'+li[0]+'</b><small>〈'+s.name+'〉 '+li[1]+'</small></div><em>'+(pr.plays||0)+'번</em></div><div class="sports-level-row"></div>';
 var lv=row.querySelector('.sports-level-row'),cur=pr.last||level;
 LEVELS.forEach(function(L){
  var a=E('a','sports-level-btn'+(L.n===cur?' cur':'')+(pr.best&&pr.best[L.n]?' got':''));
  var stars=pr.best&&pr.best[L.n]?'<i>'+'★'.repeat(pr.best[L.n])+'</i>':'';
  a.innerHTML='<b>'+L.n+'</b><small>'+L.name+'</small>'+stars;
  a.href='?festival=summer&sport='+s.id+'&school='+sk+'&lesson='+no+'&level='+L.n+'&play=1';lv.appendChild(a);
 });
 return row;
}

/* ---------- 우리 별 마을 차시 화면과 같은 공통 활동 틀 ---------- */
function activity(){
 var s=byId(sid);if(!s){summerHub();return}
 var li=info(s,school,lessonNo),sc=schoolInfo();
 var sh=top(s.name+' '+lessonNo+'차시 · '+li[0],sc.name+' · 체육 · 놀이','?festival=summer&sport='+s.id+'&school='+school,s.name+' 목차',true);
 if(s.id==='athletics') document.body.classList.add('athletics-game');
 document.body.classList.add('oks-play','sports-play');
 sh.setLevel(level);sh.setRounds(level===1?3:5,0);
 sh.ask(li[0]+'! 시작해 볼까요?',{silent:true});

 var start=E('div','oks-start sports-start');
 start.innerHTML='<div class="oks-start-lv">'+LEVELS[level-1].name+'</div><p class="gdesc">'+levelDesc(s,li)+'</p><p>'+li[1]+'</p><div class="sports-start-preview"><img src="'+(s.id==='athletics'?'assets/athletics/athletics_bg_main.webp':s.image)+'" alt=""></div>';
 var go=E('button','oks-btn',O.iconHtml('icon_play.png','시작하기'));go.type='button';start.appendChild(go);
 var ws=E('a','oks-btn blue oks-extra','학습지 인쇄');ws.href='worksheet.html?sport='+s.id+'&school='+school+'&level='+level;start.appendChild(ws);
 sh.board.appendChild(start);
 O.target({get:function(){return go}},Math.min(level,2));
 go.onclick=function(){O.unlock();O.clearPrompt();runGame(sh,s,li)};
}
function levelDesc(s,li){
 var d=[
  '큰 그림과 움직임을 눌러 보며 '+s.name+'을 느껴 봐요.',
  '두 가지 보기에서 알맞은 것을 골라 봐요.',
  '직접 옮기고 순서를 맞추며 움직임을 익혀요.',
  '힌트 없이 스스로 판단하며 미니게임에 도전해요.',
  '새로운 상황에서 나에게 맞는 방법을 선택하고 적용해요.'
 ];return d[level-1];
}
function runGame(sh,s,li){
 var st=O.newStats(),ctx={sh:sh,board:sh.board,level:level,stats:st,cfg:{},lesson:{topic:li[0]},id:'sports-'+s.id};
 O.kit(ctx);ctx.clear=function(){O.clearPrompt();sh.board.innerHTML='';sh.board.className='oks-board sports-game-board'};ctx.newStep=function(){sh.mood('idle')};
 st.t0=Date.now();var round=0,total=level===1?3:5,wrong0=0;
 tryBg(sh.board,s);
 function next(){
  if(round>=total)return finish();
  sh.setRounds(total,round);ctx.clear();tryBg(sh.board,s);
  var strip=sceneStrip(s,round,total);sh.board.appendChild(strip);
  var playArea=E('div','sports-play-area');sh.board.appendChild(playArea);
  return Promise.resolve(roundFor(s,li,ctx,playArea,round)).then(function(){round++;setTimeout(next,550)});
 }
 function finish(){
  sh.setRounds(total,total);var mistakes=st.mistakes||0,stars=mistakes<=1?3:mistakes<=3?2:1;
  save(s.id+'-'+school+'-'+lessonNo,stars,mistakes);
  O.finish({stats:st,entry:{at:new Date().toISOString(),lesson:'sports-'+s.id+'-'+school+'-'+lessonNo,subject:'physical',school:school,topic:li[0],level:level,mistakes:mistakes,sec:Math.round((Date.now()-st.t0)/1000)},title:'멋진 스포츠 탐험!',text:s.name+' · '+li[0]+' · '+LEVELS[level-1].name,
   buttons:[
    {label:'한 번 더',onClick:function(){location.reload()}},
    level<5?{label:'다음 수준 ('+(level+1)+')',color:'orange',href:'?festival=summer&sport='+s.id+'&school='+school+'&lesson='+lessonNo+'&level='+(level+1)+'&play=1'}:null,
    {label:'학습지 인쇄',color:'blue',href:'worksheet.html?sport='+s.id+'&school='+school+'&level='+level},
    {label:s.name+' 목차',color:'blue',href:'?festival=summer&sport='+s.id+'&school='+school}
   ].filter(Boolean)});
 }
 next();
}
function sceneStrip(s,i,n){
 var d=E('div','sports-scene-strip');
 var bg=s.id==='athletics'?'assets/athletics/athletics_bg_main.webp':s.image;
 d.innerHTML='<img src="'+bg+'" alt=""><div class="sports-scene-title">'+s.emo+' '+s.name+' 탐험</div><div class="sports-scene-dots">'+Array.from({length:n},function(_,k){return '<i class="'+(k<i?'done':k===i?'now':'')+'">'+(k<i?'★':k+1)+'</i>'}).join('')+'</div>';
 return d;
}
function roundFor(s,li,ctx,host,i){
 if(s.id==='athletics'){
   if(level===1)return athleticsExplore(ctx,host,i);
   if(level===2)return athleticsChoose(ctx,host,i);
   if(level===3)return athleticsSequence(ctx,host,i);
   if(level===4)return athleticsRace(ctx,host,i);
   return athleticsLife(ctx,host,i);
 }
 if(level===1)return exploreRound(s,ctx,host,i);
 if(level===2)return chooseRound(s,ctx,host,i,2);
 if(level===3)return i%2===0?dragRound(s,ctx,host,i):sequenceRound(s,ctx,host,i);
 if(level===4)return i===3?timingRound(s,ctx,host):chooseRound(s,ctx,host,i,4);
 return lifeRound(s,ctx,host,i);
}
function item(o){
  var v=o[0]||'';
  if(String(v).indexOf('img:')===0) return {img:String(v).slice(4),label:o[1]};
  return {emo:v,label:o[1]};
}
function sportSet(s){return SPORT_ITEMS[s.id]||SPORT_ITEMS.athletics}
function athleticsHero(path,label,cls){
 var w=E('div','ath-runner '+(cls||''));w.innerHTML='<img src="assets/athletics/'+path+'" alt="'+(label||'')+'">';return w;
}
function athleticsExplore(ctx,host,i){
 var stages=[
  ['runner_idle.webp','달리기 선수를 만나 봐요.'],
  ['runner_ready.webp','출발 준비 자세를 살펴봐요.'],
  ['runner_run_a.webp','달리는 움직임을 살펴봐요.']
 ],x=stages[i%stages.length];
 ctx.sh.ask(x[1]);
 var hero=athleticsHero(x[0],x[1],'big');host.appendChild(hero);
 var b=E('button','oks-btn orange','눌러 보기');host.appendChild(b);ctx.target({get:function(){return b}});
 return new Promise(function(res){b.onclick=function(){hero.classList.add('bounce');O.sfx('pop');O.say(x[1],{noRepeat:true});ctx.good(b);setTimeout(res,900)}})
}
function athleticsChoose(ctx,host,i){
 var sets=[
  {q:'달리기할 때 신기 좋은 것을 골라요.',ok:['outfit_sneakers.webp','운동화'],no:['outfit_sandals.webp','샌들']},
  {q:'출발할 때 사용하는 것을 골라요.',ok:['start_block.webp','스타팅 블록'],no:['outfit_coat.webp','겨울 외투']},
  {q:'출발 신호를 알려 주는 것을 골라요.',ok:['start_signal.webp','출발 신호'],no:['outfit_scarf.webp','목도리']}
 ],S=sets[i%sets.length];ctx.sh.ask(S.q);
 var arr=O.shuffle([S.ok,S.no]),cards=arr.map(function(x){return ctx.card({img:'assets/athletics/'+x[0],label:x[1]},{big:true})});host.appendChild(ctx.grid(cards,2));
 var ok=cards.filter(function(x){return x._item.label===S.ok[1]})[0];ctx.target({get:function(){return ok}});
 return ctx.tapWait(cards,function(x){return x===ok}).then(function(x){ctx.good(x);O.say(x._item.label,{noRepeat:true});return O.wait(800)})
}
function athleticsSequence(ctx,host,i){
 ctx.sh.ask('출발부터 결승까지 순서대로 눌러 보세요.');
 var seq=[
  ['runner_ready.webp','출발 준비'],
  ['runner_run_a.webp','달리기'],
  ['runner_celebrate.webp','결승']
 ],order=O.shuffle(seq.slice()),cards=order.map(function(x){return ctx.card({img:'assets/athletics/'+x[0],label:x[1]})}),k=0;
 host.appendChild(ctx.grid(cards,3));ctx.target({get:function(){return cards.filter(function(c){return c._item.label===seq[k][1]})}});
 return new Promise(function(res){cards.forEach(function(c){c.onclick=function(){if(c._item.label===seq[k][1]){c.classList.add('good');c._done=true;O.sfx('tick');k++;if(k===seq.length){O.praise();setTimeout(res,900)}else ctx.target({get:function(){return cards.filter(function(x){return!x._done&&x._item.label===seq[k][1]})}})}else ctx.bad(c)}})})
}
function athleticsRace(ctx,host,i){
 ctx.sh.ask(i===0?'신호가 초록색이 되면 출발해요.':i===3?'허들이 나오면 점프해요.':'왼쪽과 오른쪽을 번갈아 눌러 달려요.');
 var game=E('div','ath-race');
 game.innerHTML='<div class="ath-track"><div class="ath-finish"><img src="assets/athletics/finish_ribbon.webp" alt=""></div><div class="ath-player"><img src="assets/athletics/runner_ready.webp" alt=""></div><div class="ath-hurdle '+(i===3?'show':'')+'"><img src="assets/athletics/runner_hurdle.webp" alt=""></div></div><div class="ath-controls"></div>';
 host.appendChild(game);var player=game.querySelector('.ath-player'),ctrl=game.querySelector('.ath-controls'),progress=0,last='';
 if(i===0){
   var sig=E('img','ath-signal');sig.src='assets/athletics/start_signal.webp';ctrl.appendChild(sig);
   var go=E('button','oks-btn orange','기다려요');go.disabled=true;ctrl.appendChild(go);
   return new Promise(function(res){setTimeout(function(){go.disabled=false;go.textContent='출발!';player.querySelector('img').src='assets/athletics/runner_run_a.webp';ctx.target({get:function(){return go}});go.onclick=function(){ctx.good(go);player.style.left='75%';setTimeout(res,1000)}},700+Math.random()*900)})
 }
 if(i===3){
   var jump=E('button','oks-btn orange','점프!');ctrl.appendChild(jump);ctx.target({get:function(){return jump}});
   return new Promise(function(res){jump.onclick=function(){player.querySelector('img').src='assets/athletics/runner_hurdle.webp';player.classList.add('jump');ctx.good(jump);setTimeout(res,1000)}})
 }
 var l=E('button','ath-foot','왼발'),r=E('button','ath-foot','오른발');ctrl.appendChild(l);ctrl.appendChild(r);
 return new Promise(function(res){
   function tap(side,b){if(side===last){ctx.bad(b);return}last=side;progress++;player.querySelector('img').src=progress%2?'assets/athletics/runner_run_a.webp':'assets/athletics/runner_run_b.webp';player.style.left=(8+progress*8)+'%';O.sfx('tick');if(progress>=10){ctx.good(b);player.querySelector('img').src='assets/athletics/runner_celebrate.webp';setTimeout(res,900)}}
   l.onclick=function(){tap('L',l)};r.onclick=function(){tap('R',r)};ctx.target({get:function(){return [l,r]}})
 })
}
function athleticsLife(ctx,host,i){
 if(i===0){
   ctx.sh.ask('달리기에 알맞은 옷을 골라 보세요.');
   var choices=[['outfit_tshirt.webp','티셔츠',1],['outfit_shorts.webp','반바지',1],['outfit_sneakers.webp','운동화',1],['outfit_coat.webp','두꺼운 외투',0],['outfit_scarf.webp','목도리',0],['outfit_sandals.webp','샌들',0]];
   var cards=choices.map(function(x){var c=ctx.card({img:'assets/athletics/'+x[0],label:x[1]});c._ok=x[2];return c});host.appendChild(ctx.grid(cards,3));var got=0;ctx.target({get:function(){return cards.filter(function(x){return x._ok&&!x._done})}});
   return new Promise(function(res){cards.forEach(function(c){c.onclick=function(){if(c._ok&&!c._done){c._done=true;c.classList.add('good');got++;O.sfx('ok');if(got===3){O.praise();setTimeout(res,900)}}else ctx.bad(c)}})})
 }
 return athleticsRace(ctx,host,(i%4));
}
function exploreRound(s,ctx,host,i){
 var set=sportSet(s),arr=set.tools.slice(i%2,i%2+3);if(arr.length<3)arr=set.tools.slice(0,3);
 ctx.sh.ask('그림을 하나씩 눌러 '+s.name+'에 쓰는 것을 살펴봐요.');
 var cards=arr.map(function(x){return ctx.card(item(x),{big:true})});host.appendChild(ctx.grid(cards));
 return new Promise(function(res){var left=cards.length;ctx.target({get:function(){return cards.filter(function(c){return!c._done})}});
  cards.forEach(function(c){c.onclick=function(){if(c._done)return;c._done=true;c.classList.add('good');O.say(c._item.label,{noRepeat:true});O.sfx('pop');left--;if(!left){O.praise();setTimeout(res,900)}else ctx.target({get:function(){return cards.filter(function(x){return!x._done})}})}})
 });
}
function chooseRound(s,ctx,host,i,nopt){
 var set=sportSet(s),right=set.tools[i%set.tools.length],wrong=set.bad.concat(set.tools.filter(function(x){return x!==right})),opts=[right].concat(O.shuffle(wrong).slice(0,nopt-1));
 ctx.sh.ask(s.name+' 활동에 알맞은 것을 골라 보세요.');
 var cards=O.shuffle(opts).map(function(x){return ctx.card(item(x),{big:nopt<=2})});host.appendChild(ctx.grid(cards));
 var ok=cards.filter(function(c){return c._item.label===right[1]})[0];ctx.target({get:function(){return ok}});
 return ctx.tapWait(cards,function(c){return c===ok}).then(function(c){ctx.good(c);O.say(c._item.label,{noRepeat:true});return O.wait(800)});
}
function dragRound(s,ctx,host,i){
 var set=sportSet(s),right=set.tools[i%set.tools.length],wrong=set.bad[0];
 ctx.sh.ask('알맞은 스포츠 도구를 경기장으로 옮겨 보세요.');
 var row=E('div','sports-drag-row'),zone=E('div','sports-dropzone','<b>'+s.emo+'</b><span>'+s.name+' 경기장</span>'),items=[ctx.card(item(right)),ctx.card(item(wrong))];
 row.appendChild(ctx.grid(items,2));row.appendChild(zone);host.appendChild(row);ctx.target({get:function(){return items[0]},to:zone});
 return ctx.dnd(items,[zone],function(it){return it._item.label===right[1]},function(it){ctx.good(it);zone.innerHTML='<b>'+it.innerHTML+'</b><span>잘 옮겼어요!</span>'},function(){return !!items[0]._done}).then(function(){return O.wait(800)});
}
function sequenceRound(s,ctx,host,i){
 var seq=s.id==='athletics'?[['🚩','출발'],['🏃','달리기'],['🏁','도착']]:
         s.id==='swimming'?[['🙆','준비운동'],['🏊','수영'],['🧴','정리']]:
         s.id==='taekwondo'?[['🙇','인사'],['🥋','준비'],['🦵','발차기']]:
         s.id==='gymnastics'?[['🧍','서기'],['🙆','팔 벌리기'],['🦩','균형']]:
         s.id==='archery'?[['🧍','안전선'],['🏹','준비'],['🎯','과녁']]:
         [['⚽','공 준비'],['👟','차기'],['🥅','목표']];
 ctx.sh.ask('동작 순서를 차례대로 눌러 보세요.');
 var order=O.shuffle(seq.slice()),cards=order.map(function(x){return ctx.card(item(x))}),k=0;host.appendChild(ctx.grid(cards,3));
 ctx.target({get:function(){return cards.filter(function(c){return c._item.label===seq[k][1]})}});
 return new Promise(function(res){cards.forEach(function(c){c.onclick=function(){if(c._item.label===seq[k][1]){c._done=true;c.classList.add('good');O.sfx('tick');k++;if(k===seq.length){O.praise();setTimeout(res,800)}else ctx.target({get:function(){return cards.filter(function(x){return!x._done&&x._item.label===seq[k][1]})}})}else ctx.bad(c)}})});
}
function timingRound(s,ctx,host){
 ctx.sh.ask('신호가 나오면 빠르게 눌러 보세요.');
 var box=E('div','sports-timing','<div class="sports-ready">준비…</div>'),b=E('button','oks-btn orange','기다려요');b.disabled=true;box.appendChild(b);host.appendChild(box);
 return new Promise(function(res){setTimeout(function(){box.querySelector('.sports-ready').textContent='출발!';b.disabled=false;b.textContent=s.emo+' 지금!';var t=performance.now();ctx.target({get:function(){return b}});b.onclick=function(){var ms=Math.round(performance.now()-t);box.querySelector('.sports-ready').innerHTML='좋아요! <b>'+ms+'ms</b>';ctx.good(b);setTimeout(res,800)}},800+Math.random()*1200)});
}
function lifeRound(s,ctx,host,i){
 var sets={
 athletics:[['오늘 운동장에서 달리기를 해요. 먼저 무엇을 할까요?',[['🙆','준비운동',1],['⚡','바로 전력질주',0],['👟','신발 확인',1]]],['나의 목표를 골라요.',[['🙂','끝까지 달리기',1],['⏱️','내 기록 확인',1],['🙈','친구 기록만 보기',0]]]],
 swimming:[['수영장에 들어가기 전에 무엇을 할까요?',[['🙆','준비운동',1],['🏃','뛰어서 입수',0],['🥽','물안경 확인',1]]],['안전한 행동을 골라요.',[['🛟','안전도구 확인',1],['😜','친구 밀기',0],['🚶','천천히 이동',1]]]],
 archery:[['양궁 차례를 기다릴 때 어떻게 할까요?',[['🧍','안전선 뒤 기다리기',1],['🏃','과녁 앞으로 뛰기',0],['👀','신호 보기',1]]]],
 gymnastics:[['체조를 시작하기 전에 무엇을 할까요?',[['🙆','몸 풀기',1],['🪑','좁은 곳에서 하기',0],['↔️','주변 공간 확인',1]]]],
 taekwondo:[['친구와 태권도를 할 때 무엇이 중요할까요?',[['🙇','인사하기',1],['🦵','아무 때나 차기',0],['↔️','거리 지키기',1]]]],
 soccer:[['친구와 축구할 때 좋은 행동을 골라요.',[['🤝','패스하기',1],['😠','공 독차지',0],['👀','빈 공간 보기',1]]]]
 };
 var sset=(sets[s.id]||sets.athletics)[i%(sets[s.id]||sets.athletics).length],qtxt=sset[0],opts=sset[1];ctx.sh.ask(qtxt);
 var cards=opts.map(function(x){return ctx.card({emo:x[0],label:x[1]})});host.appendChild(ctx.grid(cards));
 var good=cards.filter(function(c,idx){return opts[idx][2]===1}),need=Math.min(2,good.length),got=0;ctx.target({get:function(){return good.filter(function(x){return!x._done})}});
 return new Promise(function(res){cards.forEach(function(c,idx){c.onclick=function(){if(opts[idx][2]===1&&!c._done){c._done=true;c.classList.add('good');got++;O.sfx('ok');if(got>=need){O.praise();setTimeout(res,800)}else ctx.target({get:function(){return good.filter(function(x){return!x._done})}})}else ctx.bad(c)}})});
}

if(play&&sid)activity();
else if(festival==='summer'&&sid)sportToc();
else if(festival==='summer')summerHub();
else villageHub();
})();