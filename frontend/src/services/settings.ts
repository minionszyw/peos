import request from '@/utils/request'

export interface SystemSetting {
  id: number
  key: string
  value: string
  value_type: string
  description: string
  group_name: string
  is_public: number
  created_at: string
  updated_at: string
}

// 获取系统设置
export const getSettings = (groupName?: string) => {
  return request.get<SystemSetting[]>('/settings', {
    params: { group_name: groupName }
  })
}

// 获取指定配置项
export const getSettingByKey = (key: string) => {
  return request.get<SystemSetting>(`/settings/${key}`)
}

// 更新系统设置
export const updateSetting = (key: string, data: Partial<SystemSetting>) => {
  return request.put<SystemSetting>(`/settings/${key}`, data)
}

// 批量更新系统设置
export const batchUpdateSettings = (settings: Record<string, string>) => {
  return request.put('/settings', { settings })
}

// 上传Logo
export const uploadLogo = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/settings/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
