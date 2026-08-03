// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  // Nitro beta typing lags runtime options like traceDeps.
  nitro: {
    preset: "vercel",
    // Ensure tslib is traced into the Vercel serverless bundle (Supabase needs it).
    // Also import "tslib" from src/server.ts so NFT always sees a hard edge.
    traceDeps: ["tslib*"],
  } as Record<string, unknown>,
});