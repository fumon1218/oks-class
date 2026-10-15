/* 시각과 시간 학습지(clk-1~11, 게임 차시 02-00-…)의 정답·구성을 화면에서 자동으로 검사
   사용: python3 -m http.server 8123 &  →  node scripts/clock-worksheet-test.mjs [seed 수] */
import { createRequire } from 'module';
const require = createRequire('/home/claude/.npm-global/lib/node_modules/');
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:8123/';
const SEEDS = +process.argv[2] || 3;
const ids = []; for (let i = 1; i <= 11; i++) ids.push('clk-' + i);
for (const [u, n] of [[1, 5], [2, 3], [3, 3]]) for (let k = 1; k <= n; k++) ids.push('02-00-0' + u + '-0' + k);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
let bad = 0, n = 0;
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
for (const id of ids) for (let lv = 1; lv <= 5; lv++) for (let sd = 1; sd <= SEEDS; sd++) {
  n++;
  errs.length = 0;
  await page.goto(`${base}worksheet/?id=${id}&level=${lv}&seed=${sd * 7919 + lv}`, { waitUntil: 'load' });
  await page.evaluate(() => { const w = document.getElementById('withAns'); if (!w.checked) { w.checked = true; w.onchange(); } });
  const res = await page.evaluate(() => {
    const out = [];
    const T = document.body.innerText;
    if (/undefined|NaN|\[object/.test(T)) out.push('글에 undefined/NaN');
    const pages = [...document.querySelectorAll('.page')];
    if (pages.length < 2) out.push('쪽 수 ' + pages.length);
    pages.forEach((pg, pi) => {
      const inn = pg.querySelector('.inner'); const m = /scale\(([\d.]+)\)/.exec(inn.style.transform || ''); if (m && +m[1] < 0.78) out.push('쪽' + (pi + 1) + ' 너무 작게 줄어듦 ' + m[1]);
      pg.querySelectorAll('.q').forEach((q, qi) => {
        const title = q.querySelector('.qh span:not(.no):not(.pt):not(.adv)')?.textContent || '';
        if (pg.classList.contains('ans')) {
          const free = /사람마다|우리 반 시간표|직접 써 보세요|박수/.test(title + q.textContent);
          const has = [...q.querySelectorAll('.box[data-a]')].some((b) => b.dataset.a !== '') || q.querySelector('.circ') || q.querySelector('.ansonly') || q.querySelector('.ansline');
          if (!has && !free) out.push('쪽' + (pi + 1) + ' ' + (qi + 1) + '번 정답 없음: ' + title.slice(0, 30));
        }
        q.querySelectorAll('.choices').forEach((ch) => {
          const sp = [...ch.querySelectorAll('span')]; const tx = sp.map((s) => s.textContent.trim());
          if (new Set(tx).size !== tx.length) out.push('보기 겹침 ' + tx.join('/'));
          const k = sp.filter((s) => s.classList.contains('circ')).length; if (k !== 1) out.push('정답 표시 ' + k + '개 ' + tx.join('/'));
        });
        /* 시계 읽기: 그림의 시각과 쓴 답이 맞는지 */
        q.querySelectorAll('svg[data-t]').forEach((svg) => {
          const [h, m] = svg.dataset.t.split(':').map(Number); const par = svg.parentElement;
          const boxes = [...par.querySelectorAll('.box[data-a]')].map((b) => b.dataset.a);
          const circ = par.querySelector('.circ'); const hh = h % 12 || 12;
          if (/몇 시인지/.test(title) && boxes.length && +boxes[0] !== hh) out.push('몇 시 답 틀림 ' + svg.dataset.t + ' → ' + boxes[0]);
          if (/몇 시인지/.test(title) && circ && circ.textContent.trim() !== hh + '시') out.push('몇 시 ○ 틀림 ' + svg.dataset.t + ' → ' + circ.textContent);
          if (/몇 시 몇 분인지/.test(title) && boxes.length >= 2 && (+boxes[0] !== hh || +boxes[1] !== m)) out.push('몇 시 몇 분 틀림 ' + svg.dataset.t + ' → ' + boxes.join(','));
          if (/알맞은 시각을/.test(title)) { const want = hh + '시' + (m ? ' ' + m + '분' : ''); if (boxes.length >= 2 && (+boxes[0] !== hh || +boxes[1] !== m)) out.push('몇 시 30분 틀림 ' + svg.dataset.t + ' → ' + boxes.join(',')); if (circ && circ.textContent.trim() !== want) out.push('몇 시 30분 ○ 틀림 ' + svg.dataset.t + ' → ' + circ.textContent); }
          if (/알맞은 수를 써 보세요/.test(title) && boxes.length === 4) { if (+boxes[0] !== hh || +boxes[1] !== m || +boxes[2] !== hh % 12 + 1 || +boxes[3] !== 60 - m) out.push('몇 분 전 틀림 ' + svg.dataset.t + ' → ' + boxes.join(',')); }
          if (/다음 시각이 되려면/.test(title) && boxes.length === 1 && +boxes[0] !== 60 - m) out.push('남은 분 틀림 ' + svg.dataset.t + ' → ' + boxes[0]);
        });
      });
    });
    return out;
  });
  const all = res.concat(errs.map((e) => '오류 ' + e));
  if (all.length) { bad++; console.log('FAIL', id, 'L' + lv, 'seed' + sd, all.slice(0, 4).join(' | ')); }
}
await browser.close();
console.log(n + '장 검사 · 문제 ' + bad + '장');
process.exit(bad ? 1 : 0);
