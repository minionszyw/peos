/**
 * 数据导入相关API服务
 */
import request from '@/utils/request'
import { ImportHistory, ImportResult, TableType } from '@/types/import'

/**
 * 上传并导入数据
 */
export const uploadAndImport = (
  file: File, 
  tableType: TableType, 
  dataTableId?: number,
  shopId?: number
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('table_type', tableType)
  if (dataTableId) {
    formData.append('data_table_id', String(dataTableId))
  }
  if (shopId) {
    formData.append('shop_id', String(shopId))
  }
  
  return request.post<any, ImportResult>('/import/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 获取导入历史记录
 */
export const getImportHistory = (params?: { skip?: number; limit?: number }) => {
  return request.get<any, ImportHistory[]>('/import/history', { params })
}

/**
 * 获取导入模板
 */
export const getImportTemplate = (tableType: TableType) => {
  return request.get(`/import/templates/${tableType}`)
}

