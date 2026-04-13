<template>
  <a-modal
    :open="open"
    title="Teable 连接设置"
    :mask-closable="false"
    :closable="canClose"
    @cancel="handleCancel"
    @ok="handleSave"
    ok-text="保存"
    cancel-text="取消"
    width="520px"
  >
    <a-alert
      v-if="!canClose"
      type="info"
      show-icon
      message="首次使用，请先配置 Teable 连接信息"
      style="margin-bottom: 16px"
    />
    <a-form :model="form" layout="vertical" :rules="rules" ref="formRef">
      <a-form-item label="Teable Base URL" name="baseUrl">
        <a-input
          v-model:value="form.baseUrl"
          placeholder="https://app.teable.io/api"
          allow-clear
        />
        <div style="color: #888; font-size: 12px; margin-top: 4px">
          Teable 服务地址，末尾加 /api，如 https://app.teable.io/api
        </div>
      </a-form-item>
      <a-form-item label="Table ID" name="tableId">
        <a-input
          v-model:value="form.tableId"
          placeholder="tblXXXXXXXXXXXX"
          allow-clear
        />
        <div style="color: #888; font-size: 12px; margin-top: 4px">
          在 Teable 表格 URL 中找到，格式如 tblXXXXXXXXXX
        </div>
      </a-form-item>
      <a-form-item label="API Token" name="token">
        <a-input-password
          v-model:value="form.token"
          placeholder="请输入 API Token"
          allow-clear
        />
        <div style="color: #888; font-size: 12px; margin-top: 4px">
          在 Teable 个人设置 → API Token 中生成
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { message } from 'ant-design-vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved'): void
}>()

const settingsStore = useSettingsStore()
const canClose = ref(settingsStore.isConfigured)
const formRef = ref()

const form = reactive({
  baseUrl: settingsStore.baseUrl,
  tableId: settingsStore.tableId,
  token: settingsStore.token,
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      form.baseUrl = settingsStore.baseUrl
      form.tableId = settingsStore.tableId
      form.token = settingsStore.token
      canClose.value = settingsStore.isConfigured
    }
  }
)

const rules = {
  baseUrl: [{ required: true, message: '请输入 Teable Base URL' }],
  tableId: [{ required: true, message: '请输入 Table ID' }],
  token: [{ required: true, message: '请输入 API Token' }],
}

async function handleSave() {
  try {
    await formRef.value.validate()
    settingsStore.save({
      baseUrl: form.baseUrl,
      tableId: form.tableId,
      token: form.token,
    })
    message.success('设置已保存')
    emit('update:open', false)
    emit('saved')
  } catch {
    // 表单校验失败
  }
}

function handleCancel() {
  if (canClose.value) {
    emit('update:open', false)
  }
}
</script>
