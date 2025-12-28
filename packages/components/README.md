# @kgbow/components

Vue 3 组件库 - 包含动态歌词显示等创意组件。

## 安装

```bash
npm install @kgbow/components
# 或
pnpm add @kgbow/components
# 或
yarn add @kgbow/components
```

## 快速开始

### 全局注册

```ts
import { createApp } from 'vue'
import KgbowComponents from '@kgbow/components'
import '@kgbow/components/style.css'

const app = createApp(App)
app.use(KgbowComponents)
app.mount('#app')
```

### 按需引入

```ts
import { LineLyric } from '@kgbow/components'
import '@kgbow/components/style.css'
```

## 组件列表

### LineLyric 动态歌词

一个具有动态视觉效果的歌词显示组件，支持歌词随机位置出现、缓慢漂移、装饰线条等效果。

#### 基础用法

```vue
<template>
  <LineLyric
    v-model="currentIndex"
    :lyrics="lyrics"
    width="100%"
    height="400px"
    :autoplay="true"
    :loop="true"
  />
</template>

<script setup>
import { ref } from 'vue'
import { LineLyric } from '@kgbow/components'

const currentIndex = ref(0)
const lyrics = [
  { text: '第一句歌词', duration: 3000 },
  { text: '第二句歌词', duration: 2500 },
  { text: '第三句歌词', duration: 3200 },
]
</script>
```

#### 配合音频播放

```vue
<template>
  <LineLyric
    ref="lyricRef"
    v-model="currentIndex"
    :lyrics="lyrics"
    :autoplay="false"
  />
  <audio ref="audioRef" :src="musicUrl" @timeupdate="onTimeUpdate" />
</template>

<script setup>
import { ref, watch } from 'vue'
import { LineLyric } from '@kgbow/components'

const lyricRef = ref(null)
const audioRef = ref(null)
const currentIndex = ref(0)

// 歌词数据（time 为毫秒时间戳）
const lyrics = [
  { text: '第一句歌词', time: 0 },
  { text: '第二句歌词', time: 3000 },
  { text: '第三句歌词', time: 6000 },
]

function onTimeUpdate() {
  const timeMs = audioRef.value.currentTime * 1000
  // 根据时间找到对应歌词索引
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (timeMs >= lyrics[i].time) {
      currentIndex.value = i
      break
    }
  }
}

// 监听索引变化，同步歌词组件
watch(currentIndex, (i) => {
  lyricRef.value?.seek(i)
})
</script>
```

#### Props

| 属性名 | 说明 | 类型 | 默认值 |
|--------|------|------|--------|
| `v-model` | 当前歌词索引（受控模式） | `number` | - |
| `lyrics` | 歌词数据数组 | `LyricItem[]` | `[]` |
| `autoplay` | 是否自动播放 | `boolean` | `true` |
| `loop` | 是否循环播放 | `boolean` | `true` |
| `width` | 容器宽度 | `string` | `"100%"` |
| `height` | 容器高度 | `string` | `"220px"` |
| `background` | 背景色/渐变 | `string` | `"rgba(0,0,0,0.12)"` |
| `fontSize` | 歌词字体大小 | `string` | `"28px"` |
| `fontFamily` | 歌词字体 | `string` | `"system-ui, ..."` |
| `color` | 歌词颜色 | `string` | `"#fff"` |
| `lineColor` | 装饰线条颜色 | `string` | `"rgba(255,255,255,0.7)"` |
| `lineWidthMin` | 线条最小宽度 (px) | `number` | `2` |
| `lineWidthMax` | 线条最大宽度 (px) | `number` | `4` |
| `lineCountMin` | 最少线条数量 | `number` | `2` |
| `lineCountMax` | 最多线条数量 | `number` | `3` |
| `lineLengthMin` | 线条最小长度 (px) | `number` | `80` |
| `lineLengthMax` | 线条最大长度 (px) | `number` | `220` |
| `lineOpacity` | 线条透明度 | `number` | `0.75` |
| `entranceMs` | 入场动画时长 (ms) | `number` | `260` |
| `defaultDurationMs` | 默认歌词持续时长 (ms) | `number` | `3200` |
| `driftSpeed` | 漂移速度 (px/s) | `number` | `28` |
| `rotateDegMax` | 最大旋转角度 (deg) | `number` | `8` |
| `padding` | 安全边距 (px) | `number` | `18` |
| `seed` | 随机种子（保证相同歌词位置一致） | `string \| number` | `12345` |
| `pauseOnHover` | 鼠标悬停时暂停 | `boolean` | `false` |

#### LyricItem 类型

```ts
// 方式1：指定持续时长
interface LyricItemWithDuration {
  text: string
  duration: number  // 毫秒
}

// 方式2：指定时间戳（自动计算持续时长）
interface LyricItemWithTime {
  text: string
  time: number  // 毫秒时间戳
}

type LyricItem = LyricItemWithDuration | LyricItemWithTime
```

#### 方法 (通过 ref 调用)

| 方法名 | 说明 | 参数 |
|--------|------|------|
| `play()` | 开始播放 | - |
| `pause()` | 暂停播放 | - |
| `toggle()` | 切换播放/暂停 | - |
| `next()` | 下一句 | - |
| `prev()` | 上一句 | - |
| `seek(index)` | 跳转到指定索引 | `index: number` |

#### 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `change` | 歌词切换时触发 | `(index: number)` |
| `finish` | 播放完成时触发（非循环模式） | - |

## License

MIT
