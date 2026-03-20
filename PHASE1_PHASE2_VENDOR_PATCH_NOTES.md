# Phase 1 + Phase 2 Vendor Patch Notes

## Fixed
- Vendor onboarding no longer blocks when Supabase auth session is missing.
- Invalid or missing auth session now falls back to demo vendor mode instead of stopping the dashboard flow.
- Vendor dashboard now loads on web and phone even without a signed-in Supabase user.
- Home screen bootstrap now detects either a real vendor role or a stored demo vendor session.

## Added
- `lib/auth.ts` for safe auth lookup.
- `lib/demoVendorStore.ts` for in-session + web localStorage demo vendor persistence.
- Vendor invite link generation inside dashboard.
- Customer-entry preview screen for the next growth phase.

## Updated Files
- `app/index.tsx`
- `app/vendor-signup.tsx`
- `app/vendor-dashboard.tsx`
- `app/vendor-customer-entry.tsx`
- `app/_layout.tsx`
- `lib/vendorHelpers.ts`
- `lib/auth.ts`
- `lib/demoVendorStore.ts`

## After unzip
Run:

```bash
npm install
npx expo start
```
