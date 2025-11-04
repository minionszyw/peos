/**
 * 用户相关类型定义
 */

export interface User {
  id: number
  username: string
  name: string
  role: string
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

