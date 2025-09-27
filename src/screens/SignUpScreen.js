import React, { useState } from 'react';
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
