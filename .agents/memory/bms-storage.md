---
name: BMS Storage Architecture
description: Owner-scoped PostgreSQL snapshot with browser cache; environment transfers require an explicit backup
---

- BMS now keeps one owner-scoped cloud snapshot in PostgreSQL and a local browser cache for offline use.
- Development and production use separate database/auth environments; data does not move between them automatically.
- Never let an empty cloud account overwrite a populated browser copy. Use the built-in backup export/import for origin or environment transfers.
- Do not bump the local storage version without a data migration plan; version changes can clear existing shop records.

**Why:** Existing shop records originated in browser storage, while publishing provisions separate production services. A deliberate backup step is the only safe way to move records across those boundaries.

**How to apply:** Keep the local cache and cloud snapshot in sync after sign-in. Before changing storage shape or switching environments, preserve a downloadable backup and apply production schema changes through Replit Publishing.
