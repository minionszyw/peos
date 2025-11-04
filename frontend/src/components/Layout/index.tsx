/**
 * 主布局组件
 */
import { useState } from 'react'
import { Layout as AntLayout } from 'antd'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sider from './Sider'
import Breadcrumb from './Breadcrumb'
import styles from './index.module.scss'

const { Content } = AntLayout

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <AntLayout className={styles.layout}>
      <Sider collapsed={collapsed} />
      
      <AntLayout>
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        
        <Content className={styles.content}>
          <Breadcrumb />
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout

