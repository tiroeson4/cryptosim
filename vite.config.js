import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";
import { createTemplateData } from "./templates/data.js";

const projectDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(projectDir, "src");
const pages = ["index", "trading", "orders", "portfolio"];

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

export default defineConfig({
  root: srcDir,
  base: "./", // relative URLs, so the build works on GitHub Pages under /<repo>/
  publicDir: resolve(srcDir, "public"),
  plugins: [ejsTemplates()],
  server: { port: 5173, open: true },
  preview: { port: 4173 },
  build: {
    outDir: resolve(projectDir, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(srcDir, `${p}.html`)])),
    },
  },
});
