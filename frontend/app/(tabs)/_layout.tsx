import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { Sidebar } from '@/components/sidebar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const DRAWER_WIDTH = 280;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const colors = Colors[colorScheme ?? 'light'];

  // Only run open animation when drawer opens; close is handled in closeDrawer so the panel actually slides off before we unmount the backdrop
  useEffect(() => {
    if (!drawerOpen) return;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerOpen, slideAnim, backdropAnim]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerOpen(false);
    });
  };

  return (
    <View style={styles.container}>
      {/* When drawer is open, block touches to main content so backdrop receives them and closes drawer */}
      <View style={styles.mainContent} pointerEvents={drawerOpen ? 'none' : 'auto'}>
        {/* Top bar: menu (left) + logo — paddingTop so menu isn't clipped by status bar on Android */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 10) },
          ]}
        >
          <View style={styles.menuButtonWrap}>
            <Pressable
              style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
              onPress={() => setDrawerOpen(true)}
            >
              <MaterialIcons name="menu" size={28} color={colors.text} />
            </Pressable>
          </View>
          <Image
            source={require('../photos/RUPickups.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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
            name="my-games"
            options={{
              title: 'My Games',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
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
      </View>

      {/* Backdrop only to the right of the drawer so tap there reliably closes it */}
      {drawerOpen && (
        <View style={styles.backdropWrap} pointerEvents="box-none">
          <Pressable
            style={styles.backdropTouchable}
            onPress={closeDrawer}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.backdrop, { opacity: backdropAnim }]}
            />
          </Pressable>
        </View>
      )}
      <Animated.View
        style={[
          styles.drawerPanel,
          { backgroundColor: colors.background, paddingTop: insets.top },
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
  mainContent: {
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
    zIndex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 4,
  },
  menuButtonPressed: {
    opacity: 0.7,
  },
  logo: {
    height: 52,
    width: 240,
    marginLeft: -75,
  },
  tabsWrap: {
    flex: 1,
  },
  backdropWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  backdropTouchable: {
    position: 'absolute',
    left: DRAWER_WIDTH,
    right: 0,
    top: 0,
    bottom: 0,
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

