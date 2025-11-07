import request from './request'

export interface Dashboard {
  id: number
  user_id: number
  name: string
  config_json?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DashboardDataQuery {
  metric: string
  start_date?: string
  end_date?: string
  shop_ids?: number[]
  platform_ids?: number[]
  group_by?: string
}

export interface SalesTrend {
  dates: string[]
  amounts: number[]
  quantities: number[]
}

export interface RankingItem {
  id: number
  name: string
  amount: number
  quantity: number
  rank: number
}

export interface SalesRanking {
  products: RankingItem[]
  shops: RankingItem[]
}

// 看板管理
export const getDashboards = () => {
  return request.get<Dashboard[]>('/dashboards')
}

export const getDashboard = (id: number) => {
  return request.get<Dashboard>(`/dashboards/${id}`)
}

export const createDashboard = (data: Partial<Dashboard>) => {
  return request.post<Dashboard>('/dashboards', data)
}

export const updateDashboard = (id: number, data: Partial<Dashboard>) => {
  return request.put<Dashboard>(`/dashboards/${id}`, data)
}

export const deleteDashboard = (id: number) => {
  return request.delete(`/dashboards/${id}`)
}

export const cloneDashboard = (id: number, name: string) => {
  return request.post<Dashboard>(`/dashboards/${id}/clone`, { name })
}

// 看板数据
export const queryDashboardData = (query: DashboardDataQuery) => {
  return request.post('/dashboard-data/query', query)
}

export const getSalesTrend = (params?: {
  start_date?: string
  end_date?: string
  shop_ids?: string
}) => {
  return request.get<SalesTrend>('/dashboard-data/sales/trend', { params })
}

export const getSalesRanking = (params?: {
  start_date?: string
  end_date?: string
  limit?: number
}) => {
  return request.get<SalesRanking>('/dashboard-data/sales/ranking', { params })
}

export const getProductsAnalysis = (params?: {
  shop_id?: number
  start_date?: string
  end_date?: string
}) => {
  return request.get('/dashboard-data/products/analysis', { params })
}

export const getShopsComparison = (params?: {
  start_date?: string
  end_date?: string
}) => {
  return request.get('/dashboard-data/shops/comparison', { params })
}
