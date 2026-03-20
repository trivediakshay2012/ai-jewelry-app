# Phase 1 Marketplace Implementation

Built in this iteration:
- Real vendor-only catalog path by default; demo catalog is disabled unless `EXPO_PUBLIC_ENABLE_DEMO_CATALOG=true`
- Vendor inventory now targets `vendor_catalog` and supports save/edit/delete/hide/show
- Vendor products default to pending approval until approved by admin
- Admin dashboard now supports vendor approvals and catalog item approvals
- Vendor dashboard inventory count now points to `vendor_catalog`
- New migration added for `vendor_catalog`, `vendor_quotes`, `vendor_orders`, `notification_events`, indexes, triggers, and RLS
- TypeScript app build passes with `npx tsc --noEmit`

Important launch behavior:
- Public catalog now shows only `is_active = true` and `is_approved = true` products from real vendors
- Demo vendors/products are excluded from the production path by default

Still needs live verification after you run the migration:
- Supabase table creation and policies
- End-to-end vendor signup -> approval -> product approval -> public catalog
- Quote flow and order lifecycle in your real DB
- Payment + webhook updates in production
