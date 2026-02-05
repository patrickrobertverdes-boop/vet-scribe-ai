'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    collection
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isSigningUp: boolean;
    signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const router = useRouter();

    // Helper to initialize user data (Runs in background)
    const initializeUserBackground = async (user: User) => {
        if (!db) return;
        try {
            // Priority: Minimal Profile (ensure this exists)
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                uid: user.uid,
                role: 'owner',
                lastSeen: serverTimestamp()
            }, { merge: true });

            // Subcollections - Fire and forget checks
            // We use promise.allsettled to not block each other
            const subcollections = [
                (async () => {
                    const clientDataRef = doc(collection(userDocRef, 'client_data'), 'config');
                    const snap = await getDoc(clientDataRef);
                    if (!snap.exists()) {
                        await setDoc(clientDataRef, {
                            initialized: true,
                            createdAt: serverTimestamp(),
                            maxClients: 100,
                            dataVersion: '1.0'
                        });
                    }
                })(),
                (async () => {
                    const historyRef = doc(collection(userDocRef, 'history'), 'welcome_note');
                    const snap = await getDoc(historyRef);
                    if (!snap.exists()) {
                        await setDoc(historyRef, {
                            title: 'Welcome to VetScribe',
                            content: 'This is your first scribe history entry.',
                            type: 'system_note',
                            createdAt: serverTimestamp(),
                            pinned: true
                        });
                    }
                })(),
                (async () => {
                    const patientRef = doc(collection(userDocRef, 'patients'), '_placeholder');
                    const snap = await getDoc(patientRef);
                    if (!snap.exists()) {
                        await setDoc(patientRef, {
                            placeholder: true,
                            description: 'This collection stores your patient records.'
                        });
                    }
                })()
            ];

            Promise.allSettled(subcollections).then(() => {
                console.log("Background initialization complete for:", user.uid);
            });

        } catch (error) {
            console.error("Background initialization warning:", error);
        }
    };

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false); // Unblock UI immediately

            if (currentUser) {
                // Run background initialization without awaiting
                initializeUserBackground(currentUser);
            }
        });

        return () => unsubscribe();
    }, []);

    const signup = async (email: string, password: string, firstName: string, lastName: string) => {
        if (!auth || !db) throw new Error("Firebase configuration missing");

        setIsSigningUp(true);
        const correlationId = `signup_client_${Date.now()}`;
        console.log(`[STAGE: START] [${correlationId}] Client initiated signup for: ${email}`);

        try {
            // 1. Create Auth User
            console.log(`[STAGE: AUTH] [${correlationId}] Registering credentials in Firebase...`);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const { user } = userCredential;
            console.log(`[STAGE: AUTH] [${correlationId}] Firebase user created: ${user.uid}`);

            // 2. Set display name
            console.log(`[STAGE: PROFILE] [${correlationId}] Updating Auth profile display name...`);
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            // 3. Firestore Record
            console.log(`[STAGE: FIRESTORE] [${correlationId}] Creating user document in Firestore...`);
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                firstName: firstName,
                lastName: lastName,
                displayName: `${firstName} ${lastName}`,
                createdAt: serverTimestamp(),
                uid: user.uid,
                role: 'owner',
                settings: { theme: 'system', notifications: true }
            });
            console.log(`[STAGE: FIRESTORE] [${correlationId}] Document committed successfully`);

            // 4. Trigger Server Webhook
            console.log(`[STAGE: WEBHOOK] [${correlationId}] calling /api/auth/signup-verification...`);

            // Artificial delay to ensure indexing
            await new Promise(resolve => setTimeout(resolve, 800));

            const webhookRes = await fetch('/api/auth/signup-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    displayName: `${firstName} ${lastName}`,
                    uid: user.uid,
                    correlationId
                })
            });

            if (!webhookRes.ok) {
                const errorData = await webhookRes.json().catch(() => ({ error: 'Backend Unreachable' }));
                console.error(`[STAGE: WEBHOOK-FAILURE] [${correlationId}]`, errorData);
                throw new Error(`Webhook Error: ${errorData.error || 'Server rejected request'}`);
            }

            console.log(`[STAGE: WEBHOOK-SUCCESS] [${correlationId}] Server confirmed webhook dispatch`);

            // 5. Finalize UI
            toast.success('Security link dispatched to registry email.');
            router.push('/verify-email');

        } catch (error: any) {
            console.error(`[STAGE: FATAL] [${correlationId}] Execution halted:`, error.message);

            let message = error.message || 'Verification flow failed.';
            if (error.code === 'auth/email-already-in-use') message = 'This email is already in our clinical registry.';
            if (error.code === 'auth/weak-password') message = 'Security key must be at least 6 characters.';

            toast.error(message, { duration: 5000 });
            throw new Error(message);
        } finally {
            setIsSigningUp(false);
        }
    };

    const resendVerification = async () => {
        if (!user?.email) {
            console.error("[Auth-Flow] Cannot resend: User context missing or email null");
            throw new Error("Identity context missing");
        }

        const correlationId = `resend_client_${Date.now()}`;
        console.log(`[Auth-Flow] [${correlationId}] Initiating custom resend for: ${user.email}`);

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    displayName: user.displayName,
                    uid: user.uid
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Transmission Error' }));
                console.error(`[Auth-Flow] [${correlationId}] Resend webhook failure:`, errorData);
                throw new Error("Verification link delivery failed. Please try again.");
            }

            console.log(`[Auth-Flow] [${correlationId}] Resend webhook confirmed`);
            toast.success("Security link re-dispatched.");
        } catch (error: any) {
            console.error(`[Auth-Flow] [${correlationId}] Fatal resend error:`, error);
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase auth not initialized");
        const correlationId = `login_client_${Date.now()}`;
        console.log(`[STAGE: LOGIN-START] [${correlationId}] Attempting entry for: ${email}`);

        try {
            // STEP 1: PRE-SIGNIN CHECK
            if (db) {
                console.log(`[STAGE: PRE-CHECK] [${correlationId}] Auditing account linkage...`);
                const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    if (userData.authMethod === 'google') {
                        throw new Error('This account is linked to Google. Please use Google Sign-In.');
                    }
                }
            }

            // STEP 2: ACTUAL SIGN IN
            console.log(`[STAGE: AUTH-PROVIDER] [${correlationId}] Validating credentials with Firebase...`);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(`[STAGE: AUTH-PROVIDER] [${correlationId}] Identity confirmed: ${user.uid}`);

            // CRITICAL FOR MOBILE: Force-refresh the user token
            console.log(`[STAGE: SYNC] [${correlationId}] Reloading profile from cloud (Mobile Parity)...`);
            await user.reload();
            console.log(`[STAGE: SYNC] [${correlationId}] Cloud status: ${user.emailVerified ? 'VERIFIED' : 'PENDING'}`);

            // Extra safety: double check providerData after signin
            const hasGoogleProvider = user.providerData.some(p => p.providerId.includes('google'));
            if (hasGoogleProvider) {
                await firebaseSignOut(auth);
                setUser(null);
                throw new Error('Please use the Google Account button.');
            }

            if (!user.emailVerified) {
                console.warn(`[STAGE: GATE] [${correlationId}] Access denied: Email lacks verification`);
                router.push('/verify-email');
                throw new Error('Clinical verification pending. Please check your registry email.');
            }

            console.log(`[STAGE: SUCCESS] [${correlationId}] Access granted to dashboard`);
            toast.success('Access granted.');
            router.push('/');
        } catch (error: any) {
            console.error(`[STAGE: LOGIN-FATAL] [${correlationId}]`, error.message);

            let message = error.message;
            if (error.code === 'auth/user-not-found') message = 'Account not found in registry.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') message = 'Access Key invalid.';
            if (error.code === 'auth/too-many-requests') message = 'Account locked due to attempts. Resend link or try later.';

            toast.error(message);
            throw new Error(message);
        }
    };

    const signInWithGoogle = async () => {
        if (!auth) throw new Error("Firebase auth not initialized");
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            if (db) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    uid: user.uid,
                    authMethod: 'google',
                    role: 'owner',
                    lastLogin: serverTimestamp()
                }, { merge: true });
            }

            toast.success('Signed in with Google');
            router.push('/');
        } catch (error: any) {
            console.error("Google login error:", error);
            toast.error(error.message);
        }
    };

    const logout = async () => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
            toast.success('Logged out');
            router.push('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isSigningUp,
            signup,
            login,
            signInWithGoogle,
            logout,
            resendVerification
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
