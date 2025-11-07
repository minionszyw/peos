/**
 * 数据看板API服务
 */
import request from '@/utils/request'

// 获取数据汇总
export const getDashboardSummary = (params?: {
  start_date?: string
  end_date?: string
  shop_id?: number
  platform?: string
}) => {
  return request.get('/dashboard-data/summary', { params })
}

// 获取销售趋势
export const getSalesTrend = (params?: {
  start_date?: string
  end_date?: string
  shop_id?: number
  platform?: string
  group_by?: 'day' | 'week' | 'month'
}) => {
  return request.get('/dashboard-data/sales/trend', { params })
}

// 获取销售排行
export const getSalesRanking = (params?: {
  start_date?: string
  end_date?: string
  shop_id?: number
  platform?: string
  type?: 'product' | 'shop'
  limit?: number
}) => {
  return request.get('/dashboard-data/sales/ranking', { params })
}

// 获取商品分析
export const getProductsAnalysis = (params?: {
  start_date?: string
  end_date?: string
  shop_id?: number
  platform?: string
}) => {
  return request.get('/dashboard-data/products/analysis', { params })
}

// 获取店铺对比
export const getShopsComparison = (params?: {
  start_date?: string
  end_date?: string
  shop_ids?: number[]
}) => {
  return request.get('/dashboard-data/shops/comparison', { params })
}

