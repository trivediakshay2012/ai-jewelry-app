Final three-fix patch included in this package:

1. Chat screen now supports quick in-chat editing of answered fields.
   - Tap any answered field in the new "Quick Edit in Chat" section.
   - Update the value immediately without waiting for the full questionnaire cycle.

2. Pricing engine now includes separate center / side / halo diamond or stone estimates.
   - Budget-aware reports now explain the changes more clearly.
   - Diamond-heavy designs now show distinct stone-cost lines instead of a single generic stone bucket.

3. Personal model preview now uses a stricter locked-jewelry prompt.
   - The selected jewelry image is duplicated in the edit request to increase fidelity.
   - The uploaded face remains the identity reference while the selected jewelry stays the product blueprint.

Deploy / run:
- supabase functions deploy generate-jewelry-image --no-verify-jwt
- supabase functions deploy analyze-inspiration --no-verify-jwt
- npx expo start -c
