/**
 * 平台API服务
 */
import request from '@/utils/request'

export interface Platform {
  id: number
  name: string
  code: string
  icon?: string
  description?: string
  is_active: number
  sort_order?: number
  config?: any
  created_at: string
  updated_at: string
}

// 获取平台列表
export const getPlatformList = () => {
  return request.get<Platform[]>('/platforms')
}

// 获取活跃平台列表
export const getActivePlatforms = () => {
  return request.get<Platform[]>('/platforms?is_active=1')
}

