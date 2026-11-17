# AI Facial Expression Detector

A local, browser-based webcam dashboard that uses MediaPipe Face Landmarker blendshapes to estimate visible facial-expression patterns: Happy, Sad, Angry, Surprised, Fearful, Disgusted, or Neutral.

## Deployment
https://ai-expression-detector-8.vercel.app

## Important limitation

This is not emotion, intent, identity, or mental-health detection. It only estimates visible facial-expression patterns using a transparent heuristic. Lighting, camera angle, facial variation, movement, occlusion, and the underlying model all affect its output. The displayed percentage is an approximate model-derived signal, not calibrated emotional confidence.

## Run locally

Requirements: Node.js 18+ and a current Chrome, Edge, or Firefox browser.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite (typically `http://localhost:5173`). Click **Start camera** and approve the browser camera prompt. Camera access requires localhost or HTTPS; opening `index.html` directly will not work.

### Visual Studio Code

1. Open this project folder in VS Code.
2. Open its integrated terminal.
3. Run `npm install`, then `npm run dev`.
4. Cmd/Ctrl-click the localhost URL in the terminal.

## How it works

`@mediapipe/tasks-vision` runs Face Landmarker locally in the browser. It produces face landmarks for the overlay and documented facial blendshape categories such as `mouthSmileLeft`, `browDownRight`, `eyeWideLeft`, and `noseSneerRight`.

`src/expression-classifier.js` combines several relevant cues for each label rather than treating one blendshape as proof of an expression. For example, Surprise combines raised brows, wider eyes, and mouth openness; Disgust combines nose-sneer, upper-lip, cheek, and frown cues. Configurable sensitivity and minimum signal alter the threshold. A rolling average plus five-frame persistence reduces flicker. When no face is visible, the UI falls back to a neutral/no-signal display.

No webcam frames, landmarks, photos, identities, or history leave the browser. The session history holds only expression labels, approximate scores, and timestamps in memory, and disappears on refresh. Stopping the camera releases its media tracks.

## Testing expressions

Use steady, well-lit, forward-facing poses for a few seconds after each change:

- **Happy:** smile with raised cheeks.
- **Sad:** relax the smile and pull mouth corners down; gently raise inner brows.
- **Angry:** draw brows down and together, with a firmer mouth.
- **Surprised:** raise brows, open eyes, and open mouth.
- **Fearful:** widen eyes, raise brows, and use a slightly open/tense mouth.
- **Disgusted:** wrinkle/sneer the nose and raise the upper lip.
- **Neutral:** relax the face; it should be the fallback when no pattern crosses threshold.

These poses are only a practical test of visual cues, not a claim that such expressions reveal an emotion.

## Common issues

| Problem | Resolution |
| --- | --- |
| Permission denied | Allow camera permission for the localhost site in browser settings, then reload. |
| No camera found | Connect/enable a camera and close any app exclusively using it. |
| Model fails to load | Check internet access once: the browser fetches MediaPipe's official model and WASM runtime. Then hard-reload. |
| Empty video | Run through Vite on localhost, not from a `file://` URL. |
| Unstable labels | Improve lighting, face the camera, lower sensitivity, or raise the minimum detection signal. |

## Improving accuracy

For a production system, validate with consented, representative data and use a carefully evaluated classifier trained for the exact visual-expression task. Add per-user calibration, temporal modelling, quality checks (lighting/pose/occlusion), and independent bias/robustness testing. Keep privacy boundaries and avoid making claims about a person's feelings, mental health, or identity.

## Project layout

```text
src/camera.js                 Webcam lifecycle
src/face-landmarker.js        MediaPipe setup and overlay drawing
src/expression-classifier.js  Configurable heuristic and smoothing
src/expression-history.js     In-memory label history
src/dashboard.js              UI rendering
src/main.js                   App coordination
src/styles.css                Responsive dashboard styling
```
