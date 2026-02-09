# Firestore Data Disappearance Fix - Implementation Summary

## Problem Statement
Data disappeared on APK after network transition:
- Login on mobile data → patient list empty
- Switch to WiFi → still empty  
- Suggested Firestore sync/auth/cache state issue, not actual data deletion

## Root Causes Identified

### 1. **No Cache Detection**
- `onSnapshot` callbacks didn't check `metadata.fromCache`
- App couldn't distinguish between:
  - Empty cache (no data synced yet)
  - Empty server response (permission denied)
  - Actual empty collection

### 2. **Silent Error Swallowing**
- Error handlers returned empty arrays `callback([])`
- Permission-denied errors looked identical to "no data"
- User saw "No Patients" instead of "Auth Required"

### 3. **No Re-subscription on Network Change**
- Subscriptions didn't re-run when:
  - Network state changed (offline → online)
  - Auth state refreshed after login
- Stale cached data treated as authoritative

### 4. **Persistent Cache Configuration**
```typescript
// lib/firebase.ts - Using persistent cache (correct for offline support)
persistentLocalCache({
    tabManager: Capacitor.isNativePlatform() 
        ? persistentSingleTabManager({}) 
        : persistentMultipleTabManager()
})
```
This is correct but requires proper cache metadata handling.

## Solutions Implemented

### 1. Enhanced `subscribeToPatients` with Metadata Tracking
**File**: `lib/firebase-service.ts`

```typescript
export interface FirestoreSyncMeta {
    fromCache: boolean;
    hasPendingWrites: boolean;
    error?: { code: string; message: string };
}

subscribeToPatients: (
    uid: string, 
    callback: (patients: Patient[], meta?: FirestoreSyncMeta) => void
) => {
    return onSnapshot(
        query(col, limit(100)), 
        { includeMetadataChanges: true },  // ← KEY FIX
        (snap) => {
            const fromCache = snap.metadata.fromCache;
            const hasPendingWrites = snap.metadata.hasPendingWrites;
            
            // Log for debugging
            if (fromCache) {
                console.log(`🔄 Data from CACHE (${patients.length} items)`);
            } else {
                console.log(`✅ Data from SERVER (${patients.length} items)`);
            }
            
            callback(patients, { fromCache, hasPendingWrites });
        },
        (err) => {
            // Surface errors instead of silent failure
            callback([], { 
                fromCache: true, 
                hasPendingWrites: false, 
                error: { code: err.code, message: err.message } 
            });
        }
    );
}
```

**Key Changes**:
- Added `includeMetadataChanges: true` to detect cache vs server
- Return metadata to callback for UI feedback
- Surface errors with code/message instead of silent empty array

### 2. UI Sync State Indicators
**File**: `app/(dashboard)/patients/page.tsx`

```typescript
const [syncState, setSyncState] = useState<{
    isFromCache: boolean;
    hasError: boolean;
    errorMessage?: string;
}>({ isFromCache: false, hasError: false });

// In subscription callback:
if (meta?.error) {
    setSyncState({ 
        isFromCache: true, 
        hasError: true, 
        errorMessage: meta.error.code === 'permission-denied' 
            ? 'Authentication required. Please log in again.' 
            : meta.error.message 
    });
    
    if (meta.error.code === 'permission-denied') {
        toast.error('Session expired. Please log in again.');
    }
    return;
}

setSyncState({ 
    isFromCache: meta?.fromCache ?? false, 
    hasError: false 
});
```

**Visual Feedback**:
```tsx
{syncState.hasError && (
    <div className="bg-red-50 border border-red-200">
        ⚠️ {syncState.errorMessage || 'Unable to sync data'}
    </div>
)}

{!syncState.hasError && syncState.isFromCache && patients.length > 0 && (
    <div className="bg-yellow-50 border border-yellow-200">
        🔄 Showing cached data. Syncing with server...
    </div>
)}
```

### 3. Network State Monitoring & Force Re-subscription
**File**: `app/(dashboard)/patients/page.tsx`

```typescript
const [subscriptionKey, setSubscriptionKey] = useState(0);

// Monitor network state
useEffect(() => {
    const handleOnline = () => {
        console.log('[PatientsPage] Network back online - forcing re-subscription');
        setSubscriptionKey(prev => prev + 1); // Trigger re-subscribe
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
}, []);

// Re-run subscription when network comes back
useEffect(() => {
    // ... subscription setup
}, [user, subscriptionKey]);
```

