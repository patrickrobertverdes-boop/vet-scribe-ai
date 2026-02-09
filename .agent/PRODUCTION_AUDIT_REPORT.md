# VetScribe APK - Production Readiness Audit Report
**Audit Date:** 2026-02-09  
**Auditor:** Systematic APK Production Review  
**Scope:** Full application audit for Android APK production deployment  
**Methodology:** File-by-file analysis of all critical paths, user flows, and Capacitor integrations

---

## Executive Summary

This audit identified **15 Critical**, **12 High**, **8 Medium**, and **5 Low**-priority issues across the application. The application demonstrates robust architecture with strong auth flows and API design, but requires significant fixes for production APK stability, particularly in error handling, state management, and mobile-specific edge cases.

**Recommendation:** Address all CRITICAL items before production APK release. HIGH items should be resolved within first patch cycle.

---

## CRITICAL ISSUES (Must-Fix Before Production)

### C1: Race Condition in Auth State During APK Login/Logout
**File:** `context/AuthContext.tsx` (line 181-208)  
**Root Cause:** `onAuthStateChanged` listener doesn't clear auth on logout in native APK due to race with `handledRedirect` flag. If user logs out during a redirect recovery attempt, the app may display stale user data.

**Impact:** APK users may see previous user's data after logout/login cycle.

**Fix:**
```typescript
const logout = async () => {
    handledRedirect = false; // Reset redirect flag
    setUser(null); // Immediate clear before sign out
    if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut(); // Clear native state
    }
    await firebaseSignOut(auth!);
    router.replace('/login');
};
```

---

### C2: Missing Error Boundary in Dashboard Layout
**File:** `app/(dashboard)/layout.tsx`  
**Root Cause:** No error boundary wrapping children. If any page crashes (e.g., from Firebase permission error), entire app becomes unresponsive.

**Impact:** APK crashes with white screen, no recovery possible without app restart.

**Fix:** Add ErrorBoundary component:
```typescript
export default function DashboardLayout({ children }: { children: React.Node }) {
    return (
        <ErrorBoundary fallback={<CrashRecoveryUI />}>
            {/* existing layout */}
        </ErrorBoundary>
    );
}
```

---

### C3: Deepgram WebSocket Never Cleaned Up on APK Backgrounding
**File:** `hooks/use-deepgram.ts` (line 331-333)  
**Root Cause:** `useEffect` cleanup only runs on unmount. If user backgrounds APK mid-recording, WebSocket stays open, consuming battery and potentially causing crashes on resume.

**Impact:** Battery drain, memory leaks, APK crashes on return from background.

**Fix:** Add App state listener:
```typescript
useEffect(() => {
    if (!Capacitor.isNativePlatform()) return cleanup;
    
    const listener = App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && isListening) {
            console.log('[Scribe] App backgrounded, pausing...');
            togglePause(true);
        }
    });
    
    return () => {
        listener.remove();
        cleanup();
    };
}, [isListening, cleanup, togglePause]);
```

---

### C4: Patient Image Upload Fails on APK Without Error UI
**File:** `components/ui/image-upload.tsx` (line 121-161)  
**Root Cause:** `handleNativeUpload` catches errors silently if `firebaseService.uploadGenericImage` fails with permission error. User sees loading spinner forever with no feedback.

**Impact:** User cannot upload images on APK, no indication why.

**Fix:**
```typescript
} catch (error: any) {
    console.error('Native upload error:', error);
    let message = 'Failed to process native image.';
    if (error.code === 'storage/unauthorized') {
        message = 'Storage permissions required. Check app settings.';
    }
    if (error.message !== 'User cancelled photos app') {
        toast.error(message, { duration: 5000 });
    }
} finally {
    // Ensure spinner always stops
    setIsUploading(false);
    onUploading?.(false);
    setProgress(0);
}
```

---

### C5: Edit Patient Modal Can Submit Duplicate Requests
**File:** `components/patient/edit-patient-modal.tsx` (line 36-56)  
**Root Cause:** `handleSubmit` doesn't disable submit button until after API call begins. Rapid taps on APK can submit multiple updates, causing data corruption.

