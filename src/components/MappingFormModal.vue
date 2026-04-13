<template>
  <a-modal
    :open="open"
    :title="record ? '编辑映射' : '新增映射'"
    @cancel="handleCancel"
    @ok="handleSave"
    ok-text="保存"
    cancel-text="取消"
    width="600px"
    :confirm-loading="saving"
  >
    <a-form :model="form" layout="vertical" :rules="rules" ref="formRef">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="业务系统名称" name="业务系统名称">
            <a-input
              v-model:value="form['业务系统名称']"
              placeholder="如：ERP、CRM、OA"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="模块功能名称" name="模块功能名称">
            <a-input
              v-model:value="form['模块功能名称']"
              placeholder="如：销售模块、库存管理"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="数据库名称" name="数据库名称">
            <a-input
              v-model:value="form['数据库名称']"
              placeholder="如：db_erp_ods"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="底层表名" name="底层表名">
            <a-input
              v-model:value="form['底层表名']"
              placeholder="如：t_sales_order"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="数据层级" name="数据层级">
            <a-select
              v-model:value="form['数据层级']"
              placeholder="请选择"
              allow-clear
            >
              <a-select-option v-for="l in DATA_LAYERS" :key="l" :value="l">
                {{ l }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="负责人" name="负责人">
            <a-input v-model:value="form['负责人']" placeholder="姓名" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="描述用途" name="描述用途">
        <a-textarea
          v-model:value="form['描述用途']"
          placeholder="表的业务含义、取数注意事项等"
          :rows="3"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { MappingRecord, MappingFields } from '@/types/mapping'
import { DATA_LAYERS } from '@/types/mapping'

const props = defineProps<{ open: boolean; record?: MappingRecord | null }>()
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'save', fields: Partial<MappingFields>): void
}>()

const saving = ref(false)
const formRef = ref()

const emptyForm = (): Partial<MappingFields> => ({
  业务系统名称: '',
  模块功能名称: '',
  数据库名称: '',
  底层表名: '',
  数据层级: undefined,
  负责人: '',
  描述用途: '',
})

const form = reactive<Partial<MappingFields>>(emptyForm())

watch(
  () => props.open,
  (v) => {
    if (v) {
      if (props.record) {
        Object.assign(form, { ...emptyForm(), ...props.record.fields })
      } else {
        Object.assign(form, emptyForm())
      }
    }
  }
)

const rules = {
  业务系统名称: [{ required: true, message: '请输入业务系统名称' }],
  模块功能名称: [{ required: true, message: '请输入模块功能名称' }],
  数据库名称: [{ required: true, message: '请输入数据库名称' }],
  底层表名: [{ required: true, message: '请输入底层表名' }],
}

async function handleSave() {
  try {
    await formRef.value.validate()
    saving.value = true
    emit('save', { ...form })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  emit('update:open', false)
}
</script>
