import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '@/api/supabase'
import { API_BASE_URL } from '@/api/backend'

const CAMPUS_OPTIONS = [
  'College Avenue',
  'Busch',
  'Livingston',
  'Cook/Douglass',
] as const

export default function Signup() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [preferredCampus, setPreferredCampus] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [campusError, setCampusError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [globalSuccess, setGlobalSuccess] = useState('')

  const handleSignup = async () => {
    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phoneNumber.trim()

    setUsernameError('')
    setCampusError('')
    setPhoneError('')
    setEmailError('')
    setPasswordError('')
    setGlobalError('')
    setGlobalSuccess('')

    let hasError = false

    if (!trimmedUsername) {
      setUsernameError('Please enter a username.')
      hasError = true
    }
    if (!preferredCampus) {
      setCampusError('Please select a preferred campus.')
      hasError = true
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email.')
      hasError = true
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      hasError = true
    }
    if (trimmedPhone) {
      const digits = trimmedPhone.replace(/\D/g, '')
      if (digits.length < 10) {
        setPhoneError('Please enter a valid phone number (at least 10 digits).')
        hasError = true
      }
    }

    if (hasError) return

    if (submitting) return
    setSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            username: trimmedUsername,
            preferred_campus: preferredCampus,
            phone_number: trimmedPhone,
          },
        },
      })

      if (error) {
        setGlobalError(error.message)
        return
      }

      const token = data.session?.access_token

      // If email confirmation is enabled, Supabase may return no session here.
      if (!token) {
        setGlobalSuccess(
          'Signup successful. Check your email to confirm your account, then log in.'
        )
        return
      }

      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: trimmedUsername,
          preferred_campus: preferredCampus,
          phone_number: trimmedPhone,
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        setGlobalError('Signup succeeded, but profile setup failed.')
        return
      }

      router.replace('/(tabs)')
    } catch (e) {
      setGlobalError('Signup failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <View style={styles.background}>
        <View style={styles.overlay}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>
                Join RUPickups and find games across campus.
              </Text>

              {globalError ? (
                <Text style={styles.errorText}>{globalError}</Text>
              ) : null}
              {globalSuccess ? (
                <Text style={styles.successText}>{globalSuccess}</Text>
              ) : null}

              <TextInput
                placeholder="Username"
                placeholderTextColor="#64748b"
                value={username}
                onChangeText={setUsername}
                style={[styles.input, usernameError && styles.inputError]}
                autoCapitalize="none"
              />
              {usernameError ? (
                <Text style={styles.errorText}>{usernameError}</Text>
              ) : null}

              <Text style={styles.label}>Preferred campus</Text>

              <View style={styles.campusWrap}>
                {CAMPUS_OPTIONS.map((campus) => {
                  const selected = preferredCampus === campus
                  return (
                    <TouchableOpacity
                      key={campus}
                      onPress={() => setPreferredCampus(campus)}
                      activeOpacity={0.85}
                      style={[styles.campusPill, selected && styles.campusPillSelected]}
                    >
                      <Text style={[styles.campusPillText, selected && styles.campusPillTextSelected]}>
                        {campus}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {campusError ? (
                <Text style={styles.errorText}>{campusError}</Text>
              ) : null}

              <TextInput
                placeholder="Phone number"
                placeholderTextColor="#64748b"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={[styles.input, phoneError && styles.inputError]}
                keyboardType="phone-pad"
              />
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}

              <TextInput
                placeholder="Email"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                style={[styles.input, emailError && styles.inputError]}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <TextInput
                placeholder="Password (min 8 characters)"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, passwordError && styles.inputError]}
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={submitting}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>
                  {submitting ? 'Creating account...' : 'Sign up'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <Link href="/login" style={styles.link}>
                  Log in
                </Link>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  background: {
    flex: 1,
    backgroundColor: '#CC0033',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 26,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#020617',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9fafb',
    color: '#020617',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  button: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
  },
  successText: {
    color: '#16a34a',
    fontSize: 13,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  link: {
    marginLeft: 4,
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
  },
  campusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  campusPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  campusPillSelected: {
    borderColor: '#CC0033',
    backgroundColor: 'rgba(204, 0, 51, 0.10)',
  },
  campusPillText: {
    fontSize: 14,
    color: '#0f172a',
  },
  campusPillTextSelected: {
    color: '#CC0033',
    fontWeight: '700',
  },
})