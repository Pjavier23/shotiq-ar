// HomeScreen.tsx - Landing screen with player profiles
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerProfile {
  id: string;
  name: string;
  jersey: string;
  position: string;
  handedness: 'left' | 'right';
  sessionsPlayed: number;
  totalMakes: number;
  totalShots: number;
}

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
const STORAGE_KEY = '@shotiq_profiles';
const ACTIVE_PROFILE_KEY = '@shotiq_active_profile';
const MAX_PROFILES = 5;

const defaultProfile = (): PlayerProfile => ({
  id: Date.now().toString(),
  name: '',
  jersey: '1',
  position: 'SG',
  handedness: 'right',
  sessionsPlayed: 0,
  totalMakes: 0,
  totalShots: 0,
});

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfile, setNewProfile] = useState<PlayerProfile>(defaultProfile());

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [])
  );

  async function loadProfiles() {
    try {
      const [profilesJson, activeId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ACTIVE_PROFILE_KEY),
      ]);
      if (profilesJson) setProfiles(JSON.parse(profilesJson));
      if (activeId) setActiveProfileId(activeId);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  }

  async function saveProfiles(updated: PlayerProfile[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProfiles(updated);
  }

  async function addProfile() {
    if (!newProfile.name.trim()) {
      Alert.alert('Name required', 'Please enter a player name.');
      return;
    }
    if (profiles.length >= MAX_PROFILES) {
      Alert.alert('Max profiles', `You can have up to ${MAX_PROFILES} profiles.`);
      return;
    }
    const updated = [...profiles, { ...newProfile, id: Date.now().toString() }];
    await saveProfiles(updated);
    if (updated.length === 1) {
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, updated[0].id);
      setActiveProfileId(updated[0].id);
    }
    setShowAddModal(false);
    setNewProfile(defaultProfile());
  }

  async function selectProfile(profile: PlayerProfile) {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    setActiveProfileId(profile.id);
  }

  async function deleteProfile(id: string) {
    Alert.alert('Delete Profile', 'Remove this player?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = profiles.filter((p) => p.id !== id);
          await saveProfiles(updated);
          if (activeProfileId === id) {
            const newActive = updated[0]?.id ?? null;
            setActiveProfileId(newActive);
            if (newActive) await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, newActive);
          }
        },
      },
    ]);
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🏀 ShotIQ</Text>
        <Text style={styles.tagline}>AR Basketball Trainer</Text>
      </View>

      {/* Active player card */}
      {activeProfile ? (
        <View style={styles.activeCard}>
          <View style={styles.jerseyBadge}>
            <Text style={styles.jerseyNumber}>#{activeProfile.jersey}</Text>
          </View>
          <View style={styles.activeInfo}>
            <Text style={styles.activeName}>{activeProfile.name}</Text>
            <Text style={styles.activeStats}>
              {activeProfile.position} •{' '}
              {activeProfile.handedness === 'right' ? 'Right-handed' : 'Left-handed'}
            </Text>
            <Text style={styles.activeStats}>
              {activeProfile.sessionsPlayed} sessions •{' '}
              {activeProfile.totalShots > 0
                ? `${Math.round((activeProfile.totalMakes / activeProfile.totalShots) * 100)}% FG`
                : 'No shots yet'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noProfileCard}>
          <Text style={styles.noProfileText}>
            Create a profile to get started
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.startBtn, !activeProfile && styles.btnDisabled]}
          onPress={() =>
            activeProfile &&
            navigate('Session', { profile: activeProfile })
          }
          disabled={!activeProfile}
        >
          <Text style={styles.startBtnText}>🎯 Start Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.workoutBtn}
          onPress={() => navigate('Workout', { profile: activeProfile })}
        >
          <Text style={styles.workoutBtnText}>💪 Workout Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Profiles list */}
      <View style={styles.profilesSection}>
        <View style={styles.profilesHeader}>
          <Text style={styles.sectionTitle}>Players</Text>
          {profiles.length < MAX_PROFILES && (
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.profilesList} showsVerticalScrollIndicator={false}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileRow,
                activeProfileId === profile.id && styles.profileRowActive,
              ]}
              onPress={() => selectProfile(profile)}
              onLongPress={() => deleteProfile(profile.id)}
            >
              <View style={styles.profileJersey}>
                <Text style={styles.profileJerseyNum}>#{profile.jersey}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileDetail}>
                  {profile.position} •{' '}
                  {profile.handedness === 'right' ? 'RH' : 'LH'}
                </Text>
              </View>
              {activeProfileId === profile.id && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
          ))}
          {profiles.length === 0 && (
            <Text style={styles.emptyText}>No players yet. Add one above!</Text>
          )}
        </ScrollView>
      </View>

      {/* Add Profile Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Player</Text>

            <TextInput
              style={styles.input}
              placeholder="Player Name"
              placeholderTextColor="#666"
              value={newProfile.name}
              onChangeText={(t) => setNewProfile((p) => ({ ...p, name: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Jersey #"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              value={newProfile.jersey}
              onChangeText={(t) => setNewProfile((p) => ({ ...p, jersey: t }))}
            />

            <Text style={styles.inputLabel}>Position</Text>
            <View style={styles.chipRow}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.chip,
                    newProfile.position === pos && styles.chipActive,
                  ]}
                  onPress={() => setNewProfile((p) => ({ ...p, position: pos }))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      newProfile.position === pos && styles.chipTextActive,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Shooting Hand</Text>
            <View style={styles.chipRow}>
              {(['right', 'left'] as const).map((hand) => (
                <TouchableOpacity
                  key={hand}
                  style={[
                    styles.chip,
                    newProfile.handedness === hand && styles.chipActive,
                  ]}
                  onPress={() => setNewProfile((p) => ({ ...p, handedness: hand }))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      newProfile.handedness === hand && styles.chipTextActive,
                    ]}
                  >
                    {hand === 'right' ? '✋ Right' : '🤚 Left'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addProfile}>
                <Text style={styles.saveBtnText}>Save Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  logo: { color: '#FF6B00', fontSize: 32, fontWeight: '900' },
  tagline: { color: '#666', fontSize: 14, marginTop: 2 },

  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B00',
    marginBottom: 16,
    gap: 14,
  },
  jerseyBadge: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyNumber: { color: '#fff', fontSize: 20, fontWeight: '900' },
  activeInfo: { flex: 1 },
  activeName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  activeStats: { color: '#888', fontSize: 13, marginTop: 2 },

  noProfileCard: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  noProfileText: { color: '#666', fontSize: 15 },

  actions: { paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  startBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  workoutBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  workoutBtnText: { color: '#ccc', fontSize: 16, fontWeight: '700' },

  profilesSection: { flex: 1, paddingHorizontal: 16 },
  profilesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addBtn: { color: '#FF6B00', fontSize: 15, fontWeight: '700' },

  profilesList: { flex: 1 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  profileRowActive: { borderWidth: 1, borderColor: '#FF6B00' },
  profileJersey: {
    backgroundColor: '#222',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileJerseyNum: { color: '#FF6B00', fontSize: 16, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileDetail: { color: '#666', fontSize: 12, marginTop: 2 },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B00',
  },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 20 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputLabel: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  chipText: { color: '#888', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#888', fontSize: 16, fontWeight: '700' },
  saveBtn: {
    flex: 2,
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
