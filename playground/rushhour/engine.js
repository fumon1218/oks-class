/* 러시아워(주차장 탈출) 규칙과 풀이. 6×6 판, 차는 가로(h)나 세로(v)로만 앞뒤로 움직여요.
   cars[0]은 빨간 차(가로, 가운데 줄 y=2). 빨간 차가 맨 오른쪽(x=4)에 닿으면 출구로 나가요.
   한 번 움직이기 = 한 대를 몇 칸이든 한 방향으로 옮기는 것. */
export const SIZE = 6, EXIT_ROW = 2;
/* cars: [{x,y,len,dir}] — pos(차가 있는 줄을 따라가는 위치)만 바뀌어요 */
export const posOf = (c) => (c.dir === 'h' ? c.x : c.y);
export function cellsOf(c, p) { const o = []; for (let k = 0; k < c.len; k++) o.push(c.dir === 'h' ? [p + k, c.y] : [c.x, p + k]); return o; }
export function grid(cars, pos) { const g = new Int8Array(SIZE * SIZE).fill(-1); cars.forEach((c, i) => cellsOf(c, pos[i]).forEach(([x, y]) => { g[y * SIZE + x] = i; })); return g; }
export function validLayout(cars) { const g = new Int8Array(SIZE * SIZE).fill(-1); for (let i = 0; i < cars.length; i++) { const c = cars[i]; const p = posOf(c); if (p < 0 || p + c.len > SIZE) return false; for (const [x, y] of cellsOf(c, p)) { if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || g[y * SIZE + x] >= 0) return false; g[y * SIZE + x] = i; } } return true; }
/* 한 대가 갈 수 있는 위치 범위 [lo, hi] */
export function range(cars, pos, i, g) {
  const c = cars[i], p = pos[i]; g = g || grid(cars, pos);
  let lo = p, hi = p; const at = (q) => (c.dir === 'h' ? g[c.y * SIZE + q] : g[q * SIZE + c.x]);
  while (lo > 0 && at(lo - 1) < 0) lo--;
  while (hi + c.len < SIZE && at(hi + c.len) < 0) hi++;
  return [lo, hi];
}
export const solved = (pos) => pos[0] >= SIZE - 2;
const key = (pos) => pos.join(',');
/* 모든 한 번 움직이기 */
export function moves(cars, pos) {
  const g = grid(cars, pos), out = [];
  for (let i = 0; i < cars.length; i++) { const [lo, hi] = range(cars, pos, i, g); for (let q = lo; q <= hi; q++) if (q !== pos[i]) out.push([i, q]); }
  return out;
}
export function apply(pos, m) { const n = pos.slice(); n[m[0]] = m[1]; return n; }
/* 지금 자리에서 출구까지 가장 적은 움직임의 경로 (없으면 null) */
export function solve(cars, pos0, limit) {
  const start = key(pos0), prev = new Map([[start, null]]); let q = [pos0], goal = null;
  if (solved(pos0)) return [];
  const cap = limit || 800000;
  while (q.length && !goal && prev.size < cap) {
    const nq = [];
    for (const pos of q) {
      const pk = key(pos);
      for (const m of moves(cars, pos)) {
        const np = apply(pos, m), nk = key(np); if (prev.has(nk)) continue;
        prev.set(nk, { from: pk, m }); if (solved(np)) { goal = nk; break; } nq.push(np);
      }
      if (goal) break;
    }
    q = nq;
  }
  if (!goal) return null;
  const path = []; let k = goal; while (prev.get(k)) { const e = prev.get(k); path.push(e.m); k = e.from; } return path.reverse();
}
/* 출구로 나간 뒤 완성 위치를 위한 마지막 한 칸(빨간 차 4→문 밖)은 화면에서 따로 보여 줘요 */
