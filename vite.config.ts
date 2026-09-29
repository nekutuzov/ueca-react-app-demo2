import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths'; // For resolving Typescript path aliases

// GitHub Pages is a static host with no SPA fallback, so a direct request for /showcase/controls
// has no file to serve and returns GitHub's own 404 page. Pages does serve 404.html for unmatched
// paths, and the app routes from window.location, so an identical copy makes deep links work. It
// belongs to building the site rather than to publishing it - `npm run preview` gets it too.
function spaFallback(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'spa-fallback',
    apply: 'build',
    configResolved(resolved) { config = resolved; },
    closeBundle() {
      const outDir = resolve(config.root, config.build.outDir);
      const index = resolve(outDir, 'index.html');
      if (existsSync(index)) {
        copyFileSync(index, resolve(outDir, '404.html'));
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/ueca-react-app-demo2/',
  plugins: [react(), tsconfigPaths(), spaFallback()],
  server: {
    port: 5001,
  },
})
