/**
 * 用户管理
 */
import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { User } from '@/types/user'
import { getUserList, createUser, updateUser, deleteUser } from '@/services/users'
import { useUserStore } from '@/stores/userStore'

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const { user: currentUser } = useUserStore()

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getUserList()
      setUsers(data)
    } catch (error) {
      console.error('加载用户列表失败:', error)
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // 打开新建/编辑对话框
  const handleOpenModal = (user?: User) => {
    setEditingUser(user || null)
    if (user) {
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingUser) {
        // 编辑用户（不包含密码）
        const updateData: any = {
          name: values.name,
          role: values.role,
          email: values.email,
          phone: values.phone,
        }
        
        // 如果提供了新密码，则包含密码
        if (values.password) {
          updateData.password = values.password
        }
        
        await updateUser(editingUser.id, updateData)
        message.success('用户更新成功')
      } else {
        // 新建用户
        await createUser({
          username: values.username,
          password: values.password,
          name: values.name,
          role: values.role,
          email: values.email,
          phone: values.phone,
        })
        message.success('用户创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      loadUsers()
    } catch (error: any) {
      if (error.errorFields) {
        return // 表单验证错误
      }
      message.error(error.response?.data?.detail || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除用户
  const handleDelete = async (userId: number) => {
    try {
      setLoading(true)
      await deleteUser(userId)
      message.success('用户删除成功')
      loadUsers()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'blue' : 'green'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.id === currentUser?.id}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.id === currentUser?.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          新增用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      {/* 新增/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input 
              placeholder="用户登录账号" 
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item
            label={editingUser ? '密码（留空表示不修改）' : '密码'}
            name="password"
            rules={editingUser ? [] : [
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder={editingUser ? '留空表示不修改密码' : '请输入密码'} />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="用户真实姓名" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="operator"
          >
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="operator">普通用户</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="电子邮箱（可选）" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
          >
            <Input placeholder="手机号码（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default UserManagement
