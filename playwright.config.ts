import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  webServer: [
    {
      command:
        'npx vite preview --config apps/web/vite.config.ts --outDir apps/web/dist --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
    },
    {
      command:
        'npx vite preview --outDir storybook-static --host 127.0.0.1 --port 6006 --strictPort',
      url: 'http://127.0.0.1:6006/iframe.html',
    },
    {
      command: 'npm run start:api',
      url: 'http://127.0.0.1:3001/api/config',
      env: { OPENAI_API_KEY: '', OPENAI_MODEL: '', PORT: '3001' },
    },
    {
      command: 'npm run dev --workspace @evidence/web',
      url: 'http://127.0.0.1:5173',
    },
  ],
});
