import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/api/supabase'

const CAMPUS_OPTIONS = [
  'College Avenue',
  'Busch',
  'Livingston',
  'Cook/Douglass',
] as const

export default function Signup() {
  const [username, setUsername] = useState('')
  const [preferredCampus, setPreferredCampus] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [campusModalVisible, setCampusModalVisible] = useState(false)

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      Alert.alert('Signup failed', error.message)
      return
    }

    Alert.alert('Success', 'Signup request sent.')
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Preferred Campus</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setCampusModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.dropdownText,
                !preferredCampus && styles.dropdownPlaceholder,
              ]}
            >
              {preferredCampus || 'Select a campus'}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#888"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>

          <Link href="/login" style={styles.link}>
            Already have an account? Sign in
          </Link>
        </View>
      </ScrollView>

      {/* Campus Selection Modal */}
      <Modal
        visible={campusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCampusModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCampusModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Choose Campus</Text>

            {CAMPUS_OPTIONS.map((campus) => {
              const selected = preferredCampus === campus
              return (
                <TouchableOpacity
                  key={campus}
                  style={[
                    styles.optionRow,
                    selected && styles.optionRowSelected,
                  ]}
                  onPress={() => {
                    setPreferredCampus(campus)
                    setCampusModalVisible(false)
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {campus}
                  </Text>
                  {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                </TouchableOpacity>
              )
            })}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCampusModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    color: 'white',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  label: {
    color: '#cbd5e1',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
  },

  // Custom dropdown field
  dropdown: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#888',
  },
  dropdownArrow: {
    color: '#94a3b8',
    fontSize: 16,
    marginLeft: 8,
  },

  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    color: '#60a5fa',
    textAlign: 'center',
    fontSize: 14,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowSelected: {
    backgroundColor: '#1d4ed8',
  },
  optionText: {
    color: '#e5e7eb',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  checkmark: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#93c5fd',
    fontSize: 15,
    fontWeight: '600',
  },
})