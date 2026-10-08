import { createWorld, setRack, launch, step, moving, downPins, LANE } from '../playground/bowling/physics.js';
function roll(tx, sx, speed, noise) { const w = createWorld({}); setRack(w, null); launch(w, sx, tx, speed, noise); let n = 0; while (moving(w) && n < 240 * 12) { step(w, 1 / 240); n++; } return { w, down: downPins(w).length, n }; }
const res = {}; for (const tx of [-1.2, -0.6, -0.3, -0.1, 0, 0.1, 0.3, 0.6, 1.2]) { let s = 0, st = 0; const R = 40; for (let i = 0; i < R; i++) { const r = roll(tx + (Math.random() - .5) * 0.06, tx * 0.3, 7, 0); s += r.down; if (r.down === 10) st++; } res[tx] = [(s / R).toFixed(1), st + '/' + R]; }
console.log(res); const r = roll(0, 0, 7, 0); console.log('steps', r.n, 'down', r.down);
const ok = roll(0, 0, 7, 0).n < 240 * 10; console.log(ok ? 'PASS' : 'FAIL'); process.exit(ok ? 0 : 1);
