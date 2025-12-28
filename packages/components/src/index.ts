import type { App, Plugin } from "vue";
import { Button } from "./button";
import { LineLyric } from "./line-lyric";

const components: Plugin[] = [Button, LineLyric];

export { Button, LineLyric };

export default {
  install(app: App) {
    components.forEach((comp) => app.use(comp));
  },
};
