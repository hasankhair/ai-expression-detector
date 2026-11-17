// Transparent, deliberately conservative visual-expression heuristic. These labels
// describe visible patterns only, not a person's feelings or state of mind.
export const EXPRESSION_ORDER = ['Happy', 'Sad', 'Angry', 'Surprised', 'Fearful', 'Disgusted', 'Neutral'];

const avg = (...values) => values.reduce((sum, value) => sum + (value || 0), 0) / values.length;
const max = (...values) => Math.max(...values.map(value => value || 0));
const clamp = value => Math.max(0, Math.min(1, value));

function scoreMap(categories) {
  return Object.fromEntries(categories.map(({ categoryName, score }) => [categoryName, score]));
}

export function classifyExpression(categories = [], { sensitivity = 50, minConfidence = 35 } = {}) {
  const b = scoreMap(categories);
  const smile = avg(b.mouthSmileLeft, b.mouthSmileRight);
  const frown = avg(b.mouthFrownLeft, b.mouthFrownRight);
  const browDown = avg(b.browDownLeft, b.browDownRight);
  const browUp = avg(b.browOuterUpLeft, b.browOuterUpRight, b.browInnerUp);
  const eyeWide = avg(b.eyeWideLeft, b.eyeWideRight);
  const eyeBlink = avg(b.eyeBlinkLeft, b.eyeBlinkRight);
  const mouthOpen = max(b.jawOpen, b.mouthOpen);
  const cheek = avg(b.cheekSquintLeft, b.cheekSquintRight);
  const nose = avg(b.noseSneerLeft, b.noseSneerRight);
  const upperLip = max(b.mouthUpperUpLeft, b.mouthUpperUpRight);

  // Multiple cues contribute to every non-neutral class. Scores are heuristic and
  // can be tuned through the sensitivity control; no cue alone decides a label.
  const raw = {
    Happy: clamp(0.57 * smile + 0.23 * cheek + 0.12 * (1 - frown) + 0.08 * (1 - browDown)),
    Sad: clamp(0.42 * frown + 0.25 * b.browInnerUp + 0.20 * (1 - smile) + 0.13 * (1 - eyeWide)),
    Angry: clamp(0.48 * browDown + 0.22 * frown + 0.16 * b.jawForward + 0.14 * (1 - browUp)),
    Surprised: clamp(0.35 * browUp + 0.30 * eyeWide + 0.27 * mouthOpen + 0.08 * (1 - eyeBlink)),
    Fearful: clamp(0.32 * eyeWide + 0.28 * browUp + 0.22 * mouthOpen + 0.18 * frown),
    Disgusted: clamp(0.42 * nose + 0.25 * upperLip + 0.18 * cheek + 0.15 * frown)
  };
  const threshold = clamp((minConfidence / 100) + ((50 - sensitivity) / 250));
  const entries = Object.entries(raw).sort((a, b) => b[1] - a[1]);
  const [name, score] = entries[0];
  const runnerUp = entries[1][1];
  const isExpressive = score >= threshold && (score - runnerUp >= 0.025 || score >= threshold + 0.15);
  const expression = isExpressive ? name : 'Neutral';
  const expressionScore = isExpressive ? score : clamp(1 - Math.max(...Object.values(raw)) * 0.55);
  const cues = { smile, frown, browUp, browDown, eyeWide, mouthOpen, cheek, nose };
  return { expression, score: expressionScore, confidence: isExpressive ? score : 1 - Math.max(...Object.values(raw)), scores: { ...raw, Neutral: expressionScore }, cues, threshold };
}

export class ExpressionSmoother {
  constructor(size = 8, persistence = 5) { this.size = size; this.persistence = persistence; this.frames = []; this.current = 'Neutral'; this.candidate = null; this.candidateCount = 0; }
  reset() { this.frames = []; this.current = 'Neutral'; this.candidate = null; this.candidateCount = 0; }
  push(result) {
    this.frames.push(result); if (this.frames.length > this.size) this.frames.shift();
    const aggregate = EXPRESSION_ORDER.reduce((all, key) => { all[key] = avg(...this.frames.map(frame => frame.scores[key] || 0)); return all; }, {});
    const [expression, score] = Object.entries(aggregate).sort((a, b) => b[1] - a[1])[0];
    if (expression !== this.current) { if (this.candidate === expression) this.candidateCount++; else { this.candidate = expression; this.candidateCount = 1; } if (this.candidateCount >= this.persistence) { this.current = expression; this.candidateCount = 0; } } else { this.candidate = null; this.candidateCount = 0; }
    return { ...result, expression: this.current, score: aggregate[this.current] || score, scores: aggregate };
  }
}
