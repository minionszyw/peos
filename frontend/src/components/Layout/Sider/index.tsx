/**
 * 侧边栏菜单
 */
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  ShoppingOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UploadOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './index.module.scss'

const { Sider: AntSider } = Layout

interface SiderProps {
  collapsed: boolean
}

type MenuItem = Required<MenuProps>['items'][number]

const Sider = ({ collapsed }: SiderProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/shops',
      icon: <ShopOutlined />,
      label: '店铺管理',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品管理',
      children: [
        {
          key: '/products/warehouse',
          label: '仓库商品',
        },
        {
          key: '/products/shop',
          label: '店铺商品',
        },
        {
          key: '/products/inventory',
          label: '库存管理',
        },
      ],
    },
    {
      key: '/sales',
      icon: <BarChartOutlined />,
      label: '销售数据',
    },
    {
      key: '/worksheet',
      icon: <FileTextOutlined />,
      label: '工作表',
    },
    {
      key: '/import',
      icon: <UploadOutlined />,
      label: '数据导入',
    },
    {
      key: '/logs',
      icon: <HistoryOutlined />,
      label: '操作日志',
    },
  ]

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
        <DatabaseOutlined className={styles.logoIcon} />
        {!collapsed && <span className={styles.logoText}>运营系统</span>}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['/products']}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </AntSider>
  )
}

export default Sider

