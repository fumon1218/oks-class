import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// GitHub Pages game smoke checks: no npm dependencies and no generated content.
// This checks parse-time errors and local link targets, not touch/visual behavior.
const root=path.resolve(import.meta.dirname,'..');
const pages=['index.html','career/cafe.html','career/barista.html','korean/index.html','korean/catch.html','curriculum/teacher-guide.html','minigames/index.html','quests/index.html'];
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
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const page of pages.slice(1)){assert(sw.includes("'./"+page+"'"),'Not precached: '+page);}
console.log('PASS '+parsed+' script parse checks, '+links+' static links/assets, curriculum registration & cache references');
