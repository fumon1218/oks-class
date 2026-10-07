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

function byId(id){return D.sports.filter(function(s){return s.id===id})[0];}
function schoolInfo(){return SCHOOLS.filter(function(x){return x.key===school})[0]||SCHOOLS[0];}
function top(title,sub,back,label,compact,fit){
 return O.shell({title:title,subtitle:sub,back:back||'../',backLabel:label||'뒤로',level:level,compact:compact!==false,fit:fit==null?compact!==false:fit});
}
function tryBg(el,s){var src=s.scene||s.image,im=new Image();im.onload=function(){el.classList.add('sports-bg');el.style.setProperty('--sport-bg',"url('"+src+"')")};im.src=src;}
function progress(){try{return JSON.parse(localStorage.getItem('oks_sports_progress_v4')||'{}')}catch(e){return{}}}
function save(key,stars,mistakes){
 var p=progress();p[key]=p[key]||{plays:0,best:{}};p[key].plays++;p[key].last=level;p[key].best[level]=Math.max(p[key].best[level]||0,stars||0);p[key].mistakes=mistakes;
 try{localStorage.setItem('oks_sports_progress_v4',JSON.stringify(p))}catch(e){}
}
function info(s,sk,no){
 if(s.id==='athletics'&&window.OKS_ATHLETICS){var c=OKS_ATHLETICS.course(sk,no);return [c.title,c.goal]}
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

/* ---------- 씽씽 별 마을 (우리 별 마을과 같은 틀: 지도 배경 + 건물 + 이름표 + 안내자) ---------- */
var HUB_W=1672,HUB_H=941;
var HUB=[
 {id:'summer',name:'하계 올림픽',sub:'달리고 · 뛰고 · 헤엄쳐요',img:'hub_bld_summer',x:840,y:445,w:330,open:true,url:'?festival=summer',say:'하계 올림픽 마을로 들어가요!'},
 {id:'winter',name:'동계 올림픽',sub:'눈과 얼음 위 스포츠',img:'hub_bld_winter',x:895,y:152,w:250,say:'동계 올림픽 마을은 곧 열려요. 조금만 기다려요!'},
 {id:'summer_para',name:'하계 패럴림픽',sub:'함께 즐기는 여름 스포츠',img:'hub_bld_summer_para',x:392,y:308,w:290,say:'하계 패럴림픽 마을은 곧 열려요. 조금만 기다려요!'},
 {id:'winter_para',name:'동계 패럴림픽',sub:'함께 즐기는 겨울 스포츠',img:'hub_bld_winter_para',x:1280,y:312,w:280,say:'동계 패럴림픽 마을은 곧 열려요. 조금만 기다려요!'},
 {id:'asian',name:'아시안게임',sub:'아시아의 다양한 스포츠',img:'hub_bld_asian',x:355,y:632,w:330,say:'아시안게임 마을은 곧 열려요. 조금만 기다려요!'},
 {id:'medal',name:'메달 하우스',sub:'나의 기록 · 참여 메달',img:'hub_bld_medal',x:1340,y:660,w:250,open:true,util:'medal'},
 {id:'info',name:'스포츠 안내센터',sub:'오늘의 추천 · 이용 안내',img:'hub_bld_info',x:835,y:714,w:200,open:true,util:'info'}
];
function villageHub(){
 document.body.classList.add('sports-hubmap');
 var root=E('div','sh-root'),
 hello='씽씽 별 마을에 오신 것을 환영해요! 건물을 눌러 보세요. 하계 올림픽 마을부터 시작해요.';
 root.innerHTML='<div class="sh-back" style="background-image:url(assets/hub_map.webp)"></div><div class="sh-scroll"><div class="sh-map"><img class="sh-bg" src="assets/hub_map.webp" alt="씽씽 별 마을 지도"></div></div>'+
  '<div class="sh-top"><a class="oks-pill sh-exit" href="../">🚀 <span>우주로</span></a><div class="sh-title"><b>씽씽 별 마을</b><span>체육 · 놀이 · 건물을 눌러요</span></div><div class="sh-hud"></div></div>'+
  '<div class="sh-guide"><img src="../art/char/ok_wave.webp" alt=""><div class="sh-bubble"></div></div>';
 var map=root.querySelector('.sh-map'),bub=root.querySelector('.sh-bubble'),guide=root.querySelector('.sh-guide');
 function talk(t,speak){bub.textContent=t;guide.dataset.say=t;guide.classList.remove('pop');void guide.offsetWidth;guide.classList.add('pop');guide.classList.remove('quiet');clearTimeout(talk.t);talk.t=setTimeout(function(){guide.classList.add('quiet')},7000);if(speak!==false)O.say(t,{noRepeat:true});}
 guide.onclick=function(){guide.classList.remove('quiet');clearTimeout(talk.t);talk.t=setTimeout(function(){guide.classList.add('quiet')},7000);if(guide.dataset.say)O.say(guide.dataset.say)};
 HUB.forEach(function(b,i){
  var e=E('button','sh-bld'+(b.open?'':' lock'));e.type='button';e.dataset.id=b.id;
  e.style.left=b.x/HUB_W*100+'%';e.style.top=b.y/HUB_H*100+'%';e.style.width=b.w/HUB_W*100+'%';e.style.zIndex=Math.round(b.y);e.style.animationDelay=(i*70)+'ms';
  e.innerHTML='<img class="sh-img" src="assets/'+b.img+'.webp" alt="">'+(b.open?'':'<img class="sh-cloud" src="../art/space/space_cloud.webp" alt="">')+
   '<span class="sh-name"><b>'+O.esc(b.name)+'</b><small>'+(b.open?O.esc(b.sub):'🔒 곧 만나요')+'</small></span>';
  e.onclick=function(){
   if(b.open){O.sfx('pop');if(b.util){utilityBuilding(b.util);return}talk(b.say);setTimeout(function(){location.href=b.url},650);}
   else{O.sfx('tick');talk(b.say);O.toast('이 스포츠 마을은 준비 중이에요');e.classList.remove('shake');void e.offsetWidth;e.classList.add('shake');}
  };
  map.appendChild(e);
 });
 document.body.innerHTML='';document.body.appendChild(root);
 var sc=root.querySelector('.sh-scroll');sc.scrollLeft=(sc.scrollWidth-sc.clientWidth)/2;
 if(O.eco&&O.eco.hud){try{O.eco.hud(root.querySelector('.sh-hud'))}catch(x){}}
 talk(hello);
}
/* ---------- 하계 올림픽 종목 ---------- */
function summerHub(){
 var sh=top('하계 스포츠 마을','씽씽 별 마을 · 하계 스포츠','./','씽씽별로',false);
 sh.ask('가 보고 싶은 건물을 골라 보세요. 경기장에서는 종목별 차시를, 보조 건물에서는 안내와 복습을 할 수 있어요.',{silent:true});
 var host=E('div','summer-village');
 host.innerHTML='<div class="summer-village-sky"><div><small>씽씽 별 마을</small><h1>하계 스포츠 마을</h1><p>건물을 눌러 운동과 놀이를 시작해요</p></div><span class="summer-village-badge">☀️ 하계 스포츠</span></div><div class="summer-village-map"><div class="summer-road road-a"></div><div class="summer-road road-b"></div><div class="summer-plaza"><span>⭐</span><b>씽씽 광장</b></div><div class="summer-building-grid"></div></div>';
 var grid=host.querySelector('.summer-building-grid');
 (D.summerBuildings||[]).forEach(function(b,i){
   var btn=E('button','summer-building '+(b.type==='utility'?'utility':'sport')+' pos-'+(i+1));
   btn.style.setProperty('--bcolor',b.color||'#55cfff');
   btn.innerHTML='<span class="summer-building-art"><img src="'+b.image+'" alt=""></span><span class="summer-building-label"><b>'+b.name+'</b><small>'+b.sub+'</small></span>';
   var bi=btn.querySelector('img');bi.onerror=function(){var s=b.type==='sport'&&byId(b.id);if(s&&s.scene&&this.src.indexOf(s.scene)<0)this.src=s.scene;else this.style.visibility='hidden'};
   btn.onclick=function(){
     O.sfx('pop');
     if(b.type==='sport'){location.href='?festival=summer&sport='+b.id;return;}
     utilityBuilding(b.id);
   };
   grid.appendChild(btn);
 });
 sh.board.innerHTML='';sh.board.appendChild(host);
}
function utilityBuilding(id){
 var old=document.querySelector('.summer-utility-modal');if(old)old.remove();
 var modal=E('div','summer-utility-modal'),box=E('section','summer-utility-box'),close=E('button','summer-utility-close','×');
 close.type='button';close.setAttribute('aria-label','닫기');close.onclick=function(){modal.remove();O.sfx('pop')};
 box.appendChild(close);
 var data=(D.summerBuildings||[]).filter(function(x){return x.id===id})[0]||{};
 var head=E('div','summer-utility-head','<img src="'+(data.image||'')+'" alt=""><div><small>하계 스포츠 마을</small><h2>'+(data.name||'스포츠 안내')+'</h2><p>'+(data.sub||'')+'</p></div>');
 box.appendChild(head);
 var body=E('div','summer-utility-body');box.appendChild(body);
 if(id==='info'){
   body.innerHTML='<div class="summer-tip"><b>오늘은 이렇게 시작해요</b><p>처음이라면 육상 경기장에서 1수준 ‘느껴 보기’부터 시작해 보세요. 학생의 움직임과 반응 속도에 따라 수준을 자유롭게 바꿀 수 있어요.</p></div>';
   var a=E('a','oks-btn','🏃 육상 경기장 가기');a.href='?festival=summer&sport=athletics';body.appendChild(a);
 }else if(id==='medal'){
   var p=progress(),keys=Object.keys(p),plays=0,stars=0;
   keys.forEach(function(k){if(k.indexOf('-')<0)return;var x=p[k]||{};plays+=x.plays||0;Object.keys(x.best||{}).forEach(function(lv){stars+=x.best[lv]||0})});
   body.innerHTML='<div class="summer-medal-stats"><div><b>'+plays+'</b><small>참여한 활동</small></div><div><b>'+stars+'</b><small>모은 별</small></div><div><b>'+keys.length+'</b><small>기록된 차시</small></div></div><p class="summer-note">순위보다 참여와 나의 변화가 더 중요해요. 같은 종목도 다른 수준으로 다시 도전할 수 있어요.</p>';
 }else if(id==='play'){
   body.innerHTML='<p class="summer-note">수업 사이에 짧고 즐겁게 몸을 움직이는 놀이 공간이에요.</p>';
   var l=E('a','oks-btn blue','🎮 미니게임 놀이터 가기');l.href='../minigames/';body.appendChild(l);
 }else{
   body.innerHTML='<p class="summer-note">배웠던 종목을 골라 다시 연습해 보세요. 각 경기장에서 학년과 수준을 다시 선택할 수 있어요.</p><div class="summer-training-links"></div>';
   var links=body.querySelector('.summer-training-links');
   D.sports.forEach(function(s){var a=E('a','summer-training-link','<img src="'+s.image+'" alt=""><span><b>'+s.name+'</b><small>'+s.title+'</small></span>');a.href='?festival=summer&sport='+s.id;var im=a.querySelector('img');im.onerror=function(){if(s.scene&&this.src.indexOf(s.scene)<0)this.src=s.scene};links.appendChild(a)});
 }
 modal.onclick=function(e){if(e.target===modal)modal.remove()};modal.appendChild(box);document.body.appendChild(modal);
}
/* ---------- 종목 차시 + 수준 ---------- */
function sportToc(){
 var s=byId(sid);if(!s){summerHub();return}
 var sh=top(s.name+' 경기장','하계 올림픽 · 체육 · 놀이','?festival=summer','하계 올림픽',false);
 sh.ask(s.name+' 경기장이에요. 층을 고르고 차시와 수준을 눌러요.',{silent:true});
 var host=E('div','sport-toc');
 host.innerHTML='<div class="sport-toc-head"><img src="'+s.image+'" alt=""><div><small>하계 스포츠</small><h1>'+s.name+' 경기장</h1><p>'+s.goal+'</p></div></div><div class="sports-floor-tabs"></div><div class="sports-lesson-list"></div>';
 var heroImg=host.querySelector('.sport-toc-head img');heroImg.onerror=function(){if(s.scene&&this.src.indexOf(s.scene)<0)this.src=s.scene};
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
 var sh=top(s.name+' '+lessonNo+'차시 · '+li[0],sc.name+' · 체육 · 놀이','?festival=summer&sport='+s.id+'&school='+school,s.name+' 목차',true,s.id==='athletics'?false:undefined);
 if(s.id==='athletics') document.body.classList.add('athletics-game');
 document.body.classList.add('oks-play','sports-play');
 if(s.id==='athletics'&&window.OKS_ATHLETICS){OKS_ATHLETICS.mount({sh:sh,school:school,lesson:lessonNo,level:level,save:function(stars,mistakes){save('athletics-'+school+'-'+lessonNo,stars,mistakes)}});return;}
 sh.setLevel(level);sh.setRounds(level===1?3:5,0);
 sh.ask(li[0]+'! 시작해 볼까요?',{silent:true});

 var start=E('div','oks-start sports-start');
 var preview=s.id==='athletics'?'assets/athletics/athletics_bg_main.webp':(s.scene||s.image);
 start.innerHTML='<div class="oks-start-lv">'+LEVELS[level-1].name+'</div><p class="gdesc">'+levelDesc(s,li)+'</p><p>'+li[1]+'</p><div class="sports-start-preview'+(s.id==='athletics'?' athletics-preview':'')+'"><img class="preview-bg" src="'+preview+'" alt="">'+(s.id==='athletics'?'<img class="preview-runner" src="assets/athletics/runner_idle.webp" alt="">':'')+'</div>';
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
 st.t0=Date.now();var round=0,total=level===1?3:5,wrong0=0,LD=lessonData(s)||OKS_SPORT_LESSONS[s.id].elem[0],PLAN=makePlan(s,LD,ctx);
 if(q.get('dev')==='game'&&level>=4){PLAN=[PLAN[level===4?3:2]];total=1}
 function next(){
  if(round>=total)return finish();
  sh.setRounds(total,round);ctx.clear();
  var strip=sceneStrip(s,round,total);sh.board.appendChild(strip);
  var playArea=E('div','sports-play-area');sh.board.appendChild(playArea);
  return Promise.resolve(PLAN[round](playArea)).then(function(){round++;setTimeout(next,550)});
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
 var bg=s.id==='athletics'?'assets/athletics/athletics_bg_main.webp':(s.scene||s.image);
 d.innerHTML='<img src="'+bg+'" alt=""><div class="sports-scene-title">'+s.emo+' '+s.name+' 탐험</div><div class="sports-scene-dots">'+Array.from({length:n},function(_,k){return '<i class="'+(k<i?'done':k===i?'now':'')+'">'+(k<i?'★':k+1)+'</i>'}).join('')+'</div>';
 return d;
}
/* ---------- 라운드 만들기: 차시 자료(lessons.js)에서 수준에 맞게 ---------- */
function lessonData(s){
 var A=window.OKS_SPORT_LESSONS&&OKS_SPORT_LESSONS[s.id],arr=A&&(A[school]||A.elem);
 return arr&&arr[Math.max(0,Math.min(arr.length-1,lessonNo-1))];
}
function item(o){
  var v=o[0]||'';
  if(String(v).indexOf('img:')===0) return {img:String(v).slice(4),label:o[1]};
  return {emo:v,label:o[1]};
}
function makePlan(s,L,ctx){
 var it=O.shuffle(L.i.slice()),nr=O.shuffle(L.n.slice()),tt=O.shuffle(L.t.slice()),R=[],gm=String(L.g||'').split(':'),gk=gm[0],ga=gm[1];
 function game(){return function(host){return OKS_SPORT_GAMES[gk](ctx,host,{level:level,arg:ga,lesson:L,sport:s})}}
 function explore(i){return function(host){
  var a=[];for(var k=0;k<3;k++)a.push(it[(i*2+k)%it.length]);
  ctx.sh.ask('그림을 하나씩 눌러 보세요. '+(L.q||'').replace(/을 골라요|를 골라요/,'을 알아봐요'));
  var cards=a.map(function(x){return ctx.card(item(x),{big:true})});host.appendChild(ctx.grid(cards));
  return new Promise(function(res){var left=cards.length;ctx.target({get:function(){return cards.filter(function(c){return!c._done})}});
   cards.forEach(function(c){c.onclick=function(){if(c._done)return;c._done=true;c.classList.add('good');O.say(c._item.label,{noRepeat:true});O.sfx('pop');left--;if(!left){O.praise();setTimeout(res,900)}else ctx.target({get:function(){return cards.filter(function(x){return!x._done})}})}})});
 }}
 function pick(i,nopt){return function(host){
  var right=it[i%it.length],wr=O.shuffle(nr.slice()).slice(0,nopt-1),opts=O.shuffle([right].concat(wr));
  ctx.sh.ask(L.q);var cards=opts.map(function(x){return ctx.card(item(x),{big:nopt<=2})});host.appendChild(ctx.grid(cards,nopt>3?2:undefined));
  var ok=cards.filter(function(c){return c._item.label===right[1]})[0];ctx.target({get:function(){return ok}});
  O.say(L.q,{noRepeat:true});
  return ctx.tapWait(cards,function(c){return c===ok}).then(function(c){ctx.good(c);O.say(c._item.label,{noRepeat:true});return O.wait(800)});
 }}
 function drag(i){return function(host){
  var right=it[i%it.length],wrong=nr[i%nr.length];
  ctx.sh.ask('알맞은 것을 "'+L.z+'"(으)로 옮겨 보세요.');
  var row=E('div','sports-drag-row'),zone=E('div','sports-dropzone','<b>'+s.emo+'</b><span>'+L.z+'</span>'),items=O.shuffle([ctx.card(item(right)),ctx.card(item(wrong))]),good=items.filter(function(c){return c._item.label===right[1]})[0];
  row.appendChild(ctx.grid(items,2));row.appendChild(zone);host.appendChild(row);ctx.target({get:function(){return good},to:zone});
  return ctx.dnd(items,[zone],function(c){return c._item.label===right[1]},function(c){ctx.good(c);zone.innerHTML='<b>'+c.querySelector('.pic').innerHTML+'</b><span>'+O.esc(right[1])+' · 잘 옮겼어요!</span>'},function(){return !!good._done}).then(function(){return O.wait(800)});
 }}
 function order(){return function(host){
  var seq=L.s.slice(0,4),cards,k=0;ctx.sh.ask('일이 일어나는 순서대로 눌러 보세요.');
  cards=O.shuffle(seq.slice()).map(function(x){return ctx.card(item(x))});host.appendChild(ctx.grid(cards,Math.min(4,seq.length)));
  ctx.target({get:function(){return cards.filter(function(c){return c._item.label===seq[k][1]})}});
  return new Promise(function(res){cards.forEach(function(c){c.onclick=function(){if(c._done||k>=seq.length)return;
   if(c._item.label===seq[k][1]){c._done=true;c.classList.add('good');O.sfx('tick');O.say(c._item.label,{noRepeat:true});k++;
    if(k===seq.length){O.praise();setTimeout(res,800)}else ctx.target({get:function(){return cards.filter(function(x){return!x._done&&x._item.label===seq[k][1]})}})}else ctx.bad(c)}})});
 }}
 function nextStep(i){return function(host){
  var seq=L.s.slice(0,4),n=seq.length,kk=1+(i%(n-2)),right=seq[kk],others=seq.filter(function(x,idx){return idx!==kk&&idx!==kk-1});
  ctx.sh.ask('다음에 할 일은 무엇일까요?');
  var done=E('div','sports-done-row',seq.slice(0,kk).map(function(x){return '<span>'+x[0]+' '+O.esc(x[1])+'</span>'}).join('<i>→</i>')+'<i>→</i><span class="q">❓</span>');host.appendChild(done);
  var opts=O.shuffle([right].concat(O.shuffle(others).slice(0,2))),cards=opts.map(function(x){return ctx.card(item(x))});host.appendChild(ctx.grid(cards));
  var ok=cards.filter(function(c){return c._item.label===right[1]})[0];ctx.target({get:function(){return ok}});
  return ctx.tapWait(cards,function(c){return c===ok}).then(function(c){ctx.good(c);O.say(c._item.label,{noRepeat:true});return O.wait(800)});
 }}
 function situ(i,nopt){return function(host){
  var T=tt[i%tt.length],good=T.o.filter(function(x){return x[2]}),bad=T.o.filter(function(x){return!x[2]});
  var opts=nopt?O.shuffle([good[0]].concat(O.shuffle(bad.slice()).slice(0,nopt-1))):O.shuffle(T.o.slice());
  ctx.sh.ask(T.q);O.say(T.q,{noRepeat:true});
  var cards=opts.map(function(x){return ctx.card({emo:x[0],label:x[1]})});host.appendChild(ctx.grid(cards));
  var need=nopt?1:Math.min(2,good.length),got=0;ctx.target({get:function(){return cards.filter(function(c,idx){return opts[idx][2]&&!c._done})}});
  return new Promise(function(res){cards.forEach(function(c,idx){c.onclick=function(){
   if(c._done)return;
   if(opts[idx][2]){c._done=true;c.classList.add('good');got++;O.sfx('ok');O.say(opts[idx][1],{noRepeat:true});
    if(got>=need){O.praise();setTimeout(res,900)}else ctx.target({get:function(){return cards.filter(function(x,j){return opts[j][2]&&!x._done})}})}
   else ctx.bad(c)}})});
 }}
 if(level===1){for(var a=0;a<3;a++)R.push(explore(a));}
 else if(level===2){R=[pick(0,2),pick(1,2),pick(2,2),pick(3,2),situ(0,2)];}
 else if(level===3){R=[drag(0),order(),drag(1),nextStep(0),drag(2)];}
 else if(level===4){R=[pick(0,4),pick(1,4),pick(2,4),game(),situ(1,3)];}
 else{R=[situ(0),situ(1),game(),situ(2),situ(3)];}
 return R;
}

if(play&&sid)activity();
else if(festival==='summer'&&sid)sportToc();
else if(festival==='summer')summerHub();
else villageHub();
})();