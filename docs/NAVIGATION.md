# Telegram navigation

## UI contract

The bot has two independent UI layers in private chats:

- The main reply keyboard opens sections from every step. Its carrier message is separate from page messages and is never removed by page cleanup. The keyboard is not one-time and is not forced persistent, so Telegram's native keyboard icon can hide/show it. `/menu` and `/start` resend it when recovery is needed.
- A page message displays section content, actions, or a flow's input prompt. Only inline keyboards are accepted by `renderPage`. Callback actions edit the active page; text input creates a replacement page, then removes the previous page on a best-effort basis. Sending the replacement must succeed before cleanup starts.

Telegram does not allow reply and inline keyboards in the same message. Do not attach the main keyboard to a replaceable page. Native keyboard controls and their appearance depend on the Telegram client.

## Modules

- `src/bot/sections.ts`: shared section IDs, translation keys, and commands.
- `src/bot/keyboards.ts`: reply keyboard and shared inline page navigation.
- `src/bot/navigation.ts`: a Composer registered before feature handlers. Handles section labels, commands, legacy navigation callbacks, cancellation, and stale page callbacks.
- `src/bot/ui.ts`: keyboard installation, active-page tracking, and rendering. Feature modules never manage the main keyboard.
- `src/bot/drafts.ts`: typed transient flow stores with a 15-minute lifetime. Setting a draft replaces any other draft for that user. Global navigation clears drafts before opening the destination.
- Feature composers: backend calls, action callbacks, and flow input; `src/bot/views/` holds page presentation and keyboard builders.

## Adding a section or flow

1. Add the section metadata to `SECTIONS` and its page handler to `sectionHandlers`. TypeScript requires a handler for every section ID. Translated labels, commands, and legacy navigation callbacks are registered centrally.
2. Register feature composers after localization and the navigation Composer in `src/bot/app.ts`. Use `renderPage` for prompts, validation failures, and results.
3. Use `createDraftStore<YourDraft>()` for multi-step input. Navigation, cancellation, replacement, and expiry are shared behavior; do not implement per-feature cleanup registries.
4. Use `menu:<section-id>` callbacks in notifications to open a section. Mutating action callbacks belong to the active page and are rejected when coming from a known obsolete page.

## Runtime limits

Page tracking and drafts are process-local and assume the existing single long-polling bot process. A restart discards drafts and page IDs; the next rendered page reinstalls the reply keyboard. Backend resource versions remain authoritative. Multiple replicas or durable conversation recovery require shared session storage and a deliberate update-ordering strategy.

## Manual acceptance checklist

- Start the bot, then open each section using both reply keyboard and slash commands.
- At every post-creation step, topic input, channel edit, and moderation revision prompt: switch sections, use `/menu`, and use `/cancel`. Navigation must never become draft content.
- Hide/show the main keyboard with Telegram's native control; page transitions must not remove it. `/menu` must restore a manually removed keyboard.
- Start a new flow while another is active; the next text must go only to the new flow.
- Open a navigation callback from an old notification: the active page should change. Mutating callbacks from obsolete pages should display an expiry notice.
- If a page was deleted manually, the next callback render should recreate it without deleting the keyboard carrier.

Local validation uses catalog validation (`npm run locales:check`), formatting, lint, type checking, and build. Automated tests are intentionally not added under repository policy. Native keyboard behavior needs verification in real Telegram clients.

Localization conventions and the refactored application boundaries are documented in [LOCALIZATION.md](LOCALIZATION.md).
