import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig'; // Assuming auth and db are exported from here
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/fonts';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.email.split('@')[0], // Default display name from email
        createdAt: new Date(),
      });

      Alert.alert('Erfolg', 'Account erfolgreich erstellt!');
      navigation.replace('Chat'); // Navigate to Chat screen on successful signup
    } catch (error) {
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Die E-Mail-Adresse ist ungültig.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'E-Mail/Passwort-Anmeldung ist nicht aktiviert.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Das Passwort ist zu schwach.';
          break;
        default:
          errorMessage = error.message;
          break;
      }
      Alert.alert('Fehler bei der Registrierung', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Registrieren</Text>

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
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Registrieren</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Bereits ein Konto? Anmelden</Text>
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
  loginText: {
    color: COLORS.accent,
    fontFamily: FONTS.body,
    fontSize: 16,
    marginTop: 20,
  },
});

export default SignUpScreen;
