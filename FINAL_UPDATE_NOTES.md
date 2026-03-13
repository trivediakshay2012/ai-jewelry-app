Final update package includes:

1. Dynamic CAD schema and renderer
- Pendant now stays pendant in the technical sheet.
- Necklace, ring, bracelet, bangle, earrings, and generic custom jewelry now render through a dynamic view schema.
- Technical sheet output is now driven by selected jewelry type + entered fields instead of a shared preset family.

2. Product-locked customer preview flow
- Personal preview now treats the uploaded customer photo as the identity master.
- Selected option image is treated as the product master.
- Prompt rules were hardened to preserve face identity and prevent jewelry redesign drift.
- For try-on mode, image order was changed to send the customer face first, then the selected jewelry option.

3. Source-based pricing engine (MVP benchmark mode)
- Added benchmark-based pricing module: supabase/functions/_shared/pricing.ts
- Supports USA / India / Dubai market logic.
- India GST = 3%
- Dubai / UAE VAT = 5%
- USA uses state-only sales tax map when stateOrProvince is provided.
- Pricing breakdown now includes:
  - metal cost
  - center stone cost
  - accent stone cost
  - making charges
  - other charges
  - tax
- Budget-aware report now includes original estimate vs optimized estimate and recommendations.

Important production note:
- Gold uses an LBMA-derived benchmark proxy inside the MVP engine.
- Diamond pricing uses a Rapaport-style proxy matrix, not a licensed Rapaport feed.
- USA taxes are state-only in this package, not county/city/local tax engine precision.
- For live vendor quoting, replace the proxy engine with licensed / live feeds.

Files changed:
- app/image-result.tsx
- app/chat.tsx
- app/summary.tsx
- context/DesignContext.tsx
- context/context/DesignContext.tsx
- components/TechnicalSheetCard.tsx
- supabase/functions/generate-jewelry-image/index.ts
- supabase/functions/_shared/pricing.ts
- context/supabase/functions/generate-jewelry-image/index.ts
- context/supabase/functions/_shared/pricing.ts

Deploy steps:
1. supabase functions deploy generate-jewelry-image
2. supabase functions deploy analyze-inspiration
3. npx expo start -c

Testing recommendations:
- Test pendant vs necklace technical sheet separately.
- Test USA with a state entered like New Jersey.
- Test India and Dubai budgets.
- Test personal preview with a front-facing customer photo and 1 selected product option.
