/**
 * 操作日志API服务
 */
import request from '@/utils/request'

export interface OperationLog {
  id: number
  user_id: number
  user_name?: string
  action_type: string
  table_name: string
  record_id?: number
  old_value?: any
  new_value?: any
  created_at: string
}

export interface LogQuery {
  user_id?: number
  action_type?: string
  table_name?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

// 获取操作日志列表
export const getLogList = (params: LogQuery) => {
  return request.get<OperationLog[]>('/logs', { params })
}

// 获取操作日志详情
export const getLog = (id: number) => {
  return request.get<OperationLog>(`/logs/${id}`)
}

// 获取日志总数
export const getLogCount = (params: Omit<LogQuery, 'page' | 'page_size'>) => {
  return request.get<{ total: number }>('/logs/count', { params })
}

// 获取日志统计
export const getLogStats = (params: { start_date?: string; end_date?: string }) => {
  return request.get('/logs/stats/summary', { params })
}

