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

export type Channel = {
  createdAt: string;
  id: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'INVALID' | 'PENDING';
  telegramChatId: string;
  title: string;
  updatedAt: string;
  username: string | null;
  verifiedAt: string | null;
  version: number;
};

export type Post = {
  channelId: string;
  createdAt: string;
  generateImage: boolean;
  id: string;
  prompt: string;
  publicationMode: 'AUTO' | 'MODERATION';
  status: 'ACTIVE' | 'ARCHIVED' | 'CANCELLED' | 'DRAFT';
  title: string | null;
  topicId: string | null;
  updatedAt: string;
  version: number;
};

export type Publication = {
  attemptCount: number;
  createdAt: string;
  errorCode: string | null;
  id: string;
  nextAttemptAt: string | null;
  postId: string;
  publishedAt: string | null;
  publishedWithImage: boolean;
  scheduledFor: string;
  selectedVersionId: string | null;
  status:
    | 'AWAITING_MODERATION'
    | 'CANCELLED'
    | 'DELIVERY_UNKNOWN'
    | 'FAILED'
    | 'GENERATING'
    | 'PENDING'
    | 'PUBLISHED'
    | 'PUBLISHING'
    | 'READY'
    | 'RETRY_WAIT'
    | 'SKIPPED';
  updatedAt: string;
};

export type PostVersion = {
  createdAt: string;
  generatedAt: string | null;
  id: string;
  postId: string;
  publicationId: string | null;
  sequence: number;
  status:
    | 'APPROVED'
    | 'CANCELLED'
    | 'FAILED'
    | 'GENERATED'
    | 'GENERATION_PENDING'
    | 'GENERATING'
    | 'REJECTED'
    | 'SUPERSEDED';
  text: string | null;
};

export type ModerationRequest = {
  createdAt: string;
  decidedAt: string | null;
  feedback: string | null;
  id: string;
  postId: string;
  postVersion: PostVersion;
  publicationId: string;
  status:
    'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED' | 'REVISION_REQUESTED';
  version: number;
};

