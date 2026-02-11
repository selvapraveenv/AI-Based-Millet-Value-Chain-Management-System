/**
 * Firebase Admin SDK Configuration
 * Connects to Firebase Firestore for data storage
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db = null;

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for credentials
 */
export const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      db = admin.firestore();
      return;
    }

    // Initialize with service account credentials from environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });

    // Get Firestore instance
    db = admin.firestore();
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📦 Connected to Firestore project: ${process.env.FIREBASE_PROJECT_ID}`);
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.error('Please check your .env file and Firebase credentials');
    process.exit(1);
  }
};

/**
 * Get Firestore database instance
 * @returns {admin.firestore.Firestore} Firestore database
 */
export const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
};

/**
 * Firebase Collections
 * Centralized collection names for consistency
 */
export const Collections = {
  FARMERS: 'farmers',
  SHGS: 'shgs',
  CONSUMERS: 'consumers',
  ADMINS: 'admins',
  LISTINGS: 'listings',
  ORDERS: 'orders',
  BATCHES: 'batches',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  QUALITY_CHECKS: 'qualityChecks',
  PRICE_HISTORY: 'priceHistory'
};

export default admin;