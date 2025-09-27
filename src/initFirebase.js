import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
if (getApps().length === 0) initializeApp(firebaseConfig);
