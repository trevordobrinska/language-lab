import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path
  // without hard-coding it.
  base: "./",
  build: {
    // Keep every audio clip a separate file, never inlined, so all content is handled one way.
    assetsInlineLimit: 0,
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
