import { describe, expect, it } from 'vitest';

import { parseEnvironment } from '../src/config/environment.js';

describe('parseEnvironment', () => {
  it('uses the internal backend DNS name by default', () => {
    const environment = parseEnvironment({ TELEGRAM_TOKEN: 'test-token' });

    expect(environment.backendUrl).toBe('http://autobot-api:3000');
    expect(environment.nodeEnv).toBe('development');
  });

  it('rejects an empty Telegram token', () => {
    expect(() => parseEnvironment({ TELEGRAM_TOKEN: '' })).toThrow();
  });

  it('removes a trailing slash from the backend URL', () => {
    const environment = parseEnvironment({
      BACKEND_URL: 'http://autobot-api:3000/',
      TELEGRAM_TOKEN: 'test-token',
    });

    expect(environment.backendUrl).toBe('http://autobot-api:3000');
  });
});
