import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig'; // Assuming auth is exported from here
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/fonts';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Erfolg', 'Erfolgreich eingeloggt!');
      navigation.replace('Chat'); // Navigate to Chat screen on successful login
    } catch (error) {
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Die E-Mail-Adresse ist ungültig.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Dieser Benutzer wurde deaktiviert.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Falsches Passwort.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Ungültige Anmeldeinformationen.';
          break;
        default:
          errorMessage = error.message;
          break;
      }
      Alert.alert('Fehler beim Login', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Anmelden</Text>

      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        placeholderTextColor={COLORS.gray}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        placeholderTextColor={COLORS.gray}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.signUpText}>Noch kein Konto? Registrieren</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 20,
    padding: 15,
    width: '100%',
  },
  buttonText: {
    color: COLORS.black,
    fontFamily: FONTS.headlines,
    fontSize: 18,
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headline: {
    color: COLORS.primary,
    fontFamily: FONTS.headlines,
    fontSize: 32,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#1A1A2A', // Slightly lighter dark for input fields
    borderRadius: 8,
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: 15,
    padding: 15,
    width: '100%',
  },
  signUpText: {
    color: COLORS.accent,
    fontFamily: FONTS.body,
    fontSize: 16,
    marginTop: 20,
  },
});

export default LoginScreen;
