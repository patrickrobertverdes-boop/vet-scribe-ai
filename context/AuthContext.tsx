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
    signInWithRedirect,
    getRedirectResult,
    updateProfile
} from 'firebase/auth';
import { App } from '@capacitor/app';
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
    isLoggingIn: boolean;
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
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const router = useRouter();

    // Helper to initialize user data (Runs in background)
    const initializeUserBackground = async (user: User) => {
        if (!db) return;

        // Gate removed: Verification no longer mandatory for clinical initialization

        try {
            console.log(`[Background-Init] Initializing provisioned data for: ${user.uid}`);
            // Priority initialization happens in the server-side provisioning API
            // to avoid client-side "Missing or insufficient permissions" before token sync
            console.log(`[Background-Init] Starting background task initialization for: ${user.uid}`);

            // Subcollections - Fire and forget checks
            // We use promise.allsettled to not block each other
            const subcollections = [
                (async () => {
                    const clientDataRef = doc(db, 'users', user.uid, 'client_data', 'config');
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
                    const historyRef = doc(db, 'users', user.uid, 'history', 'welcome_note');
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
                    const patientRef = doc(db, 'users', user.uid, 'patients', '_placeholder');
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

        let handledRedirect = false;

        // 1. Deep link listener for Capacitor Mobile Redirects
        const setupDeepLink = async () => {
            App.addListener('appUrlOpen', async (data: any) => {
                if (handledRedirect) return;
                console.log('[Auth] Deep link received:', data.url);
                if (data.url.includes('com.vetscribe.app://auth')) {
                    handledRedirect = true;
                    // Logic to handle return from redirect
                    try {
                        if (auth) {
                            const result = await getRedirectResult(auth);
                            if (result?.user) {
                                setUser(result.user);
                                initializeUserBackground(result.user);
                            }
                        }
                    } catch (e) {
                        console.error("[Auth] Redirect Result Error:", e);
                    }
                }
            });
        };
        setupDeepLink();

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            // Check for redirect result on initialization (crucial for Capacitor/Mobile)
            if (!currentUser && auth && !handledRedirect) {
                try {
                    const result = await getRedirectResult(auth);
                    if (result?.user) {
                        handledRedirect = true;
                        console.log("[Auth] Captured redirect login result");
                        setUser(result.user);
                        initializeUserBackground(result.user);
                        return;
                    }
                } catch (err) {
                    console.error("[Auth] Redirect result error:", err);
                }
            }

            // If we are in a manual flow (login/signup), we let those functions handle loading/navigation
            if (isLoggingIn || isSigningUp) {
                setUser(currentUser);
                return;
            }

            if (currentUser) {
                setUser(currentUser);
                initializeUserBackground(currentUser);
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [isLoggingIn, isSigningUp]);

    const signup = async (emailRaw: string, password: string, firstName: string, lastName: string) => {
        if (!auth || !db) throw new Error("Firebase configuration missing");
        const email = emailRaw.toLowerCase().trim();

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

            // 3. Trigger Server Webhook
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

            // 4. Immediate Provisioning (Ensure UI works even if n8n is slow)
            console.log(`[STAGE: PROVISION] [${correlationId}] Auto-provisioning profile...`);
            const idToken = await user.getIdToken();
            await fetch('/api/auth/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ displayName: `${firstName} ${lastName}`, uid: user.uid })
            }).catch(e => console.warn("Background auto-provisioning failed:", e));

            // 5. Finalize UI
            toast.success('Registration successful.');
            router.push('/');

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

    const login = async (emailRaw: string, password: string) => {
        if (!auth) throw new Error("Firebase auth not initialized");
        const email = emailRaw.toLowerCase().trim();
        const correlationId = `login_client_${Date.now()}`;
        console.log(`[STAGE: LOGIN-START] [${correlationId}] Attempting entry for: ${email}`);

        setIsLoggingIn(true);
        setLoading(true);

        try {
            // STEP 1: PRE-SIGNIN CHECK
            // Pre-check removed as root collection queries are restricted by security rules
            // Firebase Auth will handle credential validation

            // STEP 2: ACTUAL SIGN IN
            console.log(`[STAGE: AUTH-PROVIDER] [${correlationId}] Validating credentials with Firebase...`);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(`[STAGE: AUTH-PROVIDER] [${correlationId}] Identity confirmed: ${user.uid}`);

            // CRITICAL FOR MOBILE: Force-refresh the user token
            console.log(`[STAGE: SYNC] [${correlationId}] Reloading profile from cloud (Mobile Parity)...`);
            await user.reload();

            // FORCE TOKEN REFRESH: Ensures client has latest claims (like email_verified)
            console.log(`[STAGE: TOKEN] [${correlationId}] Forcing ID Token refresh...`);
            const idToken = await user.getIdToken(true);
            console.log(`[STAGE: SYNC] [${correlationId}] Cloud status: ${user.emailVerified ? 'VERIFIED' : 'PENDING'}`);

            // Extra safety: double check providerData after signin
            const hasGoogleProvider = user.providerData.some(p => p.providerId.includes('google'));
            if (hasGoogleProvider) {
                await firebaseSignOut(auth);
                setUser(null);
                throw new Error('Please use the Google Account button.');
            }

            // Gate removed: Verification no longer mandatory

            // PROVISIONING: Ensure user document exists in Firestore via backend
            console.log(`[STAGE: PROVISIONING] [${correlationId}] Calling backend provisioning...`);
            const provisionRes = await fetch('/api/auth/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    displayName: user.displayName,
                    uid: user.uid
                })
            });

            if (!provisionRes.ok) {
                const provError = await provisionRes.json().catch(() => ({ error: 'Provisioning Failed' }));
                console.error(`[STAGE: PROVISIONING-FAILURE] [${correlationId}]`, provError);
                throw new Error(`System Provisioning Error: ${provError.error}`);
            }

            // CRITICAL: Force-refresh the token AGAIN after provisioning to pick up custom claims
            console.log(`[STAGE: SYNC-FINAL] [${correlationId}] Synchronizing security claims...`);
            const tokenResult = await user.getIdTokenResult(true);
            console.log(`[STAGE: PROOF] [${correlationId}] CLAIMS:`, tokenResult.claims);

            console.log(`[STAGE: SUCCESS] [${correlationId}] Access granted to dashboard`);

            // Finalize state before unblocking UI/Navigation
            setUser(user);
            setLoading(false);
            setIsLoggingIn(false);

            toast.success('Access granted.');
            router.push('/');
        } catch (error: any) {
            console.error(`[STAGE: LOGIN-FATAL] [${correlationId}]`, error.message);
            setIsLoggingIn(false);
            setLoading(false);

            let message = error.message;
            const code = error.code;

            console.error(`[AUTH-ERROR-CODE] ${code}`);

            if (code === 'auth/user-not-found') message = 'Account not found in registry.';
            else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                message = 'Access Key invalid. If you registered with Google, please use the Google Workspace button.';
            }
            else if (code === 'auth/too-many-requests') message = 'Account locked due to attempts. Resend link or try later.';
            else if (code === 'auth/invalid-email') message = 'Email format invalid.';

            toast.error(message);
            throw new Error(message);
        }
    };

    const signInWithGoogle = async () => {
        if (!auth) throw new Error("Firebase auth not initialized");
        const provider = new GoogleAuthProvider();

        // Capacitor/Mobile environment detection
        const isCapacitor = (window as any).Capacitor !== undefined || (window as any).webkit?.messageHandlers?.Capacitor;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        try {
            if (isCapacitor || isMobile) {
                console.log("[Auth] Mobile APK environment detected, using Redirect Flow with Custom Scheme fallback");
                // Ensure com.vetscribe.app://auth is handled in AndroidManifest
                await signInWithRedirect(auth, provider);
            } else {
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
            }
        } catch (error: any) {
            console.error("Google login error:", error);
            // Fallback for extremely restrictive WebViews if popup fails
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/operation-not-supported-in-this-environment') {
                console.log("[Auth] Switching to redirect due to environment restriction...");
                await signInWithRedirect(auth, provider);
            } else {
                toast.error(error.message);
            }
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
            isLoggingIn,
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
