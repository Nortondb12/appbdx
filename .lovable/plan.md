# Plan: Minimalist Professional Logo Overhaul

I will replace the existing AVD logo with a more professional, minimalist design as requested, focusing on clean lines and a premium branding aesthetic (AppBDX).

## Proposed Changes

### Assets
- Create a new minimalist logo asset (`src/assets/logo-minimalist.png`) featuring high-contrast typography and a clean icon.
- Generate a matching minimalist favicon.

### Header Components
- Update `src/components/HeaderLogo.tsx` to:
    - Default to the new minimalist design.
    - Adjust the "Glow Intensity" default to a more subtle, professional level.
    - Ensure the "Scale" hover animation feels refined and high-end.
- Ensure the backup icon (if image fails) matches the minimalist style.

### Styling
- Refine the brand colors in the logo area to match a "Minimalist Professional" palette (deep blacks/whites or subtle monochromatic gradients).

## Verification Plan

### Automated Tests
- Run a Playwright script to:
    - Verify the new logo loads correctly in the header.
    - Confirm the logo size and hover effects function as expected.
    - Ensure the "Reset to Defaults" button restores the new minimalist settings.

### Manual Verification
- Visually inspect the logo across light and dark modes to ensure perfect visibility and professional appearance.
