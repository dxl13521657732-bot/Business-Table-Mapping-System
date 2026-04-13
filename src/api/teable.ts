import axios from 'axios'
import type {
  MappingFields,
  MappingRecord,
  TeableListResponse,
} from '@/types/mapping'

function getConfig() {
  const baseUrl = localStorage.getItem('teable_base_url') || ''
  const tableId = localStorage.getItem('teable_table_id') || ''
  const token = localStorage.getItem('teable_token') || ''
  if (!baseUrl || !tableId || !token) {
    throw new Error('请先在设置中配置 Teable 连接信息')
  }
  return { baseUrl, tableId, token }
}

function createClient(baseUrl: string, token: string) {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function listRecords(params: {
  take?: number
  skip?: number
}): Promise<TeableListResponse> {
  const { baseUrl, tableId, token } = getConfig()
  const client = createClient(baseUrl, token)
  const res = await client.get(`/table/${tableId}/record`, {
    params: { take: params.take ?? 100, skip: params.skip ?? 0 },
  })
  return res.data
}

export async function fetchAllRecords(): Promise<MappingRecord[]> {
  const all: MappingRecord[] = []
  let skip = 0
  const take = 100
  while (true) {
    const res = await listRecords({ take, skip })
    all.push(...res.records)
    if (all.length >= res.total || res.records.length < take) break
    skip += take
  }
  return all
}

export async function createRecords(
  fields: Partial<MappingFields>[]
): Promise<MappingRecord[]> {
  const { baseUrl, tableId, token } = getConfig()
  const client = createClient(baseUrl, token)
  const res = await client.post(`/table/${tableId}/record`, {
    records: fields.map((f) => ({ fields: f })),
  })
  return res.data.records
}

export async function updateRecord(
  id: string,
  fields: Partial<MappingFields>
): Promise<void> {
  const { baseUrl, tableId, token } = getConfig()
  const client = createClient(baseUrl, token)
  await client.patch(`/table/${tableId}/record`, {
    records: [{ id, fields }],
  })
}

export async function deleteRecords(ids: string[]): Promise<void> {
  const { baseUrl, tableId, token } = getConfig()
  // Teable DELETE 接口使用 query string 传递 recordIds[]，不支持请求体
  const params = new URLSearchParams()
  ids.forEach((id) => params.append('recordIds[]', id))
  await fetch(`${baseUrl.replace(/\/$/, '')}/table/${tableId}/record?${params}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (r) => {
    if (!r.ok) throw new Error(`删除失败（${r.status}）`)
  })
}
