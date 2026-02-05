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
        if (!auth || !db) throw new Error("Firebase is not initialized");

        setIsSigningUp(true);
        const correlationId = `signup_client_${Date.now()}`;
        console.log(`[Auth-Flow] [${correlationId}] Initiating signup for: ${email}`);

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const { user } = userCredential;

            // 2. Set display name in Firebase Auth
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });


            // 3. Create basic profile in Firestore
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

            // 4. Trigger n8n webhook (CRITICAL SIDE-EFFECT)
            console.log(`[Auth-Flow] [${correlationId}] Triggering verification webhook...`);

            // Artificial delay to ensure Firebase Auth has indexed the new user
            await new Promise(resolve => setTimeout(resolve, 1000));

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
                const errorData = await webhookRes.json().catch(() => ({ error: 'Communication error with auth server' }));
                console.error(`[Auth-Flow] [${correlationId}] Webhook critical failure:`, errorData);

                // Show rich error to help diagnostic
                const detail = errorData.error || errorData.details || 'Unknown server error';
                toast.error(`Account created, but verification dispatch failed: ${detail}`, { duration: 6000 });
            } else {
                console.log(`[Auth-Flow] [${correlationId}] Signup webhook confirmed`);
                toast.success('Security link dispatched to registry email.');
            }

            // 5. Background initialization
            initializeUserBackground(user);

            // 6. Finalize
            toast.success('Security link dispatched to registry email.');
            router.push('/verify-email');
        } catch (error: any) {
            console.error(`[Auth-Flow] [${correlationId}] Fatal signup error:`, error);
            let message = 'Failed to create record.';
            if (error.code === 'auth/email-already-in-use') message = 'This email designation is already registered.';
            if (error.code === 'auth/weak-password') message = 'Security key must be at least 6 characters.';

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

        try {
            // STEP 1: PRE-SIGNIN CHECK (To prevent the dashboard "flash")
            // Check Firestore for authMethod BEFORE signing in
            if (db) {
                const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    if (userData.authMethod === 'google') {
                        toast.error('This account is linked to Google. Please sign in with Google Account.');
                        return;
                    }
                }
            }

            // STEP 2: ACTUAL SIGN IN
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // CRITICAL FOR MOBILE: Force-refresh the user token to get latest claims (like emailVerified)
            console.log(`[Auth-Flow] [${user.uid}] Reloading user profile for latest verification status...`);
            await user.reload();

            // Extra safety: double check providerData after signin
            const hasGoogleProvider = user.providerData.some(p => p.providerId.includes('google'));
            if (hasGoogleProvider) {
                toast.error('Please use the Google Account button.');
                await firebaseSignOut(auth);
                setUser(null);
                return;
            }

            if (!user.emailVerified) {
                console.warn(`[Auth-Flow] [${user.uid}] Login blocked: Email not verified.`);
                toast.error('Please verify your email first.');
                router.push('/verify-email');
                return;
            }

            toast.success('Logged in successfully');
            router.push('/');
        } catch (error: any) {
            console.error("Login error:", error);
            let message = 'Invalid email or password.';

            if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') message = 'Incorrect password. Please try again.';
            if (error.code === 'auth/too-many-requests') message = 'Too many failed attempts. Try again later.';
            if (error.code === 'auth/user-disabled') message = 'This account has been disabled.';

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
