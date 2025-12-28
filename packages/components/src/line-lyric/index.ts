import LineLyric from "./src/LineLyric.vue";
import type { App, Plugin } from "vue";

LineLyric.install = (app: App) => {
  app.component("KgLineLyric", LineLyric);
};

export { LineLyric };
export default LineLyric as typeof LineLyric & Plugin;
