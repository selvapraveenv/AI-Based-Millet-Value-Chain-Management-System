// Firebase Configuration for Frontend (Next.js)
// This file connects your frontend to Firebase services

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlF878VYauyK9g6WlZAOWcV3bgeCx3V4Q",
  authDomain: "milletchain-fd497.firebaseapp.com",
  projectId: "milletchain-fd497",
  storageBucket: "milletchain-fd497.firebasestorage.app",
  messagingSenderId: "85818192762",
  appId: "1:85818192762:web:a951864f575df1daf5dcc3"
};

// Initialize Firebase (prevent multiple initializations in Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
