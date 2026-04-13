import axios from 'axios'

export interface TeableUser {
  id: string
  用户名: string
  密码: string
  姓名?: string
  是否启用?: string
}

export async function queryUser(username: string): Promise<TeableUser | null> {
  // 用户表优先用独立配置，不填则回退到映射表配置
  const usersBaseUrl = localStorage.getItem('teable_users_base_url') ||
                       localStorage.getItem('teable_base_url') || ''
  const usersToken   = localStorage.getItem('teable_users_token') ||
                       localStorage.getItem('teable_token') || ''
  const usersTableId = localStorage.getItem('teable_users_table_id') || ''

  if (!usersBaseUrl || !usersTableId || !usersToken) {
    throw new Error('请先在设置中配置用户表 ID')
  }

  const res = await axios.get(
    `${usersBaseUrl.replace(/\/$/, '')}/table/${usersTableId}/record`,
    {
      params: { take: 100 },
      headers: { Authorization: `Bearer ${usersToken}` },
    }
  )

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
