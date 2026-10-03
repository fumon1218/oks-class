(function(){
'use strict';
var O=window.OKS,D=window.OKS_SPORTS_DATA;
var q=new URLSearchParams(location.search), sid=q.get('sport'), level=Math.max(1,Math.min(5,parseInt(q.get('level')||'2',10)));
function icon(file,label){return O.iconHtml(file,label||'');}
function byId(id){return D.sports.filter(function(s){return s.id===id})[0];}
function top(title,sub,back){
  return O.shell({title:title,subtitle:sub,back:back||'../space/',backLabel:back?'하계 스포츠':'우주마을로',level:level,compact:false});
}
function tryBg(el,s){var im=new Image();im.onload=function(){el.classList.add('has-bg');el.style.backgroundImage="url('"+s.image+"')"};im.src=s.image;}
function hub(){
  var sh=top('씽씽 별 마을','체육 · 놀이 · 하계 스포츠','../space/');
  sh.ask('하계 스포츠 마을에서 배우고 싶은 종목을 골라 보세요.',{silent:true});
  var b=document.createElement('div');b.className='sports-hub';
  b.innerHTML='<div class="sports-hero"><h1>☀️ 하계 스포츠 마을</h1><p>보고 · 따라 하고 · 직접 해 보며 스포츠를 배워요</p></div>'+
   '<div class="sports-tabs"><button class="sports-tab on">하계 스포츠</button><button class="sports-tab lock">동계 · 준비 중</button><button class="sports-tab lock">패럴림픽 · 다음 단계</button><button class="sports-tab lock">아시안게임 · 다음 단계</button></div>'+
   '<div class="sports-grid"></div>';
  var g=b.querySelector('.sports-grid');
  D.sports.forEach(function(s){
    var a=document.createElement('button');a.className='sport-card';a.style.setProperty('--sport',s.color);
    a.innerHTML='<span class="emo">'+s.emo+'</span><b>'+s.name+'</b><small>'+s.goal+'</small><span class="go">활동 시작</span>';
    a.onclick=function(){O.sfx('pop');location.href='?sport='+s.id+'&level='+level};g.appendChild(a);
  });
  sh.board.innerHTML='';sh.board.appendChild(b);
}
function levelBar(s,host){
 var x=document.createElement('div');x.className='sport-levels';
 D.levels.forEach(function(L){var b=document.createElement('button');b.className='sport-level'+(L.n===level?' on':'');b.textContent=L.n+' '+L.name;b.title=L.desc;b.onclick=function(){location.href='?sport='+s.id+'&level='+L.n};x.appendChild(b)});
 host.appendChild(x);
}
function activity(){
 var s=byId(sid);if(!s){hub();return}
 var sh=top(s.name+' '+level+'단계',s.title,'./');
 sh.setLevel(level);sh.setRounds(5,0);
 sh.ask(s.goal,{silent:true});
 var wrap=document.createElement('div');levelBar(s,wrap);
 var st=document.createElement('div');st.className='activity-stage';wrap.appendChild(st);tryBg(st,s);
 var act=document.createElement('div');act.className='activity-in';st.appendChild(act);
 var score=0,round=0,mist=0;
 function scoreEl(){return '<div class="scorebar">'+[0,1,2,3,4].map(function(i){return '<img src="../core/ui/'+(i<score?'star_gold.webp':'star.webp')+'" alt="">'}).join('')+' <b>'+score+'/5</b></div>'}
 function ask(t){sh.ask(t,{silent:true});}
 function correct(next){score++;O.sfx('ok');O.praise();round++;sh.setRounds(5,round);setTimeout(next,550)}
 function wrong(btn,msg){mist++;O.sfx('no');btn&&btn.classList.add('bad');O.toast(msg||'다시 한 번 살펴봐요');setTimeout(function(){btn&&btn.classList.remove('bad')},450)}
 function finish(){
   act.innerHTML='<div class="sport-prompt">⭐ '+s.name+' 활동을 마쳤어요!<br><small>'+D.levels[level-1].desc+'</small></div>'+scoreEl()+
   '<div class="activity-actions"><a class="oks-btn blue" href="worksheet.html?sport='+s.id+'&level='+level+'">📄 활동지</a><a class="oks-btn orange" href="?sport='+s.id+'&level='+Math.min(5,level+1)+'">다음 수준</a><a class="oks-btn" href="./">다른 종목</a></div>';
   try{var log=JSON.parse(localStorage.getItem('oks_sports_log_v1')||'[]');log.push({at:new Date().toISOString(),sport:s.id,level:level,score:score,mistakes:mist});localStorage.setItem('oks_sports_log_v1',JSON.stringify(log.slice(-300)))}catch(e){}
 }
 var rounds=makers[s.id](s,act,{level:level,good:correct,bad:wrong,ask:ask,score:function(){return scoreEl()}});
 function next(){if(round>=5)return finish();act.innerHTML='';var f=rounds[round%rounds.length];f(next)}
 next();
 sh.board.innerHTML='';sh.board.appendChild(wrap);
}
function choices(host,items,ok,next,bad){
 var r=document.createElement('div');r.className='choice-row';host.appendChild(r);
 items.forEach(function(x){var b=document.createElement('button');b.className='schoice';b.innerHTML='<span class="big">'+x[0]+'</span><span>'+x[1]+'</span>';b.onclick=function(){if(x[2]===ok){b.classList.add('good');next()}else bad(b)};r.appendChild(b)});
}
var makers={
 athletics:function(s,h,c){return[
  function(n){c.ask('달리기는 어디에서 시작할까요?');h.innerHTML='<div class="sport-prompt">출발 지점을 찾아보세요.</div>';choices(h,[['🚩','출발',1],['🏁','도착',0]],1,function(){c.good(n)},c.bad)},
  function(n){c.ask('출발부터 도착까지 차례대로 눌러 보세요.');h.innerHTML='<div class="sport-prompt">1 → 2 → 3 → 4</div><div class="trackline"></div>';var k=1;var tr=h.querySelector('.trackline');[1,2,3,4].forEach(function(i){var b=document.createElement('button');b.className='trackstep';b.textContent=i;b.onclick=function(){if(i===k){b.classList.add('done');k++;O.sfx('tick');if(k===5)c.good(n)}else c.bad(b,'차례를 다시 확인해요')};tr.appendChild(b)})},
  function(n){c.ask('달리기 전에 준비해야 할 것을 골라 보세요.');h.innerHTML='<div class="sport-prompt">안전하게 준비해요.</div>';choices(h,[['👟','운동화',1],['🧸','인형',0],['💧','물',1]],1,function(){c.good(n)},c.bad)},
  function(n){c.ask('신호가 나오면 빠르게 눌러 보세요.');h.innerHTML='<div class="sport-prompt">준비…</div><button class="oks-btn orange" disabled>기다려요</button>';var b=h.querySelector('button'),p=h.querySelector('.sport-prompt');setTimeout(function(){p.textContent='출발!';b.disabled=false;b.textContent='🏃 달리기';var t=performance.now();b.onclick=function(){var ms=Math.round(performance.now()-t);p.textContent='반응 시간 '+ms+'ms';c.good(n)}},700+Math.random()*900)},
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
if(sid)activity();else hub();
})();