import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const KEYS = {
  BASE_URL: 'teable_base_url',
  TABLE_ID: 'teable_table_id',
  TOKEN: 'teable_token',
  USERS_TABLE_ID: 'teable_users_table_id',
}

export const useSettingsStore = defineStore('settings', () => {
  const baseUrl = ref(localStorage.getItem(KEYS.BASE_URL) || '')
  const tableId = ref(localStorage.getItem(KEYS.TABLE_ID) || '')
  const token = ref(localStorage.getItem(KEYS.TOKEN) || '')
  const usersTableId = ref(localStorage.getItem(KEYS.USERS_TABLE_ID) || '')

  const isConfigured = computed(
    () => !!baseUrl.value && !!tableId.value && !!token.value
  )

  function save(values: { baseUrl: string; tableId: string; token: string; usersTableId?: string }) {
    baseUrl.value = values.baseUrl.trim()
    tableId.value = values.tableId.trim()
    token.value = values.token.trim()
    usersTableId.value = (values.usersTableId || '').trim()
    localStorage.setItem(KEYS.BASE_URL, baseUrl.value)
    localStorage.setItem(KEYS.TABLE_ID, tableId.value)
    localStorage.setItem(KEYS.TOKEN, token.value)
    localStorage.setItem(KEYS.USERS_TABLE_ID, usersTableId.value)
  }

  function clear() {
    baseUrl.value = ''
    tableId.value = ''
    token.value = ''
    usersTableId.value = ''
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  }

  return { baseUrl, tableId, token, usersTableId, isConfigured, save, clear }
})
