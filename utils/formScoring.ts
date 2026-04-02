// formScoring.ts - Elbow angle, release height, follow-through scoring

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface FormScore {
  overall: number;       // 0–100
  elbowAngle: number;    // 0–100
  releaseHeight: number; // 0–100
  followThrough: number; // 0–100
  feedback: string[];
}

/** Degrees between three points (vertex at b) */
export function angleBetween(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/** Score elbow angle at release — ideal is ~90° */
export function scoreElbow(
  shoulder: Keypoint,
  elbow: Keypoint,
  wrist: Keypoint
): { score: number; angle: number } {
  const angle = angleBetween(shoulder, elbow, wrist);
  // Ideal: 85–100°. Penalty for < 70° (too flat) or > 120° (too deep)
  let score = 100;
  if (angle < 70) score = Math.max(0, 100 - (70 - angle) * 3);
  else if (angle > 120) score = Math.max(0, 100 - (angle - 120) * 2);
  return { score: Math.round(score), angle: Math.round(angle) };
}

/** Score release height — wrist should be above eye level */
export function scoreReleaseHeight(
  wrist: Keypoint,
  nose: Keypoint,
  frameHeight: number
): { score: number } {
  // Wrist y < nose y means wrist is above nose (screen coordinates, y increases downward)
  const diff = nose.y - wrist.y; // positive = wrist is above nose
  const normalized = diff / (frameHeight * 0.3); // normalize to frame
  const score = Math.max(0, Math.min(100, 50 + normalized * 50));
  return { score: Math.round(score) };
}

/** Score follow-through — wrist should be snapped down (high final position) */
export function scoreFollowThrough(
  wristPositions: Keypoint[],
  frameHeight: number
): { score: number } {
  if (wristPositions.length < 3) return { score: 70 };
  // Look at wrist arc: should rise then possibly snap
  const maxY = Math.min(...wristPositions.map((p) => p.y)); // lowest y = highest position
  const normalized = 1 - maxY / frameHeight;
  const score = Math.max(0, Math.min(100, normalized * 130));
  return { score: Math.round(score) };
}

/** Aggregate form score */
export function computeFormScore(
  keypoints: Record<string, Keypoint>,
  wristHistory: Keypoint[],
  frameWidth: number,
  frameHeight: number,
  handedness: 'left' | 'right' = 'right'
): FormScore {
  const feedback: string[] = [];

  const side = handedness === 'right' ? 'right' : 'left';
  const shoulder = keypoints[`${side}_shoulder`];
  const elbow = keypoints[`${side}_elbow`];
  const wrist = keypoints[`${side}_wrist`];
  const nose = keypoints['nose'];

  let elbowScore = 70;
  let releaseScore = 70;
  let followScore = 70;
  let elbowAngleDeg = 90;

  if (shoulder && elbow && wrist) {
    const { score, angle } = scoreElbow(shoulder, elbow, wrist);
    elbowScore = score;
    elbowAngleDeg = angle;
    if (angle < 70) feedback.push('Bend elbow more at release');
    else if (angle > 120) feedback.push('Elbow too high — tuck it in');
    else feedback.push('Good elbow angle!');
  }

  if (wrist && nose) {
    const { score } = scoreReleaseHeight(wrist, nose, frameHeight);
    releaseScore = score;
    if (score < 50) feedback.push('Release higher — get it above your head');
    else feedback.push('Great release height!');
  }

  if (wristHistory.length > 0) {
    const { score } = scoreFollowThrough(wristHistory, frameHeight);
    followScore = score;
    if (score < 50) feedback.push('Follow through — finish with a "goose neck"');
    else feedback.push('Nice follow-through!');
  }

  const overall = Math.round((elbowScore + releaseScore + followScore) / 3);

  return {
    overall,
    elbowAngle: elbowScore,
    releaseHeight: releaseScore,
    followThrough: followScore,
    feedback,
  };
}
