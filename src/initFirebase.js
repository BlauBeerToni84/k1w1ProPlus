import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebase/firebaseConfig';

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Persistenz (Expo / RN)
firebase.auth().setPersistence({
  type: 'LOCAL',
  async get() { return AsyncStorage.getItem('firebase:authUser'); },
  async set(_, value) { await AsyncStorage.setItem('firebase:authUser', value); },
  async remove() { await AsyncStorage.removeItem('firebase:authUser'); },
});

export const auth = firebase.auth();
export const app = firebase.app();
