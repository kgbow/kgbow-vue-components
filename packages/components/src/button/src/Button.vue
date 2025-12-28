<template>
  <button
    :class="[
      'kg-button',
      `kg-button--${type}`,
      { 'kg-button--disabled': disabled },
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: "primary" | "success" | "warning" | "danger" | "default";
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: "default",
  disabled: false,
});
</script>

<style scoped>
.kg-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.kg-button--primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.kg-button--success {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

.kg-button--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

.kg-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

.kg-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.kg-button:not(.kg-button--disabled):hover {
  opacity: 0.8;
}
</style>
