import { z } from 'zod';

const environmentSchema = z.object({
  BACKEND_URL: z
    .url()
    .default('http://autobot-api:3000')
    .transform((value) => value.replace(/\/$/, '')),
  BUILD_SHA: z.string().trim().min(1).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  TELEGRAM_TOKEN: z.string().trim().min(1, 'TELEGRAM_TOKEN is required'),
});

export type Environment = {
  backendUrl: string;
  buildSha: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  nodeEnv: 'development' | 'test' | 'production';
  telegramToken: string;
};

export function parseEnvironment(source: NodeJS.ProcessEnv): Environment {
  const parsed = environmentSchema.parse(source);

  return {
    backendUrl: parsed.BACKEND_URL,
    buildSha: parsed.BUILD_SHA,
    logLevel: parsed.LOG_LEVEL,
    nodeEnv: parsed.NODE_ENV,
    telegramToken: parsed.TELEGRAM_TOKEN,
  };
}