export type Schedule = {
  createdAt: string;
  id: string;
  kind: 'ONCE' | 'RECURRING';
  misfireGraceSeconds: number;
  misfirePolicy: 'FIRE_ONCE' | 'LATEST_ONLY' | 'SKIP';
  nextRunAt: string | null;
  postId: string;
  runAt: string | null;
  rrule: string | null;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PAUSED';
  timezone: string;
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
type ApiPage<T> = {
  data: T[];
  page: { hasMore: boolean; nextCursor: string | null };
};

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

function shouldRetryBackendError(error: BackendApiError): boolean {
  return (
    error.code !== 'BOT_INTEGRATION_NOT_CONFIGURED' &&
    [408, 429, 502, 503, 504].includes(error.status)
  );
}

async function waitForRetry(attempt: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 200 * 2 ** (attempt - 1));
  });
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
    const response = await this.request<ApiPage<Topic>>(
      telegramUserId,
      'GET',
      '/api/v1/topics?limit=20',
    );
    return response.data;
  }

  async listChannels(telegramUserId: string): Promise<Channel[]> {
    const response = await this.request<ApiPage<Channel>>(
      telegramUserId,
      'GET',
      '/api/v1/channels?limit=20',
    );
    return response.data;
  }

  async createChannel(
    telegramUserId: string,
    telegramChatId: string,
  ): Promise<Channel> {
    const response = await this.request<ApiEnvelope<Channel>>(
      telegramUserId,
      'POST',
      '/api/v1/channels',
      { body: { telegramChatId }, idempotencyKey: randomUUID() },
    );
    return response.data;
  }

  async verifyChannel(
    telegramUserId: string,
    channelId: string,
  ): Promise<Channel> {
    const response = await this.request<ApiEnvelope<Channel>>(
      telegramUserId,
      'POST',
      `/api/v1/channels/${channelId}/verify`,
      { idempotencyKey: randomUUID() },
    );
    return response.data;
  }

  async updateChannel(
    telegramUserId: string,
    channelId: string,
    version: number,
    title: string,
  ): Promise<Channel> {
    const response = await this.request<ApiEnvelope<Channel>>(
      telegramUserId,
      'PATCH',
      `/api/v1/channels/${channelId}`,
      { body: { title }, ifMatch: version },
    );
    return response.data;
  }

  async archiveChannel(
    telegramUserId: string,
    channelId: string,
    version: number,
  ): Promise<void> {
    await this.request<void>(
      telegramUserId,
      'DELETE',
      `/api/v1/channels/${channelId}`,
      { ifMatch: version },
    );
  }

  async listPosts(telegramUserId: string): Promise<Post[]> {
    const response = await this.request<ApiPage<Post>>(
      telegramUserId,
      'GET',
      '/api/v1/posts?limit=20',
    );
    return response.data;
  }

  async createPost(
    telegramUserId: string,
    input: {
      channelId: string;
      topicId: string | null;
      prompt: string;
      generateImage: boolean;
      publicationMode: Post['publicationMode'];
    },
  ): Promise<Post> {
    const response = await this.request<ApiEnvelope<Post>>(
      telegramUserId,
      'POST',
      '/api/v1/posts',
      { body: input, idempotencyKey: randomUUID() },
    );
    return response.data;
  }

  async updatePost(
    telegramUserId: string,
    postId: string,
    version: number,
    input: Partial<{
      channelId: string;
      topicId: string | null;
      title: string | null;
      prompt: string;
      generateImage: boolean;
      publicationMode: Post['publicationMode'];
    }>,
  ): Promise<Post> {
    const response = await this.request<ApiEnvelope<Post>>(
      telegramUserId,
      'PATCH',
      `/api/v1/posts/${postId}`,
      { body: input, ifMatch: version },
    );
    return response.data;
  }

  async archivePost(
    telegramUserId: string,
    postId: string,
    version: number,
  ): Promise<void> {
    await this.request<void>(
      telegramUserId,
      'DELETE',
      `/api/v1/posts/${postId}`,
      { ifMatch: version },
    );
  }

  async listPostVersions(
    telegramUserId: string,
    postId: string,
  ): Promise<PostVersion[]> {
    const response = await this.request<ApiPage<PostVersion>>(
      telegramUserId,
      'GET',
      `/api/v1/posts/${postId}/versions?limit=20`,
    );
    return response.data;
  }

  async publishPost(
    telegramUserId: string,
    postId: string,
    version: number,
  ): Promise<Publication> {
    const response = await this.request<ApiEnvelope<Publication>>(
      telegramUserId,
      'POST',
      `/api/v1/posts/${postId}/publications`,
      { idempotencyKey: randomUUID(), ifMatch: version },
    );
    return response.data;
  }

  async listModeration(telegramUserId: string): Promise<ModerationRequest[]> {
    const response = await this.request<ApiPage<ModerationRequest>>(
      telegramUserId,
      'GET',
      '/api/v1/moderation?limit=20',
    );
    return response.data;
  }

  async approveModeration(
    telegramUserId: string,
    requestId: string,
    version: number,
  ): Promise<Publication> {
    const response = await this.request<ApiEnvelope<Publication>>(
      telegramUserId,
      'POST',
      `/api/v1/moderation/${requestId}/approve`,
      { idempotencyKey: randomUUID(), ifMatch: version },
    );
    return response.data;
  }

  async requestRevision(
    telegramUserId: string,
    requestId: string,
    version: number,
    feedback: string,
  ): Promise<Publication> {
    const response = await this.request<ApiEnvelope<Publication>>(
      telegramUserId,
      'POST',
      `/api/v1/moderation/${requestId}/revision`,
      { body: { feedback }, idempotencyKey: randomUUID(), ifMatch: version },
    );
    return response.data;
  }

  async rejectModeration(
    telegramUserId: string,
    requestId: string,
    version: number,
  ): Promise<Publication> {
    const response = await this.request<ApiEnvelope<Publication>>(
      telegramUserId,
      'POST',
      `/api/v1/moderation/${requestId}/reject`,
      { idempotencyKey: randomUUID(), ifMatch: version },
    );
    return response.data;
  }

  async listSchedules(telegramUserId: string): Promise<Schedule[]> {
    const response = await this.request<ApiPage<Schedule>>(
      telegramUserId,
      'GET',
      '/api/v1/schedules?limit=20',
    );
    return response.data;
  }

  async createOneTimeSchedule(
    telegramUserId: string,
    input: { postId: string; runAt: string; timezone: string },
  ): Promise<Schedule> {
    const response = await this.request<ApiEnvelope<Schedule>>(
      telegramUserId,
      'POST',
      '/api/v1/schedules',
      {
        body: {
          ...input,
          kind: 'ONCE',
          misfireGraceSeconds: 86_400,
          misfirePolicy: 'FIRE_ONCE',
        },
        idempotencyKey: randomUUID(),
      },
    );
    return response.data;
  }

  async createRecurringSchedule(
    telegramUserId: string,
    input: { postId: string; rrule: string; timezone: string; runAt: string },
  ): Promise<Schedule> {
    const response = await this.request<ApiEnvelope<Schedule>>(
      telegramUserId,
      'POST',
      '/api/v1/schedules',
      {
        body: {
          ...input,
          kind: 'RECURRING',
          misfireGraceSeconds: 21_600,
          misfirePolicy: 'LATEST_ONLY',
        },
        idempotencyKey: randomUUID(),
      },
    );
    return response.data;
  }

  async cancelSchedule(
    telegramUserId: string,
    scheduleId: string,
    version: number,
  ): Promise<void> {
    await this.request<void>(
      telegramUserId,
      'DELETE',
      `/api/v1/schedules/${scheduleId}`,
      { ifMatch: version },
    );
  }

  async pauseSchedule(
    telegramUserId: string,
    scheduleId: string,
    version: number,
  ): Promise<Schedule> {
    return this.transitionSchedule(
      telegramUserId,
      scheduleId,
      'pause',
      version,
    );
  }

  async resumeSchedule(
    telegramUserId: string,
    scheduleId: string,
    version: number,
  ): Promise<Schedule> {
    return this.transitionSchedule(
      telegramUserId,
      scheduleId,
      'resume',
      version,
    );
  }

  private async transitionSchedule(
    telegramUserId: string,
    scheduleId: string,
    action: 'pause' | 'resume',
    version: number,
  ): Promise<Schedule> {
    const response = await this.request<ApiEnvelope<Schedule>>(
      telegramUserId,
      'POST',
      `/api/v1/schedules/${scheduleId}/${action}`,
      { idempotencyKey: randomUUID(), ifMatch: version },
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

  async updateTopic(
    telegramUserId: string,
    topicId: string,
    version: number,
    promptTemplate: string,
  ): Promise<Topic> {
    const response = await this.request<ApiEnvelope<Topic>>(
      telegramUserId,
      'PATCH',
      `/api/v1/topics/${topicId}`,
      { body: { promptTemplate }, ifMatch: version },
    );
    return response.data;
  }

  async archiveTopic(
    telegramUserId: string,
    topicId: string,
    version: number,
  ): Promise<void> {
    await this.request<void>(
      telegramUserId,
      'DELETE',
      `/api/v1/topics/${topicId}`,
      { ifMatch: version },
    );
  }

  private async request<T>(
    telegramUserId: string,
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST',
    path: string,
    options: { body?: unknown; idempotencyKey?: string; ifMatch?: number } = {},
  ): Promise<T> {
    const maximumAttempts =
      method === 'GET' || options.idempotencyKey !== undefined ? 3 : 1;

    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        return await this.requestOnce(telegramUserId, method, path, options);
      } catch (error) {
        if (
          !(error instanceof BackendApiError) ||
          !shouldRetryBackendError(error) ||
          attempt === maximumAttempts
        ) {
          throw error;
        }
      }
      await waitForRetry(attempt);
    }

    throw new BackendApiError('BACKEND_UNAVAILABLE', 503);
  }

  private async requestOnce<T>(
    telegramUserId: string,
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST',
    path: string,
    options: { body?: unknown; idempotencyKey?: string; ifMatch?: number } = {},
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
    if (options.ifMatch !== undefined) {
      headers.set('If-Match', `"${options.ifMatch}"`);
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
