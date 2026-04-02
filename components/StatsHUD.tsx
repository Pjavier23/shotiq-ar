// StatsHUD.tsx - Live stats overlay during session
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsHUDProps {
  shotCount: number;
  makes: number;
  misses: number;
  shootingPct: number;
  formScore: number | null;
  streak: number;
  confidence: number; // pose detection confidence
}

export const StatsHUD: React.FC<StatsHUDProps> = ({
  shotCount,
  makes,
  misses,
  shootingPct,
  formScore,
  streak,
  confidence,
}) => {
  const getFormColor = (score: number | null) => {
    if (score === null) return '#888';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getPoseColor = (conf: number) => {
    if (conf > 0.7) return '#4CAF50';
    if (conf > 0.4) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      {/* Top row: shots */}
      <View style={styles.topRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{shotCount}</Text>
          <Text style={styles.statLabel}>SHOTS</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{makes}</Text>
          <Text style={styles.statLabel}>MAKES</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#F44336' }]}>{misses}</Text>
          <Text style={styles.statLabel}>MISSES</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{shootingPct}%</Text>
          <Text style={styles.statLabel}>FG%</Text>
        </View>
      </View>

      {/* Bottom row: form score + streak */}
      <View style={styles.bottomRow}>
        <View style={styles.formBadge}>
          <Text style={styles.formLabel}>FORM</Text>
          <Text style={[styles.formScore, { color: getFormColor(formScore) }]}>
            {formScore !== null ? `${formScore}` : '--'}
          </Text>
        </View>

        {streak >= 2 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak} STREAK</Text>
          </View>
        )}

        {/* Pose detection indicator */}
        <View style={styles.poseBadge}>
          <View
            style={[
              styles.poseDot,
              { backgroundColor: getPoseColor(confidence) },
            ]}
          />
          <Text style={styles.poseLabel}>POSE</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 1,
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  formLabel: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  formScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  streakText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '800',
  },
  poseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  poseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  poseLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
