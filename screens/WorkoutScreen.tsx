// WorkoutScreen.tsx - Push-ups, jumping jacks, run in place
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';

import * as Speech from 'expo-speech';
import { SkeletonOverlay } from '../components/SkeletonOverlay';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useExerciseCounter, ExerciseType } from '../hooks/useExerciseCounter';
import { CameraView, Camera } from 'expo-camera';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const EXERCISES: { type: ExerciseType; label: string; icon: string; goal: number }[] = [
  { type: 'pushup', label: 'Push-Ups', icon: '💪', goal: 20 },
  { type: 'jumpingjack', label: 'Jumping Jacks', icon: '🕺', goal: 30 },
  { type: 'run', label: 'Run in Place', icon: '🏃', goal: 50 },
];

interface WorkoutScreenProps {
  navigation: any;
  route: { params: { profile?: any } };
}

export default function WorkoutScreen({ navigation }: WorkoutScreenProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('pushup');
  const [isActive, setIsActive] = useState(false);

  const facing = 'front'; // Front cam for workouts
  const [hasPermission, setHasPermission] = React.useState<boolean|null>(null);
  React.useEffect(() => { Camera.requestCameraPermissionsAsync().then(({granted}) => setHasPermission(granted)); }, []);
  const { keypoints, confidence } = usePoseDetection();
  const { count, reset } = useExerciseCounter({ exerciseType: selectedExercise });

  const exercise = EXERCISES.find((e) => e.type === selectedExercise)!;
  const progress = Math.min(count / exercise.goal, 1);
  const progressPct = Math.round(progress * 100);

  function startWorkout() {
    reset();
    setIsActive(true);
    Speech.speak(`Starting ${exercise.label}. Go!`, { rate: 1.0 });
  }

  function stopWorkout() {
    setIsActive(false);
    Speech.speak(`Nice work! You did ${count} ${exercise.label}.`, { rate: 0.9 });
  }

  if (!hasPermission) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>📷 Camera needed for workout tracking</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera background when active */}
      {isActive && hasPermission ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
          />
          <SkeletonOverlay
            keypoints={keypoints}
            width={SCREEN_W}
            height={SCREEN_H}
            color="#00E5FF"
          />
        </>
      ) : (
        <View style={styles.inactiveBg} />
      )}

      {/* Overlay */}
      <View style={[styles.overlay, !isActive && styles.overlayFull]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('home')}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Workout Mode</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Exercise selector */}
        {!isActive && (
          <View style={styles.exerciseSelector}>
            {EXERCISES.map((ex) => (
              <TouchableOpacity
                key={ex.type}
                style={[
                  styles.exerciseCard,
                  selectedExercise === ex.type && styles.exerciseCardActive,
                ]}
                onPress={() => setSelectedExercise(ex.type)}
              >
                <Text style={styles.exerciseIcon}>{ex.icon}</Text>
                <Text style={styles.exerciseLabel}>{ex.label}</Text>
                <Text style={styles.exerciseGoal}>Goal: {ex.goal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Counter display */}
        <View style={styles.counterSection}>
          <Text style={styles.exerciseDisplay}>
            {exercise.icon} {exercise.label}
          </Text>
          <Text style={styles.counter}>{count}</Text>
          <Text style={styles.counterGoal}>/ {exercise.goal}</Text>

          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View
              style={[styles.progressFill, { width: `${progressPct}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{progressPct}%</Text>

          {count >= exercise.goal && (
            <Text style={styles.goalReached}>🎉 Goal Reached!</Text>
          )}
        </View>

        {/* Start/Stop button */}
        <View style={styles.bottomControls}>
          {!isActive ? (
            <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
              <Text style={styles.startBtnText}>▶ Start</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity style={styles.resetBtn} onPress={() => reset()}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={stopWorkout}>
                <Text style={styles.stopBtnText}>■ Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  inactiveBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0a0a' },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  overlayFull: { backgroundColor: '#0a0a0a' },

  permContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  permText: { color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
  permBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    marginBottom: 24,
  },
  backBtn: { color: '#FF6B00', fontSize: 24, fontWeight: '700' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },

  exerciseSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  exerciseCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  exerciseIcon: { fontSize: 28, marginBottom: 6 },
  exerciseLabel: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  exerciseGoal: { color: '#666', fontSize: 11, marginTop: 2 },

  counterSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDisplay: {
    color: '#00E5FF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  counter: {
    color: '#fff',
    fontSize: 96,
    fontWeight: '900',
    lineHeight: 100,
  },
  counterGoal: { color: '#555', fontSize: 24, marginTop: 4 },
  progressBg: {
    width: 200,
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 4,
  },
  progressText: { color: '#666', fontSize: 13, marginTop: 6 },
  goalReached: {
    color: '#4CAF50',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },

  bottomControls: { paddingTop: 20 },
  startBtn: {
    backgroundColor: '#00E5FF',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: '800' },
  activeControls: { flexDirection: 'row', gap: 12 },
  resetBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  resetBtnText: { color: '#888', fontSize: 16, fontWeight: '700' },
  stopBtn: {
    flex: 2,
    backgroundColor: '#F44336',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  stopBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
