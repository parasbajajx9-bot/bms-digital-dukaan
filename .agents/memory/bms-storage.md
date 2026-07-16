---
name: BMS Storage Architecture
description: localStorage-only app; no backend SQL; version key controls clean resets
---

- Storage version key: `billing_version` in localStorage. Current: `"v3"`.
- Bumping the version (e.g. to `"v4"`) in `storage.ts` clears all keys and forces clean start + onboarding.
- All data keys: `billing_shopSettings`, `billing_inventory`, `billing_customers`, `billing_transactions`, `billing_bills`, `billing_invoice_counter`.
- ShopSettings now includes: `monthlyOverhead`, `aiEnabled`, `aiName` (added for BEP calc and AI assistant).
- Invoice format: `INV-XXXX` (zero-padded 4 digits), counter starts at 100.
- No backend SQL → SQL injection / IDOR / prepared statements are not applicable.

**Why:** localStorage-only design keeps the app fully offline, zero-hosting-cost, instant load. No auth or server needed.

**How to apply:** Any schema change to ShopSettings requires bumping STORAGE_VERSION and updating DEFAULT_SETTINGS with safe defaults.
