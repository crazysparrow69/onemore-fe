import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { loadValidatedEnv } from './src/shared/lib/env.ts';

export default defineConfig(({ mode }) => {
  const env = loadValidatedEnv({
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  });

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { port: env.PORT },
    preview: { port: env.PORT },
  };
});
