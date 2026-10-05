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
const both=pose();both[27].y=both[28].y=.62;const b=calibrated();frames(b,pose(),4);assert.equal(frames(b,both,20).length,1,'양발 동시 상승 중복 방지');
const c=new Motion();for(let i=0;i<20;i++)c.calibrate(pose());c.calibrate(missing);assert.equal(c.samples.length,0,'인식 끊김 시 준비 자세 다시 수집');
const s=calibrated({seated:true,sensitivity:.08});const knee=pose();knee[25].y=.59;frames(s,pose(),4);assert.equal(frames(s,knee,8).length,1,'작은 무릎 들기');
const invalid=pose();delete invalid[25].visibility;assert.equal(new Motion().read(invalid),null);
console.log('PASS 제기 동작: 보정·노이즈·중복·재인식·발 선택·앉은 자세');
const cropped=pose();cropped[27].y=cropped[28].y=1.1;const diagnosis=new Motion().inspect(cropped);assert.equal(diagnosis.valid,false);assert.equal(diagnosis.seen.feet,false);assert.equal(diagnosis.seen.knees,true);
const back=pose();back[11].x=.46;back[12].x=.54;const front=cropped;front[11].x=.25;front[12].x=.75;assert.equal(Motion.selectPose([back,front]),front,'뒷사람이 전신이어도 앞쪽 참여자 우선');assert.equal(Motion.selectPose([]),null);
console.log('PASS 다리 준비 진단·두 사람 중 앞쪽 참여자 선택');

const instant=new Motion();assert.equal(instant.start(missing),false);assert.equal(instant.start(pose()),true,'첫 유효 프레임으로 즉시 시작');assert.equal(instant.samples.length,0,'24프레임 자세 유지 불필요');assert.equal(frames(instant,pose(),4).length,0);assert.equal(frames(instant,up,10).length,1,'자동 시작 뒤 발 들기 점수');assert.equal(frames(instant,up,10).length,0,'같은 발 유지 중 중복 없음');
console.log('PASS 첫 인식 즉시 시작·동작 점수 분리');

const lower=pose();[11,12,23,24,27,28].forEach(i=>{lower[i]={x:.5,y:-1,visibility:0}});lower[31]={x:.4,y:.85,visibility:.99};lower[32]={x:.6,y:.85,visibility:.99};
const lowerMotion=new Motion();assert(lowerMotion.start(lower),'몸통·어깨·발목 없이 무릎·발끝으로 시작');frames(lowerMotion,lower,4);const lowerUp=structuredClone(lower);lowerUp[31].y=.68;lowerUp[25].y=.55;assert.equal(frames(lowerMotion,lowerUp,10).length,1,'다리만 보이는 화면에서 발 들기');assert.equal(frames(lowerMotion,lowerUp,10).length,0);frames(lowerMotion,lower,7);assert.equal(frames(lowerMotion,lowerUp,10).length,1,'내린 뒤 다시 들어 점수');
const oneSide=structuredClone(lower);oneSide[26].visibility=oneSide[32].visibility=0;assert(new Motion({foot:'left'}).start(oneSide),'선택한 한쪽 다리만으로 시작');assert.equal(new Motion({foot:'right'}).start(oneSide),false);
back[25].y=back[26].y=.75;assert.equal(Motion.selectPose([back,lower]),lower,'큰 하체만 보여도 작은 뒷사람보다 우선');
console.log('PASS 무릎·발끝만 시작/점수/재준비·한쪽 다리·하체 참여자 선택');
