/**
 * 模板编辑器 - 管理员编辑导入模板
 */
import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Space, Table, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface TemplateEditorProps {
  visible: boolean
  tableType: string
  onClose: () => void
  onSave: () => void
}

interface FieldMapping {
  key: string
  excel_column: string
  db_field: string
  required: boolean
  description: string
}

const TemplateEditor = ({ visible, tableType, onClose, onSave }: TemplateEditorProps) => {
  const [form] = Form.useForm()
  const [fields, setFields] = useState<FieldMapping[]>([])

  useEffect(() => {
    if (visible) {
      loadTemplate()
    }
  }, [visible, tableType])

  const loadTemplate = () => {
    // 默认模板配置
    const defaultTemplates: Record<string, FieldMapping[]> = {
      warehouse_products: [
        { key: '1', excel_column: 'SKU', db_field: 'sku', required: true, description: '商品SKU编码' },
        { key: '2', excel_column: '商品名称', db_field: 'name', required: true, description: '商品名称' },
        { key: '3', excel_column: '分类', db_field: 'category', required: false, description: '商品分类' },
        { key: '4', excel_column: '成本价', db_field: 'cost_price', required: false, description: '成本价格' },
        { key: '5', excel_column: '规格', db_field: 'spec', required: false, description: '商品规格' },
      ],
      shop_products: [
        { key: '1', excel_column: '店铺ID', db_field: 'shop_id', required: true, description: '店铺ID' },
        { key: '2', excel_column: 'SKU', db_field: 'warehouse_product_sku', required: true, description: '仓库商品SKU' },
        { key: '3', excel_column: '商品链接', db_field: 'product_url', required: false, description: '商品URL' },
        { key: '4', excel_column: '标题', db_field: 'title', required: true, description: '商品标题' },
        { key: '5', excel_column: '价格', db_field: 'price', required: true, description: '售价' },
        { key: '6', excel_column: '库存', db_field: 'stock', required: false, description: '库存数量' },
        { key: '7', excel_column: '状态', db_field: 'status', required: false, description: '商品状态' },
      ],
      inventory: [
        { key: '1', excel_column: 'SKU', db_field: 'warehouse_product_sku', required: true, description: '商品SKU' },
        { key: '2', excel_column: '数量', db_field: 'quantity', required: true, description: '库存数量' },
        { key: '3', excel_column: '仓库位置', db_field: 'warehouse_location', required: false, description: '仓库位置' },
      ],
      sales: [
        { key: '1', excel_column: '店铺ID', db_field: 'shop_id', required: true, description: '店铺ID' },
        { key: '2', excel_column: '商品ID', db_field: 'shop_product_id', required: true, description: '店铺商品ID' },
        { key: '3', excel_column: '订单号', db_field: 'order_id', required: true, description: '订单号' },
        { key: '4', excel_column: '数量', db_field: 'quantity', required: true, description: '销售数量' },
        { key: '5', excel_column: '金额', db_field: 'amount', required: true, description: '销售金额' },
        { key: '6', excel_column: '利润', db_field: 'profit', required: false, description: '利润' },
        { key: '7', excel_column: '销售日期', db_field: 'sale_date', required: true, description: '销售日期' },
      ],
    }

    setFields(defaultTemplates[tableType] || [])
  }

  const handleAddField = () => {
    const newField: FieldMapping = {
      key: Date.now().toString(),
      excel_column: '',
      db_field: '',
      required: false,
      description: '',
    }
    setFields([...fields, newField])
  }

  const handleDeleteField = (key: string) => {
    setFields(fields.filter((field) => field.key !== key))
  }

  const handleFieldChange = (key: string, field: string, value: any) => {
    setFields(
      fields.map((f) =>
        f.key === key ? { ...f, [field]: value } : f
      )
    )
  }

  const handleSave = () => {
    // TODO: 调用API保存模板配置
    console.log('保存模板:', { tableType, fields })
    message.success('模板配置已保存')
    onSave()
  }

  const columns: ColumnsType<FieldMapping> = [
    {
      title: 'Excel列名',
      dataIndex: 'excel_column',
      key: 'excel_column',
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) => handleFieldChange(record.key, 'excel_column', e.target.value)}
          placeholder="如：商品名称"
        />
      ),
    },
    {
      title: '数据库字段',
      dataIndex: 'db_field',
      key: 'db_field',
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) => handleFieldChange(record.key, 'db_field', e.target.value)}
          placeholder="如：name"
        />
      ),
    },
    {
      title: '是否必填',
      dataIndex: 'required',
      key: 'required',
      width: 100,
      render: (value, record) => (
        <Input
          type="checkbox"
          checked={value}
          onChange={(e) => handleFieldChange(record.key, 'required', e.target.checked)}
        />
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) => handleFieldChange(record.key, 'description', e.target.value)}
          placeholder="字段说明"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteField(record.key)}
        />
      ),
    },
  ]

  return (
    <Modal
      title={`编辑导入模板 - ${tableType}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      width={900}
    >
      <div style={{ marginBottom: 16 }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddField} block>
          添加字段
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={fields}
        rowKey="key"
        pagination={false}
        scroll={{ y: 400 }}
      />
      <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
        <p>说明：</p>
        <ul>
          <li>Excel列名：Excel文件中的列名（第一行标题）</li>
          <li>数据库字段：对应的数据库字段名</li>
          <li>是否必填：该字段是否必须填写</li>
        </ul>
      </div>
    </Modal>
  )
}

export default TemplateEditor

