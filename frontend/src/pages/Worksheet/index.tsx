/**
 * 工作表页面
 */
import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Modal, Form, Input, Select, message,
  Popconfirm, Tag, InputNumber, Dropdown, Card
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, DownOutlined, EditOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import {
  getWorksheetList, createWorksheet, updateWorksheet, deleteWorksheet,
  queryWorksheetData, batchUpdateStatus, batchUpdatePrice,
  type Worksheet
} from '@/services/worksheet'
import { getShopList } from '@/services/shop'
import type { Shop } from '@/types/shop'
import styles from './index.module.scss'

interface ProductData {
  id: number
  shop_id: number
  shop_name?: string
  platform?: string
  warehouse_product_id: number
  sku?: string
  warehouse_product_name?: string
  title: string
  price: number
  cost_price?: number
  status: string
  stock: number
  product_url?: string
}

const WorksheetPage = () => {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [currentWorksheet, setCurrentWorksheet] = useState<Worksheet | null>(null)
  const [products, setProducts] = useState<ProductData[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingWorksheet, setEditingWorksheet] = useState<Worksheet | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  const [filters, setFilters] = useState<any>({})
  
  const [form] = Form.useForm()
  const [priceForm] = Form.useForm()

  // 加载工作表列表
  const loadWorksheets = async () => {
    try {
      const data = await getWorksheetList()
      setWorksheets(data)
      if (data.length > 0 && !currentWorksheet) {
        setCurrentWorksheet(data[0])
      }
    } catch (error) {
      console.error('加载工作表列表失败:', error)
    }
  }

  // 加载店铺列表
  const loadShops = async () => {
    try {
      const data = await getShopList()
      setShops(data)
    } catch (error) {
      console.error('加载店铺列表失败:', error)
    }
  }

  // 加载工作表数据
  const loadWorksheetData = async (worksheetId: number, page = 1, pageSize = 50) => {
    try {
      setLoading(true)
      const response = await queryWorksheetData({
        worksheet_id: worksheetId,
        ...filters,
        page,
        page_size: pageSize
      })
      setProducts(response.data || [])
      setPagination({
        current: response.page || 1,
        pageSize: response.page_size || 50,
        total: response.total || 0
      })
    } catch (error) {
      console.error('加载工作表数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorksheets()
    loadShops()
  }, [])

  useEffect(() => {
    if (currentWorksheet) {
      loadWorksheetData(currentWorksheet.id)
    }
  }, [currentWorksheet, filters])

  // 打开工作表弹窗
  const handleOpenModal = (worksheet?: Worksheet) => {
    setEditingWorksheet(worksheet || null)
    if (worksheet) {
      form.setFieldsValue(worksheet)
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 提交工作表表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingWorksheet) {
        await updateWorksheet(editingWorksheet.id, values)
        message.success('工作表更新成功')
      } else {
        await createWorksheet(values)
        message.success('工作表创建成功')
      }
      
      setModalVisible(false)
      loadWorksheets()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 删除工作表
  const handleDelete = async (id: number) => {
    try {
      await deleteWorksheet(id)
      message.success('工作表删除成功')
      loadWorksheets()
      if (currentWorksheet?.id === id) {
        setCurrentWorksheet(null)
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 批量操作菜单
  const batchMenuItems: MenuProps['items'] = [
    {
      key: 'on_shelf',
      label: '批量上架',
      icon: <CheckCircleOutlined />,
      onClick: () => handleBatchStatus('on_shelf')
    },
    {
      key: 'off_shelf',
      label: '批量下架',
      icon: <CloseCircleOutlined />,
      onClick: () => handleBatchStatus('off_shelf')
    },
    {
      key: 'price',
      label: '批量改价',
      icon: <EditOutlined />,
      onClick: () => setPriceModalVisible(true)
    }
  ]

  // 批量更新状态
  const handleBatchStatus = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品')
      return
    }

    try {
      await batchUpdateStatus(selectedRowKeys as number[], status)
      message.success(`批量${status === 'on_shelf' ? '上架' : '下架'}成功`)
      setSelectedRowKeys([])
      if (currentWorksheet) {
        loadWorksheetData(currentWorksheet.id, pagination.current, pagination.pageSize)
      }
    } catch (error) {
      console.error('批量操作失败:', error)
      message.error('批量操作失败')
    }
  }

  // 批量改价
  const handleBatchPrice = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品')
      return
    }

    try {
      const values = await priceForm.validateFields()
      await batchUpdatePrice(selectedRowKeys as number[], values.price)
      message.success('批量改价成功')
      setPriceModalVisible(false)
      priceForm.resetFields()
      setSelectedRowKeys([])
      if (currentWorksheet) {
        loadWorksheetData(currentWorksheet.id, pagination.current, pagination.pageSize)
      }
    } catch (error) {
      console.error('批量改价失败:', error)
      message.error('批量改价失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<ProductData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: '店铺',
      dataIndex: 'shop_name',
      key: 'shop_name',
      width: 150,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
    },
    {
      title: '商品标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '售价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: '成本价',
      dataIndex: 'cost_price',
      key: 'cost_price',
      width: 100,
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-',
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: any = {
          on_shelf: { text: '在售', color: 'green' },
          off_shelf: { text: '下架', color: 'red' },
          draft: { text: '草稿', color: 'default' },
        }
        const s = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <div className={styles.worksheet}>
      <div className={styles.header}>
        <Space>
          <h2>工作表</h2>
          <Select
            style={{ width: 200 }}
            value={currentWorksheet?.id}
            onChange={(id) => {
              const ws = worksheets.find(w => w.id === id)
              setCurrentWorksheet(ws || null)
            }}
            options={worksheets.map(w => ({ label: w.name, value: w.id }))}
            placeholder="选择工作表"
          />
        </Space>
        <div className={styles.actions}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            新建工作表
          </Button>
          {currentWorksheet && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleOpenModal(currentWorksheet)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个工作表吗？"
                onConfirm={() => handleDelete(currentWorksheet.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      {currentWorksheet && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              <Select
                style={{ width: 200 }}
                placeholder="选择店铺"
                allowClear
                onChange={(value) => setFilters({ ...filters, shop_id: value })}
                options={shops.map(s => ({ label: s.name, value: s.id }))}
              />
              <Select
                style={{ width: 150 }}
                placeholder="选择状态"
                allowClear
                onChange={(value) => setFilters({ ...filters, status: value })}
                options={[
                  { label: '在售', value: 'on_shelf' },
                  { label: '下架', value: 'off_shelf' },
                  { label: '草稿', value: 'draft' },
                ]}
              />
              <Input.Search
                style={{ width: 250 }}
                placeholder="搜索商品标题"
                allowClear
                onSearch={(value) => setFilters({ ...filters, keyword: value })}
              />
            </div>
          </div>

          <div className={styles.content}>
            {selectedRowKeys.length > 0 && (
              <div className={styles.batchActions}>
                <span>已选择 {selectedRowKeys.length} 项</span>
                <Dropdown menu={{ items: batchMenuItems }}>
                  <Button>
                    批量操作 <DownOutlined />
                  </Button>
                </Dropdown>
              </div>
            )}

            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={products}
              loading={loading}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  if (currentWorksheet) {
                    loadWorksheetData(currentWorksheet.id, page, pageSize)
                  }
                }
              }}
            />
          </div>
        </>
      )}

      {/* 工作表表单弹窗 */}
      <Modal
        title={editingWorksheet ? '编辑工作表' : '新建工作表'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="工作表名称"
            name="name"
            rules={[{ required: true, message: '请输入工作表名称' }]}
          >
            <Input placeholder="请输入工作表名称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量改价弹窗 */}
      <Modal
        title="批量改价"
        open={priceModalVisible}
        onOk={handleBatchPrice}
        onCancel={() => {
          setPriceModalVisible(false)
          priceForm.resetFields()
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={priceForm} layout="vertical">
          <Form.Item
            label="新价格"
            name="price"
            rules={[{ required: true, message: '请输入新价格' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="请输入新价格"
              prefix="¥"
            />
          </Form.Item>
          <div style={{ color: '#666' }}>
            将对选中的 {selectedRowKeys.length} 个商品进行改价
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default WorksheetPage

