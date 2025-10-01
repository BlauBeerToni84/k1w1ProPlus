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

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Registrierung fehlgeschlagen', error.message);
    } else if (data?.user) {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert([{ user_id: data.user.id }]);

      if (settingsError) {
        console.error('Settings creation failed:', settingsError);
      }

      Alert.alert(
        'Erfolg',
        'Account erstellt! Du kannst dich jetzt anmelden.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Registrieren</Text>
        <Text style={styles.subtitle}>Erstelle deinen k1w1 Pro+ Account</Text>

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
          <TextInput
            style={styles.input}
            placeholder="Passwort bestätigen"
            placeholderTextColor={COLORS.gray}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.buttonText}>Account erstellen</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>
              Schon registriert? <Text style={styles.linkTextBold}>Anmelden</Text>
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
