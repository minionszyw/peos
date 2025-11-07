/**
 * 字段配置编辑器组件
 */
import { useState } from 'react'
import { Table, Button, Form, Input, Select, Switch, Space, Modal, message, Dropdown } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined, DownOutlined } from '@ant-design/icons'
import type { ColumnsType, TableRowSelection } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { FieldConfig } from '@/services/dataTable'

interface FieldConfigEditorProps {
  value?: FieldConfig[]
  onChange?: (value: FieldConfig[]) => void
}

const FieldConfigEditor = ({ value = [], onChange }: FieldConfigEditorProps) => {
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()

  const fieldTypes = [
    { label: '文本', value: 'text' },
    { label: '数字', value: 'number' },
    { label: '日期', value: 'date' },
    { label: '布尔值', value: 'boolean' },
  ]

  const columns: ColumnsType<FieldConfig & { index: number }> = [
    {
      title: '字段名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '字段类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeLabel = fieldTypes.find((t) => t.value === type)?.label
        return typeLabel || type
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      width: 80,
      render: (required: boolean) => (required ? '是' : '否'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => handleMoveUp(record.index)}
            disabled={record.index === 0}
          >
            上移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => handleMoveDown(record.index)}
            disabled={record.index === value.length - 1}
          >
            下移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.index)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.index)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleAdd = () => {
    setEditingField(null)
    setEditingIndex(-1)
    form.resetFields()
    form.setFieldsValue({ required: false, type: 'text' })
    setEditModalVisible(true)
  }

  const handleEdit = (index: number) => {
    setEditingField(value[index])
    setEditingIndex(index)
    form.setFieldsValue(value[index])
    setEditModalVisible(true)
  }

  const handleDelete = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange?.(newValue)
    message.success('删除成功')
  }

  // 上移
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newValue = [...value]
    const temp = newValue[index]
    newValue[index] = newValue[index - 1]
    newValue[index - 1] = temp
    onChange?.(newValue)
    message.success('上移成功')
  }

  // 下移
  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return
    const newValue = [...value]
    const temp = newValue[index]
    newValue[index] = newValue[index + 1]
    newValue[index + 1] = temp
    onChange?.(newValue)
    message.success('下移成功')
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的字段')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个字段吗？`,
      onOk: () => {
        const newValue = value.filter((_, index) => !selectedRowKeys.includes(index))
        onChange?.(newValue)
        setSelectedRowKeys([])
        message.success('删除成功')
      },
    })
  }

  // 批量设置类型
  const handleBatchSetType = (type: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要修改的字段')
      return
    }
    const newValue = [...value]
    selectedRowKeys.forEach((key) => {
      newValue[key as number].type = type as any
    })
    onChange?.(newValue)
    message.success(`已将 ${selectedRowKeys.length} 个字段设置为${fieldTypes.find(t => t.value === type)?.label}`)
  }

  // 批量设置必填
  const handleBatchSetRequired = (required: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要修改的字段')
      return
    }
    const newValue = [...value]
    selectedRowKeys.forEach((key) => {
      newValue[key as number].required = required
    })
    onChange?.(newValue)
    message.success(`已将 ${selectedRowKeys.length} 个字段设置为${required ? '必填' : '非必填'}`)
  }

  const handleSave = async () => {
    try {
      const fieldData = await form.validateFields()
      const newValue = [...value]
      
      if (editingIndex >= 0) {
        // 编辑
        newValue[editingIndex] = fieldData
        message.success('更新成功')
      } else {
        // 新增
        newValue.push(fieldData)
        message.success('添加成功')
      }
      
      onChange?.(newValue)
      setEditModalVisible(false)
    } catch (error) {
      console.error('字段验证失败:', error)
    }
  }

  const dataSource = value.map((field, index) => ({
    ...field,
    index,
    key: index,
  }))

  // 批量操作菜单
  const batchMenuItems: MenuProps['items'] = [
    {
      key: 'batch-type',
      label: '批量设置类型',
      children: fieldTypes.map((t) => ({
        key: `type-${t.value}`,
        label: t.label,
        onClick: () => handleBatchSetType(t.value),
      })),
    },
    {
      key: 'batch-required',
      label: '批量设置必填',
      children: [
        {
          key: 'required-true',
          label: '设为必填',
          onClick: () => handleBatchSetRequired(true),
        },
        {
          key: 'required-false',
          label: '设为非必填',
          onClick: () => handleBatchSetRequired(false),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'batch-delete',
      label: '批量删除',
      danger: true,
      onClick: handleBatchDelete,
    },
  ]

  // 行选择配置
  const rowSelection: TableRowSelection<FieldConfig & { index: number }> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd} style={{ flex: 1 }}>
          添加字段
        </Button>
        {selectedRowKeys.length > 0 && (
          <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
            <Button>
              批量操作 ({selectedRowKeys.length}) <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowSelection={rowSelection}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: '暂无字段，请点击上方按钮添加' }}
      />

      <Modal
        title={editingIndex >= 0 ? '编辑字段' : '添加字段'}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="字段名称"
            rules={[
              { required: true, message: '请输入字段名称' },
              { max: 50, message: '字段名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="例如：商品ID、商品标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="字段类型"
            rules={[{ required: true, message: '请选择字段类型' }]}
          >
            <Select options={fieldTypes} placeholder="请选择字段类型" />
          </Form.Item>

          <Form.Item name="required" label="是否必填" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="description" label="字段描述">
            <Input.TextArea rows={3} placeholder="字段的详细说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FieldConfigEditor

