/* 무지개 마을 지도 (4·5수준 · 항공뷰 town2.webp 1672×941)
   강 위쪽 두 줄 + 다리 + 강 아래쪽 한 줄. 집 13채와 병원·빵집·소방서·놀이터·우체국·도서관·버스 정류장. */
window.OKS_TOWN2 = (function () {
  var Y1 = 222, Y2 = 437, Y3 = 660, Y4 = 868;
  var N = {
    L1: [20, Y1], h1: [158, Y1], V1a: [290, Y1], pHos: [437, Y1], V2a: [580, Y1], h2: [715, Y1], V3a: [840, Y1], pBak: [965, Y1], V4a: [1100, Y1], h3: [1238, Y1], V5a: [1385, Y1], h4: [1515, Y1], R1: [1645, Y1],
    L2: [20, Y2], h5: [150, Y2], V1b: [290, Y2], pFire: [420, Y2], V2b: [580, Y2], h6: [710, Y2], BRn: [840, Y2], pPlay: [970, Y2], V4b: [1100, Y2], h7: [1253, Y2], V5b: [1385, Y2], pPost: [1535, Y2], R2: [1645, Y2],
    S0: [12, Y3], W1: [248, Y3], W2: [535, Y3], W3: [780, Y3], BRs: [840, Y3], W4: [995, Y3], W5: [1215, Y3], W6: [1450, Y3], S7: [1660, Y3],
    B0: [12, Y4], h8: [125, Y4], ST: [248, Y4], pLib: [397, Y4], W2b: [535, Y4], h9: [658, Y4], W3b: [780, Y4], h10: [888, Y4], W4b: [995, Y4], h11: [1105, Y4], W5b: [1215, Y4], h12: [1332, Y4], W6b: [1450, Y4], h13: [1563, Y4], B7: [1660, Y4]
  };
  function chain(a) { var e = []; for (var i = 1; i < a.length; i++) e.push([a[i - 1], a[i]]); return e; }
  var EDGES = [].concat(
    chain(['L1', 'h1', 'V1a', 'pHos', 'V2a', 'h2', 'V3a', 'pBak', 'V4a', 'h3', 'V5a', 'h4', 'R1']),
    chain(['L2', 'h5', 'V1b', 'pFire', 'V2b', 'h6', 'BRn', 'pPlay', 'V4b', 'h7', 'V5b', 'pPost', 'R2']),
    chain(['S0', 'W1', 'W2', 'W3', 'BRs', 'W4', 'W5', 'W6', 'S7']),
    chain(['B0', 'h8', 'ST', 'pLib', 'W2b', 'h9', 'W3b', 'h10', 'W4b', 'h11', 'W5b', 'h12', 'W6b', 'h13', 'B7']),
    [['L1', 'L2'], ['V1a', 'V1b'], ['V2a', 'V2b'], ['V3a', 'BRn'], ['V4a', 'V4b'], ['V5a', 'V5b'], ['R1', 'R2'], ['BRn', 'BRs'],
     ['S0', 'B0'], ['W1', 'ST'], ['W2', 'W2b'], ['W3', 'W3b'], ['W4', 'W4b'], ['W5', 'W5b'], ['W6', 'W6b'], ['S7', 'B7']]);
  /* at = 번호표 자리(집 문 앞) */
  var HOUSES = [
    { no: 1, color: '빨간', hex: '#e53935', node: 'h1', at: [158, 186], near: '병원 왼쪽' },
    { no: 2, color: '파란', hex: '#1e88e5', node: 'h2', at: [715, 186], near: '빵집 왼쪽' },
    { no: 3, color: '노란', hex: '#fbc02d', node: 'h3', at: [1238, 186], near: '빵집 오른쪽' },
    { no: 4, color: '초록', hex: '#2e9e6e', node: 'h4', at: [1515, 186], near: '우체국 위' },
    { no: 5, color: '보라', hex: '#7e3fd0', node: 'h5', at: [150, 400], near: '소방서 왼쪽' },
    { no: 6, color: '분홍', hex: '#ec6fa0', node: 'h6', at: [710, 400], near: '놀이터 왼쪽' },
    { no: 7, color: '하얀', hex: '#f4f4f4', node: 'h7', at: [1253, 400], near: '우체국 왼쪽' },
    { no: 8, color: '주황', hex: '#fb8c00', node: 'h8', at: [125, 832], near: '도서관 왼쪽' },
    { no: 9, color: '갈색', hex: '#8d5a3b', node: 'h9', at: [658, 832], near: '도서관 오른쪽' },
    { no: 10, color: '하늘색', hex: '#4fb3f6', node: 'h10', at: [888, 832], near: '다리 건너 바로 앞' },
    { no: 11, color: '민트색', hex: '#5fd3c0', node: 'h11', at: [1105, 832], near: '하늘색 지붕 집 오른쪽' },
    { no: 12, color: '검은', hex: '#2b2b2b', node: 'h12', at: [1332, 832], near: '남색 지붕 집 왼쪽' },
    { no: 13, color: '남색', hex: '#283d8f', node: 'h13', at: [1563, 832], near: '마을 오른쪽 끝' }
  ];
  var PLACES = { pHos: '병원', pBak: '빵집', pFire: '소방서', pPlay: '놀이터', pPost: '우체국', pLib: '도서관', ST: '버스 정류장', BRn: '다리', BRs: '다리' };
  var LABELS = [['🏥 병원', 437, 22], ['🥐 빵집', 965, 22], ['🚒 소방서', 420, 250], ['🛝 놀이터', 970, 250], ['📮 우체국', 1535, 250], ['📚 도서관', 397, 676], ['🚏 출발', 120, 915]];
  var ADJ = {};
  EDGES.forEach(function (e) { (ADJ[e[0]] = ADJ[e[0]] || []).push(e[1]); (ADJ[e[1]] = ADJ[e[1]] || []).push(e[0]); });
  function dir(a, b) { var p = N[a], q = N[b], dx = q[0] - p[0], dy = q[1] - p[1]; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'); }
  function path(a, b) {
    var dist = {}, prev = {}, todo = Object.keys(N); dist[a] = 0;
    while (todo.length) {
      todo.sort(function (x, y) { return (dist[x] == null ? 1e9 : dist[x]) - (dist[y] == null ? 1e9 : dist[y]); });
      var u = todo.shift(); if (dist[u] == null) break; if (u === b) break;
      (ADJ[u] || []).forEach(function (v) { var d = dist[u] + Math.hypot(N[u][0] - N[v][0], N[u][1] - N[v][1]); if (dist[v] == null || d < dist[v]) { dist[v] = d; prev[v] = u; } });
    }
    var out = [b]; while (out[0] !== a && prev[out[0]]) out.unshift(prev[out[0]]); return out;
  }
  return { id: 2, name: '무지개 마을', W: 1672, H: 941, N: N, ADJ: ADJ, HOUSES: HOUSES, PLACES: PLACES, LABELS: LABELS, bdy: 0, START: 'ST', dir: dir, path: path, img: 'town2.webp' };
})();
