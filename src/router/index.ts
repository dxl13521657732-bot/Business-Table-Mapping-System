import { createRouter, createWebHashHistory } from 'vue-router'
import MappingView from '@/views/MappingView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/mapping',
    },
    {
      path: '/mapping',
      name: 'mapping',
      component: MappingView,
    },
  ],
})

export default router
