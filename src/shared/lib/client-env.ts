declare global {
  interface ImportMetaEnv {
    readonly VITE_NEON_AUTH_URL: string;
  }
}

export function neonAuthUrl(): string {
  const value: unknown = import.meta.env.VITE_NEON_AUTH_URL;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Invalid environment: VITE_NEON_AUTH_URL: is required');
  }
  return value;
}
