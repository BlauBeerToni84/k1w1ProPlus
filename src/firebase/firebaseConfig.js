import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCG33RZCB63VGbGH48hfkvmowyKppkbF-4",
  authDomain: "proplus-b9ff1.firebaseapp.com",
  projectId: "proplus-b9ff1",
  storageBucket: "proplus-b9ff1.firebasestorage.app",
  messagingSenderId: "749408973957",
  appId: "1:749408973957:web:e0c447d26f3209f35965ec",
  measurementId: "G-TFJT56K6P5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
