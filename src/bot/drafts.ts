/** Drafts are transient UI state; domain data always lives in the backend. */
const stores = new Set<{ delete(userId: string): void }>();
const DRAFT_TTL_MS = 15 * 60 * 1000;

export function clearConversationDrafts(userId: string): void {
  for (const store of stores) store.delete(userId);
}

/** Each user can have only one active flow across all feature modules. */
export function createDraftStore<T>() {
  const entries = new Map<string, { value: T; expiresAt: number }>();
  const store = {
    get(userId: string): T | undefined {
      const entry = entries.get(userId);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(userId);
        return undefined;
      }
      return entry.value;
    },
    set(userId: string, value: T): void {
      clearConversationDrafts(userId);
      const now = Date.now();
      for (const [key, entry] of entries) {
        if (entry.expiresAt <= now) entries.delete(key);
      }
      entries.set(userId, { value, expiresAt: now + DRAFT_TTL_MS });
    },
    delete(userId: string): void {
      entries.delete(userId);
    },
  };
  stores.add(store);
  return store;
}
