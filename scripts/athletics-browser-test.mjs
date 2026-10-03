// 선택 실행: Playwright가 있는 환경에서 node scripts/athletics-browser-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright') : 'playwright');
const root=path.resolve(import.meta.dirname,'..'), errors=[];
const server=http.createServer((req,res)=>{
  let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  if(!fs.existsSync(p)){res.writeHead(404);return res.end();}
  const ext=path.extname(p),types={'.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.html':'text/html'};
  res.setHeader('Content-Type',types[ext]||'application/octet-stream');fs.createReadStream(p).pipe(res);
}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try {
  browser=await chromium.launch({headless:true,executablePath:process.env.ATHLETICS_BROWSER_EXECUTABLE||undefined,args:process.env.ATHLETICS_BROWSER_EXECUTABLE?['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-software-rasterizer']:[]});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    localStorage.setItem('oksaem-settings',JSON.stringify({voice:false,sound:false}));
    localStorage.setItem('oks_core_v1',JSON.stringify({calm:!location.search.includes('motionTest=1'),scan:location.search.includes('scanTest=1')}));
  });
  await page.clock.install();
  let tested=0;
  async function open(school,lesson,level){
    await page.goto(base+'/sports/?festival=summer&sport=athletics&school='+school+'&lesson='+lesson+'&level='+level+'&play=1');
  }
  async function play(school,lesson,level,alternate=false){
    await open(school,lesson,level);
    if(level>=3)await page.getByRole('button',{name:'타이밍 도전',exact:true}).click({force:true});
    if(alternate)await page.getByRole('button',{name:'왼발·오른발 번갈아',exact:true}).click({force:true});
    await page.getByRole('button',{name:'육상 모험 시작',exact:true}).click({force:true});
    let nextFoot=0;
    for(let i=0;i<160;i++){
      if(await page.locator('.oks-finish h2').filter({hasText:'끝까지 참여했어요!'}).count())break;
      await page.clock.runFor(1000);
      if(await page.locator('.oks-finish h2').filter({hasText:'끝까지 참여했어요!'}).count())break;
      const acted=await page.evaluate(foot=>{
        const board=document.querySelector('.al-board');if(!board)return false;
        const kind=board.querySelector('.al-mission>b')?.textContent;
        const enabled=b=>b&&!b.disabled&&!b.hidden&&!b._done&&b.getBoundingClientRect().width>0;
        if(kind==='순서 기억하기'){
          const cards=[...board.querySelectorAll('.oks-card')];for(const label of ['출발 준비','달리기','도착']){const c=cards.find(c=>c._item?.label===label);if(enabled(c)){c.click();return true;}}
        }
        const cards=[...board.querySelectorAll('.oks-card')].filter(enabled);
        if(cards.length){(cards.find(c=>c._item?.correct)||cards[0]).click();return true;}
        const btns=[...board.querySelectorAll('.al-controls button')].filter(enabled);
        const priority=['응원 부스트!','경기 출발','다음 미션','점프!','바통 전달','다시 앞으로','멈춰요','친구에게 바통 전달','해 봤어요 · 다음 동작','출발!','장애물 넘기','한 걸음 앞으로'];
        for(const t of priority){const b=btns.find(b=>b.textContent===t);if(b){b.click();return true;}}
        const side=btns.find(b=>b.textContent===(foot%2?'오른발':'왼발'));if(side){side.click();return true;}
        if(btns[0]&&btns[0].textContent!=='신호를 기다려요'){btns[0].click();return true;}return false;
      },nextFoot);
      if(acted)nextFoot++;
    }
    assert(await page.locator('.oks-finish h2').filter({hasText:'끝까지 참여했어요!'}).count(),'미완료 '+school+'/'+lesson+'/'+level);
    const r=await page.evaluate(()=>JSON.parse(localStorage.getItem('oks_athletics_sessions_v2')).at(-1));
    assert.equal(r.steps.length,await page.evaluate(({school,lesson})=>OKS_ATHLETICS.course(school,lesson).steps.length,{school,lesson}));
    assert(r.steps.every(s=>s.completed&&Number.isFinite(s.attempts)&&Number.isFinite(s.seconds)));
    assert.equal(r.input,alternate?'alternate':'one-button');
    const races=r.steps.filter(s=>s.race).map(s=>s.race);
    assert(races.every(x=>x.distance===100&&x.taps>0),'실제 조작 후 경기 완주');
    if(level<=2){assert(races.some(x=>x.boosts>0),'응원 부스트 실제 사용');assert(races.filter(x=>x.kind==='hurdle').every(x=>x.cleared===3));assert(races.filter(x=>x.kind==='relay').every(x=>x.baton));}
    assert(races.every(x=>x.mode===(level<=2?'assist':'timing')),'지원과 타이밍 모드 적용');
    assert.equal(r.steps.filter(s=>s.kind==='signal').length,r.steps.filter(s=>Number.isFinite(s.reactionMs)).length);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('oks_learning_log_v1')).at(-1).topic),r.topic);
    tested++;
  }
  if(!process.env.ATHLETICS_CONTROLS_ONLY)for(const school of ['elem','middle','high'])for(let lesson=1;lesson<=3;lesson++)for(const level of (process.env.ATHLETICS_TEST_LEVELS||'1,2,3,4,5').split(',').map(Number))await play(school,lesson,level);
  await play('middle',2,4,true);
  await play('middle',3,4,true);
  // 쉬기 전의 신호 타이머가 다음 미션을 진행하지 않는지 확인합니다.
  await open('elem',1,4);await page.getByRole('button',{name:'큰 버튼 하나로',exact:true}).click({force:true});await page.getByRole('button',{name:'육상 모험 시작',exact:true}).click({force:true});
  await page.getByRole('button',{name:'쉬기',exact:true}).click({force:true});await page.clock.runFor(5000);
  assert.equal(await page.locator('.al-pause').count(),1);
  await page.getByRole('button',{name:'이어서 하기',exact:true}).click({force:true});
  assert.equal(await page.locator('.al-status').textContent(),'준비 · 기다려요');
  await page.clock.runFor(2500);await page.getByRole('button',{name:'출발!',exact:true}).click({force:true});await page.clock.runFor(1500);
  assert.equal(await page.locator('.al-mission>b').textContent(),'결승선까지');
  assert.equal(await page.locator('.al-mission>span').textContent(),'미션 2 / 3');
  // 반응이 빨라도 완료는 한 번만 기록합니다.
  await page.evaluate(()=>{const b=document.querySelector('.al-controls button');for(let i=0;i<30;i++)b.click();});await page.clock.runFor(1000);
  assert.equal(await page.locator('.al-mission>b').textContent(),'결승선까지');
  assert.equal(await page.locator('.ar-game').count(),1);
  assert((await page.locator('.ar-game').getAttribute('data-distance'))<20,'연타로 경기 건너뛰기 방지');
  // 태블릿과 좁은 화면의 수평 넘침·게임 이미지 로딩.
  for(const viewport of [{width:768,height:1024},{width:390,height:844}]){
    await page.setViewportSize(viewport);await open('middle',2,3);await page.getByRole('button',{name:'육상 모험 시작',exact:true}).click({force:true});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'수평 넘침');
    await page.waitForFunction(()=>[...document.querySelectorAll('.al-board img')].every(i=>i.complete&&i.naturalWidth>0));
    if(process.env.ATHLETICS_SCREENSHOT_DIR){fs.mkdirSync(process.env.ATHLETICS_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ATHLETICS_SCREENSHOT_DIR,'athletics-'+viewport.width+'.png'),fullPage:true});}
    await page.locator('.oks-card').first().click({force:true});await page.clock.runFor(3500);
    assert.equal(await page.locator('.al-lights .green.on').count(),1,'출발 신호등');
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.al-lights .green.on')).backgroundColor==='rgb(34, 189, 112)');
    if(process.env.ATHLETICS_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.ATHLETICS_SCREENSHOT_DIR,'athletics-track-'+viewport.width+'.png'),fullPage:true});
  }
  // 경기 화면도 태블릿과 휴대폰에서 잘리고 넘치지 않습니다.
  for(const viewport of [{width:1024,height:768},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.goto(base+'/sports/?festival=summer&sport=athletics&school=elem&lesson=1&level=3&play=1&motionTest=1');
    await page.getByRole('button',{name:'타이밍 도전',exact:true}).click({force:true});
    await page.getByRole('button',{name:'육상 모험 시작',exact:true}).click({force:true});await page.clock.runFor(3000);
    await page.getByRole('button',{name:'출발!',exact:true}).click({force:true});await page.clock.runFor(1400);
    await page.getByRole('button',{name:'경기 출발',exact:true}).click({force:true});await page.clock.runFor(2000);
    await page.getByRole('button',{name:'리듬 맞춰 달리기',exact:true}).click({force:true});await page.clock.runFor(850);
    await page.waitForFunction(()=>[...document.querySelectorAll('.ar-game img')].every(i=>i.complete&&i.naturalWidth));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(process.env.ATHLETICS_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.ATHLETICS_SCREENSHOT_DIR,'stadium-'+viewport.width+'.png'),fullPage:true});
    await page.getByRole('button',{name:'쉬기',exact:true}).click({force:true});
    const before=await page.locator('.ar-game').getAttribute('data-distance');await page.clock.runFor(5000);
    assert.equal(await page.locator('.ar-game').getAttribute('data-distance'),before,'쉬는 동안 경기 정지');
    await page.getByRole('button',{name:'이어서 하기',exact:true}).click({force:true});
    assert.equal(await page.getByRole('button',{name:'경기 출발',exact:true}).count(),1,'동일 경기 재시작');
  }
  // 최초 온라인 설치 뒤 네트워크가 없어도 차시와 그림이 실행됩니다.
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.context().setOffline(true);
  await open('elem',1,2);await page.getByRole('button',{name:'육상 모험 시작',exact:true}).click({force:true});await page.clock.runFor(3000);
  assert(await page.evaluate(()=>[...document.querySelectorAll('.al-board img')].every(i=>i.complete&&i.naturalWidth>0)),'오프라인 그림 로딩');
  await page.getByRole('button',{name:'출발!',exact:true}).click({force:true});await page.clock.runFor(1200);
  assert.equal(await page.locator('.al-mission>b').textContent(),'결승선까지');
  await page.context().setOffline(false);
  // 스페이스 한 개로 스캔된 시작·출발 버튼을 고를 수 있습니다.
  await page.goto(base+'/sports/?festival=summer&sport=athletics&school=elem&lesson=1&level=4&play=1&scanTest=1');
  async function scanPress(label){
    for(let i=0;i<40;i++){
      await page.clock.runFor(1600);
      if(await page.locator('.scan-lit').filter({hasText:label}).count()){await page.keyboard.press('Space');return;}
    }
    throw new Error('스캔 대상 없음: '+label);
  }
  assert(await page.getByRole('button',{name:'왼발·오른발 번갈아',exact:true}).isDisabled());
  await scanPress('육상 모험 시작');await scanPress('출발!');await page.clock.runFor(1500);
  assert.equal(await page.locator('.al-mission>b').textContent(),'결승선까지');
  // 다른 종목에서도 도구 선택이 복수 정답을 오답으로 처리하지 않도록 확인.
  await page.setViewportSize({width:1280,height:800});await page.goto(base+'/sports/?festival=summer&sport=swimming&level=2&play=1');await page.getByRole('button',{name:'시작하기',exact:true}).click({force:true});
  assert.equal(await page.locator('.oks-card').count(),2);
  const labels=await page.locator('.oks-card').allTextContents();assert(labels.some(x=>/야구 글러브|기타/.test(x)));
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS 육상 '+tested+'개 차시·수준/조작 완료, 쉬기·중복 입력, 기록, 768/390px 화면, 오프라인·스캔 실행, 타 종목 선택');
} finally {if(browser)await browser.close();server.close();}
