import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { supabase } from '@/api/supabase'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const segments = useSegments()

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const inAuthGroup =
      segments[0] === 'login' ||
      segments[0] === 'signup' ||
      segments[0] === 'complete-profile'

    if (!session && !inAuthGroup) {
      router.replace('/login')
    } else if (session && (segments[0] === 'login' || segments[0] === 'signup')) {
      router.replace('/complete-profile')
    }
  }, [session, segments, loading, router])

  if (loading) return null

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}