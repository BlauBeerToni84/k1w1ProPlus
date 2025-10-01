import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { COLORS } from '../../src/theme/colors';
import { FONTS } from '../../src/theme/fonts';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login fehlgeschlagen', error.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>k1w1 Pro+</Text>
        <Text style={styles.subtitle}>No-Code DevOps Platform</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor={COLORS.gray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor={COLORS.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.buttonText}>Anmelden</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.linkText}>
              Noch kein Account? <Text style={styles.linkTextBold}>Registrieren</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontFamily: FONTS.headlines,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.gray,
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1A1A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: FONTS.headlines,
    color: COLORS.black,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.gray,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
