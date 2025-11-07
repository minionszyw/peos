/**
 * 系统设置主页
 */
import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import { SettingOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'
import SystemSettings from './SystemSettings'
import MenuManagement from './MenuManagement'
import UserManagement from './UserManagement'
import { useUserStore } from '@/stores/userStore'
import styles from './index.module.scss'

const Settings = () => {
  const { user } = useUserStore()

  const items: TabsProps['items'] = [
    {
      key: 'system',
      label: (
        <span>
          <SettingOutlined />
          系统设置
        </span>
      ),
      children: <SystemSettings />,
    },
    {
      key: 'menus',
      label: (
        <span>
          <MenuOutlined />
          菜单管理
        </span>
      ),
      children: <MenuManagement />,
    },
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined />
          用户管理
        </span>
      ),
      children: <UserManagement />,
    },
  ]

  // 只有管理员可以访问设置页面
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>无权访问</h2>
        <p>只有管理员可以访问系统设置</p>
      </div>
    )
  }

  return (
    <div className={styles.settings}>
      <h2 className={styles.title}>系统设置</h2>
      <Tabs items={items} />
    </div>
  )
}

export default Settings