**Behavior**:
- When network goes offline → online: subscription re-runs
- When user logs in → auth token refreshes → new data fetched
- Stale cache replaced with fresh server data

### 4. Smart Caching Strategy
```typescript
// Only cache SERVER data, not cached data
if (!meta?.fromCache && data.length > 0) {
    localStorage.setItem(`patients_${user.uid}`, JSON.stringify(data.slice(0, 10)));
}
```

**Prevents:**
- Caching empty cache responses
- Caching permission-denied results
- Treating stale cache as source of truth

## Testing Scenarios

### Scenario 1: Login on Mobile Data
**Expected Behavior**:
1. Login → auth token generated
2. Subscription initiated → checks cache first
3. Shows "🔄 Showing cached data. Syncing..." if cache exists
4. Server responds → replaces cache with fresh data
5. Shows "✅ Data from SERVER" in console

### Scenario 2: Switch to WiFi
**Expected Behavior**:
1. Network change detected
2. `subscriptionKey` increments → triggers re-subscription
3. Fresh query sent to server
4. Data re-synced even if cache was empty

### Scenario 3: Permission Denied
**Expected Behavior**:
1. Auth token expired/invalid
2. Firestore returns permission-denied
3. UI shows: "⚠️ Authentication required. Please log in again."
4. Toast notification appears
5. User redirected to login (if implemented)

### Scenario 4: Offline → Online
**Expected Behavior**:
1. User goes offline → sees cache
2. Shows "🔄 Showing cached data" banner
3. Comes back online → `online` event fires
4. Re-subscription triggered
5. Fresh data loaded from server

## Console Debugging Output

Now you'll see clear logging:
```
[Patients] 🔄 Data from CACHE (5 items, pending: false)
[Patients] ✅ Data from SERVER (5 items)
[PatientsPage] Network back online - forcing re-subscription
[Patients] ❌ Subscription error: permission-denied
[PatientsPage] Subscription error detected: { code: "permission-denied", message: "..." }
```

## Files Modified

1. **lib/firebase-service.ts**
   - Added `FirestoreSyncMeta` interface
   - Enhanced `subscribeToPatients` with metadata tracking
   - Added `includeMetadataChanges` option
   - Surface errors instead of swallowing them

2. **app/(dashboard)/patients/page.tsx**
   - Added `syncState` tracking
   - Network state monitoring (`online`/`offline` events)
   - Re-subscription on network change
   - Visual sync indicators (cache/error banners)
   - Smart caching (only cache server data)

## What Was NOT Changed

✅ No schema changes  
✅ No real-time architecture refactoring  
✅ No new dependencies  
✅ persistentLocalCache still enabled (correct for offline support)  
✅ Minimal, surgical fixes only

## Next Steps for Production

1. **Testing on APK**:
   - Test login on mobile data → WiFi transition
   - Verify sync indicators appear
   - Confirm data re-fetches correctly

2. **Apply Same Pattern to Other Collections**:
   - `subscribeToConsultations`
   - `subscribeToAppointments`
   - `subscribeToDocuments`
   - All other `onSnapshot` calls

3. **Consider Auth Token Refresh**:
   - If permission errors persist, may need forced token refresh on network change
   - Add in `AuthContext` network listener

4. **Error Recovery Flow**:
   - Add "Retry" button on permission errors
   - Auto-redirect to login on auth failures

## Verification Commands

```bash
# Check for permission errors in console
# Look for: "[Patients] ❌ Subscription error"

# Verify metadata changes enabled
grep -n "includeMetadataChanges" lib/firebase-service.ts

# Confirm network listeners added
grep -n "addEventListener('online'" app/\(dashboard\)/patients/page.tsx
```

## Summary

The fix addresses the root cause: **Firestore cache was being treated as authoritative without checking metadata, and errors were silently swallowed**. Now:

- ✅ App distinguishes cache vs server data
- ✅ Errors are surfaced to user  
- ✅ Network changes trigger re-fetch
- ✅ Clear visual feedback on sync state
- ✅ Smart caching prevents stale data loops

The user will now see either:
- Fresh data from server, or
- Clear "Syncing..." state, or  
- Explicit error message

No more silent empty lists.
