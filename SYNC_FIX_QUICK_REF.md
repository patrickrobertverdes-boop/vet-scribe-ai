# Quick Reference: Firestore Sync Fix Implementation

## Problem
Data disappeared on APK after network transitions (mobile data → WiFi)

## Root Cause
Firestore cache treated as authoritative without checking metadata; permission errors silently swallowed

## Solution Overview

### 1. Enhanced Subscription with Metadata (firebase-service.ts)
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
        { includeMetadataChanges: true }, // ← KEY FIX
        (snap) => {
            const fromCache = snap.metadata.fromCache;
            const hasPendingWrites = snap.metadata.hasPendingWrites;
            
            if (fromCache) {
                console.log(`🔄 CACHE (${patients.length} items)`);
            } else {
                console.log(`✅ SERVER (${patients.length} items)`);
            }
            
            callback(patients, { fromCache, hasPendingWrites });
        },
        (err) => {
            // Surface errors instead of swallowing
            callback([], { 
                fromCache: true, 
                hasPendingWrites: false, 
                error: { code: err.code, message: err.message } 
            });
        }
    );
}
```

### 2. UI Sync State Tracking (patients/page.tsx)
```typescript
const [syncState, setSyncState] = useState({
    isFromCache: false,
    hasError: false,
    errorMessage: undefined
});

// In subscription callback:
if (meta?.error) {
    setSyncState({ 
        isFromCache: true, 
        hasError: true, 
        errorMessage: meta.error.code === 'permission-denied' 
            ? 'Authentication required. Please log in again.' 
            : meta.error.message 
    });
    toast.error('Session expired. Please log in again.');
    return;
}

setSyncState({ 
    isFromCache: meta?.fromCache ?? false, 
    hasError: false 
});
```

### 3. Network State Monitoring (patients/page.tsx)
```typescript
const [subscriptionKey, setSubscriptionKey] = useState(0);

useEffect(() => {
    const handleOnline = () => {
        console.log('Network back online - forcing re-subscription');
        setSubscriptionKey(prev => prev + 1); // Trigger re-subscribe
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
}, []);

// Dependency array includes subscriptionKey
useEffect(() => {
    const unsubscribe = firebaseService.subscribeToPatients(uid, callback);
    return () => unsubscribe();
}, [user, subscriptionKey]); // ← Re-runs on network change
```

### 4. Visual Indicators (patients/page.tsx)
```tsx
{/* Error State */}
{syncState.hasError && (
    <div className="bg-red-50 border border-red-200">
        ⚠️ {syncState.errorMessage || 'Unable to sync data'}
    </div>
)}

{/* Syncing State */}
{!syncState.hasError && syncState.isFromCache && patients.length > 0 && (
    <div className="bg-yellow-50 border border-yellow-200">
        🔄 Showing cached data. Syncing with server...
    </div>
)}
```

## Files Changed
1. `lib/firebase-service.ts` - Enhanced subscription with metadata
2. `app/(dashboard)/patients/page.tsx` - Sync state tracking and network monitoring

## Key Features
✅ Detects cache vs server data  
✅ Surfaces permission errors  
✅ Re-fetches on network change  
✅ Visual sync indicators  
✅ Smart caching (only cache server data)  

## Testing
1. Log in on mobile data → switch to WiFi
2. Verify console shows: `Network back online - forcing re-subscription`
3. Verify data re-fetches automatically
4. Check for sync banners in UI

## Console Logs to Watch
```
[Patients] 🔄 Data from CACHE (X items)
[Patients] ✅ Data from SERVER (X items)
[PatientsPage] Network back online - forcing re-subscription
[Patients] ❌ Subscription error: permission-denied
```

## Next Steps
Apply same pattern to:
- `subscribeToConsultations`
- `subscribeToAppointments`
- `subscribeToDocuments`

## Build Status
✅ TypeScript compilation successful  
✅ No linting errors  
✅ Production build passes  
