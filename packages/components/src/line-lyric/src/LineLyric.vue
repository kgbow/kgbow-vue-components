<template>
  <div
    ref="wrapRef"
    class="dl-wrap"
    :style="wrapStyle"
  >
    <!-- 当前组：歌词 + 线段 -->
    <div v-if="current" class="dl-group" :key="groupKey">
      <div
        ref="lyricRef"
        class="dl-lyric"
        :style="lyricStyle"
      >
        {{ current.text }}
      </div>

      <div
        v-for="seg in segments"
        :key="seg.id"
        class="dl-seg"
        :ref="setSegRef"
        :style="seg.style"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

type LyricItem =
  | { text: string; duration?: number }                 // 纯文本 + 可选持续时长(ms)
  | { text: string; time: number };                     // 带时间戳(ms)，组件自动算 duration

type Props = {
  lyrics: LyricItem[];
  modelValue?: number;          // 当前句 index（可选：受控）
  autoplay?: boolean;
  loop?: boolean;

  // 视觉配置
  width?: string;
  height?: string;
  background?: string;
  fontSize?: string;
  color?: string;
  fontFamily?: string;

  // 线段配置
  lineColor?: string;
  lineWidthMin?: number;        // px
  lineWidthMax?: number;        // px
  lineCountMin?: number;
  lineCountMax?: number;
  lineLengthMin?: number;       // px
  lineLengthMax?: number;       // px
  lineOpacity?: number;

  // 动画配置
  entranceMs?: number;          // 入场时长
  defaultDurationMs?: number;   // 无 time / duration 时默认持续
  driftPxMax?: number;          // 漂移最大像素（x/y）
  driftSpeed?: number;          // 漂移速度 px/s
  rotateDegMax?: number;        // 每句最大旋转角
  padding?: number;             // 安全边距

  // 随机可复现
  seed?: number | string;

  // 行为
  pauseOnHover?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  autoplay: true,
  loop: true,

  width: "100%",
  height: "220px",
  background: "rgba(0,0,0,0.12)",
  fontSize: "28px",
  color: "#fff",
  fontFamily: `system-ui, -apple-system, Segoe UI, Roboto, "PingFang SC", "Microsoft YaHei"`,

  lineColor: "rgba(255,255,255,0.7)",
  lineWidthMin: 2,
  lineWidthMax: 4,
  lineCountMin: 2,
  lineCountMax: 3,
  lineLengthMin: 80,
  lineLengthMax: 220,
  lineOpacity: 0.75,

  entranceMs: 260,
  defaultDurationMs: 3200,
  driftPxMax: 60,
  driftSpeed: 28,
  rotateDegMax: 8,
  padding: 18,

  seed: 12345,
  pauseOnHover: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", v: number): void;
  (e: "change", v: number): void;
  (e: "finish"): void;
}>();

/** ---------- 容器尺寸 ---------- */
const wrapRef = ref<HTMLDivElement | null>(null);
const lyricRef = ref<HTMLDivElement | null>(null);
const segRefs = ref<HTMLDivElement[]>([]);
function setSegRef(el: any) {
  if (el) segRefs.value.push(el as HTMLDivElement);
}
function clearSegRefs() {
  segRefs.value = [];
}

const size = reactive({ w: 0, h: 0 });
let ro: ResizeObserver | null = null;

function updateSize() {
  const el = wrapRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  size.w = r.width;
  size.h = r.height;
}

/** ---------- 随机数（可复现） ---------- */
function hashSeed(seed: number | string): number {
  const s = String(seed);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function randBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}
function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(randBetween(rng, min, max + 1));
}

/** ---------- 歌词时长计算 ---------- */
function getDurationAt(i: number): number {
  const item = props.lyrics[i] as any;
  if (!item) return props.defaultDurationMs;

  if (typeof item.duration === "number") return Math.max(200, item.duration);

  // time-based
  if (typeof item.time === "number") {
    const next = props.lyrics[i + 1] as any;
    if (next && typeof next.time === "number") {
      return Math.max(200, next.time - item.time);
    }
    return props.defaultDurationMs;
  }

  return props.defaultDurationMs;
}

