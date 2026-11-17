import './styles.css';
import { Camera } from './camera.js';
import { FaceExpressionLandmarker } from './face-landmarker.js';
import { classifyExpression, ExpressionSmoother } from './expression-classifier.js';
import { ExpressionHistory } from './expression-history.js';
import { Dashboard } from './dashboard.js';

const dashboard = new Dashboard();
const camera = new Camera(document.querySelector('#webcam'));
const detector = new FaceExpressionLandmarker();
const history = new ExpressionHistory();
const smoother = new ExpressionSmoother();
let modelReady = false, raf = null, frames = 0, fpsStarted = performance.now();
const settings = () => ({ sensitivity: Number(dashboard.el.sensitivity.value), minConfidence: Number(dashboard.el.minConfidence.value) });
const themes = ['black', 'white', 'red', 'green', 'blue', 'yellow'];

function setTheme(theme) {
  const selected = themes.includes(theme) ? theme : 'blue';
  document.documentElement.dataset.theme = selected;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', selected === 'white' ? '#f5f5f3' : selected === 'yellow' ? '#342900' : '#080d19');
  dashboard.el.themeOptions.forEach(button => {
    const active = button.dataset.themeChoice === selected;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  localStorage.setItem('expression-detector-theme', selected);
}

async function loadModel() {
  try { await detector.initialize(); modelReady = true; dashboard.model(true); } catch (error) { dashboard.model(false, 'Model unavailable'); dashboard.el.cameraError.textContent = `Could not load the on-device face model: ${error.message}`; }
}
function renderLoop(now) {
  if (!camera.active) return;
  const output = detector.detect(camera.video, now);
  const hasFace = Boolean(output?.faceLandmarks?.length);
  detector.draw(dashboard.el.landmarkCanvas, camera.video, output?.faceLandmarks, dashboard.el.showLandmarks.checked);
  dashboard.face(hasFace);
  if (hasFace) {
    const raw = classifyExpression(output.faceBlendshapes?.[0]?.categories || [], settings());
    const stable = smoother.push(raw); dashboard.result(stable);
    if (dashboard.el.recordHistory.checked && history.add(stable.expression, stable.score)) dashboard.history(history.items);
  } else { dashboard.result({ expression: 'Neutral', score: 0, confidence: 0, scores: Object.fromEntries(['Happy','Sad','Angry','Surprised','Fearful','Disgusted','Neutral'].map(name => [name, 0])) }); }
  frames++; if (now - fpsStarted >= 1000) { dashboard.fps(frames); frames = 0; fpsStarted = now; }
  raf = requestAnimationFrame(renderLoop);
}
async function start() {
  if (!modelReady) { dashboard.el.cameraError.textContent = 'The face model is still loading. Please wait a moment.'; return; }
  try { await camera.start(); smoother.reset(); dashboard.camera(true); dashboard.face(false); fpsStarted = performance.now(); raf = requestAnimationFrame(renderLoop); }
  catch (error) { const message = error.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser settings, then try again.' : error.name === 'NotFoundError' ? 'No camera was found. Connect a camera and try again.' : `Could not start the camera: ${error.message}`; dashboard.camera(false, message); }
}
function stop() { if (raf) cancelAnimationFrame(raf); raf = null; camera.stop(); dashboard.camera(false); dashboard.face(false); dashboard.fps(0); smoother.reset(); dashboard.result(null); dashboard.el.landmarkCanvas.getContext('2d').clearRect(0, 0, dashboard.el.landmarkCanvas.width, dashboard.el.landmarkCanvas.height); }
dashboard.el.startCamera.addEventListener('click', start); dashboard.el.stopCamera.addEventListener('click', stop); dashboard.el.clearHistory.addEventListener('click', () => { history.clear(); dashboard.history([]); });
dashboard.el.sensitivity.addEventListener('input', event => { const n = Number(event.target.value); dashboard.el.sensitivityValue.textContent = n < 34 ? 'Low' : n > 66 ? 'High' : 'Medium'; });
dashboard.el.minConfidence.addEventListener('input', event => { dashboard.el.minConfidenceValue.textContent = `${event.target.value}%`; });
dashboard.el.themeOptions = [...document.querySelectorAll('[data-theme-choice]')];
dashboard.el.themeOptions.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
setTheme(localStorage.getItem('expression-detector-theme') || 'blue');
window.addEventListener('beforeunload', stop); dashboard.camera(false); dashboard.history([]); loadModel();
