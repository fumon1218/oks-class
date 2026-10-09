/* SGF 읽기(브라우저용) — 본 기보(첫 줄기)만 읽어요. 반환: {n, b, w, dt, re, fc, setup:{B:[[x,y]],W:[[x,y]]}, mv:'pddc…'} */
(function (root) {
  'use strict';
  function parse(txt) {
    txt = String(txt || ''); if (txt.indexOf('(;') < 0 && txt.indexOf('(') < 0) return null;
    var n = +((txt.match(/SZ\[(\d+)/) || [])[1] || 19); if (n < 5 || n > 19) return null;
    var prop = function (k) { return ((txt.match(new RegExp('(?:^|[^A-Z])' + k + '\\[([^\\]]*)\\]')) || [])[1] || '').trim(); };
    var pt = function (s) { return s && s.length >= 2 && s !== 'tt' ? [s.charCodeAt(0) - 97, s.charCodeAt(1) - 97] : null; };
    var setup = { B: [], W: [] }, mv = '', fc = '', i = txt.indexOf('(') + 1;
    var walk = function (keep) {
      var seen = false;
      while (i < txt.length && txt[i] !== ')') {
        if (txt[i] === ';') {
          i++;
          while (i < txt.length && /[A-Z]/.test(txt[i])) {
            var k = ''; while (/[A-Z]/.test(txt[i])) k += txt[i++]; var vals = [];
            while (txt[i] === '[') { var v = ''; i++; while (i < txt.length && txt[i] !== ']') { if (txt[i] === '\\') i++; v += txt[i++]; } i++; vals.push(v); while (/\s/.test(txt[i] || '')) i++; }
            if (!keep) continue;
            if (k === 'B' || k === 'W') { var p = pt(vals[0]); if (!fc) fc = k; mv += p ? String.fromCharCode(97 + p[0]) + String.fromCharCode(97 + p[1]) : '--'; }
            else if (k === 'AB' || k === 'AW') vals.forEach(function (q) { var p = pt(q); if (p) setup[k === 'AB' ? 'B' : 'W'].push(p); });
          }
        } else if (txt[i] === '(') { i++; var kp = keep && !seen; seen = true; walk(kp); } else i++;
      }
      i++;
    };
    walk(true);
    if (mv.length < 8) return null;
    return { n: n, b: prop('PB') || '흑', w: prop('PW') || '백', dt: prop('DT'), re: prop('RE'), fc: fc || 'B', setup: setup, mv: mv };
  }
  root.OKS_SGF = { parse: parse };
})(typeof window !== 'undefined' ? window : globalThis);
