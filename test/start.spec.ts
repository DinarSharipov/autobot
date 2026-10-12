import { describe, expect, it, vi } from 'vitest';

import { registerStartHandler, START_MESSAGE } from '../src/bot/start.js';

describe('start handler', () => {
  it('registers /start and replies with the welcome message', async () => {
    const command = vi.fn();
    const bot = { command };

    registerStartHandler(bot as never);

    expect(command).toHaveBeenCalledOnce();
    expect(command).toHaveBeenCalledWith('start', expect.any(Function));

    const handler = command.mock.calls[0]?.[1] as
      | ((context: {
          reply: (message: string) => Promise<void>;
        }) => Promise<void>)
      | undefined;
    const reply = vi.fn().mockResolvedValue(undefined);

    await handler?.({ reply });

    expect(reply).toHaveBeenCalledOnce();
    expect(reply).toHaveBeenCalledWith(START_MESSAGE);
  });
});
