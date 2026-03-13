import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
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

import { useRouter } from 'expo-router';

import { API_BASE_URL, authedFetch } from '@/api/backend';

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
  participant_count?: number | null;
};

type Location = {
  location_id: string;
  name: string;
  campus: string;
  address: string;
};

const CAMPUS_COLORS: Record<string, string> = {
  'College Avenue': '#CC0033',
  Busch: '#0054A4',
  Livingston: '#2E7D32',
  'Cook/Douglass': '#E65100',
};
function getCampusColor(campus: string): string {
  return CAMPUS_COLORS[campus] ?? '#6B7280';
}

const SPORT_OPTIONS = ['Basketball', 'Soccer', 'Volleyball', 'Tennis', 'Other'] as const;
type TimeFilter = 'any' | 'upcoming' | 'past';

export default function LobbiesScreen() {
  const router = useRouter();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [lobbyName, setLobbyName] = useState<string>('');
  const [sport, setSport] = useState<string>('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<string>('10');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [androidPickerStep, setAndroidPickerStep] = useState<'date' | 'time' | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [sportFilter, setSportFilter] = useState<string | 'ALL'>('ALL');
  const [campusFilter, setCampusFilter] = useState<string | 'ALL'>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('any');
  const [openFilter, setOpenFilter] = useState<'sport' | 'campus' | 'time' | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const lobbiesRes = await fetch(`${API_BASE_URL}/lobbies`);

        if (!lobbiesRes.ok) {
          throw new Error(`Failed to load lobbies (${lobbiesRes.status})`);
        }

        const lobbiesData: Lobby[] = await lobbiesRes.json();
        setLobbies(
          lobbiesData.sort(
            (a, b) =>
              new Date(a.scheduled_start_time).getTime() -
              new Date(b.scheduled_start_time).getTime(),
          ),
        );

        // Load locations and current user in the background so lobbies appear faster
        void (async () => {
          try {
            const locationsRes = await fetch(`${API_BASE_URL}/locations/location_manifest`);
            if (locationsRes.ok) {
              const locationsData: Location[] = await locationsRes.json();
              setLocations(locationsData);
            }
          } catch {
            // ignore location errors for the main lobbies list
          }
        })();

        void (async () => {
          try {
            const meRes = await authedFetch('/users/me');
            if (meRes.ok) {
              const me = (await meRes.json()) as { user_id: string };
              setCurrentUserId(me.user_id);
            }
          } catch {
            // ignore user loading errors; lobbies list still works
          }
        })();
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
    setLobbyName('');
    setSport('');
    setLocationId(null);
    setMaxPlayers('10');
    setIsPublic(true);
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    setScheduledAt(d);
    setCreateError(null);
    setLocationPickerOpen(false);
    setShowPicker(false);
    setAndroidPickerStep(null);
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
        setAndroidPickerStep(null);
        return;
      }
      if (!date || Number.isNaN(date.getTime())) return;
      if (androidPickerStep === 'date') {
        setScheduledAt((prev) => {
          const next = new Date(prev);
          next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
          return next;
        });
        setAndroidPickerStep('time');
        return;
      }
      if (androidPickerStep === 'time') {
        setScheduledAt((prev) => {
          const next = new Date(prev);
          next.setHours(date.getHours(), date.getMinutes(), 0, 0);
          return next;
        });
        setShowPicker(false);
        setAndroidPickerStep(null);
      }
      return;
    }

    // iOS: single datetime picker
    if (date && !Number.isNaN(date.getTime())) {
      setScheduledAt(date);
    }
  };

  const openDatePicker = () => {
    setShowPicker(true);
    if (Platform.OS === 'android') {
      setAndroidPickerStep('date');
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

  const selectedLocation = locationId
    ? locations.find((loc) => loc.location_id === locationId)
    : null;

  const filteredLobbies = useMemo(() => {
    const now = new Date();
    return lobbies.filter((lobby) => {
      if (sportFilter !== 'ALL' && lobby.sport !== sportFilter) return false;
      if (campusFilter !== 'ALL' && lobby.campus !== campusFilter) return false;
      if (timeFilter === 'upcoming') {
        return new Date(lobby.scheduled_start_time).getTime() >= now.getTime();
      }
      if (timeFilter === 'past') {
        return new Date(lobby.scheduled_start_time).getTime() < now.getTime();
      }
      return true;
    });
  }, [lobbies, sportFilter, campusFilter, timeFilter]);

  const handleCreateLobby = async () => {
    setCreateError(null);

    const trimmedLobbyName = lobbyName.trim();
    const trimmedSport = sport.trim();
    if (!trimmedLobbyName) {
      setCreateError('Please enter a lobby name.');
      return;
    }
    const max = parseInt(maxPlayers, 10);

    if (!trimmedSport) {
      setCreateError('Please select a sport.');
      return;
    }
    if (!locationId || !selectedLocation) {
      setCreateError('Please select a location.');
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
        lobby_name: trimmedLobbyName,
        sport: trimmedSport,
        campus: selectedLocation.campus,
        location_id: locationId,
        is_public: isPublic,
        max_players: max,
        scheduled_start_time: scheduledAt.toISOString(),
      };

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
      const createdWithCount: Lobby = {
        ...created,
        participant_count: created.participant_count ?? 1,
      };

      setLobbies((prev) =>
        [createdWithCount, ...prev].sort(
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

        <View style={styles.filterSection}>
          <View style={styles.filterHeaderRow}>
            <Text style={styles.filterLabel}>Filters</Text>
            <TouchableOpacity
              style={styles.addFilterButton}
              onPress={() =>
                setOpenFilter((prev) => (prev ? null : 'sport'))
              }
              activeOpacity={0.85}
            >
              <Text style={styles.addFilterText}>+ Add filter</Text>
            </TouchableOpacity>
          </View>

          {(sportFilter !== 'ALL' || campusFilter !== 'ALL' || timeFilter !== 'any') && (
            <View style={styles.activeFiltersRow}>
              {sportFilter !== 'ALL' && (
                <TouchableOpacity
                  style={styles.activeFilterChip}
                  onPress={() => setSportFilter('ALL')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activeFilterText}>Sport: {sportFilter} ✕</Text>
                </TouchableOpacity>
              )}
              {campusFilter !== 'ALL' && (
                <TouchableOpacity
                  style={styles.activeFilterChip}
                  onPress={() => setCampusFilter('ALL')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activeFilterText}>Campus: {campusFilter} ✕</Text>
                </TouchableOpacity>
              )}
              {timeFilter !== 'any' && (
                <TouchableOpacity
                  style={styles.activeFilterChip}
                  onPress={() => setTimeFilter('any')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activeFilterText}>
                    Time: {timeFilter === 'upcoming' ? 'Upcoming' : 'Past'} ✕
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {openFilter && (
            <View style={styles.filterOptionsPanel}>
              <Text style={styles.filterPanelTitle}>Choose a filter</Text>

              <Text style={styles.filterPanelCategory}>Sport</Text>
              <View style={styles.filterPanelRow}>
                {SPORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.filterOption}
                    onPress={() => setSportFilter(option)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterPanelCategory}>Campus</Text>
              <View style={styles.filterPanelRow}>
                {Object.keys(CAMPUS_COLORS).map((campus) => (
                  <TouchableOpacity
                    key={campus}
                    style={styles.filterOption}
                    onPress={() => setCampusFilter(campus)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterOptionText}>{campus}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterPanelCategory}>Time</Text>
              <View style={styles.filterPanelRow}>
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => setTimeFilter('upcoming')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.filterOptionText}>Upcoming only</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => setTimeFilter('past')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.filterOptionText}>Past only</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterPanelActions}>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSportFilter('ALL');
                    setCampusFilter('ALL');
                    setTimeFilter('any');
                    setOpenFilter(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.clearFiltersText}>Clear all</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneFiltersButton}
                  onPress={() => setOpenFilter(null)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.doneFiltersText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
        ) : filteredLobbies.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No lobbies yet</Text>
            <Text style={styles.mutedText}>
              Be the first to host a game — tap &quot;Create lobby&quot;.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {filteredLobbies.map((lobby) => {
              const loc = locationForLobby(lobby);
              const when = new Date(lobby.scheduled_start_time);
              const whenLabel = when.toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <Pressable
                  key={lobby.lobby_id}
                  style={({ pressed }) => [styles.lobbyCard, pressed && styles.lobbyCardPressed]}
                  onPress={() => router.push(`/lobby/${lobby.lobby_id}`)}
                >
                  <View style={styles.lobbyHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.lobbyNameRow}>
                        <Text style={styles.lobbyName}>{lobby.lobby_name}</Text>
                        {currentUserId === lobby.host_user_id && (
                          <View style={styles.yourLobbyPill}>
                            <Text style={styles.yourLobbyPillText}>your lobby</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.lobbySport}>{lobby.sport}</Text>
                    </View>
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
                      {lobby.is_public ? 'Public' : 'Private'} ·{' '}
                      {(lobby.participant_count ?? 0)}/{lobby.max_players} players
                    </Text>
                  </View>
                </Pressable>
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

            <Text style={styles.label}>Lobby name</Text>
            <TextInput
              style={styles.input}
              value={lobbyName}
              onChangeText={setLobbyName}
              placeholder="e.g. Friday Night Hoops"
              placeholderTextColor={MUTED_TEXT}
            />

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

            <Text style={styles.label}>Location</Text>
            <TouchableOpacity
              style={styles.locationSelectButton}
              onPress={() => setLocationPickerOpen(true)}
              activeOpacity={0.9}
            >
              {selectedLocation ? (
                <View style={styles.locationSelectContent}>
                  <Text style={[styles.locationSelectCampus, { color: getCampusColor(selectedLocation.campus) }]}>
                    {selectedLocation.campus}
                  </Text>
                  <Text style={styles.locationSelectName}>{selectedLocation.name}</Text>
                  <Text style={styles.locationSelectAddress}>{selectedLocation.address}</Text>
                </View>
              ) : (
                <Text style={styles.locationSelectPlaceholder}>Select location…</Text>
              )}
            </TouchableOpacity>
            {locations.length === 0 ? (
              <Text style={styles.mutedTextSmall}>
                No locations available. Please add locations in the database.
              </Text>
            ) : null}

            {/* Location picker modal (dropdown scroll wheel) */}
            <Modal
              visible={locationPickerOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setLocationPickerOpen(false)}
            >
              <View style={styles.locationPickerBackdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setLocationPickerOpen(false)} />
                <View style={styles.locationPickerCard}>
                  <Text style={styles.locationPickerTitle}>Select location</Text>
                  <ScrollView
                    style={styles.locationPickerScroll}
                    contentContainerStyle={styles.locationPickerScrollContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {locations.map((loc) => {
                      const selected = locationId === loc.location_id;
                      return (
                        <TouchableOpacity
                          key={loc.location_id}
                          style={[styles.locationPickerRow, selected && styles.locationPickerRowSelected]}
                          onPress={() => {
                            setLocationId(loc.location_id);
                            setLocationPickerOpen(false);
                          }}
                          activeOpacity={0.9}
                        >
                          <Text style={[styles.locationPickerCampus, { color: getCampusColor(loc.campus) }]}>
                            {loc.campus}
                          </Text>
                          <Text style={styles.locationPickerName}>{loc.name}</Text>
                          <Text style={styles.locationPickerAddress}>{loc.address}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.locationPickerDone}
                    onPress={() => setLocationPickerOpen(false)}
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
                  onPress={openDatePicker}
                  activeOpacity={0.9}
                >
                  <Text style={styles.dateButtonText}>{formattedDate}</Text>
                </TouchableOpacity>
                {showPicker && Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="datetime"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                    display="spinner"
                  />
                )}
                {showPicker && Platform.OS === 'android' && androidPickerStep === 'date' && (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                    display="default"
                  />
                )}
                {showPicker && Platform.OS === 'android' && androidPickerStep === 'time' && (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="time"
                    onChange={handleDateChange}
                    display="default"
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
  filterSection: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  addFilterButton: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_NAVY,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  activeFilterChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(249,250,251,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  filterOptionsPanel: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  filterPanelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  filterPanelCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
    marginTop: 4,
    marginBottom: 2,
  },
  filterPanelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(15,23,42,0.65)',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#E5E7EB',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterOptionText: {
    fontSize: 13,
    color: '#F9FAFB',
  },
  filterPanelActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  clearFiltersButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  doneFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  doneFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_NAVY,
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
  lobbyCardPressed: {
    opacity: 0.9,
  },
  lobbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  lobbyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  lobbyName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_NAVY,
  },
  yourLobbyPill: {
    backgroundColor: 'rgba(204, 0, 51, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  yourLobbyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: RUTGERS_RED,
  },
  lobbySport: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTED_TEXT,
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
  locationSelectButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 72,
    justifyContent: 'center',
  },
  locationSelectContent: {
    gap: 2,
  },
  locationSelectCampus: {
    fontSize: 14,
    fontWeight: '700',
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
    gap: 0,
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
  locationPickerCampus: {
    fontSize: 14,
    fontWeight: '700',
  },
  locationPickerName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_NAVY,
    marginTop: 2,
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

