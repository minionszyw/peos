/**
 * 导入模板管理API服务
 */
import request from '@/utils/request'

export interface ImportTemplate {
  id: number
  table_type: string
  name: string
  description?: string
  field_mappings: any
  validation_rules?: any
  custom_fields?: any
  example_data?: any
  is_active: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ImportTemplateCreate {
  table_type: string
  name: string
  description?: string
  field_mappings: any
  validation_rules?: any
  custom_fields?: any
  example_data?: any
  is_active?: number
  sort_order?: number
}

export interface ImportTemplateUpdate {
  name?: string
  description?: string
  field_mappings?: any
  validation_rules?: any
  custom_fields?: any
  example_data?: any
  is_active?: number
  sort_order?: number
}

/**
 * 获取导入模板列表
 */
export const getImportTemplates = (params?: {
  skip?: number
  limit?: number
}): Promise<ImportTemplate[]> => {
  return request.get('/import-templates', { params })
}

/**
 * 获取导入模板详情
 */
export const getImportTemplate = (id: number): Promise<ImportTemplate> => {
  return request.get(`/import-templates/${id}`)
}

/**
 * 创建导入模板
 */
export const createImportTemplate = (data: ImportTemplateCreate): Promise<ImportTemplate> => {
  return request.post('/import-templates', data)
}

/**
 * 更新导入模板
 */
export const updateImportTemplate = (id: number, data: ImportTemplateUpdate): Promise<ImportTemplate> => {
  return request.put(`/import-templates/${id}`, data)
}

/**
 * 删除导入模板
 */
export const deleteImportTemplate = (id: number): Promise<void> => {
  return request.delete(`/import-templates/${id}`)
}

