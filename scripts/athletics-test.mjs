import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const window = { OKS: { el() {} } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'sports/athletics.js'), 'utf8'), { window });
const A = window.OKS_ATHLETICS;
assert.equal(Object.keys(A.courses).length, 3);
const known = new Set(['signal','run','order','gear','warmup','safety','reflect','goal','pace','hurdle','relay','cooldown']);
for (const school of ['elem','middle','high']) {
  for (let no = 1; no <= 3; no++) {
    const c = A.course(school,no);
    assert(c.goal && c.transfer && c.steps.length >= 3);
    assert(c.steps.every(x => known.has(x)), '등록되지 않은 활동');
  }
}
assert(A.course('middle',2).steps.includes('pace'), '속도 수업은 속도 조절 활동을 포함');
assert(A.course('middle',3).steps.includes('relay'), '이어달리기는 차례 전달을 포함');
assert.equal(A.course('high',3).steps.at(-1),'cooldown', '운동 계획은 마무리를 포함');
const step = A.newStep('signal',4);
A.recordAttempt(step,false); A.recordAttempt(step,true);
assert.equal(step.firstCorrect,false,'재시도로 첫 반응 기록이 바뀌면 안 됨');
assert.equal(step.attempts,2); assert.equal(step.errors,1);
const output=A.csv([{at:'2026-10-04',school:'elem',topic:'내 "기록"',level:2,input:'one-button',steps:[step]}]);
assert(output.includes('내 ""기록""')); assert(output.includes('미관찰')); assert(output.startsWith('\uFEFF'));
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const f of ['sports/athletics.js','sports/athletics.css'])assert(sw.includes("'./"+f+"'"),'오프라인 등록 누락');
console.log('PASS 육상 9차시 목표·전이, 첫 반응 기록, CSV, 오프라인 연결');
