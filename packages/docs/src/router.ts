import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/components/button'
  },
  {
    path: '/components',
    name: 'Components',
    redirect: '/components/button',
    children: [
      {
        path: 'button',
        name: 'Button',
        component: () => import('./pages/button/index.md')
      },
      {
        path: 'line-lyric',
        name: 'LineLyric',
        component: () => import('./pages/line-lyric/index.md')
      },
    ]
  },
  {
    path: '/play',
    name: 'Playground',
    component: () => import('./pages/play/index.vue')
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
