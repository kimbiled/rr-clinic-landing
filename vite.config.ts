import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import type { Connect } from 'vite';

// Vite's SPA fallback otherwise serves the clinic homepage for /doctor/procedure.
// Production files remain regular public/<route>/index.html directories.
const surgeonPageRoutes: Connect.NextHandleFunction = (req, _res, next) => {
  const [pathname, query] = (req.url ?? '/').split('?');
  if (/^\/[a-z-]+(?:\/[a-z-]+)?\/?$/.test(pathname)) {
    const route = pathname.replace(/\/$/, '');
    if (existsSync(fileURLToPath(new URL(`./public${route}/index.html`, import.meta.url)))) {
      req.url = `${route}/index.html${query === undefined ? '' : `?${query}`}`;
    }
  }
  next();
};

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'surgeon-page-routes',
    configureServer(server) { server.middlewares.use(surgeonPageRoutes); },
    configurePreviewServer(server) { server.middlewares.use(surgeonPageRoutes); },
  }],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
});
