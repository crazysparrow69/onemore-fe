import axios, {
  AxiosHeaders,
  isAxiosError,
  type AxiosAdapter,
  type AxiosResponse,
} from 'axios';
import { z } from 'zod';
import { ApiError } from '@/shared/api/error';

const REQUEST_TIMEOUT_MS = 10_000;

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    retried?: boolean;
  }
}

export interface ApiClient {
  get(path: string): Promise<unknown>;
  put(path: string, body: unknown): Promise<unknown>;
}

export interface ApiClientDeps {
  adapter?: AxiosAdapter;
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
  onUnauthorized: () => void;
}

const errorBodySchema = z.object({
  statusCode: z.number().optional(),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export function createApiClient(deps: ApiClientDeps): ApiClient {
  const instance = axios.create({
    baseURL: '/api',
    timeout: REQUEST_TIMEOUT_MS,
    headers: { accept: 'application/json' },
    ...(deps.adapter ? { adapter: deps.adapter } : {}),
  });

  instance.interceptors.request.use(async (config) => {
    const headers = AxiosHeaders.from(config.headers);
    if (!headers.has('Authorization')) {
      const token = await deps.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    config.headers = headers;
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse<unknown>) => response,
    async (error: unknown) => {
      if (!isAxiosError<unknown>(error)) {
        throw error;
      }
      const config = error.config;
      if (error.response?.status === 401 && config && !config.retried) {
        const token = await deps.refreshAccessToken();
        if (token) {
          config.retried = true;
          config.headers.set('Authorization', `Bearer ${token}`);
          return instance.request<unknown>(config);
        }
      }
      if (error.response?.status === 401) {
        deps.onUnauthorized();
      }
      throw toApiError(error);
    },
  );

  return {
    async get(path) {
      const response = await instance.get<unknown>(path);
      return response.data;
    },
    async put(path, body) {
      const response = await instance.put<unknown>(path, body);
      return response.data;
    },
  };
}

function toApiError(error: {
  response?: { status: number; data: unknown };
}): ApiError {
  const response = error.response;
  if (!response) {
    return new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }
  const parsed = errorBodySchema.safeParse(response.data);
  if (!parsed.success) {
    return new ApiError(response.status, 'HTTP_ERROR', 'Request failed');
  }
  return new ApiError(
    parsed.data.statusCode ?? response.status,
    parsed.data.code,
    parsed.data.message,
    parsed.data.details,
  );
}
