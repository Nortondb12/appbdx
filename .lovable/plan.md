# Plan: Modern Premium Glass Logo Overhaul

I will upgrade the logo to a "Modern Premium Glass" style as requested, using a sophisticated SVG design with gradients, transparency, and a high-end tech aesthetic.

## Proposed Changes

### Assets
- Create a new premium logo asset (`src/assets/logo-premium.svg`) featuring:
    - A glassmorphic background plate with subtle transparency.
    - A glowing gradient border (Blue/Cyan/White).
    - A refined, 3D-feeling icon in the center.

### Header Components
- Update `src/components/HeaderLogo.tsx` to:
    - Use the new `logo-premium.svg`.
    - Adjust default settings to better fit the glass aesthetic (e.g., slightly higher default glow to match the glass effect).
    - Refine the "Float" and "Scale" hover animations to feel smoother.

### Styling
- Ensure the logo's glass effect integrates perfectly with the existing glassmorphic UI of the site.

## Verification Plan

### Automated Tests
- Run a Playwright script to:
    - Verify the new premium logo renders correctly.
    - Confirm the hover effects and settings panel still function with the new asset.
    - Check the visibility in both dark and light themes.

### Manual Verification
- Inspect the glassmorphism quality and gradient smoothness in the browser.
