import request from '@/utils/request'

export interface Platform {
  id: number
  name: string
  code: string
  icon?: string
  description?: string
  is_active: number
  sort_order: number
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface PlatformShop {
  id: number
  name: string
  platform_id: number
  account: string
  status: string
  manager_id?: number
  created_at: string
  updated_at: string
}

// 获取平台列表
export const getPlatforms = (params?: { is_active?: number; skip?: number; limit?: number }) => {
  return request.get<Platform[]>('/platforms', { params })
}

// 获取指定平台
export const getPlatform = (id: number) => {
  return request.get<Platform>(`/platforms/${id}`)
}

// 获取平台下的店铺
export const getPlatformShops = (id: number) => {
  return request.get<PlatformShop[]>(`/platforms/${id}/shops`)
}

// 创建平台
export const createPlatform = (data: Partial<Platform>) => {
  return request.post<Platform>('/platforms', data)
}

// 更新平台
export const updatePlatform = (id: number, data: Partial<Platform>) => {
  return request.put<Platform>(`/platforms/${id}`, data)
}

// 删除平台
export const deletePlatform = (id: number) => {
  return request.delete(`/platforms/${id}`)
}
