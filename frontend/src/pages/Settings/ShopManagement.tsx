/**
 * 店铺管理组件（系统设置页面的子组件）
 */
import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Shop, ShopCreate, ShopUpdate } from '@/types/shop'
import { getShopList, createShop, updateShop, deleteShop } from '@/services/shop'
import { getUserList } from '@/services/auth'
import { User } from '@/types/user'
import { getPlatforms, Platform } from '@/services/platforms'

const ShopManagement = () => {
  const [shops, setShops] = useState<Shop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [form] = Form.useForm()

  // 加载店铺列表
  const loadShops = async () => {
    try {
      setLoading(true)
      const data = await getShopList()
      setShops(data)
    } catch (error) {
      console.error('加载店铺列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const data = await getUserList()
      setUsers(data)
    } catch (error) {
      console.error('加载用户列表失败:', error)
    }
  }

  // 加载平台列表
  const loadPlatforms = async () => {
    try {
      const data = await getPlatforms({ is_active: 1 })
      setPlatforms(data)
    } catch (error) {
      console.error('加载平台列表失败:', error)
    }
  }

  useEffect(() => {
    loadShops()
    loadUsers()
    loadPlatforms()
  }, [])

  // 打开新建/编辑对话框
  const handleOpenModal = (shop?: Shop) => {
    setEditingShop(shop || null)
    if (shop) {
      form.setFieldsValue(shop)
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingShop) {
        // 更新店铺
        await updateShop(editingShop.id, values as ShopUpdate)
        message.success('店铺更新成功')
      } else {
        // 创建店铺
        await createShop(values as ShopCreate)
        message.success('店铺创建成功')
      }
      
      setModalVisible(false)
      loadShops()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 删除店铺
  const handleDelete = async (id: number) => {
    try {
      await deleteShop(id)
      message.success('店铺删除成功')
      loadShops()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const columns: ColumnsType<Shop> = [
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
      width: 120,
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
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个店铺吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          新建店铺
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={shops}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingShop ? '编辑店铺' : '新建店铺'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'active' }}
        >
          <Form.Item
            label="店铺名称"
            name="name"
            rules={[{ required: true, message: '请输入店铺名称' }]}
          >
            <Input placeholder="请输入店铺名称" />
          </Form.Item>

          <Form.Item
            label="平台"
            name="platform"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="请选择平台">
              {platforms.map((platform) => (
                <Select.Option key={platform.id} value={platform.name}>
                  {platform.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="店铺账号"
            name="account"
          >
            <Input placeholder="请输入店铺账号" />
          </Form.Item>

          <Form.Item
            label="管理员"
            name="manager_id"
          >
            <Select placeholder="请选择管理员" allowClear>
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ShopManagement

