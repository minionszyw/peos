/**
 * 私有路由组件 - 需要登录才能访问
 */
import { Navigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated } = useUserStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default PrivateRoute

