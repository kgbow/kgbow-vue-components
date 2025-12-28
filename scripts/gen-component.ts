import fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import { red, green, bold } from "kolorist";

const componentsDir = path.resolve(__dirname, "../packages/components/src");
const docsDir = path.resolve(__dirname, "../packages/docs/src");

async function init() {
    const result = await prompts(
        [
            {
                type: "text",
                name: "name",
                message: "请输入组件名称 (kebab-case，例如 button):",
                validate: (name) => {
                    if (!name) return "组件名称不能为空";
                    if (!/^[a-z0-9-]+$/.test(name))
                        return "组件名称只能包含小写字母、数字和连字符";
                    if (fs.existsSync(path.join(componentsDir, name)))
                        return "组件已存在";
                    return true;
                },
            },
            {
                type: "text",
                name: "title",
                message: "请输入组件中文名称 (例如 按钮):",
                validate: (title) => (title ? true : "中文名称不能为空"),
            },
        ],
        {
            onCancel: () => {
                console.log(red("✖") + " 操作已取消");
                process.exit(1);
            },
        },
    );

    const { name, title } = result;
    const pascalName = name
        .split("-")
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
    const componentName = `Kg${pascalName}`;

    // 1. Create Component Files
    const componentDir = path.join(componentsDir, name);
    await fs.ensureDir(path.join(componentDir, "src"));

    // components/src/{name}/src/{Name}.vue
    const vueTemplate = `<template>
  <div class="kg-${name}">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  // 定义 props
}

// withDefaults(defineProps<Props>(), {})
defineOptions({
  name: '${componentName}'
})
</script>

<style scoped>
.kg-${name} {
  /* 样式 */
}
</style>
`;
    await fs.writeFile(
        path.join(componentDir, "src", `${pascalName}.vue`),
        vueTemplate,
    );

    // components/src/{name}/index.ts
    const indexTemplate = `import type { App, Plugin } from 'vue'
import ${pascalName} from './src/${pascalName}.vue'

export const ${pascalName}Component: Plugin = {
  install(app: App) {
    app.component(${pascalName}.name!, ${pascalName})
  }
}

export { ${pascalName} }
`;
    // Note: The original index.ts export structure in the repo seems a bit different (it exported { Button } from './button' where ./button exported Button).
    // Let's match the existing pattern more closely if possible, or establish a standard one.
    // Existing: import { Button } from './button' (in root index.ts).
    // In button/index.ts? Let's verify existing structure.
    // We'll trust the plan for now but I might need to adjust button/index.ts style.
    // Let's peek at button/index.ts logic again.
    // button/index.ts:
    // import Button from './src/Button.vue'
    // import { withInstall } from '../../utils' // if utils exist? No, user didn't have utils.
    // Repo showed:
    // packages/components/src/button/index.ts:
    // import Button from './src/Button.vue'
    // export { Button }
    // export default Button

    // Let's keep it simple and consistent with what I see.

    const componentIndexTemplate = `import ${pascalName} from './src/${pascalName}.vue'
import type { App, Plugin } from 'vue'

${pascalName}.install = (app: App) => {
  app.component('${componentName}', ${pascalName})
}

export { ${pascalName} }
export default ${pascalName} as typeof ${pascalName} & Plugin
`;
    await fs.writeFile(
        path.join(componentDir, "index.ts"),
        componentIndexTemplate,
    );

    // 2. Create Doc File
    const docPageDir = path.join(docsDir, "pages", name);
    await fs.ensureDir(docPageDir);

    const docTemplate = `---
title: ${pascalName} ${title}
description: ${pascalName} 组件的描述信息。
---

# ${pascalName} ${title}

描述信息...

## 基础用法

<demo-block>
  <${componentName}>内容</${componentName}>
</demo-block>

\`\`\`vue
<${componentName}>内容</${componentName}>
\`\`\`

## API

### Props

| 属性名 | 说明 | 类型 | 默认值 |
|--------|------|------|--------|
| - | - | - | - |
`;
    await fs.writeFile(path.join(docPageDir, "index.md"), docTemplate);

    // 3. Update Global Files

    // Update packages/components/src/index.ts
    const rootIndex = path.join(componentsDir, "index.ts");
    let rootIndexContent = await fs.readFile(rootIndex, "utf-8");

    // Add import
    // Import lines usually at top. Find last import.
    const importStatement = `import { ${pascalName} } from './${name}'`;
    if (!rootIndexContent.includes(importStatement)) {
        rootIndexContent = rootIndexContent.replace(
            /(import .* from .*\n)(?!import)/,
            `$1${importStatement}\n`,
        );
        // Replace logic is a bit brittle, fallback to top if no match or try to insert after last import.
        // Simpler: split by lines, find last import, insert after.
    }

    // Add to components array
    // const components: Plugin[] = [Button]
    rootIndexContent = rootIndexContent.replace(
        /(const components: Plugin\[\] = \[)(.*)(\])/,
        (match, prefix, content, suffix) => {
            // content might be "Button"
            return `${prefix}${content ? content + ", " : ""}${pascalName}${suffix}`;
        },
    );

    // Add to exports
    // export { Button }
    rootIndexContent = rootIndexContent.replace(
        /(export \{)([^}]*)(\})/,
        (match, prefix, content, suffix) => {
            return `${prefix}${content ? content + ", " : ""}${pascalName}${suffix}`;
        },
    );

    await fs.writeFile(rootIndex, rootIndexContent);

    // Update router
    const routerPath = path.join(docsDir, "router.ts");
    let routerContent = await fs.readFile(routerPath, "utf-8");

    // existing: children: [ ... ]
    // We want to append to children.
    // Look for the children array closing bracket.
    // NOTE: This regex approach is risky if there are nested children.
    // Assuming simple structure based on file view earlier.
    // children: [
    //   { ... }
    // ]

    const routeItem = `
      {
        path: '${name}',
        name: '${pascalName}',
        component: () => import('./pages/${name}/index.md')
      },`;

    // Find the closing bracket of the children array
    const childrenRegex = /(children:\s*\[[\s\S]*?)(\s*\])/;
    routerContent = routerContent.replace(childrenRegex, `$1${routeItem}$2`);

    await fs.writeFile(routerPath, routerContent);

    // Update SideNav
    const sideNavPath = path.join(docsDir, "components/SideNav.vue");
    let sideNavContent = await fs.readFile(sideNavPath, "utf-8");

    const navItem = `
        <router-link to="/components/${name}" class="nav-item" active-class="active">
          ${pascalName} ${title}
        </router-link>`;

    // Insert before the last closing div of nav-group
    // <div class="nav-group">
    //   ...
    // </div>
    // We want to append to the last 'Basic' group or similar.
    // Based on previous view, one group 'Basic'.
    // Let's just find `</div` after `nav-group`? No, simpler to find existing router-link and append after?
    // Or append after the last router-link in the file?
    const lastLinkRegex = /(<router-link[\s\S]*?<\/router-link>)/g;
    const matches = [...sideNavContent.matchAll(lastLinkRegex)];
    if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const insertPos = lastMatch.index! + lastMatch[0].length;
        sideNavContent =
            sideNavContent.slice(0, insertPos) +
            navItem +
            sideNavContent.slice(insertPos);
    }

    await fs.writeFile(sideNavPath, sideNavContent);

    console.log(green(`\n✔ 组件 ${name} (${title}) 创建成功！`));

    try {
        const { execSync } = require("child_process");
        console.log("正在格式化代码...");
        execSync("pnpm format", { stdio: "inherit" });
    } catch (e) {
        console.log("格式化失败，请手动运行 pnpm format");
    }
}

init().catch((e) => {
    console.error(e);
});
