import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// GitHub Pages game smoke checks: no npm dependencies and no generated content.
// This checks parse-time errors and local link targets, not touch/visual behavior.
const root=path.resolve(import.meta.dirname,'..');
const pages=['index.html','career/cafe.html','korean/index.html','korean/catch.html','curriculum/teacher-guide.html'];
let parsed=0,links=0;
for(const relative of pages){
  const src=fs.readFileSync(path.join(root,relative),'utf8');
  const scripts=[...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  for(const script of scripts){new vm.Script(script[1],{filename:relative});parsed++;}
  const attrs=[...src.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(x=>x[1]);
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
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const page of pages.slice(1)){assert(sw.includes("'./"+page+"'"),'Not precached: '+page);}
console.log('PASS '+parsed+' script parse checks, '+links+' static links/assets, curriculum registration & cache references');
