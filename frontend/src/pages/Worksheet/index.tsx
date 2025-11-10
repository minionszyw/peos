import { Card, Empty, Typography } from 'antd'
import styles from './index.module.scss'

const { Paragraph } = Typography

const Worksheet = () => {
  return (
    <div className={styles.container}>
      <Card title="工作表格" variant="borderless">
        <Empty description="工作表格功能开发中" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Paragraph type="secondary">
            该模块用于配置和管理跨部门工作报表，当前仍在规划阶段。欢迎联系产品团队补充业务需求。
          </Paragraph>
        </Empty>
      </Card>
    </div>
  )
}

export default Worksheet


