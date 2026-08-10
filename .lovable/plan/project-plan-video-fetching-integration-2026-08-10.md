# Project Plan - Video Fetching Integration

The goal is to ensure the input field is correctly wired to call the `fetch-video` backend function and that the results (thumbnail, title, and quality options) are displayed to the user for final selection.

## Proposed Changes

### 1. Verification of Existing Wiring
- I have reviewed `src/pages/Index.tsx` and confirmed it already calls `supabase.functions.invoke('fetch-video')` in the `handleFetchVideo` function.
- I have confirmed `src/components/VideoPreview.tsx` already handles displaying `video.title`, `video.thumbnail`, and `video.media` (quality options).
- The "Download Video" button logic has been confirmed to require a selection before enabling.

### 2. UI/UX Refinements (if needed)
- Ensure the transition between the input and the preview is smooth.
- Verify that error states from the backend are clearly displayed.

### 3. Validation
- Use Playwright to simulate a user pasting a URL and clicking fetch.
- Verify that the thumbnail and quality options appear.

## User Review Required

> [!IMPORTANT]
> The codebase already contains the logic to wire the input to `POST /fetch` (via Supabase edge functions) and display the results. Would you like me to perform a live validation test to ensure everything is working correctly with the actual backend, or are there specific UI tweaks you'd like to see in how the title/thumbnail/qualities are displayed?

- [ ] Run validation tests
- [ ] Implement specific UI refinements (please specify)
