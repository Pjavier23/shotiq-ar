// aiCoach.ts - Post-session coaching tips based on form scores

export interface SessionStats {
  makes: number;
  misses: number;
  avgFormScore: number;
  avgElbowScore: number;
  avgReleaseScore: number;
  avgFollowScore: number;
  streak: number;
  totalShots: number;
}

export interface CoachingTip {
  category: string;
  tip: string;
  drill: string;
  priority: 'high' | 'medium' | 'low';
}

const ELBOW_TIPS: CoachingTip[] = [
  {
    category: 'Elbow Alignment',
    tip: "Your elbow is flaring out. Think 'L-shape' — keep it directly under the ball.",
    drill: 'Wall shooting drill: stand 2 feet from a wall and shoot without hitting it.',
    priority: 'high',
  },
  {
    category: 'Elbow Alignment',
    tip: 'Elbow angle is too wide at release. Try the "BEEF" technique: Balance, Eyes, Elbow, Follow-through.',
    drill: 'One-hand form shooting from 3 feet out, 20 reps.',
    priority: 'medium',
  },
];

const RELEASE_TIPS: CoachingTip[] = [
  {
    category: 'Release Height',
    tip: 'You\'re releasing too low. Taller defenders will block that. Get it up above your forehead!',
    drill: 'Lay on your back and shoot straight up — this builds muscle memory for high release.',
    priority: 'high',
  },
  {
    category: 'Release Height',
    tip: 'Release point is inconsistent. Find a consistent spot 2 inches above your forehead.',
    drill: 'Mirror drill: stand in front of a mirror, practice release point 50x without a ball.',
    priority: 'medium',
  },
];

const FOLLOW_THROUGH_TIPS: CoachingTip[] = [
  {
    category: 'Follow-Through',
    tip: 'No follow-through detected. "Reach into the cookie jar" — hold your follow-through for 2 seconds.',
    drill: 'Hold your follow-through pose until the ball hits the rim/backboard.',
    priority: 'high',
  },
  {
    category: 'Follow-Through',
    tip: 'Inconsistent follow-through. Your wrist should snap down like you\'re "waving goodbye."',
    drill: 'Wrist snap drill: hold the ball in shooting hand, snap wrist 30x without full shot.',
    priority: 'medium',
  },
];

const SHOOTING_PCT_TIPS: CoachingTip[] = [
  {
    category: 'Consistency',
    tip: 'Focus on routine: same footwork, same grip, same breath every single shot.',
    drill: 'Pre-shot routine drill: develop a 3-step routine and repeat it 100 times.',
    priority: 'medium',
  },
  {
    category: 'Hot Streak',
    tip: "You're in the zone! Don't change a thing. Trust the process.",
    drill: 'Keep riding the hot hand — attempt 10 more shots from your favorite spot.',
    priority: 'low',
  },
];

export function generateCoachingTips(stats: SessionStats): CoachingTip[] {
  const tips: CoachingTip[] = [];

  // Elbow coaching
  if (stats.avgElbowScore < 60) {
    tips.push(ELBOW_TIPS[0]);
  } else if (stats.avgElbowScore < 75) {
    tips.push(ELBOW_TIPS[1]);
  }

  // Release height coaching
  if (stats.avgReleaseScore < 60) {
    tips.push(RELEASE_TIPS[0]);
  } else if (stats.avgReleaseScore < 75) {
    tips.push(RELEASE_TIPS[1]);
  }

  // Follow-through coaching
  if (stats.avgFollowScore < 60) {
    tips.push(FOLLOW_THROUGH_TIPS[0]);
  } else if (stats.avgFollowScore < 75) {
    tips.push(FOLLOW_THROUGH_TIPS[1]);
  }

  // Shooting percentage
  const pct = stats.totalShots > 0 ? stats.makes / stats.totalShots : 0;
  if (pct < 0.3 && stats.totalShots >= 5) {
    tips.push(SHOOTING_PCT_TIPS[0]);
  } else if (pct >= 0.7 && stats.totalShots >= 5) {
    tips.push(SHOOTING_PCT_TIPS[1]);
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return tips.slice(0, 3); // Max 3 tips per session
}

export function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 55) return 'D';
  return 'F';
}

export function getMotivationalQuote(score: number): string {
  if (score >= 85) return '"Shooters gonna shoot." — Klay Thompson';
  if (score >= 70) return '"Hard work beats talent when talent doesn\'t work hard." — Kevin Durant';
  if (score >= 55) return '"Every day is a new opportunity to improve." — LeBron James';
  return '"The only way to get better is to keep shooting." — Stephen Curry';
}
