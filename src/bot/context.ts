import type { Context } from 'grammy';
import type { I18nFlavor } from '@grammyjs/i18n';

export type SupportedLocale = 'ru' | 'en';
export type BotContext = Context & I18nFlavor & { locale: SupportedLocale };
