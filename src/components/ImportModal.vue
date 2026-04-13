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

      <div style="display: flex; justify-content: space-between; align-items: flex-start">
        <div style="color: #666; font-size: 13px; flex: 1">
          <strong>Excel 列名支持以下格式（中英文均可）：</strong>
          <a-row :gutter="[8, 8]" style="margin-top: 8px">
            <a-col :span="12" v-for="col in columnHints" :key="col.field">
              <a-tag color="blue">{{ col.examples }}</a-tag>
              <span style="margin-left: 4px; color: #888">→ {{ col.field }}</span>
            </a-col>
          </a-row>
        </div>
        <a-button
          type="default"
          :icon="h(DownloadOutlined)"
          @click="downloadTemplate"
          style="margin-left: 16px; white-space: nowrap; flex-shrink: 0"
        >
          下载导入模板
        </a-button>
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
import { ref, computed, h } from 'vue'
import { InboxOutlined, WarningOutlined, DownloadOutlined } from '@ant-design/icons-vue'
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

// 与映射模块实际字段保持一致
const columnHints = [
  { field: '业务系统名称', examples: '业务系统 / system' },
  { field: '模块功能名称', examples: '模块 / module' },
  { field: '数据库名称', examples: '数据库 / database' },
  { field: '底层表名', examples: '底层表名 / table_name' },
  { field: '描述用途', examples: '描述 / description' },
  { field: '数仓是否接入', examples: '数仓是否接入 / dw_access' },
  { field: '数仓表类型', examples: '数仓表类型 / dw_type' },
  { field: '数仓数据表名', examples: '数仓数据表名 / dw_table' },
]

async function downloadTemplate() {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('业务表映射')

  // 列定义
  const columns = [
    { header: '业务系统名称', key: 'sys',    width: 18 },
    { header: '模块功能名称', key: 'mod',    width: 18 },
    { header: '数据库名称',   key: 'db',     width: 20 },
    { header: '底层表名',     key: 'tbl',    width: 22 },
    { header: '描述用途',     key: 'desc',   width: 28 },
    { header: '数仓是否接入', key: 'dw',     width: 16 },
    { header: '数仓表类型',   key: 'type',   width: 14 },
    { header: '数仓数据表名', key: 'dwtbl',  width: 24 },
  ]
  ws.columns = columns

  // 表头样式（靛紫底白字）
  const headerRow = ws.getRow(1)
  headerRow.eachCell((cell, colIdx) => {
    const isDwAccess = colIdx === 6  // 数仓是否接入是第6列
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isDwAccess ? 'FFDC2626' : 'FF4F46E5' },  // 红 or 靛紫
    }
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'medium', color: { argb: isDwAccess ? 'FFB91C1C' : 'FF3730A3' } },
    }
  })
  headerRow.height = 24

  // 添加说明行（灰色背景）
  const noteRow = ws.addRow([
    '必填', '必填', '必填', '必填',
    '选填', '★ 只能填：是 / 否', '选填（如：实时、离线）', '选填',
  ])
  noteRow.eachCell((cell, colIdx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } }
    cell.font = {
      color: { argb: colIdx === 6 ? 'FFDC2626' : 'FF888888' },
      italic: true,
      size: 10,
      bold: colIdx === 6,
    }
    cell.alignment = { horizontal: 'center' }
  })

  // 示例数据行
  ws.addRow(['LS系统', '销售模块', 'db_ls_ods', 't_sales_order', '销售订单明细表', '是', '离线', 'dwd_ls_sales_order_d'])

  // 数仓是否接入列（F列）添加下拉数据验证
  ws.dataValidations.add('F3:F1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"是,否"'],
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: '输入无效',
    error: '此列只能填入：是 或 否',
  })

  // 导出
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '业务表映射导入模板.xlsx'
  a.click()
  URL.revokeObjectURL(url)
  message.success('模板已下载')
}

const previewColumns = [
  { title: '', key: 'select', width: 40 },
  { title: '业务系统', key: '业务系统名称', customRender: ({ record }: { record: ExcelRow }) => record.业务系统名称 },
  { title: '模块功能', key: '模块功能名称', customRender: ({ record }: { record: ExcelRow }) => record.模块功能名称 },
  { title: '数据库', key: '数据库名称', customRender: ({ record }: { record: ExcelRow }) => record.数据库名称 },
  { title: '底层表名', key: '底层表名', customRender: ({ record }: { record: ExcelRow }) => record.底层表名 },
  { title: '描述', key: '描述用途', customRender: ({ record }: { record: ExcelRow }) => record.描述用途 || '-' },
  { title: '数仓接入', key: '数仓是否接入', customRender: ({ record }: { record: ExcelRow }) => record.数仓是否接入 || '-' },
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
  return false
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
