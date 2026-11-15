import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import ejs from "ejs";
import { createTemplateData } from "./templates/data.js";

const projectDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(projectDir, "src");
const pages = ["index", "trading", "orders", "profile"];

// Server-side templating: every HTML page is rendered with EJS before Vite processes it,
// so header, footer and cards live in src/partials and are reused on all pages.
function ejsTemplates() {
  return {
    name: "ejs-templates",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        return ejs.render(html, createTemplateData(), { filename: ctx.filename });
      },
    },
  };
}

// Demo data for the live preview: a copy of api/db.json is published as data/db.json
// (GitHub Pages has no json-server, the app reads this file in demo mode).
function demoData() {
  const dbPath = resolve(projectDir, "api/db.json");
  return {
    name: "demo-data",
    configureServer(server) {
      server.middlewares.use("/data/db.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(readFileSync(dbPath));
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "data/db.json", source: readFileSync(dbPath, "utf8") });
    },
  };
}

export default defineConfig({
  root: srcDir,
  base: "./", // relative URLs, so the build works on GitHub Pages under /<repo>/
  publicDir: resolve(srcDir, "public"),
  plugins: [ejsTemplates(), demoData()],
  css: {
    preprocessorOptions: { scss: { api: "modern-compiler" } },
    devSourcemap: true,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    outDir: resolve(projectDir, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(srcDir, `${p}.html`)])),
    },
  },
});
