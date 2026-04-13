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
    width="560px"
    :body-style="{ maxHeight: '75vh', overflowY: 'auto', padding: '24px' }"
  >
    <a-alert
      v-if="!canClose"
      type="info"
      show-icon
      message="首次使用，请先配置 Teable 连接信息"
      style="margin-bottom: 16px"
    />

    <a-form :model="form" layout="vertical" :rules="rules" ref="formRef">
      <!-- 基础连接 -->
      <a-form-item label="Teable Base URL" name="baseUrl">
        <a-input v-model:value="form.baseUrl" placeholder="https://app.teable.io/api" allow-clear />
        <div class="field-hint">Teable 服务地址，末尾加 /api</div>
      </a-form-item>

      <a-form-item label="API Token" name="token">
        <a-input-password v-model:value="form.token" placeholder="请输入 API Token" allow-clear />
        <div class="field-hint">在 Teable 个人设置 → API Token 中生成</div>
      </a-form-item>

      <a-divider style="margin: 8px 0 16px">表格配置</a-divider>

      <!-- 映射表 -->
      <a-form-item name="tableId">
        <template #label>
          <span>映射表 ID</span>
          <a-tag color="blue" style="margin-left: 8px; font-size: 11px">业务表映射数据</a-tag>
        </template>
        <a-input v-model:value="form.tableId" placeholder="tblXXXXXXXX" allow-clear />
        <div class="field-hint">存放业务系统与底层表映射关系的 Teable 表</div>
        <!-- 映射表检测结果 -->
        <div v-if="mappingResult" class="test-result" :class="mappingResult.ok ? 'ok' : 'fail'">
          <span class="icon">{{ mappingResult.ok ? '✓' : '✗' }}</span>
          <span class="msg">{{ mappingResult.msg }}</span>
          <div v-if="mappingResult.fields" class="fields">
            字段：{{ mappingResult.fields.join(' · ') }}
          </div>
        </div>
      </a-form-item>

      <!-- 用户表 -->
      <a-form-item name="usersTableId">
        <template #label>
          <span>用户表 ID</span>
          <a-tag color="purple" style="margin-left: 8px; font-size: 11px">登录认证</a-tag>
        </template>
        <a-input
          v-model:value="form.usersTableId"
          placeholder="tblXXXXXXXX（选填）"
          allow-clear
        />
        <div class="field-hint">存放登录账号的 Teable 表，需含：用户名、密码、姓名字段</div>
        <!-- 用户表检测结果 -->
        <div v-if="usersResult" class="test-result" :class="usersResult.ok ? 'ok' : 'fail'">
          <span class="icon">{{ usersResult.ok ? '✓' : '✗' }}</span>
          <span class="msg">{{ usersResult.msg }}</span>
          <div v-if="usersResult.fields" class="fields">
            字段：{{ usersResult.fields.join(' · ') }}
          </div>
        </div>
      </a-form-item>

      <!-- 检测按钮 -->
      <a-form-item>
        <a-button :loading="testing" type="default" @click="handleTest" block>
          {{ testing ? '检测中...' : '一键检测两张表连接' }}
        </a-button>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { message } from 'ant-design-vue'
import axios from 'axios'

interface TestResult {
  ok: boolean
  msg: string
  fields?: string[]
}

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved'): void
}>()

const settingsStore = useSettingsStore()
const canClose = ref(settingsStore.isConfigured)
const formRef = ref()
const testing = ref(false)
const mappingResult = ref<TestResult | null>(null)
const usersResult = ref<TestResult | null>(null)

const form = reactive({
  baseUrl: settingsStore.baseUrl,
  tableId: settingsStore.tableId,
  token: settingsStore.token,
  usersTableId: settingsStore.usersTableId,
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      form.baseUrl = settingsStore.baseUrl
      form.tableId = settingsStore.tableId
      form.token = settingsStore.token
      form.usersTableId = settingsStore.usersTableId
      canClose.value = settingsStore.isConfigured
      mappingResult.value = null
      usersResult.value = null
    }
  }
)

const rules = {
  baseUrl: [{ required: true, message: '请输入 Teable Base URL' }],
  tableId: [{ required: true, message: '请输入映射表 ID' }],
  token: [{ required: true, message: '请输入 API Token' }],
}

async function testTable(tableId: string): Promise<TestResult> {
  if (!tableId) return { ok: false, msg: '未填写' }
  const base = form.baseUrl.replace(/\/$/, '')
  const headers = { Authorization: `Bearer ${form.token}` }
  try {
    // 查字段
    const fieldsRes = await axios.get(`${base}/table/${tableId}/field`, { headers })
    const fieldNames: string[] = (fieldsRes.data ?? []).map(
      (f: { name: string }) => f.name
    )
    // 查记录数
    const recordRes = await axios.get(`${base}/table/${tableId}/record`, {
      params: { take: 1 },
      headers,
    })
    const total = recordRes.data?.total ?? '?'
    return {
      ok: true,
      msg: `连接成功（共 ${total} 条记录）`,
      fields: fieldNames,
    }
  } catch (e: unknown) {
    const status = (e as { response?: { status: number } })?.response?.status
    if (status === 404) return { ok: false, msg: '404：表不存在，请检查 Table ID' }
    if (status === 401 || status === 403) return { ok: false, msg: `${status}：Token 无效或无权限` }
    return { ok: false, msg: `连接失败（${status ?? '网络错误'}）` }
  }
}

async function handleTest() {
  if (!form.baseUrl || !form.token) {
    message.warning('请先填写 Base URL 和 Token')
    return
  }
  testing.value = true
  mappingResult.value = null
  usersResult.value = null
  try {
    const [mr, ur] = await Promise.all([
      form.tableId ? testTable(form.tableId) : Promise.resolve(null),
      form.usersTableId ? testTable(form.usersTableId) : Promise.resolve(null),
    ])
    mappingResult.value = mr ?? { ok: false, msg: '未填写映射表 ID' }
    usersResult.value = ur ?? { ok: false, msg: '未填写用户表 ID（登录功能不可用）' }
  } finally {
    testing.value = false
  }
}

async function handleSave() {
  try {
    await formRef.value.validate()
    settingsStore.save({
      baseUrl: form.baseUrl,
      tableId: form.tableId,
      token: form.token,
      usersTableId: form.usersTableId,
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

<style scoped>
.field-hint {
  color: #888;
  font-size: 12px;
  margin-top: 4px;
}

.test-result {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.test-result.ok {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.test-result.fail {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
}

.test-result .icon {
  font-weight: bold;
  margin-right: 6px;
}

.test-result .fields {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.8;
  word-break: break-all;
}
</style>
