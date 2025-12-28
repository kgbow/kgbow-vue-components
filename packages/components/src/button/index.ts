import type { App, Plugin } from "vue";
import Button from "./src/Button.vue";

Button.install = (app: App) => {
  app.component("KgButton", Button);
};

const installations: Plugin[] = [Button];

export { Button };

export default {
  install(app: App) {
    installations.forEach((comp) => app.use(comp));
  },
};
