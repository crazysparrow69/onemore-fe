import { z } from 'zod';

const required = { error: 'is required' } as const;

const port = z.string(required).transform((value, ctx) => {
  if (!/^[1-9]\d{0,4}$/.test(value) || Number(value) > 65535) {
    ctx.addIssue({
      code: 'custom',
      message: 'must be an integer between 1 and 65535',
    });
    return z.NEVER;
  }
  return Number(value);
});

const httpUrl = z.string(required).refine(
  (value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        url.hostname.length > 0
      );
    } catch {
      return false;
    }
  },
  { message: 'must be an http(s) URL' },
);

const httpsUrl = z.string(required).refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname.length > 0;
    } catch {
      return false;
    }
  },
  { message: 'must be an https URL' },
);

export const envSchema = z.object({
  PORT: port,
  API_URL: httpUrl,
  VITE_NEON_AUTH_URL: httpsUrl,
});

export const ENV_KEYS = Object.keys(envSchema.shape);

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${details}`);
  }
  return parsed.data;
}

// Undefined keys count as missing, so a real environment without PORT still
// reports "is required" instead of "received undefined".
export function loadValidatedEnv(
  source: Record<string, string | undefined>,
): Env {
  const config: Record<string, unknown> = {};
  for (const key of ENV_KEYS) {
    const value = source[key];
    if (value !== undefined) {
      config[key] = value;
    }
  }
  return validateEnv(config);
}