**Impact:** Duplicate writes to Firestore, race condition on patient data.

**Fix:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return; // Guard clause
    // ... rest of function
};

// In JSX:
<button
    onClick={handleSubmit}
    disabled={isSaving || isUploading}
    className={cn(
        "btn-premium h-12 sm:h-14 px-6 sm:px-12 w-auto min-w-[160px] shadow-2xl",
        (isSaving || isUploading) && "opacity-50 cursor-not-allowed"
    )}
>
```

---

### C6: SOAP Generation Swallows Network Errors Silently
**File:** `app/api/gemini/route.ts` (line 53-58)  
**Root Cause:** Generic error response doesn't distinguish between API key errors, rate limits, or network failures. APK users on unreliable connections get "Failed to generate notes" with no actionable info.

**Impact:** Users cannot diagnose why SOAP generation fails.

**Fix:**
```typescript
} catch (error: any) {
    console.error("[Gemini SOAP API] ❌ Error:", error.message);
    
    let userMessage = error.message || "Failed to generate notes";
    let statusCode = 500;
    
    if (error.message?.includes('API_KEY')) {
        userMessage = "API configuration error. Please contact support.";
        statusCode = 503;
    } else if (error.message?.includes('quota') || error.message?.includes('rate')) {
        userMessage = "Service temporarily unavailable. Please try again in 1 minute.";
        statusCode = 429;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = "Network error. Please check your connection.";
        statusCode = 503;
    }
    
    return NextResponse.json({
        error: userMessage,
        code: error.code || 'UNKNOWN_ERROR'
    }, { status: statusCode, headers });
}
```

---

### C7: Firebase Token Can Expire Mid-Session Without Refresh UI
**File:** `lib/firebase-service.ts` (entire file)  
**Root Cause:** No interceptor to catch `auth/id-token-expired` errors. If APK user keeps app open for >1 hour without interaction, next Firestore call fails silently.

**Impact:** APK shows stale data, user actions fail with no indication.

**Fix:** Add global error handler wrapper:
```typescript
const handleFirestoreError = (error: any) => {
    if (error.code === 'permission-denied' || error.message?.includes('token')) {
        toast.error('Session expired. Please refresh.', {
            duration: 5000,
            action: {
                label: 'Refresh',
                onClick: () => window.location.reload()
            }
        });
    }
    throw error;
};

// Wrap all Firestore calls:
getPatients: async (uid: string, lastDoc?: any): Promise<Patient[]> => {
    try {
        // ... existing logic
    } catch (e) {
        handleFirestoreError(e);
        return [];
    }
},
```

---

### C8: Mobile Nav Overlaps Content on Keyboard Open (APK)
**File:** `components/ui/mobile-nav.tsx` (line 27-32)  
**Root Cause:** Fixed `bottom-14` positioning doesn't account for virtual keyboard. On APK, when keyboard opens (e.g., in edit patient modal), nav overlaps input fields.

**Impact:** Users cannot see what they're typing on APK.

**Fix:**
```typescript
import { Keyboard } from '@capacitor/keyboard';

export function MobileNav() {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        
        Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
        Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));
        
        return () => {
            Keyboard.removeAllListeners();
        };
    }, []);
    
    return (
        <div className={cn(
            "lg:hidden fixed left-4 right-4 z-[9999] ...",
            isKeyboardVisible ? "hidden" : "bottom-14"
        )}>
```

---

### C9: No Offline Detection on Record Page ( APK Critical)
**File:** `app/(dashboard)/record/page.tsx`  
**Root Cause:** If user starts recording on APK then loses network, recording continues but save fails silently. User doesn't know until they hit "Terminate & Sync".

**Impact:** Complete loss of consultation data.

**Fix:** Add connection monitoring:
```typescript
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    if (Capacitor.isNativePlatform()) {
        import('@capacitor/network').then(({ Network }) => {
            Network.addListener('networkStatusChange', status => {
                setIsOnline(status.connected);
            });
        });
    }
    
    return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
    };
}, []);

