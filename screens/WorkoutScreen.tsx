import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useExerciseCounter, ExerciseType } from '../hooks/useExerciseCounter';

const ORANGE = '#f97316';
const BG = '#0a0a0a';

const EXERCISES = [
  { type: 'pushup' as ExerciseType, label: 'Push-ups', emoji: '🏋️', goal: 20, cal: 0.5 },
  { type: 'jumpingjack' as ExerciseType, label: 'Jumping Jacks', emoji: '⭐', goal: 30, cal: 0.2 },
  { type: 'run' as ExerciseType, label: 'Run in Place', emoji: '🏃', goal: 50, cal: 0.1 },
];

interface Props {
  navigate: (s: any, data?: any) => void;
}

export default function WorkoutScreen({ navigate }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('pushup');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { keypoints, confidence } = usePoseDetection();
  const { count, reset } = useExerciseCounter({ exerciseType: selectedExercise });

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ granted }) => setHasPermission(granted));
  }, []);

  const exercise = EXERCISES.find(e => e.type === selectedExercise)!;
  const calories = (count * exercise.cal).toFixed(1);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('home')}>
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Workout Mode</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Exercise selector */}
        <View style={styles.tabs}>
          {EXERCISES.map(ex => (
            <TouchableOpacity
              key={ex.type}
              style={[styles.tab, selectedExercise === ex.type && styles.tabActive]}
              onPress={() => { setSelectedExercise(ex.type); reset(); }}
            >
              <Text style={styles.tabEmoji}>{ex.emoji}</Text>
              <Text style={[styles.tabLabel, selectedExercise === ex.type && styles.tabLabelActive]}>
                {ex.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Camera / counter area */}
        <View style={styles.cameraWrap}>
          {hasPermission && isActive ? (
            <CameraView style={StyleSheet.absoluteFill} facing="front" />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
            </View>
          )}

          {/* Counter overlay */}
          <View style={styles.counterOverlay}>
            <Text style={styles.countNum}>{count}</Text>
            <Text style={styles.countLabel}>{exercise.label}</Text>
            <Text style={styles.calories}>🔥 {calories} cal</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btn, isActive ? styles.btnStop : styles.btnStart]}
            onPress={() => setIsActive(!isActive)}
          >
            <Text style={styles.btnText}>{isActive ? '⏹ Stop' : '▶ Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnReset} onPress={reset}>
            <Text style={styles.btnResetText}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>

        {!hasPermission && (
          <Text style={styles.permText}>📷 Allow camera for pose detection</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  back: { color: ORANGE, fontSize: 18, fontWeight: '700', width: 60 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  tabActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  tabEmoji: { fontSize: 22, marginBottom: 4 },
  tabLabel: { color: '#888', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tabLabelActive: { color: '#000' },
  cameraWrap: { flex: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 20, backgroundColor: '#1a1a1a' },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  exerciseEmoji: { fontSize: 80 },
  counterOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  countNum: { fontSize: 80, fontWeight: '900', color: ORANGE, lineHeight: 90 },
  countLabel: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  calories: { color: '#888', fontSize: 14 },
  controls: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnStart: { backgroundColor: ORANGE },
  btnStop: { backgroundColor: '#ef4444' },
  btnText: { color: '#000', fontSize: 18, fontWeight: '900' },
  btnReset: { backgroundColor: '#1a1a1a', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnResetText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  permText: { color: '#555', textAlign: 'center', marginTop: 8, fontSize: 13 },
});
