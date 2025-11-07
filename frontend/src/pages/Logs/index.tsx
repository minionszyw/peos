/**
 * 操作日志页面
 */
import { useState, useEffect } from 'react'
import {
  Table, Select, DatePicker, Button, Space, Modal, Tag, Descriptions
} from 'antd'
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getLogList, getLog, type OperationLog } from '@/services/logs'
import { getUserList } from '@/services/auth'
import type { User } from '@/types/user'
import styles from './index.module.scss'

const { RangePicker } = DatePicker

const LogsPage = () => {
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState<OperationLog | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  const [filters, setFilters] = useState<any>({})

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const data = await getUserList()
      setUsers(data)
    } catch (error) {
      console.error('加载用户列表失败:', error)
    }
  }

  // 加载日志列表
  const loadLogs = async (page = 1, pageSize = 50) => {
    try {
      setLoading(true)
      const data = await getLogList({
        ...filters,
        page,
        page_size: pageSize
      })
      setLogs(data)
      // 注意：后端可能需要返回总数
      setPagination({ current: page, pageSize, total: data.length })
    } catch (error) {
      console.error('加载日志列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [filters])

  // 查看详情
  const handleViewDetail = async (log: OperationLog) => {
    try {
      const detail = await getLog(log.id)
      setCurrentLog(detail)
      setDetailModalVisible(true)
    } catch (error) {
      console.error('获取日志详情失败:', error)
    }
  }

  // 操作类型映射
  const actionTypeMap: any = {
    create: { text: '创建', color: 'green' },
    update: { text: '更新', color: 'blue' },
    delete: { text: '删除', color: 'red' },
  }

  // 表名映射
  const tableNameMap: any = {
    shops: '店铺',
    shop_products: '店铺商品',
    warehouse_products: '仓库商品',
    users: '用户',
    dashboards: '看板',
    worksheets: '工作表',
  }

  // 表格列定义
  const columns: ColumnsType<OperationLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '操作人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type: string) => {
        const action = actionTypeMap[type] || { text: type, color: 'default' }
        return <Tag color={action.color}>{action.text}</Tag>
      },
    },
    {
      title: '操作表',
      dataIndex: 'table_name',
      key: 'table_name',
      width: 150,
      render: (name: string) => tableNameMap[name] || name,
    },
    {
      title: '记录ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 100,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.logs}>
      <div className={styles.header}>
        <h2>操作日志</h2>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <Select
            style={{ width: 150 }}
            placeholder="选择操作人"
            allowClear
            onChange={(value) => setFilters({ ...filters, user_id: value })}
            options={users.map(u => ({ label: u.name, value: u.id }))}
          />
          <Select
            style={{ width: 120 }}
            placeholder="操作类型"
            allowClear
            onChange={(value) => setFilters({ ...filters, action_type: value })}
            options={[
              { label: '创建', value: 'create' },
              { label: '更新', value: 'update' },
              { label: '删除', value: 'delete' },
            ]}
          />
          <Select
            style={{ width: 150 }}
            placeholder="操作表"
            allowClear
            onChange={(value) => setFilters({ ...filters, table_name: value })}
            options={[
              { label: '店铺', value: 'shops' },
              { label: '店铺商品', value: 'shop_products' },
              { label: '仓库商品', value: 'warehouse_products' },
              { label: '用户', value: 'users' },
              { label: '看板', value: 'dashboards' },
              { label: '工作表', value: 'worksheets' },
            ]}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  start_date: dates[0]?.format('YYYY-MM-DD HH:mm:ss'),
                  end_date: dates[1]?.format('YYYY-MM-DD HH:mm:ss'),
                })
              } else {
                const { start_date, end_date, ...rest } = filters
                setFilters(rest)
              }
            }}
            showTime
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadLogs(pagination.current, pagination.pageSize)}
          >
            刷新
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              loadLogs(page, pageSize)
            }
          }}
        />
      </div>

      {/* 日志详情弹窗 */}
      <Modal
        title="操作日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {currentLog && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="日志ID">{currentLog.id}</Descriptions.Item>
              <Descriptions.Item label="记录ID">{currentLog.record_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作人">{currentLog.user_name}</Descriptions.Item>
              <Descriptions.Item label="操作类型">
                {actionTypeMap[currentLog.action_type]?.text || currentLog.action_type}
              </Descriptions.Item>
              <Descriptions.Item label="操作表">
                {tableNameMap[currentLog.table_name] || currentLog.table_name}
              </Descriptions.Item>
              <Descriptions.Item label="操作时间">
                {dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <div className={styles.comparison}>
                {currentLog.old_value && (
                  <div className={styles.comparisonColumn}>
                    <h4>变更前</h4>
                    <div className={styles.jsonViewer}>
                      <pre>{JSON.stringify(currentLog.old_value, null, 2)}</pre>
                    </div>
                  </div>
                )}
                {currentLog.new_value && (
                  <div className={styles.comparisonColumn}>
                    <h4>{currentLog.old_value ? '变更后' : '新值'}</h4>
                    <div className={styles.jsonViewer}>
                      <pre>{JSON.stringify(currentLog.new_value, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default LogsPage

