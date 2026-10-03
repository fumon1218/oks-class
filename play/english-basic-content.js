/* 기초영어 18차시 콘텐츠 */
(function(){'use strict';var C=window.OKS_CONTENT=window.OKS_CONTENT||{};
const im=(img,label,en)=>({img,label,en,initial:en[0].toUpperCase()}),em=(emo,label,en)=>({emo,label,en,initial:en[0].toUpperCase()}),AZ='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const P={apple:im('games/balloons/img/f_apple.webp','사과','apple'),bear:im('art/stickers/bear.png','곰','bear'),cat:im('art/stickers/cat.png','고양이','cat'),dog:im('art/stickers/dog.png','강아지','dog'),elephant:im('art/stickers/elephant.png','코끼리','elephant'),fish:im('art/obj/fish.webp','물고기','fish'),horse:im('art/obj/horse.webp','말','horse'),key:im('art/obj/key.webp','열쇠','key'),monkey:im('art/stickers/monkey.png','원숭이','monkey'),panda:im('art/stickers/panda.png','판다','panda'),rabbit:im('art/stickers/rabbit.png','토끼','rabbit'),sun:im('art/obj/sun.webp','해','sun'),tiger:im('art/stickers/tiger.png','호랑이','tiger'),umbrella:im('art/obj/umbrella.webp','우산','umbrella'),violin:im('art/obj/violin.webp','바이올린','violin'),whale:im('art/obj/whale.webp','고래','whale'),carrot:im('games/farm/assets/harvest_carrot.webp','당근','carrot'),tomato:im('games/farm/assets/harvest_tomato.webp','토마토','tomato'),strawberry:im('games/farm/assets/strawberry_single.webp','딸기','strawberry'),milk:im('art/jj/kitchen/ing_milk.webp','우유','milk'),cup:im('art/jj/recycle/cup.webp','컵','cup'),bed:im('art/obj/bed.webp','침대','bed'),bus:im('art/obj/bus.webp','버스','bus'),car:im('art/obj/car.webp','자동차','car'),bird:im('art/obj/bird.webp','새','bird'),frog:im('art/stickers/frog.png','개구리','frog')};
const initial=[P.apple,P.bear,P.cat,P.dog,P.elephant,P.fish,P.horse,P.key,P.monkey,P.panda,P.rabbit,P.sun,P.tiger,P.umbrella,P.violin,P.whale];
function sets(a){return a.map((it,i)=>({q:it.initial+'로 시작하는 그림을 골라요 🔊',opts:[it,a[(i+3)%a.length],a[(i+7)%a.length]],ok:0,en:it.initial}));}
C['05-00-01-01']={engine:'alphaHear',letters:AZ};C['05-00-01-02']={engine:'alphaTrace',letters:AZ,case:'upper'};C['05-00-01-03']={engine:'alphaTrace',letters:AZ,case:'lower'};C['05-00-01-04']={engine:'alphaMemory',letters:AZ};C['05-00-01-05']={engine:'pick',voice:'en',hideLabel:1,sets:sets(initial)};C['05-00-01-06']={engine:'alphaOrder',letters:AZ};
C['05-00-02-01']={engine:'alphaSpell',words:[em('🔴','빨강','red'),em('🔵','파랑','blue'),em('🟢','초록','green'),em('🟡','노랑','yellow')]};
C['05-00-02-02']={engine:'alphaSpell',words:[P.apple,P.carrot,P.tomato,P.strawberry]};C['05-00-02-03']={engine:'alphaSpell',words:[P.cat,P.dog,P.frog,P.bear,P.tiger,P.rabbit,P.panda]};C['05-00-02-04']={engine:'pick',voice:'en',hideLabel:1,sets:sets([P.apple,P.bird,P.cat,P.dog,P.fish,P.key,P.monkey,P.rabbit,P.sun,P.tiger])};C['05-00-02-05']={engine:'alphaSpell',words:[P.cup,P.key,P.bed,P.bus,P.car,P.milk]};C['05-00-02-06']={engine:'pairs',wordOf:'en',items:[P.apple,P.cat,P.dog,P.fish,P.key,P.rabbit,P.sun,P.cup,P.bed,P.bus]};
function sent(prefix,a){return a.map(it=>({text:prefix.replace('{word}',it.en),item:it}));}
C['05-00-03-01']={engine:'alphaSentence',sentences:sent('I see a {word}.',[P.cat,P.dog,P.bird,P.fish,P.bus,P.car])};C['05-00-03-02']={engine:'alphaSentence',sentences:sent('This is a {word}.',[P.cup,P.key,P.bed,P.bus,P.car,P.umbrella])};C['05-00-03-03']={engine:'alphaSentence',sentences:sent('I have a {word}.',[P.key,P.cup,P.apple,P.umbrella,P.car])};C['05-00-03-04']={engine:'alphaSentence',sentences:sent('I like {word}.',[P.cat,P.dog,P.apple,P.rabbit,P.panda])};C['05-00-03-05']={engine:'alphaSentence',prompt:'What is this?',sentences:sent('It is a {word}.',[P.cup,P.key,P.cat,P.dog,P.fish,P.apple])};C['05-00-03-06']={engine:'pick',voice:'en',hideLabel:1,sets:sets([P.apple,P.cat,P.key,P.rabbit,P.cup,P.dog])};
window.OKS_ENGLISH_BASIC_WS=function(W,c){
  var id=W.id,lv=W.level,shuf=W.shuf,n=[4,5,6,7,8][lv-1],letters=shuf(AZ.slice()).slice(0,n);
  function card(ch,ok){return '<span class="card'+(ok?' circ':'')+'" style="min-width:52px;font:700 28px Arial">'+ch+'</span>';}
  function line(w){return '<span style="display:inline-block;min-width:'+Math.max(80,w.length*20)+'px;height:38px;border-bottom:2px dashed #b9b0a0;margin-left:10px"></span>';}
  function traceRow(ch){return '<div class="row" style="margin-bottom:9px"><span style="font:700 38px Arial;color:#d2ccc1;-webkit-text-stroke:1px #aaa;min-width:52px">'+ch+'</span>'+line(ch)+line(ch)+'</div>';}
  function pairQ(list){
    var R=shuf(list.slice());
    return {t:'대문자와 알맞은 소문자를 선으로 이으세요.',b:'<div class="match">'+list.map(function(ch,i){return '<div class="l"><span style="font:700 30px Arial">'+ch+'</span><span class="dot"></span></div><div></div><div class="r"><span class="dot"></span><span style="font:700 30px Arial">'+R[i].toLowerCase()+'</span></div>';}).join('')+'</div><div class="ansline">답: '+list.map(function(ch){return ch+'–'+ch.toLowerCase();}).join(', ')+'</div>'};
  }
  function chooseCaseQ(list,upper){
    return {t:(upper?'대문자':'소문자')+'에 ○ 하세요.',b:list.slice(0,Math.min(6,list.length)).map(function(ch,i){
      var right=upper?ch:ch.toLowerCase(),wrong1=upper?ch.toLowerCase():ch,other=AZ[(AZ.indexOf(ch)+5+i)%26],wrong2=upper?other.toLowerCase():other;
      return '<div class="row" style="margin-bottom:8px"><span style="min-width:34px">('+'가나다라마바'[i]+')</span>'+shuf([{v:right,ok:1},{v:wrong1,ok:0},{v:wrong2,ok:0}]).map(function(x){return card(x.v,x.ok);}).join('')+'</div>';
    }).join('')};
  }
  function seqQ(){
    var rows=[],ans=[];
    for(var i=0;i<Math.min(6,n);i++){var st=W.ri(0,22),a=AZ[st],b=AZ[st+1],d=AZ[st+3];rows.push('<div style="font:700 28px Arial;letter-spacing:.18em;margin:7px 0">'+a+' '+b+' <span class="fillans" data-a="'+AZ[st+2]+'">__</span> '+d+'</div>');ans.push(AZ[st+2]);}
    return {t:'알파벳 순서를 보고 빈칸에 알맞은 글자를 쓰세요.',b:rows.join('')+'<div class="ansline">답: '+ans.join(', ')+'</div>'};
  }
  if(id==='05-00-01-01'){
    var q1={t:'알파벳을 소리 내어 읽고, 같은 소문자에 ○ 하세요.',b:letters.slice(0,6).map(function(ch,i){var wrong=shuf(AZ.filter(function(x){return x!==ch;})).slice(0,2);return '<div class="row" style="margin-bottom:8px"><span style="font:700 28px Arial;min-width:54px">'+ch+'</span>'+shuf([{v:ch.toLowerCase(),ok:1},{v:wrong[0].toLowerCase(),ok:0},{v:wrong[1].toLowerCase(),ok:0}]).map(function(x){return card(x.v,x.ok);}).join('')+'</div>';}).join('')};
    return [q1,pairQ(letters.slice(0,Math.min(6,n))),{t:'알파벳을 따라 쓰고, 옆에 한 번 더 써 보세요.',b:letters.slice(0,6).map(traceRow).join('')}];
  }
  if(id==='05-00-01-02'){
    return [chooseCaseQ(letters,true),{t:'대문자를 따라 쓰고, 옆에 스스로 써 보세요.',b:letters.slice(0,6).map(traceRow).join('')},seqQ()];
  }
  if(id==='05-00-01-03'){
    var lows=letters.map(function(x){return x.toLowerCase();});
    return [chooseCaseQ(letters,false),{t:'소문자를 따라 쓰고, 옆에 스스로 써 보세요.',b:lows.slice(0,6).map(traceRow).join('')},pairQ(letters.slice(0,Math.min(6,n)))];
  }
  if(id==='05-00-01-04'){
    var list=letters.slice(0,Math.min(7,n));
    var q2={t:'같은 알파벳의 대문자·소문자 짝에 ○ 하세요.',b:list.slice(0,6).map(function(ch,i){var w=AZ[(AZ.indexOf(ch)+7+i)%26].toLowerCase();return '<div class="row" style="margin-bottom:8px"><span style="font:700 28px Arial;min-width:50px">'+ch+'</span>'+shuf([{v:ch+'–'+ch.toLowerCase(),ok:1},{v:ch+'–'+w,ok:0}]).map(function(x){return '<span class="card'+(x.ok?' circ':'')+'" style="min-width:86px;font:700 24px Arial">'+x.v+'</span>';}).join('')+'</div>';}).join('')};
    var q3={t:'빈칸에 알맞은 소문자를 써서 짝을 완성하세요.',b:list.slice(0,6).map(function(ch){return '<span style="display:inline-block;font:700 27px Arial;margin:8px 22px 8px 0">'+ch+' – <span class="fillans" data-a="'+ch.toLowerCase()+'">____</span></span>';}).join('')};
    return [pairQ(list),q2,q3];
  }
  if(id==='05-00-01-05'){
    var items=shuf(initial.slice()).slice(0,Math.min(6,n)),lettersPool=items.map(function(x){return x.initial;});
    function pic(it){return '<img src="../'+it.img+'" alt="'+it.label+'" style="width:58px;height:58px;object-fit:contain">';}
    var q1={t:'그림의 첫소리에 알맞은 알파벳에 ○ 하세요.',b:items.map(function(it,i){var wrong=shuf(AZ.filter(function(x){return x!==it.initial;})).slice(0,2);return '<div class="row" style="margin-bottom:8px">'+pic(it)+'<span style="min-width:68px;font-size:15px">'+it.label+'</span>'+shuf([{v:it.initial,ok:1},{v:wrong[0],ok:0},{v:wrong[1],ok:0}]).map(function(x){return card(x.v,x.ok);}).join('')+'</div>';}).join('')};
    var R=shuf(items.slice());
    var q2={t:'그림과 알맞은 영어 낱말을 선으로 이으세요.',b:'<div class="match">'+items.map(function(it,i){return '<div class="l">'+pic(it)+'<span class="dot"></span></div><div></div><div class="r"><span class="dot"></span><span style="font:700 20px Arial">'+R[i].en+'</span></div>';}).join('')+'</div><div class="ansline">답: '+items.map(function(it){return it.label+'–'+it.en;}).join(', ')+'</div>'};
    var q3={t:'그림을 보고 첫 글자를 써서 낱말을 완성하세요.',b:items.slice(0,5).map(function(it){return '<div class="row" style="margin-bottom:8px">'+pic(it)+'<span style="font:700 25px Arial"><span class="fillans" data-a="'+it.initial.toLowerCase()+'">__</span>'+it.en.slice(1)+'</span></div>';}).join('')};
    return [q1,q2,q3];
  }
  if(id==='05-00-01-06'){
    var q1=seqQ(),seqs=[],answers=[];
    for(var j=0;j<Math.min(5,n);j++){var st=W.ri(0,21),chunk=AZ.slice(st,st+5),mix=shuf(chunk.slice());seqs.push('<div class="row" style="margin-bottom:10px"><span style="font:700 24px Arial;min-width:160px">'+mix.join(' · ')+'</span><span style="font-size:20px">→</span>'+line('ABCDE')+'</div>');answers.push(chunk.join(''));}
    var q2={t:'섞여 있는 알파벳을 순서대로 다시 써 보세요.',b:seqs.join('')+'<div class="ansline">답: '+answers.join(', ')+'</div>'};
    var starts=shuf(AZ.slice(0,20)).slice(0,Math.min(5,n)),q3={t:'첫 글자부터 이어지는 알파벳 5개를 써 보세요.',b:starts.map(function(ch){var st=AZ.indexOf(ch),ans=AZ.slice(st,st+5).join(' ');return '<div style="font:700 26px Arial;margin:9px 0">'+ch+' '+line('A B C D')+'<span class="ansline"> '+ans+'</span></div>';}).join('')};
    return [q1,q2,q3];
  }
  return null;
};})();