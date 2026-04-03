// useExerciseCounter.ts - Accelerometer-based exercise counting for Expo Go
import { useRef, useState, useEffect, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';

export type ExerciseType = 'pushup' | 'jumpingjack' | 'run';

interface UseExerciseCounterOptions {
  exerciseType: ExerciseType;
  isActive?: boolean;
}

// --- Thresholds ---
// Push-up: Y-axis dip (phone held horizontally)
//   Down phase: y < -0.55 (body lowering, phone tilts)
//   Up phase:   y > -0.2  (body rising back up)
const PUSHUP_DOWN_THRESHOLD = -0.55;
const PUSHUP_UP_THRESHOLD   = -0.2;

// Jumping Jack: X-axis swing (phone held vertically in hand)
//   Arms out: |x| > 0.55 (phone tilts as arm spreads)
//   Arms in:  |x| < 0.25
const JACK_OPEN_THRESHOLD   = 0.55;
const JACK_CLOSED_THRESHOLD = 0.25;

// Run in place: Z-axis bounce (phone in pocket/waist)
//   Step detected: |z| > 1.4 (impact spike)
//   Debounce: 300ms between steps
const RUN_STEP_THRESHOLD    = 1.4;
const RUN_STEP_DEBOUNCE_MS  = 300;

export function useExerciseCounter({ exerciseType, isActive = true }: UseExerciseCounterOptions) {
  const [count, setCount] = useState(0);

  // Phase refs (avoid stale closures with refs)
  const phaseRef       = useRef<'up' | 'down' | 'open' | 'closed'>('up');
  const lastStepRef    = useRef<number>(0);
  const countRef       = useRef(0);

  const increment = useCallback(() => {
    countRef.current += 1;
    setCount(countRef.current);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    Accelerometer.setUpdateInterval(80); // ~12 Hz

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      switch (exerciseType) {
        case 'pushup': {
          // Phone held face-down (screen parallel to floor) while doing push-ups
          // Y decreases (more negative) as body goes down
          if (y < PUSHUP_DOWN_THRESHOLD && phaseRef.current === 'up') {
            phaseRef.current = 'down';
          } else if (y > PUSHUP_UP_THRESHOLD && phaseRef.current === 'down') {
            phaseRef.current = 'up';
            increment();
          }
          break;
        }

        case 'jumpingjack': {
          // Phone held vertically in hand
          // Arms spreading outward → X-axis swing
          const absX = Math.abs(x);
          if (absX > JACK_OPEN_THRESHOLD && phaseRef.current === 'closed') {
            phaseRef.current = 'open';
          } else if (absX < JACK_CLOSED_THRESHOLD && phaseRef.current === 'open') {
            phaseRef.current = 'closed';
            increment();
          }
          break;
        }

        case 'run': {
          // Phone on waist/pocket — detect vertical bounce
          const absZ = Math.abs(z);
          const now  = Date.now();
          if (absZ > RUN_STEP_THRESHOLD && now - lastStepRef.current > RUN_STEP_DEBOUNCE_MS) {
            lastStepRef.current = now;
            // Count every 2 steps as 1 rep (left+right = 1 cycle)
            if (countRef.current % 2 === 0) {
              // track internal step count separately
            }
            increment(); // count raw steps; display shows stride count = steps/2
          }
          break;
        }
      }
    });

    return () => sub.remove();
  }, [exerciseType, isActive, increment]);

  const reset = useCallback(() => {
    countRef.current = 0;
    setCount(0);
    phaseRef.current = 'up';
    lastStepRef.current = 0;
  }, []);

  // For run, display stride count (steps / 2); for others show raw reps
  const displayCount = exerciseType === 'run' ? Math.floor(count / 2) : count;

  return { count: displayCount, reset };
}
