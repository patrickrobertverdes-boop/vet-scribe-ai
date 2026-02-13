# Transcription Pause/Resume Fix

## Issue
Transcriptions on PC browser were getting paused immediately after starting and couldn't resume properly.

## Root Causes Identified

### 1. Immediate Pause After Connection
- No protection against pause requests immediately after connection
- Could cause race conditions with connection setup

### 2. Incorrect Reconnection Logic
- Pause/resume button was trying to call `startListening()` when `!isListening`
- This could trigger reconnection attempts even when connection was still active

### 3. MediaRecorder State Confusion
- Insufficient logging and state checking for MediaRecorder
- Unclear what state transitions were happening

## Fixes Applied

### 1. Connection Timestamp Guard (`hooks/use-deepgram.ts`)
```typescript
// Added ref to track connection time
const connectionStartTimeRef = useRef<number>(0);

// Set timestamp when connection opens
ws.onopen = () => {
    connectionStartTimeRef.current = Date.now();
    // ...
};

// Prevent pausing within 2 seconds of connection
if (paused && connectionStartTimeRef.current > 0) {
    const timeSinceConnection = Date.now() - connectionStartTimeRef.current;
    if (timeSinceConnection < 2000) {
        console.warn('[Scribe] ⚠️ Ignoring pause request - connection too recent');
        toast.error('Please wait a moment before pausing');
        return;
    }
}
```

### 2. Improved Pause/Resume Logic (`app/(dashboard)/record/page.tsx`)
```typescript
const handlePauseResume = () => {
    // If not listening at all and session is not active, don't do anything
    if (!isListening && !sessionActive) {
        toast.error('Please start a new session');
        return;
    }

    // If connection dropped but session is active, try to reconnect
    if (!isListening && sessionActive) {
        startListening();
        toast.success('Attempting to re-establish secure link...');
        return;
    }

    // Normal pause/resume toggle (only when connected)
    const willPause = !isPaused;
    togglePause(willPause);
    // ...
};
```

### 3. Enhanced MediaRecorder State Logging
```typescript
const currentState = mediaRecorderRef.current.state;
console.log(`[Scribe] MediaRecorder current state: ${currentState}`);

if (paused && currentState === 'recording') {
    mediaRecorderRef.current.pause();
} else if (!paused && currentState === 'paused') {
    mediaRecorderRef.current.resume();
} else if (!paused && currentState === 'inactive') {
    console.warn('[Scribe] ⚠️ MediaRecorder inactive, cannot resume. Need full restart.');
    // Don't try to restart - let user stop and start fresh
}
```

## Testing Instructions

1. Navigate to `/record` page
2. Click "Begin Capture Protocol"
3. Wait for "LISTENING" status
4. Try to pause immediately - should show error "Please wait a moment before pausing"
5. Wait 2+ seconds, then click pause - should successfully pause
6. Click resume - should successfully resume
7. Check browser console for detailed state logs

## Expected Behavior

✅ Recording starts successfully  
✅ Cannot pause within first 2 seconds (prevents race conditions)  
✅ Can pause after 2 seconds  
✅ Can resume from paused state  
✅ Detailed console logging for debugging  
✅ Proper error messages for invalid states
