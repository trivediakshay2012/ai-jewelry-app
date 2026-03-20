# Stripe + Auth Role Setup

## App env already wired
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
- EXPO_PUBLIC_ADMIN_EMAILS
- EXPO_PUBLIC_APP_BASE_URL
- EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL

## Add these secrets in Supabase
Go to Supabase -> Edge Functions -> Secrets and add:
- STRIPE_SECRET_KEY=sk_live_or_test_value
- STRIPE_WEBHOOK_SECRET=whsec_value
- APP_BASE_URL=http://localhost:8081

Supabase automatically provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to functions.

## Deploy
1. supabase login
2. supabase link --project-ref fojnxsdgurparkpymekv
3. supabase functions deploy create-checkout-session --no-verify-jwt --debug
4. supabase functions deploy stripe-webhook --no-verify-jwt --debug

## Stripe webhook
Dashboard -> Developers -> Webhooks -> Add endpoint
Endpoint:
https://fojnxsdgurparkpymekv.functions.supabase.co/stripe-webhook

Events:
- checkout.session.completed
- checkout.session.async_payment_succeeded
- payment_intent.succeeded
- payment_intent.payment_failed

Copy the webhook signing secret into Supabase as STRIPE_WEBHOOK_SECRET.

## VS Code
Install the Deno extension so Edge Function imports resolve correctly.
