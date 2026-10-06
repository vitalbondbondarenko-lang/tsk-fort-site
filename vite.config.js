import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { SITE_BASE, SITE_URL } from "./src/siteConfig.js";
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Publish only the assets used by this edition. Legacy concepts stay in source.
const publicAssets = [
  "assets/objects",
  "assets/tsk-fort-logo.png",
  "favicon.png",
  "fonts/manrope-cyrillic.woff2",
  "fonts/manrope-latin.woff2",
  "fonts/Manrope-OFL.txt",
  "documents/company-card.txt",
];
function companyAssets() {
  let config;
  return {
    name: "company-public-assets",
    apply: "build",
    configResolved(value) {
      config = value;
    },
    async closeBundle() {
      if (config.build.ssr) return;
      for (const file of publicAssets) {
        const target = resolve(config.root, config.build.outDir, file);
        await mkdir(resolve(target, ".."), { recursive: true });
        await cp(resolve(config.root, "public", file), target, {
          recursive: true,
        });
      }
    },
  };
}

export default defineConfig({
  base: SITE_BASE,
  define: {
    "import.meta.env.VITE_SITE_BASE": JSON.stringify(SITE_BASE),
    "import.meta.env.VITE_SITE_URL": JSON.stringify(SITE_URL),
  },
  plugins: [react(), companyAssets()],
  build: {
    outDir: process.env.SITE_OUT_DIR || "dist",
    copyPublicDir: false,
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
