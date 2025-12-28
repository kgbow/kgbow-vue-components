# kgbow-vue-components

Vue 3 组件库 Monorepo - 包含动态歌词显示等创意组件。

## 📦 包列表

| 包名 | 版本 | 说明 |
|------|------|------|
| [@kgbow/components](./packages/components) | 0.1.0 | Vue 3 组件库 |

## ✨ 特色组件

### LineLyric 动态歌词

一个具有动态视觉效果的歌词显示组件，特点：

- 🎵 歌词随机位置出现，缓慢漂移
- 🎨 装饰性线条，增加视觉层次
- 🚀 流畅的入场/漂移动画
- 🎯 支持音频时间同步
- 🔧 高度可定制（颜色、字体、动画参数等）

![LineLyric Demo](./docs/demo.gif)

## 🚀 安装

```bash
npm install @kgbow/components
# 或
pnpm add @kgbow/components
# 或
yarn add @kgbow/components
```

## 📖 使用

```vue
<template>
  <LineLyric
    v-model="currentIndex"
    :lyrics="lyrics"
    width="100%"
    height="400px"
    :autoplay="true"
  />
</template>

<script setup>
import { ref } from 'vue'
import { LineLyric } from '@kgbow/components'
import '@kgbow/components/style.css'

const currentIndex = ref(0)
const lyrics = [
  { text: '第一句歌词', duration: 3000 },
  { text: '第二句歌词', duration: 2500 },
  { text: '第三句歌词', duration: 3200 },
]
</script>
```

详细文档请查看 [packages/components/README.md](./packages/components/README.md)

## 🛠 开发

```bash
# 安装依赖
pnpm install

# 启动文档站点开发服务器
pnpm dev

# 构建组件库
pnpm build
```

## 📁 项目结构

```
kgbow-vue-components/
├── packages/
│   ├── components/     # 组件库源码
│   │   ├── src/
│   │   │   ├── button/
│   │   │   ├── line-lyric/
│   │   │   └── index.ts
│   │   └── package.json
│   └── docs/           # 文档站点
│       ├── src/
│       │   ├── pages/
│       │   └── styles/
│       └── package.json
├── package.json
└── README.md
```

## 📄 License

[MIT](./LICENSE)
