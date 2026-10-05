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
    var knee = points[SIDES[side][0]], foot = points[SIDES[side][1]];
    return knee && foot ? Math.hypot(knee.x - foot.x, knee.y - foot.y) : 0;
  }
  // 좌표를 잃으면 예전 좌표를 그리지 않습니다. 실제로 관측한 네 관절만 정리합니다.
  function PoseTracker() { this.previous = null; this.time = -Infinity; this.pending = {}; }
  PoseTracker.prototype.update = function (points, now) {
    if (!points) { if (now - this.time > 250) this.previous = null; return null; }
    var out = points.map(function (p, i) { return i >= 25 && i <= 28 && p ? Object.assign({}, p) : null; });
    var previous = now - this.time <= 250 ? this.previous : null;
    function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    if (previous && [25, 26, 27, 28].every(function (i) { return visible(out[i]) && visible(previous[i], .5); })) {
      var direct = distance(out[25], previous[25]) + distance(out[26], previous[26]);
      var reverse = distance(out[25], previous[26]) + distance(out[26], previous[25]);
      // 양 무릎이 서로의 직전 위치로 옮겨간 명확한 라벨 전환만 교정합니다.
      if (direct > .08 && reverse < .04 && reverse < direct * .35) {
        var knee = out[25], ankle = out[27]; out[25] = out[26]; out[27] = out[28]; out[26] = knee; out[28] = ankle;
      }
      var ankleDirect = distance(out[27], previous[27]) + distance(out[28], previous[28]);
      var ankleReverse = distance(out[27], previous[28]) + distance(out[28], previous[27]);
      // 무릎은 그대로인데 두 발목만 순간 뒤바뀌면 연결을 추측해서 만들지 않습니다.
      if (distance(out[25], previous[25]) < .025 && distance(out[26], previous[26]) < .025 && ankleDirect > .12 && ankleReverse < .025 && ankleReverse < ankleDirect * .25) {
        out[27] = out[28] = null;
      }
    }
    Object.keys(SIDES).forEach(function (s) {
      var ids = SIDES[s], k = out[ids[0]], a = out[ids[1]], oldK = previous && previous[ids[0]], oldA = previous && previous[ids[1]];
      if (!visible(k, .5) || !visible(a, .5) || distance(k, a) < .025 || a.y < k.y - .08) { out[ids[0]] = out[ids[1]] = null; this.pending[s] = null; return; }
      if (oldK && oldA) {
        var oldLength = distance(oldK, oldA), limit = Math.max(.08, oldLength * .65);
        var kneeJump = distance(k, oldK), ankleJump = distance(a, oldA);
        // 무릎과 발목의 역전/순간 이동은 안정된 실측이 이어진 뒤에만 다시 받습니다.
        var bad = (kneeJump > limit && ankleJump > limit) || distance(k, a) > Math.max(.15, oldLength * 2.5);
        if (bad) {
          var pending = this.pending[s];
          if (!pending || distance(k, pending.knee) > .025 || distance(a, pending.ankle) > .025) pending = this.pending[s] = { knee: k, ankle: a, time: now, count: 0 };
          pending.count++;
          if (!visible(k) || !visible(a) || pending.count < 3 || now - pending.time < 150) { out[ids[0]] = out[ids[1]] = null; return; }
        } else {
          // 작은 떨림은 낮은 가중치, 실제 발차기는 높은 가중치로 처리합니다.
          ids.forEach(function (i) { var p = out[i], old = previous[i], delta = distance(p, old), alpha = delta < .015 ? .3 : .8; p.x = delta < .003 ? old.x : old.x + (p.x - old.x) * alpha; p.y = delta < .003 ? old.y : old.y + (p.y - old.y) * alpha; });
        }
      }
      this.pending[s] = null;
    }, this);
    // 버린 관절은 추적 기준을 갱신하지 않습니다. 신뢰도는 원본 값을 유지합니다.
    if (out.slice(25, 29).some(Boolean)) {
      this.previous = out.map(function (p, i) { return p || (previous && previous[i]) || null; }); this.time = now;
    }
    return out.slice(25, 29).some(Boolean) ? out : null;
  };
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
        if ([25, 26].every(function (i) { return visible(previous[i], .5) && visible(p[i], .5); })) {
          var reversed = (Math.hypot(p[25].x - previous[26].x, p[25].y - previous[26].y) + Math.hypot(p[26].x - previous[25].x, p[26].y - previous[25].y)) / 2;
          d = Math.min((distances[0] + distances[1]) / 2, reversed);
        }
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
  Motion.PoseTracker = PoseTracker;
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
    // 앉았다 일어나는 큰 자세 변화: 두 다리가 새 내려 둔 위치에서 안정되면 재기준화합니다.
    var moved = f.left && f.right && this.baseline.left && this.baseline.right && ['left', 'right'].every(function (s) {
      var p = f[s], b = this.baseline[s];
      return visible(points[SIDES[s][0]]) && visible(points[SIDES[s][1]]) && p.ankle - p.knee > .06 && Math.abs(p.x - p.kneeX) < .12 && Math.abs(p.knee - b.knee) > .08 && Math.abs(p.kneeX - b.kneeX) < .08 && (p.ankle - b.ankle) - (p.knee - b.knee) > -.04;
    }, this);
    if (moved) {
      var change = this.postureChange;
      if (!change || ['left', 'right'].some(function (s) { return Math.hypot(f[s].x - change.pose[s].x, f[s].ankle - change.pose[s].ankle) > .02 || Math.hypot(f[s].kneeX - change.pose[s].kneeX, f[s].knee - change.pose[s].knee) > .02; })) change = this.postureChange = { pose: f, time: now };
      this.resetTracking(); result.valid = false; result.reason = 'posture';
      if (now - change.time >= 600) { this.start(points); this.postureChange = null; result.valid = true; result.sides = Object.keys(f); }
      return result;
    }
    this.postureChange = null;
    var candidates = [], accepted = 0, sensitivity = this.options.sensitivity * (this.options.seated ? 1 : .7);
    Object.keys(this.tracking).forEach(function (s) { if (!f[s] && (!this.tracking[s].previous || now - this.tracking[s].previous.time > 250)) this.tracking[s] = { armed: false, low: null, high: null, smooth: null, previous: null }; }, this);
    Object.keys(f).forEach(function (s) {
      if (!this.baseline[s]) {
        this.baseline[s] = { ankle: f[s].ankle, knee: f[s].knee, leg: Math.max(.09, f[s].leg), x: f[s].x, kneeX: f[s].kneeX };
        return;
      }
      var b = this.baseline[s], t = this.tracking[s], current = f[s], previous = t.previous;
      // 서서 시작할 때 발이 올라간 상태로 잡혔다면 실제 내려 둔 자세로 기준을 고칩니다.
      var resting = !this.options.seated && visible(points[SIDES[s][0]]) && visible(points[SIDES[s][1]]) && current.ankle > b.ankle + .025 && current.ankle - current.knee > .06 && Math.abs(current.kneeX - b.kneeX) < Math.max(.08, b.leg * .25) && Math.abs(current.x - b.x) < Math.max(.12, b.leg * .75);
      if (resting) {
        if (!t.rest || Math.hypot(current.x - t.rest.x, current.ankle - t.rest.ankle) > .025 || Math.hypot(current.kneeX - t.rest.kneeX, current.knee - t.rest.knee) > .025) t.rest = { x: current.x, ankle: current.ankle, kneeX: current.kneeX, knee: current.knee, time: now };
        t.armed = false; t.low = t.high = t.smooth = null;
        if (now - t.rest.time < 200) { accepted++; result.sides.push(s); t.previous = { x: current.x, ankle: current.ankle, kneeX: current.kneeX, knee: current.knee, time: now }; return; }
        this.baseline[s] = b = { ankle: current.ankle, knee: current.knee, leg: Math.max(.09, current.leg), x: current.x, kneeX: current.kneeX };
      }
      t.rest = null;
      // 다른 위치의 사람/사물로 좌표가 튄 프레임은 점수에서 제외합니다.
      var jump = previous && Math.max(Math.hypot(current.x - previous.x, current.ankle - previous.ankle), Math.hypot(current.kneeX - previous.kneeX, current.knee - previous.knee)) > b.leg * .75 * Math.max(1, Math.min(2.5, (now - previous.time) / 100));
      var shifted = Math.abs(current.x - b.x) > b.leg * .75 || Math.abs(current.kneeX - b.kneeX) > b.leg * .75;
      var distorted = current.leg / b.leg > 2.2;
      if (jump || shifted || distorted) {
        t.armed = false; t.low = t.high = t.smooth = null; t.previous = null;
        result.reason = 'tracking'; return;
      }
      accepted++; result.sides.push(s); t.previous = { x: current.x, ankle: current.ankle, kneeX: current.kneeX, knee: current.knee, time: now };
      var drift = 0, other = s === 'left' ? 'right' : 'left', otherBase = this.baseline[other], otherPose = f[other];
      if (!this.options.seated && otherBase && otherPose && Math.abs((otherPose.ankle - otherBase.ankle) - (otherPose.knee - otherBase.knee)) < otherBase.leg * .03) drift = otherPose.knee - otherBase.knee;
      var ankle = (b.ankle - current.ankle + drift) / b.leg, knee = (b.knee - current.knee + drift) / b.leg;
      var sweep = Math.abs((current.x - current.kneeX) - (b.x - b.kneeX)) / b.leg;
      // 서서 차는 안쪽/옆쪽 발목 움직임은 발 들기와 함께 나타날 때만 인정합니다.
      var value = this.options.seated ? Math.max(ankle, knee) : Math.max(ankle, knee * .85, Math.max(ankle, knee) > .025 ? sweep : 0);
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
