/**
 * 数据导入相关类型定义
 */

export interface ImportHistory {
  id: number
  user_id: number
  file_name: string
  table_type: string
  status: string
  total_rows: number
  success_rows: number
  error_message?: string
  created_at: string
}

export interface ImportResult {
  total_rows: number
  success_rows: number
  error_count: number
  errors: string[]
  status: string
}

export type TableType = 'warehouse_products' | 'shop_products' | 'inventory' | 'sales'

