<template>
  <div class="app-container">
    <SideNav />
    <DocContent />
  </div>
</template>

<script setup lang="ts">
import SideNav from "./components/SideNav.vue";
import DocContent from "./components/DocContent.vue";
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}
</style>
