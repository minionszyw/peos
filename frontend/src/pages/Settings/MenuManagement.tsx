/**
 * 菜单管理（固定菜单，仅支持编辑名称和排序）
 */
import { Card, Table, Button, Space, message, Modal, Form, Input, InputNumber } from 'antd'
import { EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getAllMenus, updateMenu } from '@/services/menus'
import type { MenuItem } from '@/services/menus'

const MenuManagement = () => {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      setLoading(true)
      const data = await getAllMenus()
      setMenus(data)
    } catch (error) {
      message.error('加载菜单失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开编辑弹窗
  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    form.setFieldsValue({
      name: menu.name,
      sort_order: menu.sort_order,
    })
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields()
      if (editingMenu) {
        await updateMenu(editingMenu.id, {
          name: values.name,
          sort_order: values.sort_order,
        })
        message.success('菜单更新成功')
        setEditModalVisible(false)
        loadMenus()
      }
    } catch (error: any) {
      if (error.errorFields) {
        return // 表单验证错误
      }
      message.error(error.response?.data?.detail || '更新失败')
    }
  }

  // 上移
  const handleMoveUp = async (menu: MenuItem, index: number) => {
    if (index === 0) return
    
    const prevMenu = menus[index - 1]
    try {
      // 交换排序值
      await updateMenu(menu.id, { sort_order: prevMenu.sort_order })
      await updateMenu(prevMenu.id, { sort_order: menu.sort_order })
      message.success('菜单顺序已更新')
      loadMenus()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新失败')
    }
  }

  // 下移
  const handleMoveDown = async (menu: MenuItem, index: number) => {
    if (index === menus.length - 1) return
    
    const nextMenu = menus[index + 1]
    try {
      // 交换排序值
      await updateMenu(menu.id, { sort_order: nextMenu.sort_order })
      await updateMenu(nextMenu.id, { sort_order: menu.sort_order })
      message.success('菜单顺序已更新')
      loadMenus()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新失败')
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
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '可见',
      dataIndex: 'is_visible',
      key: 'is_visible',
      width: 80,
      render: (val: number) => (val ? '是' : '否'),
    },
    {
      title: '所需角色',
      dataIndex: 'required_role',
      key: 'required_role',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: MenuItem, index: number) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveUp(record, index)}
          >
            上移
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<ArrowDownOutlined />}
            disabled={index === menus.length - 1}
            onClick={() => handleMoveDown(record, index)}
          >
            下移
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card title="菜单列表">
        <Table
          columns={columns}
          dataSource={menus}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 编辑菜单弹窗 */}
      <Modal
        title="编辑菜单"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false)
          form.resetFields()
        }}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="菜单名称"
            name="name"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sort_order"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default MenuManagement
