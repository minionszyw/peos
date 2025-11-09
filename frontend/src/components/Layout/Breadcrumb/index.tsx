/**
 * 面包屑导航
 */
import { Breadcrumb as AntBreadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useLocation, Link } from 'react-router-dom'
import styles from './index.module.scss'

const breadcrumbNameMap: Record<string, string> = {
  '/': '首页',
  '/platform-data': '平台数据',
  '/shops': '店铺管理',
  '/logs': '操作日志',
  '/settings': '系统设置',
  '/profile': '个人中心',
}

const Breadcrumb = () => {
  const location = useLocation()
  const pathSnippets = location.pathname.split('/').filter((i) => i)

  const breadcrumbItems = [
    {
      key: 'home',
      title: (
        <Link to="/">
          <HomeOutlined />
        </Link>
      ),
    },
  ]

  pathSnippets.forEach((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`
    const title = breadcrumbNameMap[url]

    if (title) {
      breadcrumbItems.push({
        key: url,
        title: index === pathSnippets.length - 1 ? title : <Link to={url}>{title}</Link>,
      })
    }
  })

  return (
    <div className={styles.breadcrumb}>
      <AntBreadcrumb items={breadcrumbItems} />
    </div>
  )
}

export default Breadcrumb

