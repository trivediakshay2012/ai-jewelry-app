# Phase 4 Implemented

This hardening pass focused on launch blockers reported during live testing.

## Fixed in this patch
- Added `app/admin-login.tsx` so `/admin-login` is now a real route.
- Added `admin-login` to `app/_layout.tsx`.
- Hardened vendor inventory flow:
  - save button now supports local draft saving before approval
  - removed repeated role-refresh reload loop that caused flashing
  - inventory list refresh is now stable
  - image URL is optional while drafting
- Updated admin approval flow so approving a vendor also marks them eligible for routing:
  - `is_onboarded = true`
  - `subscription_status = 'active'`
  - `stripe_onboarding_complete = true`
  - `payouts_enabled = true`
- Relaxed lead auto-routing logic so approved/trialing vendors can be ranked without being excluded by payout flags alone.
- Expanded request-quote vendor fetch so specialization / response / status data are available to the prioritization engine.
- Improved CAD technical sheet styling for earrings to better match the production reference direction.

## Still verify live after merging
1. Admin account can sign in from `/admin-login`.
2. Admin approves a vendor from the admin dashboard.
3. Approved vendor saves product successfully from inventory screen.
4. Product appears in public catalog after admin product approval.
5. Customer custom quote auto-routes once at least one approved vendor exists.
