<template>
  <div class="mapping-view">
    <!-- 顶栏 -->
    <div class="header">
      <div class="header-title">
        <TableOutlined style="font-size: 20px; color: #1677ff; margin-right: 8px" />
        <span>业务表映射系统</span>
      </div>
      <div class="header-actions">
        <a-tooltip title="Teable 连接设置">
          <a-button
            type="text"
            :icon="h(SettingOutlined)"
            @click="settingsOpen = true"
          />
        </a-tooltip>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="content">
      <MappingTable
        @add="handleAdd"
        @edit="handleEdit"
        @import="importOpen = true"
      />
    </div>

    <!-- 设置弹窗 -->
    <SettingsModal
      v-model:open="settingsOpen"
      @saved="handleSettingsSaved"
    />

    <!-- 新增/编辑弹窗 -->
    <MappingFormModal
      v-model:open="formOpen"
      :record="editingRecord"
      @save="handleSave"
    />

    <!-- 导入弹窗 -->
    <ImportModal
      v-model:open="importOpen"
      @imported="handleImported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { SettingOutlined, TableOutlined } from '@ant-design/icons-vue'
import { useSettingsStore } from '@/stores/settings'
import { useMappingStore } from '@/stores/mapping'
import MappingTable from '@/components/MappingTable.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import MappingFormModal from '@/components/MappingFormModal.vue'
import ImportModal from '@/components/ImportModal.vue'
import type { MappingRecord, MappingFields } from '@/types/mapping'
import { message } from 'ant-design-vue'

const settingsStore = useSettingsStore()
const mappingStore = useMappingStore()

const settingsOpen = ref(false)
const formOpen = ref(false)
const importOpen = ref(false)
const editingRecord = ref<MappingRecord | null>(null)

onMounted(() => {
  if (!settingsStore.isConfigured) {
    settingsOpen.value = true
  } else {
    mappingStore.fetchAll()
  }
})

function handleAdd() {
  editingRecord.value = null
  formOpen.value = true
}

function handleEdit(record: MappingRecord) {
  editingRecord.value = record
  formOpen.value = true
}

async function handleSave(fields: Partial<MappingFields>) {
  try {
    if (editingRecord.value) {
      await mappingStore.updateOne(editingRecord.value.id, fields)
      message.success('更新成功')
    } else {
      await mappingStore.createOne(fields)
      message.success('新增成功')
    }
    formOpen.value = false
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : '操作失败')
  }
}

function handleSettingsSaved() {
  mappingStore.fetchAll()
}

function handleImported() {
  // batchCreate 已乐观更新，无需重新拉取
  message.success('导入完成')
}
</script>

<style scoped>
.mapping-view {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
}

.content {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  background: #fff;
  margin-top: 16px;
  border-radius: 8px;
}
</style>
