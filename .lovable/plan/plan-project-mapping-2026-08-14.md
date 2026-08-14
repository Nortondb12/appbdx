# Plan - Project Mapping

I will provide a comprehensive map of the AppBDX project, including its routes, stack, database structure, and visual patterns.

## User Review Required

> [!IMPORTANT]
> This plan is purely descriptive as requested. No code changes will be made to the application logic.

- No clarifying questions at this stage.

## Technical Details

### Project Map
- **Pages/Routes**:
  - `/`: `src/pages/Index.tsx` (Main Downloader UI).
  - `*`: `src/pages/NotFound.tsx`.
- **Stack**: React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, Supabase (Edge Functions & Auth).
- **Libraries**: Lucide (icons), Sonner (toasts), Radix UI (primitives), React Query.
- **Database**:
  - Managed by Lovable Cloud (Supabase).
  - Current schema shows no custom public tables; data is primarily handled via Edge Functions and local storage.
- **Data Flow**:
  - `URL Input` -> `Supabase Edge Function (fetch-video)` -> `VideoPreview (state)` -> `AdOverlay` -> `Final Download`.
  - Download history is stored in `localStorage`.
- **Visual Pattern**: Premium Glassmorphism, Mesh Gradients, Apple-inspired minimal design.

## Proposed Changes

### Documentation
#### [NEW] `mem://reference/project-map.md`
- Create a persistent memory file containing the requested map for future reference.

### Memory
#### `mem://index.md`
- Register the new project map reference.
