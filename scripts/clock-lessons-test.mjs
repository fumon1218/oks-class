/* 시각과 시간 11차시 × 5수준을 실제 화면에서 끝까지 풀어 보는 점검
   사용: python3 -m http.server 8123 &  →  node scripts/clock-lessons-test.mjs [차시 일부] [수준] */
import { createRequire } from 'module';
const require = createRequire('/home/claude/.npm-global/lib/node_modules/');
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:8123/';
const only = process.argv[2], onlyLv = +process.argv[3] || 0;
const ids = []; for (const [u, n] of [[1, 5], [2, 3], [3, 3]]) for (let k = 1; k <= n; k++) ids.push('02-00-0' + u + '-' + String(k).padStart(2, '0'));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fail = 0, ok = 0;
for (const id of ids) {
  if (only && !id.includes(only)) continue;
  for (let lv = 1; lv <= 5; lv++) {
    if (onlyLv && lv !== onlyLv) continue;
    const page = await browser.newPage({ viewport: { width: 760, height: 560 } });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.addInitScript(() => { window.OKS_CLOCK_TEST = true; try { localStorage.setItem('oksaem-settings', JSON.stringify({ voice: false })); localStorage.setItem('oks_core_v1', JSON.stringify({ calm: true })); } catch (e) {} });
    await page.goto(base + 'play/?id=' + id + '&level=' + lv, { waitUntil: 'load' });
    let state = 'start';
    try {
      await page.waitForSelector('.oks-start button, .oks-start .oks-btn', { timeout: 8000 });
      await page.click('.oks-start button.oks-btn');
      let rounds = 0, guard = 0;
      while (guard++ < 400) {
        if (await page.$('.oks-finish')) { state = 'done'; break; }
        const act = await page.evaluate(() => {
          const c = window.OKS_CTX; const r = c && c.cur; if (!r) return 'wait';
          const B = [...document.querySelectorAll('.oks-board button')];
          if (r.mode === 'read' || r.mode === 'text' || r.mode === 'table') { const b = B.find((x) => x.classList.contains('ck-opt') && x.textContent.trim() === r.ans && !x.classList.contains('good')); if (b) { b.click(); return 'click ' + r.mode; } return 'wait'; }
          if (r.mode === 'hand') { const nm = { hour: '짧은바늘', minute: '긴바늘', second: '초침' }[r.hand]; const b = B.find((x) => x.classList.contains('ck-opt') && x.textContent.trim() === nm); if (b) { b.click(); return 'click hand'; } return 'wait'; }
          if (r.mode === 'order') { const items = [...document.querySelectorAll('.ck-item')].filter((x) => !x.classList.contains('good')); const want = document.querySelectorAll('.ck-item.good').length; const b = items.find((x) => x._o === want); if (b) { b.click(); return 'click order'; } return 'wait'; }
          if (r.mode === 'make') { const v = c._view; if (!v) return 'wait'; const now = v.getTime().t; if (!(((now / 60) | 0) % 12 === ((r.t / 60) | 0) % 12 && now % 60 === r.t % 60)) { v.setTime(r.t, 0); if (r.auto) { c._poke && c._poke(); return 'click make'; } } const g = document.querySelector('.ck-go'); if (g && g.style.display !== 'none') { g.click(); return 'click make'; } return 'wait'; }
          if (r.mode === 'timer') { const g = document.querySelector('.ck-go'); if (g && g.style.display !== 'none' && !g._clicked) { g._clicked = true; g.click(); return 'click timer'; } if (r.estimate) { const t0 = c._t0 = c._t0 || Date.now(); } return 'wait'; }
          return 'wait';
        });
        if (act === 'setauto') { await page.evaluate(() => { const v = window.OKS_CTX._view; const r = window.OKS_CTX.cur; v.onChange && 0; }); }
        rounds++;
        await page.waitForTimeout(act.startsWith('click') ? 350 : 150);
      }
      if (state !== 'done') throw new Error('끝나지 않음');
      const stats = await page.evaluate(() => ({ m: window.OKS_CTX.stats.mistakes }));
      if (errs.length) throw new Error('오류 ' + errs[0]);
      console.log('PASS', id, 'L' + lv, '실수', stats.m);
      ok++;
    } catch (e) { console.log('FAIL', id, 'L' + lv, e.message, errs.slice(0, 2).join(' | ')); fail++; try { await page.screenshot({ path: '/tmp/claude-0/clockfail-' + id + '-' + lv + '.png' }); } catch (x) {} }
    await page.close();
  }
}
await browser.close();
console.log(ok + ' PASS / ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
