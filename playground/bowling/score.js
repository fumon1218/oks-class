/* 볼링 점수 계산 (프레임 수 N: 5 또는 10). 굴린 핀 수의 목록(rolls)만으로 모두 계산해요. */
export function parseFrames(rolls, N) {
  const fr = []; let i = 0;
  for (let f = 0; f < N; f++) {
    if (f < N - 1) {
      if (i >= rolls.length) break;
      if (rolls[i] === 10) { fr.push({ r: [10], done: true, mark: 'X' }); i++; }
      else if (i + 1 >= rolls.length) { fr.push({ r: [rolls[i]], done: false }); i++; break; }
      else { fr.push({ r: [rolls[i], rolls[i + 1]], done: true, mark: rolls[i] + rolls[i + 1] === 10 ? '/' : '' }); i += 2; }
    } else {
      const r = rolls.slice(i, i + 3); let done = false;
      if (r.length >= 2) done = (r[0] === 10 || r[0] + r[1] === 10) ? r.length >= 3 : true;
      fr.push({ r, done, last: true });
    }
  }
  return fr;
}
/* 프레임마다 누적 점수(아직 모르면 null) */
export function score(rolls, N) {
  const fr = parseFrames(rolls, N); let i = 0, cum = 0; const out = [];
  for (let f = 0; f < N; f++) {
    const F = fr[f]; if (!F) { out.push({ r: [], cum: null }); continue; }
    let s = null;
    if (f < N - 1) {
      if (F.done) {
        if (F.mark === 'X') { if (i + 2 < rolls.length) s = 10 + rolls[i + 1] + rolls[i + 2]; i += 1; }
        else { if (F.mark === '/') { if (i + 2 < rolls.length) s = 10 + rolls[i + 2]; } else s = F.r[0] + F.r[1]; i += 2; }
      } else i += F.r.length;
    } else if (F.done) s = F.r.reduce((a, b) => a + b, 0);
    if (s == null) { cum = null; out.push({ r: F.r, cum: null, mark: F.mark }); } else { if (cum !== null) { cum += s; out.push({ r: F.r, cum, mark: F.mark }); } else out.push({ r: F.r, cum: null, mark: F.mark }); }
  }
  // cum이 한번 null이면 이후도 null 이어야 하지만, 위에서 cum=null 이후엔 계속 null로 처리돼요
  return out;
}
export function total(rolls, N) { const s = score(rolls, N); let t = 0; for (const f of s) if (f.cum != null) t = f.cum; return t; }
/* 다음 공을 굴리기 전 서 있는 핀 수 (10이면 새로 세워요) */
export function standing(rolls, N) {
  let st = 10, f = 0, b = 0;
  for (const x of rolls) {
    st -= x; b++;
    if (f < N - 1) { if (st === 0 || b === 2) { f++; b = 0; st = 10; } }
    else if (st === 0) st = 10;
  }
  return st;
}
export function isDone(rolls, N) { const fr = parseFrames(rolls, N); return fr.length === N && fr[N - 1].done; }
/* 지금 몇 번째 프레임, 몇 번째 공인지 */
export function where(rolls, N) {
  let f = 0, b = 0;
  for (const x of rolls) {
    b++;
    if (f < N - 1) { const first = b === 1; if ((first && x === 10) || b === 2) { f++; b = 0; } }
  }
  return { frame: Math.min(f, N - 1), ball: b + 1 };
}
export function markText(F, f, N) {
  const r = F.r, d = (x) => (x === 0 ? '-' : String(x));
  if (f < N - 1) { if (r.length === 1 && r[0] === 10) return ['', 'X']; const o = []; if (r.length >= 1) o.push(d(r[0])); if (r.length >= 2) o.push(r[0] + r[1] === 10 ? '/' : d(r[1])); return o; }
  const o = [];
  if (r.length >= 1) o.push(r[0] === 10 ? 'X' : d(r[0]));
  if (r.length >= 2) o.push(r[0] === 10 ? (r[1] === 10 ? 'X' : d(r[1])) : (r[0] + r[1] === 10 ? '/' : d(r[1])));
  if (r.length >= 3) o.push(r[2] === 10 ? 'X' : (r[0] === 10 && r[1] < 10 && r[1] + r[2] === 10) ? '/' : d(r[2]));
  return o;
}
