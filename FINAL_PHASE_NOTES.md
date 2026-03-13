Final phase update package

Included in this package
- Dynamic schema-driven questionnaire per jewelry type
- Dedicated pendant CAD view instead of falling back to necklace CAD
- Stronger identity-lock wording for personal preview / try-on generation
- Vendor stock marketplace screen with Add to cart / Buy now / Take as inspiration
- More polished luxury landing and marketplace UI inspired by premium jewelry ecommerce patterns
- Structured pricing labels for benchmark metal, stone, making, finishing, craftsmanship, and tax

Important deployment note for the JWT issue
This project already includes:
- supabase/config.toml with verify_jwt = false for both edge functions

To make sure hosted deployment respects it, deploy with:

supabase functions deploy generate-jewelry-image --no-verify-jwt
supabase functions deploy analyze-inspiration --no-verify-jwt

Then restart the app cleanly:

npx expo start -c

What is frontend-complete vs MVP-complete
- Vendor inventory browsing, add-to-cart, and use-as-inspiration are included in the app flow
- Buy now currently routes into the app flow placeholder and still needs real checkout wiring
- Pricing is still a structured MVP engine, not a licensed live metals/diamond feed
