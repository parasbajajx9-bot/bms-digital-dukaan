---
name: BMS Onboarding Trigger
description: How the first-time onboarding wizard is triggered and dismissed
---

- Onboarding wizard (`OnboardingWizard.tsx`) is shown when `storage.getSettings().shopName?.trim()` is falsy.
- `App.tsx` has `onboardingDone` state: `useState(() => Boolean(storage.getSettings().shopName?.trim()))`.
- Wizard overlays the main app (does not block routing). Dismisses when `onComplete()` is called after saving.
- `DEFAULT_SETTINGS.shopName = ""` ensures fresh installs always see onboarding.
- Wizard character name is always "Paras" (hardcoded in wizard), regardless of `aiName` setting.
- After completion, `window.dispatchEvent(new Event("shop-settings-updated"))` re-syncs all `useShopSettings` hooks.

**Why:** Empty shopName is the sentinel that distinguishes a fresh install from a returning user. Version bump + empty shopName guarantees onboarding fires after any data wipe.
