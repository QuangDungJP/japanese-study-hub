import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// Build-time version stamp
const buildTimestamp = new Date().toISOString();
const buildVersion = `v${Date.now()}`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
    __APP_BUILD_TIME__: JSON.stringify(buildTimestamp),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'screenshot-mobile.png', 'screenshot-desktop.png'],
      manifest: {
        id: '/',
        name: 'Quang Dũng Nihongo',
        short_name: 'Quang Dũng',
        description: 'Trung tâm đào tạo Nhật ngữ trực tuyến chuyên nghiệp',
        start_url: '/',
        scope: '/',
        theme_color: '#0f0f1e',
        background_color: '#0f0f1e',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'vi',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            label: 'Quang Dũng Nihongo - Học tiếng Nhật trên điện thoại'
          },
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Quang Dũng Nihongo - Học tiếng Nhật trên máy tính'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/api\//,       // Don't cache API calls
          /^\/auth\//,      // Don't cache auth callbacks
          /^\/rest\//,      // Don't cache Supabase REST
          /supabase/,       // Don't cache supabase requests
        ],
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-tooltip'],
          'query-vendor': ['@tanstack/react-query'],
          'lucide-icons': ['lucide-react'],
        },
      },
    },
  },
}));
