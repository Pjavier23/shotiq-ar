// ShotChart.tsx - Half-court shot chart visualization
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Rect,
  Text as SvgText,
  G,
} from 'react-native-svg';

interface ShotPoint {
  x: number; // 0–100 normalized
  y: number; // 0–100 normalized
  made: boolean;
}

interface ShotChartProps {
  shots: ShotPoint[];
  width?: number;
  height?: number;
}

export const ShotChart: React.FC<ShotChartProps> = ({
  shots,
  width = 300,
  height = 220,
}) => {
  const toX = (n: number) => (n / 100) * width;
  const toY = (n: number) => (n / 100) * height;

  // Half-court dimensions (simplified SVG paths)
  const paintW = width * 0.38;
  const paintH = height * 0.5;
  const paintX = (width - paintW) / 2;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Court background */}
        <Rect x={0} y={0} width={width} height={height} fill="#1a1a2e" rx={8} />

        {/* Half-court line */}
        <Line
          x1={0}
          y1={height}
          x2={width}
          y2={height}
          stroke="#333"
          strokeWidth={2}
        />

        {/* Paint / key */}
        <Rect
          x={paintX}
          y={0}
          width={paintW}
          height={paintH}
          fill="none"
          stroke="#444"
          strokeWidth={2}
        />

        {/* Free throw circle */}
        <Circle
          cx={width / 2}
          cy={paintH}
          r={paintW * 0.38}
          fill="none"
          stroke="#444"
          strokeWidth={2}
          strokeDasharray="6,4"
        />

        {/* Basket */}
        <Circle
          cx={width / 2}
          cy={height * 0.08}
          r={8}
          fill="none"
          stroke="#FF6B00"
          strokeWidth={2}
        />

        {/* Three-point arc (simplified) */}
        <Path
          d={`M ${width * 0.08} ${height * 0.72} 
              Q ${width / 2} ${-height * 0.1} ${width * 0.92} ${height * 0.72}`}
          fill="none"
          stroke="#444"
          strokeWidth={2}
        />

        {/* Shot markers */}
        {shots.map((shot, i) => (
          <G key={i}>
            {shot.made ? (
              // Made: filled orange circle
              <Circle
                cx={toX(shot.x)}
                cy={toY(shot.y)}
                r={6}
                fill="#FF6B00"
                opacity={0.85}
              />
            ) : (
              // Miss: X mark
              <G>
                <Line
                  x1={toX(shot.x) - 5}
                  y1={toY(shot.y) - 5}
                  x2={toX(shot.x) + 5}
                  y2={toY(shot.y) + 5}
                  stroke="#F44336"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <Line
                  x1={toX(shot.x) + 5}
                  y1={toY(shot.y) - 5}
                  x2={toX(shot.x) - 5}
                  y2={toY(shot.y) + 5}
                  stroke="#F44336"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </G>
            )}
          </G>
        ))}

        {/* Legend */}
        <Circle cx={12} cy={height - 20} r={5} fill="#FF6B00" />
        <SvgText x={20} y={height - 16} fill="#888" fontSize={10}>
          Make
        </SvgText>
        <Line
          x1={55}
          y1={height - 24}
          x2={63}
          y2={height - 16}
          stroke="#F44336"
          strokeWidth={2}
        />
        <Line
          x1={63}
          y1={height - 24}
          x2={55}
          y2={height - 16}
          stroke="#F44336"
          strokeWidth={2}
        />
        <SvgText x={68} y={height - 16} fill="#888" fontSize={10}>
          Miss
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});
