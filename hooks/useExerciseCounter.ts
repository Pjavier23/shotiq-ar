// useExerciseCounter.ts - Push-up, jumping jack, run-in-place detection
import { useRef, useState, useCallback } from 'react';
import { PoseKeypoints } from './usePoseDetection';

export type ExerciseType = 'pushup' | 'jumpingjack' | 'run';

interface UseExerciseCounterOptions {
  exerciseType: ExerciseType;
}

type PhaseState = 'up' | 'down' | 'open' | 'closed';

export function useExerciseCounter({ exerciseType }: UseExerciseCounterOptions) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<PhaseState>('up');
  const phaseRef = useRef<PhaseState>('up');

  const processFrame = useCallback(
    (keypoints: PoseKeypoints) => {
      switch (exerciseType) {
        case 'pushup':
          detectPushup(keypoints);
          break;
        case 'jumpingjack':
          detectJumpingJack(keypoints);
          break;
        case 'run':
          detectRun(keypoints);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exerciseType]
  );

  function detectPushup(keypoints: PoseKeypoints) {
    const lShoulder = keypoints['left_shoulder'];
    const lElbow = keypoints['left_elbow'];
    const lWrist = keypoints['left_wrist'];

    if (!lShoulder || !lElbow || !lWrist) return;

    // When elbow y is close to shoulder y, arms are extended (up position)
    // When elbow y is much lower than shoulder y, body is down
    const elbowDiff = lElbow.y - lShoulder.y;

    if (elbowDiff < 5 && phaseRef.current === 'down') {
      phaseRef.current = 'up';
      setPhase('up');
      setCount((c) => c + 1);
    } else if (elbowDiff > 15 && phaseRef.current === 'up') {
      phaseRef.current = 'down';
      setPhase('down');
    }
  }

  function detectJumpingJack(keypoints: PoseKeypoints) {
    const lWrist = keypoints['left_wrist'];
    const rWrist = keypoints['right_wrist'];
    const lShoulder = keypoints['left_shoulder'];
    const rShoulder = keypoints['right_shoulder'];

    if (!lWrist || !rWrist || !lShoulder || !rShoulder) return;

    // Arms raised: wrists above shoulders (y is lower in screen coords)
    const armsRaised = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;

    if (armsRaised && phaseRef.current === 'closed') {
      phaseRef.current = 'open';
      setPhase('open');
    } else if (!armsRaised && phaseRef.current === 'open') {
      phaseRef.current = 'closed';
      setPhase('closed');
      setCount((c) => c + 1);
    }
  }

  const lastHipYRef = useRef<number | null>(null);
  const stepCountRef = useRef(0);

  function detectRun(keypoints: PoseKeypoints) {
    const lKnee = keypoints['left_knee'];
    const rKnee = keypoints['right_knee'];
    const lHip = keypoints['left_hip'];

    if (!lKnee || !rKnee || !lHip) return;

    // Detect alternating knee raises
    const lKneeRaised = lHip.y - lKnee.y > 10;
    const rKneeRaised = lHip.y - rKnee.y > 10;

    const hipY = lHip.y;
    if (lastHipYRef.current !== null) {
      const diff = Math.abs(hipY - lastHipYRef.current);
      if (diff > 2 && (lKneeRaised || rKneeRaised)) {
        stepCountRef.current++;
        if (stepCountRef.current % 2 === 0) {
          setCount((c) => c + 1); // count strides, not steps
        }
      }
    }
    lastHipYRef.current = hipY;
  }

  const reset = useCallback(() => {
    setCount(0);
    setPhase('up');
    phaseRef.current = 'up';
    lastHipYRef.current = null;
    stepCountRef.current = 0;
  }, []);

  return { count, phase, processFrame, reset };
}
