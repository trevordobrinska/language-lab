import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { build, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { buildVersion, precacheUrls, SERVICE_WORKER_FILE } from "./src/offline/cachePlan";

const OUT_DIR = "dist";

/** Every file under `dir`, as paths relative to it. */
function listFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)));
}

/**
 * After the app is built, build `src/offline/serviceWorker.ts` to `dist/sw.js`
 * with the list of every built file to precache and a version fingerprint of
 * the whole build baked in. Any change to the build changes `sw.js`, which is
 * how the browser notices a new version.
 */
function serviceWorker(): Plugin {
  return {
    name: "language-lab-service-worker",
    apply: "build",
    async closeBundle() {
      const outDir = resolve(OUT_DIR);
      const files = listFiles(outDir).filter((path) => path !== SERVICE_WORKER_FILE);
      const version = buildVersion(files.map((path) => ({ path, bytes: readFileSync(join(outDir, path)) })));
      await build({
        configFile: false,
        logLevel: "warn",
        publicDir: false,
        define: {
          __PRECACHE_URLS__: JSON.stringify(precacheUrls(files)),
          __BUILD_VERSION__: JSON.stringify(version),
        },
        build: {
          outDir,
          emptyOutDir: false,
          copyPublicDir: false,
          lib: {
            entry: resolve("src/offline/serviceWorker.ts"),
            formats: ["iife"],
            name: "languageLabServiceWorker",
            fileName: () => SERVICE_WORKER_FILE,
          },
        },
      });
    },
  };
}

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path
  // without hard-coding it.
  base: "./",
  build: {
    outDir: OUT_DIR,
    // Keep every audio clip a separate file, never inlined, so all content is handled one way.
    assetsInlineLimit: 0,
  },
  plugins: [serviceWorker()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
