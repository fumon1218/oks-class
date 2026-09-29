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
  assert(!/fumon1218\.github\.io\/jungle-jump/.test(src), `다른 저장소 그림을 직접 불러오면 오프라인에서 깨집니다: ${rel}`);
}
for (const rel of files.filter(f => f.endsWith('.js') && !f.startsWith('scripts/'))) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  new vm.Script(src, { filename: rel }); scripts++;
  assert(!/fumon1218\.github\.io\/jungle-jump/.test(src), `다른 저장소 그림 직접 참조: ${rel}`);
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
