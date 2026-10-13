import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Local dev only: serve /api/* from api/router.js (the same handler Vercel runs),
 * so `npm run dev` works without the Vercel CLI.
 */
function localApi() {
  return {
    name: 'veralink-local-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        req.url = '/api' + req.url;
        try {
          const { default: handler } = await server.ssrLoadModule('/api/router.js');
          await handler(req, res);
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Local API failed' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make server-side variables (DATABASE_URL, CLERK_SECRET_KEY) available to the local API.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), localApi()],
    base: '/',
  };
});
