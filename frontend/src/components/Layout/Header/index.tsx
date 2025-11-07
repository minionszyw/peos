/**
 * 头部导航栏
 */
import { Layout, Button, Avatar, Dropdown, Space } from 'antd'
import type { MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import styles from './index.module.scss'

const { Header: AntHeader } = Layout

interface HeaderProps {
  collapsed: boolean
  onToggle: () => void
}

const Header = ({ collapsed, onToggle }: HeaderProps) => {
  const navigate = useNavigate()
  const { user, logout } = useUserStore()

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'logout':
        logout()
        navigate('/login')
        break
      case 'profile':
        navigate('/profile')
        break
    }
  }

  return (
    <AntHeader className={styles.header}>
      <div className={styles.left}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className={styles.trigger}
        />
      </div>

      <div className={styles.right}>
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
          <Space className={styles.userInfo}>
            <Avatar icon={<UserOutlined />} />
            <span className={styles.username}>{user?.name}</span>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  )
}

export default Header

