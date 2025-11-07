/**
 * 数据表组件 - 显示店铺数据并支持导入
 */
import { useState, useEffect } from 'react'
import { Card, Table, Button, Upload, message, Modal, Select, Tabs, Space } from 'antd'
import { UploadOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import { Shop } from '@/types/shop'
import { uploadAndImport, getImportTemplate } from '@/services/import'
import { useUserStore } from '@/stores/userStore'
import TemplateEditor from './TemplateEditor'

interface DataTableProps {
  selectedNode: any
  shops: Shop[]
  onRefresh: () => void
}

const DataTable = ({ selectedNode, shops, onRefresh }: DataTableProps) => {
  const { user } = useUserStore()
  const [tableType, setTableType] = useState<string>('warehouse_products')
  const [loading, setLoading] = useState(false)
  const [templateEditorVisible, setTemplateEditorVisible] = useState(false)

  const tableTypeOptions = [
    { value: 'warehouse_products', label: '仓库商品' },
    { value: 'shop_products', label: '店铺商品' },
    { value: 'inventory', label: '库存数据' },
    { value: 'sales', label: '销售数据' },
  ]

  // 店铺表格列
  const shopColumns: ColumnsType<Shop> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '店铺名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '店铺账号',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: '管理员',
      dataIndex: 'manager_name',
      key: 'manager_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'active' ? '#52c41a' : '#ff4d4f' }}>
          {status === 'active' ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
  ]

  // 获取要显示的店铺数据
  const getDisplayShops = () => {
    if (!selectedNode) {
      return shops
    }
    if (selectedNode.type === 'platform') {
      const platformName = selectedNode.data.name
      return shops.filter((shop) => shop.platform === platformName)
    }
    if (selectedNode.type === 'shop') {
      return [selectedNode.data as Shop]
    }
    return []
  }

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      await getImportTemplate(tableType)
      message.success('模板下载成功')
    } catch (error) {
      message.error('模板下载失败')
    }
  }

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls,.csv',
    showUploadList: false,
    customRequest: async (options) => {
      const { file } = options
      try {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file as File)
        formData.append('table_type', tableType)

        const result = await uploadAndImport(file as File, tableType)
        
        if (result.status === 'success') {
          message.success(`导入成功！共${result.total_rows}条，成功${result.success_rows}条`)
        } else if (result.status === 'partial_success') {
          Modal.warning({
            title: '部分导入成功',
            content: (
              <div>
                <p>共{result.total_rows}条，成功{result.success_rows}条，失败{result.error_count}条</p>
                {result.errors && result.errors.length > 0 && (
                  <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    <p>错误信息：</p>
                    <ul>
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
          })
        } else {
          message.error('导入失败')
        }
        onRefresh()
      } catch (error) {
        message.error('导入失败')
      } finally {
        setLoading(false)
      }
    },
  }

  const displayShops = getDisplayShops()

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {!selectedNode && '所有店铺'}
            {selectedNode?.type === 'platform' && `${selectedNode.data.name} - 店铺列表`}
            {selectedNode?.type === 'shop' && `${selectedNode.data.name} - 店铺数据`}
          </span>
          <Space>
            <Select
              value={tableType}
              onChange={setTableType}
              options={tableTypeOptions}
              style={{ width: 150 }}
            />
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              下载模板
            </Button>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={loading}>
                导入数据
              </Button>
            </Upload>
            {user?.role === 'admin' && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setTemplateEditorVisible(true)}
              >
                模板设置
              </Button>
            )}
          </Space>
        </div>
      }
      bordered={false}
    >
      <Tabs
        defaultActiveKey="shops"
        items={[
          {
            key: 'shops',
            label: '店铺列表',
            children: (
              <Table
                columns={shopColumns}
                dataSource={displayShops}
                rowKey="id"
                pagination={{
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            ),
          },
          {
            key: 'data',
            label: '数据概览',
            children: (
              <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                <p>数据统计功能开发中...</p>
                <p>将显示：商品数量、库存总量、销售统计等</p>
              </div>
            ),
          },
        ]}
      />

      {/* 模板编辑器 */}
      <TemplateEditor
        visible={templateEditorVisible}
        tableType={tableType}
        onClose={() => setTemplateEditorVisible(false)}
        onSave={() => {
          setTemplateEditorVisible(false)
          message.success('模板保存成功')
        }}
      />
    </Card>
  )
}

export default DataTable

