/**
 * 平台管理
 */
import { Card, Table, Button, Space, Switch, message, Modal, Form, Input, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getPlatforms, deletePlatform, updatePlatform, createPlatform } from '@/services/platforms'
import type { Platform } from '@/services/platforms'

const PlatformManagement = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPlatforms()
  }, [])

  const loadPlatforms = async () => {
    try {
      setLoading(true)
      const data = await getPlatforms()
      setPlatforms(data)
    } catch (error) {
      message.error('加载平台失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开新增/编辑弹窗
  const handleOpenModal = (platform?: Platform) => {
    setEditingPlatform(platform || null)
    if (platform) {
      form.setFieldsValue({
        name: platform.name,
        code: platform.code,
        description: platform.description,
        icon: platform.icon,
        sort_order: platform.sort_order,
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 保存（新增或编辑）
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      if (editingPlatform) {
        // 编辑
        await updatePlatform(editingPlatform.id, values)
        message.success('平台更新成功')
      } else {
        // 新增
        await createPlatform(values)
        message.success('平台创建成功')
      }
      
      setModalVisible(false)
      form.resetFields()
      loadPlatforms()
    } catch (error: any) {
      if (error.errorFields) {
        return // 表单验证错误
      }
      message.error(error.response?.data?.detail || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await updatePlatform(id, { is_active: isActive ? 1 : 0 })
      message.success('更新成功')
      loadPlatforms()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deletePlatform(id)
      message.success('删除成功')
      loadPlatforms()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '平台名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '平台代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (val: number, record: Platform) => (
        <Switch
          checked={val === 1}
          onChange={(checked) => handleToggleActive(record.id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Platform) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card
        title="平台列表"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            新增平台
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={platforms}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 新增/编辑平台弹窗 */}
      <Modal
        title={editingPlatform ? '编辑平台' : '新增平台'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="平台名称"
            name="name"
            rules={[{ required: true, message: '请输入平台名称' }]}
          >
            <Input placeholder="如：淘宝、京东" />
          </Form.Item>
          <Form.Item
            label="平台代码"
            name="code"
            rules={[
              { required: true, message: '请输入平台代码' },
              { pattern: /^[a-z_]+$/, message: '平台代码只能包含小写字母和下划线' }
            ]}
          >
            <Input placeholder="如：taobao、jd" disabled={!!editingPlatform} />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="平台描述（可选）" />
          </Form.Item>
          <Form.Item
            label="图标"
            name="icon"
          >
            <Input placeholder="图标类名（可选）" />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sort_order"
            initialValue={0}
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default PlatformManagement
