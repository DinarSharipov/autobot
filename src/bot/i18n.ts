import { fileURLToPath } from 'node:url';
import { Composer } from 'grammy';
import { I18n } from '@grammyjs/i18n';

import type { BotContext, SupportedLocale } from './context.js';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['ru', 'en'];
export const DEFAULT_LOCALE: SupportedLocale = 'ru';

export const i18n = new I18n<BotContext>({
  defaultLocale: DEFAULT_LOCALE,
  directory: fileURLToPath(new URL('../locales', import.meta.url)),
  localeNegotiator: (context) => context.locale,
  fluentBundleOptions: { useIsolating: false },
});

export function resolveLocale(
  languageCode: string | undefined,
): SupportedLocale {
  const language = languageCode?.toLowerCase().split(/[-_]/)[0];
  return (
    SUPPORTED_LOCALES.find((locale) => locale === language) ?? DEFAULT_LOCALE
  );
}

export function createLocalization(): Composer<BotContext> {
  const localization = new Composer<BotContext>();
  localization.use(async (context, next) => {
    context.locale = resolveLocale(context.from?.language_code);
    await next();
  });
  localization.use(i18n);
  return localization;
}

/** Accept old keyboard labels even after the Telegram language has changed. */
export function translatedLabels(key: string): string[] {
  return SUPPORTED_LOCALES.map((locale) => i18n.t(locale, key));
}
