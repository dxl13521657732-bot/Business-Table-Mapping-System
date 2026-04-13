import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { queryUser } from '@/api/auth'

const SESSION_KEY = 'auth_session'

interface AuthSession {
  userId: string
  username: string
  displayName: string
  role: string
  expiry: number
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(loadSession())

  const isLoggedIn = computed(
    () => !!session.value && session.value.expiry > Date.now()
  )

  const currentUser = computed(() => session.value)

  const isAdmin = computed(() => session.value?.role === '管理员')

  async function login(username: string, password: string, remember: boolean): Promise<void> {
    const user = await queryUser(username)

    if (!user) {
      throw new Error('用户名不存在')
    }
    if (user.是否启用 === '禁用') {
      throw new Error('账号已被禁用，请联系管理员')
    }
    if (user.密码 !== password) {
      throw new Error('密码错误')
    }

    const expiry = Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000)
    const newSession: AuthSession = {
      userId: user.id,
      username: user.用户名,
      displayName: user.姓名 || user.用户名,
      role: user.角色 || '用户',
      expiry,
    }

    session.value = newSession
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
  }

  function logout() {
    session.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  function checkSession(): boolean {
    const s = loadSession()
    if (s && s.expiry > Date.now()) {
      session.value = s
      return true
    }
    session.value = null
    localStorage.removeItem(SESSION_KEY)
    return false
  }

  return { session, isLoggedIn, isAdmin, currentUser, login, logout, checkSession }
})

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s: AuthSession = JSON.parse(raw)
    if (s.expiry > Date.now()) return s
    localStorage.removeItem(SESSION_KEY)
    return null
  } catch {
    return null
  }
}
