import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Shops from '@/pages/Shops'
import Import from '@/pages/Import'
import ShopProducts from '@/pages/Products/ShopProducts'
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
            <Route index element={<Home />} />
            <Route path="shops" element={<Shops />} />
            <Route path="products/shop" element={<ShopProducts />} />
            <Route path="import" element={<Import />} />
            {/* 其他路由将在后续添加 */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AntdApp>
    </BrowserRouter>
  )
}

export default App

