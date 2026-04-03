// SummaryScreen.tsx - Post-session stats + AI coach tips
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import * as Speech from 'expo-speech';
import { ShotChart } from '../components/ShotChart';
import { generateCoachingTips, getGrade, getMotivationalQuote } from '../utils/aiCoach';
import { PlayerProfile } from './HomeScreen';

interface SessionData {
  id: string;
  profileId: string;
  profileName: string;
  date: string;
  duration: number;
  shotCount: number;
  makes: number;
  misses: number;
  shootingPct: number;
  avgFormScore: number;
  shotHistory: Array<{
    timestamp: number;
    result: 'make' | 'miss' | null;
    formScore: { overall: number; elbowAngle: number; releaseHeight: number; followThrough: number };
  }>;
}

interface SummaryScreenProps {
  navigation: any;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SummaryScreen({ navigate, sessionData }: { navigate: (s: any) => void; sessionData?: any }) {
  const session = sessionData || {};
  const profile = null;

  const tips = generateCoachingTips({
    makes: session.makes,
    misses: session.misses,
    avgFormScore: session.avgFormScore,
    avgElbowScore:
      session.shotHistory.reduce((s, h) => s + h.formScore.elbowAngle, 0) /
        Math.max(session.shotHistory.length, 1),
    avgReleaseScore:
      session.shotHistory.reduce((s, h) => s + h.formScore.releaseHeight, 0) /
        Math.max(session.shotHistory.length, 1),
    avgFollowScore:
      session.shotHistory.reduce((s, h) => s + h.formScore.followThrough, 0) /
        Math.max(session.shotHistory.length, 1),
    streak: 0,
    totalShots: session.shotCount,
  });

  const grade = getGrade(session.avgFormScore);
  const quote = getMotivationalQuote(session.avgFormScore);

  // Shot chart data
  const shotPoints = session.shotHistory.map((s, i) => ({
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    made: s.result === 'make',
  }));

  useEffect(() => {
    // Voice summary after a short delay
    const summary =
      session.shotCount > 0
        ? `Session complete! ${session.makes} for ${session.shotCount}. Form score: ${Math.round(session.avgFormScore)} out of 100. ${grade} grade.`
        : 'Session complete! No shots recorded.';
    setTimeout(() => Speech.speak(summary, { rate: 0.9 }), 800);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Session Complete</Text>
          <Text style={styles.subtitle}>
            {profile.name} #{profile.jersey} • {formatDuration(session.duration)}
          </Text>
        </View>

        {/* Grade card */}
        <View style={styles.gradeCard}>
          <Text style={styles.gradeLabel}>FORM GRADE</Text>
          <Text style={styles.grade}>{grade}</Text>
          <Text style={styles.gradeScore}>{Math.round(session.avgFormScore)}/100</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{session.shotCount}</Text>
            <Text style={styles.statLabel}>SHOTS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{session.makes}</Text>
            <Text style={styles.statLabel}>MAKES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>{session.misses}</Text>
            <Text style={styles.statLabel}>MISSES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{session.shootingPct}%</Text>
            <Text style={styles.statLabel}>FG%</Text>
          </View>
        </View>

        {/* Form breakdown */}
        {session.shotHistory.length > 0 && (
          <View style={styles.formBreakdown}>
            <Text style={styles.sectionTitle}>Form Breakdown</Text>
            {[
              {
                label: 'Elbow Angle',
                score: Math.round(
                  session.shotHistory.reduce((s, h) => s + h.formScore.elbowAngle, 0) /
                    session.shotHistory.length
                ),
                icon: '💪',
              },
              {
                label: 'Release Height',
                score: Math.round(
                  session.shotHistory.reduce((s, h) => s + h.formScore.releaseHeight, 0) /
                    session.shotHistory.length
                ),
                icon: '📏',
              },
              {
                label: 'Follow Through',
                score: Math.round(
                  session.shotHistory.reduce((s, h) => s + h.formScore.followThrough, 0) /
                    session.shotHistory.length
                ),
                icon: '🙌',
              },
            ].map((item) => (
              <View key={item.label} style={styles.formRow}>
                <Text style={styles.formIcon}>{item.icon}</Text>
                <Text style={styles.formLabel}>{item.label}</Text>
                <View style={styles.formBarBg}>
                  <View
                    style={[
                      styles.formBarFill,
                      {
                        width: `${item.score}%`,
                        backgroundColor: item.score >= 70 ? '#4CAF50' : item.score >= 50 ? '#FF9800' : '#F44336',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.formScore}>{item.score}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Shot chart */}
        {shotPoints.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Shot Chart</Text>
            <ShotChart shots={shotPoints} width={320} height={220} />
          </View>
        )}

        {/* AI Coach Tips */}
        {tips.length > 0 && (
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>🧑‍🏫 Coach's Corner</Text>
            {tips.map((tip, i) => (
              <View key={i} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipCategory}>{tip.category}</Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      tip.priority === 'high'
                        ? styles.highPriority
                        : tip.priority === 'medium'
                        ? styles.medPriority
                        : styles.lowPriority,
                    ]}
                  >
                    <Text style={styles.priorityText}>{tip.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.tipText}>{tip.tip}</Text>
                <View style={styles.drillBox}>
                  <Text style={styles.drillLabel}>DRILL</Text>
                  <Text style={styles.drillText}>{tip.drill}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Motivational quote */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>{quote}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.newSessionBtn}
            onPress={() => navigate('Session', { profile })}
          >
            <Text style={styles.newSessionBtnText}>🎯 New Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigate('Home')}
          >
            <Text style={styles.homeBtnText}>← Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 20, paddingTop: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#666', fontSize: 14, marginTop: 4 },

  gradeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  gradeLabel: { color: '#888', fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  grade: { color: '#FF6B00', fontSize: 72, fontWeight: '900', marginVertical: 4 },
  gradeScore: { color: '#aaa', fontSize: 16 },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 2 },

  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },

  formBreakdown: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  formIcon: { fontSize: 16, width: 24 },
  formLabel: { color: '#aaa', fontSize: 13, flex: 1 },
  formBarBg: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    width: 80,
  },
  formBarFill: { height: '100%', borderRadius: 4 },
  formScore: { color: '#fff', fontSize: 13, fontWeight: '700', width: 28, textAlign: 'right' },

  chartSection: { marginBottom: 20, alignItems: 'center' },

  tipsSection: { marginBottom: 20 },
  tipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B00',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  tipCategory: { color: '#FF6B00', fontSize: 12, fontWeight: '800', letterSpacing: 1, flex: 1 },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  highPriority: { backgroundColor: 'rgba(244, 67, 54, 0.2)' },
  medPriority: { backgroundColor: 'rgba(255, 152, 0, 0.2)' },
  lowPriority: { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  priorityText: { fontSize: 9, fontWeight: '800', color: '#aaa', letterSpacing: 1 },
  tipText: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  drillBox: { backgroundColor: '#111', borderRadius: 8, padding: 10 },
  drillLabel: { color: '#FF6B00', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  drillText: { color: '#aaa', fontSize: 12, lineHeight: 18 },

  quoteBox: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  quoteText: { color: '#666', fontSize: 13, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },

  actions: { gap: 10 },
  newSessionBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  newSessionBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  homeBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText: { color: '#888', fontSize: 15, fontWeight: '700' },
});
