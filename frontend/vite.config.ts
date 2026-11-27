import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Writes .br and .gz next to every compressible build file; the Go server serves them directly. */
function precompress(): Plugin {
  const compressible = /\.(js|css|html|svg|json|webmanifest|txt)$/;
  let outDir = "dist";
  return {
    name: "precompress",
    apply: "build",
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const p = join(dir, name);
          if (statSync(p).isDirectory()) walk(p);
          else if (compressible.test(name) && statSync(p).size > 1024) {
            const buf = readFileSync(p);
            writeFileSync(p + ".br", brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
            writeFileSync(p + ".gz", gzipSync(buf, { level: 9 }));
          }
        }
      };
      walk(outDir);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precompress()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: false },
    },
  },
  build: {
    target: "es2022",
    cssMinify: "lightningcss",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
        },
      },
    },
  },
});
