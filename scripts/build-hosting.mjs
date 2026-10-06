import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const env = {
  ...process.env,
  SITE_BASE: "/",
  SITE_URL: process.env.SITE_URL || "",
  SITE_OUT_DIR: "dist-hosting",
  SITE_SSR_DIR: ".ssr/hosting",
};
const commands = [
  ["node_modules/vite/bin/vite.js", "build"],
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--ssr",
    "src/prerender.jsx",
    "--outDir",
    env.SITE_SSR_DIR,
  ],
  ["scripts/prerender.mjs"],
];
for (const args of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(
  `Hosting build: dist-hosting; canonical origin: ${env.SITE_URL || "not configured (omitted)"}.`,
);
