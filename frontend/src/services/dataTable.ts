/**
 * 数据表管理API服务
 */
import request from '@/utils/request'

export interface FieldConfig {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean'
  required: boolean
  description?: string
}

export interface DataTable {
  id: number
  shop_id: number
  name: string
  table_type: string
  description?: string
  fields: FieldConfig[]
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
}

export interface DataTableCreate {
  shop_id: number
  name: string
  table_type: string
  description?: string
  fields: FieldConfig[]
  sort_order?: number
  is_active?: number
}

export interface DataTableUpdate {
  name?: string
  description?: string
  fields?: FieldConfig[]
  sort_order?: number
  is_active?: number
}

export interface TreeNode {
  id: number
  name: string
  type: 'platform' | 'shop' | 'data_table'
  table_type?: string
  children?: TreeNode[]
  shop_id?: number
  is_active?: number
  fields?: FieldConfig[]  // 字段配置（仅 data_table 类型有）
  description?: string
  sort_order?: number
  platform_id?: number
  platform_name?: string
  status?: string
}

/**
 * 获取数据表树形结构
 */
export const getDataTableTree = (platformId?: number): Promise<TreeNode[]> => {
  return request.get('/data-tables/tree', { params: { platform_id: platformId } })
}

/**
 * 获取数据表列表
 */
export const getDataTables = (params?: {
  shop_id?: number
  table_type?: string
  skip?: number
  limit?: number
}): Promise<DataTable[]> => {
  return request.get('/data-tables', { params })
}

/**
 * 获取数据表详情
 */
export const getDataTable = (id: number): Promise<DataTable> => {
  return request.get(`/data-tables/${id}`)
}

/**
 * 创建数据表
 */
export const createDataTable = (data: DataTableCreate): Promise<DataTable> => {
  return request.post('/data-tables', data)
}

/**
 * 更新数据表
 */
export const updateDataTable = (id: number, data: DataTableUpdate): Promise<DataTable> => {
  return request.put(`/data-tables/${id}`, data)
}

/**
 * 删除数据表
 */
export const deleteDataTable = (id: number): Promise<void> => {
  return request.delete(`/data-tables/${id}`)
}

/**
 * 查询数据表数据
 */
export const queryDataTableData = (params: {
  table_type: string
  data_table_id?: number
  shop_id?: number
  filters?: any
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  skip?: number
  limit?: number
}): Promise<{
  total: number
  items: any[]
  skip: number
  limit: number
  fields?: FieldConfig[]
  data_table?: {
    id: number
    name: string
    table_type: string
    shop_id: number
  }
}> => {
  return request.post('/data-table-data/query', params)
}

/**
 * 通过数据表ID获取数据
 */
export const getDataByTableId = (
  dataTableId: number,
  skip: number = 0,
  limit: number = 20
): Promise<{ total: number; items: any[]; skip: number; limit: number; fields: FieldConfig[] }> => {
  return request.get(`/data-table-data/${dataTableId}/data`, {
    params: { skip, limit }
  })
}
