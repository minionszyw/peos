/**
 * 首页
 */
import { useUserStore } from '@/stores/userStore'
import styles from './index.module.scss'

const Home = () => {
  const { user } = useUserStore()

  return (
    <div className={styles.home}>
      <h1>欢迎使用电商运营系统</h1>
      <p>当前用户：{user?.name} ({user?.role === 'admin' ? '管理员' : '运营'})</p>
    </div>
  )
}

export default Home