/** ---------- 状态：当前 index & 当前组 ---------- */
const innerIndex = ref(0);
const isControlled = computed(() => typeof props.modelValue === "number");
const currentIndex = computed({
  get: () => (isControlled.value ? (props.modelValue as number) : innerIndex.value),
  set: (v) => {
    const nv = clamp(v, 0, Math.max(0, props.lyrics.length - 1));
    if (isControlled.value) emit("update:modelValue", nv);
    else innerIndex.value = nv;
  },
});

const current = computed(() => {
  const item = props.lyrics[currentIndex.value] as any;
  if (!item) return null;
  return { text: item.text ?? "" };
});

const groupKey = ref(0);

/** ---------- 装饰线段数据 ---------- */
type Seg = { id: string; style: Record<string, string> };
const segments = ref<Seg[]>([]);

/** ---------- 动画对象 ---------- */
let animations: Animation[] = [];
let master: Animation | null = null;
const playing = ref(false);

function cancelAll() {
  try { master?.cancel(); } catch {}
  master = null;
  for (const a of animations) {
    try { a.cancel(); } catch {}
  }
  animations = [];
}

function pauseAll() {
  try { master?.pause(); } catch {}
  for (const a of animations) {
    try { a.pause(); } catch {}
  }
  playing.value = false;
}

function playAll() {
  try { master?.play(); } catch {}
  for (const a of animations) {
    try { a.play(); } catch {}
  }
  playing.value = true;
}

