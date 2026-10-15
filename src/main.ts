import { BackendClient } from './backend/client.js';
import { createBot } from './bot/app.js';
import { parseEnvironment } from './config/environment.js';
import { createLogger } from './logging.js';

const environment = parseEnvironment(process.env);
const log = createLogger(environment);
const backend = new BackendClient({
  baseUrl: environment.backendUrl,
  keyId: environment.botServiceActiveKeyId,
  secret: environment.botServiceActiveSecret,
});
const bot = createBot(
  environment.telegramToken,
  backend,
  log,
  environment.webAdminUrl,
);
let isStopping = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isStopping || !bot.isRunning()) return;
  isStopping = true;
  log('info', 'Stopping Telegram bot', { signal });
  await bot.stop();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal).catch((error: unknown) => {
      log('error', 'Telegram bot shutdown failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      process.exitCode = 1;
    });
  });
}

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
