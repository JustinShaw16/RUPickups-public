import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { authedFetch } from '@/api/backend';
import { supabase } from '@/api/supabase';

type User = {
  user_id: string;
  username: string;
  preferred_campus?: string | null;
  phone_number?: string | null;
  elo: number;
  wins: number;
  losses: number;
};

const palette = {
  page: '#CC0033',
  card: '#FFFFFF',
  softCard: '#FFF3F7',
  border: '#F1CCD8',
  accent: '#CC0033',
  accentDark: '#AA0029',
  text: '#3B1F28',
  muted: '#7A5A65',
  chipBg: '#FFE3EB',
  eloNoteBg: '#FFF0F4',
};

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <MaterialIcons name={icon} size={18} color={palette.accent} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ViewProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 950;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await authedFetch('/users/me');

        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/login');
            return;
          }

          if (res.status === 404) {
            setError('No profile found.');
            return;
          }

          throw new Error(`Failed to load profile (${res.status})`);
        }

        const data = (await res.json()) as User;
        if (mounted) setUser(data);
      } catch (e) {
        const msg = String(e || '');

        if (msg.includes('Not authenticated')) {
          router.replace('/login');
          return;
        }

        if (mounted) {
          setError('We could not load your profile right now.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [router]);

  // winRate 
  const winRate = useMemo(() => {
    if (!user) return '—';
    const total = user.wins + user.losses;
    if (total === 0) return 'No games yet';
    return `${Math.round((user.wins / total) * 100)}%`;
  }, [user]);

  const totalGames = useMemo(() => {
    if (!user) return 0;
    return user.wins + user.losses;
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.replace('/login');
    } catch {
      Alert.alert('Logout failed', 'Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.page, isWide && styles.pageWide]}>
          {/*  added accessibilityRole and accessibilityLabel */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={18} color={palette.accentDark} />
          </Pressable>

          <View style={styles.heroCard}>
            <View style={styles.heroAccentRow}>
              <View style={styles.sectionAccentLine} />
              {/* softened dot color to match design system */}
              <View style={styles.sectionAccentDot} />
            </View>

            <View style={styles.heroIcon}>
              <MaterialIcons name="person-outline" size={20} color={palette.accent} />
            </View>

            <Text style={styles.heroTitle}>Profile</Text>
            <Text style={styles.heroSubtitle}>
              View your account details, stats, and current standing.
            </Text>
            <Text style={styles.heroBody}>
              Your profile gives you a quick look at your account information, ELO, and overall
              match record in RUPickups.
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color={palette.accent} />
              <Text style={styles.stateText}>Loading your profile...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <View style={styles.errorIconWrap}>
                <MaterialIcons name="error-outline" size={22} color={palette.accent} />
              </View>
              <Text style={styles.stateTitle}>Something went wrong</Text>
              <Text style={styles.stateText}>{error}</Text>
            </View>
          ) : user ? (
            <View style={[styles.contentRow, isWide && styles.contentRowWide]}>
              <View style={[styles.mainPanel, isWide && styles.mainPanelWide]}>
                <View style={styles.profileCard}>
                  <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {user.username?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>

                    <View style={styles.profileHeaderText}>
                      <Text style={styles.username}>{user.username}</Text>
                      <Text style={styles.userSubtext}>RUPickups player profile</Text>
                    </View>
                  </View>

                  <View style={styles.profileDetailsCard}>
                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <InfoRow label="Username" value={user.username || '—'} icon="badge" />
                    <InfoRow
                      label="Preferred Campus"
                      value={user.preferred_campus ?? 'Not set'}
                      icon="location-city"
                    />
                    <InfoRow
                      label="Phone Number"
                      value={user.phone_number ?? 'Not set'}
                      icon="phone"
                    />
                  </View>

                  <View style={styles.profileDetailsCard}>
                    <Text style={styles.sectionTitle}>Performance</Text>

                    <View style={styles.statGrid}>
                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{user.elo}</Text>
                        <Text style={styles.statLabel}>Current ELO</Text>
                      </View>

                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{user.wins}</Text>
                        <Text style={styles.statLabel}>Wins</Text>
                      </View>

                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{user.losses}</Text>
                        <Text style={styles.statLabel}>Losses</Text>
                      </View>

                      {/*  winRate is always a string*/}
                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{winRate}</Text>
                        <Text style={styles.statLabel}>Win Rate</Text>
                      </View>
                    </View>

                    <View style={styles.eloNoteCard}>
                      <View style={styles.eloNoteIcon}>
                        <MaterialIcons name="trending-up" size={18} color={palette.accent} />
                      </View>
                      <View style={styles.eloNoteTextWrap}>
                        <Text style={styles.eloNoteTitle}>How ELO works</Text>
                        <Text style={styles.eloNoteBody}>
                          Your ELO changes based on wins and losses. Winning games generally raises
                          your rating, while losing games can lower it, helping reflect performance
                          over time.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    {/*  added accessibilityRole and accessibilityLabel */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => router.push('/edit-profile')}
                      accessibilityRole="button"
                      accessibilityLabel="Edit profile"
                    >
                      <MaterialIcons name="edit" size={16} color={palette.accent} />
                      <Text style={styles.secondaryButtonText}>Edit Profile</Text>
                    </Pressable>

                    {/* ActivityIndicator on loading + full accessibility props */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && !isLoggingOut && styles.buttonPressed,
                        isLoggingOut && styles.buttonDisabled,
                      ]}
                      onPress={handleLogout}
                      disabled={isLoggingOut}
                      accessibilityRole="button"
                      accessibilityLabel="Log out"
                      accessibilityState={{ disabled: isLoggingOut }}
                    >
                      {isLoggingOut ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="logout" size={16} color="#fff" />
                          <Text style={styles.primaryButtonText}>Logout</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={[styles.sidePanel, isWide && styles.sidePanelWide]}>
                <View style={styles.sideCard}>
                  <Text style={styles.sideCardTitle}>Quick Summary</Text>

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Games</Text>
                    <Text style={styles.summaryValue}>{totalGames}</Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Current ELO</Text>
                    <Text style={styles.summaryValue}>{user.elo}</Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Record</Text>
                    <Text style={styles.summaryValue}>
                      {user.wins}W - {user.losses}L
                    </Text>
                  </View>
                </View>

                <View style={styles.sideCard}>
                  <Text style={styles.sideCardTitle}>Profile Notes</Text>
                  <Text style={styles.sideCardBody}>
                    Keeping your profile updated helps other players recognize you and makes your
                    account feel more complete and trustworthy inside the app.
                  </Text>
                </View>

                <View style={styles.sideCard}>
                  <Text style={styles.sideCardTitle}>Need help?</Text>
                  <Text style={styles.sideCardBody}>
                    If something looks incorrect on your account or stats, use the Contact Us page
                    to reach out.
                  </Text>

                  {/* added accessibilityRole and accessibilityLabel */}
                  <Pressable
                    onPress={() => router.push('/contact-us')}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.sideButton,
                      pressed && styles.buttonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Go to Contact Us page"
                  >
                    <MaterialIcons name="mail-outline" size={16} color="#fff" />
                    <Text style={styles.primaryButtonText}>Go to Contact Us</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>No profile data</Text>
              <Text style={styles.stateText}>We could not find any profile information yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.page,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    paddingHorizontal: 18,
    paddingVertical: 24,
    gap: 18,
  },
  pageWide: {
    paddingHorizontal: 30,
    paddingVertical: 34,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 22,
    shadowColor: 'rgba(204, 0, 51, 0.10)',
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionAccentLine: {
    width: 40,
    height: 2,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },

  sectionAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#D96E6E',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.chipBg,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: palette.accentDark,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: palette.text,
  },
  heroBody: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 24,
    color: palette.muted,
    maxWidth: 720,
  },
  stateCard: {
    backgroundColor: palette.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  stateTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  stateText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: palette.muted,
    textAlign: 'center',
  },
  errorIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.chipBg,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    gap: 18,
  },
  contentRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainPanel: {},
  mainPanelWide: {
    flex: 1.35,
  },
  sidePanel: {
    gap: 18,
  },
  sidePanelWide: {
    flex: 0.9,
  },
  profileCard: {
    backgroundColor: palette.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    gap: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: palette.chipBg,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.accentDark,
  },
  profileHeaderText: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
  },
  userSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: palette.muted,
  },
  profileDetailsCard: {
    backgroundColor: palette.softCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5D8E1',
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: palette.text,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.accentDark,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    color: palette.muted,
    fontWeight: '600',
  },
  eloNoteCard: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 12,
    // references renamed palette key
    backgroundColor: palette.eloNoteBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
  },
  eloNoteIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eloNoteTextWrap: {
    flex: 1,
  },
  eloNoteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 4,
  },
  eloNoteBody: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.muted,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: palette.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexGrow: 1,
  },
  secondaryButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexGrow: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: palette.accentDark,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  sideCard: {
    backgroundColor: palette.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
  },
  sideCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 12,
  },
  sideCardBody: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.muted,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  summaryLabel: {
    fontSize: 14,
    color: palette.muted,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: palette.text,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3D3DD',
    marginVertical: 12,
  },
  sideButton: {
    marginTop: 16,
  },
});
