import { createRouter, createWebHashHistory } from 'vue-router'
import MappingView from '@/views/MappingView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        const raw = localStorage.getItem('auth_session')
        try {
          if (raw) {
            const s = JSON.parse(raw)
            if (s.expiry > Date.now()) return '/mapping'
          }
        } catch {
          // ignore
        }
        return '/login'
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/mapping',
      name: 'mapping',
      component: MappingView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true

  const raw = localStorage.getItem('auth_session')
  try {
    if (raw) {
      const s = JSON.parse(raw)
      if (s.expiry > Date.now()) return true
    }
  } catch {
    // ignore
  }
  return { name: 'login' }
})

export default router
