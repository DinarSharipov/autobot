/** Stable IDs and commands never depend on the user's language. */
export const SECTIONS = [
  { id: 'topics', labelKey: 'section-topics', command: 'topics' },
  { id: 'channels', labelKey: 'section-channels', command: 'channels' },
  { id: 'posts', labelKey: 'section-posts', command: 'posts' },
  { id: 'moderation', labelKey: 'section-moderation', command: 'moderation' },
  { id: 'schedules', labelKey: 'section-schedules', command: 'schedules' },
  {
    id: 'subscription',
    labelKey: 'section-subscription',
    command: 'subscription',
  },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];
export const HOME_LABEL_KEY = 'section-home';
