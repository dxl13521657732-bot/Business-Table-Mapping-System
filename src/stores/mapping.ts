import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MappingRecord, MappingFields } from '@/types/mapping'
import {
  fetchAllRecords,
  createRecords,
  updateRecord,
  deleteRecords,
} from '@/api/teable'
import { message } from 'ant-design-vue'

export const useMappingStore = defineStore('mapping', () => {
  const allRecords = ref<MappingRecord[]>([])
  const loading = ref(false)
  const searchKeyword = ref('')

  const filteredRecords = computed(() => {
    const kw = searchKeyword.value.trim().toLowerCase()
    if (!kw) return allRecords.value
    return allRecords.value.filter((r) => {
      const f = r.fields
      return (
        f.业务系统名称?.toLowerCase().includes(kw) ||
        f.模块功能名称?.toLowerCase().includes(kw) ||
        f.数据库名称?.toLowerCase().includes(kw) ||
        f.底层表名?.toLowerCase().includes(kw) ||
        f.描述用途?.toLowerCase().includes(kw) ||
        f.数仓表类型?.toLowerCase().includes(kw) ||
        f.数仓数据表名?.toLowerCase().includes(kw)
      )
    })
  })

  async function fetchAll() {
    loading.value = true
    try {
      allRecords.value = await fetchAllRecords()
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '加载数据失败')
    } finally {
      loading.value = false
    }
  }

  async function createOne(fields: Partial<MappingFields>) {
    const created = await createRecords([fields])
    allRecords.value.unshift(...created)
  }

  async function updateOne(id: string, fields: Partial<MappingFields>) {
    await updateRecord(id, fields)
    const idx = allRecords.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      allRecords.value[idx] = {
        ...allRecords.value[idx],
        fields: { ...allRecords.value[idx].fields, ...fields },
      }
    }
  }

  async function deleteOne(id: string) {
    await deleteRecords([id])
    allRecords.value = allRecords.value.filter((r) => r.id !== id)
  }

  async function batchCreate(fieldsList: Partial<MappingFields>[]) {
    const batchSize = 10
    const created: MappingRecord[] = []
    for (let i = 0; i < fieldsList.length; i += batchSize) {
      const batch = fieldsList.slice(i, i + batchSize)
      const res = await createRecords(batch)
      created.push(...res)
    }
    allRecords.value.unshift(...created)
    return created.length
  }

  return {
    allRecords,
    loading,
    searchKeyword,
    filteredRecords,
    fetchAll,
    createOne,
    updateOne,
    deleteOne,
    batchCreate,
  }
})
