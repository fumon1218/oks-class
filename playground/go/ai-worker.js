/* 컴퓨터 생각(몬테카를로)은 별도 스레드에서 해서 3D 화면이 멈추지 않게 합니다. */
importScripts('engine.js');
self.onmessage = function (e) {
  var d = e.data, G = self.OKS_GO, g = new G.Game(d.n), r = null;
  try {
    if (d.handicap) g.setHandicap(d.handicap);
    d.hist.forEach(function (s) { if (s < 0) g.pass(); else g.play(s % d.n, (s / d.n) | 0); });
    if (d.kind === 'est') r = G.estimate(g, d.runs || 200, d.komi); else if (d.kind === 'hint') r = G.ai.hint(g, d.komi); else r = G.ai.choose(g, d.level, d.komi);
  } catch (err) { r = { s: -1, pass: true, win: 0.5 }; }
  if (r && r.own) { r = { own: Array.prototype.slice.call(r.own), dead: r.dead, black: r.black, diff: r.diff }; }
  self.postMessage({ id: d.id, result: r });
};
