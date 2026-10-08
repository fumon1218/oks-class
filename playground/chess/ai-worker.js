/* 컴퓨터 생각은 별도 스레드에서 해서 3D 화면이 멈추지 않게 합니다. */
importScripts('engine.js');
self.onmessage = function (e) {
  var d = e.data, g = new self.OKS_CHESS.Game(d.fen), m;
  try { m = d.kind === 'hint' ? self.OKS_CHESS.ai.hint(g) : self.OKS_CHESS.ai.choose(g, d.level); } catch (err) { m = null; }
  self.postMessage({ id: d.id, move: m ? { from: m.from, to: m.to, promo: Math.abs(m.promo || 0) } : null });
};
