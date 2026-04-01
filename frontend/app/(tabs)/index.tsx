import { Redirect } from 'expo-router';

/**
 * Default tab URL was `/` and briefly showed the old home screen after login.
 * Send users straight to Lobbies (same as web `/lobbies`).
 */
export default function Index() {
  return <Redirect href="/lobbies" />;
}
