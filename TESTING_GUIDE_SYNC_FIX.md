# Testing Guide: Firestore Sync Fix

## Pre-Testing Checklist

1. ✅ Build completed successfully (exit code 0)
2. ✅ No TypeScript errors
3. ✅ Enhanced logging added to console
4. ✅ Sync indicators added to UI

## Test Scenarios

### Test 1: Normal Login Flow
**Steps:**
1. Clear browser cache and localStorage
2. Log in with valid credentials
3. Navigate to Patients page

**Expected Results:**
- Console shows: `[Patients] 🔄 Data from CACHE (0 items)`
- Then: `[Patients] ✅ Data from SERVER (X items)`
- No yellow "Syncing..." banner (data from server immediately)
- Patient list populates correctly

### Test 2: Network Transition (Mobile Data → WiFi)
**Steps:**
1. Log in on mobile data (or Chrome DevTools offline simulation)
2. Go to Patients page
3. Toggle network off → on in DevTools (or switch WiFi on device)

**Expected Results:**
1. Console shows: `[PatientsPage] Network back online - forcing re-subscription`
2. Console shows: `[Patients] ✅ Data from SERVER (X items)`
3. Data refreshes even if cache was empty

**Chrome DevTools Steps:**
- F12 → Network tab → Throttling dropdown → "Offline"
- Wait 2 seconds
- Select "Online" again
- Check console for re-subscription message

### Test 3: Permission Denied Error
**Steps:**
1. Log in normally
2. In Firestore Console, temporarily change security rules to deny read:
   ```javascript
   match /users/{userId}/patients/{document=**} {
     allow read: if false;  // Temporary deny
     allow write: if request.auth.uid == userId;
   }
   ```
3. Refresh the Patients page

**Expected Results:**
- Console shows: `[Patients] ❌ Subscription error: permission-denied`
- Console shows: `[PatientsPage] Subscription error detected`
- UI shows red banner: "⚠️ Authentication required. Please log in again."
- Toast notification appears: "Session expired. Please log in again."
- **NOT** showing "No patients found" empty state

**Cleanup:** Revert Firestore rules to original:
```javascript
match /users/{userId}/patients/{document=**} {
  allow read, write: if request.auth.uid == userId;
}
```

### Test 4: Cached Data on Page Load
**Steps:**
1. Load Patients page normally with data
2. Refresh the page (F5)
3. Watch console logs

**Expected Results:**
- Console shows: `[Patients] 🔄 Data from CACHE (X items, pending: false)`
- Yellow banner appears briefly: "🔄 Showing cached data. Syncing with server..."
- Then: `[Patients] ✅ Data from SERVER (X items)`
- Yellow banner disappears when server data arrives

### Test 5: APK Network Transition (Primary Test Case)
**Steps:**
1. Build and install APK
2. Log in using mobile data
3. Navigate to Patients page
4. Switch to WiFi (or vice versa)
5. Observe behavior

**Expected Results:**
- Data does NOT disappear on network change
- Console log (via Android Logcat): `Network back online - forcing re-subscription`
- Data re-fetches from server automatically
- If briefly showing cache, yellow banner appears then disappears

**Android Logcat Command:**
```bash
adb logcat -s chromium:V
# Look for: [PatientsPage] Network back online
```

## Console Log Patterns

### Successful Flow
```
[Patients] 🔄 Data from CACHE (5 items, pending: false)
[Patients] ✅ Data from SERVER (5 items)
```

### Network Transition
```
[PatientsPage] Network back online - forcing re-subscription
[Patients] ✅ Data from SERVER (5 items)
```

### Permission Error
```
[Patients] ❌ Subscription error: [FirebaseError: Missing or insufficient permissions]
[Patients] Error code: permission-denied
[Patients] Error message: Missing or insufficient permissions
[PatientsPage] Subscription error detected: { code: "permission-denied", message: "..." }
```

## UI Visual Checks

### ✅ Normal State (Server Data)
- No banners
- Patient list populated
- No error messages

### ⚠️ Syncing State (Cache)
- Yellow banner: "🔄 Showing cached data. Syncing with server..."
- Patient list shows cached data
- Banner disappears when server responds

### ❌ Error State
- Red banner: "⚠️ Authentication required. Please log in again."
- Toast notification visible
- Patient list may be empty or show stale cache
- User prompted to take action

## Debugging Tools

### Browser DevTools Console
Filter for patient-related logs:
```javascript
// In console, filter by "Patients" or "PatientsPage"
```

### Network Tab
- Watch for Firestore requests
- Look for 403 (permission denied) responses
- Verify requests fire after network comes back online

### React DevTools
Component: `PatientsPage`
State to watch:
- `syncState.isFromCache`
- `syncState.hasError`
- `syncState.errorMessage`
- `subscriptionKey` (should increment on network change)
- `isOnline`

## Common Issues & Solutions

### Issue: Yellow banner never disappears
**Possible Causes:**
- Network still offline
- Firestore not connecting
- Auth token expired

**Debug:**
1. Check Network tab for failed requests
2. Check if auth token is valid: `await firebase.auth().currentUser?.getIdToken()`
3. Look for permission errors in console

### Issue: Data still disappearing on network change
**Possible Causes:**
- `subscriptionKey` not incrementing
- Network listeners not firing
- Component unmounting/remounting

**Debug:**
1. Add `console.log('[PatientsPage] Re-rendering with key:', subscriptionKey)` in component
2. Verify `online` event fires: `window.addEventListener('online', () => console.log('ONLINE EVENT'))`
3. Check if component is being destroyed and recreated

### Issue: Build failing
**Error:** TypeScript errors in firebase-service.ts
**Solution:** Check that `FirestoreSyncMeta` interface is exported and imported correctly

## Success Criteria

✅ All 5 test scenarios pass  
✅ Console logs match expected patterns  
✅ No silent failures (errors always surfaced)  
✅ Network transitions trigger re-fetch  
✅ Cache vs server data clearly distinguished  
✅ Users see appropriate feedback messages  

## Rollout Checklist

Before deploying to production:

1. ✅ Test on localhost
2. ✅ Test on Firebase App Hosting staging
3. ✅ Test APK on real Android device
4. ✅ Verify Firestore security rules are correct
5. ✅ Monitor console for unexpected errors
6. ✅ Apply same pattern to other subscriptions (consultations, appointments, etc.)

## Next Actions

If this fix works:
1. Apply pattern to `subscribeToConsultations`
2. Apply pattern to `subscribeToAppointments`
3. Apply pattern to `subscribeToDocuments`
4. Consider adding retry mechanism for failed queries
5. Add analytics to track sync errors

If issues persist:
1. Check if auth token is being refreshed on network change
2. Verify Capacitor network plugin is working
3. Test with force token refresh:
   ```typescript
   await user.getIdToken(true); // Force refresh
   ```