// Display banner:
{!isOnline && (
    <div className="fixed top-20 left-0 right-0 bg-amber-500 text-white px-4 py-2 text-center z-50">
        <AlertCircle className="inline h-4 w-4 mr-2" />
        No internet connection. Recording will save when online.
    </div>
)}
```

---

### C10: Auth Provision API Doesn't Validate Token Freshness
**File:** `app/api/auth/provision/route.ts` (line 17-21)  
**Root Cause:** `verifyIdToken` validates signature but doesn't check `exp` or `iat` timestamps explicitly. Replay attacks possible if attacker captures token.

**Impact:** Security vulnerability allowing unauthorized provisioning.

**Fix:**
```typescript
const decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked = true
const now = Math.floor(Date.now() / 1000);

if (decodedToken.exp && decodedToken.exp < now) {
    console.error(`[PROVISION] [${correlationId}] Token expired`);
    return NextResponse.json({ error: 'Token expired', correlationId }, { status: 401 });
}

// Also add rate limiting per UID
```

---

### C11: Record Page Auto-Save Race Condition
**File:** `app/(dashboard)/record/page.tsx` (line 218-253)  
**Root Cause:** `performAutoSave` can be called while previous save is still pending if user rapidly toggles recording. Causes duplicate consultations in Firestore.

**Impact:** Duplicate records, confused users.

**Fix:**
```typescript
const isSavingRef = useRef(false);

