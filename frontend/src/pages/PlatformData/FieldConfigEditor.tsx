/**
 * 字段配置编辑器组件
 */
import { useState } from 'react'
import { Table, Button, Form, Input, Select, Switch, Space, Modal, message } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FieldConfig } from '@/services/dataTable'

interface FieldConfigEditorProps {
  value?: FieldConfig[]
  onChange?: (value: FieldConfig[]) => void
}

const FieldConfigEditor = ({ value = [], onChange }: FieldConfigEditorProps) => {
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
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
    },
    {
      title: '字段类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeLabel = fieldTypes.find((t) => t.value === type)?.label
        return typeLabel || type
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
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
      width: 150,
      render: (_, record) => (
        <Space>
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd} block>
          添加字段
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
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

