import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// 정적 점검: 모든 화면의 스크립트 문법, 로컬 링크·그림 경로, 오프라인 캐시 목록, 교육과정 데이터.
// 의존성 없이 node만으로 실행합니다 (npm install 불필요).
const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'assets', 'node_modules']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(path.relative(root, p));
  }
  return out;
}
const files = walk(root);
let scripts = 0, links = 0;

for (const rel of files.filter(f => f.endsWith('.html'))) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const m of src.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    if (/type=["']application\/(?:ld\+)?json/.test(m[0])) continue;
    new vm.Script(m[1], { filename: rel }); scripts++;
  }
  const staticMarkup = src.replace(/<script[\s\S]*?<\/script>/gi, '');
  for (const [, dest] of staticMarkup.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (!dest || /^(?:https?:|data:|#|mailto:|javascript:)/.test(dest) || dest.includes('$')) continue;
    const abs = path.resolve(root, path.dirname(rel), dest.split(/[?#]/)[0]);
    assert(abs.startsWith(root), `경로가 저장소 밖으로 나감: ${rel} -> ${dest}`);
    assert(fs.existsSync(abs), `깨진 링크/그림: ${rel} -> ${dest}`);
    links++;
  }
  assert(!/fumon1218\.github\.io\/jungle-jump\/[^"' ]*\.(webp|png|jpe?g|gif|svg)/.test(src), `다른 저장소 그림을 직접 불러오면 오프라인에서 깨집니다: ${rel}`);
}
for (const rel of files.filter(f => f.endsWith('.js') && !f.startsWith('scripts/'))) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  new vm.Script(src, { filename: rel }); scripts++;
  assert(!/fumon1218\.github\.io\/jungle-jump\/[^"' ]*\.(webp|png|jpe?g|gif|svg)/.test(src), `다른 저장소 그림 직접 참조: ${rel}`);
}
console.log(`PASS 스크립트 ${scripts}개 문법, 로컬 링크 ${links}개`);

// 오프라인 캐시 목록의 파일이 모두 있어야 설치가 실패하지 않습니다.
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const listed = [...sw.matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(Boolean);
for (const p of listed) assert(fs.existsSync(path.join(root, p)), `sw.js 캐시 목록에 없는 파일: ${p}`);
console.log(`PASS 오프라인 캐시 목록 ${listed.length}개`);

// 교육과정 차시 데이터
const lessonsPath = path.join(root, 'curriculum/lessons.json');
if (fs.existsSync(lessonsPath)) {
  const data = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
  assert.equal(data.lessons.length, 126, '126차시가 있어야 합니다');
  const ids = new Set();
  for (const l of data.lessons) {
    assert(!ids.has(l.id), '중복 차시 ID ' + l.id); ids.add(l.id);
    assert.equal(l.levels.length, 5, '차시마다 5수준 ' + l.id);
  }
  console.log('PASS 교육과정 126차시 · 5수준');
}

// 차시 게임 내용표: 활동ID가 교육과정에 있고, 엔진이 있고, 쓰는 그림 파일이 모두 있어야 합니다.
const contentPath = path.join(root, 'play/content.js');
if (fs.existsSync(contentPath)) {
  const win = {};
  vm.runInNewContext(fs.readFileSync(contentPath, 'utf8'), { window: win });
  const c2 = path.join(root, 'play/content2.js'); if (fs.existsSync(c2)) vm.runInNewContext(fs.readFileSync(c2, 'utf8'), { window: win });
  const c3 = path.join(root, 'play/content-extra.js'); if (fs.existsSync(c3)) vm.runInNewContext(fs.readFileSync(c3, 'utf8'), { window: win });
  const engWin = { OKS: {}, OKS_ENGINES: {} };
  for (const f of ['engines.js', 'engines2.js', 'farm.js']) vm.runInNewContext(fs.readFileSync(path.join(root, 'play', f), 'utf8'), { window: engWin, document: {} });
  const data = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
  const ids = new Set(data.lessons.map(l => l.id));
  let imgs = 0;
  for (const [id, c] of Object.entries(win.OKS_CONTENT)) {
    assert(ids.has(id), '내용표의 활동ID가 교육과정에 없음: ' + id);
    for (const cfg of [c, ...Object.values(c.byLevel || {})]) if (cfg.engine) assert(engWin.OKS_ENGINES[cfg.engine], `엔진 없음 ${id}: ${cfg.engine}`);
    for (const m of JSON.stringify(c).matchAll(/"img":"([^"]+)"/g)) { assert(fs.existsSync(path.join(root, m[1])), `그림 없음 ${id}: ${m[1]}`); imgs++; }
  }
  console.log(`PASS 차시 게임 ${Object.keys(win.OKS_CONTENT).length}개 · 그림 ${imgs}곳`);
}

// 가게(타이쿤): 그림 경로와 연계 차시 확인
const shopsPath = path.join(root, 'shop/shops.js');
if (fs.existsSync(shopsPath)) {
  const src = fs.readFileSync(shopsPath, 'utf8');
  const J = 'art/jj/', F = 'games/farm/assets/';
  let n = 0;
  for (const m of src.matchAll(/(J|F) \+ '([^']+\.webp)'/g)) { const p = (m[1] === 'J' ? J : F) + m[2]; assert(fs.existsSync(path.join(root, p)), '가게 그림 없음: ' + p); n++; }
  for (const m of src.matchAll(/'img:([^']+)'/g)) assert(fs.existsSync(path.join(root, m[1])), '가게 배경 없음: ' + m[1]);
  const win = { OKS: { ROOT: '../' } };
  vm.runInNewContext(src, { window: win, OKS: win.OKS });
  const data = JSON.parse(fs.readFileSync(lessonsPath, 'utf8')); const ids = new Set(data.lessons.map(l => l.id));
  for (const [k, s] of Object.entries(win.OKS_SHOPS)) for (const l of s.lessons) assert(ids.has(l), `가게 ${k} 연계 차시 없음: ${l}`);
  console.log(`PASS 가게 ${Object.keys(win.OKS_SHOPS).length}곳 · 그림 ${n}곳`);
}
