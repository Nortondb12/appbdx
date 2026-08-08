# UI Beautification and Unicode Fix Plan

The goal is to modernize the homepage UI ("make it more beautiful") and fix issues with invisible Unicode characters (U+2063) that may cause blank or invisible text in the HeaderLogo and other sections.

## Proposed Changes

### 1. Header & Logo Enhancements
- **File:** `src/components/HeaderLogo.tsx`
- **Action:** Ensure all spans and labels are robust. Remove any potential invisible characters like `\u2063`. Add a subtle floating animation to the logo.
- **File:** `src/pages/Index.tsx`
- **Action:** Refine the "AVD Pro" title with a more premium text gradient and improved tracking/kerning.

### 2. Modernize Platform Selection
- **File:** `src/components/PlatformTabs.tsx`
- **Action:** Replace emoji icons with sleek `lucide-react` icons (Globe, Youtube, Instagram, Music, User).
- **Style:** Improve the "active" indicator with a smoother transition and a subtle glow.

### 3. Advanced Background & Card Effects
- **File:** `src/components/AnimatedBackground.tsx`
- **Action:** Add a "starry" or "particle" overlay using a CSS-only pattern or more animated orbs to create depth.
- **File:** `src/pages/Index.tsx`
- **Action:** Enhance the `glass-card` around the input with a thin border-gradient and a deeper backdrop-blur.

### 4. Interactive Micro-interactions
- **File:** `src/components/VideoUrlInput.tsx`
- **Action:** Add a subtle focus ring animation and improve the "Download" button's loading state appearance.
- **File:** `src/components/DonateButton.tsx` & `src/components/ThemeToggle.tsx`
- **Action:** Add gentle scale-on-hover effects.

### 5. Unicode Character Cleanup
- **Action:** Scan and replace any accidental `\u2063` (Invisible Separator) in the code to ensure no elements render as "blank" when they should contain content.

## Validation Plan
1. Check the UI on both light and dark modes.
2. Verify that the "Logo Settings" panel still works correctly.
3. Ensure the `PlatformTabs` are responsive on mobile.
4. Confirm no invisible characters are causing spacing issues in the header.
