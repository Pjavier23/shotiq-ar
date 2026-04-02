// SkeletonOverlay.tsx - SVG skeleton drawn over camera feed
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { PoseKeypoints } from '../hooks/usePoseDetection';

interface SkeletonOverlayProps {
  keypoints: PoseKeypoints;
  width: number;
  height: number;
  color?: string;
}

// MoveNet keypoint connections for skeleton
const SKELETON_CONNECTIONS: [string, string][] = [
  // Head
  ['left_ear', 'left_eye'],
  ['left_eye', 'nose'],
  ['nose', 'right_eye'],
  ['right_eye', 'right_ear'],
  // Shoulders
  ['left_shoulder', 'right_shoulder'],
  // Arms
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  // Torso
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  // Legs
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

const KEYPOINT_RADIUS = 6;
const LINE_STROKE_WIDTH = 3;

export const SkeletonOverlay: React.FC<SkeletonOverlayProps> = ({
  keypoints,
  width,
  height,
  color = '#FF6B00', // NBA orange
}) => {
  // Convert normalized (0-100) to pixel coordinates
  const toPixel = (normalized: number, dimension: number) =>
    (normalized / 100) * dimension;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <G>
          {/* Draw bones/connections */}
          {SKELETON_CONNECTIONS.map(([from, to]) => {
            const kpFrom = keypoints[from];
            const kpTo = keypoints[to];
            if (!kpFrom || !kpTo) return null;
            if ((kpFrom.score ?? 0) < 0.3 || (kpTo.score ?? 0) < 0.3) return null;

            return (
              <Line
                key={`${from}-${to}`}
                x1={toPixel(kpFrom.x, width)}
                y1={toPixel(kpFrom.y, height)}
                x2={toPixel(kpTo.x, width)}
                y2={toPixel(kpTo.y, height)}
                stroke={color}
                strokeWidth={LINE_STROKE_WIDTH}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}

          {/* Draw joints */}
          {Object.entries(keypoints).map(([name, kp]) => {
            if ((kp.score ?? 0) < 0.3) return null;
            const cx = toPixel(kp.x, width);
            const cy = toPixel(kp.y, height);

            // Wrists get a bigger, brighter circle
            const isWrist = name.includes('wrist');
            const r = isWrist ? KEYPOINT_RADIUS + 3 : KEYPOINT_RADIUS;
            const fillColor = isWrist ? '#FFD700' : color; // gold wrists

            return (
              <Circle
                key={name}
                cx={cx}
                cy={cy}
                r={r}
                fill={fillColor}
                opacity={0.9}
                stroke="#000"
                strokeWidth={1}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
