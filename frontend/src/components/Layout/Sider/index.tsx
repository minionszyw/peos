/**
 * 侧边栏菜单 - 动态加载
 */
import { Layout, Menu, Spin } from 'antd'
import type { MenuProps } from 'antd'
import * as Icons from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMenuTree, type MenuItem as MenuItemType } from '@/services/menus'
import { getSettingByKey } from '@/services/settings'
import styles from './index.module.scss'

const { Sider: AntSider } = Layout

interface SiderProps {
  collapsed: boolean
}

type MenuItem = Required<MenuProps>['items'][number]

const Sider = ({ collapsed }: SiderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [systemName, setSystemName] = useState('运营系统')

  // 动态获取图标组件
  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent /> : null
  }

  // 递归转换菜单数据
  const transformMenuData = (menus: MenuItemType[]): MenuItem[] => {
    return menus.map(menu => ({
      key: menu.path || menu.id.toString(),
      icon: getIcon(menu.icon),
      label: menu.name,
      children: menu.children && menu.children.length > 0 
        ? transformMenuData(menu.children) 
        : undefined
    }))
  }

  // 加载菜单数据
  const loadMenus = async () => {
    try {
      setLoading(true)
      const menus = await getMenuTree()
      const transformedMenus = transformMenuData(menus)
      setMenuItems(transformedMenus)
    } catch (error) {
      console.error('加载菜单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载系统配置
  const loadSystemName = async () => {
    try {
      const setting = await getSettingByKey('system_name')
      if (setting && setting.value) {
        setSystemName(setting.value)
      }
    } catch (error) {
      console.error('加载系统名称失败:', error)
    }
  }

  useEffect(() => {
    loadMenus()
    loadSystemName()
  }, [])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  return (
    <AntSider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={styles.sider}
      width={200}
    >
      <div className={styles.logo}>
        <Icons.DatabaseOutlined className={styles.logoIcon} />
        {!collapsed && <span className={styles.logoText}>{systemName}</span>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : (
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      )}
    </AntSider>
  )
}

export default Sider

