import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import DocPage from "./components/DocPage.vue";
import DemoBlock from "./components/DemoBlock.vue";
import KgbowComponents from "@kgbow/components";
import "./styles/index.css";
import "./styles/markdown.css";

const app = createApp(App);
app.component("DocPage", DocPage);
app.component("DemoBlock", DemoBlock);
app.use(KgbowComponents);
app.use(router);
app.mount("#app");
