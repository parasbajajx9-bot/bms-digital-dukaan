---
name: Native GitHub authentication
description: Why standard git push is unavailable even when the GitHub connector is attached
---

The connected GitHub OAuth integration is available to the agent's connector API, but it does not provision credentials or a credential helper for the workspace shell. Standard `git push` therefore fails with an authentication error unless the user authenticates Git separately on the machine running the command.

**Why:** The workspace has no GitHub-related shell environment variables, credential helper, or `gh` login state, and GitHub rejects password-style HTTPS pushes.

**How to apply:** Keep the repository remote configured normally, commit locally, and provide the user with standard GitHub CLI or HTTPS credential setup commands rather than trying to extract connector credentials into the shell.