# Visit Framing & Day Flow Alignment

## Overview

This update transitions the application from a simple "SOAP Tool" to a structured "Visit Workspace". It frames the consultation as a distinct event in a clinical day, providing clear start and end points with a softer, more neutral aesthetic.

## Key Changes

### 1. Persistent Visit Header
- **Location**: Always visible at the top of the right panel (Visit Workspace).
- **Content**:
  - **Patient Name** (or "Unassigned Patient").
  - **Breed** (if available).
  - **Date** (e.g., "Oct 24, 2026").
  - **Status Badge** ("In Progress" [Amber] vs "Completed" [Emerald]).
- **Styling**: Uses a sticky, backdrop-blur header with neutral tones.

### 2. Visit Workflow State
- Introduced `visitStatus` state (`'in-progress' | 'completed'`).
- **In Progress**: Default state. All controls active.
- **Completed**: Triggered by "Complete Visit".
  - Updates status badge to green "Completed".
  - Shows a persistent "Visit Completed" banner.
  - Disables "Begin Visit" button to prevent meaningful re-recording.
  - Disables "Complete Visit" button.

### 3. Terminology Updates
- **Page Header**: "Clinical Capture" → **"Visit Workspace"**.
- **Start Button**: "Begin Capture Protocol" → **"Begin Visit"**.
- **Save Button**: "Save Summary" → **"Save Visit"**.

### 4. Visual Softening
- **Neutral Chips**: Replaced heavy black/white chips for Diagnosis, Medications, and Treatments with neutral `slate-50` (light) / `slate-900` (dark) backgrounds and subtle borders.
- **Consistent Icons**: Used structured icon containers with softer colors.

### 5. Completion Ritual
- **"Complete Visit" Button**: Located at the bottom of the structured data, marks the visit as finished.
- **"Start Next Visit"**: Appears after completion to reset the workspace (clears data, resets status).

## Files Modified
- `app/(dashboard)/record/page.tsx`: Implemented all UI, state logic, and styling updates.

## Usage
1.  **Start**: Click **"Begin Visit"**.
2.  **Monitor**: See the **Persistent Header** showing "In Progress".
3.  **Generate**: Review structured data in the new, cleaner interface.
4.  **Finalize**: Click **"Complete Visit"**.
    - Status changes to "Completed".
    - Controls lock.
5.  **Next**: Click **"Start Next Visit"** to reset.
