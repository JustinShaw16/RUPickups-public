import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { Sidebar } from '@/components/sidebar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const DRAWER_WIDTH = 280;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: drawerOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerOpen, slideAnim, backdropAnim]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <View style={styles.container}>
      {/* Top bar: menu (left) + logo */}
      <View style={[styles.topBar, { backgroundColor: colors.background }]}>
        <Image
          source={require('../photos/RUPickups.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.menuButtonWrap}>
          <Pressable
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
            onPress={() => setDrawerOpen(true)}
          >
            <MaterialIcons name="menu" size={28} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <Tabs
          initialRouteName="lobbies"
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            tabBarButton: HapticTab,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              href: null,
              title: 'Home',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="lobbies"
            options={{
              title: 'Lobbies',
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="person.3.sequence.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Leaderboard',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              href: null,
              title: 'Explore',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
            }}
          />
        </Tabs>
      </View>

      {/* Drawer overlay */}
      {drawerOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />
        </Pressable>
      )}
      <Animated.View
        style={[
          styles.drawerPanel,
          { backgroundColor: colors.background },
          { transform: [{ translateX: slideAnim }] },
        ]}
        pointerEvents={drawerOpen ? 'auto' : 'none'}
      >
        <Sidebar onClose={closeDrawer} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  menuButtonWrap: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
  },
  menuButton: {
    padding: 8,
  },
  menuButtonPressed: {
    opacity: 0.7,
  },
  logo: {
    height: 52,
    width: 240,
    marginLeft: -25,
  },
  tabsWrap: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawerPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 10,
  },
});
