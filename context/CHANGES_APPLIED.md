# Changes Applied

## Budget-aware version flow
- Added a new **Generate Budget-Aware Version** action in `app/image-result.tsx`.
- Added result rendering for the budget-aware image plus a customer-facing summary of the modifications applied.
- Added per-option budget-aware state handling, including reset behavior after regenerating a selected option.

## Edge function updates
- Added `budget-aware` mode in `supabase/functions/generate-jewelry-image/index.ts`.
- Added budget parsing, budget tiering, category-aware optimization planning, and a returned report payload.
- Strengthened prompts so the selected design remains visually locked and the optimization happens through controlled cost-saving adjustments only.
- Included budget fields in the generation context.

## Design-preservation improvements
- Budget-aware output is instructed to preserve the same visible design identity.
- Existing model-preview and personal-preview instructions remain aligned to keep the selected jewelry unchanged.

## Packaging notes
- This zip excludes `node_modules`, `.git`, and local Expo cache files to keep it portable.
- Run `npm install` after unzipping.
