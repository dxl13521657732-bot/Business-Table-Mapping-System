<template>
  <a-modal
    :open="open"
    title="Excel 批量导入"
    @cancel="handleCancel"
    :footer="null"
    width="900px"
  >
    <!-- Step 1: 文件选择 -->
    <div v-if="step === 'upload'">
      <a-upload-dragger
        :before-upload="handleFileSelect"
        accept=".xlsx,.xls"
        :show-upload-list="false"
        :multiple="false"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽 Excel 文件到此区域</p>
        <p class="ant-upload-hint">支持 .xlsx / .xls 格式</p>
      </a-upload-dragger>
      <a-divider />
      <div style="color: #666; font-size: 13px">
        <strong>Excel 列名支持以下格式（中英文均可）：</strong>
        <a-row :gutter="8" style="margin-top: 8px">
          <a-col :span="8" v-for="col in columnHints" :key="col.field">
            <a-tag>{{ col.examples }}</a-tag> → {{ col.field }}
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- Step 2: 预览 -->
    <div v-else-if="step === 'preview'">
      <a-alert
        v-if="errorCount > 0"
        type="warning"
        show-icon
        :message="`发现 ${errorCount} 行有错误（已标红），这些行将跳过导入`"
        style="margin-bottom: 12px"
      />
      <a-alert
        type="info"
        show-icon
        :message="`共 ${rows.length} 行，已选择 ${selectedCount} 行有效数据`"
        style="margin-bottom: 12px"
      />
      <div style="max-height: 400px; overflow-y: auto">
        <a-table
          :data-source="rows"
          :columns="previewColumns"
          :pagination="false"
          size="small"
          :row-class-name="(r: ExcelRow) => (r._errors?.length ? 'row-error' : '')"
          row-key="__idx"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'select'">
              <a-checkbox
                :checked="record._selected"
                :disabled="!!record._errors?.length"
                @change="(e: Event) => record._selected = (e.target as HTMLInputElement).checked"
              />
            </template>
            <template v-if="column.key === '_errors'">
              <a-tooltip v-if="record._errors?.length" :title="record._errors.join('; ')">
                <WarningOutlined style="color: #ff4d4f" />
              </a-tooltip>
            </template>
          </template>
        </a-table>
      </div>
      <div style="margin-top: 16px; text-align: right">
        <a-space>
          <a-button @click="step = 'upload'">重新选择</a-button>
          <a-button
            type="primary"
            :disabled="selectedCount === 0"
            :loading="importing"
            @click="handleImport"
          >
            导入 {{ selectedCount }} 条
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- Step 3: 进度 -->
    <div v-else-if="step === 'progress'" style="text-align: center; padding: 32px">
      <a-progress
        type="circle"
        :percent="importProgress"
        :status="importProgress === 100 ? 'success' : 'active'"
      />
      <div style="margin-top: 16px; font-size: 16px">
        {{ importProgress === 100 ? '导入完成！' : `正在导入 ${importedCount} / ${totalToImport} 条...` }}
      </div>
      <a-button
        v-if="importProgress === 100"
        type="primary"
        style="margin-top: 16px"
        @click="handleFinish"
      >
        完成
      </a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { InboxOutlined, WarningOutlined } from '@ant-design/icons-vue'
import { useExcelImport } from '@/composables/useExcelImport'
import { useMappingStore } from '@/stores/mapping'
import type { ExcelRow } from '@/types/mapping'
import { message } from 'ant-design-vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'imported'): void
}>()

const { rows, parseFile, toMappingFields, reset } = useExcelImport()
const mappingStore = useMappingStore()

const step = ref<'upload' | 'preview' | 'progress'>('upload')
const importing = ref(false)
const importedCount = ref(0)
const totalToImport = ref(0)
const importProgress = computed(() =>
  totalToImport.value === 0
    ? 0
    : Math.round((importedCount.value / totalToImport.value) * 100)
)

const errorCount = computed(() => rows.value.filter((r) => r._errors?.length).length)
const selectedCount = computed(() => rows.value.filter((r) => r._selected && !r._errors?.length).length)

const columnHints = [
  { field: '业务系统名称', examples: '业务系统 / system' },
  { field: '模块功能名称', examples: '模块 / module' },
  { field: '数据库名称', examples: '数据库 / database' },
  { field: '底层表名', examples: '底层表名 / table_name' },
  { field: '数据层级', examples: '数据层级 / layer' },
  { field: '描述用途', examples: '描述 / description' },
  { field: '负责人', examples: '负责人 / owner' },
]

const previewColumns = [
  { title: '', key: 'select', width: 40 },
  { title: '业务系统', key: '业务系统名称', customRender: ({ record }: { record: ExcelRow }) => record.业务系统名称 },
  { title: '模块', key: '模块功能名称', customRender: ({ record }: { record: ExcelRow }) => record.模块功能名称 },
  { title: '数据库', key: '数据库名称', customRender: ({ record }: { record: ExcelRow }) => record.数据库名称 },
  { title: '底层表名', key: '底层表名', customRender: ({ record }: { record: ExcelRow }) => record.底层表名 },
  { title: '层级', key: '数据层级', customRender: ({ record }: { record: ExcelRow }) => record.数据层级 || '-' },
  { title: '错误', key: '_errors', width: 60 },
]

async function handleFileSelect(file: File) {
  try {
    const parsed = await parseFile(file)
    parsed.forEach((r, i) => ((r as ExcelRow & { __idx: number }).__idx = i))
    step.value = 'preview'
  } catch {
    message.error('文件解析失败，请检查文件格式')
  }
  return false // 阻止自动上传
}

async function handleImport() {
  const validRows = rows.value.filter((r) => r._selected && !r._errors?.length)
  if (!validRows.length) return

  importing.value = true
  step.value = 'progress'
  importedCount.value = 0
  totalToImport.value = validRows.length

  try {
    const batchSize = 10
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize).map(toMappingFields)
      await mappingStore.batchCreate(batch)
      importedCount.value = Math.min(i + batchSize, validRows.length)
    }
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : '导入失败')
    step.value = 'preview'
    importing.value = false
  }
}

function handleFinish() {
  emit('imported')
  emit('update:open', false)
  step.value = 'upload'
  reset()
}

function handleCancel() {
  emit('update:open', false)
  step.value = 'upload'
  reset()
}
</script>

<style>
.row-error td {
  background-color: #fff2f0 !important;
}
</style>
