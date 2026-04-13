<template>
  <div>
    <!-- 搜索和操作栏 -->
    <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap">
      <a-input-search
        v-model:value="mappingStore.searchKeyword"
        placeholder="搜索业务系统、模块、数据库、表名、数仓表名..."
        style="flex: 1; min-width: 280px"
        allow-clear
      />
      <a-space>
        <a-button :icon="h(ReloadOutlined)" @click="mappingStore.fetchAll()" :loading="mappingStore.loading">
          刷新
        </a-button>
        <a-button :icon="h(UploadOutlined)" @click="emit('import')">
          Excel 导入
        </a-button>
        <a-button type="primary" :icon="h(PlusOutlined)" @click="emit('add')">
          新增
        </a-button>
      </a-space>
    </div>

    <!-- 统计信息 -->
    <div style="color: #888; font-size: 13px; margin-bottom: 8px">
      共 {{ mappingStore.allRecords.length }} 条记录，当前显示 {{ mappingStore.filteredRecords.length }} 条
    </div>

    <!-- 主表格 -->
    <a-table
      :data-source="mappingStore.filteredRecords"
      :columns="columns"
      :loading="mappingStore.loading"
      :pagination="{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (t: number) => `共 ${t} 条` }"
      row-key="id"
      size="middle"
      :scroll="{ x: 1300 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dw_access'">
          <a-tag v-if="record.fields['数仓是否接入'] === '是'" color="green">已接入</a-tag>
          <a-tag v-else-if="record.fields['数仓是否接入'] === '否'" color="default">未接入</a-tag>
          <span v-else style="color: #ccc">—</span>
        </template>
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" type="link" @click="emit('edit', record)">编辑</a-button>
            <a-popconfirm
              title="确认删除此记录？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="handleDelete(record.id)"
            >
              <a-button size="small" type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { ReloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { useMappingStore } from '@/stores/mapping'
import type { MappingRecord } from '@/types/mapping'
import { message } from 'ant-design-vue'

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', record: MappingRecord): void
  (e: 'import'): void
}>()

const mappingStore = useMappingStore()

const columns = [
  {
    title: '业务系统',
    key: 'system',
    customRender: ({ record }: { record: MappingRecord }) => record.fields['业务系统名称'],
    width: 120,
    ellipsis: true,
  },
  {
    title: '模块功能',
    key: 'module',
    customRender: ({ record }: { record: MappingRecord }) => record.fields['模块功能名称'],
    width: 130,
    ellipsis: true,
  },
  {
    title: '数据库名称',
    key: 'database',
    customRender: ({ record }: { record: MappingRecord }) => record.fields['数据库名称'],
    width: 150,
    ellipsis: true,
  },
  {
    title: '底层表名',
    key: 'table',
    customRender: ({ record }: { record: MappingRecord }) => record.fields['底层表名'],
    width: 170,
    ellipsis: true,
  },
  {
    title: '描述用途',
    key: 'desc',
    customRender: ({ record }: { record: MappingRecord }) => record.fields['描述用途'] || '—',
    ellipsis: true,
  },
  {
    title: '数仓接入',
    key: 'dw_access',
    width: 90,
  },
  {
    title: '数仓表类型',
    key: 'dw_type',
    customRender: ({ record }: { record: MappingRecord }) => record.fields['数仓表类型'] || '—',
    width: 100,
  },
  {
    title: '数仓数据表名',
    key: 'dw_table',
    customRender: ({ record }: { record: MappingRecord }) => record.fields['数仓数据表名'] || '—',
    width: 170,
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'actions',
    width: 110,
    fixed: 'right',
  },
]

async function handleDelete(id: string) {
  try {
    await mappingStore.deleteOne(id)
    message.success('删除成功')
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : '删除失败')
  }
}
</script>
