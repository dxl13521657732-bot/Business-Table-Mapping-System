export interface MappingRecord {
  id: string
  fields: MappingFields
  createdTime?: string
}

export interface MappingFields {
  业务系统名称: string
  模块功能名称: string
  数据库名称: string
  底层表名: string
  描述用途?: string
  数仓是否接入?: '是' | '否'
  数仓表类型?: string
  数仓数据表名?: string
}

export const DW_ACCESS_OPTIONS = ['是', '否'] as const

export interface TeableListResponse {
  records: MappingRecord[]
  total: number
  offset?: string
}

export interface TeableCreateBody {
  records: Array<{ fields: Partial<MappingFields> }>
}

export interface TeableUpdateBody {
  records: Array<{ id: string; fields: Partial<MappingFields> }>
}

export interface TeableDeleteBody {
  recordIds: string[]
}

export interface ExcelRow {
  业务系统名称: string
  模块功能名称: string
  数据库名称: string
  底层表名: string
  描述用途?: string
  数仓是否接入?: string
  数仓表类型?: string
  数仓数据表名?: string
  _errors?: string[]
  _selected?: boolean
}
