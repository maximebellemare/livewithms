import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const srcAlias = new URL("./src", import.meta.url).pathname;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "pwa-192.png", "pwa-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff}"],
        runtimeCaching: [
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          // Google Fonts webfont files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-webfonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
          // Supabase REST API (daily_entries, medications, etc.) — network first, fall back to cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "supabase-api", expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, networkTimeoutSeconds: 5, cacheableResponse: { statuses: [0, 200] } },
          },
          // Supabase Auth — network only (never cache auth)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly",
          },
          // Supabase Edge Functions — network first with short cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "supabase-functions", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 }, networkTimeoutSeconds: 10, cacheableResponse: { statuses: [0, 200] } },
          },
          // CDN images and assets
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: { cacheName: "image-cache", expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
      manifest: {
        name: "LiveWithMS",
        short_name: "LiveWithMS",
        description: "Track your MS symptoms, medications and appointments — all in one place.",
        theme_color: "#E8751A",
        background_color: "#FCF9F6",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/today",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": srcAlias,
    },
  },
}));
