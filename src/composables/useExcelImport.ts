import { ref } from 'vue'
import * as XLSX from 'xlsx'
import type { ExcelRow, MappingFields } from '@/types/mapping'
import { DATA_LAYERS } from '@/types/mapping'

// 列名映射：Excel 列名 → 字段名
const COLUMN_MAP: Record<string, keyof MappingFields> = {
  业务系统: '业务系统名称',
  业务系统名称: '业务系统名称',
  system: '业务系统名称',
  模块: '模块功能名称',
  功能模块: '模块功能名称',
  模块功能名称: '模块功能名称',
  module: '模块功能名称',
  数据库: '数据库名称',
  数据库名称: '数据库名称',
  database: '数据库名称',
  db: '数据库名称',
  底层表名: '底层表名',
  表名: '底层表名',
  table_name: '底层表名',
  table: '底层表名',
  数据层级: '数据层级',
  层级: '数据层级',
  data_layer: '数据层级',
  layer: '数据层级',
  描述: '描述用途',
  用途: '描述用途',
  描述用途: '描述用途',
  description: '描述用途',
  备注: '描述用途',
  负责人: '负责人',
  owner: '负责人',
}

const REQUIRED_FIELDS: (keyof MappingFields)[] = [
  '业务系统名称',
  '模块功能名称',
  '数据库名称',
  '底层表名',
]

export function useExcelImport() {
  const rows = ref<ExcelRow[]>([])
  const parsing = ref(false)

  function parseFile(file: File): Promise<ExcelRow[]> {
    parsing.value = true
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            sheet,
            { defval: '' }
          )

          const parsed: ExcelRow[] = rawRows.map((raw) => {
            const row: Partial<ExcelRow> = {
              业务系统名称: '',
              模块功能名称: '',
              数据库名称: '',
              底层表名: '',
              _errors: [],
              _selected: true,
            }

            // 列名映射
            for (const [colName, value] of Object.entries(raw)) {
              const fieldName = COLUMN_MAP[colName.trim()]
              if (fieldName) {
                ;(row as Record<string, unknown>)[fieldName] = String(
                  value
                ).trim()
              }
            }

            // 数据层级校验
            if (
              row.数据层级 &&
              !DATA_LAYERS.includes(
                row.数据层级 as (typeof DATA_LAYERS)[number]
              )
            ) {
              row._errors!.push(
                `数据层级"${row.数据层级}"无效，应为 ${DATA_LAYERS.join('/')}`
              )
              row.数据层级 = undefined
            }

            // 必填字段校验
            for (const field of REQUIRED_FIELDS) {
              if (!row[field as keyof ExcelRow]) {
                row._errors!.push(`"${field}"不能为空`)
              }
            }

            return row as ExcelRow
          })

          rows.value = parsed
          resolve(parsed)
        } catch (err) {
          reject(err)
        } finally {
          parsing.value = false
        }
      }
      reader.onerror = () => {
        parsing.value = false
        reject(new Error('文件读取失败'))
      }
      reader.readAsArrayBuffer(file)
    })
  }

  function toMappingFields(row: ExcelRow): Partial<MappingFields> {
    return {
      业务系统名称: row.业务系统名称,
      模块功能名称: row.模块功能名称,
      数据库名称: row.数据库名称,
      底层表名: row.底层表名,
      数据层级: row.数据层级 as MappingFields['数据层级'],
      描述用途: row.描述用途,
      负责人: row.负责人,
    }
  }

  function reset() {
    rows.value = []
  }

  return { rows, parsing, parseFile, toMappingFields, reset }
}
