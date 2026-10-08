// 바둑 수업 검사: 모든 문제에 정답이 있고, 판이 올바르고, 장면 연출이 규칙에 맞는지 확인해요: node scripts/go-lessons-test.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playground', 'go');
const Go = require(path.join(dir, 'engine.js'));
const solvedFile = path.join(dir, 'lessons-solved.js');
if (fs.existsSync(solvedFile)) vm.runInThisContext(fs.readFileSync(solvedFile, 'utf8').replace('window.', 'globalThis.'));
const L = require(path.join(dir, 'lessons.js'));
for (const f of fs.readdirSync(dir).filter((x) => /^lessons-(l\d|eval|prac|replay)\.js$/.test(x)).sort()) require(path.join(dir, f));
let pass = 0; const ok = (m) => { pass++; console.log('PASS', m); };
const ids = new Set(); let items = 0, pages = 0;
for (const lesson of L.LESSONS) {
  assert.ok(!ids.has(lesson.id), '중복 id ' + lesson.id); ids.add(lesson.id);
  assert.ok(lesson.lv >= 1 && lesson.lv <= 4, lesson.id + ' 단계');
  assert.ok(lesson.pages.length > 0, lesson.id + ' 장면 없음');
  lesson.pages.forEach((pg, i) => {
    const P = L.preparePage(pg); pages++; assert.ok(pg.text && pg.text.length > 10, lesson.id + ' 장면 ' + i + ' 설명');
    assert.equal(P.game.n, P.n);
    const g = P.game.copy(); P.script.forEach((st, k) => { const rec = st.pass ? g.pass() : g.play(st.s % P.n, (st.s / P.n) | 0); assert.ok(rec, lesson.id + ' 장면 ' + i + ' 연출 ' + k + ' 둘 수 없는 수'); });
  });
  lesson.items.forEach((it, idx) => {
    items++; const where = lesson.id + ' 문제 ' + idx + ' (' + it.kind + ')';
    assert.ok(it.rows.every((r) => r.length === it.rows.length) && /^[.XO]+$/.test(it.rows.join('')), where + ' 판 모양');
    for (const seed of [11, 222, 3333]) {
      const P = L.prepare(it, { same: seed }); assert.ok(P.prompt, where + ' 질문');
      const n = P.n;
      if (P.mode === 'quiz') {
        const rights = P.options.map((o, i) => L.prepare(it, { same: seed }).answer(i)).filter((r) => r && r.ok);
        assert.equal(rights.length, 1, where + ' 정답 개수 ' + rights.length);
      } else if (it.kind === 'libs') {
        let last; for (let s = 0; s < n * n; s++) { const r = P.tap(s); if (r && r.ok) last = r; } assert.ok(last && last.done, where + ' 활로를 모두 누르면 끝나야 해요');
      } else if (it.kind === 'place') { let r; for (let s = 0, c = 0; c < it.count; s++) { if (P.game.get(s)) continue; r = P.tap(s); c++; } assert.ok(r && r.done, where); }
      else {
        let good = 0; for (let s = 0; s < n * n; s++) { const r = L.prepare(it, { same: seed }).tap(s); if (r && r.ok && r.done) good++; }
        assert.ok(good >= 1, where + ' 정답이 없어요(seed ' + seed + ')');
        if (it.kind === 'kill' || it.kind === 'live' || it.kind === 'capture') assert.ok(good <= n * n / 2, where + ' 정답이 너무 많아요');
      }
    }
  });
}
assert.ok(L.LESSONS.length >= 20, '수업 수 ' + L.LESSONS.length);
ok('수업 ' + L.LESSONS.length + '개 · 장면 ' + pages + '개 · 문제 ' + items + '개 모두 정상');
// 단계별 수업 수
const per = [0, 0, 0, 0]; L.LESSONS.forEach((l) => per[l.lv - 1]++); assert.ok(per.every((c) => c >= 3), '각 단계 수업 수 ' + per); ok('단계별 수업 수 ' + per.join('/'));
console.log(pass + ' PASS');
