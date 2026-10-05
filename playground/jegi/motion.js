/* 제기차기: 자세 기준 보정, 신뢰도 검사, 들기→내리기 재준비. 영상은 저장하지 않습니다. */
(function (root) {
  'use strict';
  var SIDES = { left: [25, 27, 31], right: [26, 28, 32] };
  function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function visible(p) {
    return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.visibility) && p.visibility >= .55 && p.x >= .01 && p.x <= .99 && p.y >= .01 && p.y <= .99;
  }
  function footPoint(points, side) {
    var ids = SIDES[side];
    return visible(points[ids[2]]) ? points[ids[2]] : visible(points[ids[1]]) ? points[ids[1]] : null;
  }
  function legSize(points, side) {
    var knee = points[SIDES[side][0]], foot = footPoint(points, side);
    return knee && foot ? Math.hypot(knee.x - foot.x, knee.y - foot.y) : 0;
  }
  function inspect(points, foot) {
    var sides = foot === 'both' ? ['left', 'right'] : [foot];
    var seen = {
      knees: !!points && sides.every(function (s) { return visible(points[SIDES[s][0]]); }),
      feet: !!points && sides.every(function (s) { return !!footPoint(points, s); })
    };
    var missing = Object.keys(seen).filter(function (g) { return !seen[g]; });
    var small = missing.length === 0 && sides.some(function (s) { return legSize(points, s) < .015; });
    return { valid: missing.length === 0 && !small, seen: seen, missing: missing, small: small, detected: !!points };
  }
  function selectPose(poses) {
    if (!poses || !poses.length) return null;
    // 상체가 화면 밖이면 무릎~발의 크기와 중앙 위치로 참여자를 선택합니다.
    function rank(p) {
      if (!p) return -1;
      var width = 0, center = .5;
      if (visible(p[11]) && visible(p[12])) { width = Math.hypot(p[11].x - p[12].x, p[11].y - p[12].y); center = (p[11].x + p[12].x) / 2; }
      Object.keys(SIDES).forEach(function (s) {
        var knee = p[SIDES[s][0]], f = footPoint(p, s), size = visible(knee) && f ? legSize(p, s) * .8 : 0;
        if (size > width) { width = size; center = (knee.x + f.x) / 2; }
      });
      return width * (1 - Math.min(.6, Math.abs(center - .5)));
    }
    return poses.reduce(function (best, p) { return rank(p) > rank(best) ? p : best; }, poses[0]);
  }
  function features(points, foot) {
    if (!inspect(points, foot).valid) return null;
    var out = {}, sides = foot === 'both' ? ['left', 'right'] : [foot];
    sides.forEach(function (s) {
      var knee = points[SIDES[s][0]], f = footPoint(points, s);
      // 카메라를 고정한 상태에서 화면 좌표의 상승을 측정합니다. 몸통 좌표는 사용하지 않습니다.
      out[s] = { ankle: f.y, knee: knee.y, leg: legSize(points, s) * 2 };
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
  // 첫 유효 자세를 즉시 기준으로 사용합니다. 멈춰 있는 준비 단계는 없습니다.
  Motion.prototype.start = function (points) {
    var f = this.read(points);
    if (!f) return false;
    var sides = this.options.foot === 'both' ? ['left', 'right'] : [this.options.foot];
    this.baseline = {};
    sides.forEach(function (s) { this.baseline[s] = { ankle: f[s].ankle, knee: f[s].knee, leg: Math.max(.07, f[s].leg) }; }, this);
    this.resetTracking();
    return true;
  };
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
    sides.forEach(function (s) { this.baseline[s] = { ankle: mean(this.samples.map(function (v) { return v[s].ankle; })), knee: mean(this.samples.map(function (v) { return v[s].knee; })), leg: Math.max(.07, mean(this.samples.map(function (v) { return v[s].leg; }))) }; }, this);
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
