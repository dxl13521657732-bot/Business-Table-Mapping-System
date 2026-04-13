import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 非敏感配置直接写死；Token 敏感，从 GitHub Actions Secret 注入
const ENV = {
  BASE_URL:       'https://yach-teable.zhiyinlou.com/api',
  TABLE_ID:       'tblhTWtNkHUh3zmvHvI',
  TOKEN:          import.meta.env.VITE_TEABLE_TOKEN       || '',  // 映射表 Token
  USERS_BASE_URL: '',
  USERS_TABLE_ID: 'tblr6V3PuQB87EzLMiR',
  USERS_TOKEN:    import.meta.env.VITE_TEABLE_USERS_TOKEN || '',  // 用户表 Token（不填则复用映射表 Token）
}

const KEYS = {
  MAPPING_BASE_URL: 'teable_base_url',
  MAPPING_TABLE_ID: 'teable_table_id',
  MAPPING_TOKEN:    'teable_token',
  USERS_BASE_URL:   'teable_users_base_url',
  USERS_TABLE_ID:   'teable_users_table_id',
  USERS_TOKEN:      'teable_users_token',
}

// localStorage 优先（管理员手动修改），否则回退到构建时环境变量
function get(key: string, envVal: string) {
  return localStorage.getItem(key) || envVal
}

export const useSettingsStore = defineStore('settings', () => {
  const baseUrl     = ref(get(KEYS.MAPPING_BASE_URL, ENV.BASE_URL))
  const tableId     = ref(get(KEYS.MAPPING_TABLE_ID, ENV.TABLE_ID))
  const token       = ref(get(KEYS.MAPPING_TOKEN,    ENV.TOKEN))
  const usersBaseUrl = ref(get(KEYS.USERS_BASE_URL,  ENV.USERS_BASE_URL))
  const usersTableId = ref(get(KEYS.USERS_TABLE_ID,  ENV.USERS_TABLE_ID))
  const usersToken   = ref(get(KEYS.USERS_TOKEN,     ENV.USERS_TOKEN))

  const effectiveUsersBaseUrl = computed(() => usersBaseUrl.value || baseUrl.value)
  const effectiveUsersToken   = computed(() => usersToken.value   || token.value)

  const isConfigured = computed(
    () => !!baseUrl.value && !!tableId.value && !!token.value
  )

  function save(values: {
    baseUrl: string; tableId: string; token: string
    usersBaseUrl?: string; usersTableId?: string; usersToken?: string
  }) {
    baseUrl.value      = values.baseUrl.trim()
    tableId.value      = values.tableId.trim()
    token.value        = values.token.trim()
    usersBaseUrl.value = (values.usersBaseUrl || '').trim()
    usersTableId.value = (values.usersTableId || '').trim()
    usersToken.value   = (values.usersToken   || '').trim()

    localStorage.setItem(KEYS.MAPPING_BASE_URL, baseUrl.value)
    localStorage.setItem(KEYS.MAPPING_TABLE_ID, tableId.value)
    localStorage.setItem(KEYS.MAPPING_TOKEN,    token.value)
    localStorage.setItem(KEYS.USERS_BASE_URL,   usersBaseUrl.value)
    localStorage.setItem(KEYS.USERS_TABLE_ID,   usersTableId.value)
    localStorage.setItem(KEYS.USERS_TOKEN,      usersToken.value)
  }

  function clear() {
    baseUrl.value = ''; tableId.value = ''; token.value = ''
    usersBaseUrl.value = ''; usersTableId.value = ''; usersToken.value = ''
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  }

  return {
    baseUrl, tableId, token,
    usersBaseUrl, usersTableId, usersToken,
    effectiveUsersBaseUrl, effectiveUsersToken,
    isConfigured, save, clear,
  }
})
