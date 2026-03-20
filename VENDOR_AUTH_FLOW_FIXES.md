Vendor auth flow fixes included in this zip:

1. Vendor signup now includes password + confirm password.
2. Signup shows a clear verification message if Supabase email confirmation is enabled.
3. Pending vendor business details are saved locally so first login can finish vendor row creation.
4. Vendor login page added.
5. Vendor dashboard now distinguishes:
   - not logged in
   - logged in but vendor profile missing
   - logged in with full vendor profile
6. Vendor dashboard no longer shows internal phase roadmap copy.
7. Fixed SQL migration file included:
   supabase/migrations/20260314_vendor_auth_and_leads_fixed.sql

Supabase notes:
- Email provider must be enabled.
- If you want easiest testing, temporarily disable confirm email.
- If confirm email stays enabled, signup will show a message telling the vendor to verify email first.
