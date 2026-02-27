import { Image } from "expo-image";
import { Platform, StyleSheet, TextInput, Button } from "react-native";
import { useEffect, useState } from "react";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";
import { supabase } from '@/api/supabase'

// ✅ iOS simulator: 127.0.0.1
// ✅ Android emulator: 10.0.2.2
// ✅ Phone (Expo Go): your Mac IP (ex: http://192.168.1.23:8000)
const BASE_URL = "http://localhost:8000";

type User = {
  user_id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
};

export default function HomeScreen() {
  const [status, setStatus] = useState("loading...");
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(`${BASE_URL}/users/`);
      if (!res.ok) {
        setStatus(`error: ${res.status}`);
        return;
      }
      const data = (await res.json()) as User[];
      setUsers(data);
      setStatus("connected ✅");
    } catch (e) {
      setStatus(`error: ${String(e)}`);
    }
  }

  async function createUser() {
    try {
      await fetch(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          preferred_campus: "Busch",
          phone_number: "123-456-7890",
        }),
      });

      await fetchUsers(); // refresh list
      setNewUsername("");
    } catch (e) {
      console.log("error creating user:", e);
    }
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Button
          title="Logout"
          onPress={async () => {
            await supabase.auth.signOut();
          }}
        />
      </ThemedView>

      {/* Backend status + users */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Backend</ThemedText>
        <ThemedText>Status: {status}</ThemedText>

        {users.slice(0, 5).map((u) => (
          <ThemedText key={u.user_id}>
            {u.username} — ELO {u.elo} (W {u.wins} / L {u.losses})
          </ThemedText>
        ))}
      </ThemedView>

      {/* ✅ NEW: Create User */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Create User</ThemedText>

        <TextInput
          value={newUsername}
          onChangeText={setNewUsername}
          placeholder="Enter username"
          style={{
            borderWidth: 1,
            padding: 10,
            borderRadius: 8,
            marginTop: 8,
          }}
        />

        <Button
          title="Create"
          onPress={createUser}
          disabled={!newUsername.trim()}
        />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction
              title="Action"
              icon="cube"
              onPress={() => alert("Action pressed")}
            />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert("Share pressed")}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert("Delete pressed")}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});