// SessionScreen.tsx - Camera + accelerometer shot detection + live stats
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';

import { CameraView, Camera } from 'expo-camera';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceMotion } from 'expo-sensors';

import { StatsHUD } from '../components/StatsHUD';
import { NBAJamChant } from '../components/NBAJamChant';
import { useShootingAnalysis } from '../hooks/useShootingAnalysis';
import { PlayerProfile } from './HomeScreen';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SESSION_STORAGE_KEY = '@shotiq_sessions';

function getChant(streak: number): string | null {
  if (streak >= 4) return 'BOOM SHAKALAKA!';
  if (streak >= 3) return "HE'S ON FIRE!";
  if (streak >= 2) return "He's heating up!";
  return null;
}

export default function SessionScreen({ navigate }: { navigate: (s: any, data?: any) => void }) {
  const profile: PlayerProfile | null = null;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ granted }) => setHasPermission(granted));
  }, []);

  const {
    shotCount,
    makes,
    misses,
    shootingPct,
    currentFormScore,
    lastShotResult,
    streak,
    shotHistory,
    markShot,
    resetSession,
  } = useShootingAnalysis({
    handedness: 'right',
    frameWidth: 100,
    frameHeight: 100,
  });

  const [hoopPosition, setHoopPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSettingHoop, setIsSettingHoop] = useState(false);
  const [chantText, setChantText] = useState<string | null>(null);
  const [showChant, setShowChant] = useState(false);
  const [shotPopup, setShotPopup] = useState<'make' | 'miss' | null>(null);
  const [shotDetected, setShotDetected] = useState(false);

  const popupAnim = useRef(new Animated.Value(0)).current;
  const sessionStartTime = useRef<number>(Date.now());
  const prevStreakRef = useRef(0);
  const prevShotCountRef = useRef(0);
  const chantTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accelerometer shot detection state
  const motionHistoryRef = useRef<{ rotation: { alpha: number; beta: number; gamma: number }; ts: number }[]>([]);
  const lastShotDetectedRef = useRef<number>(0);
  const armRaisedRef = useRef(false);
  const SHOT_COOLDOWN_MS = 1500;

  // DeviceMotion for shot detection
  useEffect(() => {
    DeviceMotion.setUpdateInterval(80);
    const sub = DeviceMotion.addListener((data) => {
      if (!data.rotation) return;
      const { alpha, beta, gamma } = data.rotation;
      const now = Date.now();

      // Keep short history for pattern matching
      motionHistoryRef.current = [
        ...motionHistoryRef.current.slice(-10),
        { rotation: { alpha, beta, gamma }, ts: now },
      ];

      const history = motionHistoryRef.current;
      if (history.length < 5) return;

      // Shooting motion: phone tilts back (beta increases) as arm raises,
      // then snaps forward (beta decreases quickly) at release.
      // beta ~= forward/backward tilt in radians
      const recent = history.slice(-3).map(h => h.rotation.beta);
      const older  = history.slice(-8, -3).map(h => h.rotation.beta);

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg  = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

      // Arm raise: beta tilts toward negative (phone tilting back/up)
      // Release: beta snaps back quickly
      const tiltDelta = recentAvg - olderAvg; // positive = phone tips forward (release)
      const armRaisedThreshold = -0.3; // radians tilt back
      const releaseThreshold   =  0.35; // radians snap forward

      if (recentAvg < armRaisedThreshold) {
        armRaisedRef.current = true;
      }

      if (armRaisedRef.current && tiltDelta > releaseThreshold) {
        const timeSinceLast = now - lastShotDetectedRef.current;
        if (timeSinceLast > SHOT_COOLDOWN_MS) {
          lastShotDetectedRef.current = now;
          armRaisedRef.current = false;

          // Auto-mark as shot (user can override with ✓/✗ buttons)
          markShot('make');

          // Show detection indicator
          setShotDetected(true);
          setTimeout(() => setShotDetected(false), 1200);
        }
      }
    });

    return () => sub.remove();
  }, [markShot]);

  // Detect new shots via shotCount changes
  useEffect(() => {
    if (shotCount > prevShotCountRef.current) {
      prevShotCountRef.current = shotCount;
      showShotPopup(lastShotResult);
    }
  }, [shotCount, lastShotResult]);

  // Detect streak changes for chants
  useEffect(() => {
    if (streak > prevStreakRef.current && streak >= 2) {
      prevStreakRef.current = streak;
      const chant = getChant(streak);
      triggerChant(chant);
    } else if (streak === 0) {
      prevStreakRef.current = 0;
    }
  }, [streak]);

  function showShotPopup(result: 'make' | 'miss' | null) {
    if (!result) return;
    setShotPopup(result);

    Animated.sequence([
      Animated.spring(popupAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 7,
      }),
      Animated.delay(2000),
      Animated.timing(popupAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShotPopup(null));
  }

  function triggerChant(chant: string | null) {
    if (!chant) return;
    setChantText(chant);
    setShowChant(true);

    if (chantTimeoutRef.current) clearTimeout(chantTimeoutRef.current);
    Speech.speak(chant, { rate: 0.9, pitch: 1.2 });

    chantTimeoutRef.current = setTimeout(() => {
      setShowChant(false);
    }, 3000);
  }

  function handleHoopTap(event: any) {
    if (!isSettingHoop) return;
    const { locationX, locationY } = event.nativeEvent;
    setHoopPosition({
      x: (locationX / SCREEN_W) * 100,
      y: (locationY / SCREEN_H) * 100,
    });
    setIsSettingHoop(false);
  }

  async function endSession() {
    const duration = Math.round((Date.now() - sessionStartTime.current) / 1000);

    const sessionData = {
      id: Date.now().toString(),
      profileId: profile?.id ?? 'guest',
      profileName: profile?.name ?? 'Guest',
      date: new Date().toISOString(),
      duration,
      shotCount,
      makes,
      misses,
      shootingPct,
      avgFormScore: currentFormScore?.overall ?? 0,
      shotHistory,
    };

    try {
      const existing = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      const sessions = existing ? JSON.parse(existing) : [];
      sessions.unshift(sessionData);
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions.slice(0, 100)));
    } catch (err) {
      console.error('Failed to save session:', err);
    }

    navigate('summary', { session: sessionData });
  }

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>📷 Requesting camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>📷 Camera access needed</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={() => Camera.requestCameraPermissionsAsync().then(({ granted }) => setHasPermission(granted))}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <TouchableOpacity
        style={styles.cameraContainer}
        activeOpacity={1}
        onPress={handleHoopTap}
      >
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
        />

        {/* Hoop marker */}
        {hoopPosition && (
          <View
            style={[
              styles.hoopMarker,
              {
                left: (hoopPosition.x / 100) * SCREEN_W - 20,
                top: (hoopPosition.y / 100) * SCREEN_H - 20,
              },
            ]}
          >
            <Text style={styles.hoopIcon}>🏀</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Stats HUD */}
      <StatsHUD
        shotCount={shotCount}
        makes={makes}
        misses={misses}
        shootingPct={shootingPct}
        formScore={currentFormScore?.overall ?? null}
        streak={streak}
        confidence={0}
      />

      {/* NBA Jam Chant */}
      <NBAJamChant chant={chantText} visible={showChant} />

      {/* Shot Detected Banner */}
      {shotDetected && (
        <View style={styles.shotDetectedBanner}>
          <Text style={styles.shotDetectedText}>🏀 Shot Detected!</Text>
        </View>
      )}

      {/* Make/Miss Popup */}
      {shotPopup && (
        <Animated.View
          style={[
            styles.shotPopup,
            shotPopup === 'make' ? styles.makePopup : styles.missPopup,
            { transform: [{ scale: popupAnim }], opacity: popupAnim },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.shotPopupText}>
            {shotPopup === 'make' ? '✅ GOOD!' : '❌ MISS'}
          </Text>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Set Hoop */}
        <TouchableOpacity
          style={[styles.controlBtn, isSettingHoop && styles.controlBtnActive]}
          onPress={() => setIsSettingHoop(!isSettingHoop)}
        >
          <Text style={styles.controlBtnText}>
            {isSettingHoop ? '📍 Tap Hoop' : '🏀 Set Hoop'}
          </Text>
        </TouchableOpacity>

        {/* Camera Toggle */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
        >
          <Text style={styles.controlBtnText}>🔄</Text>
        </TouchableOpacity>

        {/* Manual Make/Miss */}
        <View style={styles.manualButtons}>
          <TouchableOpacity
            style={styles.makeBtn}
            onPress={() => markShot('make')}
          >
            <Text style={styles.makeBtnText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.missBtn}
            onPress={() => markShot('miss')}
          >
            <Text style={styles.missBtnText}>✗</Text>
          </TouchableOpacity>
        </View>

        {/* End Session */}
        <TouchableOpacity style={styles.endBtn} onPress={endSession}>
          <Text style={styles.endBtnText}>END</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { ...StyleSheet.absoluteFillObject },

  permissionContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  permissionText: { color: '#fff', fontSize: 18 },
  permissionBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  hoopMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoopIcon: { fontSize: 30 },

  shotDetectedBanner: {
    position: 'absolute',
    top: SCREEN_H * 0.15,
    alignSelf: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shotDetectedText: { color: '#fff', fontSize: 18, fontWeight: '900' },

  shotPopup: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_H * 0.35,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  makePopup: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    shadowColor: '#4CAF50',
  },
  missPopup: {
    backgroundColor: 'rgba(244, 67, 54, 0.85)',
    shadowColor: '#F44336',
  },
  shotPopupText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },

  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    gap: 10,
  },
  controlBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  controlBtnActive: {
    borderColor: '#FF6B00',
    backgroundColor: 'rgba(255,107,0,0.2)',
  },
  controlBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  manualButtons: { flexDirection: 'row', gap: 8 },
  makeBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  makeBtnText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  missBtn: {
    backgroundColor: '#F44336',
    borderRadius: 30,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missBtnText: { color: '#fff', fontSize: 24, fontWeight: '900' },

  endBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  endBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
