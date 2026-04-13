import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const KEYS = {
  // 映射表
  MAPPING_BASE_URL: 'teable_base_url',
  MAPPING_TABLE_ID: 'teable_table_id',
  MAPPING_TOKEN: 'teable_token',
  // 用户表（可独立配置，不填则复用映射表配置）
  USERS_BASE_URL: 'teable_users_base_url',
  USERS_TABLE_ID: 'teable_users_table_id',
  USERS_TOKEN: 'teable_users_token',
}

export const useSettingsStore = defineStore('settings', () => {
  // 映射表配置
  const baseUrl = ref(localStorage.getItem(KEYS.MAPPING_BASE_URL) || '')
  const tableId = ref(localStorage.getItem(KEYS.MAPPING_TABLE_ID) || '')
  const token = ref(localStorage.getItem(KEYS.MAPPING_TOKEN) || '')

  // 用户表配置（为空则继承映射表配置）
  const usersBaseUrl = ref(localStorage.getItem(KEYS.USERS_BASE_URL) || '')
  const usersTableId = ref(localStorage.getItem(KEYS.USERS_TABLE_ID) || '')
  const usersToken = ref(localStorage.getItem(KEYS.USERS_TOKEN) || '')

  // 实际生效的用户表连接（回退到映射表配置）
  const effectiveUsersBaseUrl = computed(() => usersBaseUrl.value || baseUrl.value)
  const effectiveUsersToken = computed(() => usersToken.value || token.value)

  const isConfigured = computed(
    () => !!baseUrl.value && !!tableId.value && !!token.value
  )

  function save(values: {
    baseUrl: string
    tableId: string
    token: string
    usersBaseUrl?: string
    usersTableId?: string
    usersToken?: string
  }) {
    baseUrl.value = values.baseUrl.trim()
    tableId.value = values.tableId.trim()
    token.value = values.token.trim()
    usersBaseUrl.value = (values.usersBaseUrl || '').trim()
    usersTableId.value = (values.usersTableId || '').trim()
    usersToken.value = (values.usersToken || '').trim()

    localStorage.setItem(KEYS.MAPPING_BASE_URL, baseUrl.value)
    localStorage.setItem(KEYS.MAPPING_TABLE_ID, tableId.value)
    localStorage.setItem(KEYS.MAPPING_TOKEN, token.value)
    localStorage.setItem(KEYS.USERS_BASE_URL, usersBaseUrl.value)
    localStorage.setItem(KEYS.USERS_TABLE_ID, usersTableId.value)
    localStorage.setItem(KEYS.USERS_TOKEN, usersToken.value)
  }

  function clear() {
    baseUrl.value = ''
    tableId.value = ''
    token.value = ''
    usersBaseUrl.value = ''
    usersTableId.value = ''
    usersToken.value = ''
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  }

  return {
    baseUrl, tableId, token,
    usersBaseUrl, usersTableId, usersToken,
    effectiveUsersBaseUrl, effectiveUsersToken,
    isConfigured, save, clear,
  }
})
