# Phase 3 Implemented

This iteration adds the production-business layer:

- vendor subscription plans: Basic, Pro, Premium
- 7-day free trial defaults for new vendors
- localized subscription pricing display using live FX fetch with fallback
- admin role support via `profiles.role = 'admin'` or `EXPO_PUBLIC_ADMIN_EMAILS`
- admin dashboard tools for:
  - vendor approval
  - plan changes
  - featured vendor toggle
  - suspend/reactivate vendor
  - product approval
- vendor dashboard subscription visibility
- vendor inventory plan limits
- lead prioritization helper based on:
  - subscription tier
  - jewelry category match
  - location relevance
  - response speed
  - vendor rotation
- notification event helper for in-app/email-ready event logging
- new Supabase migration for subscriptions, notification metadata, and access policies

## Important next steps

1. Run the Phase 3 migration in Supabase:
   `supabase/migrations/20260317_phase3_subscriptions_notifications_security.sql`
2. Make your admin account active by setting `profiles.role = 'admin'`
3. Restart Expo with cache clear:
   `npx expo start -c`
4. Test:
   - vendor signup with plan selection
   - vendor approval in admin dashboard
   - product upload + approval
   - quote request auto-routing
   - notifications center

## Admin login

Your admin account should be a normal Supabase Auth user with a matching row in `public.profiles` where:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_ID';
```

You can still use `EXPO_PUBLIC_ADMIN_EMAILS` as a fallback, but DB role is the preferred production path.
