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
    width="580px"
    :body-style="{ maxHeight: '78vh', overflowY: 'auto', padding: '24px' }"
  >
    <a-alert
      v-if="!canClose"
      type="info"
      show-icon
      message="首次使用，请先配置 Teable 连接信息"
      style="margin-bottom: 16px"
    />

    <a-form :model="form" layout="vertical" :rules="rules" ref="formRef">

      <!-- ───── 映射表配置 ───── -->
      <div class="section-title">
        <span class="dot blue"></span>
        映射表配置
        <span class="section-sub">（业务表映射数据）</span>
      </div>

      <a-form-item label="Base URL" name="baseUrl">
        <a-input v-model:value="form.baseUrl" placeholder="https://app.teable.io/api" allow-clear />
        <div class="field-hint">Teable 服务地址，末尾加 /api</div>
      </a-form-item>

      <a-form-item label="API Token" name="token">
        <a-input-password v-model:value="form.token" placeholder="请输入 API Token" allow-clear />
      </a-form-item>

      <a-form-item label="Table ID" name="tableId">
        <a-input v-model:value="form.tableId" placeholder="tblXXXXXXXX" allow-clear />
        <div class="field-hint">映射表的 Table ID，在 Teable URL 中获取</div>
      </a-form-item>

      <!-- 映射表检测结果 -->
      <div v-if="mappingResult" class="test-result" :class="mappingResult.ok ? 'ok' : 'fail'">
        <span class="icon">{{ mappingResult.ok ? '✓' : '✗' }}</span>
        <span class="msg">{{ mappingResult.msg }}</span>
        <div v-if="mappingResult.fields" class="fields">字段：{{ mappingResult.fields.join(' · ') }}</div>
      </div>

      <a-divider style="margin: 16px 0" />

      <!-- ───── 用户表配置 ───── -->
      <div class="section-title">
        <span class="dot purple"></span>
        用户表配置
        <span class="section-sub">（登录认证，可与映射表不同）</span>
      </div>

      <a-form-item label="Base URL">
        <a-input v-model:value="form.usersBaseUrl" placeholder="不填则与映射表相同" allow-clear />
        <div class="field-hint">用户表所在 Teable 服务地址，与映射表不同时才需填写</div>
      </a-form-item>

      <a-form-item label="API Token">
        <a-input-password v-model:value="form.usersToken" placeholder="不填则与映射表相同" allow-clear />
        <div class="field-hint">用户表的访问 Token，与映射表不同时才需填写</div>
      </a-form-item>

      <a-form-item label="Table ID">
        <a-input v-model:value="form.usersTableId" placeholder="tblXXXXXXXX（选填）" allow-clear />
        <div class="field-hint">需含字段：用户名、密码、姓名。不填则无法使用登录功能。</div>
      </a-form-item>

      <!-- 用户表检测结果 -->
      <div v-if="usersResult" class="test-result" :class="usersResult.ok ? 'ok' : 'fail'">
        <span class="icon">{{ usersResult.ok ? '✓' : '✗' }}</span>
        <span class="msg">{{ usersResult.msg }}</span>
        <div v-if="usersResult.fields" class="fields">字段：{{ usersResult.fields.join(' · ') }}</div>
      </div>

      <!-- 检测按钮 -->
      <a-form-item style="margin-top: 16px">
        <a-button :loading="testing" block @click="handleTest">
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
  usersBaseUrl: settingsStore.usersBaseUrl,
  usersTableId: settingsStore.usersTableId,
  usersToken: settingsStore.usersToken,
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      form.baseUrl = settingsStore.baseUrl
      form.tableId = settingsStore.tableId
      form.token = settingsStore.token
      form.usersBaseUrl = settingsStore.usersBaseUrl
      form.usersTableId = settingsStore.usersTableId
      form.usersToken = settingsStore.usersToken
      canClose.value = settingsStore.isConfigured
      mappingResult.value = null
      usersResult.value = null
    }
  }
)

const rules = {
  baseUrl: [{ required: true, message: '请输入映射表 Base URL' }],
  tableId: [{ required: true, message: '请输入映射表 Table ID' }],
  token: [{ required: true, message: '请输入映射表 API Token' }],
}

async function testTable(baseUrl: string, token: string, tableId: string): Promise<TestResult> {
  if (!tableId) return { ok: false, msg: '未填写 Table ID' }
  const base = baseUrl.replace(/\/$/, '')
  const headers = { Authorization: `Bearer ${token}` }
  try {
    const [fieldsRes, recordRes] = await Promise.all([
      axios.get(`${base}/table/${tableId}/field`, { headers }),
      axios.get(`${base}/table/${tableId}/record`, { params: { take: 1 }, headers }),
    ])
    const fieldNames: string[] = (fieldsRes.data ?? []).map((f: { name: string }) => f.name)
    return { ok: true, msg: `连接成功`, fields: fieldNames }
  } catch (e: unknown) {
    const status = (e as { response?: { status: number } })?.response?.status
    if (status === 404) return { ok: false, msg: '404：Table ID 不存在，请检查' }
    if (status === 401 || status === 403) return { ok: false, msg: `${status}：Token 无效或无权限` }
    return { ok: false, msg: `连接失败（${status ?? '网络错误'}）` }
  }
}

async function handleTest() {
  if (!form.baseUrl || !form.token) {
    message.warning('请先填写映射表 Base URL 和 Token')
    return
  }
  testing.value = true
  mappingResult.value = null
  usersResult.value = null
  try {
    const usersBase = form.usersBaseUrl || form.baseUrl
    const usersToken = form.usersToken || form.token
    const [mr, ur] = await Promise.all([
      testTable(form.baseUrl, form.token, form.tableId),
      form.usersTableId
        ? testTable(usersBase, usersToken, form.usersTableId)
        : Promise.resolve<TestResult>({ ok: false, msg: '未填写用户表 ID（登录功能不可用）' }),
    ])
    mappingResult.value = mr
    usersResult.value = ur
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
      usersBaseUrl: form.usersBaseUrl,
      usersTableId: form.usersTableId,
      usersToken: form.usersToken,
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
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.blue { background: #4f46e5; }
.dot.purple { background: #9333ea; }

.section-sub {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}

.field-hint {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 4px;
}

.test-result {
  margin: -4px 0 16px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}
.test-result.ok  { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.test-result.fail { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }
.test-result .icon { font-weight: bold; margin-right: 6px; }
.test-result .fields { margin-top: 4px; font-size: 12px; opacity: 0.8; word-break: break-all; }
</style>
