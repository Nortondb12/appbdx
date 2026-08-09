# Plan: AppBDX Performance and Resilience Upgrade

This plan addresses several pending technical improvements to make the video downloader more robust and maintainable.

## Proposed Changes

### 1. Backend Health Monitoring
- **Action:** Create a new Edge Function (or update existing) to provide a `/health` status.
- **Action:** Update `src/pages/Index.tsx` to check backend health on mount and display a subtle "System Status" indicator if the backend is unreachable.

### 2. Enhanced Logging & Traceability
- **Action:** Implement correlation ID generation in the frontend for every fetch/download request.
- **Action:** Update Supabase Edge Functions to accept and log this correlation ID, making it easier to trace errors across the stack.

### 3. UI Resilience (Error Boundaries)
- **Action:** Implement a global `ErrorBoundary` component in `src/components/ErrorBoundary.tsx`.
- **Action:** Wrap the `VideoPreview` and main `Index` layout with Error Boundaries to prevent full-page blank screens during runtime crashes.

### 4. Strict Download Validation
- **Action:** Update `src/components/VideoPreview.tsx` logic to ensure the "Download" button is only enabled when valid media objects and selected quality are confirmed.

### 5. Unicode Cleanup (Ongoing)
- **Action:** Continue monitoring for and removing any invisible characters like `\u2063` during component updates.

## Validation Plan

### Automated Verification
- Verify that the `/health` endpoint returns a 200 OK status.
- Check browser console for correlation IDs in outgoing requests.

### Manual Verification
- Simulate a backend failure (e.g., by changing the function name) to see the "System Offline" UI state.
- Trigger a mock error in `VideoPreview` to verify the Error Boundary displays a friendly fallback.
