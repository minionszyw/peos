/**
 * 数据表组件 - 显示数据表数据
 */
import { useState, useEffect } from 'react'
import { Card, Table, Empty, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { queryDataTableData } from '@/services/dataTable'

interface DataTableProps {
  selectedNode: any
  shops: any[]
  onRefresh: () => void
  refreshKey?: number
}

const DataTable = ({ selectedNode, shops, onRefresh, refreshKey = 0 }: DataTableProps) => {
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 加载数据表数据
  const loadTableData = async () => {
    if (!selectedNode || selectedNode.type !== 'data_table') {
      return
    }

    try {
      setLoading(true)
      const result = await queryDataTableData({
        data_table_id: selectedNode.nodeData.id,
        table_type: selectedNode.nodeData.table_type,
        shop_id: selectedNode.nodeData.shop_id,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      })
      setTableData(result.items || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedNode?.type === 'data_table') {
      loadTableData()
    }
  }, [selectedNode, page, pageSize, refreshKey])

  useEffect(() => {
    if (selectedNode?.type === 'data_table') {
      setPage(1)
    }
  }, [selectedNode?.nodeData?.id])

  // 动态生成表格列（基于字段配置）
  const generateColumns = (): ColumnsType<any> => {
    // 优先使用数据表定义的字段配置
    const fields = selectedNode?.nodeData?.fields
    
    if (fields && Array.isArray(fields) && fields.length > 0) {
      return fields.map((field: any) => ({
        title: field.description || field.name,
        dataIndex: field.name,
        key: field.name,
        ellipsis: true,
        width: 150,
        render: (text: any) => {
          if (text === null || text === undefined) {
            return '-'
          }
          if (typeof text === 'object') {
            return JSON.stringify(text)
          }
          // 根据字段类型格式化显示
          if (field.type === 'date') {
            try {
              return new Date(text).toLocaleDateString('zh-CN')
            } catch {
              return text
            }
          }
          if (field.type === 'number') {
            return typeof text === 'number' ? text.toLocaleString() : text
          }
          if (field.type === 'boolean') {
            return text ? '是' : '否'
          }
          return String(text)
        },
      }))
    }

    // 如果没有字段配置且有数据，从第一行数据推断列
    if (tableData.length > 0) {
      const firstRow = tableData[0]
      return Object.keys(firstRow).map((key) => ({
        title: key,
        dataIndex: key,
        key: key,
        ellipsis: true,
        width: 150,
        render: (text: any) => {
          if (text === null || text === undefined) {
            return '-'
          }
          if (typeof text === 'object') {
            return JSON.stringify(text)
          }
          return String(text)
        },
      }))
    }

    return []
  }

  // 渲染不同类型节点的内容
  const renderContent = () => {
    if (!selectedNode) {
      return (
        <Empty
          description="请在左侧选择平台、店铺或数据表"
          style={{ padding: '60px 0' }}
        />
      )
    }

    if (selectedNode.type === 'platform') {
      const platformShops = shops.filter(
        (shop) => shop.platform_id === selectedNode.nodeData.id
      )
      return (
        <div>
          <Card title="平台信息" size="small" style={{ marginBottom: 16 }}>
            <p><strong>平台名称：</strong>{selectedNode.nodeData.name}</p>
            <p><strong>平台代码：</strong>{selectedNode.nodeData.code || '-'}</p>
            <p><strong>店铺数量：</strong>{platformShops.length}</p>
          </Card>
          <Empty description="请选择店铺或数据表查看数据" />
        </div>
      )
    }

    if (selectedNode.type === 'shop') {
      return (
        <div>
          <Card title="店铺信息" size="small" style={{ marginBottom: 16 }}>
            <p><strong>店铺名称：</strong>{selectedNode.nodeData.name}</p>
            <p><strong>平台：</strong>{selectedNode.nodeData.platform_name || '-'}</p>
            <p><strong>店铺账号：</strong>{selectedNode.nodeData.account || '-'}</p>
          </Card>
          <Empty description="请选择数据表查看数据" />
        </div>
      )
    }

    if (selectedNode.type === 'data_table') {
      return (
        <Spin spinning={loading}>
          <Table
            columns={generateColumns()}
            dataSource={tableData}
            rowKey={(record) => record.id ?? record._id ?? Math.random()}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setPage(page)
                setPageSize(pageSize)
              },
            }}
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      )
    }

    return null
  }

  return (
    <Card
      title={
        <span>
          {!selectedNode && '数据查看'}
          {selectedNode?.type === 'platform' && `${selectedNode.nodeData.name} - 平台数据`}
          {selectedNode?.type === 'shop' && `${selectedNode.nodeData.name} - 店铺数据`}
          {selectedNode?.type === 'data_table' && `${selectedNode.nodeData.name}`}
        </span>
      }
      bordered={false}
    >
      {renderContent()}
    </Card>
  )
}

export default DataTable
