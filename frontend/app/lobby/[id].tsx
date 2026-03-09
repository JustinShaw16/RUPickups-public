import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { API_BASE_URL, authedFetch } from '@/api/backend';

const SPORT_OPTIONS = ['Basketball', 'Soccer', 'Volleyball', 'Tennis', 'Other'] as const;

type Lobby = {
  lobby_id: string;
  host_user_id: string;
  lobby_name: string;
  sport: string;
  campus: string;
  location_id: string | null;
  is_public: boolean;
  max_players: number;
  status: string;
  scheduled_start_time: string;
  created_at: string;
};

type Location = {
  location_id: string;
  name: string;
  campus: string;
  address: string;
};

type Participant = {
  player_id: string;
  username: string;
  is_ready: boolean;
  current_team: string | null;
};

const RUTGERS_RED = '#CC0033';
const DARK_NAVY = '#111827';
const LIGHT_GRAY = '#F9FAFB';
const BORDER_GRAY = '#E5E7EB';
const MUTED_TEXT = '#6B7280';

export default function LobbyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editLobbyName, setEditLobbyName] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editLocationId, setEditLocationId] = useState<string | null>(null);
  const [editScheduledAt, setEditScheduledAt] = useState<Date>(() => new Date());
  const [editMaxPlayers, setEditMaxPlayers] = useState('10');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editLocationPickerOpen, setEditLocationPickerOpen] = useState(false);
  const [showEditPicker, setShowEditPicker] = useState(false);

  const loadLobby = useCallback(async () => {
    if (!id) return;
    try {
      const res = await authedFetch(`/lobbies/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Lobby not found.');
          setLobby(null);
          return;
        }
        throw new Error(`Failed to load lobby (${res.status})`);
      }
      const data = (await res.json()) as Lobby;
      setLobby(data);
      setError(null);
    } catch (e) {
      setLobby(null);
      setError(e instanceof Error ? e.message : 'Failed to load lobby.');
    }
  }, [id]);

  const loadParticipants = useCallback(async () => {
    if (!id) return;
    try {
      const res = await authedFetch(`/lobbies/${id}/participants`);
      if (!res.ok) return;
      const data = (await res.json()) as Participant[];
      setParticipants(data);
    } catch {
      setParticipants([]);
    }
  }, [id]);

  const loadLocations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/locations/location_manifest`);
      if (!res.ok) return;
      const data = (await res.json()) as Location[];
      setLocations(data);
    } catch {
      setLocations([]);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await authedFetch('/users/me');
      if (!res.ok) return;
      const data = (await res.json()) as { user_id: string };
      setCurrentUserId(data.user_id);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      await Promise.all([loadLobby(), loadParticipants()]);
    } finally {
      setLoading(false);
    }

    // Load locations and current user in the background so the main
    // lobby view appears as soon as core data is ready.
    void loadLocations();
    void loadCurrentUser();
  }, [id, loadLobby, loadParticipants, loadLocations, loadCurrentUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleJoin = async () => {
    if (!id || joining) return;
    setJoinError(null);
    setJoining(true);
    try {
      const res = await authedFetch(`/lobbies/${id}/join`, { method: 'POST' });
      if (res.status === 409) {
        setJoinError('You are already in this lobby.');
        await loadParticipants();
        return;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        setJoinError(msg || 'Failed to join lobby.');
        return;
      }
      await loadParticipants();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Failed to join lobby.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!id || leaving) return;
    setJoinError(null);
    setLeaving(true);
    try {
      const res = await authedFetch(`/lobbies/${id}/leave`, { method: 'POST' });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        setJoinError(msg || 'Failed to leave lobby.');
        return;
      }
      await loadParticipants();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Failed to leave lobby.');
    } finally {
      setLeaving(false);
    }
  };

  const handleCreateMatch = () => {
    if (!lobby) return;
    Alert.alert(
      'Create match',
      'Match creation from lobby participants is coming soon.',
    );
  };

  const isHost = currentUserId != null && lobby?.host_user_id === currentUserId;
  const isParticipant =
    isHost ||
    (currentUserId != null &&
      participants.some((p) => p.player_id === currentUserId));

  const openEdit = useCallback(() => {
    if (!lobby) return;
    setEditLobbyName(lobby.lobby_name);
    setEditSport(lobby.sport);
    setEditLocationId(lobby.location_id);
    setEditScheduledAt(new Date(lobby.scheduled_start_time));
    setEditMaxPlayers(String(lobby.max_players));
    setEditIsPublic(lobby.is_public);
    setEditError(null);
    setEditOpen(true);
  }, [lobby]);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditLocationPickerOpen(false);
    setShowEditPicker(false);
  }, []);

  const handleEditDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android' && event.type === 'dismissed') {
        setShowEditPicker(false);
        return;
      }
      if (date) {
        setEditScheduledAt(date);
        if (Platform.OS === 'android') setShowEditPicker(false);
      }
    },
    [],
  );

  const handleSaveEdit = async () => {
    if (!id || !lobby || saving) return;
    const name = editLobbyName.trim();
    const max = parseInt(editMaxPlayers, 10);
    if (!name) {
      setEditError('Please enter a lobby name.');
      return;
    }
    if (!editSport.trim()) {
      setEditError('Please select a sport.');
      return;
    }
    const selectedLoc = editLocationId
      ? locations.find((loc) => loc.location_id === editLocationId)
      : null;
    if (!editLocationId || !selectedLoc) {
      setEditError('Please select a location.');
      return;
    }
    if (Number.isNaN(max) || max < 2) {
      setEditError('Max players must be at least 2.');
      return;
    }
    if (editScheduledAt.getTime() <= Date.now()) {
      setEditError('Start time must be in the future.');
      return;
    }
    setEditError(null);
    setSaving(true);
    try {
      const res = await authedFetch(`/lobbies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobby_name: name,
          sport: editSport.trim(),
          campus: selectedLoc.campus,
          location_id: editLocationId,
          is_public: editIsPublic,
          max_players: max,
          scheduled_start_time: editScheduledAt.toISOString(),
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        setEditError(msg || 'Failed to update lobby.');
        return;
      }
      const updated = (await res.json()) as Lobby;
      setLobby(updated);
      closeEdit();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update lobby.');
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async () => {
    if (!id) return;
    try {
      const res = await authedFetch(`/lobbies/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      router.replace('/(tabs)/lobbies');
    } catch {
      // ignore
    }
  };

  const handleDelete = () => {
    if (!id) return;
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this lobby? This cannot be undone.',
      );
      if (confirmed) void performDelete();
    } else {
      Alert.alert(
        'Delete lobby',
        'Are you sure you want to delete this lobby? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
        ],
      );
    }
  };

  const location = lobby?.location_id
    ? locations.find((loc) => loc.location_id === lobby.location_id)
    : null;
  const when = lobby ? new Date(lobby.scheduled_start_time) : null;
  const whenLabel = when
    ? when.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  if (!id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Missing lobby ID.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.replace('/(tabs)/lobbies')}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Lobby</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={RUTGERS_RED} />
            <Text style={styles.mutedText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : lobby ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
              />
            }
          >
            <View style={styles.card}>
              <Text style={styles.lobbyName}>{lobby.lobby_name}</Text>
              <Text style={styles.sport}>{lobby.sport}</Text>

              <View style={styles.infoRow}>
                <MaterialIcons name="schedule" size={18} color={MUTED_TEXT} />
                <Text style={styles.infoText}>{whenLabel}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="place" size={18} color={MUTED_TEXT} />
                <Text style={styles.infoText}>
                  {lobby.campus}
                  {location ? ` · ${location.name}` : ''}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <View style={[styles.statusPill, lobby.status !== 'open' && styles.statusPillMuted]}>
                  <Text style={styles.statusPillText}>
                    {lobby.status.charAt(0).toUpperCase() + lobby.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.metaText}>
                  {lobby.max_players} players max · {lobby.is_public ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>

            {isHost && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Host actions</Text>
                <View style={styles.hostActionsRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={openEdit}
                    activeOpacity={0.9}
                  >
                    <MaterialIcons name="edit" size={20} color={RUTGERS_RED} />
                    <Text style={styles.editButtonText}>Edit lobby</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    activeOpacity={0.9}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete lobby</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.createMatchButton}
                  onPress={handleCreateMatch}
                  activeOpacity={0.9}
                >
                  <Text style={styles.createMatchButtonText}>Create match</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isParticipant ? 'You are in this lobby' : 'Join'}
              </Text>
              {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
              {isParticipant ? (
                <TouchableOpacity
                  style={[styles.leaveButton, leaving && styles.joinButtonDisabled]}
                  onPress={handleLeave}
                  disabled={leaving}
                  activeOpacity={0.9}
                >
                  <Text style={styles.leaveButtonText}>
                    {leaving ? 'Leaving…' : 'Leave lobby'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.joinButton, joining && styles.joinButtonDisabled]}
                  onPress={handleJoin}
                  disabled={joining || lobby.status !== 'open'}
                  activeOpacity={0.9}
                >
                  <Text style={styles.joinButtonText}>
                    {joining ? 'Joining…' : 'Join this lobby'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
              <View style={styles.participantList}>
                {participants.length === 0 ? (
                  <Text style={styles.emptyParticipants}>No participants yet.</Text>
                ) : (
                  participants.map((p) => (
                    <View key={p.player_id} style={styles.participantRow}>
                      <View style={styles.participantAvatar}>
                        <Text style={styles.participantAvatarText}>
                          {(p.username || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.participantInfo}>
                        <View style={styles.participantNameRow}>
                          <Text style={styles.participantName}>{p.username}</Text>
                          {lobby && p.player_id === lobby.host_user_id && (
                            <MaterialCommunityIcons
                              name="crown"
                              size={18}
                              color={RUTGERS_RED}
                              style={styles.hostIcon}
                            />
                          )}
                        </View>
                        {(p.current_team || p.is_ready) && (
                          <Text style={styles.participantMeta}>
                            {[p.current_team, p.is_ready ? 'Ready' : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        ) : null}
      </View>

      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={closeEdit}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit lobby</Text>
            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

            <Text style={styles.label}>Lobby name</Text>
            <TextInput
              style={styles.input}
              value={editLobbyName}
              onChangeText={setEditLobbyName}
              placeholder="Lobby name"
              placeholderTextColor={MUTED_TEXT}
            />

            <Text style={styles.label}>Sport</Text>
            <View style={styles.pillRow}>
              {SPORT_OPTIONS.map((option) => {
                const selected = editSport === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pill, selected && styles.pillSelected]}
                    onPress={() => setEditSport(option)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Location</Text>
            <TouchableOpacity
              style={styles.locationSelectButton}
              onPress={() => setEditLocationPickerOpen(true)}
              activeOpacity={0.9}
            >
              {editLocationId && locations.find((l) => l.location_id === editLocationId) ? (
                <View>
                  <Text style={styles.locationSelectName}>
                    {locations.find((l) => l.location_id === editLocationId)?.name}
                  </Text>
                  <Text style={styles.locationSelectAddress}>
                    {locations.find((l) => l.location_id === editLocationId)?.campus}
                  </Text>
                </View>
              ) : (
                <Text style={styles.locationSelectPlaceholder}>Select location…</Text>
              )}
            </TouchableOpacity>

            <Modal
              visible={editLocationPickerOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setEditLocationPickerOpen(false)}
            >
              <View style={styles.locationPickerBackdrop}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setEditLocationPickerOpen(false)}
                />
                <View style={styles.locationPickerCard}>
                  <Text style={styles.locationPickerTitle}>Select location</Text>
                  <ScrollView
                    style={styles.locationPickerScroll}
                    contentContainerStyle={styles.locationPickerScrollContent}
                  >
                    {locations.map((loc) => (
                      <TouchableOpacity
                        key={loc.location_id}
                        style={[
                          styles.locationPickerRow,
                          editLocationId === loc.location_id && styles.locationPickerRowSelected,
                        ]}
                        onPress={() => {
                          setEditLocationId(loc.location_id);
                          setEditLocationPickerOpen(false);
                        }}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.locationPickerName}>{loc.name}</Text>
                        <Text style={styles.locationPickerAddress}>{loc.campus}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.locationPickerDone}
                    onPress={() => setEditLocationPickerOpen(false)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.locationPickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={styles.label}>Start time</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateButton}>
                <input
                  type="datetime-local"
                  style={{
                    width: '100%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: 14,
                    color: DARK_NAVY,
                    outline: 'none',
                  }}
                  value={(() => {
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    const y = editScheduledAt.getFullYear();
                    const m = pad(editScheduledAt.getMonth() + 1);
                    const d = pad(editScheduledAt.getDate());
                    const h = pad(editScheduledAt.getHours());
                    const min = pad(editScheduledAt.getMinutes());
                    return `${y}-${m}-${d}T${h}:${min}`;
                  })()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const v = e.target?.value;
                    if (!v) return;
                    const next = new Date(v);
                    if (!Number.isNaN(next.getTime())) setEditScheduledAt(next);
                  }}
                  min={(() => {
                    const now = new Date();
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    const y = now.getFullYear();
                    const m = pad(now.getMonth() + 1);
                    const d = pad(now.getDate());
                    const h = pad(now.getHours());
                    const min = pad(now.getMinutes());
                    return `${y}-${m}-${d}T${h}:${min}`;
                  })()}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEditPicker(true)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.dateButtonText}>
                    {editScheduledAt.toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Text>
                </TouchableOpacity>
                {showEditPicker && (
                  <DateTimePicker
                    value={editScheduledAt}
                    mode="datetime"
                    minimumDate={new Date()}
                    onChange={handleEditDateChange}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  />
                )}
              </>
            )}

            <Text style={styles.label}>Max players</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={editMaxPlayers}
              onChangeText={setEditMaxPlayers}
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Public lobby</Text>
              <Switch value={editIsPublic} onValueChange={setEditIsPublic} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={closeEdit}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={saving}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RUTGERS_RED,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: RUTGERS_RED,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  errorText: {
    color: '#F97373',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  lobbyName: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK_NAVY,
    marginBottom: 4,
  },
  sport: {
    fontSize: 16,
    color: MUTED_TEXT,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: DARK_NAVY,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
  },
  statusPillMuted: {
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_NAVY,
  },
  metaText: {
    fontSize: 13,
    color: MUTED_TEXT,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  createMatchButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  createMatchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RUTGERS_RED,
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RUTGERS_RED,
  },
  leaveButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantList: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    overflow: 'hidden',
  },
  emptyParticipants: {
    padding: 20,
    fontSize: 14,
    color: MUTED_TEXT,
    textAlign: 'center',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RUTGERS_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_NAVY,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hostIcon: {
    marginLeft: 4,
  },
  participantMeta: {
    fontSize: 13,
    color: MUTED_TEXT,
    marginTop: 2,
  },
  hostActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: RUTGERS_RED,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RUTGERS_RED,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B91C1C',
    paddingVertical: 12,
    borderRadius: 14,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_NAVY,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_NAVY,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    fontSize: 14,
    color: DARK_NAVY,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: LIGHT_GRAY,
  },
  pillSelected: {
    borderColor: RUTGERS_RED,
    backgroundColor: 'rgba(204, 0, 51, 0.10)',
  },
  pillText: {
    fontSize: 13,
    color: DARK_NAVY,
  },
  pillTextSelected: {
    color: RUTGERS_RED,
    fontWeight: '700',
  },
  locationSelectButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  locationSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_NAVY,
  },
  locationSelectAddress: {
    fontSize: 12,
    color: MUTED_TEXT,
    marginTop: 2,
  },
  locationSelectPlaceholder: {
    fontSize: 14,
    color: MUTED_TEXT,
  },
  locationPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  locationPickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  locationPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_NAVY,
    marginBottom: 12,
  },
  locationPickerScroll: {
    maxHeight: 320,
  },
  locationPickerScrollContent: {
    paddingBottom: 12,
  },
  locationPickerRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  locationPickerRowSelected: {
    borderColor: RUTGERS_RED,
    backgroundColor: 'rgba(204, 0, 51, 0.08)',
  },
  locationPickerName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_NAVY,
  },
  locationPickerAddress: {
    fontSize: 12,
    color: MUTED_TEXT,
    marginTop: 2,
  },
  locationPickerDone: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: DARK_NAVY,
  },
  locationPickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: LIGHT_GRAY,
  },
  dateButtonText: {
    fontSize: 14,
    color: DARK_NAVY,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: DARK_NAVY,
    fontWeight: '500',
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DARK_NAVY,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
