import { chmod, writeFile } from 'node:fs/promises';

const outputPath = process.argv[2];

if (!outputPath) {
  throw new Error('Output path is required');
}

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function safeValue(name, fallback) {
  const value = process.env[name]?.trim() || fallback;

  if (/\r|\n/.test(value)) {
    throw new Error(`${name} must not contain line breaks`);
  }

  return value;
}

const backendUrl = safeValue('BACKEND_URL', 'http://autobot-api:3000');
const parsedBackendUrl = new URL(backendUrl);

if (!['http:', 'https:'].includes(parsedBackendUrl.protocol)) {
  throw new Error('BACKEND_URL must use HTTP or HTTPS');
}

const values = {
  AUTOBOT_BOT_IMAGE: required('AUTOBOT_BOT_IMAGE'),
  BACKEND_URL: backendUrl,
  BUILD_SHA: required('BUILD_SHA'),
  LOG_LEVEL: safeValue('LOG_LEVEL', 'info'),
  TELEGRAM_TOKEN: required('TELEGRAM_TOKEN'),
};

const content = `${Object.entries(values)
  .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
  .join('\n')}\n`;

await writeFile(outputPath, content, { encoding: 'utf8', mode: 0o600 });
await chmod(outputPath, 0o600);
