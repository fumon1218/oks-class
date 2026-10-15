/* 자동차 색칠 도안 만들기: 레이싱 게임을 ?tpl=1 로 열어 모든 차의 도안 PNG 와 상자 크기(cartpl.json)를 만들어요.
   사용: python3 -m http.server 8123 &  →  node scripts/build-car-templates.mjs */
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/home/claude/.npm-global/lib/node_modules/');
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:8123/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(base + 'playground/racing/index.html?tpl=1');
await page.waitForFunction(() => document.title === 'TPL-DONE', null, { timeout: 240000 });
const t = await page.evaluate(() => window.__TPL);
fs.mkdirSync('art/cartemplate/img', { recursive: true });
const boxes = {};
for (const [id, v] of Object.entries(t)) { fs.writeFileSync('art/cartemplate/img/' + id + '.png', Buffer.from(v.png.split(',')[1], 'base64')); boxes[id] = v.box; }
fs.writeFileSync('playground/racing/cartpl.json', JSON.stringify(boxes));
console.log('도안', Object.keys(t).length, '장');
await browser.close();
