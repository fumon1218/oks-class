import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../playground/jegi/motion.js',import.meta.url),'utf8'),context);const Motion=context.JegiMotion;
function pose(){const p=Array.from({length:33},()=>({x:.5,y:.5,visibility:.99}));for(const [i,x,y] of [[11,.4,.2],[12,.6,.2],[23,.4,.45],[24,.6,.45],[25,.4,.65],[26,.6,.65],[27,.4,.85],[28,.6,.85]])p[i]={x,y,visibility:.99};return p;}
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
const invalid=pose();delete invalid[11].visibility;assert.equal(new Motion().read(invalid),null);
console.log('PASS 제기 동작: 보정·노이즈·중복·재인식·발 선택·앉은 자세');
const cropped=pose();cropped[27].y=cropped[28].y=1.1;const diagnosis=new Motion().inspect(cropped);assert.equal(diagnosis.valid,false);assert.equal(diagnosis.seen.feet,false);assert.equal(diagnosis.seen.shoulders,true);
const back=pose();back[11].x=.46;back[12].x=.54;const front=cropped;front[11].x=.25;front[12].x=.75;assert.equal(Motion.selectPose([back,front]),front,'뒷사람이 전신이어도 앞쪽 참여자 우선');assert.equal(Motion.selectPose([]),null);
console.log('PASS 전신 준비 진단·두 사람 중 앞쪽 참여자 선택');
