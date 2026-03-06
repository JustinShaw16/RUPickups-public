import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View, Button } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

const RUTGERS_RED = '#CC0033';
const LIGHT_GRAY = '#F9FAFB';
const DARK_NAVY = '#111827';

export default function ViewProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
          router.replace('/login')
          return
        }
        if (mounted) setError(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={[styles.title, styles.text]}>
          Profile
        </ThemedText>

        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} color={LIGHT_GRAY} />
        ) : error ? (
          <ThemedText style={[styles.errorText, styles.text]}>{error}</ThemedText>
        ) : user ? (
          <View style={styles.card}>
            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, styles.text]}>
              Username
            </ThemedText>
            <ThemedText style={styles.text}>{user.username}</ThemedText>

            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, styles.text]}>
              Preferred campus
            </ThemedText>
            <ThemedText style={styles.text}>{user.preferred_campus ?? '—'}</ThemedText>

            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, styles.text]}>
              Phone
            </ThemedText>
            <ThemedText style={styles.text}>{user.phone_number ?? '—'}</ThemedText>

            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, styles.text]}>
              Stats
            </ThemedText>
            <ThemedText style={styles.text}>
              ELO {user.elo} — W {user.wins} / L {user.losses}
            </ThemedText>

            <View style={styles.actions}>
              <View style={styles.buttonWrapper}>
                <Button title="Edit profile" onPress={() => {}} disabled />
              </View>
              <View style={styles.buttonWrapper}>
                <Button
                  title="Logout"
                  color={RUTGERS_RED}
                  onPress={async () => {
                    await supabase.auth.signOut();
                    router.replace('/login');
                  }}
                />
              </View>
            </View>

            <View style={styles.backWrap}>
              <ThemedText type="link" style={styles.text} onPress={() => router.back()}>
                Back
              </ThemedText>
            </View>
          </View>
        ) : (
          <ThemedText style={styles.text}>No profile data.</ThemedText>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RUTGERS_RED },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: RUTGERS_RED,
    flex: 1,
  },
  title: {color: '#fff'},
  text: { color: DARK_NAVY },
  loader: { marginTop: 20 },
  card: {
    gap: 8,
    marginTop: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 16,
    padding: 16,
  },
  fieldLabel: { marginTop: 12 },
  fieldValue: { color: DARK_NAVY },
  actions: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' },
  buttonWrapper: { flex: 1, marginHorizontal: 6 },
  backWrap: { marginTop: 16, alignItems: 'center' },
  errorText: { color: '#fff' },
});
