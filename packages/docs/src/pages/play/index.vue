<template>
  <div class="play-container">
    <h2>音乐播放器 Demo</h2>
    
    <!-- 歌词显示区域 -->
    <div class="lyric-container">
      <LineLyric
        ref="lyricRef"
        v-model="currentLyricIndex"
        :lyrics="parsedLyrics"
        width="100%"
        height="100%"
        background="linear-gradient(135deg, rgba(30, 30, 60, 0.95), rgba(60, 30, 80, 0.9))"
        font-size="48px"
        font-family="'LXGW WenKai', system-ui, sans-serif"
        color="rgba(255, 255, 255, 0.95)"
        :line-width-min="4"
        :line-width-max="10"
        line-color="rgba(255, 255, 255, 0.5)"
        :seed="'guiqi-song'"
        :autoplay="false"
        :loop="false"
        :drift-speed="20"
        :rotate-deg-max="16"
        :entrance-ms="350"
      />
    </div>

    <!-- 音频控制区域 -->
    <div class="controls">
      <audio
        ref="audioRef"
        :src="musicUrl"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
      />
      
      <div class="control-row">
        <button class="control-btn" @click="togglePlay">
          {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
        </button>
        <button class="control-btn" @click="stop">⏹ 停止</button>
      </div>

      <div class="progress-row">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          class="progress-bar"
          :value="currentTime"
          :max="duration"
          @input="onSeek"
        />
        <span class="time">{{ formatTime(duration) }}</span>
      </div>

      <div class="volume-row">
        <span class="volume-icon">🔊</span>
        <input
          type="range"
          class="volume-bar"
          :value="volume"
          min="0"
          max="1"
          step="0.01"
          @input="onVolumeChange"
        />
        <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
      </div>

      <div class="info-row">
        <span>当前歌词索引: {{ currentLyricIndex }}</span>
        <span v-if="currentLyricText">「{{ currentLyricText }}」</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { LineLyric } from "@kgbow/components";
import musicUrl from "@/assets/music/归期-钱润玉.mp3";
import lrcContent from "@/assets/music/归期-钱润玉.lrc?raw";

// Refs
const audioRef = ref<HTMLAudioElement | null>(null);
const lyricRef = ref<InstanceType<typeof LineLyric> | null>(null);

// State
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const currentLyricIndex = ref(0);
const volume = ref(0.8);

// 解析 LRC 歌词文件
function parseLrc(lrcText: string) {
  const lines = lrcText.split('\n');
  const lyrics: { text: string; time: number }[] = [];
  
  // 正则匹配 [mm:ss.xx] 格式的时间戳
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
      
      // 提取歌词文本（去掉时间戳部分）
      const text = line.replace(timeRegex, '').trim();
      
      // 只添加有实际歌词内容的行（跳过元数据行，如作词、作曲等）
      // if (text && !text.includes(':') && time > 17000) {
      if (text) {
        lyrics.push({ text, time });
      }
    }
  }
  
  return lyrics;
}

// 解析后的歌词数据
const parsedLyrics = computed(() => parseLrc(lrcContent));

// 当前歌词文本
const currentLyricText = computed(() => {
  const lyric = parsedLyrics.value[currentLyricIndex.value];
  return lyric?.text || '';
});

// 根据当前播放时间更新歌词索引
function updateLyricIndex(timeMs: number) {
  const lyrics = parsedLyrics.value;
  
  // 找到当前时间对应的歌词索引
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (timeMs >= lyrics[i].time) {
      if (currentLyricIndex.value !== i) {
        currentLyricIndex.value = i;
      }
      return;
    }
  }
  
  // 如果时间在第一句歌词之前
  if (currentLyricIndex.value !== 0) {
    currentLyricIndex.value = 0;
  }
}

// 事件处理
function onTimeUpdate() {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
  duration.value = audioRef.value.duration || 0;
  
  // 更新歌词（转换为毫秒）
  updateLyricIndex(currentTime.value * 1000);
}

function onPlay() {
  isPlaying.value = true;
  lyricRef.value?.play();
}

function onPause() {
  isPlaying.value = false;
  lyricRef.value?.pause();
}

function onEnded() {
  isPlaying.value = false;
  currentLyricIndex.value = 0;
}

function togglePlay() {
  if (!audioRef.value) return;
  
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
}

function stop() {
  if (!audioRef.value) return;
  audioRef.value.pause();
  audioRef.value.currentTime = 0;
  currentTime.value = 0;
  currentLyricIndex.value = 0;
}

function onSeek(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!audioRef.value) return;
  audioRef.value.currentTime = parseFloat(target.value);
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function onVolumeChange(e: Event) {
  const target = e.target as HTMLInputElement;
  volume.value = parseFloat(target.value);
  if (audioRef.value) {
    audioRef.value.volume = volume.value;
  }
}

// 监听歌词索引变化，同步歌词组件
watch(currentLyricIndex, (newIndex) => {
  if (isPlaying.value) {
    lyricRef.value?.seek(newIndex);
  }
});

onMounted(() => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration || 0;
    audioRef.value.volume = volume.value;
  }
});
</script>

<style scoped>
.play-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.lyric-container {
  width: 100%;
  height: 800px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-bottom: 24px;
}

.controls {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.control-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.control-btn {
  padding: 10px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.control-btn:active {
  transform: translateY(0);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
}

.time {
  font-size: 14px;
  color: #666;
  min-width: 40px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #888;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.volume-icon {
  font-size: 18px;
}

.volume-bar {
  width: 120px;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
}

.volume-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #764ba2;
  border-radius: 50%;
  cursor: pointer;
}

.volume-value {
  font-size: 14px;
  color: #666;
  min-width: 40px;
}
</style>
