import { createHash, createHmac, randomUUID } from 'node:crypto';

export type BackendClientOptions = {
  baseUrl: string;
  keyId: string | undefined;
  secret: string | undefined;
};

export type TelegramProfileInput = {
  firstName: string | null;
  languageCode: string | null;
  lastName: string | null;
  username: string | null;
};

export type Topic = {
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  promptTemplate: string;
  status: 'ACTIVE' | 'ARCHIVED';
  updatedAt: string;
  version: number;
};

export type Subscription = {
  entitlements: {
    channelLimit: number | null;
    imageGenerationEnabled: boolean;
    imageGenerationMonthly: number | null;
    moderationEnabled: boolean;
    moderationRevisionMonthly: number | null;
    textGenerationMonthly: number | null;
    topicLimit: number | null;
  };
  planCode: string;
  planName: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'TRIALING';
};

export type Usage = {
  items: Array<{
    committed: number;
    limit: number | null;
    metric: 'IMAGE_GENERATION' | 'MODERATION_REVISION' | 'TEXT_GENERATION';
    reserved: number;
  }>;
  periodEnd: string;
  periodStart: string;
};

type ApiEnvelope<T> = { data: T };

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class BackendApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

function canonicalPathAndQuery(path: string): string {
  const url = new URL(path, 'http://autobot.internal');
  const query = [...url.searchParams.entries()]
    .map(([key, value]) => [rfc3986Encode(key), rfc3986Encode(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey !== rightKey) return leftKey < rightKey ? -1 : 1;
      if (leftValue === rightValue) return 0;
      return leftValue < rightValue ? -1 : 1;
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return query ? `${url.pathname}?${query}` : url.pathname;
}

function rfc3986Encode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function readErrorPayload(value: unknown): ApiErrorPayload {
  return typeof value === 'object' && value !== null ? value : {};
}

export class BackendClient {
  private readonly baseUrl: string;
  private readonly keyId: string | undefined;
  private readonly secret: string | undefined;

  constructor(options: BackendClientOptions) {
    this.baseUrl = options.baseUrl;
    this.keyId = options.keyId;
    this.secret = options.secret;
  }

  async resolveTelegramUser(
    telegramUserId: string,
    profile: TelegramProfileInput,
  ): Promise<void> {
    await this.request<ApiEnvelope<unknown>>(
      telegramUserId,
      'POST',
      '/api/v1/internal/telegram-users/resolve',
      {
        body: profile,
      },
    );
  }

  async getSubscription(telegramUserId: string): Promise<Subscription> {
    const response = await this.request<ApiEnvelope<Subscription>>(
      telegramUserId,
      'GET',
      '/api/v1/subscription',
    );
    return response.data;
  }

  async getUsage(telegramUserId: string): Promise<Usage> {
    const response = await this.request<ApiEnvelope<Usage>>(
      telegramUserId,
      'GET',
      '/api/v1/usage',
    );
    return response.data;
  }

  async listTopics(telegramUserId: string): Promise<Topic[]> {
    const response = await this.request<ApiEnvelope<Topic[]>>(
      telegramUserId,
      'GET',
      '/api/v1/topics?limit=20',
    );
    return response.data;
  }

  async createTopic(
    telegramUserId: string,
    input: Pick<Topic, 'name' | 'promptTemplate'>,
  ): Promise<Topic> {
    const response = await this.request<ApiEnvelope<Topic>>(
      telegramUserId,
      'POST',
      '/api/v1/topics',
      {
        body: input,
        idempotencyKey: randomUUID(),
      },
    );
    return response.data;
  }

  private async request<T>(
    telegramUserId: string,
    method: 'GET' | 'POST',
    path: string,
    options: { body?: unknown; idempotencyKey?: string } = {},
  ): Promise<T> {
    if (!this.keyId || !this.secret) {
      throw new BackendApiError('BOT_INTEGRATION_NOT_CONFIGURED', 503);
    }

    const body =
      options.body === undefined
        ? Buffer.alloc(0)
        : Buffer.from(JSON.stringify(options.body));
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomUUID();
    const canonical = [
      method,
      canonicalPathAndQuery(path),
      createHash('sha256').update(body).digest('hex'),
      timestamp,
      nonce,
      telegramUserId,
    ].join('\n');
    const signature = createHmac('sha256', this.secret)
      .update(canonical)
      .digest('hex');
    const headers = new Headers({
      'X-Autobot-Key-Id': this.keyId,
      'X-Autobot-Nonce': nonce,
      'X-Autobot-Service': 'autobot-bot',
      'X-Autobot-Signature': `v1=${signature}`,
      'X-Autobot-Timestamp': timestamp,
      'X-Telegram-User-Id': telegramUserId,
    });

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    if (options.idempotencyKey) {
      headers.set('Idempotency-Key', options.idempotencyKey);
    }

    let response: Response;
    try {
      const request: RequestInit = {
        headers,
        method,
        signal: AbortSignal.timeout(10_000),
      };
      if (options.body !== undefined) {
        request.body = body;
      }
      response = await fetch(new URL(path, this.baseUrl), request);
    } catch {
      throw new BackendApiError('BACKEND_UNAVAILABLE', 503);
    }

    const text = await response.text();
    const payload: unknown = text ? JSON.parse(text) : undefined;
    if (!response.ok) {
      const error = readErrorPayload(payload).error;
      throw new BackendApiError(
        error?.code ?? 'BACKEND_REQUEST_FAILED',
        response.status,
      );
    }

    return payload as T;
  }
}
