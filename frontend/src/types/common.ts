/**
 * 通用类型定义
 */

// 分页参数
export interface PaginationParams {
  skip?: number
  limit?: number
}

// 分页响应
export interface PaginationResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 表格排序
export interface SortParams {
  field: string
  order: 'ascend' | 'descend'
}

// 日期范围
export interface DateRange {
  start: string
  end: string
}

