/* 햇살 마을 지도 (항공뷰 town.webp 1672×941 위의 좌표)
   길 = 점(node)과 선(edge). 트럭은 점에서 점으로 길을 따라 움직여요. 집은 문 앞 길 위 점에 연결돼요. */
window.OKS_TOWN = (function () {
  var N = {
    A: [330, 45], B: [755, 45], C: [1210, 45],
    W: [40, 318], hR: [170, 318], D: [330, 318], E: [755, 318], hB: [865, 318], hY: [1070, 318], F: [1215, 318],
    Q: [1225, 420], S: [1450, 420],
    hP: [150, 580], G: [330, 580], J: [455, 580], H: [755, 580], hG: [865, 580], hU: [1085, 580], I: [1225, 580],
    ST: [455, 700],
    K: [455, 862], hO: [595, 862], M: [755, 862], hBr: [870, 862], hW: [1110, 862], L: [1262, 862]
  };
  var EDGES = [['A', 'B'], ['B', 'C'], ['A', 'D'], ['B', 'E'], ['C', 'F'], ['W', 'hR'], ['hR', 'D'], ['D', 'E'], ['E', 'hB'], ['hB', 'hY'], ['hY', 'F'],
    ['F', 'Q'], ['Q', 'S'], ['Q', 'I'], ['D', 'G'], ['E', 'H'], ['hP', 'G'], ['G', 'J'], ['J', 'H'], ['H', 'hG'], ['hG', 'hU'], ['hU', 'I'],
    ['J', 'ST'], ['ST', 'K'], ['K', 'hO'], ['hO', 'M'], ['M', 'hBr'], ['hBr', 'hW'], ['hW', 'L'], ['H', 'M'], ['L', 'I']];
  /* 집: 번지 · 지붕 색 · 문 앞 점 · 집 그림 가운데 · 위치 말 */
  var HOUSES = [
    { no: 1, color: '빨간', hex: '#e53935', node: 'hR', at: [175, 150], near: '공원 왼쪽' },
    { no: 2, color: '파란', hex: '#1e88e5', node: 'hB', at: [865, 140], near: '공원 오른쪽' },
    { no: 3, color: '노란', hex: '#fbc02d', node: 'hY', at: [1070, 140], near: '학교 왼쪽' },
    { no: 4, color: '분홍', hex: '#ec6fa0', node: 'hP', at: [150, 410], near: '연못 왼쪽' },
    { no: 5, color: '초록', hex: '#43a047', node: 'hG', at: [865, 410], near: '연못 오른쪽' },
    { no: 6, color: '보라', hex: '#7e3fd0', node: 'hU', at: [1085, 410], near: '노란 지붕 집 아래' },
    { no: 7, color: '주황', hex: '#fb8c00', node: 'hO', at: [595, 680], near: '온실 오른쪽' },
    { no: 8, color: '갈색', hex: '#8d5a3b', node: 'hBr', at: [870, 680], near: '주황 지붕 집 오른쪽' },
    { no: 9, color: '하얀', hex: '#f4f4f4', node: 'hW', at: [1110, 680], near: '숲 왼쪽' }
  ];
  var PLACES = { S: '학교', ST: '햇살 농장 온실' };
  var ADJ = {};
  EDGES.forEach(function (e) { (ADJ[e[0]] = ADJ[e[0]] || []).push(e[1]); (ADJ[e[1]] = ADJ[e[1]] || []).push(e[0]); });
  function dir(a, b) { var p = N[a], q = N[b], dx = q[0] - p[0], dy = q[1] - p[1]; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'); }
  function path(a, b) {   /* 가장 짧은 길 (점 개수 기준이 아니라 거리 기준) */
    var dist = {}, prev = {}, todo = Object.keys(N); dist[a] = 0;
    while (todo.length) {
      todo.sort(function (x, y) { return (dist[x] == null ? 1e9 : dist[x]) - (dist[y] == null ? 1e9 : dist[y]); });
      var u = todo.shift(); if (dist[u] == null) break; if (u === b) break;
      (ADJ[u] || []).forEach(function (v) { var d = dist[u] + Math.hypot(N[u][0] - N[v][0], N[u][1] - N[v][1]); if (dist[v] == null || d < dist[v]) { dist[v] = d; prev[v] = u; } });
    }
    var out = [b]; while (out[0] !== a && prev[out[0]]) out.unshift(prev[out[0]]); return out;
  }
  return { id: 1, name: '햇살 마을', LABELS: [['🏫 학교', 1450, 60], ['🌱 출발', 175, 600]], bdy: 115, W: 1672, H: 941, N: N, ADJ: ADJ, HOUSES: HOUSES, PLACES: PLACES, START: 'ST', dir: dir, path: path, img: 'town.webp' };
})();
