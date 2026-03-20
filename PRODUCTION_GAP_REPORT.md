# AI Jewelry Platform — Iteration Report

## What was built in this iteration
- Enhanced CAD spec engine in `lib/cadSpecBuilder.ts` so the vendor side now gets richer technical-sheet data for ring, earrings, pendant, necklace, bracelet, and bangle flows.
- Added CAD-oriented fields like stone table, estimated metal weights, view labels, primary dimensions, and manufacturing workflow.
- Upgraded checkout to support two paths:
  - save checkout locally in-app
  - attempt live Stripe hosted checkout through the Supabase edge function when backend config is ready
- Upgraded vendor catalog persistence so products now:
  - save locally for fallback
  - attempt to sync to Supabase `vendor_catalog`
  - merge local and remote inventory
- Expanded vendor inventory upload form to capture optional spec fields that can support catalog detail and later CAD logic.
- Added a new Supabase migration file for catalog, quotes, orders, payment requests, payments, and notifications.

## What this iteration improved most
- Better path toward a live marketplace inventory instead of demo-only catalog behavior.
- Better path toward live payments instead of a dead-end checkout button.
- Better CAD/spec structure for multiple jewelry categories instead of only a light placeholder.

## What is still left after this iteration
### Critical before production
1. Run the new Supabase migration and verify every table and policy in your real project.
2. Deploy and test the Stripe edge functions with real environment variables and webhook secret.
3. Verify end-to-end payment flow:
   - checkout session created
   - Stripe redirect works
   - webhook marks payment paid
   - order/payment status updates correctly
4. Verify end-to-end vendor quote flow:
   - customer submits lead
   - vendor sees lead
   - vendor sends quote
   - customer sees quote
   - vendor converts quote into order draft
5. Replace remaining local fallback dependence with verified live backend persistence where needed.

### Important but not yet full production
1. CAD rendering is still a structured technical-sheet layer, not true manufacturing CAD generation.
2. CAD output still needs another pass if you want it to match your sample references more closely across all jewelry types.
3. Real image generation consistency, retries, and storage should still be hardened.
4. Real file/image upload for vendor inventory still needs storage bucket integration instead of only URL-based inputs.
5. Notifications are scaffolded by schema, but you still need to fully wire customer and vendor notification UX.
6. Admin moderation / vendor approval tools are still not complete.
7. Full QA across all customer/vendor routes is still needed.

## Honest production status after this iteration
- Stronger MVP codebase: yes
- Launch-closer: yes
- Fully production-ready: not yet
- Biggest remaining blockers: live backend verification, Stripe/webhooks, quote/order lifecycle testing, and final CAD/output quality pass
