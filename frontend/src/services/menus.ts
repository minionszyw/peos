import request from '@/utils/request'

export interface MenuItem {
  id: number
  name: string
  icon?: string
  path?: string
  parent_id?: number | null
  sort_order: number
  is_visible: number
  required_role?: string
  component?: string
  created_at: string
  updated_at: string
  children?: MenuItem[]
}

// 获取当前用户可见菜单
export const getMenus = () => {
  return request.get<MenuItem[]>('/menus')
}

// 获取菜单树
export const getMenuTree = () => {
  return request.get<MenuItem[]>('/menus/tree')
}

// 获取所有菜单（管理员）
export const getAllMenus = () => {
  return request.get<MenuItem[]>('/menus/all')
}

// 获取指定菜单
export const getMenu = (id: number) => {
  return request.get<MenuItem>(`/menus/${id}`)
}

// 创建菜单
export const createMenu = (data: Partial<MenuItem>) => {
  return request.post<MenuItem>('/menus', data)
}

// 更新菜单
export const updateMenu = (id: number, data: Partial<MenuItem>) => {
  return request.put<MenuItem>(`/menus/${id}`, data)
}

// 删除菜单
export const deleteMenu = (id: number) => {
  return request.delete(`/menus/${id}`)
}

// 批量更新排序
export const batchSortMenus = (items: { id: number; sort_order: number }[]) => {
  return request.put('/menus/sort/batch', { items })
}
