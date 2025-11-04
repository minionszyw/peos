/**
 * 面包屑导航
 */
import { Breadcrumb as AntBreadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useLocation, Link } from 'react-router-dom'
import styles from './index.module.scss'

const breadcrumbNameMap: Record<string, string> = {
  '/': '数据看板',
  '/shops': '店铺管理',
  '/products': '商品管理',
  '/products/warehouse': '仓库商品',
  '/products/shop': '店铺商品',
  '/products/inventory': '库存管理',
  '/sales': '销售数据',
  '/worksheet': '工作表',
  '/import': '数据导入',
  '/logs': '操作日志',
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

