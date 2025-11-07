import request from '@/utils/request'
import { User } from '@/types/user'

// 获取用户列表
export const getUserList = (params?: { skip?: number; limit?: number; role?: string; search?: string }) => {
  return request.get<User[]>('/users', { params })
}

// 获取指定用户
export const getUser = (id: number) => {
  return request.get<User>(`/users/${id}`)
}

// 创建用户
export const createUser = (data: { username: string; password: string; name: string; role: string; email?: string; phone?: string }) => {
  return request.post<User>('/auth/users', data)
}

// 更新用户
export const updateUser = (id: number, data: Partial<User> & { password?: string }) => {
  return request.put<User>(`/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id: number) => {
  return request.delete(`/users/${id}`)
}

// 批量删除用户
export const batchDeleteUsers = (userIds: number[]) => {
  return request.post('/users/batch/delete', { user_ids: userIds })
}

// 批量修改角色
export const batchUpdateRole = (userIds: number[], role: string) => {
  return request.put('/users/batch/role', { user_ids: userIds, role })
}

// 修改密码
export const changePassword = (userId: number, oldPassword: string, newPassword: string) => {
  return request.put(`/users/${userId}/password`, { old_password: oldPassword, new_password: newPassword })
}

// 上传头像
export const uploadAvatar = (userId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.put(`/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

