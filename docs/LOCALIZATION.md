# Localization and application structure

The bot uses the official grammY `@grammyjs/i18n` plugin with Mozilla Fluent (`.ftl`). Russian and English are supported. The primary language subtag of Telegram's `language_code` selects the catalog (`en-US` becomes `en`); unsupported or missing languages use Russian. The bot does not persist a separate language preference.

## Application boundaries

- `src/main.ts`: environment, dependencies, process lifecycle, and polling.
- `src/logging.ts`: structured logs and configured level filtering.
- `src/bot/app.ts`: bot assembly and middleware order: localization, navigation, feature composers, fallbacks, error boundary.
- `src/bot/context.ts`: shared context with grammY's `I18nFlavor` and the resolved locale.
- `src/bot/i18n.ts`: catalog loading relative to the module, locale selection, and translated navigation aliases.
- `src/bot/views/`: page presentation and keyboard builders; feature modules own input and backend calls.
- `src/bot/errors.ts`: backend error-code mapping and shared error rendering.
- `src/bot/format.ts`: translated status labels and locale-aware date/number formatting. Publication dates retain the existing `Europe/Moscow` time zone.

## Writing messages

Use `context.t('message-id', { name: value })`. Fluent handles interpolation. Keep full sentences or complete page layouts in the catalog rather than assembling sentences from translated pieces. Commands, callback data, API paths, backend codes, and resource IDs are stable protocol values and must not be translated.

All bot-owned UI text belongs in `src/locales/ru.ftl` and `src/locales/en.ftl`. User-owned values (post text, prompts, channel/topic titles) and backend-provided plan names remain data and are not translated by the bot. Operational logs remain stable technical English.

`npm run locales:check` checks Fluent syntax, duplicate/empty messages, key parity, variable parity, source references, and arguments of statically known translation calls. This check runs in CI alongside formatting, lint, type checking, and build. It is catalog linting; no automated test suite is added.

## Adding a language

1. Add the translated `.ftl` file with the same message IDs and variable names.
2. Add its locale code to `SupportedLocale` in `context.ts` and `SUPPORTED_LOCALES` in `i18n.ts`.
3. Run `npm run locales:check` and all normal quality gates.
4. Verify menu navigation, errors, dates, and numbers in Telegram.

Navigation recognizes labels from every supported catalog, so the previous keyboard continues to work after a Telegram language change. On the next page render, its carrier is refreshed if the resolved locale differs. Callback data does not change with the language.

## Build and deployment

`scripts/build.mjs` compiles TypeScript and copies the Fluent catalogs to `dist/locales`. Both development and compiled code resolve the catalogs relative to the i18n module, independently of the current working directory. The Docker build includes the build script, and its existing `dist` copy includes all catalogs in the runtime image.

Native Telegram keyboard visibility still needs manual verification in Telegram clients; local compilation and catalog linting cannot validate client UI behavior.
