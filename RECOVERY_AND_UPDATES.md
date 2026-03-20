This build restores the project and adds:
- visible customer vendor catalog from the home screen
- vendor inventory upload/manage screen (local Expo FileSystem persistence for Expo Go)
- customer actions on catalog: add to cart, buy now -> cart, request quote, use as inspiration
- customer custom design direct quote flow
- customer choose-vendor-from-catalog quote flow
- platform-priority auto-routing on request-quote
- vendor dashboard links for inventory and catalog preview

Note:
- Inventory uploads in this build persist locally on the device via expo-file-system so they work in Expo Go without extra Supabase setup.
- If you want the same inventory synced across devices/vendors, the next step is to add a real `vendor_products` Supabase table and swap the local store for DB-backed reads/writes.
- Checkout/payment is still a cart/checkout placeholder, not Stripe payment processing.
