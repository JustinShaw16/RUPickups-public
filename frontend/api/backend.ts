import { supabase } from '@/api/supabase'

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session?.access_token ?? null
}

export async function authedFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const token = await getAccessToken()
  if (!token) throw new Error('Not authenticated')

  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${API_BASE_URL}${path}`, { ...init, headers })
}

