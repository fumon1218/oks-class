import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../playground/jegi/motion.js',import.meta.url),'utf8'),context);const Motion=context.JegiMotion;
function pose(){const p=Array.from({length:33},()=>({x:.5,y:.5,visibility:.99}));for(const [i,x,y] of [[11,.4,.2],[12,.6,.2],[23,.4,.45],[24,.6,.45],[25,.4,.65],[26,.6,.65],[27,.4,.85],[28,.6,.85]])p[i]={x,y,visibility:.99};p[31].visibility=p[32].visibility=0;return p;}
let now=0;function frames(d,p,n){let kicks=[];for(let i=0;i<n;i++){now+=100;const r=d.update(p,now);if(r.kick)kicks.push(r.kick);}return kicks;}
function calibrated(options){const d=new Motion(options);for(let i=0;i<24;i++)d.calibrate(pose());assert(d.baseline);return d;}
const up=pose();up[27].y=.65;up[25].y=.54;
const d=calibrated();assert.equal(frames(d,pose(),4).length,0);assert.deepEqual(frames(d,up,15),['left'],'발을 계속 들고 있어도 1번만');assert.equal(frames(d,up,10).length,0);frames(d,pose(),6);assert.deepEqual(frames(d,up,8),['left'],'내렸다 다시 들면 1번');
const noise=pose();for(let i=0;i<30;i++){noise[27].y=.85+Math.sin(i)*.015;assert.equal(frames(d,noise,1).length,0,'작은 흔들림 무시');}
const missing=pose();missing[27].visibility=.1;assert.equal(d.update(missing,now+=100).valid,false);assert.equal(frames(d,up,8).length,0,'다리를 든 상태로 재등장해도 점수 없음');frames(d,pose(),7);assert.equal(frames(d,up,8).length,1);
const l=calibrated({foot:'left'}),right=pose();right[28].y=.62;frames(l,pose(),4);assert.equal(frames(l,right,8).length,0,'선택하지 않은 발 무시');assert.equal(frames(l,up,8).length,1);
const both=pose();both[27].y=both[28].y=.62;both[25].y=both[26].y=.54;const b=calibrated();frames(b,pose(),4);assert.equal(frames(b,both,20).length,1,'양발 동시 상승 중복 방지');
const c=new Motion();for(let i=0;i<20;i++)c.calibrate(pose());c.calibrate(missing);assert.equal(c.samples.length,0,'인식 끊김 시 준비 자세 다시 수집');
const s=calibrated({seated:true,sensitivity:.08});const knee=pose();knee[25].y=.59;frames(s,pose(),4);assert.equal(frames(s,knee,8).length,1,'작은 무릎 들기');
const invalid=pose();delete invalid[25].visibility;assert.equal(new Motion().read(invalid),null);
console.log('PASS 제기 동작: 보정·노이즈·중복·재인식·발 선택·앉은 자세');
const cropped=pose();cropped[27].y=cropped[28].y=1.1;const diagnosis=new Motion().inspect(cropped);assert.equal(diagnosis.valid,false);assert.equal(diagnosis.seen.feet,false);assert.equal(diagnosis.seen.knees,true);
const back=pose();back[11].x=.46;back[12].x=.54;const front=cropped;front[25].x=.25;front[26].x=.75;assert.equal(Motion.selectPose([back,front]),front,'뒷사람이 전신이어도 앞쪽 참여자 우선');assert.equal(Motion.selectPose([]),null);
console.log('PASS 다리 준비 진단·두 사람 중 앞쪽 참여자 선택');

const instant=new Motion();assert.equal(instant.start(missing),false);assert.equal(instant.start(pose()),true,'첫 유효 프레임으로 즉시 시작');assert.equal(instant.samples.length,0,'24프레임 자세 유지 불필요');assert.equal(frames(instant,pose(),4).length,0);assert.equal(frames(instant,up,10).length,1,'자동 시작 뒤 발 들기 점수');assert.equal(frames(instant,up,10).length,0,'같은 발 유지 중 중복 없음');
console.log('PASS 첫 인식 즉시 시작·동작 점수 분리');

