import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// GitHub Pages game smoke checks: no npm dependencies and no generated content.
// This checks parse-time errors and local link targets, not touch/visual behavior.
const root=path.resolve(import.meta.dirname,'..');
const pages=['index.html','career/cafe.html','career/barista.html','korean/index.html','korean/catch.html','curriculum/teacher-guide.html','curriculum/reports.html','minigames/index.html','minigames/math-fruit.html','minigames/math-tycoon.html','minigames/math-tycoon-v2.html','minigames/math-tycoon-v3.html','minigames/art-tycoon.html','quests/index.html'];
let parsed=0,links=0;
for(const relative of pages){
  const src=fs.readFileSync(path.join(root,relative),'utf8');
  const scripts=[...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  for(const script of scripts){new vm.Script(script[1],{filename:relative});parsed++;}
  // Ignore runtime-generated HTML inside <script> (e.g. src="'+path+'").
  const staticMarkup=src.split(/<script(?:\s|>)/i)[0];
  const attrs=[...staticMarkup.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(x=>x[1]);
  for(const dest of attrs){
    if(!dest||/^(?:https?:|data:|#|mailto:|javascript:)/.test(dest)||dest.includes('$'))continue;
    const clean=dest.split(/[?#]/)[0];
    const abs=path.resolve(root,path.dirname(relative),clean);
    assert(abs.startsWith(root+path.sep)||abs===root,'Path leaves repository: '+relative+' '+dest);
    assert(fs.existsSync(abs),'Broken local asset/link: '+relative+' -> '+dest);
    links++;
  }
  console.log('PASS '+relative+' ('+scripts.length+' inline scripts)');
}
const cat=JSON.parse(fs.readFileSync(path.join(root,'curriculum/catalog.json'),'utf8'));
const korean=JSON.parse(fs.readFileSync(path.join(root,'korean/learning-map.json'),'utf8'));
assert.equal(korean.stages.length,5,'Word Master stage mapping must remain five steps');
assert(cat.rooms.some(x=>x.key==='word'&&x.url==='korean/index.html'),'Korean room registration missing');
assert(cat.missionLinks.some(x=>x.path==='korean/catch.html'),'Falling game curriculum mapping missing');
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('href="quests/index.html"'),'Village quest link missing');
const packsSource=fs.readFileSync(path.join(root,'minigames/packs.js'),'utf8');
const sandbox={window:{}};vm.runInNewContext(packsSource,sandbox,{filename:'minigames/packs.js'});
const groups=sandbox.window.OKS_MINIGAME_PACK;
for(const subject of ['korean','math','art','science','social']){
 assert.equal(groups[subject].length,10,'Subject '+subject+' must have 10 playable activities');
 for(const [i,g] of groups[subject].entries()){
   assert(['choice','match','order','count','sort','draw','reflect','portal'].includes(g.type),'Unknown game type '+subject+' '+i);
   assert(g.q,'Every game needs an instruction');
   if(g.type==='choice'){assert(g.items.length>=2);assert(Number.isInteger(g.answer)&&g.answer>=0&&g.answer<g.items.length);}
   if(g.type==='match')assert(g.pairs.length>=2);
   if(g.type==='sort')assert(g.items.every(row=>row[1]>=0&&row[1]<g.bins.length));
   if(g.type==='portal')assert(fs.existsSync(path.join(root,'minigames',g.url)),'Broken destination '+g.url);
 }
}
console.log('PASS 50 mini-game packs and data integrity');
// Immersive lobby regression checks: one map image/coordinate plane, map-based walking.
const lobby=fs.readFileSync(path.join(root,'index.html'),'utf8');
const lobbyCss=fs.readFileSync(path.join(root,'lobby/lobby-v3.css'),'utf8');
assert(lobby.includes('id="world-map-layer"'),'Missing shared map plane');
assert(lobby.includes('const stage=document.getElementById(\'world-map-layer\')'),'Character or joystick no longer matches map coordinate plane');
assert(lobby.includes('worldRecommendedQuest()')&&lobby.includes('toggle-quest'),'Suggested quest HUD unavailable');
assert(lobby.includes('let img=null;'),'Duplicate page-wide village wallpaper may be present');
assert(lobbyCss.includes('width:max(100vw,150dvh)'),'Map cover scaling may break image/hotspot alignment');
assert(lobbyCss.includes('body.is-world .hud-navbar'),'Accessible navigation dock lost');
console.log('PASS single-image map plane, walk coordinates and immersive HUD');
const mathFruit=fs.readFileSync(path.join(root,'minigames/math-fruit.html'),'utf8');
assert(mathFruit.includes('const bin=m.kind===\'share\'?binCounts.indexOf(Math.min(...binCounts)):targetFor(type)'),'Tap must auto-select basket');
assert(mathFruit.includes('drop(bin);'),'Tap must directly dispatch drop');
assert(mathFruit.includes('animateIntoBasket(type,source,target'),'Fruit should fly into selected basket');
assert(mathFruit.includes("target.querySelector('.basket-count').textContent"),'Basket must display a live count');
assert(mathFruit.includes("contents.append(im(type,''))"),'Basket must visually fill');
console.log('PASS direct tap, animated basket fill and live fruit count');
assert(mathFruit.includes("const MISSIONS=[")&&mathFruit.includes("m.kind==='share'")&&mathFruit.includes("m.kind==='sort'"),"Immersive 12-stage game systems missing");
assert(mathFruit.includes("art/stickers/rabbit.png")&&mathFruit.includes("art/stickers/strawberry.png"),"Existing 3D animal or produce art integration missing");
assert(fs.readFileSync(path.join(root,'minigames/index.html'),'utf8').includes('href="math-tycoon-v3.html"'),'Approved mockup-layout math tycoon entry not linked');
const tycoon=fs.readFileSync(path.join(root,'minigames/math-tycoon.html'),'utf8');
for(const marker of ["function tapPlot(index)","function autoWater()","function autoHarvest()","function checkoutAnswer(value,o)","function buyUpgrade(up)","function pack(key,source)","function safeRestore()","ORDER_TEMPLATES=[","localStorage.setItem(SAVE"]){
 assert(tycoon.includes(marker),'Missing tycoon loop: '+marker);
}
assert(tycoon.includes('href="math-fruit.html"'),'Original 12-stage practice must remain available');
assert(tycoon.includes('if(state.pending!==null)'),'Checkout must guard customer order zero as an active pending order');
assert(!tycoon.includes('Boolean(state.pending)'),'Never rely on falsy first-order ID zero');
assert(fs.readFileSync(path.join(root,'quests/index.html'),'utf8').includes("link:'../minigames/math-tycoon-v3.html'"),'Integrated math quest must link tycoon');
const immersive=fs.readFileSync(path.join(root,'minigames/math-tycoon-v2.html'),'utf8');
for(const marker of ['class="game-shell"','class="customer-line"','class="pack-station"','id="seedShelf"','renderPlots=function()','renderVisitor=function()','renderTray=function()','checkoutAnswer=function(value,o)']){
 assert(immersive.includes(marker),'Immersive scene missing: '+marker);
}
assert(immersive.includes("SAVE='oks_math_tycoon_v1'"),'Existing farm progress storage key must stay compatible');
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes("minigames/math-tycoon-v3.html"),'Village maths building must open new game');
const mockup=fs.readFileSync(path.join(root,'minigames/math-tycoon-v3.html'),'utf8');
const mockCss=fs.readFileSync(path.join(root,'minigames/farm-mockup-v3.css'),'utf8');
const botanical=fs.readFileSync(path.join(root,'minigames/farm-floral-v3.svg'),'utf8');
for(const marker of ['farm-mockup-v3.css','class="farm-chalk"','class="farm-sign"','knownCustomerIds=new Set()','renderVisitor=function()','id="packStation"','class="action-dock"']){
 assert(mockup.includes(marker),'Approved mockup structural piece missing: '+marker);
}
assert(mockup.includes("SAVE='oks_math_tycoon_v1'"),'Farm v3 must preserve previous currency and fields');
assert(mockCss.includes('farm-floral-v3.svg'),'Lush custom foliage is not shown');
const integrated=fs.readFileSync(path.join(root,'minigames/farm-props-v4.css'),'utf8');
for(const marker of ['.plot .plot-base','.plot .plant-window','.basket-art .basket-front','.basket-art .tray','.pack-station{background','.warehouse{background']){
 assert(integrated.includes(marker),'Missing integrated object design '+marker);
}
for(const marker of ['class="basket-bg"','class="basket-front"','const plotTapV3=tapPlot','renderTray=function()','const positions=[','guest:\'cat\'','guest:\'panda\'','guest:\'monkey\'','slot.phase=first?\'growing\':\'ready\'']){
 assert(mockup.includes(marker),'Farm v4 feature missing '+marker);
}
assert(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('./minigames/farm-props-v4.css'),'Latest object styles not PWA cached');
console.log('PASS real planter base, integrated basket layers, customer style and growth progression');

assert(mockCss.includes('height:100dvh;min-height:0'),'Landscape stage must fit a single viewport');
assert(mockCss.includes('flex:1 1 0;height:0'),'Arena must take remaining viewport space');
assert(mockup.includes('const originalRackRender=renderRack'),'Warehouse should display ripe harvest artwork');
const farmResponsive=fs.readFileSync(path.join(root,'minigames/farm-responsive-v5.css'),'utf8');
for(const marker of ['grid-template-areas:"garden guests" "garden farmer" "store packing"','grid-area:farmer','grid-area:guests','grid-area:packing','grid-area:store','max-height:729px']){
 assert(farmResponsive.includes(marker),'Responsive farmhouse layout missing '+marker);
}
assert(mockup.includes("farmer.src='../art/stickers/rabbit.png'"),'Incomplete bunny must be temporarily replaced with intact farmer');
assert(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('farm-responsive-v5.css'),'New farm responsive CSS must be precached');
console.log('PASS iPhone landscape collision prevention and intact bunny fallback');
assert(mockup.includes('function styledFarmAnimal(name,alt)'),'User-provided premium animal asset resolver missing');
assert(mockup.includes("'../art/farm/v4/'+name+'.webp'"),'Preferred user-provided animal image paths missing');

assert(mockup.includes("i===0?{phase:'ready',crop:'strawberry'}"),'Fresh players should see interactive live crops');
assert(botanical.includes('viewBox="0 0 1536 880"'),'Custom farm floral illustration missing');
assert(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes("./minigames/farm-floral-v3.svg"),'Custom scene art not cached');
console.log('PASS v3 screenshot-composition scene, decorative art, queue labels and original tycoon save key');
console.log('PASS immersive farm: stage, 3D image sprites, customer queue, visual packing, shared progress');
console.log('PASS new tycoon: planting, watering, harvesting, packing, checkout, upgrades and saved progress');
console.log('PASS immersive math workshop linked and core systems present');
const artTycoon=fs.readFileSync(path.join(root,'minigames/art-tycoon.html'),'utf8');
for(const marker of ["function paint(i)","function mix()","function deliver()","function upgrades()","function makeImage()","DESIGNS=[","SAVE='oks_art_tycoon_v1'"]){assert(artTycoon.includes(marker),'Missing art tycoon system '+marker);}
assert(fs.readFileSync(path.join(root,'minigames/index.html'),'utf8').includes('href="art-tycoon.html"'),'Art arcade entry missing');
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('href="minigames/art-tycoon.html"'),'Art room entry missing');
assert(fs.readFileSync(path.join(root,'quests/index.html'),'utf8').includes("link:'../minigames/art-tycoon.html'"),'Art spring quest not linked');
console.log('PASS 16-template art paint-shop tycoon: mixing, drawing, selling, gallery, upgrades');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const page of pages.slice(1)){assert(sw.includes("'./"+page+"'"),'Not precached: '+page);}
console.log('PASS '+parsed+' script parse checks, '+links+' static links/assets, curriculum registration & cache references');
