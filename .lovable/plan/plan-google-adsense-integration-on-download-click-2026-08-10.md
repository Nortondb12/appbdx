# Plan: Google AdSense Integration on Download Click

The user wants to show a Google AdSense ad when the download button is clicked. Since they don't have an ad ID yet, we will use a demo ad unit/ID.

## Proposed Changes

### 1. Header Integration (`index.html`)
- Add the Google AdSense script tag to the `<head>` of `index.html`.
- Use the standard demo `ca-pub-3940256099942544` (or similar) for the script.

### 2. Ad Management Utility (`src/utils/adsense.ts`)
- Create a utility to manage loading and triggering interstitial or rewarded ads (if applicable for a "click to see ad" flow).
- Since AdSense usually requires a site-wide script and specific slots, we'll implement a function to refresh/trigger an ad display if possible, or prepare a modal/placeholder for the ad.
- *Note*: Standard AdSense doesn't always have a simple "show ad now" JS call like mobile SDKs unless using H5 Games or specific interactive formats. For a standard site, we'll prepare the slot.

### 3. Triggering on Download (`src/pages/Index.tsx` or `src/components/VideoPreview.tsx`)
- Modify `handleDownload` to trigger the ad logic before proceeding with the download.
- Add a short delay or a dedicated "Ad Modal" if standard auto-ads aren't sufficient.

## Detailed Steps

1.  **Modify `index.html`**:
    - Add `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3940256099942544" crossorigin="anonymous"></script>`.
2.  **Create `src/components/AdOverlay.tsx`**:
    - A simple modal/overlay that shows an ad slot when triggered.
    - Uses `adsbygoogle` to push an ad into a slot.
3.  **Update `src/pages/Index.tsx`**:
    - Wrap the download logic to show the `AdOverlay` first.
    - Provide a "Skip" or "Close" button on the overlay to finally trigger the actual download after a few seconds (imitating common ad-supported downloaders).

## Verification Plan

### Manual Verification
1.  Open the app and fetch a video.
2.  Select a quality and click "Download".
3.  Verify that an ad-related modal or overlay appears.
4.  Verify that the download starts (or the download link is opened) after interacting with or closing the ad component.

### Automated Tests
- Since AdSense is external and often blocked in headless browsers, we will mock the ad state and verify the UI transitions from "Click Download" -> "Ad State" -> "Download Triggered".