/** ---------- 每句渲染 + 随机布局 + 动画 ---------- */
async function showIndex(i: number, { keepPlayState = true } = {}) {
  if (!props.lyrics.length) return;

  // 切换：先停掉旧组动画
  const wasPlaying = playing.value;
  cancelAll();
  clearSegRefs();

  currentIndex.value = i;
  emit("change", currentIndex.value);

  // 生成本句随机布局（基于 seed + index，保证同一句稳定）
  const base = hashSeed(props.seed) ^ (currentIndex.value * 2654435761);
  const rng = mulberry32(base >>> 0);

  // 容器未测量时先测一下
  updateSize();
  const pad = props.padding;
  const w = Math.max(1, size.w);
  const h = Math.max(1, size.h);

  // 计算漂移距离（用于限制起始位置）
  const totalMs = getDurationAt(currentIndex.value);
  const driftSpeed = props.driftSpeed ?? 28;
  const maxDriftLen = driftSpeed * (totalMs / 1000) * 1.2; // 留一点余量

  // 估算当前歌词文本宽度（基于字体大小和文本长度）
  const lyricText = current.value?.text || '';
  const fontSizePx = parseInt(props.fontSize) || 28;
  // 中文字符约等于 1em 宽度，英文/数字约 0.5em
  const chineseChars = (lyricText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = lyricText.length - chineseChars;
  const estimatedTextWidth = chineseChars * fontSizePx + otherChars * fontSizePx * 0.55;
  // 限制最大估算宽度为容器宽度的 70%
  const textWidth = Math.min(estimatedTextWidth, w * 0.7);

  // 安全区域：起始位置需要考虑漂移后不会超出边界
  const safeMarginBase = Math.max(pad, maxDriftLen + 20);
  const safeXMin = safeMarginBase;
  // 右侧需要额外预留歌词文本宽度
  const safeXMax = Math.max(safeMarginBase, w - safeMarginBase - textWidth);
  const safeYMin = safeMarginBase;
  const safeYMax = Math.max(safeMarginBase, h - safeMarginBase - fontSizePx * 2);

  // 歌词起点位置（在安全区域内随机）
  const x0 = randBetween(rng, safeXMin, Math.max(safeXMin, safeXMax));
  const y0 = randBetween(rng, safeYMin, Math.max(safeYMin, safeYMax));

  // 漂移向量（限制范围，避免飞出）
  const dx = randBetween(rng, -props.driftPxMax, props.driftPxMax);
  const dy = randBetween(rng, -props.driftPxMax * 0.7, props.driftPxMax * 0.7);

  const rot0 = randBetween(rng, -props.rotateDegMax, props.rotateDegMax);
  const rot1 = rot0 + randBetween(rng, -props.rotateDegMax * 0.6, props.rotateDegMax * 0.6);

  // 智能计算漂移方向：根据歌词位置，向容器中心方向漂移（带随机偏移）
  // 这样可以避免靠近边缘的歌词飘出容器
  const centerX = w / 2;
  const centerY = h / 2;
  // 从当前位置指向中心的角度
  const angleToCenter = Math.atan2(centerY - y0, centerX - x0);
  // 在指向中心的方向上增加随机偏移（±60度），保持方向大致朝向容器内部
  const angleOffset = randBetween(rng, -Math.PI / 3, Math.PI / 3);
  const driftAngle = angleToCenter + angleOffset;

  // 线段数量
  const lineCount = randInt(rng, props.lineCountMin, props.lineCountMax);
  const lineColor = props.lineColor;
  const lineLenBase = Math.max(w, h);
  const lineLenMin = Math.max(props.lineLengthMin, lineLenBase * 0.65);
  const lineLenMax = Math.max(props.lineLengthMax, lineLenBase * 1.15);

  const minAngleSep = 25;
  const minCenterDist = Math.min(Math.max(Math.min(w, h) * 0.2, 60), 180);

  const chosenAngles: number[] = [];
  function pickAngle(seedAngle: number) {
    let ang = seedAngle;
    for (let t = 0; t < 6; t++) {
      const candidate = (seedAngle + randBetween(rng, -18, 18) + 360) % 180;
      const ok = chosenAngles.every((a) => Math.abs(a - candidate) >= minAngleSep);
      if (ok) {
        ang = candidate;
        break;
      }
    }
    chosenAngles.push(ang);
    return ang;
  }

  const chosenCenters: { x: number; y: number }[] = [];
  function pickCenter() {
    let cx = randBetween(rng, pad, w - pad);
    let cy = randBetween(rng, pad, h - pad);
    for (let t = 0; t < 6; t++) {
      const tx = randBetween(rng, pad, w - pad);
      const ty = randBetween(rng, pad, h - pad);
      const ok = chosenCenters.every((c) => {
        const dx2 = c.x - tx;
        const dy2 = c.y - ty;
        return Math.hypot(dx2, dy2) >= minCenterDist;
      });
      if (ok) {
        cx = tx;
        cy = ty;
        break;
      }
    }
    chosenCenters.push({ x: cx, y: cy });
    return { left: cx, top: cy };
  }

  segments.value = Array.from({ length: lineCount }).map((_, idx) => {
    const len = randBetween(rng, lineLenMin, lineLenMax);
    const lineWidth = randBetween(rng, props.lineWidthMin, props.lineWidthMax);
    const angle = pickAngle((180 / lineCount) * idx);
    const { left, top } = pickCenter();

    return {
      id: `${currentIndex.value}-${idx}-${Math.floor(rng() * 1e9)}`,
      style: {
        left: `${left}px`,
        top: `${top}px`,
        width: `${len}px`,
        height: `${lineWidth}px`,
        opacity: String(props.lineOpacity),
        background: lineColor,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      },
    };
  });

  // 把歌词的绝对位置放到缓存（用于动画计算）
  _layoutCache.x0 = x0;
  _layoutCache.y0 = y0;
  _layoutCache.rot0 = rot0;
  _layoutCache.rot1 = rot1;
  _layoutCache.driftAngle = driftAngle;
  // 歌词初始 transform（与线条结构一致：先定位，再由动画追加漂移）
  _layoutCache.lyricInitTransform = `translate(${x0}px, ${y0}px) rotate(${rot0}deg)`;

  // 触发 DOM 重建
  groupKey.value++;

  await nextTick();

  // 创建动画（歌词 + 线段 + master）
  createAnimations(getDurationAt(currentIndex.value));

  // 恢复播放状态
  if (keepPlayState) {
    // 如果之前在播放，继续播放；或者 autoplay 且非受控模式，自动开始播放
    if (wasPlaying || (props.autoplay && !isControlled.value)) {
      play();
    }
  }
}

const _layoutCache = reactive({
  x0: 0, y0: 0, dx: 0, dy: 0, rot0: 0, rot1: 0,
  driftAngle: 0,
  lyricInitTransform: "",
});

function createAnimations(totalMs: number) {
  const wrap = wrapRef.value;
  const lyricEl = lyricRef.value;
  if (!wrap || !lyricEl) return;

  const entranceMs = Math.min(props.entranceMs, Math.max(80, totalMs * 0.4));
  const ratio = totalMs > 0 ? entranceMs / totalMs : 0.2;
  const driftSpeed = props.driftSpeed ?? 16;
  const driftLen = driftSpeed * (totalMs / 1000);

  // 主时间轴：用一个“无变化”的动画占位，只拿来做 finished / pause / play
  master = wrap.animate([{ opacity: 1 }, { opacity: 1 }], {
    duration: totalMs,
    fill: "both",
  });

  master.finished
    .then(() => {
      // 播放结束：进入下一句
      if (!playing.value) return; // 已暂停则不跳
      // 如果是受控模式（外部通过 v-model 控制），不自动跳转，由外部控制
      if (isControlled.value) return;
      
      if (currentIndex.value >= props.lyrics.length - 1) {
        if (props.loop) showIndex(0);
        else emit("finish");
      } else {
        showIndex(currentIndex.value + 1);
      }
    })
    .catch(() => { /* cancel 时会 reject，忽略 */ });

  // 歌词动画：从容器外滑入 -> 漂移
  const driftAngle = _layoutCache.driftAngle;
  const driftX = Math.cos(driftAngle) * driftLen;
  const driftY = Math.sin(driftAngle) * driftLen * 0.85;
  const rot0 = _layoutCache.rot0;
  const rot1 = _layoutCache.rot1;
  // 入场时间占比：固定 400ms 或总时长的 18%，取较大值
  const entranceDuration = Math.max(400, totalMs * 0.18);
  const settleOffset = Math.min(0.4, entranceDuration / totalMs);
  const initTransform = _layoutCache.lyricInitTransform;
  const rotDelta = rot1 - rot0;

  // 计算从容器外滑入的起始位置
  // 根据漂移角度的反方向，计算需要滑入的距离（确保从容器边缘外开始）
  const x0 = _layoutCache.x0;
  const y0 = _layoutCache.y0;
  const w = size.w;
  const h = size.h;
  
  // 滑入方向（漂移的反方向）
  const slideAngle = driftAngle + Math.PI;
  const cosA = Math.cos(slideAngle);
  const sinA = Math.sin(slideAngle);
  
  // 计算从目标位置到容器边缘的距离（沿滑入方向）
  // 射线与容器边缘的交点距离
  let distToEdge = 0;
  if (Math.abs(cosA) > 0.01) {
    // 水平方向：到左边或右边的距离
    const distX = cosA > 0 ? x0 : (w - x0);
    distToEdge = Math.max(distToEdge, distX / Math.abs(cosA));
  }
  if (Math.abs(sinA) > 0.01) {
    // 垂直方向：到上边或下边的距离
    const distY = sinA > 0 ? y0 : (h - y0);
    distToEdge = Math.max(distToEdge, distY / Math.abs(sinA));
  }
  
  // 滑入距离：从容器边缘再往外延伸 80px，确保完全从外部进入
  const slideDistance = distToEdge + 80;
  const slideInX = cosA * slideDistance;
  const slideInY = sinA * slideDistance;

  // 歌词关键帧：快速滑入 + 模糊消失 -> 清晰定位 -> 慢漂移
  const lyricKeyframes: Keyframe[] = [
    {
      opacity: 0,
      transform: `${initTransform} translate(${slideInX}px, ${slideInY}px) scale(0.75)`,
      filter: "blur(12px)",
      offset: 0,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
    {
      opacity: 1,
      transform: `${initTransform} translate(0px, 0px) scale(1)`,
      filter: "blur(0px)",
      offset: settleOffset,
      easing: "linear",  // 漂移阶段使用线性缓动，保持匀速移动
    },
    {
      opacity: 1,
      transform: `${initTransform} translate(${driftX * 0.9}px, ${driftY * 0.9}px)`,
      filter: "blur(0px)",
      offset: 1,
      easing: "linear",
    },
  ];

  const lyricAnim = lyricEl.animate(lyricKeyframes, {
    duration: totalMs,
    fill: "both",
  });
  animations.push(lyricAnim);

  // 线段动画：与歌词同节奏，滑入效果
  segRefs.value.forEach((el, idx) => {
    const stagger = Math.min(80, idx * 35);
    // 每条线段有自己的滑入方向（基于漂移方向，距离递增）
    const segSlideX = slideInX * (0.7 + idx * 0.15);
    const segSlideY = slideInY * (0.7 + idx * 0.15);

    const segKeyframes: Keyframe[] = [
      {
        opacity: 0,
        transform: `${el.style.transform} translate(${segSlideX}px, ${segSlideY}px) scaleX(0.4)`,
        filter: "blur(6px)",
        offset: 0,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      {
        opacity: props.lineOpacity,
        transform: `${el.style.transform} translate(0px, 0px) scaleX(1)`,
        filter: "blur(0px)",
        offset: settleOffset,
        easing: "linear",  // 漂移阶段使用线性缓动，保持匀速移动
      },
      {
        opacity: props.lineOpacity,
        transform: `${el.style.transform} translate(${driftX * 0.9}px, ${driftY * 0.9}px)`,
        filter: "blur(0px)",
        offset: 1,
        easing: "linear",
      },
    ];

    const anim = el.animate(segKeyframes, {
      duration: totalMs,
      delay: stagger,
      fill: "both",
    });
    animations.push(anim);
  });

  // 默认先暂停，等 play() 再启动
  pauseAll();
}

/** ---------- 暴露控制方法 ---------- */
function play() {
  // 如果 master 不存在（首次未创建），先创建当前句
  if (!master) {
    showIndex(currentIndex.value, { keepPlayState: false }).then(() => playAll());
    return;
  }
  playAll();
}

function pause() {
  pauseAll();
}

function toggle() {
  playing.value ? pause() : play();
}

function next() {
  const i = currentIndex.value >= props.lyrics.length - 1 ? (props.loop ? 0 : currentIndex.value) : currentIndex.value + 1;
  showIndex(i);
}

function prev() {
  const i = currentIndex.value <= 0 ? (props.loop ? props.lyrics.length - 1 : 0) : currentIndex.value - 1;
  showIndex(i);
}

function seek(i: number) {
  showIndex(i);
}

defineExpose({
  play,
  pause,
  toggle,
  next,
  prev,
  seek,
  get playing() {
    return playing.value;
  },
  get index() {
    return currentIndex.value;
  },
});

/** ---------- 样式 ---------- */
const wrapStyle = computed(() => ({
  width: props.width,
  height: props.height,
  background: props.background,
}));

const lyricStyle = computed(() => ({
  fontSize: props.fontSize,
  color: props.color,
  fontFamily: props.fontFamily,
}));

/** ---------- 生命周期 ---------- */
onMounted(() => {
  updateSize();
  if (wrapRef.value) {
    ro = new ResizeObserver(() => updateSize());
    ro.observe(wrapRef.value);
  }

  if (props.pauseOnHover && wrapRef.value) {
    wrapRef.value.addEventListener("mouseenter", pause);
    wrapRef.value.addEventListener("mouseleave", play);
  }

  // 初始化显示第一句（先渲染出组，但默认暂停）
  showIndex(currentIndex.value, { keepPlayState: false }).then(() => {
    if (props.autoplay) play();
  });
});

onBeforeUnmount(() => {
  cancelAll();
  ro?.disconnect();
  ro = null;

  if (props.pauseOnHover && wrapRef.value) {
    wrapRef.value.removeEventListener("mouseenter", pause);
    wrapRef.value.removeEventListener("mouseleave", play);
  }
});

/** ---------- 受控 index 变化时同步 ---------- */
watch(
  () => props.modelValue,
  (v) => {
    if (typeof v === "number") {
      showIndex(v);
    }
  }
);
</script>

<style scoped>
.dl-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
}

.dl-group {
  position: absolute;
  inset: 0;
}

.dl-lyric {
  position: absolute;
  left: 0;
  top: 0;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 8px 24px rgba(0,0,0,0.35);
  user-select: none;
  will-change: transform, opacity;
  white-space: pre-wrap;
  max-width: 92%;
}

.dl-seg {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 999px;
  will-change: transform, opacity;
  transform-origin: center center;
  filter: drop-shadow(0 6px 16px rgba(0,0,0,0.22));
}
</style>
