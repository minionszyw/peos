/**
 * 认证相关API服务
 */
import request from '@/utils/request'
import { LoginRequest, LoginResponse, User } from '@/types/user'

/**
 * 用户登录
 */
export const login = (data: LoginRequest) => {
  return request.post<any, LoginResponse>('/auth/login', data)
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return request.get<any, User>('/auth/me')
}

/**
 * 创建用户 (已移至 users.ts)
 * @deprecated 请使用 services/users.ts 中的 createUser
 */
export const createUser = (data: any) => {
  return request.post<any, User>('/users', data)
}

/**
 * 获取用户列表 (已移至 users.ts)
 * @deprecated 请使用 services/users.ts 中的 getUserList
 */
export const getUserList = (params?: { skip?: number; limit?: number }) => {
  return request.get<any, User[]>('/users', { params })
}

