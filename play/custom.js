/* 선생님이 만든 문항(우리 학교 사진·이름 포함)을 차시 게임에 합칩니다.
   저장: localStorage 'oks_custom_v1' = { 활동ID: { sets:[], items:[], seqs:[], sort:[], pairs:[], hide:{sets:[],items:[],seqs:[],sort:[],pairs:[]}, only:false } } */
(function () {
  'use strict';
  var KEY = 'oks_custom_v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch (e) { return false; } }
  function get(id) { var a = load(); var c = a[id] || {}; ['sets', 'items', 'seqs', 'sort', 'pairs'].forEach(function (k) { c[k] = c[k] || []; }); c.hide = c.hide || {}; ['sets', 'items', 'seqs', 'sort', 'pairs'].forEach(function (k) { c.hide[k] = c.hide[k] || []; }); return c; }
  function put(id, c) { var a = load(); a[id] = c; return save(a); }
  /* 이 차시에서 선생님이 고칠 수 있는 문항 종류 */
  function kind(base) {
    if (!base) return null;
    if (base.engine === 'pick' && base.sets) return 'sets';
    if (base.engine === 'pick' && base.items) return 'items';
    if (base.engine === 'order') return 'seqs';
    if (base.engine === 'sort') return 'sort';
    if (base.engine === 'pairs') return 'pairs';
    return null;
  }
  var FIELD = { sets: 'sets', items: 'items', seqs: 'seqs', sort: 'items', pairs: 'items' };
  function apply(id, base) {
    if (!base) return base;
    var k = kind(base); if (!k) return base;
    var c = get(id), f = FIELD[k];
    var mine = c[k] || [], hide = c.hide[k] || [];
    if (!mine.length && !hide.length) return base;
    var out = Object.assign({}, base);
    var kept = (base[f] || []).filter(function (x, i) { return hide.indexOf(i) < 0; });
    var add = mine.map(function (m) { return Object.assign({ mine: true }, m); });
    var list = c.only && add.length >= 2 ? add : kept.concat(add);
    if (list.length < 2) list = (base[f] || []).concat(add); /* 너무 적으면 기본 문항을 되살림 */
    out[f] = list;
    return out;
  }
  function count(id) { var c = get(id); return c.sets.length + c.items.length + c.seqs.length + c.sort.length + c.pairs.length; }
  /* 사진을 작게 줄여 data URL로 (저장 공간 아끼기) */
  function shrink(file, max, cb) {
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, (max || 320) / Math.max(im.width, im.height)), cv = document.createElement('canvas');
        cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL('image/jpeg', 0.8));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }
  window.OKS_CUSTOM = { KEY: KEY, load: load, save: save, get: get, put: put, kind: kind, apply: apply, count: count, shrink: shrink };
})();
