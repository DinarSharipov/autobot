import { Bot } from 'grammy';

import { parseEnvironment } from './config/environment.js';

const environment = parseEnvironment(process.env);
const bot = new Bot(environment.telegramToken);

let isStopping = false;

function log(
  level: 'info' | 'error',
  message: string,
  details: Record<string, unknown> = {},
): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'autobot-bot',
    buildSha: environment.buildSha,
    ...details,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.log(payload);
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isStopping) {
    return;
  }

  isStopping = true;
  log('info', 'Stopping Telegram bot', { signal });
  await bot.stop();
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

async function main(): Promise<void> {
  await bot.start({
    onStart: ({ username }) => {
      log('info', 'Telegram bot started', {
        username,
        backendUrl: environment.backendUrl,
        nodeEnv: environment.nodeEnv,
      });
    },
  });
}

main().catch((error: unknown) => {
  log('error', 'Telegram bot failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exitCode = 1;
});