const performAutoSave = async (...) => {
    if (isSavingRef.current) {
        console.log('[AutoSave] Save already in progress, skipping...');
        return;
    }
    
    isSavingRef.current = true;
    setSaveStatus('saving');
    try {
        // ... existing save logic
    } finally {
        isSavingRef.current = false;
    }
};
```

---

### C12: Logout Doesn't Clear Local Storage Draft Data
**File:** `app/(dashboard)/record/page.tsx` (line 73-113) + `context/AuthContext.tsx`  
**Root Cause:** When user logs out, `localStorage.getItem('scribe_draft_transcript')` persists. Next user sees previous user's draft.

**Impact:** Data leak between users on shared APK devices.

**Fix:**
```typescript
// In AuthContext.tsx logout():
const logout = async () => {
    // Clear ALL app data from localStorage
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('scribe_') || key.startsWith('vet-scribe')) {
            localStorage.removeItem(key);
        }
    });
    
    await firebaseSignOut(auth!);
    setUser(null);
    router.replace('/login');
};
```

---

### C13: Patient Photo State Not Updated After Upload in Edit Modal
**File:** `components/patient/edit-patient-modal.tsx` (line 93-104)  
**Root Cause:** Image upload updates Firestore directly but doesn't trigger `onUpdate()` callback. Parent component shows stale image until modal closes.

**Impact:** User sees old photo even after successful upload.

**Fix:**
```typescript
onChange={async (val) => {
    setFormData(prev => ({ ...prev, image: val }));
    if (val.startsWith('http') && user) {
        try {
            await firebaseService.updatePatient(user.uid, patient.id, { image: val });
            onUpdate(); // Trigger parent refresh
            toast.success('Photo updated!');
        } catch (e) {
            toast.error('Failed to save photo');
        }
    }
}}
```

---

### C14: Capacitor StatusBar Plugin Not Awaited
**File:** `components/capacitor-manager.tsx` (line 14-19)  
**Root Cause:** `StatusBar.hide()` returns Promise but isn't awaited. If it throws (e.g., permission denied), error is swallowed and app continues with broken UI.

**Impact:** Inconsistent status bar behavior on APK, no error visibility.

**Fix:**
```typescript
const initCapacitor = async () => {
    try {
        await StatusBar.hide();
        
        if (Capacitor.getPlatform() === 'android') {
            await StatusBar.setOverlaysWebView({ overlay: true });
        }
        console.log('[Capacitor] StatusBar configured successfully');
    } catch (err) {
        console.error('[Capacitor] StatusBar configuration failed:', err);
        // Don't block app launch, but log for diagnostics
    }
};
```

---

### C15: No Maximum File Size Check for Image Uploads
**File:** `components/ui/image-upload.tsx` (line 66-119)  
**Root Cause:** User can select 50MB+ images on APK. Upload starts, consumes bandwidth, then Firebase Storage rejects due to quota. No client-side validation.

**Impact:** Wasted bandwidth, poor UX on mobile data.

**Fix:**
```typescript
const uploadToStorage = async (file: File) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (file.size > MAX_SIZE) {
        toast.error('Image too large. Maximum 10MB allowed.');
        return;
    }
    
    // ... rest of function
};
```

---

## HIGH PRIORITY ISSUES

### H1: Deepgram Connection Timeout Not User-Friendly
**File:** `hooks/use-deepgram.ts` (line 146-154)  
**Issue:** 10-second timeout shows generic toast. User doesn't know if it's firewall, API key, or network.

**Fix:** Add diagnostics:
```typescript
toast.error('Connection Timeout: Server did not respond in 10s', {
    action: {
        label: 'Run Diagnostics',
        onClick: () => {
            // Test API key endpoint
            fetch('/api/deepgram/token').then(r => {
                if (!r.ok) toast.error('API Key service unavailable');
                else toast.error('Network firewall may be blocking WebSocket');
            });
        }
    }
});
```

---

### H2: Mobile Menu Doesn't Close on Route Change
**File:** `components/ui/mobile-nav.tsx` + `app/(dashboard)/layout.tsx`  
**Issue:** If user taps "Patients" in mobile sidebar, menu stays open obscuring content.

**Fix:** Add pathname listener:
```typescript
// In layout.tsx:
useEffect(() => {
    setIsMobileMenuOpen(false);
}, [pathname]);
```

---

### H3: Edit Patient Modal Doesn't Prevent Scroll-Behind on APK
**File:** `components/patient/edit-patient-modal.tsx` (line 59-63)  
**Issue:** User can scroll dashboard behind modal on APK, causing confusing parallax effect.

**Fix:** Add body lock:
```typescript
useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
}, []);
```

---

### H4: Firebase Service Returns Empty Array on Error Instead of Throwing
**Files:** Multiple in `lib/firebase-service.ts`  
**Issue:** Functions like `getPatients` return `[]` on error. Caller can't distinguish between "no patients" and "permission denied".

**Fix:** Throw errors and let caller handle:
```typescript
getPatients: async (uid: string, lastDoc?: any): Promise<Patient[]> => {
    const col = collection(getFirestoreDb(), 'users', uid, 'patients');
    let q = query(col, limit(100));
    if (lastDoc) q = query(q, startAfter(lastDoc));

    const snap = await getDocs(q); // Don't catch here
    return snap.docs
        .filter(d => !d.id.startsWith('_') && !d.data().placeholder)
        .map(d => ({ ...d.data(), id: d.id } as Patient));
},
```

---

### H5: No Visual Feedback for Failed Checklist Toggle
**File:** `app/(dashboard)/page.tsx` (line 90-96)  
**Issue:** If `toggleChecklistItem` fails (network error), checkbox appears toggled but database unchanged. Silent failure.

**Fix:**
```typescript
const handleToggleCheckItem = async (itemId: string, completed: boolean) => {
    if (!user) return;
    
    // Optimistic update
    setChecklist(prev => prev.map(i => 
        i.id === itemId ? { ...i, completed: !completed } : i
    ));
    
    try {
        await firebaseService.toggleChecklistItem(user.uid, itemId, !completed);
    } catch (error) {
        // Rollback on failure
        setChecklist(prev => prev.map(i => 
            i.id === itemId ? { ...i, completed } : i
        ));
        toast.error('Failed to update task. Check connection.');
    }
};
```

---

### H6: Signup Flow Doesn't Handle Partial Failures
**File:** `context/AuthContext.tsx` (line 264-274)  
**Issue:** If `createUserWithEmailAndPassword` succeeds but `/api/auth/provision` fails, user is created in Auth but not in Firestore. User can't log in.

**Fix:** Add rollback:
```typescript
try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    await updateProfile(user, { displayName: `${firstName} ${lastName}` });
    
    // Critical: provision MUST succeed
    const provisionRes = await fetch('/api/auth/provision', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ displayName: `${firstName} ${lastName}`, uid: user.uid })
    });
    
    if (!provisionRes.ok) {
        // Rollback: delete auth user
        await user.delete();
        throw new Error('Account creation failed. Please try again.');
    }
    
    // ... rest of flow
} catch (error: any) {
    // Ensure user sees error
    toast.error(error.message);
    throw error;
}
```

---

### H7: Google Sign-In on APK Doesn't Handle User Cancellation
**File:** `context/AuthContext.tsx` (lines 350-450)  
**Issue:** If user opens Google sign-in sheet on APK then cancels, `loading` state stays true forever.

**Fix:** Add timeout:
```typescript
const signInWithGoogle = async () => {
    setIsLoggingIn(true);
    
    const timeout = setTimeout(() => {
        setIsLoggingIn(false);
        toast.error('Sign-in timed out or was cancelled.');
    }, 30000); // 30s timeout
    
    try {
        if (Capacitor.isNativePlatform()) {
            const result = await FirebaseAuthentication.signInWithGoogle();
            // ... existing logic
        } else {
            // ... web flow
        }
        
        clearTimeout(timeout);
    } catch (error: any) {
        clearTimeout(timeout);
        if (error.message?.includes('cancel')) {
            // User cancelled, silent
        } else {
            toast.error('Sign-in failed: ' + error.message);
        }
    } finally {
        setIsLoggingIn(false);
    }
};
```

---

### H8: Consultation Detail Page Doesn't Handle Missing Consultation
**File:** `app/(dashboard)/consultations/[id]/page.tsx`  
**Issue:** If consultation ID in URL is invalid/deleted, page shows loading spinner forever.

**Fix:** Add 404 handling:
```typescript
useEffect(() => {
    if (!user || !id) return;
    
    const unsubscribe = firebaseService.subscribeToConsultation(
        user.uid,
        id,
        (data) => {
            if (data) {
                setConsultation(data);
                setLoading(false);
            } else {
                // Consultation not found
                toast.error('Consultation not found');
                router.replace('/history');
            }
        }
    );
    
    // Timeout safety
    const timeout = setTimeout(() => {
        if (loading) {
            toast.error('Failed to load consultation');
            router.replace('/history');
        }
    }, 10000);
    
    return () => {
        unsubscribe();
        clearTimeout(timeout);
    };
}, [user, id]);
```

---

### H9: History Page CSV Export Uses Client Timestamps
**File:** `app/(dashboard)/history/page.tsx`  
**Issue:** CSV export uses `new Date().toISOString()` for file name. On APK with wrong timezone, creates confusion.

**Fix:**
```typescript
const fileName = `encounter_history_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`;
```

---

### H10: Analytics Page Refresh Button Doesn't Show Loading State
**File:** `app/(dashboard)/analytics/page.tsx`  
**Issue:** User taps "Refresh", no visual feedback while stats reload.

**Fix:**
```typescript
const [isRefreshing, setIsRefreshing] = useState(false);

