<template>
  <div class="mapping-view">
    <!-- 顶栏 -->
    <div class="header">
      <div class="header-left">
        <div class="header-logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.2)"/>
            <rect x="6" y="9" width="20" height="3" rx="1.5" fill="white"/>
            <rect x="6" y="15" width="20" height="3" rx="1.5" fill="white"/>
            <rect x="6" y="21" width="13" height="3" rx="1.5" fill="white"/>
          </svg>
        </div>
        <span class="header-title">业务表映射系统</span>
      </div>
      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">{{ userInitial }}</div>
          <span class="user-name">{{ displayName }}</span>
        </div>
        <a-divider type="vertical" style="background: rgba(255,255,255,0.3); height: 20px" />
        <a-tooltip title="系统设置">
          <a-button type="text" class="header-btn" @click="settingsOpen = true">
            <SettingOutlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="退出登录">
          <a-button type="text" class="header-btn" @click="handleLogout">
            <LogoutOutlined />
          </a-button>
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

    <!-- 弹窗 -->
    <SettingsModal v-model:open="settingsOpen" @saved="handleSettingsSaved" />
    <MappingFormModal v-model:open="formOpen" :record="editingRecord" @save="handleSave" />
    <ImportModal v-model:open="importOpen" @imported="handleImported" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons-vue'
import { useSettingsStore } from '@/stores/settings'
import { useMappingStore } from '@/stores/mapping'
import { useAuthStore } from '@/stores/auth'
import MappingTable from '@/components/MappingTable.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import MappingFormModal from '@/components/MappingFormModal.vue'
import ImportModal from '@/components/ImportModal.vue'
import type { MappingRecord, MappingFields } from '@/types/mapping'
import { message } from 'ant-design-vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const mappingStore = useMappingStore()
const authStore = useAuthStore()

const settingsOpen = ref(false)
const formOpen = ref(false)
const importOpen = ref(false)
const editingRecord = ref<MappingRecord | null>(null)

const displayName = computed(() => authStore.currentUser?.displayName || '用户')
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())

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
  message.success('导入完成')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.mapping-view {
  min-height: 100vh;
  background: var(--color-bg, #f0f4ff);
  display: flex;
  flex-direction: column;
}

/* 渐变 Header */
.header {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.25);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo svg {
  width: 32px;
  height: 32px;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
}

.user-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}

.header-btn {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 16px !important;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px !important;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

/* 主内容 */
.content {
  flex: 1;
  padding: 24px;
  max-width: 1500px;
  width: 100%;
  margin: 20px auto 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.08);
}
</style>
