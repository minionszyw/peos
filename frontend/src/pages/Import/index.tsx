/**
 * 数据导入页面
 */
import { useState, useEffect } from 'react'
import { Card, Select, Button, Table, message, Alert, Space, Tag, Modal } from 'antd'
import { UploadOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import FileUpload from '@/components/FileUpload'
import { uploadAndImport, getImportHistory, getImportTemplate } from '@/services/import'
import { ImportHistory, TableType } from '@/types/import'
import styles from './index.module.scss'

const Import = () => {
  const [tableType, setTableType] = useState<TableType>('warehouse_products')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [loading, setLoading] = useState(false)

  const tableTypeOptions = [
    { value: 'warehouse_products', label: '仓库商品' },
    { value: 'shop_products', label: '店铺商品' },
    { value: 'inventory', label: '库存数据' },
    { value: 'sales', label: '销售数据' },
  ]

  // 加载导入历史
  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await getImportHistory({ limit: 50 })
      setHistory(data)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) {
      message.warning('请先选择文件')
      return
    }

    try {
      setUploading(true)
      const result = await uploadAndImport(selectedFile, tableType)
      
      if (result.status === 'success') {
        message.success(`导入成功！共导入 ${result.success_rows} 条数据`)
      } else if (result.status === 'partial_success') {
        message.warning(`部分导入成功！成功 ${result.success_rows} 条，失败 ${result.error_count} 条`)
        if (result.errors.length > 0) {
          Modal.error({
            title: '导入错误详情',
            content: (
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {result.errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            ),
            width: 600,
          })
        }
      } else {
        message.error('导入失败')
        if (result.errors.length > 0) {
          Modal.error({
            title: '导入错误详情',
            content: (
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {result.errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            ),
            width: 600,
          })
        }
      }
      
      setSelectedFile(null)
      loadHistory()
    } catch (error) {
      console.error('上传失败:', error)
    } finally {
      setUploading(false)
    }
  }

  // 查看模板
  const handleViewTemplate = async () => {
    try {
      const template = await getImportTemplate(tableType)
      Modal.info({
        title: '导入模板说明',
        content: (
          <div>
            <p><strong>必填列：</strong></p>
            <ul>
              {template.columns.map((col: string) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
            <p><strong>示例数据：</strong></p>
            <p>{template.example.join(', ')}</p>
          </div>
        ),
        width: 500,
      })
    } catch (error) {
      console.error('获取模板失败:', error)
    }
  }

  const columns: ColumnsType<ImportHistory> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: '导入类型',
      dataIndex: 'table_type',
      key: 'table_type',
      width: 120,
      render: (type: string) => {
        const option = tableTypeOptions.find(opt => opt.value === type)
        return option?.label || type
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          success: { color: 'green', text: '成功' },
          partial_success: { color: 'orange', text: '部分成功' },
          failed: { color: 'red', text: '失败' },
          pending: { color: 'blue', text: '处理中' },
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: '总行数',
      dataIndex: 'total_rows',
      key: 'total_rows',
      width: 100,
    },
    {
      title: '成功行数',
      dataIndex: 'success_rows',
      key: 'success_rows',
      width: 100,
    },
    {
      title: '导入时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ]

  return (
    <div className={styles.import}>
      <Card title="数据导入" className={styles.uploadCard}>
        <Alert
          message="导入说明"
          description="请先选择导入类型，然后上传对应格式的Excel或CSV文件。支持的文件格式：.xlsx, .xls, .csv"
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          className={styles.alert}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className={styles.formItem}>
            <label>导入类型：</label>
            <Select
              value={tableType}
              onChange={setTableType}
              options={tableTypeOptions}
              style={{ width: 200 }}
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={handleViewTemplate}
              style={{ marginLeft: 16 }}
            >
              查看模板
            </Button>
          </div>

          <div className={styles.formItem}>
            <label>选择文件：</label>
            <FileUpload onFileSelect={setSelectedFile} />
            {selectedFile && (
              <span className={styles.fileName}>{selectedFile.name}</span>
            )}
          </div>

          <div className={styles.formItem}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={uploading}
              disabled={!selectedFile}
            >
              开始导入
            </Button>
          </div>
        </Space>
      </Card>

      <Card title="导入历史" className={styles.historyCard}>
        <Table
          columns={columns}
          dataSource={history}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}

export default Import