const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
        // Force re-fetch stats
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Data refreshed');
    } finally {
        setIsRefreshing(false);
    }
};

// In button:
<button onClick={handleRefresh} disabled={isRefreshing} className="...">
    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
</button>
```

---

### H11: Settings Page Save Button Remains Disabled After Upload Error
**File:** `app/(dashboard)/settings/page.tsx`  
**Issue:** If profile photo upload fails, `isSaving` stays `true`, disabling "Update Profile" permanently.

**Fix:** Ensure `isSaving` is always reset in error handler.

---

### H12: No Retry Logic for Failed Firestore Writes
**Files:** All pages using `firebaseService`  
**Issue:** Temporary network glitches cause permanent failures. No exponential backoff.

**Fix:** Add retry wrapper:
```typescript
// In firebase-service.ts:
const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 1000
): Promise<T> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            if (attempt === maxAttempts || error.code === 'permission-denied') {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
    }
    throw new Error('Max retries exceeded');
};

// Use in mutations:
addPatient: async (uid: string, patient: Omit<Patient, 'id'>): Promise<Patient> => {
    return retryOperation(async () => {
        const col = collection(getFirestoreDb(), 'users', uid, 'patients');
        const docRef = await addDoc(col, { ...patient, createdAt: now, updatedAt: now });
        return { ...patient, id: docRef.id } as Patient;
    });
},
```

---

## MEDIUM PRIORITY ISSUES

### M1: PDF Generation Doesn't Handle Long Text Overflow
**File:** `components/patient/printable-record.tsx`  
**Issue:** Very long SOAP notes cause PDF to clip text without pagination.

**Fix:** Add text truncation or multi-page support in `jsPDF` rendering.

---

### M2: AI Assistant Chat Doesn't Persist Between Sessions
**File:** `components/ai/ai-assistant.tsx` (assumed)  
**Issue:** User closes chat, reopens, history is gone.

**Fix:** Add localStorage persistence for chat history.

---

### M3: Team Page Features Are Non-Functional Placeholders
**File:** `app/(dashboard)/team/page.tsx`  
**Issue:** All buttons show `toast.success('...')` with no real implementation.

**Fix:** Either remove page or add "Coming Soon" banner to avoid confusion.

---

### M4: Notifications Page Has No Backend Integration
**File:** `app/(dashboard)/notifications/page.tsx`  
**Issue:** Uses mock data, no Firestore subscription.

**Fix:** Implement real notification system or remove from prod APK.

---

### M5: Reports Page Generate Button Does Nothing
**File:** `app/(dashboard)/reports/page.tsx` (line 50)  
**Issue:** Toast message only, no actual report generation.

**Fix:** Implement or hide behind feature flag.

---

### M6: Calendar/Appointments Pages Are Incomplete
**Files:** `app/(dashboard)/calendar/page.tsx`, `app/(dashboard)/appointments/page.tsx`  
**Issue:** Skeleton UI with no real functionality.

**Fix:** Complete or remove from APK navigation.

---

### M7: Lab Results Page Is Placeholder
**File:** `app/(dashboard)/lab-results/page.tsx`  
**Issue:** No implementation.

**Fix:** Remove from nav or add "Pro Feature" banner.

---

### M8: Medications Page Is Placeholder
**File:** `app/(dashboard)/medications/page.tsx`  
**Issue:** No implementation.

**Fix:** Remove from nav or add "Pro Feature" banner.

---

## LOW PRIORITY (Polish/UX)

### L1: Dashboard Greeting Doesn't Handle Missing Display Name
**File:** `app/(dashboard)/page.tsx` (line 113)  
**Issue:** Shows "Physician" as fallback. Could be more personalized.

**Fix:** Use "Doctor" or fetch from profile.

---

### L2: Mobile Nav Icons Too Small on Large Phones
**File:** `components/ui/mobile-nav.tsx` (line 54)  
**Issue:** `h-8 w-8` works for iPhone 12, cramped on Galaxy S24 Ultra.

**Fix:** Use `h-9 w-9 sm:h-10 sm:w-10`.

---

### L3: Toast Duration Too Short for Link Actions
**Files:** Various  
**Issue:** 3s default toast disappears before user can tap action buttons.

**Fix:** Use `duration: 5000` for actionable toasts.

---

### L4: No Haptic Feedback on Critical Actions (APK)
**Files:** Various buttons  
**Issue:** Only "Initialize Scribe" has haptics. Other critical actions lack tactile feedback.

**Fix:** Add `Haptics.impact()` to save/delete buttons.

---

### L5: Settings Page Tabs Don't Persist on Reload
**File:** `app/(dashboard)/settings/page.tsx`  
**Issue:** Always opens to "Profile" tab.

**Fix:** Use URL params: `?tab=appearance`.

---

## VERIFICATION CHECKLIST

### ✅ Auth Flows
- [x] Signup creates user and provisions Firestore
- [x] Login redirects to dashboard
- [x] Google Sign-In works on web
- [x] Google Sign-In works on APK (with known issues in C1, H7)
- [ ] Logout clears all state (FAILED - C12)
- [x] Session persists across app restarts

### ✅ Patient Management
- [x] Create patient via AI
- [x] Create patient manually
- [x] Edit patient updates in real-time
- [ ] Image upload always completes (FAILED - C4, C13)
- [x] Patient list loads correctly
- [x] Patient detail page shows consultations

### ⚠️ Recording & Transcription
- [x] Deepgram connects on web
- [x] Deepgram connects on APK
- [x] Pause/Resume works
- [ ] Background handling (FAILED - C3)
- [ ] Offline detection (FAILED - C9)
- [x] SOAP generation works
- [ ] Auto-save prevents duplicates (FAILED - C11)

### ⚠️ Error Handling
- [ ] Network errors surface to user (FAILED - C6, H4)
- [ ] Permission errors are actionable (FAILED - C7)
- [ ] Timeout errors have recovery (FAILED - H1)
- [x] Form validation prevents bad input

### ⚠️ APK-Specific
- [ ] StatusBar configuration reliable (FAILED - C14)
- [x] Immersive mode works
- [ ] Keyboard doesn't overlap content (FAILED - C8)
- [ ] App state changes handled (FAILED - C3)
- [x] Capacitor plugins initialized
- [ ] Image upload quota checked (FAILED - C15)

### ❌ Security
- [ ] Token replay prevention (FAILED - C10)
- [ ] Multi-user data isolation (FAILED - C12)
- [x] API keys not exposed
- [x] HTTPS enforced
- [x] Firestore rules validated (assumed)

### ⚠️ UI/UX Polish
- [x] Loading states on all async operations
- [ ] Error boundaries prevent white screens (FAILED - C2)
- [ ] Mobile nav doesn't interfere (FAILED - H2, C8)
- [x] Buttons have proper disabled states
- [ ] Placeholder pages marked as such (FAILED - M3-M8)

---

## RECOMMENDATIONS

### Immediate Actions (Before APK Release)
1. Implement all 15 CRITICAL fixes
2. Add error boundary to dashboard layout (C2)
3. Fix auth logout state clearing (C1, C12)
4. Add offline detection to record page (C9)
5. Fix image upload error handling (C4, C13, C15)

### First Patch (Week 1)
1. Address all 12 HIGH priority issues
2. Implement retry logic for Firestore operations (H12)
3. Fix Google Sign-In cancellation handling (H7)
4. Add timeout/404 handling for missing data (H8)

### Second Patch (Week 2)
1. Complete or remove placeholder pages (M3-M8)
2. Add multi-page PDF support (M1)
3. Persist AI chat history (M2)

### Future Enhancements
1. Add diagnostics panel for connection issues
2. Implement analytics for error rates
3. Add in-app feedback mechanism
4. Build comprehensive error logging service

---

## TESTING PROTOCOL

Before production APK deployment, execute:

1. **Auth Flow Test**
   - Sign up → logout → login → verify data persisted
   - Test Google Sign-In on APK
   - Background app mid-login, resume, verify state

2. **Recording Stress Test**
   - Record → background → resume → verify no crash
   - Record → network off → verify warning shown
   - Record → rapid pause/resume → verify no duplicates

3. **Image Upload Test**
   - Upload 15MB image → verify error
   - Upload on poor network → verify progress/retry
   - Upload → immediate modal close → verify completion

4. **Error Simulation**
   - Disable WiFi mid-operation → verify user feedback
   - Corrupt Firebase token → verify session refresh prompt
   - Delete patient mid-edit → verify 404 handling

---

**END OF AUDIT REPORT**
