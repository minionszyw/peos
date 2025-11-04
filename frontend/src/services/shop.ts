/**
 * 店铺相关API服务
 */
import request from '@/utils/request'
import { Shop, ShopCreate, ShopUpdate, ShopListParams } from '@/types/shop'

/**
 * 创建店铺
 */
export const createShop = (data: ShopCreate) => {
  return request.post<any, Shop>('/shops', data)
}

/**
 * 获取店铺列表
 */
export const getShopList = (params?: ShopListParams) => {
  return request.get<any, Shop[]>('/shops', { params })
}

/**
 * 获取店铺详情
 */
export const getShop = (id: number) => {
  return request.get<any, Shop>(`/shops/${id}`)
}

/**
 * 更新店铺
 */
export const updateShop = (id: number, data: ShopUpdate) => {
  return request.put<any, Shop>(`/shops/${id}`, data)
}

/**
 * 删除店铺
 */
export const deleteShop = (id: number) => {
  return request.delete(`/shops/${id}`)
}

/**
 * 获取店铺总数
 */
export const getShopCount = () => {
  return request.get<any, { total: number }>('/shops/count/total')
}

