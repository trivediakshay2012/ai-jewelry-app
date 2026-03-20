Phase 4.2 fixes and upgrades

Implemented in this patch:
- Web-safe vendor product draft storage using localStorage fallback
- Vendor auto-profile creation on first vendor login when no vendor row exists yet
- Vendor inventory draft save no longer depends on Expo file system on web
- Request Quote screen now shows approved vendors for manual selection inline
- Technical sheet subtitle updated for cross-category CAD output expectations

Primary bug fixes:
- Inventory save getting stuck on web while vendor is pending approval
- Vendor not appearing because vendor row could be missing after auth verification/login
