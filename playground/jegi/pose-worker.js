/* 추론은 별도 스레드에서 수행합니다. 전송된 프레임은 처리 후 즉시 해제합니다. */
var model;
self.onmessage = async function (event) {
  var data = event.data;
  if (data.type === 'init') {
    try {
      var api = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs');
      var vision = await api.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
      model = await api.PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: .6, minPosePresenceConfidence: .6, minTrackingConfidence: .6 });
      self.postMessage({ type: 'ready' });
    } catch (e) { self.postMessage({ type: 'error', message: String(e.message || e) }); }
  } else if (data.type === 'frame') {
    try {
      var result = model.detectForVideo(data.bitmap, data.time);
      self.postMessage({ type: 'pose', points: result.landmarks[0] || null });
    } catch (e) { self.postMessage({ type: 'error', message: String(e.message || e) }); }
    finally { data.bitmap.close(); }
  }
};