const lower=pose();[11,12,23,24,31,32].forEach(i=>{lower[i]={x:.5,y:-1,visibility:0}});lower[27]={x:.4,y:.85,visibility:.99};lower[28]={x:.6,y:.85,visibility:.99};
const lowerMotion=new Motion();assert(lowerMotion.start(lower),'몸통·어깨·발끝 없이 무릎·발목으로 시작');frames(lowerMotion,lower,4);const lowerUp=structuredClone(lower);lowerUp[27].y=.68;lowerUp[25].y=.55;assert.equal(frames(lowerMotion,lowerUp,10).length,1,'다리만 보이는 화면에서 발 들기');assert.equal(frames(lowerMotion,lowerUp,10).length,0);frames(lowerMotion,lower,7);assert.equal(frames(lowerMotion,lowerUp,10).length,1,'내린 뒤 다시 들어 점수');
const oneSide=structuredClone(lower);oneSide[26].visibility=oneSide[28].visibility=0;assert(new Motion({foot:'left'}).start(oneSide),'선택한 한쪽 다리만으로 시작');assert.equal(new Motion({foot:'right'}).start(oneSide),false);
back[25].y=back[26].y=.75;assert.equal(Motion.selectPose([back,lower]),lower,'큰 하체만 보여도 작은 뒷사람보다 우선');
console.log('PASS 무릎·발목만 시작/점수/재준비·한쪽 다리·하체 참여자 선택');

const weak=pose();[25,26,27,28].forEach(i=>weak[i].visibility=.65);assert.equal(new Motion().start(weak),false,'낮은 신뢰도의 사물 추정 좌표 제외');
const absent=pose();absent[25].presence=.2;assert.equal(new Motion().start(absent),false,'신체 존재 신뢰도 낮으면 제외');
const tiny=pose();tiny[27].y=tiny[28].y=.67;assert.equal(new Motion().start(tiny),false,'사물의 작은 모서리 간격 제외');
const overlap=pose();overlap[26]=structuredClone(overlap[25]);overlap[28]=structuredClone(overlap[27]);assert.equal(new Motion().start(overlap),false,'같은 물건을 양쪽 다리로 추정한 좌표 제외');
const disconnected=pose();disconnected[31]={x:.9,y:.2,visibility:.99};assert.equal(new Motion().start(disconnected),true,'발끝 오인식 좌표는 시작 판정에 영향 없음');
const reversed=pose();reversed[27].y=.4;assert.equal(new Motion().start(reversed),false,'무릎 위의 사물을 발로 잡은 추정 제외');
const swapped=pose();swapped[27].visibility=.1;swapped[31]={x:.4,y:.72,visibility:.99};const swapMotion=new Motion();swapMotion.start(pose());frames(swapMotion,pose(),5);assert.equal(frames(swapMotion,swapped,12).length,0,'발목이 안 보이면 발끝으로 대체하지 않음');
const jumpMotion=new Motion();jumpMotion.start(pose());frames(jumpMotion,pose(),5);const far=pose();[25,26,27,28].forEach(i=>far[i].x+=.35);assert.equal(frames(jumpMotion,far,12).length,0,'추정 대상이 옆 물건으로 바뀌어도 점수 없음');frames(jumpMotion,pose(),7);assert.equal(frames(jumpMotion,up,10).length,1,'다시 발을 내려 정상 동작으로 복귀');
const spikeMotion=new Motion();spikeMotion.start(pose());frames(spikeMotion,pose(),5);assert.equal(frames(spikeMotion,up,1).length,0);assert.equal(frames(spikeMotion,pose(),8).length,0,'한 프레임의 튄 인식 제외');
console.log('PASS 오인식 방어: 신뢰도·존재·작은 사물·중복 다리·연결·역전·기준 전환·대상 이동·순간 튐');

const toeNoise=pose();const onlyAnkles=new Motion();onlyAnkles.start(toeNoise);frames(onlyAnkles,toeNoise,5);for(let i=0;i<20;i++){toeNoise[31]={x:(i%7)/7,y:(i%5)/5,visibility:.99};toeNoise[32]={x:(i%7)/7,y:(i%5)/5,visibility:.99};assert.equal(frames(onlyAnkles,toeNoise,1).length,0,'발끝 좌표가 튀어도 무시');}assert.equal(frames(onlyAnkles,up,10).length,1,'발끝 노이즈 뒤에도 발목 들기 정상');
const noAnkle=pose();noAnkle[27].visibility=0;noAnkle[31]={x:.4,y:.85,visibility:.99};assert.equal(new Motion({foot:'left'}).start(noAnkle),false,'발목 없이 발끝만 보이면 시작하지 않음');
console.log('PASS 무릎–발목 전용 판정: 발끝 좌표 무시·발끝 대체 제거');
