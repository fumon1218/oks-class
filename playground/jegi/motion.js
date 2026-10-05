/* 제기차기: 자세 기준 보정, 신뢰도 검사, 들기→내리기 재준비. 영상은 저장하지 않습니다. */
(function (root) {
  'use strict';
  var SIDES = { left: [25, 27], right: [26, 28] };
  function visible(p, minimum) {
    return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.visibility) && p.visibility >= (minimum == null ? .7 : minimum) && (p.presence == null || (Number.isFinite(p.presence) && p.presence >= (minimum == null ? .65 : minimum))) && p.x >= .01 && p.x <= .99 && p.y >= .01 && p.y <= .99;
  }
  function anklePoint(points, side) {
    var ids = SIDES[side];
    return visible(points[ids[1]]) ? points[ids[1]] : null;
  }
  function legSize(points, side) {
    var knee = points[SIDES[side][0]], foot = anklePoint(points, side);
    return knee && foot ? Math.hypot(knee.x - foot.x, knee.y - foot.y) : 0;
  }
  function inspect(points, foot, baseline, tracking, now) {
    var sides = foot === 'both' ? ['left', 'right'] : [foot];
    var seen = {
      knees: !!points && sides.some(function (s) { return visible(points[SIDES[s][0]]); }),
      feet: !!points && sides.some(function (s) { return !!anklePoint(points, s); })
    };
    var small = false;
    var validSides = points ? sides.filter(function (s) {
      var k = points[SIDES[s][0]], a = points[SIDES[s][1]], b = baseline && baseline[s], previous = tracking && tracking[s].previous;
      var strong = visible(k) && visible(a);
      var continuous = b && previous && now - previous.time <= 250 && visible(k, .5) && visible(a, .5) && Math.hypot(a.x - previous.x, a.y - previous.ankle) <= b.leg * .45 && Math.hypot(k.x - previous.kneeX, k.y - previous.knee) <= b.leg * .45;
      if (!strong && !continuous) return false;
      var length = legSize(points, s);
      // 놀이 중인 다리는 무릎을 굽혀 발목이 가까워져도 계속 추적합니다.
      if (baseline && baseline[s]) return length <= .85;
      if (length < .045) { small = true; return false; }
      return length <= .85 && a.y >= k.y - .08;
    }) : [];
    // 두 다리의 좌표가 겹치면 신뢰도가 높은 한 쌍만 사용합니다.
    if (validSides.length === 2 && Math.hypot(points[25].x - points[26].x, points[25].y - points[26].y) < .025 && Math.hypot(points[27].x - points[28].x, points[27].y - points[28].y) < .025) validSides = [points[25].visibility + points[27].visibility >= points[26].visibility + points[28].visibility ? 'left' : 'right'];
    if (validSides.length) seen.knees = seen.feet = true;
    return { valid: validSides.length > 0, validSides: validSides, seen: seen, missing: Object.keys(seen).filter(function (g) { return !seen[g]; }), small: small, detected: !!points };
  }
  function selectPose(poses, previous) {
    if (!poses || !poses.length) return null;
    if (previous) {
      var nearest = null, distance = Infinity;
      poses.forEach(function (p) {
        var distances = [25, 26].filter(function (i) { return visible(previous[i], .5) && visible(p[i], .5); }).map(function (i) { return Math.hypot(p[i].x - previous[i].x, p[i].y - previous[i].y); });
        var d = distances.length ? Math.min.apply(null, distances) : Infinity;
        if (d < distance) { distance = d; nearest = p; }
      });
      // 발을 들어 다리가 짧게 보여도 뒤쪽 사람으로 선택을 바꾸지 않습니다.
      return distance <= .16 ? nearest : null;
    }
    // 무릎~발목의 크기와 중앙 위치만으로 참여자를 선택합니다.
    function rank(p) {
      if (!p) return -1;
      var width = 0, center = .5;
      if (visible(p[25]) && visible(p[26])) { width = Math.hypot(p[25].x - p[26].x, p[25].y - p[26].y) * .35; center = (p[25].x + p[26].x) / 2; }
      Object.keys(SIDES).forEach(function (s) {
        var knee = p[SIDES[s][0]], f = anklePoint(p, s), size = visible(knee) && f ? legSize(p, s) * .8 : 0;
        if (size > width) { width = size; center = (knee.x + f.x) / 2; }
      });
      return width * (1 - Math.min(.6, Math.abs(center - .5)));
    }
    return poses.reduce(function (best, p) { return rank(p) > rank(best) ? p : best; }, poses[0]);
  }
  function features(points, foot, baseline, tracking, now) {
    var check = inspect(points, foot, baseline, tracking, now);
    if (!check.valid) return null;
    var out = {}, sides = check.validSides;
    sides.forEach(function (s) {
      var knee = points[SIDES[s][0]], f = points[SIDES[s][1]];
      // 카메라를 고정한 상태에서 화면 좌표의 상승을 측정합니다. 몸통 좌표는 사용하지 않습니다.
      out[s] = { ankle: f.y, knee: knee.y, x: f.x, kneeX: knee.x, leg: legSize(points, s) * 2 };
    });
    return out;
  }
  function Motion(options) {
    this.options = Object.assign({ foot: 'both', sensitivity: .13, seated: false }, options);
    this.now = 0; this.baseline = null; this.lastKick = -Infinity; this.resetTracking();
  }
  Motion.prototype.resetTracking = function () {
    this.tracking = { left: { armed: false, low: null, high: null, smooth: null, previous: null }, right: { armed: false, low: null, high: null, smooth: null, previous: null } };
  };
  Motion.selectPose = selectPose;
  Motion.prototype.inspect = function (points, now) { return inspect(points, this.options.foot, this.baseline, this.tracking, now == null ? this.now : now); };
  Motion.prototype.read = function (points, now) { return features(points, this.options.foot, this.baseline, this.tracking, now == null ? this.now : now); };
  // 첫 유효 자세를 즉시 기준으로 사용합니다. 멈춰 있는 준비 단계는 없습니다.
  Motion.prototype.start = function (points) {
    var f = features(points, this.options.foot);
    if (!f) return false;
    var sides = Object.keys(f);
    this.baseline = {};
    sides.forEach(function (s) { this.baseline[s] = { ankle: f[s].ankle, knee: f[s].knee, leg: Math.max(.09, f[s].leg), x: f[s].x, kneeX: f[s].kneeX }; }, this);
    this.resetTracking();
    return true;
  };
  Motion.prototype.update = function (points, now) {
    this.now = now;
    var f = this.read(points, now), result = { valid: !!f, kick: null, lift: 0, sides: [] };
    if (!f) {
      Object.keys(this.tracking).forEach(function (s) { var t = this.tracking[s]; if (!t.previous || now - t.previous.time > 250) this.tracking[s] = { armed: false, low: null, high: null, smooth: null, previous: null }; }, this);
      return result; // 인식되지 않은 프레임으로는 점수를 주지 않습니다.
    }
    if (!this.baseline) return result;
    var candidates = [], accepted = 0, sensitivity = this.options.sensitivity;
    Object.keys(this.tracking).forEach(function (s) { if (!f[s] && (!this.tracking[s].previous || now - this.tracking[s].previous.time > 250)) this.tracking[s] = { armed: false, low: null, high: null, smooth: null, previous: null }; }, this);
    Object.keys(f).forEach(function (s) {
      if (!this.baseline[s]) {
        this.baseline[s] = { ankle: f[s].ankle, knee: f[s].knee, leg: Math.max(.09, f[s].leg), x: f[s].x, kneeX: f[s].kneeX };
        return;
      }
      var b = this.baseline[s], t = this.tracking[s], current = f[s], previous = t.previous;
      // 다른 위치의 사람/사물로 좌표가 튄 프레임은 점수에서 제외합니다.
      var jump = previous && Math.max(Math.hypot(current.x - previous.x, current.ankle - previous.ankle), Math.hypot(current.kneeX - previous.kneeX, current.knee - previous.knee)) > b.leg * .75 * Math.max(1, Math.min(2.5, (now - previous.time) / 100));
      var shifted = Math.abs(current.x - b.x) > b.leg * .75 || Math.abs(current.kneeX - b.kneeX) > b.leg * .75;
      var distorted = current.leg / b.leg > 2.2;
      if (jump || shifted || distorted) {
        t.armed = false; t.low = t.high = t.smooth = null; t.previous = null;
        result.reason = 'tracking'; return;
      }
      accepted++; result.sides.push(s); t.previous = { x: current.x, ankle: current.ankle, kneeX: current.kneeX, knee: current.knee, time: now };
      var ankle = (b.ankle - f[s].ankle) / b.leg, knee = (b.knee - f[s].knee) / b.leg;
      var value = this.options.seated ? Math.max(ankle, knee) : Math.max(ankle, knee * .85);
      t.smooth = t.smooth == null ? value : t.smooth * .25 + value * .75;
      result.lift = Math.max(result.lift, t.smooth);
      if (t.smooth < sensitivity * .42) {
        t.high = null; if (t.low == null) t.low = now;
        if (now - t.low >= 160) t.armed = true;
      } else {
        t.low = null;
        if (t.smooth >= sensitivity && value >= sensitivity && t.armed) {
          if (t.high == null) t.high = now;
          if (now - t.high >= 60 && now - this.lastKick >= 400) candidates.push({ side: s, lift: t.smooth });
        } else t.high = null;
      }
    }, this);
    if (!accepted) { result.valid = false; return result; }
    if (candidates.length) {
      candidates.sort(function (a, b) { return b.lift - a.lift; }); result.kick = candidates[0].side; this.lastKick = now;
      Object.keys(this.tracking).forEach(function (s) {
        var t = this.tracking[s];
        // 찬 발과 동시에 들어 올린 발만 재준비합니다. 반대쪽의 내려 둔 발은 그대로 쓸 수 있습니다.
        if (s === result.kick || t.smooth >= sensitivity) { t.armed = false; t.low = t.high = null; }
      }, this);
    }
    return result;
  };
  root.JegiMotion = Motion;
})(typeof window !== 'undefined' ? window : globalThis);
