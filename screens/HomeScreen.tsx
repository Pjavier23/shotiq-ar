import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Modal, SafeAreaView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'shotiq_profiles';
const SCREEN_BG = '#0a0a0a';
const ORANGE = '#f97316';

export interface PlayerProfile {
  id: string;
  name: string;
  jersey: string;
  position: string;
  hand: 'right' | 'left';
  sessions: any[];
}

interface Props {
  navigate: (screen: any, data?: any) => void;
}

export default function HomeScreen({ navigate }: Props) {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newJersey, setNewJersey] = useState('');

  const loadProfiles = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setProfiles(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const addProfile = async () => {
    if (!newName.trim()) return;
    const p: PlayerProfile = {
      id: Date.now().toString(),
      name: newName.trim(),
      jersey: newJersey.trim() || '0',
      position: 'PG',
      hand: 'right',
      sessions: [],
    };
    const updated = [...profiles, p];
    setProfiles(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewName(''); setNewJersey(''); setShowAdd(false);
  };

  const deleteProfile = async (id: string) => {
    Alert.alert('Delete Player?', 'This will remove all their stats.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = profiles.filter(p => p.id !== id);
        setProfiles(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🏀</Text>
          <Text style={styles.logoText}>ShotIQ</Text>
          <Text style={styles.logoSub}>AI Basketball Coach</Text>
        </View>

        {/* Quick Start */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('session')}>
          <Text style={styles.primaryBtnText}>▶ Start Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigate('workout')}>
          <Text style={styles.secondaryBtnText}>💪 Workout Mode</Text>
        </TouchableOpacity>

        {/* Players */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Players</Text>
            {profiles.length < 5 && (
              <TouchableOpacity onPress={() => setShowAdd(true)}>
                <Text style={styles.addBtn}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {profiles.length === 0 ? (
            <Text style={styles.emptyText}>No players yet — add one to track stats</Text>
          ) : (
            profiles.map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.playerCard}
                onLongPress={() => deleteProfile(p.id)}
                onPress={() => navigate('session', { profile: p })}
              >
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerInitial}>{p.name[0].toUpperCase()}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerMeta}>#{p.jersey} · {p.sessions.length} sessions</Text>
                </View>
                <Text style={styles.playerArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Player Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Player</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#555"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Jersey # (optional)"
              placeholderTextColor="#555"
              value={newJersey}
              onChangeText={setNewJersey}
              keyboardType="number-pad"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addProfile}>
                <Text style={styles.modalSaveText}>Add Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  logoWrap: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoIcon: { fontSize: 56, marginBottom: 8 },
  logoText: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  logoSub: { fontSize: 14, color: '#555', marginTop: 4 },
  primaryBtn: { backgroundColor: ORANGE, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#000', fontSize: 18, fontWeight: '900' },
  secondaryBtn: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#333' },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  addBtn: { color: ORANGE, fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  playerInitial: { color: '#000', fontSize: 20, fontWeight: '900' },
  playerInfo: { flex: 1 },
  playerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  playerMeta: { color: '#666', fontSize: 13, marginTop: 2 },
  playerArrow: { color: '#555', fontSize: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 48 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 20 },
  input: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalCancelText: { color: '#888', fontSize: 16, fontWeight: '700' },
  modalSave: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: ORANGE },
  modalSaveText: { color: '#000', fontSize: 16, fontWeight: '900' },
});
