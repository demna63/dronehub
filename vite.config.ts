import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      {
        name: 'html-firebase-project-id',
        transformIndexHtml(html) {
          return html.replace(/%VITE_FIREBASE_PROJECT_ID%/g, env.VITE_FIREBASE_PROJECT_ID || '');
        },
      },
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: !isProduction, // source maps only in development
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return;
            // `firebase/performance` is loaded with a true dynamic import() at
            // idle (src/lib/firebase/index.ts) because it was blocking LCP;
            // folding it into the eager `firebase` chunk shipped it anyway and
            // silently undid that. Letting Rollup split it restores the intent.
            //
            // NOT firebase/functions: telemetryService imports it statically and
            // apiService imports telemetryService, so it is in the eager graph.
            // Excluding it would only move it out of the stable vendor chunk and
            // into the entry chunk that changes on every deploy — worse caching.
            if (id.includes('@firebase/performance') || id.includes('firebase/performance')) return;
            // Firebase — large SDK, changes infrequently
            if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
            // Animation library — large, isolate for better caching
            if (id.includes('framer-motion')) return 'framer-motion';
            // Maps — the Google Maps React wrapper. The Maps JS API itself is
            // loaded at runtime from maps.googleapis.com, so only the thin
            // wrapper is bundled (leaflet, which was 155 KB, is gone).
            if (id.includes('@vis.gl/react-google-maps')) return 'maps';
            // Router — separate for better caching
            if (id.includes('react-router-dom')) return 'router';
            // Search and realtime utilities
            if (id.includes('fuse.js')) return 'search';
            // Everything else (react, lucide, date-fns, etc.)
            return 'vendor';
          },
          assetFileNames: (info) => {
            let extType = info.name?.split('.').pop() || '';
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'images';
            } else if (/woff|woff2/.test(extType)) {
              extType = 'fonts';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      }
    },

    server: {
      port: 4173,
      strictPort: true,
      host: '0.0.0.0',
      open: false,
      hmr: false,
    }
  };
});