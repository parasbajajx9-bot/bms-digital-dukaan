---
name: BMS AI Assistant
description: Rule-based Hinglish chatbot — no LLM, reads from localStorage directly
---

- Component: `src/components/AiAssistant.tsx`. Rendered in `AppLayout.tsx` as a global overlay.
- Toggle: `settings.aiEnabled` (default `true`). If false, the floating button is hidden entirely.
- Custom name: `settings.aiName` (default `"Paras"`). Greeting and all messages use this name.
- Pattern matching handles intents: greeting, help, inventory/stock, sales/revenue, profit/margin, billing navigation, khata/udhaar, bug-report/email, unknown fallback.
- Bug report path: AI generates a `mailto:bms0businessmanagementsystem@gmail.com` link with pre-filled subject+body.
- Renders markdown-style links `[text](mailto:...)` inline in chat messages.
- Does NOT call any external AI API — fully rule-based, works offline.

**Why:** No API key required = zero ongoing cost, works fully offline. Rule-based is sufficient for shop management queries.

**How to apply:** To add new intents, add a new regex branch in the `processMessage()` function in `AiAssistant.tsx`.
