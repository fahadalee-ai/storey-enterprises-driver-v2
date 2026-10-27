import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/** Public URL path. Vercel serves this app from the domain root. */
const PRODUCTION_BASE = "/";

export default defineConfig({
  nitro: {
    preset: "vercel",
  },
  vite: {
    base: PRODUCTION_BASE,
    // Allow the domain to access the preview server (if needed for SSR testing)
    server: {
        allowedHosts: [
            "demo.sourapps.com",
            "localhost",
            "127.0.0.1",
        ],
    },
    preview: {
        allowedHosts: [
            "demo.sourapps.com",
            "localhost",
            "127.0.0.1",
        ],
    },
  },
});