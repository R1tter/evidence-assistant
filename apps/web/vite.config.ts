import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        main: `${import.meta.dirname}/index.html`,
        technical: `${import.meta.dirname}/technical-demo.html`,
      },
    },
  },
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:3001' } },
});
