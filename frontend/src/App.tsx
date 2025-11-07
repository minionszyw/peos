import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Shops from '@/pages/Shops'
import Import from '@/pages/Import'
import Settings from '@/pages/Settings'
import Profile from '@/pages/Profile'
import PlatformData from '@/pages/PlatformData'
import Worksheet from '@/pages/Worksheet'
import Logs from '@/pages/Logs'
import PrivateRoute from '@/components/PrivateRoute'

function App() {
  return (
    <BrowserRouter>
      <AntdApp>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="platform-data" element={<PlatformData />} />
            <Route path="worksheet" element={<Worksheet />} />
            <Route path="logs" element={<Logs />} />
            <Route path="shops" element={<Shops />} />
            <Route path="import" element={<Import />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            {/* 其他路由根据菜单动态配置 */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AntdApp>
    </BrowserRouter>
  )
}

export default App

