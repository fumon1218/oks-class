/* 추론은 별도 스레드에서 수행합니다. 전송된 프레임은 처리 후 즉시 해제합니다. */
importScripts('motion.js');
var model, previousPose = null, lastSeen = 0, tracker = new self.JegiMotion.PoseTracker();
self.onmessage = async function (event) {
  var data = event.data;
  if (data.type === 'init') {
    try {
      var api = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs');
      var vision = await api.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
      // 0.10.32는 VIDEO의 한 사람 모드에서만 관절 좌표 평활화를 켭니다.
      model = await api.PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task', delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: .6, minPosePresenceConfidence: .6, minTrackingConfidence: .5 });
      self.postMessage({ type: 'ready' });
    } catch (e) { self.postMessage({ type: 'error', message: String(e.message || e) }); }
  } else if (data.type === 'frame') {
    try {
      var result = model.detectForVideo(data.bitmap, data.time);
      var selected = self.JegiMotion.selectPose(result.landmarks, data.time - lastSeen < 600 ? previousPose : null);
      if (selected && new self.JegiMotion().inspect(selected).valid) { previousPose = selected; lastSeen = data.time; }
      // 앱에는 무릎(25,26)과 발목(27,28) 네 좌표만 전달합니다.
      self.postMessage({ type: 'pose', points: tracker.update(selected, data.time) });
    } catch (e) { self.postMessage({ type: 'error', message: String(e.message || e) }); }
    finally { data.bitmap.close(); }
  }
};
