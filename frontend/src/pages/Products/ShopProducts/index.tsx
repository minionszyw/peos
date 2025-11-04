/**
 * 店铺商品管理页面
 */
import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, InputNumber, message, Select, Input } from 'antd'
import { EditOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ShopProduct } from '@/types/product'
import {
  getShopProductList,
  updateShopProduct,
  batchUpdateStatus,
  batchUpdatePrice,
} from '@/services/product'
import { getShopList } from '@/services/shop'
import { Shop } from '@/types/shop'
import styles from './index.module.scss'

const ShopProducts = () => {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filterShopId, setFilterShopId] = useState<number>()
  const [filterStatus, setFilterStatus] = useState<string>()
  const [keyword, setKeyword] = useState<string>()
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  // 加载商品列表
  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getShopProductList({
        shop_id: filterShopId,
        status: filterStatus,
        keyword,
        limit: 500,
      })
      setProducts(data)
    } catch (error) {
      console.error('加载商品列表失败:', error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    loadProducts()
    loadShops()
  }, [filterShopId, filterStatus])

  // 批量上架
  const handleBatchOnShelf = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品')
      return
    }

    try {
      await batchUpdateStatus({
        ids: selectedRowKeys as number[],
        status: 'on_shelf',
      })
      message.success('批量上架成功')
      setSelectedRowKeys([])
      loadProducts()
    } catch (error) {
      console.error('批量上架失败:', error)
    }
  }

  // 批量下架
  const handleBatchOffShelf = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品')
      return
    }

    try {
      await batchUpdateStatus({
        ids: selectedRowKeys as number[],
        status: 'off_shelf',
      })
      message.success('批量下架成功')
      setSelectedRowKeys([])
      loadProducts()
    } catch (error) {
      console.error('批量下架失败:', error)
    }
  }

  // 批量改价
  const handleBatchPriceModal = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品')
      return
    }
    setPriceModalVisible(true)
  }

  const handleBatchPriceSubmit = async () => {
    try {
      const values = await form.validateFields()
      await batchUpdatePrice({
        ids: selectedRowKeys as number[],
        price: values.price,
      })
      message.success('批量改价成功')
      setPriceModalVisible(false)
      setSelectedRowKeys([])
      form.resetFields()
      loadProducts()
    } catch (error) {
      console.error('批量改价失败:', error)
    }
  }

  // 编辑商品
  const handleEdit = (product: ShopProduct) => {
    setEditingProduct(product)
    editForm.setFieldsValue({
      title: product.title,
      price: product.price,
      stock: product.stock,
      status: product.status,
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async () => {
    if (!editingProduct) return

    try {
      const values = await editForm.validateFields()
      await updateShopProduct(editingProduct.id, values)
      message.success('商品更新成功')
      setEditModalVisible(false)
      loadProducts()
    } catch (error) {
      console.error('更新商品失败:', error)
    }
  }

  const columns: ColumnsType<ShopProduct> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: '商品标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      ellipsis: true,
    },
    {
      title: '店铺',
      dataIndex: 'shop_name',
      key: 'shop_name',
      width: 120,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${price.toFixed(2)}`,
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
      render: (status: string) => (
        <Tag color={status === 'on_shelf' ? 'green' : 'red'}>
          {status === 'on_shelf' ? '在售' : '下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.shopProducts}>
      <div className={styles.header}>
        <h2>店铺商品管理</h2>
        <Space>
          <Select
            placeholder="筛选店铺"
            style={{ width: 150 }}
            allowClear
            onChange={setFilterShopId}
          >
            {shops.map((shop) => (
              <Select.Option key={shop.id} value={shop.id}>
                {shop.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="筛选状态"
            style={{ width: 120 }}
            allowClear
            onChange={setFilterStatus}
          >
            <Select.Option value="on_shelf">在售</Select.Option>
            <Select.Option value="off_shelf">下架</Select.Option>
          </Select>
          <Input.Search
            placeholder="搜索商品标题"
            style={{ width: 200 }}
            onSearch={setKeyword}
            allowClear
          />
        </Space>
      </div>

      <div className={styles.toolbar}>
        <Space>
          <span>已选择 {selectedRowKeys.length} 项</span>
          <Button
            icon={<ArrowUpOutlined />}
            onClick={handleBatchOnShelf}
            disabled={selectedRowKeys.length === 0}
          >
            批量上架
          </Button>
          <Button
            icon={<ArrowDownOutlined />}
            onClick={handleBatchOffShelf}
            disabled={selectedRowKeys.length === 0}
          >
            批量下架
          </Button>
          <Button
            icon={<DollarOutlined />}
            onClick={handleBatchPriceModal}
            disabled={selectedRowKeys.length === 0}
          >
            批量改价
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        scroll={{ x: 1200 }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      {/* 批量改价对话框 */}
      <Modal
        title="批量改价"
        open={priceModalVisible}
        onOk={handleBatchPriceSubmit}
        onCancel={() => setPriceModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="新价格"
            name="price"
            rules={[
              { required: true, message: '请输入价格' },
              { type: 'number', min: 0.01, message: '价格必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              prefix="¥"
              placeholder="请输入新价格"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑商品对话框 */}
      <Modal
        title="编辑商品"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="商品标题"
            name="title"
            rules={[{ required: true, message: '请输入商品标题' }]}
          >
            <Input placeholder="请输入商品标题" />
          </Form.Item>

          <Form.Item
            label="价格"
            name="price"
            rules={[
              { required: true, message: '请输入价格' },
              { type: 'number', min: 0.01, message: '价格必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              prefix="¥"
              placeholder="请输入价格"
            />
          </Form.Item>

          <Form.Item
            label="库存"
            name="stock"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="请输入库存"
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="on_shelf">在售</Select.Option>
              <Select.Option value="off_shelf">下架</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ShopProducts

