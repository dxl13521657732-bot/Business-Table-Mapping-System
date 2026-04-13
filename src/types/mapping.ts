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
  数据层级?: '不确定' | 'ODS' | 'DWD' | 'DWS' | 'ADS'
  描述用途?: string
  负责人?: string
  更新时间?: string
}

export const DATA_LAYERS = ['ODS', 'DWD', 'DWS', 'ADS', '不确定'] as const

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
  数据层级?: string
  描述用途?: string
  负责人?: string
  _errors?: string[]
  _selected?: boolean
}
