/**
 * 店铺相关类型定义
 */

export interface Shop {
  id: number
  name: string
  platform: string
  account?: string
  manager_id?: number
  manager_name?: string
  status: string
  created_at: string
  updated_at: string
}

export interface ShopCreate {
  name: string
  platform: string
  account?: string
  manager_id?: number
  status?: string
}

export interface ShopUpdate {
  name?: string
  platform?: string
  account?: string
  manager_id?: number
  status?: string
}

export interface ShopListParams {
  skip?: number
  limit?: number
  platform?: string
  status?: string
}

