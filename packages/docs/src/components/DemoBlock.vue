<template>
  <div class="demo-block">
    <div class="demo-preview">
      <slot />
    </div>
    <div class="demo-code" v-if="$slots.code">
      <div class="code-header">
        <span class="code-lang">Vue</span>
        <button class="copy-btn" @click="copyCode">
          {{ copied ? "已复制" : "复制代码" }}
        </button>
      </div>
      <pre class="code-content"><code><slot name="code" /></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const copied = ref(false);

const copyCode = async () => {
  const codeSlot = document.querySelector(".code-content code");
  if (codeSlot) {
    await navigator.clipboard.writeText(codeSlot.textContent || "");
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};
</script>

<style scoped>
.demo-block {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 24px;
  overflow: hidden;
}

.demo-preview {
  padding: 40px 20px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.demo-code {
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #ebeef5;
}

.code-lang {
  font-size: 12px;
  color: #909399;
}

.copy-btn {
  font-size: 12px;
  color: #909399;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  color: #409eff;
  background: #ecf5ff;
}

.code-content {
  padding: 16px;
  margin: 0;
  font-size: 13px;
  font-family: "SF Mono", Consolas, Monaco, monospace;
  color: #606266;
  overflow-x: auto;
  line-height: 1.6;
}
</style>
