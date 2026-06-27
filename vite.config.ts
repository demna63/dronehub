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
            // Firebase — large SDK, changes infrequently
            if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
            // Animation library — large, isolate for better caching
            if (id.includes('framer-motion')) return 'framer-motion';
            // Charting — recharts pulls in several d3 sub-packages
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            // Maps — leaflet + react-leaflet
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
            // Router — separate for better caching
            if (id.includes('react-router-dom')) return 'router';
            // Search and realtime utilities
            if (id.includes('fuse.js')) return 'search';
            if (id.includes('socket.io-client')) return 'socket';
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