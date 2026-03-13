# AI Jewelry App Update Notes

## What was updated
- Fixed Supabase client setup to avoid stale persisted JWT issues for edge-function calls.
- Added `supabase/config.toml` with `verify_jwt = false` for the two MVP edge functions.
- Added a collapsible inspiration-images panel in chat.
- Added `stateOrProvince` to support USA state-based tax estimation.
- Added country-aware pricing engine for USA / India / Dubai with currency-aware totals.
- Added pricing display in the image result screen.
- Improved budget-aware reporting with original vs optimized estimate.
- Improved regenerate-selected flow so the applied prompt is returned and reused in the UI.
- Rebuilt `generate-jewelry-image` edge function for cleaner mode handling.

## Keep your existing local secrets
This zip does **not** include your original `.env` values.
Keep your existing `.env` file with:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Required Supabase secret
Make sure your deployed project has:
- `OPENAI_API_KEY`

## Deploy steps
1. Replace your project files with this updated source.
2. Keep your current `.env` file.
3. Deploy edge functions:
   - `supabase functions deploy analyze-inspiration`
   - `supabase functions deploy generate-jewelry-image`
4. Make sure `OPENAI_API_KEY` is set in Supabase secrets.
5. Restart Expo and test the full flow again.
