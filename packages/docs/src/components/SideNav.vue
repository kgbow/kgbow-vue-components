<template>
  <aside class="side-nav">
    <div class="logo">
      <span class="logo-text">Kgbow UI</span>
      <span class="logo-version">v1.0.0</span>
    </div>
    <nav class="nav-menu">
      <div class="nav-group">
        <div class="nav-group-title">Development</div>
        <router-link to="/play" class="nav-item" active-class="active">
          Playground 调试
        </router-link>
      </div>
      <div class="nav-group">
        <div class="nav-group-title">Basic</div>
        <router-link
          to="/components/button"
          class="nav-item"
          active-class="active"
        >
          Button 按钮
        </router-link>
        <router-link
          to="/components/line-lyric"
          class="nav-item"
          active-class="active"
        >
          LineLyric 线条歌词
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts"></script>

<style scoped>
.side-nav {
  width: 240px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.logo-version {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
  padding: 2px 6px;
  background: #f4f4f5;
  border-radius: 4px;
}

.nav-menu {
  padding: 16px 0;
}

.nav-group-title {
  padding: 8px 20px;
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.nav-item {
  display: block;
  padding: 8px 20px 8px 30px;
  color: #606266;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  color: #409eff;
}

.nav-item.active {
  color: #409eff;
  background: #ecf5ff;
  border-right: 2px solid #409eff;
}
</style>
