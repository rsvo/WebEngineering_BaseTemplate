import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the browser only talks to the Vite origin; /api is forwarded to the
// Fastify server, so there is no cross-origin request and no CORS in dev.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
});
