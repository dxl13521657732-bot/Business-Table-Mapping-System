import axios from 'axios'

export interface TeableUser {
  id: string
  用户名: string
  密码: string
  姓名?: string
  是否启用?: string
}

export async function queryUser(username: string): Promise<TeableUser | null> {
  const baseUrl = localStorage.getItem('teable_base_url') || ''
  const usersTableId = localStorage.getItem('teable_users_table_id') || ''
  const token = localStorage.getItem('teable_token') || ''

  if (!baseUrl || !usersTableId || !token) {
    throw new Error('请先在设置中配置用户表 ID')
  }

  const res = await axios.get(`${baseUrl.replace(/\/$/, '')}/table/${usersTableId}/record`, {
    params: { take: 100 },
    headers: { Authorization: `Bearer ${token}` },
  })

  const records: Array<{ id: string; fields: Record<string, string> }> = res.data?.records ?? []
  const match = records.find((r) => r.fields['用户名'] === username)
  if (!match) return null

  return {
    id: match.id,
    用户名: match.fields['用户名'],
    密码: match.fields['密码'],
    姓名: match.fields['姓名'],
    是否启用: match.fields['是否启用'],
  }
}
