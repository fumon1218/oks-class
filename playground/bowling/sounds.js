/* 볼링 소리. 기본은 합성(Web Audio)이고, assets/sfx/sfx.json 에 파일을 적으면 진짜 녹음으로 바꿔 써요. */
const O = window.OKS;
let files = {}, bufs = {}, loaded = false, roll = null, lastClack = 0, noiseBuf = null, quietUntil = 0;
const on = () => { try { return O.settings().sound !== false; } catch (e) { return true; } };
const ctx = () => { try { return O.unlock(); } catch (e) { return null; } };
export async function init() { try { const r = await fetch('assets/sfx/sfx.json'); if (r.ok) { const m = await r.json(); for (const k in m) if (k[0] !== '_' && m[k]) files[k] = m[k]; } } catch (e) {} }
async function loadBufs() {
  if (loaded) return; loaded = true; const c = ctx(); if (!c) return;
  for (const k in files) { try { const r = await fetch('assets/sfx/' + files[k]); bufs[k] = await c.decodeAudioData(await r.arrayBuffer()); } catch (e) {} }
}
function getNoise(c) { if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf; const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; return (noiseBuf = b); }
function play(name, vol, rate) {
  const c = ctx(); if (!c || !bufs[name]) return false;
  const s = c.createBufferSource(), g = c.createGain(); s.buffer = bufs[name]; s.playbackRate.value = rate || 1; g.gain.value = vol; s.connect(g); g.connect(c.destination); s.start(); return true;
}
function burst(c, t, dur, vol, hp, lp) {
  const s = c.createBufferSource(); s.buffer = getNoise(c); const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp;
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(f2); f2.connect(g); g.connect(c.destination); s.start(t, Math.random()); s.stop(t + dur + 0.02);
}
function ping(c, t, f0, f1, dur, vol, type) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
export function prime() { if (on()) { ctx(); loadBufs(); } }
/* 공이 핀을 때림 */
export function hit(v) {
  if (!on()) return; const c = ctx(); if (!c) return; const vol = Math.min(1, 0.35 + v * 0.12);
  if (bufs.strike) { if (c.currentTime < quietUntil) return; quietUntil = c.currentTime + 1.2; play('strike', Math.min(1, 0.55 + v * 0.1), 1); return; }
  if (play('hit', vol, 0.95 + Math.random() * 0.1)) return;
  const t = c.currentTime; ping(c, t, 220, 70, 0.25, 0.5 * vol, 'sine'); burst(c, t, 0.12, 0.45 * vol, 600, 3500); ping(c, t, 1400 + Math.random() * 300, 900, 0.07, 0.18 * vol, 'triangle');
}
/* 핀끼리·핀과 벽 부딪힘 (너무 자주 울리지 않게 줄여요) */
export function clack(v) {
  if (!on()) return; const c = ctx(); if (!c) return; const now = c.currentTime; if (now - lastClack < 0.022 || now < quietUntil) return; lastClack = now;
  const vol = Math.min(0.9, 0.18 + v * 0.14);
  if (play('clack', vol, 0.85 + Math.random() * 0.4)) return;
  const f = 700 + Math.random() * 900;
  ping(c, now, f, f * 0.7, 0.07, 0.3 * vol, 'triangle'); ping(c, now, f * 2.3, f * 1.7, 0.04, 0.12 * vol, 'square'); burst(c, now, 0.05, 0.25 * vol, 1500, 6000);
}
/* 핀이 우르르 쓰러지는 소리 (스트라이크일 때 크게) */
export function crash(n) {
  if (!on()) return; const c = ctx(); if (!c) return; if (bufs.strike) return;
  const t = c.currentTime; for (let i = 0; i < n * 2; i++) { const tt = t + Math.random() * 0.9; const f = 600 + Math.random() * 1200; ping(c, tt, f, f * 0.7, 0.08, 0.14 * (1 - i / (n * 2.4)), 'triangle'); burst(c, tt, 0.05, 0.1, 1200, 5000); }
  burst(c, t, 0.9, 0.12, 120, 700);
}
export function gutter() {
  if (!on()) return; const c = ctx(); if (!c) return; if (play('gutter', 0.7, 1)) return;
  const t = c.currentTime; ping(c, t, 120, 70, 0.3, 0.3, 'sine'); burst(c, t, 0.35, 0.18, 100, 500);
}
export function sweep() {
  if (!on()) return; const c = ctx(); if (!c) return; if (play('sweep', 0.5, 1)) return;
  const t = c.currentTime, s = c.createBufferSource(); s.buffer = getNoise(c); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(250, t); f.frequency.linearRampToValueAtTime(900, t + 0.5);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13, t + 0.15); g.gain.linearRampToValueAtTime(0.0001, t + 0.7); s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.75);
}
/* 굴러가는 소리: 속도에 따라 커지고, 레인 위에서는 우르릉, 거터에서는 덜컹 */
export function rollStart() {
  if (!on() || roll) return; const c = ctx(); if (!c) return;
  const g = c.createGain(); g.gain.value = 0; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 2;
  let src; if (bufs.roll) { src = c.createBufferSource(); src.buffer = bufs.roll; } else { src = c.createBufferSource(); src.buffer = getNoise(c); }
  src.loop = true; src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 7; lg.gain.value = 60; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  roll = { src, g, f, lfo, real: !!bufs.roll };
}
export function rollSet(norm, inGutter) {
  if (!roll) return; const c = ctx(); if (!c) return; const t = c.currentTime;
  roll.g.gain.setTargetAtTime((roll.real ? 0.5 : 0.32) * Math.max(0, Math.min(1, norm)), t, 0.05);
  if (!roll.real) roll.f.frequency.setTargetAtTime((inGutter ? 200 : 330) + norm * 160, t, 0.08);
}
export function rollStop() {
  if (!roll) return; const c = ctx(), r = roll; roll = null; if (!c) return; const t = c.currentTime;
  r.g.gain.setTargetAtTime(0, t, 0.08); setTimeout(() => { try { r.src.stop(); r.lfo.stop(); } catch (e) {} }, 500);
}
