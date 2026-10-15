import type { Environment } from './config/environment.js';

type LogLevel = Environment['logLevel'];
const PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function createLogger(
  environment: Pick<Environment, 'buildSha' | 'logLevel'>,
) {
  return (
    level: LogLevel,
    message: string,
    details: Record<string, unknown> = {},
  ): void => {
    if (PRIORITY[level] < PRIORITY[environment.logLevel]) return;
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'autobot-bot',
      buildSha: environment.buildSha,
      ...details,
    });
    if (level === 'error') console.error(payload);
    else if (level === 'warn') console.warn(payload);
    else console.log(payload);
  };
}

export type Logger = ReturnType<typeof createLogger>;
