import axios from 'axios'

export interface TeableUser {
  id: string
  用户名: string
  密码: string
  姓名?: string
  是否启用?: string
  角色?: string
}

function getUsersConfig() {
  const baseUrl = (localStorage.getItem('teable_users_base_url') ||
                   localStorage.getItem('teable_base_url') || '').replace(/\/$/, '')
  const token   = localStorage.getItem('teable_users_token') ||
                  localStorage.getItem('teable_token') || ''
  const tableId = localStorage.getItem('teable_users_table_id') || ''
  if (!baseUrl || !tableId || !token) throw new Error('请先在设置中配置用户表 ID')
  return { baseUrl, token, tableId }
}

export async function queryUser(username: string): Promise<TeableUser | null> {
  const { baseUrl, token, tableId } = getUsersConfig()
  const res = await axios.get(`${baseUrl}/table/${tableId}/record`, {
    params: { take: 200 },
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
    角色: match.fields['角色'],
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const user = await queryUser(username)
  return user !== null
}

export async function registerUser(data: {
  用户名: string
  密码: string
  姓名?: string
}): Promise<void> {
  const { baseUrl, token, tableId } = getUsersConfig()
  await axios.post(
    `${baseUrl}/table/${tableId}/record`,
    {
      records: [{
        fields: {
          用户名: data.用户名,
          密码: data.密码,
          姓名: data.姓名 || data.用户名,
          角色: '用户',
          是否启用: '启用',
        },
      }],
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  )
}
