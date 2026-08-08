# Project Plan - Logo Settings UI Panel

The user wants a UI panel to edit the header logo's glow effect, size, and hover animations. There is already a `Popover` implementation in `HeaderLogo.tsx`, but I will upgrade it to a more prominent `Sheet` (side panel) to better match the "UI Panel" request and provide a more modern experience.

## Proposed Changes

### `src/components/HeaderLogo.tsx`
- Replace `Popover` with `Sheet` from `@/components/ui/sheet`.
- Refine the layout of the settings within the `SheetContent`.
- Keep the existing `localStorage` persistence and `LogoConfig` state.
- Improve the visual feedback for active settings.

## Verification Plan

### Automated Tests
- I will use Playwright to:
    1. Navigate to the homepage.
    2. Hover over the logo to reveal the settings button.
    3. Click the settings button to open the `Sheet`.
    4. Interact with sliders and buttons to verify state updates (checking style attributes on the logo element).
    5. Verify persistence by reloading the page.

### Manual Verification
- Visual check of the `Sheet` layout and responsiveness.
- Verify the "Reset" functionality.
- Check the fallback icon if the logo fails to load.
