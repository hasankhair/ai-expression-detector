import { EXPRESSION_ORDER } from './expression-classifier.js';

const ICONS = { Happy: '⌣', Sad: '⌢', Angry: '⌁', Surprised: '◯', Fearful: '◌', Disgusted: '⌇', Neutral: '—', Waiting: '—' };
const DESCRIPTIONS = { Happy: 'Smile and cheek cues are most visible.', Sad: 'Frown and brow cues are most visible.', Angry: 'Lowered-brow and mouth cues are most visible.', Surprised: 'Raised-brow, widened-eye, and open-mouth cues are most visible.', Fearful: 'Widened-eye, raised-brow, and mouth cues are most visible.', Disgusted: 'Nose, upper-lip, and cheek cues are most visible.', Neutral: 'No expression pattern exceeded the configured threshold.', Waiting: 'Start your camera when the model is ready.' };
const pct = value => `${Math.round((value || 0) * 100)}%`;

export class Dashboard {
  constructor() {
    this.el = Object.fromEntries([...document.querySelectorAll('[id]')].map(node => [node.id, node]));
    this.chart = this.el.scoreChart;
    this.chart.innerHTML = EXPRESSION_ORDER.map(name => `<div class="chart-row"><span>${name}</span><div class="bar"><i data-score="${name}"></i></div><b data-value="${name}">0%</b></div>`).join('');
  }
  camera(active, error = '') { this.el.cameraStatus.textContent = active ? 'Camera active' : 'Camera off'; this.el.cameraStatus.className = `status ${active ? 'status-active' : 'status-idle'}`; this.el.startCamera.disabled = active; this.el.stopCamera.disabled = !active; this.el.cameraEmpty.hidden = active; this.el.cameraError.textContent = error; }
  model(ready, error = '') { this.el.modelStatus.textContent = ready ? 'Model ready' : error || 'Loading model…'; this.el.modelStatus.className = `status ${ready ? 'status-active' : 'status-idle'}`; }
  face(found) { this.el.faceStatus.textContent = found ? 'Face detected · processing locally' : 'No face detected'; }
  fps(value) { this.el.frameRate.textContent = value ? `${value} fps` : '— fps'; }
  result(result) {
    const expression = result?.expression || 'Waiting'; this.el.expressionIcon.textContent = ICONS[expression]; this.el.expressionLabel.textContent = expression; this.el.expressionDescription.textContent = DESCRIPTIONS[expression];
    this.el.expressionScore.textContent = result ? pct(result.score) : '—'; this.el.confidenceScore.textContent = result ? pct(result.confidence) : '—';
    this.el.expressionMeter.style.width = result ? pct(result.score) : '0%'; this.el.confidenceMeter.style.width = result ? pct(result.confidence) : '0%';
    if (result) EXPRESSION_ORDER.forEach(name => { this.chart.querySelector(`[data-score="${name}"]`).style.width = pct(result.scores[name]); this.chart.querySelector(`[data-value="${name}"]`).textContent = pct(result.scores[name]); });
  }
  history(items) { this.el.historyList.innerHTML = items.length ? items.map(item => `<div class="history-item"><span class="history-dot ${item.expression.toLowerCase()}"></span><strong>${item.expression}</strong><span>${pct(item.score)}</span><time>${item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time></div>`).join('') : '<p class="empty-history">No expression changes yet.</p>'; }
}
