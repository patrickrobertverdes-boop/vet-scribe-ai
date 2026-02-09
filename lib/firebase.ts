import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, persistentSingleTabManager, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const isFirebaseConfigured = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key'
);

const app = getApps().length > 0 ? getApp() : (isFirebaseConfigured ? initializeApp(firebaseConfig) : null);

// Optimized Firestore with persistent cache for lightning fast connection
const db = isFirebaseConfigured
    ? (typeof window !== 'undefined'
        ? initializeFirestore(app!, {
            localCache: persistentLocalCache({
                tabManager: Capacitor.isNativePlatform() ? persistentSingleTabManager({}) : persistentMultipleTabManager()
            })
        })
        : getFirestore(app!))
    : null;

const auth = isFirebaseConfigured ? getAuth(app!) : null;
const storage = isFirebaseConfigured ? getStorage(app!) : null;

// Initialize Performance Monitoring (Client Side Only)
let performance = null;
if (typeof window !== 'undefined' && isFirebaseConfigured) {
    import('firebase/performance').then(({ getPerformance }) => {
        performance = getPerformance(app!);
    }).catch(err => console.warn("Firebase Performance failed to load", err));
}

export { app, db, auth, storage, performance, isFirebaseConfigured };
