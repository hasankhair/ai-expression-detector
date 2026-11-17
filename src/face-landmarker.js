import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

export class FaceExpressionLandmarker {
  constructor() { this.landmarker = null; this.lastVideoTime = -1; }
  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false
    });
  }
  detect(video, now) {
    if (!this.landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = video.currentTime;
    return this.landmarker.detectForVideo(video, now);
  }
  draw(canvas, video, landmarks, enabled) {
    const width = video.videoWidth, height = video.videoHeight;
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, width, height);
    if (!enabled || !landmarks?.length) return;
    const drawing = new DrawingUtils(ctx);
    drawing.drawConnectors(landmarks[0], FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: 'rgba(127, 235, 255, .28)', lineWidth: .55 });
    drawing.drawConnectors(landmarks[0], FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#6ee7ff', lineWidth: 1.5 });
    drawing.drawConnectors(landmarks[0], FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#a78bfa', lineWidth: 1.5 });
    drawing.drawConnectors(landmarks[0], FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#a78bfa', lineWidth: 1.5 });
    drawing.drawConnectors(landmarks[0], FaceLandmarker.FACE_LANDMARKS_LIPS, { color: '#fb7185', lineWidth: 1.5 });
  }
  close() { this.landmarker?.close(); this.landmarker = null; }
}
