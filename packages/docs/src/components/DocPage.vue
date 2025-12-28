<template>
  <div class="doc-page">
    <div class="markdown-body">
      <h1 v-if="frontmatter?.title">{{ frontmatter.title }}</h1>
      <p class="desc" v-if="frontmatter?.description">
        {{ frontmatter.description }}
      </p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  frontmatter?: {
    title?: string;
    description?: string;
  };
}>();
</script>

<style scoped>
.doc-page {
  max-width: 800px;
}

.markdown-body {
  margin-bottom: 32px;
}

.markdown-body h1 {
  font-size: 30px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.desc {
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
}
</style>
