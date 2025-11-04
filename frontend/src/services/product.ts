/**
 * 商品相关API服务
 */
import request from '@/utils/request'
import { ShopProduct, BatchUpdateStatus, BatchUpdatePrice } from '@/types/product'

/**
 * 获取店铺商品列表
 */
export const getShopProductList = (params?: {
  skip?: number
  limit?: number
  shop_id?: number
  status?: string
  keyword?: string
}) => {
  return request.get<any, ShopProduct[]>('/products/shop', { params })
}

/**
 * 更新店铺商品
 */
export const updateShopProduct = (id: number, data: Partial<ShopProduct>) => {
  return request.put<any, ShopProduct>(`/products/shop/${id}`, data)
}

/**
 * 批量更新状态（上下架）
 */
export const batchUpdateStatus = (data: BatchUpdateStatus) => {
  return request.post('/products/shop/batch/status', data)
}

/**
 * 批量改价
 */
export const batchUpdatePrice = (data: BatchUpdatePrice) => {
  return request.post('/products/shop/batch/price', data)
}

/**
 * 删除店铺商品
 */
export const deleteShopProduct = (id: number) => {
  return request.delete(`/products/shop/${id}`)
}

