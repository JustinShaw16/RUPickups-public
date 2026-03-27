import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authedFetch } from '@/api/backend';

type Match = {
  match_id: string;
  lobby_id: string;
  match_number: number;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  winner_team: string | null;
  created_at: string;
};

type Participant = {
  player_id: string;
  username: string;
  is_ready: boolean;
  current_team: string | null;
};

type Lobby = {
  lobby_id: string;
  max_players: number;
};

type TeamKey = 'teamA' | 'teamB';
type TeamSlotsState = { teamA: Array<string | null>; teamB: Array<string | null> };

const RUTGERS_RED = '#CC0033';
const DARK_NAVY = '#111827';
const LIGHT_GRAY = '#F9FAFB';
const BORDER_GRAY = '#E5E7EB';
const MUTED_TEXT = '#6B7280';

export default function MatchPage() {
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Participant[]>([]);
  const [lobby, setLobby] = useState<Lobby | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [teamSlots, setTeamSlots] = useState<TeamSlotsState>({ teamA: [], teamB: [] });

  const [matchRunning, setMatchRunning] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { teamASlots, teamBSlots } = useMemo(() => {
    const max = Math.max(lobby?.max_players ?? 0, 0);
    return {
      teamASlots: Math.ceil(max / 2),
      teamBSlots: Math.floor(max / 2),
    };
  }, [lobby?.max_players]);

  const resizeSlots = useCallback((arr: Array<string | null>, size: number) => {
    if (arr.length === size) return arr;
    if (arr.length > size) return arr.slice(0, size);
    return [...arr, ...Array(size - arr.length).fill(null)];
  }, []);

  useEffect(() => {
    setTeamSlots((prev) => ({
      teamA: resizeSlots(prev.teamA, teamASlots),
      teamB: resizeSlots(prev.teamB, teamBSlots),
    }));
  }, [teamASlots, teamBSlots, resizeSlots]);

  useEffect(() => {
    const validPlayerIds = new Set(players.map((p) => p.player_id));

    setTeamSlots((prev) => ({
      teamA: prev.teamA.map((id) => (id && validPlayerIds.has(id) ? id : null)),
      teamB: prev.teamB.map((id) => (id && validPlayerIds.has(id) ? id : null)),
    }));

    if (selectedPlayerId && !validPlayerIds.has(selectedPlayerId)) {
      setSelectedPlayerId(null);
    }
  }, [players, selectedPlayerId]);

  const playersById = useMemo(
    () => new Map(players.map((p) => [p.player_id, p])),
    [players]
  );

  const assignedIds = useMemo(
    () =>
      new Set(
        [...teamSlots.teamA, ...teamSlots.teamB].filter(
          (id): id is string => id !== null
        )
      ),
    [teamSlots]
  );

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId((prev) => (prev === playerId ? null : playerId));
  };

  const handleSlotPress = (team: TeamKey, index: number) => {
    if (!selectedPlayerId) return;

    setTeamSlots((prev) => {
      const next: TeamSlotsState = {
        teamA: prev.teamA.map((id) => (id === selectedPlayerId ? null : id)),
        teamB: prev.teamB.map((id) => (id === selectedPlayerId ? null : id)),
      };

      const targetSlots = team === 'teamA' ? next.teamA : next.teamB;
      if (targetSlots[index] !== null) {
        return prev; // only allow placing into empty slot
      }

      targetSlots[index] = selectedPlayerId;
      return next;
    });

    setSelectedPlayerId(null);
  };

  const handleLeaveLobby = async () => {
    if (leaving || !match?.lobby_id) return;

    setLeaving(true);
    try {
      const res = await authedFetch(`/lobbies/${match.lobby_id}/leave`, {
        method: 'POST',
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Failed to leave lobby.');
      }

      router.replace('/(tabs)/lobbies');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to leave lobby.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Leave Lobby', message);
      }
    } finally {
      setLeaving(false);
    }
  };

  const load = useCallback(async () => {
    if (!matchId) {
      setError('Missing match ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const matchRes = await authedFetch(`/matches/${matchId}`);
      if (!matchRes.ok) {
        throw new Error(`Failed to load match (${matchRes.status})`);
      }

      const matchData = (await matchRes.json()) as Match;
      setMatch(matchData);

      const [lobbyRes, participantsRes] = await Promise.all([
        authedFetch(`/lobbies/${matchData.lobby_id}`),
        authedFetch(`/lobbies/${matchData.lobby_id}/participants`),
      ]);

      if (lobbyRes.ok) {
        const lobbyData = (await lobbyRes.json()) as Lobby;
        setLobby(lobbyData);
      } else {
        setLobby(null);
      }

      if (participantsRes.ok) {
        const participantData = (await participantsRes.json()) as Participant[];
        setPlayers(participantData);
      } else {
        setPlayers([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load match page.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
      if (!matchRunning || startedAtMs == null) return;
 
      const interval = setInterval(() => {
        setElapsedMs(Date.now() - startedAtMs);
      }, 1000);
 
      return () => clearInterval(interval);
  }, [matchRunning, startedAtMs]);

  const onStartMatch = async () => {
      if (submitting || matchRunning || !match?.match_id) return;
      setSubmitting(true);
 
      try {
        const teamAPlayerIds = teamSlots.teamA.filter((id): id is string => Boolean(id));
        const teamBPlayerIds = teamSlots.teamB.filter((id): id is string => Boolean(id));
        
        if (teamAPlayerIds.length === 0 || teamBPlayerIds.length === 0) {
          Alert.alert('Start Match', 'Assign at least one player to each team.');
          return;
        }
 
        const res = await authedFetch('/match-players/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            match_id: match.match_id,
            team_A_player_ids: teamAPlayerIds,
            team_B_player_ids: teamBPlayerIds,
          }),
        });
 
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || `Failed to create match players (${res.status})`);
        }
 
        const now = Date.now();
        setStartedAtMs(now);
        setElapsedMs(0);
        setMatchRunning(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to start match.';
        if (Platform.OS === 'web') window.alert(message);
        else Alert.alert('Start Match', message);
      } finally {
        setSubmitting(false);
      }
  };

  const onEndMatch = async () => {
      if (submitting || !matchRunning) return;
      setSubmitting(true);
 
      try {
        setMatchRunning(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to end match.';
        if (Platform.OS === 'web') window.alert(message);
        else Alert.alert('End Match', message);
      } finally {
        setSubmitting(false);
      }
  };

  const formatDuration = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
      const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Match</Text>
          <Pressable
            onPress={() => void handleLeaveLobby()}
            disabled={leaving}
            style={({ pressed }) => [
              styles.leaveButton,
              pressed && styles.leaveButtonPressed,
              leaving && styles.leaveButtonDisabled,
            ]}
          >
            <Text style={styles.leaveButtonText}>
              {leaving ? 'Leaving…' : 'Leave Lobby'}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.mutedOnRed}>Loading match...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.timerText}>{formatDuration(elapsedMs)}</Text>
            {matchRunning ? (
            <Pressable
                onPress={() => void onEndMatch()}
                style={styles.endButton}
                disabled={submitting}
            >
                <Text style={styles.endButtonText}>
                {submitting ? 'Ending…' : 'End Match'}
                </Text>
            </Pressable>
            ) : (
            <Pressable
                onPress={() => void onStartMatch()}
                style={styles.startButton}
                disabled={submitting}
            >
                <Text style={styles.startButtonText}>
                {submitting ? 'Starting…' : 'Start Match'}
                </Text>
            </Pressable>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Players ({players.length})</Text>
              <View style={styles.card}>
                {players.length === 0 ? (
                  <Text style={styles.emptyText}>No players found for this lobby.</Text>
                ) : (
                  players.map((p) => {
                    const selected = selectedPlayerId === p.player_id;
                    const assigned = assignedIds.has(p.player_id);

                    return (
                      <Pressable
                        key={p.player_id}
                        onPress={() => handleSelectPlayer(p.player_id)}
                        style={({ pressed }) => [
                          styles.playerRow,
                          selected && styles.playerRowSelected,
                          assigned && styles.playerRowAssigned,
                          pressed && styles.playerRowPressed,
                        ]}
                      >
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {p.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>

                        <Text style={styles.playerName}>{p.username}</Text>
                        <Text style={styles.playerTag}>
                          {selected ? 'Selected' : assigned ? 'Assigned' : 'Tap to select'}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
              <Text style={styles.helperText}>
                {selectedPlayerId
                  ? 'Now tap an empty team slot.'
                  : 'Tap a player, then tap an empty slot.'}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Teams</Text>

              <View style={styles.card}>
                <Text style={styles.teamTitle}>Team A</Text>
                {Array.from({ length: teamASlots }).map((_, i) => {
                  const playerId = teamSlots.teamA[i];
                  const player = playerId ? playersById.get(playerId) : null;
                  const isEmpty = !player;

                  return (
                    <Pressable
                      key={`a-${i}`}
                      onPress={() => handleSlotPress('teamA', i)}
                      style={[
                        styles.slotRow,
                        isEmpty && selectedPlayerId && styles.slotRowTarget,
                      ]}
                    >
                      <Text style={player ? styles.slotFilledText : styles.slotText}>
                        {player ? player.username : `Slot ${i + 1} · Empty`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.card, { marginTop: 12 }]}>
                <Text style={styles.teamTitle}>Team B</Text>
                {Array.from({ length: teamBSlots }).map((_, i) => {
                  const playerId = teamSlots.teamB[i];
                  const player = playerId ? playersById.get(playerId) : null;
                  const isEmpty = !player;

                  return (
                    <Pressable
                      key={`b-${i}`}
                      onPress={() => handleSlotPress('teamB', i)}
                      style={[
                        styles.slotRow,
                        isEmpty && selectedPlayerId && styles.slotRowTarget,
                      ]}
                    >
                      <Text style={player ? styles.slotFilledText : styles.slotText}>
                        {player ? player.username : `Slot ${i + 1} · Empty`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RUTGERS_RED },
  container: { padding: 20, paddingBottom: 28 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#FFFFFF' },

  leaveButton: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaveButtonPressed: {
    opacity: 0.8,
  },
  leaveButtonDisabled: {
    opacity: 0.6,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  center: { alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  mutedOnRed: { marginTop: 8, color: 'rgba(255,255,255,0.9)' },
  errorText: { color: '#FEE2E2', textAlign: 'center' },

  startButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: { color: RUTGERS_RED, fontSize: 16, fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10 },

  card: {
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 16,
    padding: 14,
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  playerRowPressed: { opacity: 0.9 },
  playerRowSelected: {
    borderColor: RUTGERS_RED,
    backgroundColor: 'rgba(204, 0, 51, 0.08)',
  },
  playerRowAssigned: {
    borderColor: '#D1D5DB',
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RUTGERS_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700' },

  playerName: { color: DARK_NAVY, fontSize: 15, fontWeight: '600' },
  playerTag: {
    marginLeft: 'auto',
    fontSize: 12,
    color: MUTED_TEXT,
  },

  helperText: {
    marginTop: 8,
    color: '#FEE2E2',
    fontSize: 12,
  },

  teamTitle: { color: DARK_NAVY, fontSize: 15, fontWeight: '700', marginBottom: 8 },

  slotRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BORDER_GRAY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  slotRowTarget: {
    borderColor: RUTGERS_RED,
    backgroundColor: 'rgba(204, 0, 51, 0.08)',
  },
  slotText: { color: MUTED_TEXT, fontSize: 14 },
  slotFilledText: { color: DARK_NAVY, fontSize: 14, fontWeight: '700' },

  emptyText: { color: MUTED_TEXT, fontSize: 14 },

  timerText: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 10,
  },

  endButton: {
      backgroundColor: '#B91C1C',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 24,
  },

  endButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
  },
});