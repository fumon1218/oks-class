/* 제기차기: 자세 기준 보정, 신뢰도 검사, 들기→내리기 재준비. 영상은 저장하지 않습니다. */
(function (root) {
  'use strict';
  var SIDES = { left: [23, 25, 27], right: [24, 26, 28] };
  function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function visible(p) {
    return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.visibility) && p.visibility >= .55 && p.x >= .01 && p.x <= .99 && p.y >= .01 && p.y <= .99;
  }
  function torsoSize(points) {
    return Math.hypot((points[23].x + points[24].x - points[11].x - points[12].x) / 2, (points[23].y + points[24].y - points[11].y - points[12].y) / 2);
  }
  function inspect(points, foot) {
    var sides = foot === 'both' ? ['left', 'right'] : [foot];
    var groups = { shoulders: [11, 12], hips: [23, 24], knees: sides.map(function (s) { return SIDES[s][1]; }), feet: sides.map(function (s) { return SIDES[s][2]; }) };
    var seen = {}, missing = [];
    Object.keys(groups).forEach(function (g) { seen[g] = !!points && groups[g].every(function (i) { return visible(points[i]); }); if (!seen[g]) missing.push(g); });
    var small = missing.length === 0 && torsoSize(points) < .07;
    return { valid: missing.length === 0 && !small, seen: seen, missing: missing, small: small, detected: !!points };
  }
  function selectPose(poses) {
    if (!poses || !poses.length) return null;
    // 큰 상체와 중앙 위치를 우선합니다. 뒷사람의 다리가 잘 보여도 그 이유로 선택하지 않습니다.
    function rank(p) {
      if (!p || !p[11] || !p[12]) return -1;
      var width = Math.hypot(p[11].x - p[12].x, p[11].y - p[12].y);
      var center = (p[11].x + p[12].x) / 2;
      return width * (1 - Math.min(.6, Math.abs(center - .5)));
    }
    return poses.reduce(function (best, p) { return rank(p) > rank(best) ? p : best; }, poses[0]);
  }
  function features(points, foot) {
    if (!inspect(points, foot).valid) return null;
    var torso = torsoSize(points);
    var out = {};
    Object.keys(SIDES).forEach(function (s) {
      var ids = SIDES[s], hip = points[ids[0]], knee = points[ids[1]], ankle = points[ids[2]];
      if (hip && knee && ankle) out[s] = { ankle: (ankle.y - hip.y) / torso, knee: (knee.y - hip.y) / torso, leg: (Math.hypot(knee.x - hip.x, knee.y - hip.y) + Math.hypot(ankle.x - knee.x, ankle.y - knee.y)) / torso };
    });
    return out;
  }
  function Motion(options) {
    this.options = Object.assign({ foot: 'both', sensitivity: .13, seated: false }, options);
    this.baseline = null; this.samples = []; this.resetTracking();
  }
  Motion.prototype.resetTracking = function () {
    this.lastKick = -Infinity;
    this.tracking = { left: { armed: false, low: null, high: null, smooth: null }, right: { armed: false, low: null, high: null, smooth: null } };
  };
  Motion.selectPose = selectPose;
  Motion.prototype.inspect = function (points) { return inspect(points, this.options.foot); };
  Motion.prototype.read = function (points) { return features(points, this.options.foot); };
  Motion.prototype.calibrate = function (points) {
    var f = this.read(points), sides = this.options.foot === 'both' ? ['left', 'right'] : [this.options.foot];
    if (!f) { this.samples = []; return { valid: false, progress: 0 }; }
    this.samples.push(f);
    if (this.samples.length > 24) this.samples.shift();
    var stable = sides.every(function (s) {
      var a = this.samples.map(function (v) { return v[s].ankle; });
      return Math.max.apply(null, a) - Math.min.apply(null, a) < .12;
    }, this);
    if (!stable) { this.samples = [f]; return { valid: true, progress: 1 / 24, moving: true }; }
    if (this.samples.length < 24) return { valid: true, progress: this.samples.length / 24 };
    this.baseline = {};
    sides.forEach(function (s) { this.baseline[s] = { ankle: mean(this.samples.map(function (v) { return v[s].ankle; })), knee: mean(this.samples.map(function (v) { return v[s].knee; })), leg: Math.max(.5, mean(this.samples.map(function (v) { return v[s].leg; }))) }; }, this);
    this.resetTracking();
    return { valid: true, progress: 1, done: true };
  };
  Motion.prototype.update = function (points, now) {
    var f = this.read(points), result = { valid: !!f, kick: null, lift: 0 };
    if (!f) { this.resetTracking(); return result; }
    if (!this.baseline) return result;
    var candidates = [], sensitivity = this.options.sensitivity;
    Object.keys(this.baseline).forEach(function (s) {
      var b = this.baseline[s], t = this.tracking[s];
      var ankle = (b.ankle - f[s].ankle) / b.leg, knee = (b.knee - f[s].knee) / b.leg;
      var value = this.options.seated ? Math.max(ankle, knee) : Math.max(ankle, knee * .85);
      t.smooth = t.smooth == null ? value : t.smooth * .5 + value * .5;
      result.lift = Math.max(result.lift, t.smooth);
      if (t.smooth < sensitivity * .42) {
        t.high = null; if (t.low == null) t.low = now;
        if (now - t.low >= 160) t.armed = true;
      } else {
        t.low = null;
        if (t.smooth >= sensitivity && t.armed) {
          if (t.high == null) t.high = now;
          if (now - t.high >= 80 && now - this.lastKick >= 650) candidates.push({ side: s, lift: t.smooth });
        } else t.high = null;
      }
    }, this);
    if (candidates.length) {
      candidates.sort(function (a, b) { return b.lift - a.lift; }); result.kick = candidates[0].side; this.lastKick = now;
      Object.keys(this.tracking).forEach(function (s) { this.tracking[s].armed = false; this.tracking[s].low = this.tracking[s].high = null; }, this);
    }
    return result;
  };
  root.JegiMotion = Motion;
})(typeof window !== 'undefined' ? window : globalThis);
