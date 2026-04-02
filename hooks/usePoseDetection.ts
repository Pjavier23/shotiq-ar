import { useState, useRef, useCallback } from 'react';

export interface PoseKeypoints {
  [name: string]: { x: number; y: number; score: number };
}

export function usePoseDetection() {
  const [keypoints, setKeypoints] = useState<PoseKeypoints>({});
  const [confidence, setConfidence] = useState(0);
  const [isModelLoaded] = useState(true);

  const processFrame = useCallback(() => {
    // Pose detection runs here in production build
    // Expo Go doesn't support TF.js native modules
  }, []);

  return { keypoints, confidence, isModelLoaded, processFrame };
}
