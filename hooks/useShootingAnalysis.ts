// useShootingAnalysis.ts - Shot detection + form scoring hook
import { useRef, useState, useCallback } from 'react';
import { PoseKeypoints } from './usePoseDetection';
import { computeFormScore, FormScore } from '../utils/formScoring';

export type ShotResult = 'make' | 'miss' | null;

export interface ShotEvent {
  timestamp: number;
  result: ShotResult;
  formScore: FormScore;
}

interface UseShootingAnalysisOptions {
  handedness?: 'left' | 'right';
  frameWidth?: number;
  frameHeight?: number;
}

// Phase state machine for shot detection
type ShotPhase = 'idle' | 'loading' | 'rising' | 'releasing' | 'follow';

const WRIST_HISTORY_SIZE = 20;
const RISE_THRESHOLD = 5;    // % of frame height the wrist must rise
const FALL_THRESHOLD = 3;    // % of frame height the wrist must fall after peak
const MIN_SHOT_INTERVAL_MS = 1000;

export function useShootingAnalysis(options: UseShootingAnalysisOptions = {}) {
  const { handedness = 'right', frameWidth = 100, frameHeight = 100 } = options;

  const [shotCount, setShotCount] = useState(0);
  const [makes, setMakes] = useState(0);
  const [misses, setMisses] = useState(0);
  const [currentFormScore, setCurrentFormScore] = useState<FormScore | null>(null);
  const [lastShotResult, setLastShotResult] = useState<ShotResult>(null);
  const [streak, setStreak] = useState(0);
  const [shotHistory, setShotHistory] = useState<ShotEvent[]>([]);

  const phaseRef = useRef<ShotPhase>('idle');
  const wristHistoryRef = useRef<{ y: number; ts: number }[]>([]);
  const wristKpHistoryRef = useRef<Array<{ x: number; y: number; score?: number }>>([]);
  const peakYRef = useRef<number>(100); // screen coords: low value = high position
  const lastShotTimeRef = useRef<number>(0);

  /** Determine if a shot was made based on wrist trajectory and hoop position */
  const guessShotResult = useCallback(
    (hoopY: number | null, wristPeakY: number): ShotResult => {
      // If we have a hoop position, check if peak was above it
      if (hoopY !== null) {
        // wristPeakY < hoopY means wrist rose above hoop (good release)
        return wristPeakY < hoopY ? 'make' : 'miss';
      }
      // Without hoop, 60% make rate as default (user can mark manually)
      return Math.random() < 0.6 ? 'make' : 'miss';
    },
    []
  );

  const processPose = useCallback(
    (keypoints: PoseKeypoints, hoopPosition: { x: number; y: number } | null) => {
      const side = handedness === 'right' ? 'right' : 'left';
      const wrist = keypoints[`${side}_wrist`];
      if (!wrist || (wrist.score ?? 0) < 0.3) return;

      const now = Date.now();
      const wristY = wrist.y; // normalized 0–100, lower = higher on screen

      // Maintain rolling wrist position history
      wristHistoryRef.current = [
        ...wristHistoryRef.current.slice(-(WRIST_HISTORY_SIZE - 1)),
        { y: wristY, ts: now },
      ];
      wristKpHistoryRef.current = [
        ...wristKpHistoryRef.current.slice(-(WRIST_HISTORY_SIZE - 1)),
        { x: wrist.x, y: wrist.y, score: wrist.score },
      ];

      const history = wristHistoryRef.current;
      if (history.length < 5) return;

      const recentY = history.slice(-5).map((h) => h.y);
      const avgRecent = recentY.reduce((a, b) => a + b, 0) / recentY.length;
      const prevY = history.slice(-10, -5).map((h) => h.y);
      const avgPrev = prevY.length > 0 ? prevY.reduce((a, b) => a + b, 0) / prevY.length : avgRecent;

      const rising = avgPrev - avgRecent > RISE_THRESHOLD; // y decreasing = rising up
      const falling = avgRecent - avgPrev > FALL_THRESHOLD;

      switch (phaseRef.current) {
        case 'idle':
          if (rising) {
            phaseRef.current = 'rising';
            peakYRef.current = avgRecent;
          }
          break;

        case 'rising':
          if (avgRecent < peakYRef.current) {
            peakYRef.current = avgRecent; // update peak
          }
          if (falling) {
            phaseRef.current = 'releasing';
          }
          break;

        case 'releasing':
          if (falling || avgRecent > peakYRef.current + FALL_THRESHOLD * 2) {
            // Shot released
            const timeSinceLast = now - lastShotTimeRef.current;
            if (timeSinceLast > MIN_SHOT_INTERVAL_MS) {
              lastShotTimeRef.current = now;
              phaseRef.current = 'follow';

              // Compute form score
              const formScore = computeFormScore(
                keypoints,
                wristKpHistoryRef.current.map((k) => ({ ...k, name: `${side}_wrist` })),
                frameWidth,
                frameHeight,
                handedness
              );

              // Determine make/miss
              const result = guessShotResult(hoopPosition?.y ?? null, peakYRef.current);

              // Update state
              setCurrentFormScore(formScore);
              setLastShotResult(result);
              setShotCount((c) => c + 1);

              if (result === 'make') {
                setMakes((m) => m + 1);
                setStreak((s) => s + 1);
              } else {
                setMisses((m) => m + 1);
                setStreak(0);
              }

              const event: ShotEvent = {
                timestamp: now,
                result,
                formScore,
              };
              setShotHistory((h) => [...h, event]);

              // Reset after brief follow-through window
              setTimeout(() => {
                phaseRef.current = 'idle';
                peakYRef.current = 100;
              }, 800);
            } else {
              phaseRef.current = 'idle';
            }
          }
          break;

        case 'follow':
          // waiting for timeout reset
          break;
      }
    },
    [handedness, frameWidth, frameHeight, guessShotResult]
  );

  const markShot = useCallback((result: 'make' | 'miss') => {
    // Manual override for make/miss
    setLastShotResult(result);
    if (result === 'make') {
      setMakes((m) => m + 1);
      setStreak((s) => s + 1);
    } else {
      setMisses((m) => m + 1);
      setStreak(0);
    }
    setShotCount((c) => c + 1);
  }, []);

  const resetSession = useCallback(() => {
    setShotCount(0);
    setMakes(0);
    setMisses(0);
    setCurrentFormScore(null);
    setLastShotResult(null);
    setStreak(0);
    setShotHistory([]);
    phaseRef.current = 'idle';
    wristHistoryRef.current = [];
    wristKpHistoryRef.current = [];
    peakYRef.current = 100;
    lastShotTimeRef.current = 0;
  }, []);

  const shootingPct = shotCount > 0 ? Math.round((makes / shotCount) * 100) : 0;

  return {
    shotCount,
    makes,
    misses,
    shootingPct,
    currentFormScore,
    lastShotResult,
    streak,
    shotHistory,
    processPose,
    markShot,
    resetSession,
  };
}
