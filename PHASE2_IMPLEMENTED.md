# Phase 2 implemented

This iteration adds the AI/CAD/pricing layer on top of the marketplace base.

## Included in this zip
- deterministic design-lock model in `lib/designLock.ts`
- richer CAD spec builder in `lib/cadSpecBuilder.ts`
- stronger pricing engine with API-ready live-rate placeholders in `lib/jewelryPricing.ts`
- upgraded CAD-style technical card in `components/TechnicalSheetCard.tsx`
- summary flow now refreshes a locked design snapshot before image generation
- CAD reference sheets added under `assets/cad-references/`

## What this Phase 2 layer improves
- better support for rings, earrings, pendants, necklaces, chains, bracelets, tennis bracelets, and bangles
- preserved design identity between outputs
- pricing realism via weight-based metal pricing, natural-vs-lab diamond tiers, geo-based labor, and included tax
- CAD/spec output closer to your provided references

## Still requires live production verification
- real market-rate APIs must still be wired with your chosen providers
- final manufacturing-grade CAD still needs another polish pass against real jeweler feedback
- vendor-specific pricing overrides belong in the next phase
