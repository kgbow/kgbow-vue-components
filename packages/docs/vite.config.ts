import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Markdown from "unplugin-vue-markdown/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({
      wrapperComponent: "DocPage",
      async markdownItSetup(md) {
        const { default: Shiki } = await import("@shikijs/markdown-it");
        md.use(
          await Shiki({
            theme: "github-light",
          }),
        );
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@kgbow/components": resolve(__dirname, "../components/src/index.ts"),
    },
  },
});
