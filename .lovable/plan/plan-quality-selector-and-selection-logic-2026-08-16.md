# Plan - Quality Selector and Selection Logic

The application already has `VideoPreview.tsx` which implements the quality selector (using `RadioGroup` for small lists and `Select` for larger ones) and `Index.tsx` which handles the `/fetch` and `/download` flows. I will verify the existing implementation and ensure the "Download Video" button strictly requires a selection before enabling.

## Proposed Changes

### Frontend - `src/components/VideoPreview.tsx`
- Ensure the quality options returned from `/fetch` are correctly mapped to the UI.
- Verify that `selectedMedia` and `hasSelected` states correctly control the `disabled` property of the `Button`.
- Update button label to clearly prompt selection if nothing is chosen.

### Backend - `supabase/functions/fetch-video/index.ts` (Already implemented)
- The edge function returns a `media` array with quality, format, and size info.

## Technical Details
- Using `shadcn/ui` components: `RadioGroup`, `Select`, `Button`, `Card`.
- State synchronization: Resetting selection when `videoInfo` changes.
- Conditional rendering: Switching between Radio and Select based on the number of options (threshold = 4).

## Verification Plan
- **Manual Verification**: Test with a variety of URLs (YouTube, Instagram) to ensure the selector renders and the button state transitions correctly.
- **Automated Verification**: Use a Playwright script to mock API responses and verify the button's `disabled` state transitions from `true` to `false` upon quality selection.
