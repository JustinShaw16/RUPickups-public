import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { authedFetch } from '@/api/backend';

type Lobby = {
  lobby_id: string;
  host_user_id: string;
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
};

const CAMPUS_OPTIONS = ['College Avenue', 'Busch', 'Livingston', 'Cook/Douglass'] as const;

const SPORT_OPTIONS = ['Basketball', 'Soccer', 'Volleyball', 'Tennis', 'Other'] as const;

export default function LobbiesScreen() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [sport, setSport] = useState<string>('');
  const [campus, setCampus] = useState<string>('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<string>('10');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [lobbiesRes, locationsRes] = await Promise.all([
          authedFetch('/lobbies'),
          authedFetch('/locations/location_manifest'),
        ]);

        if (!lobbiesRes.ok) {
          throw new Error(`Failed to load lobbies (${lobbiesRes.status})`);
        }
        if (!locationsRes.ok) {
          throw new Error(`Failed to load locations (${locationsRes.status})`);
        }

        const lobbiesData: Lobby[] = await lobbiesRes.json();
        const locationsData: Location[] = await locationsRes.json();

        setLobbies(
          lobbiesData.sort(
            (a, b) =>
              new Date(a.scheduled_start_time).getTime() -
              new Date(b.scheduled_start_time).getTime(),
          ),
        );
        setLocations(locationsData);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load lobbies.');
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const resetCreateState = () => {
    setSport('');
    setCampus('');
    setLocationId(null);
    setMaxPlayers('10');
    setIsPublic(true);
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    setScheduledAt(d);
    setCreateError(null);
  };

  const openCreate = () => {
    resetCreateState();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShowPicker(false);
        return;
      }
      if (date) {
        setScheduledAt(date);
        setShowPicker(false);
      }
      return;
    }

    // iOS (and other platforms) keep the picker visible and update live
    if (date) {
      setScheduledAt(date);
    }
  };

  const formattedDate = useMemo(
    () =>
      scheduledAt.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [scheduledAt],
  );

  const locationForLobby = (lobby: Lobby): Location | undefined =>
    locations.find((loc) => loc.location_id === lobby.location_id);

  const handleCreateLobby = async () => {
    setCreateError(null);

    const trimmedSport = sport.trim();
    const trimmedCampus = campus.trim();
    const max = parseInt(maxPlayers, 10);

    if (!trimmedSport) {
      setCreateError('Please select a sport.');
      return;
    }
    if (!trimmedCampus) {
      setCreateError('Please select a campus.');
      return;
    }
    if (Number.isNaN(max) || max < 2) {
      setCreateError('Max players must be a number of at least 2.');
      return;
    }

    const now = new Date();
    if (scheduledAt.getTime() <= now.getTime()) {
      setCreateError('Start time must be in the future.');
      return;
    }

    if (creating) return;
    setCreating(true);

    try {
      const body: Record<string, unknown> = {
        sport: trimmedSport,
        campus: trimmedCampus,
        is_public: isPublic,
        max_players: max,
        scheduled_start_time: scheduledAt.toISOString(),
      };

      if (locationId) {
        body.location_id = locationId;
      }

      const res = await authedFetch('/lobbies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Failed to create lobby (${res.status})`);
      }

      const created: Lobby = await res.json();

      setLobbies((prev) =>
        [created, ...prev].sort(
          (a, b) =>
            new Date(a.scheduled_start_time).getTime() -
            new Date(b.scheduled_start_time).getTime(),
        ),
      );
      closeCreate();
    } catch (e) {
      if (e instanceof Error) {
        setCreateError(e.message);
      } else {
        setCreateError('Failed to create lobby.');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Open lobbies</Text>
          <TouchableOpacity style={styles.createButton} onPress={openCreate} activeOpacity={0.9}>
            <Text style={styles.createButtonText}>Create lobby</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#CC0033" />
            <Text style={styles.mutedText}>Loading lobbies...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : lobbies.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No lobbies yet</Text>
            <Text style={styles.mutedText}>
              Be the first to host a game — tap &quot;Create lobby&quot;.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {lobbies.map((lobby) => {
              const loc = locationForLobby(lobby);
              const when = new Date(lobby.scheduled_start_time);
              const whenLabel = when.toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <View key={lobby.lobby_id} style={styles.lobbyCard}>
                  <View style={styles.lobbyHeader}>
                    <Text style={styles.lobbySport}>{lobby.sport}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        lobby.status.toLowerCase() !== 'open' && styles.statusPillMuted,
                      ]}
                    >
                      <Text style={styles.statusPillText}>
                        {lobby.status.charAt(0).toUpperCase() + lobby.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.lobbySubTitle}>{lobby.campus}</Text>
                  {loc ? <Text style={styles.locationText}>{loc.name}</Text> : null}

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{whenLabel}</Text>
                    <Text style={styles.metaText}>
                      {lobby.is_public ? 'Public' : 'Private'} · {lobby.max_players} players
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={createOpen}
        animationType="slide"
        transparent
        onRequestClose={closeCreate}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create a lobby</Text>
            <Text style={styles.modalSubtitle}>
              Fill in the details below — your lobby will be visible to other players right away.
            </Text>

            {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

            <Text style={styles.label}>Sport</Text>
            <View style={styles.pillRow}>
              {SPORT_OPTIONS.map((option) => {
                const selected = sport === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pill, selected && styles.pillSelected]}
                    onPress={() => setSport(option)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[styles.pillText, selected && styles.pillTextSelected]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Campus</Text>
            <View style={styles.pillRow}>
              {CAMPUS_OPTIONS.map((option) => {
                const selected = campus === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pill, selected && styles.pillSelected]}
                    onPress={() => setCampus(option)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[styles.pillText, selected && styles.pillTextSelected]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Location (optional)</Text>
            <ScrollView
              style={styles.locationList}
              contentContainerStyle={styles.locationListContent}
            >
              {locations.map((loc) => {
                const selected = locationId === loc.location_id;
                return (
                  <TouchableOpacity
                    key={loc.location_id}
                    style={[styles.locationPill, selected && styles.locationPillSelected]}
                    onPress={() =>
                      setLocationId(
                        selected ? null : loc.location_id,
                      )
                    }
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.locationPillText,
                        selected && styles.locationPillTextSelected,
                      ]}
                    >
                      {loc.name} · {loc.campus}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {locations.length === 0 ? (
                <Text style={styles.mutedTextSmall}>
                  No saved locations yet. You can still create a lobby without one.
                </Text>
              ) : null}
            </ScrollView>

            <Text style={styles.label}>Start time</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateButton}>
                {/* Web-only HTML datetime-local input */}
                {/* eslint-disable-next-line react/jsx-no-undef */}
                {/* @ts-expect-error web-only element */}
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
                    const y = scheduledAt.getFullYear();
                    const m = pad(scheduledAt.getMonth() + 1);
                    const d = pad(scheduledAt.getDate());
                    const h = pad(scheduledAt.getHours());
                    const min = pad(scheduledAt.getMinutes());
                    return `${y}-${m}-${d}T${h}:${min}`;
                  })()}
                  onChange={(e: any) => {
                    const v = e.target?.value as string | undefined;
                    if (!v) return;
                    const next = new Date(v);
                    if (!Number.isNaN(next.getTime())) {
                      setScheduledAt(next);
                    }
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
                  onPress={() => setShowPicker(true)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.dateButtonText}>{formattedDate}</Text>
                </TouchableOpacity>
                {showPicker && (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="datetime"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  />
                )}
              </>
            )}

            <Text style={styles.label}>Max players</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={maxPlayers}
              onChangeText={setMaxPlayers}
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Public lobby</Text>
                <Text style={styles.mutedTextSmall}>
                  Anyone can discover and join. Turn this off for invite-only games.
                </Text>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={closeCreate}
                disabled={creating}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, creating && styles.primaryButtonDisabled]}
                onPress={handleCreateLobby}
                disabled={creating}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>
                  {creating ? 'Creating…' : 'Create lobby'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const RUTGERS_RED = '#CC0033';
const DARK_NAVY = '#111827';
const LIGHT_GRAY = '#F9FAFB';
const BORDER_GRAY = '#E5E7EB';
const MUTED_TEXT = '#6B7280';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RUTGERS_RED,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: RUTGERS_RED,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  createButtonText: {
    color: DARK_NAVY,
    fontWeight: '600',
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    marginTop: 8,
    color: LIGHT_GRAY,
    fontSize: 14,
    textAlign: 'center',
  },
  mutedTextSmall: {
    marginTop: 4,
    color: MUTED_TEXT,
    fontSize: 12,
  },
  errorText: {
    color: '#F97373',
    fontSize: 14,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  lobbyCard: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  lobbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  lobbySport: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_NAVY,
  },
  lobbySubTitle: {
    fontSize: 14,
    color: MUTED_TEXT,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: DARK_NAVY,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: MUTED_TEXT,
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
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: MUTED_TEXT,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_NAVY,
    marginTop: 12,
    marginBottom: 6,
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
    backgroundColor: '#F9FAFB',
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
  locationList: {
    maxHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  locationListContent: {
    paddingBottom: 4,
  },
  locationPill: {
    paddingVertical: 6,
  },
  locationPillSelected: {},
  locationPillText: {
    fontSize: 13,
    color: DARK_NAVY,
  },
  locationPillTextSelected: {
    color: RUTGERS_RED,
    fontWeight: '600',
  },
  dateButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: '#F9FAFB',
  },
  dateButtonText: {
    fontSize: 14,
    color: DARK_NAVY,
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
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

