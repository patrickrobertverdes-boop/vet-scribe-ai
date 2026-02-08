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
    signInWithCredential,
    updateProfile
} from 'firebase/auth';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
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
    updateUser: (data: any) => Promise<void>;
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

        // 0. Set Persistence for Mobile Reliability
        import('firebase/auth').then(({ setPersistence, indexedDBLocalPersistence }) => {
            setPersistence(auth!, indexedDBLocalPersistence).catch(e => console.error("Persistence error:", e));
        });

        let handledRedirect = false;

        // 1. Deep link listener for Capacitor Mobile Redirects
        const setupDeepLink = async () => {
            App.addListener('appUrlOpen', async (data: any) => {
                if (handledRedirect) return;

                const url = data.url;
                console.log('[Auth] Deep link/App Link received:', url);

                // Catch both custom scheme and the hosted domain redirects
                if (url.includes('com.vetscribe.app://auth') ||
                    url.includes('vet-scribe-a2i--verdes-8568d.us-east4.hosted.app/__/auth/handler')) {

                    handledRedirect = true;
                    setLoading(true);

                    try {
                        const result = await getRedirectResult(auth!);
                        if (result?.user) {
                            console.log("[Auth] Redirect result identified from URL event");
                            setUser(result.user);
                            initializeUserBackground(result.user);
                        } else {
                            console.log("[Auth] No user in redirect result from URL event");
                        }
                    } catch (e) {
                        console.error("[Auth] Redirect Result Error:", e);
                    } finally {
                        setLoading(false);
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
                        console.log("[Auth] Captured redirect login result during init");
                        setUser(result.user);
                        initializeUserBackground(result.user);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error("[Auth] Redirect result error:", err);
                }
            }

            // Normal Auth State Handling
            if (currentUser) {
                setUser(currentUser);
                initializeUserBackground(currentUser);
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        // Deep link listener for custom URL schemes (if needed for other features)
        // Removed Google Handshake logic from here as we now use native sign-in direct.

        return () => {
            unsubscribe();
        };
    }, []);

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

        // Platform Detection Diagnostics
        const isNative = Capacitor.isNativePlatform() ||
            (typeof window !== 'undefined' && (!!(window as any).Capacitor || !!(window as any).androidBridge));
        const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isHosted = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

        console.log(`[Auth] G-Sign-In Request.`, { isNative, isMobile, isHosted, bridge: !!(window as any).Capacitor });

        try {
            // Android-ONLY specialized handover logic
            if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
                console.log("[Auth] 📱 Android Platform Detected. Initiating Native Google Sign-In.");
                setLoading(true);

                try {
                    // Start native sign-in with auto-sync to Firebase JS SDK
                    const result = await FirebaseAuthentication.signInWithGoogle({
                        mode: 'signInWithCredential',
                    } as any); // Cast to any to bypass potentially outdated type definitions

                    if (result.user) {
                        console.log("[Auth] Native Google Sign-In Success:", result.user.uid);

                        // User is already signed into the Firebase JS SDK by the plugin.
                        // We double cast to 'User' to bridge the slightly different type definitions.
                        const jsUser = result.user as unknown as User;
                        setUser(jsUser);
                        initializeUserBackground(jsUser);

                        toast.success('Signed in with Google');
                        router.push('/');
                    } else {
                        throw new Error("Google sign-in returned no user");
                    }
                    return;
                } catch (pluginErr: any) {
                    console.error("[Auth] Native Google Login failed:", pluginErr);
                    // Handle cancellation gracefully
                    if (pluginErr.message?.includes('cancel') || pluginErr.code === 'CANCELLED') {
                        toast.error("Sign-in cancelled.");
                    } else {
                        toast.error(`Google Login Error: ${pluginErr.message || "Failed to authenticate"}`);
                    }
                    return;
                } finally {
                    setLoading(false);
                }
            }

            // Web/Other Platform standard flow
            console.log("[Auth] 🌐 Non-Android Platform Detected. Using standard handshake.");
            setLoading(true);

            // Try popup first as it is most premium experience for web
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                if (db) {
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        uid: user.uid,
                        authMethod: 'google_web',
                        lastLogin: serverTimestamp()
                    }, { merge: true });
                }

                toast.success('Signed in via Google');
                router.push('/');
            } catch (popupErr: any) {
                console.warn("[Auth] Popup blocked or failed, falling back to Redirect.");
                // Fallback to redirect if popup is blocked
                await signInWithRedirect(auth, provider);
            }
        } catch (error: any) {
            console.error("Google login error:", error);
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
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

    const updateUser = async (data: any) => {
        if (!user) return;
        try {
            await updateProfile(user, data);
            setUser({ ...user, ...data });
        } catch (error) {
            console.error("Update profile error:", error);
            throw error;
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
            resendVerification,
            updateUser
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
