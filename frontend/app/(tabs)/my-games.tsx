import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type GamesTab = 'upcoming' | 'previous';

export default function MyGamesScreen() {
  const [activeTab, setActiveTab] = useState<GamesTab>('upcoming');

  const isUpcoming = activeTab === 'upcoming';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.heading}>My games</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, isUpcoming && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isUpcoming && styles.tabTextActive]}>
              Upcoming Games
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, !isUpcoming && styles.tabActive]}
            onPress={() => setActiveTab('previous')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabText, !isUpcoming && styles.tabTextActive]}
            >
              Previous Games
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {isUpcoming ? 'Upcoming Games' : 'Previous Games'}
          </Text>

          <Text style={styles.subtitle}>
            {isUpcoming
              ? "It looks like you don't have any games scheduled right now!"
              : "It looks like you don't have any previous games yet!"}
          </Text>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>
              {isUpcoming ? 'Find One' : 'Schedule a Game'}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const RUTGERS_RED = '#CC0033';
const DARK_NAVY = '#111827';
const LIGHT_GRAY = '#F9FAFB';
const BORDER_GRAY = '#D1D5DB';
const MUTED_TEXT = '#6B7280';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RUTGERS_RED,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RUTGERS_RED,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK_NAVY,
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_TEXT,
  },
  tabTextActive: {
    color: DARK_NAVY,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: DARK_NAVY,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: MUTED_TEXT,
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: DARK_NAVY,
    borderRadius: 999,
    paddingHorizontal: 40,
    paddingVertical: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

