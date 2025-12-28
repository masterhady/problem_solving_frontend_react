// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// @ts-expect-error - lovable-tagger has no published type declarations
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: "development" | "production" | "test" }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [
    react(),
    ...(mode === "development" ? [componentTagger()] : []),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
}));
