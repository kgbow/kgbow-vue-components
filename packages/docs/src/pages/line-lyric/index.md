---
title: LineLyric 线条歌词
description: LineLyric 组件的描述信息。
---

<script setup lang="ts">
import { ref } from "vue";

const dl = ref(null);
const idx = ref(0);

// 方案1：纯 duration（更像“歌词轮播”）
const lyrics = [
  { text: "把昨天都作废" , duration: 2200 },
  { text: "把今天都拿来\n狠狠爱", duration: 3200 },
  { text: "让你听见", duration: 2400 },
  { text: "心跳的节拍", duration: 2800 },
];

function onChange(i: number) {
  // console.log("change ->", i);
}

function randomJump() {
  const i = Math.floor(Math.random() * lyrics.length);
  dl.value?.seek(i);
}
</script>

# LineLyric 线条歌词

在容器中展示跟随时间变化的动态线条歌词效果。

## 基础用法

<demo-block>
  <div style="height: 200px; width: 100%; position: relative; background: #333; overflow: hidden; border-radius: 4px;">
    <KgLineLyric 
      ref="dl"
      v-model="idx"
      :lyrics="lyrics"
      height="260px"
      background="radial-gradient(60% 60% at 50% 30%, rgba(255,255,255,0.14), rgba(0,0,0,0.25))"
      font-size="30px"
      color="rgba(255,255,255,0.92)"
      :line-width="2"
      line-color="rgba(255,255,255,0.65)"
      :seed="'my-song-001'"
      :autoplay="true"
      :loop="true"
      :pause-on-hover="true"
      @change="onChange"
    />
  </div>
  <div style="margin-top: 14px; display:flex; gap: 10px; align-items:center; flex-wrap: wrap;">
      <button @click="dl?.prev()">Prev</button>
      <button @click="dl?.toggle()">{{ dl?.playing ? "Pause" : "Play" }}</button>
      <button @click="dl?.next()">Next</button>

      <span style="opacity:0.8;">index: {{ idx }}</span>

      <button @click="randomJump()">Random Jump</button>
    </div>
</demo-block>

```vue
<script setup>
import { ref } from 'vue'

const lyrics = [
  { text: 'Hello World', start: 0, end: 2000 },
  // ...
]
const currentTime = ref(0)
const paused = ref(false)
const config = {
  fontSize: '24px',
  color: '#fff'
}
</script>

<template>
  <KgLineLyric 
    :lyrics="lyrics" 
    :currentTime="currentTime" 
    :paused="paused" 
    :config="config" 
  />
</template>
```

## API

### Props

| 属性名 | 说明 | 类型 | 默认值 |
| ------ | ---- | ---- | ------ |
| lyrics | 歌词数据数组 | `LyricLine[]` | `[]` |
| currentTime | 当前播放时间 (ms) | `number` | `0` |
| paused | 是否暂停动画 | `boolean` | `false` |
| config | 样式配置对象 | `LineLyricConfig` | `-` |


### Types

```ts
interface LyricLine {
  text: string
  start: number
  end: number
}

interface LineLyricConfig {
  fontSize?: string
  color?: string
  background?: string
  rotateRange?: [number, number]
  driftY?: number
  appearDuration?: number
}
```
