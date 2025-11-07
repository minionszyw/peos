/**
 * 工作表API服务
 */
import request from '@/utils/request'

export interface Worksheet {
  id: number
  user_id: number
  name: string
  config_json?: any
  created_at: string
  updated_at: string
}

export interface WorksheetCreate {
  name: string
  config_json?: any
}

export interface WorksheetUpdate {
  name?: string
  config_json?: any
}

export interface WorksheetDataQuery {
  worksheet_id: number
  shop_id?: number
  status?: string
  keyword?: string
  page?: number
  page_size?: number
}

// 获取工作表列表
export const getWorksheetList = () => {
  return request.get<Worksheet[]>('/worksheets')
}

// 创建工作表
export const createWorksheet = (data: WorksheetCreate) => {
  return request.post<Worksheet>('/worksheets', data)
}

// 获取工作表详情
export const getWorksheet = (id: number) => {
  return request.get<Worksheet>(`/worksheets/${id}`)
}

// 更新工作表
export const updateWorksheet = (id: number, data: WorksheetUpdate) => {
  return request.put<Worksheet>(`/worksheets/${id}`, data)
}

// 删除工作表
export const deleteWorksheet = (id: number) => {
  return request.delete(`/worksheets/${id}`)
}

// 查询工作表数据
export const queryWorksheetData = (query: WorksheetDataQuery) => {
  return request.post('/worksheets/data/query', query)
}

// 批量更新商品状态
export const batchUpdateStatus = (ids: number[], status: string) => {
  return request.post('/products/shop/batch/status', { ids, status })
}

// 批量改价
export const batchUpdatePrice = (ids: number[], price: number) => {
  return request.post('/products/shop/batch/price', { ids, price })
}

