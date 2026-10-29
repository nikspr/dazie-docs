---
name: dazie
description: Read and write the user's dazie journal, to-dos and companion memories, and connect dazie to an AI client. Use when the user mentions dazie, their journal or journaling, wants to log how they feel, recall what they wrote, track a follow-up from a dazie call, or set dazie up in Claude Code, Codex, Cursor or VS Code.
---

# dazie

dazie is a voice-first journaling companion. It calls the user, talks through their day, and saves a journal entry, to-dos and memories from the conversation. You can read and add to that data on the user's behalf. It is their private journal. Quote it back only to them, and write only what they told you.

## Pick a surface

| You are | Use |
|---|---|
| An MCP client (Claude Code, Codex, Cursor, VS Code, Claude) | The MCP server `https://api.dazie.io/mcp`. Run `npx dazie mcp add <client>`. |
| In a terminal or a script | The CLI: `npx dazie <command> --json` |
| Writing code | The SDK: `npm install dazie`, then `import { Dazie } from 'dazie'` |
| Anything else that speaks HTTP | REST at `https://api.dazie.io/v1`, spec at `https://api.dazie.io/v1/openapi.json` |

All four act as one signed-in user and see only that user's data.

## Set up

1. The user needs a dazie account with onboarding finished, at https://app.dazie.io. Writes return `onboarding_required` (HTTP 409) until then. You cannot create the account for them.
2. Sign in: `npx dazie login`. It opens the browser, the user approves, and the token is saved to `~/.config/dazie/credentials.json`. The user has to click; tell them a browser tab is waiting. In CI or a sandbox without a browser, ask the user for a token and set `DAZIE_TOKEN`.
3. Check: `npx dazie whoami --json` returns `onboarded: true`.

For MCP clients, `npx dazie mcp add claude-code` (or `codex`, `cursor`, `vscode`, `windsurf`) registers the server. The client then runs the same browser sign-in the first time it connects. The first request can take up to a minute while the server wakes up; retry once on a timeout.

## CLI

```sh
npx dazie journal list --limit 10 --json
npx dazie journal list --since 2026-10-01 --query "sister" --json
npx dazie journal get 42 --json                # add --transcript for the call transcript
echo "Long walk, felt lighter after." | npx dazie journal write --title "Sunday walk" --mood calm --tag walk
npx dazie todos list --status open --json
npx dazie todos add "Call Sam back" --due 2026-11-02
npx dazie todos done 7                          # or: drop 7, reopen 7
npx dazie memories list --type goals --json
npx dazie memories add relationships "Sam is my sister"
npx dazie schedule --json
```

Output is JSON when piped or with `--json`. Errors go to stderr as `{"error":{"code","message"}}`. Exit code 2 means not signed in; 1 is any other error.

## SDK

```ts
import { Dazie } from 'dazie';

const dazie = new Dazie({ token: process.env.DAZIE_TOKEN });
const { entries } = await dazie.journal.list({ since: '2026-10-01', limit: 20 });
const entry = await dazie.journal.get(entries[0].id);
await dazie.journal.create({ title: 'Sunday walk', content: 'Long walk, felt lighter after.', mood: 'calm' });
await dazie.todos.add({ text: 'Call Sam back', dueDate: '2026-11-02' });
await dazie.todos.update(7, { status: 'done' });
await dazie.memories.add({ type: 'relationships', content: 'Sam is my sister' });
```

Failures throw `DazieError` with `code`: `unauthorized`, `invalid_request`, `not_found`, `onboarding_required`, `network_error` or `internal_error`.

## Rules

- Write journal entries in the user's own words. Never invent feelings, events or moods they did not share.
- Add a memory only when the user asks dazie to remember something.
- Nothing here can delete data, place a call, or change the account or schedule. Send the user to https://app.dazie.io for those.
- Dates are `YYYY-MM-DD`. Memory types: `emotional_state`, `goals`, `relationships`, `insights`, `patterns`, `preferences`. To-do statuses: `open`, `done`, `dropped`.

Docs: https://docs.dazie.io · CLI: https://docs.dazie.io/cli · SDK: https://docs.dazie.io/sdk · API: https://docs.dazie.io/api-reference
