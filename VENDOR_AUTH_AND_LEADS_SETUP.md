# Vendor auth and lead capture setup

## What changed
- Vendor onboarding is now real vendor sign up with password.
- Vendor login, logout, and password reset screens were added.
- The vendor dashboard no longer shows internal phase labels.
- Invite links now use `invite_code` from the `vendors` table.
- Customer quote requests now collect name, email, phone, timeline, and notes.
- Quote requests save into `vendor_leads`.

## Supabase steps
1. Open Supabase SQL editor.
2. Run `supabase/migrations/20260314_vendor_auth_and_leads.sql`.
3. In Supabase Auth settings, make sure email/password sign-in is enabled.
4. If you want vendors to log in immediately after sign up, disable mandatory email confirmation for now.
   - If you keep email confirmation on, the app will create the account and send the vendor to the login screen after confirmation.

## New screens
- `/vendor-signup`
- `/vendor-login`
- `/vendor-dashboard`
- `/invite/[vendor]`
- `/request-quote`

## Lead flow
1. Vendor signs up.
2. Vendor logs in.
3. Vendor copies invite link from dashboard.
4. Customer opens `/invite/[invite_code]`.
5. Customer completes design flow.
6. Customer submits quote request.
7. Lead is saved in `vendor_leads`.
