/* 컴퓨터 생각은 별도 스레드에서 해서 3D 화면이 멈추지 않게 합니다. */
importScripts('engine.js');
self.onmessage = function (e) {
  var d = e.data, g = new self.OKS_JANGGI.Game(d.fen), m;
  if (d.keys) g.keys = d.keys;
  try { m = d.kind === 'hint' ? self.OKS_JANGGI.ai.hint(g) : self.OKS_JANGGI.ai.choose(g, d.level); } catch (err) { m = null; }
  self.postMessage({ id: d.id, move: m ? { from: m.from, to: m.to } : null });
};
